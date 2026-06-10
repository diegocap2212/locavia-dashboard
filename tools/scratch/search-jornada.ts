import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (filePath: string) => void) {
  try {
    fs.readdirSync(dir).forEach(f => {
      let dirPath = path.join(dir, f);
      try {
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
          if (f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== '.vercel' && f !== 'scratch' && f !== 'playwright-report') {
            walkDir(dirPath, callback);
          }
        } else {
          callback(dirPath);
        }
      } catch (err) {}
    });
  } catch (err) {}
}

const terms = ['jornada', 'parati', 'rm'];
const results: string[] = [];

walkDir(process.cwd(), (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.json') || filePath.endsWith('.md')) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const matched = terms.filter(t => content.toLowerCase().includes(t));
      if (matched.length > 0) {
        results.push(`${filePath} matches [${matched.join(', ')}]`);
      }
    } catch (err) {}
  }
});

console.log('=== MATCHING FILES ===');
results.forEach(r => console.log(r));
