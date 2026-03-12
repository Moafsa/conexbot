import fs from 'fs';
import path from 'path';

export function logToFile(msg: string, context = 'General') {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${context}] ${msg}\n`;
    try {
        const logPath = process.platform === 'win32' ? path.join(process.cwd(), 'debug-today.log') : '/tmp/debug-today.log';
        fs.appendFileSync(logPath, line);
    } catch (e) {
        console.error('Failed to log to file:', e);
    }
}
