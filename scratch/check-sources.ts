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

const sources = {};
const sourceByStatusCat = {};

data.forEach((item) => {
  const src = item.Source || 'UNKNOWN';
  sources[src] = (sources[src] || 0) + 1;
  
  const statusCat = item.StatusCategory || 'UNKNOWN';
  const key = `${src}_${statusCat}`;
  sourceByStatusCat[key] = (sourceByStatusCat[key] || 0) + 1;
});

console.log('--- Sources Count ---');
console.log(sources);

console.log('\n--- Sources by StatusCategory ---');
console.log(sourceByStatusCat);
