import { loadItemsFromCemExcel } from './parseExcelData';

const items = loadItemsFromCemExcel();
const cemItems = items.filter(it => it.releases.includes('CEM-R1'));

const weekStart = new Date('2026-05-25T00:00:00Z');
const weekEnd = new Date('2026-06-01T00:00:00Z');

const isBug = (it: any) => it.type.toUpperCase() === 'BUG';

const novosInWeek = cemItems.filter(it => 
  !isBug(it) &&
  it.created >= weekStart && it.created < weekEnd
);

console.log(`Novos items in week of 2026-05-25 (Total ${novosInWeek.length}):`);
novosInWeek.forEach(it => {
  console.log(`  Key: ${it.key}, Created: ${it.created.toISOString()}, Type: ${it.type}`);
});
