import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

// Load src/data.json
const dataPath = path.join(process.cwd(), 'src/data.json');
const jiraData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Filter logic similar to useDashboardData.ts
const CONE_EXCLUDED_STATUSES = [
  '1. BACKLOG', 'BACKLOG', 'SPRINT BACKLOG', 'EM REFINAMENTO', 'REFINANDO', 
  'A REFINAR', 'SANEAMENTO', 'ESPERANDO', 'DESCARTADO', 'CANCELADO', 'NOGO',
];

const LOCAVIA_RELEASES = new Set(['O4R1', 'O4R2', 'O4R3']);
const BF_CEM_RELEASES = new Set(['BAF', 'BAF-QW', 'CEM', 'CEM-R1', 'CEM-R2']);
const BF_CEM_JORNADA_TEAMS = new Set([
  'Compras e Estoque', 'Mobilização', 'Relatórios de BI', 'Construção do Data Lake',
]);

function normalizeStatus(s: string) {
    return String(s || '').toUpperCase();
}

function isIncluded(item: any) {
    return !CONE_EXCLUDED_STATUSES.includes(normalizeStatus(item.Status));
}

// Calculate Dashboard Totals
const locaviaItems = jiraData.filter((i: any) => LOCAVIA_RELEASES.has(i.Release) && isIncluded(i));
const bfcemItems = jiraData.filter((i: any) => 
    (BF_CEM_RELEASES.has(i.Release) || (i.Release === 'OUTROS' && BF_CEM_JORNADA_TEAMS.has(i.Team))) && isIncluded(i)
);

console.log('--- DASHBOARD TOTALS (Active Scope) ---');
console.log(`Locavia (O4R1/R2/R3): ${locaviaItems.length}`);
console.log(`BF / CEM: ${bfcemItems.length}`);

// Extract Spreadsheet Totals
function getSpreadsheetTotals(filename: string) {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) return null;
    
    const workbook = XLSX.read(fs.readFileSync(filePath));
    const totals: any[] = [];
    
    workbook.SheetNames.forEach(sheetName => {
        if (sheetName.includes('Visão') || sheetName.includes('Modelo') || sheetName.includes('CONE') || sheetName === 'Dominios') return;

        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

        let epicos = 0;
        let items = 0;

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
                    if (val.includes('story / tarefa / bug / spike') || val.includes('qtd de story') || val.includes('features') || val.includes('story / task / bug / spike')) {
                        const nextVal = row[idx + 1] || data[i+1]?.[idx];
                        if (typeof nextVal === 'number') items = nextVal;
                    }
                }
            });
        }

        if (items > 0) {
            totals.push({ Sheet: sheetName, Items: items });
        }
    });
    return totals;
}

console.log('\n--- SPREADSHEET: BAF / CEM ---');
const bfcemTotals = getSpreadsheetTotals('Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');
if (bfcemTotals) console.table(bfcemTotals);

console.log('\n--- SPREADSHEET: O4R2 ---');
const o4r2Totals = getSpreadsheetTotals('Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx');
if (o4r2Totals) console.table(o4r2Totals);
