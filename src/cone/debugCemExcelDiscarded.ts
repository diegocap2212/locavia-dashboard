import { loadItemsFromCemExcel } from './parseExcelData';

const items = loadItemsFromCemExcel();
const cemItems = items.filter(it => it.releases.includes('CEM-R1'));
const discardedBefore = cemItems.filter(it => 
  it.status.toUpperCase() === 'DESCARTADO' &&
  it.resolved != null && it.resolved < new Date('2025-12-01T00:00:00Z')
);

console.log(`Discarded in/before Week 1 (Total ${discardedBefore.length}):`);
discardedBefore.forEach(it => {
  console.log(`  Key: ${it.key}, Status: ${it.status}, Resolved: ${it.resolved?.toISOString()}, Releases: ${JSON.stringify(it.releases)}`);
});
