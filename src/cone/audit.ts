// audit.ts
// Harness de auditoria Excel-vs-App.
// Roda computeCone com a MESMA data_ref do print do Excel e compara célula-a-célula.
// Gera a tabela lado-a-lado que vende a paridade para a diretoria.
//
// Uso:
//   npx tsx src/cone/audit.ts
//
// IMPORTANTE: data_ref = data em que AQUELE Excel foi recalculado. Sem isso nada bate.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeCone, ConeItem, ConeParams, ConeWeek, Generation } from './computeCone';
import goldenCEM from './fixtures/golden_CEM-R1.json';
import goldenGOL from './fixtures/golden_GOL-O4R2.json';
import { loadItemsFromCemExcel, loadItemsFromGolExcel } from './parseExcelData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data.json');

// ---- Estrutura da fixture (valores-ouro extraídos da planilha) ----
interface GoldenWeek {
  week: string; // YYYY-MM-DD
  C: number | null; D: number | null; E: number | null;
  F: number | null; G: number | null; H: number | null; I: number | null;
  J: number | null; K: number | null;
  L?: number | null; M?: number | null; N?: number | null;
}
interface Golden {
  label: string;
  generation: string;
  params: { C2: string; C3: string; C4: number; C5: string; C6: string;
            C7: number; C8: number; C9: number; C10: number };
  weeks: GoldenWeek[];
}

// Colunas comparadas e como extrair do resultado do motor
const COLS: { col: keyof GoldenWeek; pick: (w: ConeWeek) => number | null }[] = [
  { col: 'C', pick: w => w.melhor },
  { col: 'D', pick: w => w.pior },
  { col: 'E', pick: w => w.necessaria },
  { col: 'F', pick: w => w.transbordo },
  { col: 'G', pick: w => w.planejados },
  { col: 'H', pick: w => w.naoPlanejados },
  { col: 'I', pick: w => w.bugs },
  { col: 'J', pick: w => w.concluido },
  { col: 'K', pick: w => w.descartados },
  { col: 'L', pick: w => w.novos },
  { col: 'M', pick: w => w.saldo },
  { col: 'N', pick: w => w.impedidos },
];

export interface AuditReport {
  label: string;
  totalCells: number;
  matched: number;
  parityPct: number;
  diffs: { week: string; col: string; excel: number | null; app: number | null }[];
}

export function auditCone(items: ConeItem[], params: ConeParams, golden: Golden): AuditReport {
  const result = computeCone(items, params);
  const byWeek = new Map(result.weeks.map(w => [iso(w.week), w]));
  const diffs: AuditReport['diffs'] = [];
  let total = 0, matched = 0;

  for (const gw of golden.weeks) {
    const aw = byWeek.get(gw.week);
    for (const { col, pick } of COLS) {
      if (!(col in gw)) continue;        // K8 da fixture pode não ter L/M/N (gen1)
      const excel = gw[col] ?? null;
      if (excel === null) continue;      // Ignora células com erro #REF! ou semanas futuras vazias no Excel
      const app = aw ? pick(aw) : null;
      total++;
      if (eqCell(excel, app)) {
        matched++;
      } else {
        diffs.push({ week: gw.week, col, excel, app });
      }
    }
  }
  return { label: golden.label, totalCells: total, matched,
           parityPct: total ? +(100 * matched / total).toFixed(1) : 0, diffs };
}

// trata null == "" do Excel; tolera 0 vs null em semanas de fronteira
function eqCell(a: number | null, b: number | null): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return a === b;
}
const iso = (d: Date) => d.toISOString().slice(0, 10);

// --------- Impressão da tabela lado-a-lado (o artefato de venda) ----------
export function printSideBySide(report: AuditReport) {
  console.log(`\n=== ${report.label} ===`);
  console.log(`Paridade: ${report.matched}/${report.totalCells} células = ${report.parityPct}%`);
  if (report.diffs.length === 0) {
    console.log('100% — todos os números batem com o Excel.');
    return;
  }
  console.log('\nDivergências (semana · coluna · Excel → App):');
  // Limita a exibição de divergências para não sobrecarregar
  const displayDiffs = report.diffs.slice(0, 40);
  for (const d of displayDiffs) {
    console.log(`  ${d.week}  ${d.col.padEnd(2)}  ${fmt(d.excel)} → ${fmt(d.app)}`);
  }
  if (report.diffs.length > 40) {
    console.log(`  ... e mais ${report.diffs.length - 40} divergências.`);
  }
}
const fmt = (v: number | null) => (v == null ? '·' : String(v));

