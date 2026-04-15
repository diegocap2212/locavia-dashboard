
import data from '../src/data.json';

const SQUADS = [
    { name: 'Portal de Vendas Assistidas', expected: 6 },
    { name: 'Contratos / Multas / Ressarcimento / Manutenção', expected: 16 },
    { name: 'Faturamento', expected: 3 },
    { name: 'Portal de Auto Atendimento', expected: 10 },
    { name: 'Crédito e Proposta', expected: 10 },
    { name: 'Pós Venda Salesforce', expected: 10 },
    { name: 'Atendimento WhatsApp', expected: 13 }
];

const WEEK_END_06_04 = new Date('2026-04-12T23:59:59');

const EARLY_BACKLOG_STATUSES = [
    '1. BACKLOG',
    'BACKLOG',
    'EM REFINAMENTO',
    'REFINANDO',
    'A REFINAR',
    'SANEAMENTO',
    'ESPERANDO'
];

console.log(`Comparing Tool Numbers with Spreadsheet (Week of 06-04)`);
console.log(`Filter: Excluding Early Backlog Statuses`);
console.log(`---------------------------------------------------------`);

SQUADS.forEach(squad => {
    const items = data.filter(i => {
        const teamMatch = i.Team === squad.name;
        
        // Release normalization
        let release = String(i.Release || '').toUpperCase();
        if (release.includes('ONDA 4') && release.includes('RELEASE 2')) release = 'O4R2';
        if (release.includes('WAVE 4') && release.includes('RELEASE 2')) release = 'O4R2';
        
        return teamMatch && release === 'O4R2';
    });
    
    const remaining = items.filter(i => {
        const created = new Date(i.Created);
        const resolved = i.Resolved ? new Date(i.Resolved) : null;
        
        if (created > WEEK_END_06_04) return false;
        if (resolved && resolved <= WEEK_END_06_04) return false;
        
        // Sanity Filter (Refined Backlog Only)
        if (EARLY_BACKLOG_STATUSES.includes(i.Status.toUpperCase())) return false;
        
        return true;
    }).length;

    const diff = remaining - squad.expected;
    const status = diff === 0 ? 'MATCH ✅' : `MISMATCH ❌ (Tool: ${remaining}, Spreadsheet: ${squad.expected})`;
    
    console.log(`${squad.name.padEnd(45)}: ${status}`);
});
