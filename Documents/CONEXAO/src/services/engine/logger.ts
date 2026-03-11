import fs from 'fs';
import path from 'path';

export function logToFile(msg: string, context = 'General') {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${context}] ${msg}\n`;
    try {
        fs.appendFileSync(path.join(process.cwd(), 'debug-today.log'), line);
    } catch (e) {
        console.error('Failed to log to file:', e);
    }
}
