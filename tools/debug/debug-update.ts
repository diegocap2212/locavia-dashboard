import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

async function debugUpdate() {
  console.log('🚀 Debugging update-data...');

  const files = fs.readdirSync(ROOT_DIR);
  const excelFiles = files
    .filter(f => f.endsWith('.xlsx'))
    .filter(f => f.startsWith('CONE-') || f.startsWith('base_cone') || f.startsWith('Cone LOCAVIA'))
    .sort((a, b) => {
      if (a.startsWith('Cone LOCAVIA') && !b.startsWith('Cone LOCAVIA')) return -1;
      if (!a.startsWith('Cone LOCAVIA') && b.startsWith('Cone LOCAVIA')) return 1;
      if (a.startsWith('CONE') && !b.startsWith('CONE')) return -1;
      if (!a.startsWith('CONE') && b.startsWith('CONE')) return 1;
      return b.localeCompare(a);
    });

  console.log('Detected files:', excelFiles);
  if (excelFiles.length > 0) {
    console.log(`Latest: ${excelFiles[0]}`);
  }
}

debugUpdate();
