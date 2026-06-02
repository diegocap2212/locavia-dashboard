/**
 * cone-audit.ts
 *
 * Ferramenta de auditoria para validar se os números do dashboard
 * conferem com as planilhas CONE do SharePoint.
 *
 * Uso: npx tsx scripts/cone-audit.ts
 *
 * Saída:
 *   - Tabela no console por CONE (LOCAVIA e BF/CEM)
 *   - CSV detalhado: scripts/cone-audit-export.csv
 *   - JSON de totais: scripts/cone-audit-totals.json
 */

import fs from 'fs';
import path from 'path';

interface DashboardItem {
  Type: string;
  Key: string;
  Summary: string;
  Status: string;
  StatusCategory: 'TODO' | 'IN_PROGRESS' | 'DONE';
  Team: string;
  Created: string;
  Resolved: string | null;
  Release: string;
  StoryPoints: number | null;
  Priority: string;
  Assignee: string | null;
  Labels: string[];
  CycleTime: number | null;
  LeadTime: number | null;
  Source: string;
}

// ─── Configuração dos Cones ───────────────────────────────────────────────────

const LOCAVIA_RELEASES = new Set(['O4R1', 'O4R2', 'O4R3']);
const BF_CEM_RELEASES = new Set(['BAF', 'BAF-QW', 'CEM', 'CEM-R1', 'CEM-R2']);
// Times capturados pela Jornada (sem release de cone) que pertencem ao BF/CEM
const BF_CEM_JORNADA_TEAMS = new Set([
  'Compras e Estoque', 'Mobilização', 'Relatórios de BI', 'Construção do Data Lake',
  'Evoluções / Buy a Feature', 'PARATI',
]);

// Statuses que a planilha CONE exclui do escopo ativo
// (itens com esses status ainda aparecem na planilha, mas não como "no cone ativo")
const EXCLUDED_STATUSES = new Set([
  '1. BACKLOG', 'BACKLOG', 'SPRINT BACKLOG',
  'EM REFINAMENTO', 'REFINANDO', 'A REFINAR',
  'SANEAMENTO', 'ESPERANDO', 'DESCARTADO', 'CANCELADO', 'NOGO',
]);

