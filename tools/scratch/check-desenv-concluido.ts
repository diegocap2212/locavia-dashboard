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

const desenvConcluidoItems = data.filter(i => i.Status === 'DESENV CONCLUIDO');
console.log(`Total DESENV CONCLUIDO items: ${desenvConcluidoItems.length}`);

let hasResolved = 0;
let nullResolved = 0;

desenvConcluidoItems.forEach(i => {
  if (i.Resolved) hasResolved++;
  else nullResolved++;
});

console.log(`- Has Resolved: ${hasResolved}`);
console.log(`- Null Resolved: ${nullResolved}`);

console.log('\nSample of 5 DESENV CONCLUIDO items:');
console.log(JSON.stringify(desenvConcluidoItems.slice(0, 5), null, 2));
