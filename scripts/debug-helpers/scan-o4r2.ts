import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
    const workbook = XLSX.read(fs.readFileSync(filePath));
    console.log(`Sheets: ${workbook.SheetNames.join(', ')}`);
    
    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        console.log(`\n--- ${sheetName} (first 5 rows) ---`);
        data.slice(0, 5).forEach((row, i) => {
            console.log(`Row ${i}: ${JSON.stringify(row)}`);
        });
    });
}
