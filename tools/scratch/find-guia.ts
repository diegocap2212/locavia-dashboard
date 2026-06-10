import fs from 'fs';
import path from 'path';

function findFile(dir: string, fileName: string): string | null {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file !== 'node_modules' && file !== '.git') {
            const found = findFile(fullPath, fileName);
            if (found) return found;
          }
        } else if (file.toLowerCase() === fileName.toLowerCase()) {
          return fullPath;
        }
      } catch (e) {}
    }
  } catch (e) {}
  return null;
}

const scratchDir = 'C:\\Users\\Usuario\\.gemini\\antigravity\\scratch';
console.log('Searching in:', scratchDir);
const foundPath = findFile(scratchDir, 'guia_jira.md');
console.log('Result:', foundPath);
