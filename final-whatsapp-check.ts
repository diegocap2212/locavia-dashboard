import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('src/data.json', 'utf8'));

const waDone = data.filter((i: any) => i.Team === 'Atendimento WhatsApp' && i.StatusCategory === 'DONE');

console.log(`Found ${waDone.length} DONE items for Atendimento WhatsApp`);
const releaseCounts: any = {};
waDone.forEach((i: any) => {
    releaseCounts[i.Release] = (releaseCounts[i.Release] || 0) + 1;
});
console.table(releaseCounts);
