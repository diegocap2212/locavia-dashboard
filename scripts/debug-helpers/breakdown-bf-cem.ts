import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src/data.json');
const jiraData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const CONE_EXCLUDED_STATUSES = [
  '1. BACKLOG', 'BACKLOG', 'SPRINT BACKLOG', 'EM REFINAMENTO', 'REFINANDO', 
  'A REFINAR', 'SANEAMENTO', 'ESPERANDO', 'DESCARTADO', 'CANCELADO', 'NOGO',
];

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

const bfcemItems = jiraData.filter((i: any) => 
    (BF_CEM_RELEASES.has(i.Release) || (i.Release === 'OUTROS' && BF_CEM_JORNADA_TEAMS.has(i.Team))) && isIncluded(i)
);

const releaseStats: Record<string, number> = {};
const teamStats: Record<string, number> = {};

bfcemItems.forEach((i: any) => {
    releaseStats[i.Release] = (releaseStats[i.Release] || 0) + 1;
    teamStats[i.Team] = (teamStats[i.Team] || 0) + 1;
});

console.log('--- BF / CEM BREAKDOWN ---');
console.log('\nBy Release:');
console.table(releaseStats);
console.log('\nBy Team:');
console.table(teamStats);
