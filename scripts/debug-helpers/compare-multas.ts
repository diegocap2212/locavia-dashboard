import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const EXCLUDED_STATUSES = new Set([
  '1. BACKLOG', 'BACKLOG', 'SPRINT BACKLOG',
  'EM REFINAMENTO', 'REFINANDO', 'A REFINAR',
  'SANEAMENTO', 'ESPERANDO', 'DESCARTADO', 'CANCELADO', 'NOGO', 'DESCARTADOS'
]);

const isExcluded = (status: string) => {
  return EXCLUDED_STATUSES.has(String(status || '').toUpperCase().trim());
};

async function runMultasComparison() {
  const xlsxFile = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
  const csvFile = 'base_cone.csv';

  const xlsxPath = path.join(process.cwd(), xlsxFile);
  const csvPath = path.join(process.cwd(), csvFile);

  // 1. Read CSV
  const rawCsv = fs.readFileSync(csvPath, 'latin1');
  const csvRecords = parse(rawCsv, { delimiter: ';', columns: true, skip_empty_lines: true, relax_quotes: true, trim: true });
  
  // 2. Read XLSX
  const workbook = XLSX.read(fs.readFileSync(xlsxPath));
  const sheet = workbook.Sheets['BASE CONE'];
  const xlsxRecords = XLSX.utils.sheet_to_json(sheet) as any[];

  const csvMultas = csvRecords.filter((r: any) => {
    const summary = String(r['Resumo'] || '').toLowerCase();
    const isMulta = summary.includes('multa') || summary.includes('infrator') || summary.includes('ait');
    const active = !isExcluded(r['Status']);
    return isMulta && active;
  });

  const xlsxMultas = xlsxRecords.filter((r: any) => {
    const summary = String(r['Resumo'] || '').toLowerCase();
    const isMulta = summary.includes('multa') || summary.includes('infrator') || summary.includes('ait');
    const active = !isExcluded(r['Status']);
    return isMulta && active;
  });

  console.log(`Total Multas Ativas no XLSX: ${xlsxMultas.length}`);
  console.log(`Total Multas Ativas no CSV:  ${csvMultas.length}`);
  console.log(`Diferença absoluta: ${xlsxMultas.length - csvMultas.length} itens\n`);

  console.log('--- Detalhes XLSX ---');
  xlsxMultas.forEach((r: any) => {
    console.log(` - ${r['Chave da item'] || r['Chave']} [${r['Status']}] : ${r['Resumo']}`);
  });

  console.log('\n--- Detalhes CSV ---');
  csvMultas.forEach((r: any) => {
    console.log(` - ${r['Chave da item'] || r['Chave'] || Object.values(r)[1]} [${r['Status']}] : ${r['Resumo']}`);
  });
}

runMultasComparison();
