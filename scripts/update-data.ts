import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const ROOT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSV_FILE = path.join(ROOT_DIR, 'base_cone.csv');

async function updateData() {
  console.log('🚀 Iniciando atualização de dados...');

  // 1. Encontrar o arquivo Excel mais recente
  const files = fs.readdirSync(ROOT_DIR);
  const excelFiles = files
    .filter(f => f.endsWith('.xlsx'))
    .filter(f => f.startsWith('CONE-') || f.startsWith('base_cone') || f.startsWith('Cone LOCAVIA'))
    .sort((a, b) => {
      // Prioritize files with "AUTOMAÇÃO"
      const hasAutoA = a.toUpperCase().includes('AUTOMAÇÃO');
      const hasAutoB = b.toUpperCase().includes('AUTOMAÇÃO');
      if (hasAutoA && !hasAutoB) return -1;
      if (!hasAutoA && hasAutoB) return 1;

      // Prioritize new pattern starting with "Cone LOCAVIA"
      if (a.startsWith('Cone LOCAVIA') && !b.startsWith('Cone LOCAVIA')) return -1;
      if (!a.startsWith('Cone LOCAVIA') && b.startsWith('Cone LOCAVIA')) return 1;
      
      // Prioritize CONE over base_cone
      if (a.startsWith('CONE') && !b.startsWith('CONE')) return -1;
      if (!a.startsWith('CONE') && b.startsWith('CONE')) return 1;
      
      // Then sort by name descending
      return b.localeCompare(a);
    });

  if (excelFiles.length === 0) {
    console.error('❌ Nenhum arquivo .xlsx (começando com CONE ou base_cone) encontrado.');
    process.exit(1);
  }

  const latestExcel = excelFiles[0];
  console.log(`📂 Arquivo detectado: ${latestExcel}`);

  try {
    // 2. Converter para CSV (preservando o formato esperado pelo dashboard)
    console.log(`🔄 Abrindo arquivo: ${latestExcel}...`);
    // Safe reading for ESM
    const workbook = XLSX.read(fs.readFileSync(path.join(ROOT_DIR, latestExcel)));
    
    // Find sheet BASE CONE (case-insensitive and trimmed)
    const sheetName = workbook.SheetNames.find(s => s.trim().toUpperCase() === 'BASE CONE');
    
    if (!sheetName) {
      console.error('Planilhas disponíveis:', workbook.SheetNames);
      throw new Error(`Planilha "BASE CONE" não encontrada no arquivo.`);
    }
    
    console.log(`🔄 Convertendo aba "${sheetName}" para CSV...`);
    const worksheet = workbook.Sheets[sheetName];
    const csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
    fs.writeFileSync(CSV_FILE, csvContent, { encoding: 'latin1' });
    console.log('✅ CSV temporário gerado em base_cone.csv');

    // 3. Processar o CSV para JSON
    console.log('⚙️ Executando: npx tsx scripts/process-local-csv.ts');
    execSync('npx tsx scripts/process-local-csv.ts', { stdio: 'inherit' });

    // 4. Verificação final
    console.log('🔍 Executando: npx tsx scripts/verify-data.ts');
    execSync('npx tsx scripts/verify-data.ts', { stdio: 'inherit' });

    console.log('\n✨ Atualização finalizada com sucesso! ✨');
  } catch (error) {
    const err = error as Error;
    console.error('❌ Erro durante a atualização:', err.message || err);
    if (err.stack) console.error(err.stack);
    process.exit(1);
  }
}

updateData();
