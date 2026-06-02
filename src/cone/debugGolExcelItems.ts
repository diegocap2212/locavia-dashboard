import { loadItemsFromGolExcel } from './parseExcelData';

const items = loadItemsFromGolExcel();
console.log(`Total items parsed: ${items.length}`);

// Filter by release O4R2 and team PVA
const scoped = items.filter(it => {
  const matchesRelease = it.releases.includes('O4R2');
  const matchesTeam = it.team === 'Portal de Vendas Assistidas';
  return matchesRelease && matchesTeam;
});

console.log(`Scoped items matching O4R2 and Portal de Vendas Assistidas: ${scoped.length}`);
if (scoped.length > 0) {
  console.log('Sample item:', scoped[0]);
} else {
  // Let's print unique releases and teams found
  const releases = new Set<string>();
  const teams = new Set<string>();
  items.forEach(it => {
    it.releases.forEach(r => releases.add(r));
    if (it.team) teams.add(it.team);
  });
  console.log('Releases found in Excel:', Array.from(releases));
  console.log('Teams found in Excel:', Array.from(teams));
}