// ----------------------------- Execução do Harness -----------------------------

const BF_CEM_JORNADA_TEAMS = new Set([
  'Compras e Estoque',
  'Mobilização',
  'Relatórios de BI',
  'Construção do Data Lake',
  'Evoluções / Buy a Feature',
  'PARATI'
]);

function loadItems(): ConeItem[] {
  if (!fs.existsSync(DATA_FILE)) {
    console.error(`❌ Erro: ${DATA_FILE} não existe. Execute npm run process-csv primeiro.`);
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as any[];
  
  return raw.map(item => {
    const labels = (item.Labels || []) as string[];
    const team = item.Team || null;
    
    // Mapeamento de Jornadas baseado em Labels ou Time
    const jornadas: string[] = [];
    if (labels.includes('COMPRAS') || (team && team.includes('Compras'))) jornadas.push('COMPRAS');
    if (labels.includes('ESTOQUE') || (team && team.includes('Estoque'))) jornadas.push('ESTOQUE');
    if (labels.includes('MOB') || (team && team.includes('Mobilização'))) jornadas.push('MOB');
    if (labels.includes('LAKE-DOMINIO') || (team && team.includes('BI')) || (team && team.includes('Relatórios'))) jornadas.push('LAKE-DOMINIO');

    return {
      key: item.Key,
      type: item.Type,
      status: item.Status,
      team: team,
      jornadas: jornadas,
      releases: item.Release ? [item.Release] : [],
      created: new Date(item.Created),
      committed: item.CommitmentDate ? new Date(item.CommitmentDate) : null,
      startDate: item.StartDate ? new Date(item.StartDate) : null,
      resolved: item.Resolved ? new Date(item.Resolved) : null,
      flagged: labels.includes('IMPEDIDO') || labels.includes('Impediment') ? 'Impediment' : null
    };
  });
}

function runAudit() {
  // 1. Auditoria CEM-R1 (Geração 2)
  console.log('\n🔍 Rodando auditoria para CEM-R1...');
  console.log('🔄 Carregando dados do Excel CEM...');
  const itemsCEM = loadItemsFromCemExcel();
  console.log(`✅ ${itemsCEM.length} itens carregados do Excel CEM.`);
  const paramsCEM: ConeParams = {
    generation: 'gen2',
    release: 'CEM-R1',
    startDate: new Date('2025-11-24T00:00:00Z'),
    targetDate: new Date('2026-05-25T00:00:00Z'),
    stepDays: 7,
    requiredVelocity: 60,
    percentileWindow: 10,
    dataRef: new Date('2026-06-02T12:00:00Z'),
  };
  const reportCEM = auditCone(itemsCEM, paramsCEM, goldenCEM as Golden);
  printSideBySide(reportCEM);

  // 2. Auditoria GOL-O4R2 (Geração 1)
  console.log('\n🔍 Rodando auditoria para GOL O4R2...');
  console.log('🔄 Carregando dados do Excel GOL...');
  const itemsGOL = loadItemsFromGolExcel();
  console.log(`✅ ${itemsGOL.length} itens carregados do Excel GOL.`);
  const paramsGOL: ConeParams = {
    generation: 'gen1',
    release: 'O4R2',
    team: 'Portal de Vendas Assistidas',
    startDate: new Date('2025-10-06T00:00:00Z'),
    targetDate: new Date('2026-04-27T00:00:00Z'),
    stepDays: 7,
    requiredVelocity: 8,
    percentileWindow: 8,
    dataRef: new Date('2026-06-02T12:00:00Z'),
  };
  const reportGOL = auditCone(itemsGOL, paramsGOL, goldenGOL as Golden);
  printSideBySide(reportGOL);
}

runAudit();
