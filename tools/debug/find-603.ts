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
        const headers = data[0]; // Assuming row 0 now
        let headerRowIdx = -1;
        for (let i = 0; i < 20; i++) {
            if (data[i] && data[i].some(c => String(c).includes('Chave') || String(c).includes('Status'))) {
                headerRowIdx = i;
                break;
            }
        }
        const h = data[headerRowIdx];
        const keyIdx = h.findIndex(c => String(c).includes('Chave') || String(c).includes('Key'));
        const statusIdx = h.findIndex(c => String(c).includes('Status'));
        const releaseIdx = h.findIndex(c => String(c).includes('Release') || String(c).includes('Fix Version'));
        
        const issues = [];
        for (let i = headerRowIdx + 1; i < data.length; i++) {
            const row = data[i];
            if (!row[keyIdx]) continue;
            const rel = String(row[releaseIdx] || '').toUpperCase();
            if (rel === 'O4R1' || rel === 'O4R2' || rel === 'O4R3') {
                issues.push({
                    Key: String(row[keyIdx]),
                    Status: String(row[statusIdx] || '').toUpperCase(),
                    Release: rel
                });
            }
        }

        console.log(`Locavia Issues (O4R1-3): ${issues.length}`);
        
        const statusStats: Record<string, number> = {};
        issues.forEach(i => {
            statusStats[i.Status] = (statusStats[i.Status] || 0) + 1;
        });
        console.table(statusStats);
        
        // Sum excluding some statuses
        const excluded = ['DESCARTADO', '1. BACKLOG', 'BACKLOG', 'SPRINT BACKLOG', 'EM REFINAMENTO'];
        const included = issues.filter(i => !excluded.includes(i.Status));
        console.log(`Included (excluding ${excluded.join(', ')}): ${included.length}`);
        
        const included2 = issues.filter(i => !['DESCARTADO'].includes(i.Status));
        console.log(`Included (excluding ONLY DESCARTADO): ${included2.length}`);
    }
}
