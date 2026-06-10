import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../src/data.json');

if (!fs.existsSync(dataPath)) {
  console.error('data.json not found');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

let minCreated = null;
let maxCreated = null;
let minResolved = null;
let maxResolved = null;

data.forEach((item) => {
  if (item.Created) {
    const c = new Date(item.Created);
    if (!minCreated || c < minCreated) minCreated = c;
    if (!maxCreated || c > maxCreated) maxCreated = c;
  }
  if (item.Resolved) {
    const r = new Date(item.Resolved);
    if (!minResolved || r < minResolved) minResolved = r;
    if (!maxResolved || r > maxResolved) maxResolved = r;
  }
});

console.log('--- Created Date Range ---');
console.log('Min Created:', minCreated ? minCreated.toISOString() : 'N/A');
console.log('Max Created:', maxCreated ? maxCreated.toISOString() : 'N/A');

console.log('\n--- Resolved Date Range ---');
console.log('Min Resolved:', minResolved ? minResolved.toISOString() : 'N/A');
console.log('Max Resolved:', maxResolved ? maxResolved.toISOString() : 'N/A');
