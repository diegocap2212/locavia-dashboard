import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileCem = path.join(__dirname, '../Cópia de Cone LOCAVIA AUTOMAÇÃO - BAF e CEM.xlsx');
const fileGol = path.join(__dirname, '../Cópia de Cone LOCAVIA AUTOMAÇÃO O4R2.xlsx');

function excelDateToISO(excelDate: any): string {
  if (excelDate === undefined || excelDate === null || excelDate === '') return '';
  const num = Number(excelDate);
  if (isNaN(num)) return String(excelDate);
  const date = new Date(Date.UTC(1899, 11, 30));
  date.setUTCDate(date.getUTCDate() + Math.floor(num));
  return date.toISOString().slice(0, 10);
}

function parseNum(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

function printParams(filePath: string, sheetNames: string[]) {
  const wb = XLSX.readFile(filePath);
  sheetNames.forEach(name => {
    const sheet = wb.Sheets[name];
    if (!sheet) return;
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    // C2 is row index 1, col index 2
    // C3 is row index 2, col index 2
    // etc.
    const c2 = String(data[1]?.[2] || '');
    const c3 = String(data[2]?.[2] || '');
    const c4 = parseNum(data[3]?.[2]);
    const c5 = excelDateToISO(data[4]?.[2]);
    const c6 = excelDateToISO(data[5]?.[2]);
    const c7 = parseNum(data[6]?.[2]);
    const c8 = parseNum(data[7]?.[2]);
    const c9 = parseNum(data[8]?.[2]);
    const c10 = parseNum(data[9]?.[2]);
    
    console.log(`Sheet: "${name}"`);
    console.log(`  C2 (Filtro tipo): "${c2}"`);
    console.log(`  C3 (Release):     "${c3}"`);
    console.log(`  C4 (Backlog ini): ${c4}`);
    console.log(`  C5 (Início):      "${c5}"`);
    console.log(`  C6 (Data-alvo):   "${c6}"`);
    console.log(`  C7 (Melhor vaz):  ${c7}`);
    console.log(`  C8 (Pior vaz):    ${c8}`);
    console.log(`  C9 (Req Vel):     ${c9}`);
    console.log(`  C10 (Passo dias): ${c10}`);
    console.log('');
  });
}

console.log('=== LOCAVIA GOL FILE SHEET PARAMS ===');
const golSheets = [
  'GOL O4R2', 'TERA O4R2', 'OPTIMUS O4R2', 'NIVUS O4R2', 'TAOS O4R2', 'FUSCA O4R2', 'UP O4R2', 'D.LAKE DOMINIO O4R2'
];
printParams(fileGol, golSheets);

console.log('=== BAF & CEM FILE SHEET PARAMS ===');
const cemSheets = [
  'Cone BAF', 'Cone CEM-R1', 'Cone CEM-R1 SCANIA', 'Cone CEM-R1 JETTA', 'Cone CEM-R1 PARATI', 'Cone Comp+Estoq+Mob'
];
printParams(fileCem, cemSheets);
