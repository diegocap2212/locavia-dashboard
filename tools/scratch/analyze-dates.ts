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

let doneTotal = 0;
let doneWithResolved = 0;
let doneWithoutResolved = 0;
let doneWithoutResolvedButWithUpdated = 0;

const doneByStatus = {};

data.forEach((item) => {
  if (item.StatusCategory === 'DONE') {
    doneTotal++;
    const hasResolved = !!item.Resolved;
    const hasUpdated = !!item.UpdatedAt;
    
    if (hasResolved) {
      doneWithResolved++;
    } else {
      doneWithoutResolved++;
      if (hasUpdated) {
        doneWithoutResolvedButWithUpdated++;
      }
      
      const status = item.Status || 'UNKNOWN';
      doneByStatus[status] = (doneByStatus[status] || 0) + 1;
    }
  }
});

console.log(`Total DONE items: ${doneTotal}`);
console.log(`- With Resolved date: ${doneWithResolved}`);
console.log(`- Without Resolved date: ${doneWithoutResolved}`);
console.log(`  - Of which have UpdatedAt date: ${doneWithoutResolvedButWithUpdated}`);
console.log('\nStatuses of DONE items without Resolved date:');
Object.entries(doneByStatus).forEach(([status, count]) => {
  console.log(`- ${status}: ${count}`);
});

console.log('\nFirst 5 items without Resolved date:');
const sample = data.filter(item => item.StatusCategory === 'DONE' && !item.Resolved).slice(0, 5);
console.log(JSON.stringify(sample, null, 2));
