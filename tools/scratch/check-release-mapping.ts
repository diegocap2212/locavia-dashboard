import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const csvPath = path.resolve(process.cwd(), 'base_cone.csv');
if (!fs.existsSync(csvPath)) {
  console.error('base_cone.csv not found');
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, 'latin1');
const records = parse(raw, {
  delimiter: ';',
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  trim: true
});

const knownReleases = ['O4R1', 'O4R2', 'O4R3', 'BAF', 'BAF-QW', 'CEM', 'CEM-R1', 'CEM-R2'];

const releaseCounts: Record<string, number> = {};

records.forEach((r: any) => {
  const releaseRaw = String(r['release'] || r['Campo personalizado (Release)'] || '');
  let release = '';
  if (releaseRaw) {
      const releaseParts = releaseRaw.split(';').map(p => p.trim().toUpperCase());
      const matched = releaseParts.find(p => knownReleases.includes(p));
      if (matched) {
         release = matched;
      } else {
         const o4rMatch = releaseParts.find(p => p.startsWith('O4R'));
         if (o4rMatch) {
            release = o4rMatch.replace(/[^A-Z0-9]/g, '');
         } else {
            const backup = releaseParts[0];
            if (backup) {
              release = backup;
            }
         }
      }
  }
  const finalRelease = release || 'OUTROS';
  releaseCounts[finalRelease] = (releaseCounts[finalRelease] || 0) + 1;
});

console.log('Processed Release Distribution:');
console.table(releaseCounts);
