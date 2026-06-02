import XLSX from 'xlsx';

const wb = XLSX.readFile('Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');
const ws = wb.Sheets['Cone BAF'];

console.log('Cone BAF column K formulas:');
['K15', 'K16', 'K17'].forEach(ref => {
  const cell = ws[ref];
  console.log(`Cell ${ref}: val=${cell ? cell.v : 'null'}, formula=${cell ? cell.f : 'null'}`);
});
