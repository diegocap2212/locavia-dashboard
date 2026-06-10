import fs from 'fs';
import path from 'path';

const data = JSON.parse(fs.readFileSync('src/data.json', 'utf8'));

const statusMap = {
    'DONE': ['CONCLUÍDO', 'DONE', 'RESOLVIDO', 'FINALIZADO', 'ENTREGUE', 'DESENV CONCLUIDO'],
    'WIP': ['EM DESENVOLVIMENTO', 'IN PROGRESS', 'DEVELOPMENT', 'EM EXECUÇÃO']
};

const summary: any = {};

data.forEach((item: any) => {
    const team = item.Team || 'SEM TIME';
    if (!summary[team]) summary[team] = { total: 0, done: 0, wip: 0 };
    summary[team].total++;
    
    const status = String(item.Status).toUpperCase();
    if (statusMap.DONE.some(s => status.includes(s))) {
        summary[team].done++;
    } else if (statusMap.WIP.some(s => status.includes(s))) {
        summary[team].wip++;
    }
});

console.log('--- RELATÓRIO FINAL DE IMPORTAÇÃO ---');
console.table(summary);
