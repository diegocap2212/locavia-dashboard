import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
const filePath = path.join(process.cwd(), file);

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
}

const workbook = XLSX.read(fs.readFileSync(filePath));
const report: any[] = [];

workbook.SheetNames.forEach(sheetName => {
    // Process only team sheets or release sheets
    if (sheetName.includes('Visão') || sheetName.includes('Modelo') || sheetName.includes('CONE') || sheetName === 'Dominios') return;

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    let epicos = 0;
    let items = 0;

    // Search for "Quantidade de Épicos" and "Qtd de Story / Task / Bug / Spike"
    // Usually they are in the first 10 rows
    for (let i = 0; i < Math.min(data.length, 15); i++) {
        const row = data[i];
        if (!row) continue;
        
        row.forEach((cell, idx) => {
            if (typeof cell === 'string') {
                const val = cell.toLowerCase();
                if (val.includes('quantidade de épicos')) {
                    const nextVal = row[idx + 1] || data[i+1]?.[idx];
                    if (typeof nextVal === 'number') epicos = nextVal;
                }
                if (val.includes('story / tarefa / bug / spike') || val.includes('qtd de story') || val.includes('features')) {
                    const nextVal = row[idx + 1] || data[i+1]?.[idx];
                    if (typeof nextVal === 'number') items = nextVal;
                }
            }
        });
    }

    if (epicos > 0 || items > 0) {
        report.push({
            Sheet: sheetName,
            Epicos: epicos,
            Items: items
        });
    }
});

console.log('--- SPREADSHEET SUMMARY (MANUAL TOTALS) ---');
console.table(report);

fs.writeFileSync('scripts/spreadsheet_totals.json', JSON.stringify(report, null, 2));
