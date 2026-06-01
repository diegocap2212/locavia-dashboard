import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);
const workbook = XLSX.read(fs.readFileSync(filePath));
const sheet = workbook.Sheets['Cone da Release'];

const cell = sheet['C15']; // Column C, Row 15 (which is index 14 "Semana 1", since Excel is 1-indexed)
console.log('Cell C15 formula/value:');
console.log(cell ? JSON.stringify(cell) : 'Cell not found');

// Let's also check D15, E15
console.log('Cell D15:', JSON.stringify(sheet['D15']));
console.log('Cell E15:', JSON.stringify(sheet['E15']));
