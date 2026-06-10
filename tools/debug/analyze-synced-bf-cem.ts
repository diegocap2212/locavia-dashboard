import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src/data.json');
const jiraData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const BF_CEM_RELEASES = new Set(['BAF', 'BAF-QW', 'CEM', 'CEM-R1', 'CEM-R2']);

const bfCemItems = jiraData.filter((i: any) => BF_CEM_RELEASES.has(i.Release));

console.log(`Total synced BF/CEM issues: ${bfCemItems.length}`);

const statusStats: Record<string, number> = {};
bfCemItems.forEach(i => {
    statusStats[i.Status] = (statusStats[i.Status] || 0) + 1;
});
console.table(statusStats);

// Try to match 199
const excluded = ['1. BACKLOG', 'BACKLOG', 'SPRINT BACKLOG', 'EM REFINAMENTO', 'REFINANDO', 'A REFINAR', 'SANEAMENTO', 'DESCARTADO', 'CANCELADO'];
const included = bfCemItems.filter(i => !excluded.includes(i.Status.toUpperCase()));
console.log(`Included (excluding ${excluded.join(', ')}): ${included.length}`);
