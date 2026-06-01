import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
    const workbook = XLSX.read(fs.readFileSync(filePath));
    const sheetName = '_Locavia_ BASE CONE 2 (Jira)';
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
        const h = data[headerRowIdx];
        const keyIdx = h.findIndex(c => String(c).includes('Chave') || String(c).includes('Key'));
        const statusIdx = h.findIndex(c => String(c).includes('Status'));
        const releaseIdx = h.findIndex(c => String(c).includes('Release') || String(c).includes('Fix Version'));
        
        const bfCemReleases = ['BAF', 'BAF-QW', 'CEM', 'CEM-R1', 'CEM-R2'];
        const issues = [];
        for (let i = headerRowIdx + 1; i < data.length; i++) {
            const row = data[i];
            if (!row[keyIdx]) continue;
            const rel = String(row[releaseIdx] || '').toUpperCase();
            if (bfCemReleases.some(r => rel.includes(r))) {
                issues.push({
                    Key: String(row[keyIdx]),
                    Status: String(row[statusIdx] || '').toUpperCase(),
                    Release: rel
                });
            }
        }

        console.log(`BF/CEM Issues: ${issues.length}`);
        
        const statusStats: Record<string, number> = {};
        issues.forEach(i => {
            statusStats[i.Status] = (statusStats[i.Status] || 0) + 1;
        });
        console.table(statusStats);
        
        // Try to match 199
        const excluded = ['1. BACKLOG', 'BACKLOG', 'SPRINT BACKLOG', 'DESCARTADO', 'CANCELADO'];
        const included = issues.filter(i => !excluded.includes(i.Status));
        console.log(`Included (excluding ${excluded.join(', ')}): ${included.length}`);
    }
}
