import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
const filePath = path.join(process.cwd(), file);
const workbook = XLSX.read(fs.readFileSync(filePath));

['CONE', 'MATRIZ ESCOPO', 'BASE CONE'].forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    console.log(`\n=== SHEET: ${sheetName} ===`);
    console.log(`Rows: ${data.length}`);
    let headersRow = -1;
    for (let i = 0; i < 20; i++) {
        if (data[i] && data[i].some(c => String(c).includes('Chave') || String(c).includes('Status'))) {
            headersRow = i;
            break;
        }
    }
    if (headersRow !== -1) {
        console.log(`Headers found at row ${headersRow}: ${JSON.stringify(data[headersRow].slice(0, 8))}`);
    } else {
        console.log('No headers found.');
    }
});
