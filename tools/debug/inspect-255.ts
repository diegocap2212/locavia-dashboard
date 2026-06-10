import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src/data.json');
const jiraData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const bfCemReleases = new Set(['BAF', 'BAF-QW', 'CEM', 'CEM-R1', 'CEM-R2']);

const bfCemItems = jiraData.filter((i: any) => bfCemReleases.has(i.Release));

const statusExclusions = [
  '1. BACKLOG', 'BACKLOG', 'SPRINT BACKLOG', 'EM REFINAMENTO', 'REFINANDO', 
  'A REFINAR', 'SANEAMENTO', 'ESPERANDO', 'DESCARTADO', 'CANCELADO', 'NOGO',
];

const filtered = bfCemItems.filter(i => !statusExclusions.includes(String(i.Status).toUpperCase()));

console.log(`Total BF/CEM in Dash: ${filtered.length}`);
console.log('\nSample items:');
console.table(filtered.slice(0, 10).map(i => ({ Key: i.Key, Status: i.Status, Team: i.Team, Release: i.Release })));
