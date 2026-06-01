import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src/data.json');
const jiraData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const LOCAVIA_EXCLUDED_STATUSES = ['DESCARTADO', 'CANCELADO', 'NOGO'];
const BF_CEM_EXCLUDED_STATUSES = [
  '1. BACKLOG', 'BACKLOG', 'SPRINT BACKLOG', 'EM REFINAMENTO', 'REFINANDO', 
  'A REFINAR', 'SANEAMENTO', 'ESPERANDO', 'DESCARTADO', 'CANCELADO', 'NOGO',
  'PRIORIZADO', 'PRONTO PRA DESENVOLVER', 'PRONTO PARA DESENVOLVER', 'NOVAS ATIVIDADES',
];

const LOCAVIA_RELEASES = new Set(['O4R1', 'O4R2']);
const BF_CEM_RELEASES = new Set(['BAF', 'BAF-QW', 'CEM', 'CEM-R1', 'CEM-R2']);

function isIncluded(item: any, coneType: 'locavia' | 'bf-cem') {
    const excluded = coneType === 'locavia' ? LOCAVIA_EXCLUDED_STATUSES : BF_CEM_EXCLUDED_STATUSES;
    return !excluded.includes(String(item.Status).toUpperCase());
}

const locaviaItems = jiraData.filter((i: any) => LOCAVIA_RELEASES.has(i.Release) && isIncluded(i, 'locavia'));
const bfcemItems = jiraData.filter((i: any) => BF_CEM_RELEASES.has(i.Release) && isIncluded(i, 'bf-cem'));

console.log('--- NEW DASHBOARD TOTALS ---');
console.log(`Locavia (O4R1-3): ${locaviaItems.length}`);
console.log(`BF / CEM: ${bfcemItems.length}`);
