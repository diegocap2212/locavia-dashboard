import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../src/data.json');

const getMon = (d: Date) => {
  const mon = new Date(d);
  mon.setDate(mon.getDate() - (mon.getDay() === 0 ? 6 : mon.getDay() - 1));
  mon.setHours(0,0,0,0);
  return mon;
};

const excelToJSDate = (dateStr: string | null) => {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (s === "" || s.toLowerCase() === "null") return null;
  if (s.includes('-')) return new Date(s);
  if (s.includes('/')) {
    const [datePart, timePart] = s.split(' ');
    const parts = datePart.split('/').map(Number);
    let [first, second, year] = parts;
    let day, month;
    if (first > 12) { day = first; month = second; }
    else { month = first; day = second; }
    let fullYear = year < 100 ? (year < 50 ? 2000 : 1900) + year : year;
    return new Date(fullYear, month - 1, day);
  }
  return null;
};

async function verify() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  console.log(`Total items in JSON: ${data.length}`);

  const resolvedItems = data.filter((i: any) => i.Resolved);
  console.log(`Total resolved items: ${resolvedItems.length}`);

  const weeklyStats: Record<string, number> = {};
  
  resolvedItems.forEach((i: any) => {
    const rDate = excelToJSDate(i.Resolved);
    if (rDate) {
      const mon = getMon(rDate).toISOString().split('T')[0];
      weeklyStats[mon] = (weeklyStats[mon] || 0) + 1;
    }
  });

  console.log('\n--- Throughput por Semana (Verificado) ---');
  Object.keys(weeklyStats).sort().forEach(week => {
    console.log(`${week}: ${weeklyStats[week]} itens`);
  });
}

verify();
