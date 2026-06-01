import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);
const workbook = XLSX.read(fs.readFileSync(filePath));
const sheet = workbook.Sheets['Cone da Release'];

console.log('Cell C4:', JSON.stringify(sheet['C4']));
console.log('Cell C3:', JSON.stringify(sheet['C3']));
console.log('Cell B4:', JSON.stringify(sheet['B4']));
