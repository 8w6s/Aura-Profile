import fs from 'fs';
import path from 'path';
import os from 'os';

export function getConfigPath() {
    const isWin = process.platform === 'win32';
    const configDir = isWin
        ? path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'aura-profile')
        : path.join(os.homedir(), '.config', 'aura-profile');

    return path.join(configDir, 'config.json');
}

export function getConfig() {
    try {
        const configPath = getConfigPath();
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Failed to read aura-profile config:', e);
    }
    return null;
}

export function saveConfig(config: any) {
    const configPath = getConfigPath();
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

