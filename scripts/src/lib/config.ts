export default class Config {
    public readonly filename: string;
    public readonly filepath: string;
    public readonly config: Record<string, any> = {};

    constructor(public readonly id: string) {
        this.filename = `${id}.config.json`
        this.filepath = `${tiled.extensionsPath}\\${this.filename}`

        this.config = this.read();
        tiled.log(`[${this.id}->Config] Config loaded from ${this.filepath}`)
    }

    set(key: string, value: any): any {
        this.config[key] = value
        tiled.log(`[${this.id}->Config] Set config key "${key}" to "${value}"`)
        this.save()

        return value;
    }

    get(key: string): any {
        return this.config[key];
    }

    save(): void {
        const file = new TextFile(this.filepath, TextFile.ReadWrite)
        file.truncate();
        file.write(JSON.stringify(this.config, null, 4))
        file.commit()
        tiled.log(`[${this.id}->Config] Config saved to ${this.filepath}`)
    }

    read(): Record<string, any> {
        try {
            const file = new TextFile(this.filepath, TextFile.ReadOnly)
            const content = file.readAll()
            file.close()
            return JSON.parse(content);
        } catch (e) {
            tiled.log(`[${this.id}->Config] No config file found at ${this.filepath}, creating a new one.`)
            this.save(); // recreate
            return {};
        }
    }
}