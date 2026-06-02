import XLSX from 'xlsx';

const wb = XLSX.readFile('Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
  
  data.forEach((row, rIdx) => {
    if (row.includes(46125)) {
      console.log(`Sheet "${sheetName}" row ${rIdx+1} contains 46125:`, row.slice(0, 15));
    }
  });
});
