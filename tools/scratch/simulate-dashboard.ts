import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../src/data.json');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Replicate hook code logic
const LOCAVIA_EXCLUDED_STATUSES = ['DESCARTADO', 'CANCELADO', 'NOGO'];
const LOCAVIA_RELEASES = new Set(['O4R1', 'O4R2', 'O4R3']);

const excelToJSDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr);
};

const getMon = (d) => {
  const mon = new Date(d);
  mon.setDate(mon.getDate() - (mon.getDay() === 0 ? 6 : mon.getDay() - 1));
  mon.setHours(0,0,0,0);
  return mon;
};

const formatWeekRange = (date) => {
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 6);
  const f = (d) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${f(start)} - ${f(end)}`;
};

// Normalize data
const rawItems = data.map(item => {
  let release = String(item.Release || 'OUTROS').toUpperCase();
  if (release.includes('ONDA 4') && release.includes('RELEASE 2')) release = 'O4R2';
  if (release.includes('WAVE 4') && release.includes('RELEASE 2')) release = 'O4R2';
  if (release.includes('ASSINECAR')) release = 'O4R2';
  if (release.includes('ONDA 4') && release.includes('RELEASE 1')) release = 'O4R1';
  if (release.includes('WAVE 4') && release.includes('RELEASE 1')) release = 'O4R1';

  return {
    Type: String(item.Type || ''),
    Key: String(item.Key || ''),
    Summary: item.Summary,
    Status: typeof item.Status === 'string' ? item.Status.toUpperCase() : 'UNKNOWN',
    StatusCategory: item.StatusCategory || 'TODO',
    Team: String(item.Team || ''),
    Created: String(item.Created || ''),
    Resolved: item.Resolved ? String(item.Resolved) : null,
    UpdatedAt: item.UpdatedAt ? String(item.UpdatedAt) : String(item.Created || ''),
    Release: release,
  };
});

// Filter for locavia
const filtered = rawItems.filter(item => {
  if (!LOCAVIA_RELEASES.has(item.Release)) return false;
  if (LOCAVIA_EXCLUDED_STATUSES.includes(item.Status)) return false;
  return true;
});

console.log(`Filtered items count for LOCAVIA: ${filtered.length}`);

// Generate weekly stats
const minDate = filtered.reduce((m, i) => {
  const d = excelToJSDate(i.Created);
  return (d && d < m) ? d : m;
}, new Date());

console.log('Min Date in filtered list:', minDate.toISOString());

const weeklyStats = [];
let curr = getMon(minDate);
const now = new Date();

while (curr <= now || weeklyStats.length < 5) {
  const wStart = new Date(curr);
  const wEnd = new Date(curr.getTime() + 7 * 86400000);
  
  const resolved = filtered.filter(i => {
     const r = i.Resolved ? excelToJSDate(i.Resolved) : excelToJSDate(i.UpdatedAt);
     return i.StatusCategory === 'DONE' && r && r >= wStart && r < wEnd;
  });
  
  const inflow = filtered.filter(i => {
     const c = excelToJSDate(i.Created);
     return c && c >= wStart && c < wEnd;
  }).length;

  weeklyStats.push({
    name: formatWeekRange(wStart),
    "Saídas": resolved.length,
    "Entradas": inflow,
    "Saldo": inflow - resolved.length,
    date: wStart
  });
  curr.setDate(curr.getDate() + 7);
}

const recentStats = weeklyStats.slice(-18);
console.log('\n--- Weekly stats (Last 18 weeks) ---');
recentStats.forEach(s => {
  console.log(`Week: ${s.name} | Entradas: ${s.Entradas} | Saídas: ${s.Saídas} | Saldo: ${s.Saldo}`);
});
