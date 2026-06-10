import XLSX from 'xlsx';

const wb = XLSX.readFile('Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
  let count = 0;
  data.forEach((row, rIdx) => {
    row.forEach((cell, cIdx) => {
      if (cell && String(cell).includes('CEM-R1')) {
        count++;
        if (count <= 3) {
          console.log(`Sheet "${sheetName}" cell [r:${rIdx}, c:${cIdx}]: "${cell}"`);
        }
      }
    });
  });
  if (count > 3) {
    console.log(`Sheet "${sheetName}" has ${count} matches total.`);
  }
});