// Mapeamento inverso: Nome normalizado → "Carro" da planilha
const TEAM_TO_CAR: Record<string, string> = {
  'Portal de Vendas Assistidas':                     'GOL',
  'Faturamento':                                     'TERA',
  'Contratos / Multas / Ressarcimento / Manutenção': 'OPTIMUS/AMAROK',
  'Compras e Estoque':                               'SCANIA',
  'Mobilização':                                     'JETTA',
  'Sustentação (Bugs)':                              'TIGUAN',
  'Evoluções / Buy a Feature':                       'PARATI',
  'Portal de Auto Atendimento':                      'NIVUS',
  'Atendimento WhatsApp':                            'UP/WHATSAPP',
  'Migração de Dados':                               'SANTANA',
  'Crédito e Proposta':                              'TAOS/BRASÍLIA',
  'Pós Venda Salesforce':                            'FUSCA',
  'Relatórios de BI':                                'LAKE-DOMINIO',
  'Construção do Data Lake':                         'LAKE-ESTRUTURANTE',
  'Core System':                                     'CORE',
  'Pricing':                                         'PRICING',
  'Governança de Dados':                             'GOVERNANÇA',
  'OUTROS SQUADS':                                   'SEM TIME',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isExcluded(item: DashboardItem): boolean {
  return EXCLUDED_STATUSES.has(item.Status.toUpperCase());
}

function getConeGroup(item: DashboardItem): 'LOCAVIA' | 'BF/CEM' | 'OUTROS' {
  if (LOCAVIA_RELEASES.has(item.Release)) return 'LOCAVIA';
  if (BF_CEM_RELEASES.has(item.Release)) return 'BF/CEM';
  if (item.Release === 'OUTROS' && BF_CEM_JORNADA_TEAMS.has(item.Team)) return 'BF/CEM';
  return 'OUTROS';
}

function daysBetween(a: string, b: string): number {
  return Math.ceil(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

function pad(s: string | number, n: number): string {
  return String(s).padEnd(n);
}

function rpad(s: string | number, n: number): string {
  return String(s).padStart(n);
}

// ─── Relatório por cone ───────────────────────────────────────────────────────

function printConeReport(
  label: string,
  items: DashboardItem[]
): Record<string, Record<string, { total: number; done: number; inProgress: number; todo: number; excluded: number; inCone: number }>> {
  console.log(`\n${'═'.repeat(100)}`);
  console.log(`  ${label} — ${items.length} itens no data.json`);
  console.log(`${'═'.repeat(100)}`);

  // Group by Release → Team
  const grouped: Record<string, Record<string, DashboardItem[]>> = {};
  for (const item of items) {
    if (!grouped[item.Release]) grouped[item.Release] = {};
    if (!grouped[item.Release][item.Team]) grouped[item.Release][item.Team] = [];
    grouped[item.Release][item.Team].push(item);
  }

  const summary: Record<string, Record<string, Record<string, number>>> = {};

  for (const release of Object.keys(grouped).sort()) {
    console.log(`\n  Release: ${release}`);
    console.log(
      '  ' +
      pad('Time (normalizado)', 44) +
      pad('Carro planilha', 18) +
      rpad('Total', 7) +
      rpad('Done', 6) +
      rpad('Em And.', 9) +
      rpad('Todo', 6) +
      rpad('Excluído*', 11) +
      rpad('No Cone', 9)
    );
    console.log('  ' + '─'.repeat(98));

    summary[release] = {};

    let relTotal = 0, relDone = 0, relInProg = 0, relTodo = 0, relExcl = 0, relCone = 0;

    for (const team of Object.keys(grouped[release]).sort()) {
      const teamItems = grouped[release][team];
      const total = teamItems.length;
      const done = teamItems.filter(i => i.StatusCategory === 'DONE').length;
      const inProgress = teamItems.filter(i => i.StatusCategory === 'IN_PROGRESS').length;
      const todo = teamItems.filter(i => i.StatusCategory === 'TODO').length;
      const excluded = teamItems.filter(isExcluded).length;
      const inCone = total - excluded;
      const car = TEAM_TO_CAR[team] ?? '?';

      summary[release][team] = { total, done, inProgress, todo, excluded, inCone };

      console.log(
        '  ' +
        pad(team, 44) +
        pad(car, 18) +
        rpad(total, 7) +
        rpad(done, 6) +
        rpad(inProgress, 9) +
        rpad(todo, 6) +
        rpad(excluded, 11) +
        rpad(inCone, 9)
      );

      relTotal += total; relDone += done; relInProg += inProgress;
      relTodo += todo; relExcl += excluded; relCone += inCone;
    }

    console.log('  ' + '─'.repeat(98));
    console.log(
      '  ' +
      pad(`SUBTOTAL ${release}`, 62) +
      rpad(relTotal, 7) +
      rpad(relDone, 6) +
      rpad(relInProg, 9) +
      rpad(relTodo, 6) +
      rpad(relExcl, 11) +
      rpad(relCone, 9)
    );
  }

  const total = items.length;
  const done = items.filter(i => i.StatusCategory === 'DONE').length;
  const inCone = items.filter(i => !isExcluded(i)).length;
  const pctDone = total > 0 ? ((done / inCone) * 100).toFixed(1) : '0.0';

  console.log(`\n  TOTAL ${label}: ${total} itens | ${done} done | ${inCone} no cone | ${pctDone}% concluído`);
  console.log(`  * "Excluído" = status em Backlog/Refinamento (não conta no cone ativo)`);

  return summary;
}

// ─── Análise de status desconhecidos ─────────────────────────────────────────

function printStatusBreakdown(items: DashboardItem[], label: string) {
  const statusCounts: Record<string, number> = {};
  for (const item of items) {
    statusCounts[item.Status] = (statusCounts[item.Status] ?? 0) + 1;
  }
  const sorted = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);

  console.log(`\n  Breakdown de Status — ${label}`);
  console.log('  ' + pad('Status', 40) + rpad('Qtd', 6) + '  Categoria');
  console.log('  ' + '─'.repeat(65));
  for (const [status, count] of sorted) {
    const excluded = EXCLUDED_STATUSES.has(status.toUpperCase()) ? '  ← excluído do cone' : '';
    console.log('  ' + pad(status, 40) + rpad(count, 6) + excluded);
  }
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

function exportCsv(items: DashboardItem[]) {
  const csvPath = path.resolve(process.cwd(), 'scripts/cone-audit-export.csv');

  const headers = [
    'Key', 'Type', 'Summary', 'Status', 'StatusCategory',
    'Team', 'Carro_Planilha', 'Release', 'Cone_Grupo',
    'Excluido_Do_Cone', 'Created', 'Resolved', 'LeadTime_Dias',
    'Assignee', 'Priority',
  ];

  const rows = items.map(item => {
    const car = TEAM_TO_CAR[item.Team] ?? item.Team;
    const coneGroup = getConeGroup(item);
    const excluded = isExcluded(item) ? '1' : '0';
    const leadDays =
      item.Resolved && item.Created
        ? daysBetween(item.Created, item.Resolved)
        : '';
    const createdDate = item.Created ? item.Created.split('T')[0] : '';
    const resolvedDate = item.Resolved ? item.Resolved.split('T')[0] : '';
    const summary = item.Summary.replace(/"/g, '""');

    return [
      item.Key,
      item.Type,
      `"${summary}"`,
      item.Status,
      item.StatusCategory,
      `"${item.Team}"`,
      car,
      item.Release,
      coneGroup,
      excluded,
      createdDate,
      resolvedDate,
      leadDays,
      item.Assignee ?? '',
      item.Priority,
    ].join(';');
  });

  // BOM (U+FEFF) para Excel reconhecer UTF-8
  const csv = '﻿' + [headers.join(';'), ...rows].join('\n');
  fs.writeFileSync(csvPath, csv, 'utf8');
  console.log(`\n  ✅ CSV exportado: scripts/cone-audit-export.csv`);
  console.log(`     (Abra no Excel → Dados → De Texto/CSV, separador ponto-e-vírgula)`);
}

// ─── Export JSON de totais ────────────────────────────────────────────────────

function exportTotalsJson(
  locaviaSummary: Record<string, Record<string, Record<string, number>>>,
  bfCemSummary: Record<string, Record<string, Record<string, number>>>,
  auditDate: string
) {
  const totalsPath = path.resolve(process.cwd(), 'scripts/cone-audit-totals.json');
  const output = {
    auditDate,
    coneLocavia: locaviaSummary,
    coneBfCem: bfCemSummary,
  };
  fs.writeFileSync(totalsPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`  ✅ Totais JSON: scripts/cone-audit-totals.json`);
}

// ─── Itens sem time ou release conhecidos ────────────────────────────────────

function printOrphans(items: DashboardItem[]) {
  const noTeam = items.filter(i => !i.Team || i.Team === 'OUTROS SQUADS');
  if (noTeam.length > 0) {
    console.log(`\n  ⚠️  ${noTeam.length} itens com time "OUTROS SQUADS" (não mapeados):`);
    const byRelease: Record<string, number> = {};
    for (const i of noTeam) {
      byRelease[i.Release] = (byRelease[i.Release] ?? 0) + 1;
    }
    for (const [rel, cnt] of Object.entries(byRelease).sort()) {
      console.log(`     ${rel}: ${cnt} itens`);
    }
    console.log(`     (Primeiros 5: ${noTeam.slice(0, 5).map(i => i.Key).join(', ')})`);
  }

  // Only flag items that truly don't belong to any cone (not BF/CEM jornada teams)
  const noMappedCone = items.filter(i => getConeGroup(i) === 'OUTROS');
  if (noMappedCone.length > 0) {
    console.log(`\n  ⚠️  ${noMappedCone.length} itens fora dos cones (release sem mapeamento):`);
    const byTeam: Record<string, number> = {};
    for (const i of noMappedCone) {
      byTeam[i.Team] = (byTeam[i.Team] ?? 0) + 1;
    }
    for (const [team, cnt] of Object.entries(byTeam).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      console.log(`     ${team}: ${cnt} itens`);
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const dataPath = path.resolve(process.cwd(), 'src/data.json');

  if (!fs.existsSync(dataPath)) {
    console.error('❌ src/data.json não encontrado. Rode primeiro: npm run sync:jira');
    process.exit(1);
  }

  const items: DashboardItem[] = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const auditDate = new Date().toISOString();

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           CONE AUDIT — Validação vs Planilha CONE           ║');
  console.log(`╚══════════════════════════════════════════════════════════════╝`);
  console.log(`\n  Data do audit: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`  Total de itens no data.json: ${items.length}`);

  const locaviaItems = items.filter(i => LOCAVIA_RELEASES.has(i.Release));
  const bfCemItems = items.filter(i =>
    BF_CEM_RELEASES.has(i.Release) ||
    (i.Release === 'OUTROS' && BF_CEM_JORNADA_TEAMS.has(i.Team))
  );
  const othersItems = items.filter(i => getConeGroup(i) === 'OUTROS');

  console.log(`\n  Distribuição por cone:`);
  console.log(`    CONE 1 — LOCAVIA (O4R1/O4R2/O4R3): ${locaviaItems.length} itens`);
  console.log(`    CONE 2 — BF/CEM (BAF/BAF-QW/CEM):  ${bfCemItems.length} itens`);
  console.log(`    Fora dos cones (release "OUTROS"):  ${othersItems.length} itens`);

  const locaviaSummary = printConeReport('CONE 1 — LOCAVIA', locaviaItems);
  const bfCemSummary   = printConeReport('CONE 2 — BF/CEM', bfCemItems);

  // Status breakdown para entender divergências
  console.log('\n' + '═'.repeat(100));
  console.log('  ANÁLISE DE STATUSES (para entender divergências de contagem)');
  console.log('═'.repeat(100));
  printStatusBreakdown(locaviaItems, 'CONE LOCAVIA');
  printStatusBreakdown(bfCemItems, 'CONE BF/CEM');

  // Orphans
  console.log('\n' + '═'.repeat(100));
  console.log('  ITENS SEM TIME OU RELEASE MAPEADOS');
  console.log('═'.repeat(100));
  printOrphans(items);

  // Exports
  console.log('\n' + '═'.repeat(100));
  console.log('  EXPORTS');
  console.log('═'.repeat(100));
  exportCsv(items);
  exportTotalsJson(locaviaSummary, bfCemSummary, auditDate);

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Como comparar com a planilha:                              ║');
  console.log('║  1. Abra cone-audit-export.csv no Excel                     ║');
  console.log('║  2. Compare as colunas "Key" com as chaves da planilha      ║');
  console.log('║  3. Filtre "Excluido_Do_Cone=1" para ver itens em backlog   ║');
  console.log('║  4. Compare totais por time+release com as abas da planilha ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

main();
