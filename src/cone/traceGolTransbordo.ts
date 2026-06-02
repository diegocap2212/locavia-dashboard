import { computeCone, ConeParams } from './computeCone';
import { loadItemsFromGolExcel } from './parseExcelData';
import goldenGOL from './fixtures/golden_GOL-O4R2.json';

const items = loadItemsFromGolExcel();
const paramsGOL: ConeParams = {
  generation: 'gen1',
  release: 'O4R2',
  team: 'Portal de Vendas Assistidas',
  startDate: new Date('2025-10-06T00:00:00Z'),
  targetDate: new Date('2026-04-27T00:00:00Z'),
  stepDays: 7,
  requiredVelocity: 8,
  percentileWindow: 8,
  dataRef: new Date('2026-06-02T12:00:00Z'), // Use 2026-06-02 to cover all weeks
};

const result = computeCone(items, paramsGOL);

console.log('Week | Date | G (Plan) | H (NonPlan) | I (Bugs) | J (Resolved) | K (Discarded) | App F (Transbordo) | Excel F | Match?');
console.log('--------------------------------------------------------------------------------------------------------------------');

goldenGOL.weeks.forEach((gw, idx) => {
  const aw = result.weeks[idx];
  if (!aw) return;
  const match = gw.F === aw.transbordo;
  console.log(`${String(idx+1).padStart(4)} | ${gw.week} | ${aw.planejados} | ${aw.naoPlanejados} | ${aw.bugs} | ${aw.concluido} | ${aw.descartados} | ${aw.transbordo} | ${gw.F} | ${match ? 'YES' : 'NO'}`);
});
