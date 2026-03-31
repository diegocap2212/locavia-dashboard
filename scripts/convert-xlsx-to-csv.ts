import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../Cone LOCAVIA AUTOMAÇÃO O4R2 (2).xlsx');
const OUTPUT_FILE = path.join(__dirname, '../base_cone.csv');

async function convert() {
  console.log('🔄 Converting XLSX to CSV...');
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ File not found: ${INPUT_FILE}`);
    process.exit(1);
  }

  try {
    const fileBuffer = fs.readFileSync(INPUT_FILE);
    const workbook = XLSX.read(fileBuffer);
    const sheetName = 'BASE CONE';
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      throw new Error(`Sheet "${sheetName}" not found in the XLSX file.`);
    }

    // Convert to CSV with semicolon delimiter
    const csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });

    // Writing with latin1 encoding as requested by the dashboard processing script
    fs.writeFileSync(OUTPUT_FILE, csvContent, { encoding: 'latin1' });
    
    console.log(`✅ Conversion complete: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
  }
}

convert();
