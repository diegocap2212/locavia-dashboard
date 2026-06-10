import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('src/data.json', 'utf8'));

const releaseSummary: any = {};

data.forEach((item: any) => {
    const team = item.Team || 'SEM TIME';
    const release = item.Release || 'SEM RELEASE';
    const combo = `${team} | ${release}`;
    
    if (!releaseSummary[combo]) releaseSummary[combo] = { total: 0, done: 0 };
    releaseSummary[combo].total++;
    
    if (item.StatusCategory === 'DONE') {
        releaseSummary[combo].done++;
    }
});

console.log('--- DASHBOARD DATA BY TEAM AND RELEASE ---');
console.table(Object.entries(releaseSummary).map(([key, val]: any) => ({
    TeamRelease: key,
    ...val
})).sort((a, b) => a.TeamRelease.localeCompare(b.TeamRelease)));
