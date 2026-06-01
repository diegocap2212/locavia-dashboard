import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
    const workbook = XLSX.read(fs.readFileSync(filePath));
    const sheetName = 'OPTIMUS O4R2';
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        console.log(`\n--- ${sheetName} ---`);
        data.slice(10, 40).forEach((row, i) => {
            console.log(`Row ${i+10}: ${JSON.stringify(row)}`);
        });
    }
}
