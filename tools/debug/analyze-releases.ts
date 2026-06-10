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
        let headerRowIdx = -1;
        for (let i = 0; i < 20; i++) {
            if (data[i] && data[i].some(c => String(c).includes('Chave') || String(c).includes('Status'))) {
                headerRowIdx = i;
                break;
            }
        }
        const headers = data[headerRowIdx];
        const keyIdx = headers.findIndex(c => String(c).includes('Chave') || String(c).includes('Key'));
        const releaseIdx = headers.findIndex(c => String(c).includes('Release') || String(c).includes('Fix Version'));
        
        const releases: Record<string, number> = {};
        for (let i = headerRowIdx + 1; i < data.length; i++) {
            const r = String(data[i][releaseIdx] || 'EMPTY').toUpperCase();
            releases[r] = (releases[r] || 0) + 1;
        }
        console.log('\nRelease Distribution in BASE CONE:');
        console.table(releases);
    }
}
