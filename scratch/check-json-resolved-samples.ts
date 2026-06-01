import fs from 'fs';
import path from 'path';

const dataPath = path.resolve(process.cwd(), 'src/data.json');
if (!fs.existsSync(dataPath)) {
  console.error('src/data.json not found');
  process.exit(1);
}

const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const doneItems = items.filter((i: any) => i.StatusCategory === 'DONE');

console.log('Samples of DONE items in JSON:');
const samples = doneItems.slice(0, 15).map((i: any) => ({
  Key: i.Key,
  Status: i.Status,
  Created: i.Created,
  Resolved: i.Resolved,
  UpdatedAt: i.UpdatedAt
}));
console.table(samples);
