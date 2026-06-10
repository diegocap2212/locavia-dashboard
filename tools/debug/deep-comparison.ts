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

const normalizeTeam = (t: string) => {
  const val = String(t || '').toUpperCase().trim();
  if (val.includes('SCANIA') || val === 'COMPRAS' || val === 'ESTOQUE') {
    return 'COMPRAS E ESTOQUE';
  }
  if (val.includes('OPTIMUS') || val.includes('AMAROK') || val === 'MULTAS' || val === 'RESSARCIMENTO' || val === 'CONTRATOS' || val === 'MANUTENÇÃO') {
    return 'CONTRATOS / MULTAS / RESS / MANUT';
  }
  return 'OTHER';
};

async function runDeepComparison() {
  const xlsxFile = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx';
  const csvFile = 'base_cone.csv';

  const xlsxPath = path.join(process.cwd(), xlsxFile);
  const csvPath = path.join(process.cwd(), csvFile);

  if (!fs.existsSync(xlsxPath) || !fs.existsSync(csvPath)) {
    console.log('❌ Missing files.');
    return;
  }

  // 1. Read CSV
  const rawCsv = fs.readFileSync(csvPath, 'latin1');
  const csvRecords = parse(rawCsv, { delimiter: ';', columns: true, skip_empty_lines: true, relax_quotes: true, trim: true });
  
  const csvKeysMap = new Map<string, any>();
  csvRecords.forEach((r: any) => {
    const key = String(r['Chave da item'] || r['Key'] || Object.values(r)[1]).trim().toUpperCase();
    if (key) csvKeysMap.set(key, r);
  });

  // 2. Read XLSX
  const workbook = XLSX.read(fs.readFileSync(xlsxPath));
  const sheet = workbook.Sheets['BASE CONE'];
  const xlsxRecords = XLSX.utils.sheet_to_json(sheet) as any[];
  
  const xlsxKeysMap = new Map<string, any>();
  xlsxRecords.forEach((r: any) => {
    const key = String(r['Chave da item'] || r['Chave'] || r['Key']).trim().toUpperCase();
    if (key) xlsxKeysMap.set(key, r);
  });

  console.log('=== ANÁLISE DE DADOS "IN CONE" (ATIVOS) ===\n');

  const targets = ['COMPRAS E ESTOQUE', 'CONTRATOS / MULTAS / RESS / MANUT'];

  targets.forEach(targetGroup => {
    console.log(`\n--- Grupo de Squad: ${targetGroup} ---`);
    
    // Process CSV items
    const csvInCone = new Map<string, any>();
    csvKeysMap.forEach((r, key) => {
      const rawTeam = r['Campo personalizado (Time)'] || r['time'] || '';
      if (normalizeTeam(rawTeam) === targetGroup) {
        const status = r['Status'] || '';
        if (!isExcluded(status)) {
          csvInCone.set(key, r);
        }
      }
    });

    // Process XLSX items
    const xlsxInCone = new Map<string, any>();
    xlsxKeysMap.forEach((r, key) => {
      const rawTeam = r['Campo personalizado (Time)'] || r['time'] || '';
      if (normalizeTeam(rawTeam) === targetGroup) {
        const status = r['Status'] || '';
        if (!isExcluded(status)) {
          xlsxInCone.set(key, r);
        }
      }
    });

    console.log(`Total no XLSX IN CONE: ${xlsxInCone.size}`);
    console.log(`Total no CSV  IN CONE: ${csvInCone.size}`);
    const diff = xlsxInCone.size - csvInCone.size;
    console.log(`Diferença absoluta: ${diff} itens`);

    // Find keys in XLSX but not in CSV
    const missingInCsv: string[] = [];
    xlsxInCone.forEach((val, key) => {
      if (!csvInCone.has(key)) {
        missingInCsv.push(key);
      }
    });

    // Find keys in CSV but not in XLSX
    const extraInCsv: string[] = [];
    csvInCone.forEach((val, key) => {
      if (!xlsxInCone.has(key)) {
        extraInCsv.push(key);
      }
    });

    if (missingInCsv.length > 0) {
      console.log(`\nItems no XLSX que FALTAM no CSV (${missingInCsv.length}):`);
      missingInCsv.forEach(key => {
        const item = xlsxInCone.get(key);
        // See if key exists in CSV AT ALL (maybe excluded or other team)
        const atAll = csvKeysMap.get(key);
        let note = '';
        if (atAll) {
          note = `(Existe no CSV mas com Status "${atAll['Status']}" e Time "${atAll['Campo personalizado (Time)'] || atAll['time']}")`;
        } else {
          note = `(Totalmente ausente do CSV)`;
        }
        console.log(`  - ${key} [${item['Status']}] : ${item['Resumo']} ${note}`);
      });
    }

    if (extraInCsv.length > 0) {
      console.log(`\nItems no CSV que FALTAM no XLSX (${extraInCsv.length}):`);
      extraInCsv.forEach(key => {
        const item = csvInCone.get(key);
        console.log(`  - ${key} [${item['Status']}] : ${item['Resumo']}`);
      });
    }
  });
}

runDeepComparison();
