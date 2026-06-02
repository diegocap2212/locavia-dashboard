import fs from 'fs';

const data = JSON.parse(fs.readFileSync('src/data.json', 'utf8'));

const golItems = data.filter((item: any) => item.Release === 'O4R2' && item.Team === 'Portal de Vendas Assistidas');

const inWeek = golItems.filter((item: any) => {
  if (!item.Resolved) return false;
  const resDate = new Date(item.Resolved);
  return resDate >= new Date('2025-11-03T00:00:00Z') && resDate < new Date('2025-11-10T00:00:00Z');
});

console.log(`Resolved GOL O4R2 in week 2025-11-03: ${inWeek.length}`);
inWeek.forEach((item: any) => {
  console.log(`- ${item.Key}: Resolved at ${item.Resolved}, Status: ${item.Status}`);
});
