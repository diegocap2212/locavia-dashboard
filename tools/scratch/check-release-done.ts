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

const releaseStats = {};

data.forEach((item) => {
  const rel = item.Release || 'UNKNOWN';
  const cat = item.StatusCategory || 'UNKNOWN';
  
  if (!releaseStats[rel]) {
    releaseStats[rel] = { total: 0, DONE: 0, IN_PROGRESS: 0, TODO: 0 };
  }
  releaseStats[rel].total++;
  releaseStats[rel][cat] = (releaseStats[rel][cat] || 0) + 1;
});

console.log('--- Release Statistics (Total vs DONE) ---');
Object.keys(releaseStats).sort().forEach((rel) => {
  const stats = releaseStats[rel];
  console.log(`- Release: ${rel}`);
  console.log(`  Total: ${stats.total}`);
  console.log(`  DONE: ${stats.DONE}`);
  console.log(`  IN_PROGRESS: ${stats.IN_PROGRESS}`);
  console.log(`  TODO: ${stats.TODO}`);
});
