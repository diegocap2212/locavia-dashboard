import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data.json');

const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const item = raw.find((it: any) => it.Key === 'RM-4178');
console.log('RM-4178 in data.json:', item);
