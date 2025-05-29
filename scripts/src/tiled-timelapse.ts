import Config from "./lib/config";
import { extractARGB, isTileMap, lastElement, md5, padStart } from "./lib/utils";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import { PNG } from "pngjs";
import ndarray from "ndarray";

const config = new Config("tiled-timelapse");

if (!config.get('maps')) config.set('maps', {});

const getWorkingDirectory = () => {
    if (!config.get('working-directory')) {
        const dir = tiled.promptDirectory(`${tiled.extensionsPath}/tiled-timelapse`, "tiled-timelapse: Select directory for images");
        if (dir) {
            config.set('working-directory', dir);
            tiled.log(`[tiled-timelapse] Working directory set to: ${dir}`);
            return dir;
        } else {
            tiled.log("[tiled-timelapse] No directory selected, exiting.");
            return;
        }
    }

    return config.get('working-directory');
}

// const getPixels = (buffer: ArrayBuffer): any => {
//     // var png = new PNG();
//     // // based on https://github.com/scijs/get-pixels/blob/master/node-pixels.js#L14 - MIT License
//     // png.parse(Buffer.from(buffer), function(err, img_data) {
//     //     if(err) {
//     //         tiled.log(`[tiled-timelapse] Error parsing PNG: ${err}`);
//     //         return
//     //     }
//     //     tiled.log(JSON.stringify(
//     //         [null, 
//     //             ndarray(
//     //                 new Uint8Array(img_data.data),
//     //                 [img_data.width|0, img_data.height|0, 4],
//     //                 [4, 4*img_data.width|0, 1],
//     //                 0
//     //             )
//     //         ], null, 4
//     //     ));
    
//     // })
// }

getWorkingDirectory(); // confirm it is set at the start

tiled.assetSaved.connect((asset: Asset) => {
    const workingDirectory = getWorkingDirectory();
    // tiled.log(asset.fileName)
    
    if (!isTileMap(asset)) return; // discard non-map assets & ensure type is TileMap
    const mapFilename = lastElement(asset.fileName.split('/'))?.toString() || ''
    const mapKey = mapFilename + md5(asset.fileName)

    const img = asset.toImage()

    let increment = config.get('increment') || 0;
    const exportFilename = `${mapFilename}-${padStart(increment.toString(), 4)}.png`;
    const exportFilepath = `${workingDirectory}\\${exportFilename}`
    config.set('increment', ++increment);

    const succeeded = img.save(exportFilepath);

    const width = img.width;
    const height = img.height;
    let pixels = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pixel = img.pixel(x, y); // 32 bit unsigned integer ARGB
            const { a, r, g, b } = extractARGB(pixel);
            pixels.push(r, g, b, a);
            
        }
    }

    const jsonPath = exportFilepath.replace(/\.png$/, '.json');
    const json = new TextFile(jsonPath, TextFile.WriteOnly);
    json.write(JSON.stringify({
        width: width,
        height: height,
        pixels: pixels
    }, null, 4));
    json.commit();

    const configMapEntry = config.get('maps')[mapKey] || config.set('maps', { 
        ...config.get('maps'), 
        [mapKey]: {
            workingDirectory: workingDirectory,
            files: []
        }
    })[mapKey];

    config.set('maps', {
        ...config.get('maps'),
        [mapKey]: {
            ...configMapEntry,
            files: [...configMapEntry.files, jsonPath]
        }
    });

    tiled.log(`[tiled-timelapse] ${succeeded ? 'Exported' : 'Failed to export'} image for ${asset.fileName} to ${exportFilename} (increment: ${increment})`);
    tiled.log(`[tiled-timelapse] Working directory: ${workingDirectory}, increment: ${increment}, export filename: ${exportFilename}, asset file name: ${mapFilename}`);
}) 

