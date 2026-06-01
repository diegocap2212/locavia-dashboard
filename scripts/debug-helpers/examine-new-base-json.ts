import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (5).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const sheetName = 'BASE CONE';
  const worksheet = workbook.Sheets[sheetName];
  
  if (worksheet) {
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const output = {
      headers: json[0],
      row1: json[1]
    };
    fs.writeFileSync('scripts/base_cone_info.json', JSON.stringify(output, null, 2));
  } else {
    fs.writeFileSync('scripts/base_cone_info.json', JSON.stringify({ error: 'Sheet not found' }));
  }
}
