import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const file = 'Cone LOCAVIA AUTOMAÇÃO O4R2 (5).xlsx';
const filePath = path.join(process.cwd(), file);

if (fs.existsSync(filePath)) {
  const workbook = XLSX.read(fs.readFileSync(filePath));
  const carTabs = ['GOL O4R2', 'TERA O4R2', 'OPTIMUS O4R2', 'NIVUS O4R2', 'TAOS O4R2', 'FUSCA O4R2', 'UP O4R2'];
  
  carTabs.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    if (worksheet) {
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(`Sheet: ${sheetName}`);
      console.log(`Row 1: ${JSON.stringify(json[0])}`);
      console.log(`Row 2: ${JSON.stringify(json[1])}`);
    }
  });
}
