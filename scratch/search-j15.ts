import XLSX from 'xlsx';

function searchFile(filename: string) {
  console.log(`Searching file: ${filename}...`);
  const wb = XLSX.readFile(filename);
  wb.SheetNames.forEach(sheetName => {
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
    data.forEach((row, rIdx) => {
      if (row.includes(35)) {
        console.log(`Sheet "${sheetName}" row ${rIdx + 1} contains 35:`, row.slice(0, 15));
      }
    });
  });
}

searchFile('Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');
searchFile('Cone LOCAVIA AUTOMAÇÃO O4R2 (11).xlsx');
