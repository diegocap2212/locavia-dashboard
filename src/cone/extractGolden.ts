import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE_CEM = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO - BAF e CEM.xlsx');
const FILE_GOL = path.join(__dirname, '../../Cópia de Cone LOCAVIA AUTOMAÇÃO O4R2.xlsx');

const FIXTURE_CEM = path.join(__dirname, 'fixtures/golden_CEM-R1.json');
const FIXTURE_GOL = path.join(__dirname, 'fixtures/golden_GOL-O4R2.json');

function excelDateToISO(excelDate: any): string {
  if (excelDate === undefined || excelDate === null || excelDate === '') return '';
  const num = Number(excelDate);
  if (isNaN(num)) return String(excelDate);
  // Excel date offset
  const date = new Date(Date.UTC(1899, 11, 30));
  date.setUTCDate(date.getUTCDate() + Math.floor(num));
  return date.toISOString().slice(0, 10);
}

function parseNum(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function extractCEM() {
  console.log(`Extracting CEM-R1 from ${FILE_CEM}...`);
  const workbook = XLSX.readFile(FILE_CEM);
  const sheet = workbook.Sheets['Cone CEM-R1'];
  if (!sheet) {
    throw new Error('Cone CEM-R1 sheet not found');
  }
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  
  // Extract parameters
  // Row indexes are 0-based
  const c2 = String(data[1]?.[2] || '');
  const c3 = String(data[2]?.[2] || '');
  const c4 = parseNum(data[3]?.[2]) ?? 0;
  const c5 = excelDateToISO(data[4]?.[2]);
  const c6 = excelDateToISO(data[5]?.[2]);
  const c7 = parseNum(data[6]?.[2]) ?? 0;
  const c8 = parseNum(data[7]?.[2]) ?? 0;
  const c9 = parseNum(data[8]?.[2]) ?? 0;
  const c10 = parseNum(data[9]?.[2]) ?? 0;

  const weeks: any[] = [];
  
  // Weekly rows start at row 14 (index 13)
  for (let r = 13; r < data.length; r++) {
    const row = data[r] || [];
    const weekVal = row[1];
    if (!weekVal) continue;
    const weekISO = excelDateToISO(weekVal);
    if (!weekISO || !/^\d{4}-\d{2}-\d{2}$/.test(weekISO)) continue;
    
    weeks.push({
      week: weekISO,
      C: parseNum(row[2]),
      D: parseNum(row[3]),
      E: parseNum(row[4]),
      F: parseNum(row[5]),
      G: parseNum(row[6]),
      H: parseNum(row[7]),
      I: parseNum(row[8]),
      J: parseNum(row[9]),
      K: parseNum(row[10]),
      L: parseNum(row[11]),
      M: parseNum(row[12]),
      N: parseNum(row[13])
    });
  }

  const result = {
    label: "Cone CEM-R1 (gen2)",
    generation: "gen2",
    params: {
      C2: c2,
      C3: c3,
      C4: c4,
      C5: c5,
      C6: c6,
      C7: c7,
      C8: c8,
      C9: c9,
      C10: c10
    },
    weeks
  };

  fs.writeFileSync(FIXTURE_CEM, JSON.stringify(result, null, 1), 'utf8');
  console.log(`CEM-R1 extracted to ${FIXTURE_CEM}. Total weeks: ${weeks.length}`);
}

function extractGOL() {
  console.log(`Extracting GOL O4R2 from ${FILE_GOL}...`);
  const workbook = XLSX.readFile(FILE_GOL);
  const sheet = workbook.Sheets['GOL O4R2'];
  if (!sheet) {
    throw new Error('GOL O4R2 sheet not found');
  }
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  // Extract parameters
  const c2 = String(data[1]?.[2] || '');
  const c3 = String(data[2]?.[2] || '');
  const c4 = parseNum(data[3]?.[2]) ?? 0;
  const c5 = excelDateToISO(data[4]?.[2]);
  const c6 = excelDateToISO(data[5]?.[2]);
  const c7 = parseNum(data[6]?.[2]) ?? 0;
  const c8 = parseNum(data[7]?.[2]) ?? 0;
  const c9 = parseNum(data[8]?.[2]) ?? 0;
  const c10 = parseNum(data[9]?.[2]) ?? 0;

  const weeks: any[] = [];

  // Weekly rows start at row 15 (index 14)
  for (let r = 14; r < data.length; r++) {
    const row = data[r] || [];
    const weekVal = row[1];
    if (!weekVal) continue;
    const weekISO = excelDateToISO(weekVal);
    if (!weekISO || !/^\d{4}-\d{2}-\d{2}$/.test(weekISO)) continue;

    weeks.push({
      week: weekISO,
      C: parseNum(row[2]),
      D: parseNum(row[3]),
      E: parseNum(row[4]),
      F: parseNum(row[5]),
      G: parseNum(row[6]),
      H: parseNum(row[7]),
      I: parseNum(row[8]),
      J: parseNum(row[9]),
      K: parseNum(row[10])
    });
  }

  const result = {
    label: "GOL O4R2 (gen1)",
    generation: "gen1",
    params: {
      C2: c2,
      C3: c3,
      C4: c4,
      C5: c5,
      C6: c6,
      C7: c7,
      C8: c8,
      C9: c9,
      C10: c10
    },
    weeks
  };

  fs.writeFileSync(FIXTURE_GOL, JSON.stringify(result, null, 1), 'utf8');
  console.log(`GOL O4R2 extracted to ${FIXTURE_GOL}. Total weeks: ${weeks.length}`);
}

extractCEM();
extractGOL();
