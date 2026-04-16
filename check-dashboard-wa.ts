import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('src/data.json', 'utf8'));

const waO4R2 = data.filter((i: any) => i.Team === 'Atendimento WhatsApp' && i.Release === 'O4R2');

console.log(`Found ${waO4R2.length} items for Atendimento WhatsApp | O4R2 in data.json`);
waO4R2.forEach((i: any) => {
    console.log(`Key: ${i.Key} | Status: ${i.Status} | Cat: ${i.StatusCategory}`);
});
