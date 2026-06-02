import XLSX from 'xlsx';

const wb = XLSX.readFile('Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');

wb.SheetNames.forEach(sheetName => {
  const ws = wb.Sheets[sheetName];
  const r3 = ws['C3']?.v;
  const r4 = ws['C4']?.v;
  const r5 = ws['C5']?.v;
  if (r3 || r4) {
    console.log(`Sheet "${sheetName}": C2="${ws['C2']?.v}", C3="${r3}", C4="${r4}", C5="${r5}"`);
  }
});
