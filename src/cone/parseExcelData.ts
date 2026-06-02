import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { ConeItem } from './computeCone';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_CEM = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO - BAF e CEM.xlsx');
const FILE_GOL = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO O4R2.xlsx');

function excelDateToDate(excelDate: any): Date | null {
  if (excelDate === undefined || excelDate === null || excelDate === '') return null;
  const num = Number(excelDate);
  if (isNaN(num)) return new Date(excelDate);
  // Excel date offset
  const date = new Date(Date.UTC(1899, 11, 30));
  date.setUTCDate(date.getUTCDate() + Math.floor(num));
  
  // Excel serial fractional day (for time of day)
  const fraction = num - Math.floor(num);
  if (fraction > 0) {
    const msInDay = 24 * 60 * 60 * 1000;
    const ms = Math.round(fraction * msInDay);
    date.setUTCMilliseconds(date.getUTCMilliseconds() + ms);
  }
  
  return date;
}

export function loadItemsFromCemExcel(): ConeItem[] {
  const workbook = XLSX.readFile(FILE_CEM);
  const sheet = workbook.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const headers = raw[0];
  
  return raw.slice(1).map((row, idx) => {
    // Column mappings
    // 0: Tipo de item, 1: Chave da item, 7: Campo personalizado (Time), 8: Status, 10: Criado,
    // 11: Campo personalizado (Data de Compromentimento), 12: Campo personalizado (Data de início),
    // 13: Resolvido, 16: Campo personalizado (Flagged), 17: Jornada, 19: Release
    const type = String(row[0] || '');
    const key = String(row[1] || '');
    const team = row[7] ? String(row[7]) : null;
    const status = String(row[8] || '');
    const createdDate = excelDateToDate(row[10]);
    const committedDate = excelDateToDate(row[11]);
    const startDate = excelDateToDate(row[12]);
    const resolvedDate = excelDateToDate(row[13]);
    const flaggedVal = row[16] ? String(row[16]) : null;
    const flagged = (flaggedVal && flaggedVal.includes('Impediment')) ? 'Impediment' : null;
    
    const releaseStr = String(row[19] || '');
    const releases = releaseStr.split(';;').map(s => s.trim()).filter(Boolean);
    
    const jornadaStr = String(row[17] || '');
    const jornadas = jornadaStr.split(';;').map(s => s.trim()).filter(Boolean);

    return {
      key,
      type,
      status,
      team,
      jornadas,
      releases,
      created: createdDate || new Date(),
      committed: committedDate,
      startDate,
      resolved: resolvedDate,
      flagged
    };
  });
}

export function loadItemsFromGolExcel(): ConeItem[] {
  const workbook = XLSX.readFile(FILE_GOL);
  const sheet = workbook.Sheets['BASE CONE'];
  const raw = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  
  return raw.slice(1).map((row, idx) => {
    // Column mappings
    // 0: Tipo de item, 1: Chave da item, 4: Status, 5: Campo personalizado (Time), 9: Criado,
    // 10: Campo personalizado (Data de Compromentimento), 11: Campo personalizado (Data de início),
    // 12: Resolvido, 19: time, 20: release
    const type = String(row[0] || '');
    const key = String(row[1] || '');
    const status = String(row[4] || '');
    let team = row[5] ? String(row[5]) : null;
    if (team === 'GOL') {
      team = 'Portal de Vendas Assistidas';
    }
    const createdDate = excelDateToDate(row[9]);
    const committedDate = excelDateToDate(row[10]);
    const startDate = excelDateToDate(row[11]);
    const resolvedDate = excelDateToDate(row[12]);
    
    // In GOL O4R2 base sheet: Column U (index 20) is release name
    const releaseStr = String(row[20] || '');
    const releases = releaseStr.split(';;').map(s => s.trim()).filter(Boolean);

    // Column T (index 19) is team name / jornada
    const jornadaStr = String(row[19] || '');
    const jornadas = jornadaStr.split(';;').map(s => s.trim()).filter(Boolean);

    return {
      key,
      type,
      status,
      team,
      jornadas,
      releases,
      created: createdDate || new Date(),
      committed: committedDate,
      startDate,
      resolved: resolvedDate,
      flagged: null
    };
  });
}

// Simple test run if executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cem = loadItemsFromCemExcel();
  console.log(`CEM items loaded from Excel: ${cem.length}`);
  const gol = loadItemsFromGolExcel();
  console.log(`GOL items loaded from Excel: ${gol.length}`);
}
