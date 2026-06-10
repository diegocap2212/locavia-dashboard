import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '../src/data.json');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const SM_CONFIGS = [
  {
    id: 'gabriela',
    name: 'Gabriela',
    avatar: 'GA',
    teams: [
      { carCode: 'TAOS', displayName: 'Taos', teamFieldValues: ['TAOS'], keyPrefixes: ['TAOS'] },
      { carCode: 'GOL', displayName: 'Gol', teamFieldValues: ['GOL'], keyPrefixes: ['GOL', 'LI'] },
      { carCode: 'SALESFORCE', displayName: 'SFMktplace', teamFieldValues: ['FUSCA', 'SALES_FORCE', 'SALES FORCE'], keyPrefixes: ['APV', 'SFMKT'] },
    ]
  },
  {
    id: 'rafael',
    name: 'Rafael',
    avatar: 'RA',
    teams: [
      { carCode: 'OPTIMUS', displayName: 'Optimus', teamFieldValues: ['OPTIMUS'], keyPrefixes: ['CTO'] },
      { carCode: 'NIVUS', displayName: 'Nivus', teamFieldValues: ['NIVUS'], keyPrefixes: ['VAA'] },
      { carCode: 'JETTA', displayName: 'Jetta', teamFieldValues: ['JETTA'], keyPrefixes: ['JETTA', 'JVE'] },
    ]
  },
  {
    id: 'ed',
    name: 'Ed',
    avatar: 'ED',
    teams: [
      { carCode: 'SCANIA', displayName: 'Scania', teamFieldValues: ['SCANIA', 'SCANIA S 650'], keyPrefixes: ['SCANIA'] },
      { carCode: 'PARATI', displayName: 'Parati', teamFieldValues: ['PARATI'], keyPrefixes: ['PARATI'] },
    ]
  }
];

const parseDate = (d) => {
  if (!d) return new Date(0);
  return new Date(d);
};

const isWithinInterval = (date, interval) => {
  const time = date.getTime();
  return time >= interval.start.getTime() && time <= interval.end.getTime();
};

const startOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d;
};

const endOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7);
  d.setDate(diff);
  d.setHours(23,59,59,999);
  return d;
};

const subDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const now = new Date("2026-06-01T09:34:35-03:00");
const daysAgo = 60;
const periodStart = subDays(now, daysAgo);

SM_CONFIGS.forEach(smConfig => {
  console.log(`\n==========================================`);
  console.log(`SM: ${smConfig.name}`);
  console.log(`==========================================`);
  
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
  
  const activeItems = filteredItems.filter(item => {
    const created = parseDate(item.Created);
    const updated = parseDate(item.UpdatedAt);
    return created >= periodStart || updated >= periodStart;
  });

  console.log(`Active items: ${activeItems.length}`);
  const doneCount = activeItems.filter(i => i.StatusCategory === 'DONE').length;
  console.log(`Total DONE items in active period: ${doneCount}`);

  let currStart = startOfWeek(periodStart);
  const periodEnd = endOfWeek(now);
  
  while (currStart <= periodEnd) {
    const currEnd = endOfWeek(currStart);
    const weekLabel = `${currStart.getDate().toString().padStart(2, '0')}/${(currStart.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const createdThisWeek = activeItems.filter(item => {
      const created = parseDate(item.Created);
      return isWithinInterval(created, { start: currStart, end: currEnd });
    });

    const resolvedThisWeek = activeItems.filter(item => {
      const resolved = item.Resolved ? parseDate(item.Resolved) : null;
      return item.StatusCategory === 'DONE' && resolved && isWithinInterval(resolved, { start: currStart, end: currEnd });
    });

    console.log(`  Week: ${weekLabel} | Entradas: ${createdThisWeek.length} | Saídas: ${resolvedThisWeek.length} | Saldo: ${createdThisWeek.length - resolvedThisWeek.length}`);
    currStart = addDays(currStart, 7);
  }
});
