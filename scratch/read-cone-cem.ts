import XLSX from 'xlsx';

const wb = XLSX.readFile('Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');
const ws = wb.Sheets['CONE CEM'];
const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

for (let r = 0; r < Math.min(data.length, 15); r++) {
  if (data[r]) {
    console.log(`Row ${r + 1}:`, data[r].slice(0, 15));
  }
}
