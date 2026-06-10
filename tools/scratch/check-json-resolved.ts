import fs from 'fs';
import path from 'path';

const dataPath = path.resolve(process.cwd(), 'src/data.json');
if (!fs.existsSync(dataPath)) {
  console.error('src/data.json not found');
  process.exit(1);
}

const items = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let doneCount = 0;
let doneWithResolved = 0;
let doneWithResolvedNull = 0;

items.forEach((i: any) => {
  if (i.StatusCategory === 'DONE') {
    doneCount++;
    if (i.Resolved && i.Resolved !== 'null') {
      doneWithResolved++;
    } else {
      doneWithResolvedNull++;
    }
  }
});

console.log(`Total DONE items in JSON: ${doneCount}`);
console.log(`DONE items with Resolved populated: ${doneWithResolved}`);
console.log(`DONE items with Resolved null: ${doneWithResolvedNull}`);
