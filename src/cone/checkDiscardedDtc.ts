import { loadItemsFromGolExcel } from './parseExcelData';

const items = loadItemsFromGolExcel();
const scoped = items.filter(it => it.releases.includes('O4R2') && it.team === 'Portal de Vendas Assistidas');

const discarded = scoped.filter(it => it.status.toUpperCase() === 'DESCARTADO');

console.log('Discarded items with DTC or Resolved around Dec 2025/Jan 2026:');
discarded.forEach(it => {
  console.log(`  Key: ${it.key}, DTC: ${it.committed?.toISOString().slice(0, 10)}, Resolved: ${it.resolved?.toISOString().slice(0, 10)}`);
});
