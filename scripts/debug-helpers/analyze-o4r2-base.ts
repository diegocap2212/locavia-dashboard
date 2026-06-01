import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
    const workbook = XLSX.read(fs.readFileSync(filePath));
    const sheetName = 'BASE CONE';
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
        console.log(`\n=== SHEET: ${sheetName} ===`);
        
        let headerRowIdx = -1;
        for (let i = 0; i < 20; i++) {
            if (data[i] && data[i].some(c => String(c).includes('Chave') || String(c).includes('Status'))) {
                headerRowIdx = i;
                break;
            }
        }
        
        if (headerRowIdx === -1) {
            console.log('Headers not found in first 20 rows.');
            process.exit(1);
        }

        const headers = data[headerRowIdx];
        const keyIdx = headers.findIndex(c => String(c).includes('Chave') || String(c).includes('Key'));
        const statusIdx = headers.findIndex(c => String(c).includes('Status'));
        const releaseIdx = headers.findIndex(c => String(c).includes('Release') || String(c).includes('Fix Version'));

        console.log(`Headers found at row ${headerRowIdx}: ${JSON.stringify(headers)}`);
        
        const issues = [];
        for (let i = headerRowIdx + 1; i < data.length; i++) {
            const row = data[i];
            if (!row[keyIdx]) continue;
            issues.push({
                Key: String(row[keyIdx]),
                Status: String(row[statusIdx] || '').toUpperCase(),
                Release: String(row[releaseIdx] || '').toUpperCase()
            });
        }

        console.log(`Total issues in BASE CONE: ${issues.length}`);
        
        const statusStats: Record<string, number> = {};
        issues.forEach(i => {
            statusStats[i.Status] = (statusStats[i.Status] || 0) + 1;
        });
        console.log('\nAll Status Distribution:');
        console.table(statusStats);
    }
}
