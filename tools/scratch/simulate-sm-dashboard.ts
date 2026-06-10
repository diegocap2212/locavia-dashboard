import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../src/data.json');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

// Choose a SM config to simulate. Let's look at the config options.
// Let's read the sm-config file or we can just mock it.
// Wait, let's see what is inside src/config/sm-config.ts
const SM_CONFIGS = [
  {
    id: 'gabriela',
    name: 'Gabriela Pinheiro',
    avatar: 'GP',
    teams: [
      { carCode: 'TAOS', displayName: 'TAOS (Crédito)', keyPrefixes: ['CRED'], teamFieldValues: ['CREDITO', 'SALES_PROPOSTA'] },
      { carCode: 'NIVUS', displayName: 'NIVUS (Auto Atendimento)', keyPrefixes: ['VAA'], teamFieldValues: ['VENDAS_AUTO-ATENDIMENTO'] },
      { carCode: 'UP', displayName: 'UP (WhatsApp)', keyPrefixes: ['UP'], teamFieldValues: ['WHATSAPP'] }
    ]
  }
];

const smConfig = SM_CONFIGS[0];

const parseDate = (d) => {
  if (!d) return new Date(0);
  return new Date(d);
};

const isWithinInterval = (date, interval) => {
  const time = date.getTime();
  return time >= interval.start.getTime() && time <= interval.end.getTime();
};

const subDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
};

const startOfWeek = (date, options) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d;
};

const endOfWeek = (date, options) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  d.setDate(diff);
  d.setHours(23,59,59,999);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// Filter by SM and team
const selectedTeamId = 'ALL';
const daysAgo = 60;
const selectedRelease = 'ALL';

const teamsToInclude = smConfig.teams;

const filteredItems = data.filter(item => {
  const itemTeamUpper = (item.Team || '').toUpperCase();
  return teamsToInclude.some(t => 
    t.teamFieldValues.some(val => {
      const valUpper = val.toUpperCase();
      return itemTeamUpper.includes(valUpper) || valUpper.includes(itemTeamUpper);
    }) || 
    t.keyPrefixes.some(prefix => item.Key.startsWith(prefix))
  );
});

const now = new Date("2026-06-01T09:34:35-03:00"); // Use the user's current local time
const periodStart = subDays(now, daysAgo);

const releaseFilteredItems = filteredItems.filter(item => {
  return selectedRelease === 'ALL' || item.Release === selectedRelease;
});

const activeItems = releaseFilteredItems.filter(item => {
  const created = parseDate(item.Created);
  const updated = parseDate(item.UpdatedAt);
  return created >= periodStart || updated >= periodStart;
});

console.log(`Active items for SM ${smConfig.name}: ${activeItems.length}`);

// Generate weekly buckets (from periodStart to now)
const weeks = [];
let currStart = startOfWeek(periodStart, { weekStartsOn: 1 });
const periodEnd = endOfWeek(now, { weekStartsOn: 1 });

while (currStart <= periodEnd) {
  const currEnd = endOfWeek(currStart, { weekStartsOn: 1 });
  const weekLabel = `${currStart.getDate().toString().padStart(2, '0')}/${(currStart.getMonth() + 1).toString().padStart(2, '0')}`;
  
  let realizado = 0;
  
  activeItems.forEach(item => {
    const resolved = item.Resolved ? parseDate(item.Resolved) : null;
    const isResolvedInWeek = resolved && isWithinInterval(resolved, { start: currStart, end: currEnd });

    if (item.StatusCategory === 'DONE' && isResolvedInWeek) {
      realizado++;
    }
  });

  const createdThisWeek = activeItems.filter(item => {
    const created = parseDate(item.Created);
    return isWithinInterval(created, { start: currStart, end: currEnd });
  });

  const resolvedThisWeek = activeItems.filter(item => {
    const resolved = item.Resolved ? parseDate(item.Resolved) : null;
    return item.StatusCategory === 'DONE' && resolved && isWithinInterval(resolved, { start: currStart, end: currEnd });
  });

  weeks.push({
    weekLabel,
    entradas: createdThisWeek.length,
    saidas: resolvedThisWeek.length,
    realizado,
    saldo: createdThisWeek.length - resolvedThisWeek.length
  });

  currStart = addDays(currStart, 7);
}

console.log('\n--- SM Dashboard Weekly Flow Data ---');
weeks.forEach(w => {
  console.log(`Week: ${w.weekLabel} | Entradas (Criadas): ${w.entradas} | Saídas (Entregues/Realizado): ${w.saidas} | Saldo: ${w.saldo}`);
});

const doneCount = activeItems.filter(i => i.StatusCategory === 'DONE').length;
console.log(`\nTotal DONE items in active period: ${doneCount}`);
const doneCountWithResolved = activeItems.filter(i => i.StatusCategory === 'DONE' && i.Resolved).length;
console.log(`DONE items with Resolved date in active period: ${doneCountWithResolved}`);
const doneCountWithoutResolved = activeItems.filter(i => i.StatusCategory === 'DONE' && !i.Resolved).length;
console.log(`DONE items without Resolved date in active period: ${doneCountWithoutResolved}`);
