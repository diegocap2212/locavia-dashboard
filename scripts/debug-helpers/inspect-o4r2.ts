import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
    const workbook = XLSX.read(fs.readFileSync(filePath));
    const sheetName = 'RELEASE';
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        console.log(`\n=== SHEET: ${sheetName} ===`);
        // Find header row (usually the first row with "Chave" or "Status")
        let headerRowIdx = -1;
        for (let i = 0; i < 20; i++) {
            console.log(`Row ${i}: ${JSON.stringify(data[i])}`);
            if (data[i] && data[i].some(c => String(c).includes('Chave') || String(c).includes('Status'))) {
                headerRowIdx = i;
                break;
            }
        }
        console.log(`Header Row Index: ${headerRowIdx}`);
        console.log(`Headers: ${JSON.stringify(data[headerRowIdx])}`);
        console.log(`Sample Row: ${JSON.stringify(data[headerRowIdx + 1])}`);
        
        // Distribution of Statuses in column 5 (if it's Status)
        const statusIdx = data[headerRowIdx].findIndex(c => String(c).includes('Status'));
        if (statusIdx !== -1) {
            const stats: Record<string, number> = {};
            for (let i = headerRowIdx + 1; i < data.length; i++) {
                const s = String(data[i][statusIdx] || 'EMPTY').toUpperCase();
                stats[s] = (stats[s] || 0) + 1;
            }
            console.log('\nStatus Distribution in Spreadsheet:');
            console.table(stats);
        }
    } else {
        console.log(`Sheet ${sheetName} not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }
} else {
    console.log(`File not found: ${file}`);
}