const exportAction = tiled.registerAction('ExportTimelapseGif', (action) => {
    const savePath = tiled.promptSaveFile(getWorkingDirectory(), 'GIF files (*.gif)', 'tiled-timelapse: Export Timelapse GIF');

    if (!savePath) return tiled.log("[tiled-timelapse] No save path selected, exiting.")

    const dialog = new Dialog('Export Timelapse GIF')

    // dialog.addButton('asf').text = 'hi 1';
    
    const frameDelayInput = dialog.addNumberInput('Frame Length')
    frameDelayInput.decimals = 0 // integer values
    frameDelayInput.minimum = 50
    frameDelayInput.maximum = 2000
    frameDelayInput.value = 200 // default frame delay in ms
    frameDelayInput.singleStep = 10
    frameDelayInput.suffix = ' ms'
    
    const colourDepthDropDownOptions = [
        'rgb4444 (low quality, transparency)',
        'rgb565 (medium quality, no transparency)',
        'rgb8888 (high quality, transparency)',
        'rgb888 (high quality, no transparency)'
    ]
    const colourDepthDropDown = dialog.addComboBox('Colours/Quality', colourDepthDropDownOptions)

    const maxColoursOptions = [
        128, 256, 512, 1024
    ]
    const maxColoursDropDown = dialog.addComboBox('Max Colours', maxColoursOptions.map((c) => c.toString()));
    maxColoursDropDown.currentIndex = 2; // default to 512 colours

    // dialog.addButton('asf').text = 'hi'

    dialog.addNewRow();
    
    
    dialog.addButton('Cancel').clicked.connect(() => {
        dialog.reject()
    })
    dialog.addButton('Export').clicked.connect(() => {
        dialog.accept()
    });

    dialog.accepted.connect(() => {
        tiled.log(`[tiled-timelapse] dialog accepted!`);
    })

    dialog.rejected.connect(() => {
        tiled.log(`[tiled-timelapse] dialog rejected!`);
    })

    dialog.finished.connect((result: number /* 0 = rejecte,d 1 = accepted*/) => {
        tiled.log(`[tiled-timelapse] dialog finished with result: ${result} (${result === 0 ? 'rejected' : 'accepted'})`);
        tiled.log(`[tiled-timelapse] frame delay: ${frameDelayInput.value} ms`);
        tiled.log(`[tiled-timelapse] colour depth/quality: ${colourDepthDropDown.currentIndex} (${colourDepthDropDownOptions[colourDepthDropDown.currentIndex]})`);
        tiled.log(`[tiled-timelapse] max colours: ${maxColoursDropDown.currentIndex} (${maxColoursOptions[maxColoursDropDown.currentIndex]})`);
        if (result == 0) return;

        const activeAsset = tiled.activeAsset;
        if (!activeAsset || !isTileMap(activeAsset)) return tiled.alert("Active asset is not a TileMap.", 'tiled-timelapse: Export Timelapse GIF');

        const configMapEntry = config.get('maps')[(lastElement(activeAsset.fileName.split('/'))?.toString() || '') + md5(activeAsset.fileName)] || null;
        if (!configMapEntry) return tiled.alert("No saved images found for this map. Please save the map first.", 'tiled-timelapse: Export Timelapse GIF');

        if (!configMapEntry.files || configMapEntry.files.length === 0) return tiled.alert("No saved images found for this map. Please save the map first.", 'tiled-timelapse: Export Timelapse GIF');
        if (!savePath) return tiled.alert("No save path selected.", 'tiled-timelapse: Export Timelapse GIF');
        
        const files = configMapEntry.files;
        tiled.log(`[tiled-timelapse] Exporting GIF with ${files.length} images from ${configMapEntry.workingDirectory}`);
        // const images: { data: number[], width: number, height: number }[] = files.map((path: string) => {
        //     // const bin = new BinaryFile(path, BinaryFile.ReadOnly);
        //     // const arrayBuffer = bin.readAll();
        //     // bin.close();
            
        //     // const pixels = getPixels(arrayBuffer);
        //     const img = new Image(path, 'png');
            
        //     // format we want is data, width and height. data is a flat array that's [r, g, b, a, r, g, b, a, ...]
        //     const width = img.width
        //     const height = img.height;
        //     let pixels = [];
            
            

        //     return {
        //         data: pixels,
        //         width: width,
        //         height: height
        //     };
        // })
        const images: { data: number[], width: number, height: number }[] = files.map((path: string) => {
            tiled.log(`[tiled-timelapse] Reading image data from ${path}`);
            const json = new TextFile(path, TextFile.ReadOnly);
            const content = json.readAll();
            json.close();
            const data = JSON.parse(content);
            if (!data || !data.pixels || !data.width || !data.height) {
                tiled.log(`[tiled-timelapse] Invalid JSON data in ${path}`);
                return null;
            }

            return {
                data: data.pixels,
                width: data.width,
                height: data.height
            }

            // return data as { data: number[], width: number, height: number };
        }).filter((img: any) => img !== null && img.data && img.width && img.height);

        const gif = new GIFEncoder();

        for (const img of images) {
            tiled.log(`[tiled-timelapse] Processing image with dimensions ${img.width}x${img.height}`);
            if (!img) continue; 
            const format = colourDepthDropDownOptions[colourDepthDropDown.currentIndex].split(' ')[0];
            const palette = quantize(new Uint8Array(img.data), maxColoursOptions[maxColoursDropDown.currentIndex], { format });
            const index = applyPalette(new Uint8Array(img.data), palette, format);

            gif.writeFrame(index, img.width, img.height, { 
                palette,
                delay: frameDelayInput.value,
                repeat: 0, // forever


            });
        }

        gif.finish();
        tiled.log(`[tiled-timelapse] GIF encoding finished, writing to ${savePath}`);
        const bytes: Uint8Array = gif.bytes();
        

        const output = new BinaryFile(savePath, BinaryFile.WriteOnly);
        output.write(bytes.buffer);
        output.commit();  
    })

    dialog.exec();

})

exportAction.text = 'Export Timelapse GIF';

tiled.extendMenu("File", [{ action: `ExportTimelapseGif` }]);