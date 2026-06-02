import XLSX from 'xlsx';

const wb = XLSX.readFile('Cone LOCAVIA AUTOMAÇÃO - BAF e CEM (1).xlsx');
const ws = wb.Sheets['_Locavia_ BASE CONE 2 (Jira)'];
const data = XLSX.utils.sheet_to_json(ws) as any[];

const cemRows = data.filter(row => {
  const rel = String(row['Release'] || '');
  return rel.includes('CEM-R1');
});

console.log(`Total CEM-R1 rows in Excel: ${cemRows.length}`);
cemRows.slice(0, 10).forEach(row => {
  console.log(`- ${row['Chave da item'] || row['Key']}: Status=${row['Status']}, Created=${row['Criado']}, Resolved=${row['Resolvido']}`);
});
