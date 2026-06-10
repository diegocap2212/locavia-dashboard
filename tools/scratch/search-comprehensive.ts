import fs from 'fs';
import path from 'path';

const dirs = [
  path.join(process.cwd(), 'scripts/debug-helpers'),
  path.join(process.cwd(), 'scratch'),
  process.cwd()
];

const searchTerms = ['jornada', 'parati', 'rm-', 'buy a feature'];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    if (!fs.statSync(filePath).isFile()) return;
    if (file.endsWith('.txt') || file.endsWith('.md') || file.endsWith('.ts') || file.endsWith('.json')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        searchTerms.forEach(term => {
          if (line.toLowerCase().includes(term)) {
            console.log(`[${file}:${idx+1}] (${term}): ${line.trim().slice(0, 150)}`);
          }
        });
      });
    }
  });
});
