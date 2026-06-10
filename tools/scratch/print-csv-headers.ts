import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.join(__dirname, '../base_cone.csv');

if (!fs.existsSync(csvPath)) {
  console.error('base_cone.csv not found');
  process.exit(1);
}

const content = fs.readFileSync(csvPath, 'latin1');
const firstLine = content.split('\n')[0];
console.log('CSV Headers:');
console.log(firstLine);
