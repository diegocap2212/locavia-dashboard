import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'src/data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const targetTeams = ['COMPRAS', 'ESTOQUE', 'MULTAS', 'MANUTENÇÃO', 'RESSARCIMENTO', 'CONTRATOS'];

console.log('--- Analisando itens com times não agrupados no data.json ---');

targetTeams.forEach(team => {
  const items = data.filter((i: any) => i.Team === team);
  console.log(`\nTeam: ${team} (${items.length} itens)`);
  items.forEach((i: any) => {
    console.log(`  - ${i.Key} [${i.Status}] : ${i.Summary}`);
  });
});
