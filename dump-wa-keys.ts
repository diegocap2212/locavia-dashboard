import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('src/data.json', 'utf8'));

const waItems = data.filter((i: any) => i.Team === 'Atendimento WhatsApp');

console.table(waItems.map((i: any) => ({
    Key: i.Key,
    Status: i.Status,
    Release: i.Release,
    Category: i.StatusCategory
})).sort((a,b) => b.Key.localeCompare(a.Key)).slice(0, 50));
