import fs from 'fs';
import { parse } from 'csv-parse/sync';

const rawCsv = fs.readFileSync('base_cone.csv', 'latin1');
const records = parse(rawCsv, {
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  trim: true,
  delimiter: ';'
});

const teamMapping: Record<string, string> = {
  'WHATSAPP': 'Atendimento WhatsApp',
  'COMERCIAL': 'Crédito e Proposta',
  'POS_VENDA': 'Pós Venda Salesforce',
  'MIGRA_BLIP': 'Portal de Auto Atendimento',
  'VENDAS_AUTO-ATENDIMENTO': 'Portal de Auto Atendimento',
  'CONTRATOS': 'Contratos / Multas / Ressarcimento / Manutenção',
  'MOB': 'Mobilização',
  'SEMINOVOS': 'Seminovos',
  'ESTOQUE': 'Compras e Estoque',
  'FATURAMENTO': 'Faturamento',
  'GOVERNANÇA_DADOS': 'Governança de Dados',
  'VENDAS_ASSISTIDAS': 'Portal de Vendas Assistidas',
  'MANUTENÇÃO': 'Contratos / Multas / Ressarcimento / Manutenção',
  'MULTAS': 'Contratos / Multas / Ressarcimento / Manutenção',
  'CADASTRO_DE_USUÁRIO': 'Core System',
  'COMPRAS': 'Compras e Estoque',
  'ATENDIMENTO': 'Core System',
  'MOB/DESMOB': 'Mobilização',
  'RESSARCIMENTO': 'Contratos / Multas / Ressarcimento / Manutenção',
  'COBRANÇA': 'Core System',
  'PRICING': 'Pricing',
  'MIGRAÇÃO': 'Migração de Dados',
  'LAKE-DOMINIO': 'Relatórios de BI',
  'LAKE-ESTRUTURANTE': 'Construção do Data Lake',
  'BI/LAKE': 'Relatórios de BI',
  'PROPOSTA': 'Crédito e Proposta',
  'RISCO': 'Crédito e Proposta',
  'CREDITO': 'Crédito e Proposta',
  'SALESFORCE_PÓSVEND': 'Pós Venda Salesforce',
  'PAGAMENTOS': 'Crédito e Proposta',
  'GOL': 'Portal de Vendas Assistidas',
  'TERA': 'Faturamento',
  'OPTIMUS': 'Contratos / Multas / Ressarcimento / Manutenção',
  'AMAROK': 'Contratos / Multas / Ressarcimento / Manutenção',
  'SCANIA': 'Compras e Estoque',
  'JETTA': 'Mobilização',
  'TIGUAN': 'Sustentação (Bugs)',
  'PARATI': 'Evoluções / Buy a Feature',
  'NIVUS': 'Portal de Auto Atendimento',
  'UP': 'Atendimento WhatsApp',
  'SANTANA': 'Migração de Dados',
  'TAOS': 'Crédito e Proposta',
  'FUSCA': 'Pós Venda Salesforce',
  'PLATAFORMA': 'Core System',
  'D.LAKE DOMINIO': 'Relatórios de BI',
  'DATA LAKE DOMINIO': 'Relatórios de BI',
  'DATA LAKE ESTRUTURANTE': 'Construção do Data Lake'
};

const prefixToCar: Record<string, string> = {
  'CTO': 'OPTIMUS',
  'VAA': 'NIVUS',
  'SN': 'SANTANA',
  'WA': 'WHATSAPP',
  'UP': 'UP',
  'APV': 'SALESFORCE_PÓSVEND',
  'JAC': 'WHATSAPP',
  'MDD': 'SANTANA',
  'LKD': 'LAKE-DOMINIO',
  'MIGRA': 'MIGRAÇÃO',
  'COMP': 'COMPRAS',
  'RM': 'JETTA',
  'TERA': 'FATURAMENTO',
  'PRICI': 'PRICING',
  'LI': 'GOL',
  'MP': 'COMPRAS',
  'JVE': 'JETTA',
  'MAN': 'MANUTENÇÃO',
  'CRED': 'CREDITO',
  'DESMOB': 'MIGRAÇÃO',
  'MS': 'FATURAMENTO',
  'GOL': 'GOL'
};

const headers = Object.keys(records[0]);
const mapping = {
  Key: 'Chave da item',
  Team: 'time',
  CustomTeam: 'Campo personalizado (Time)',
};

const rmRecords = records.filter((r: any) => String(r[mapping.Key] || '').toUpperCase().startsWith('RM-'));

console.log(`Analyzing ${rmRecords.length} RM records...`);

const oldTeams: Record<string, number> = {};
const newTeams: Record<string, number> = {};

rmRecords.forEach((r: any) => {
  const teamRaw = String(r[mapping.Team] || '').replace(/;;/g, '').trim();
  const customTeamRaw = String(r[mapping.CustomTeam] || '').replace(/;;/g, '').trim();
  const key = String(r[mapping.Key]).toUpperCase();
  
  // 1. Old logic (teamRaw first)
  let oldArea = '';
  const oldRawValues = [teamRaw, customTeamRaw].filter(v => v && v !== ';;');
  const oldPossible = oldRawValues.join(';').split(';').map(v => v.trim().toUpperCase());
  for (const t of oldPossible) {
    if (teamMapping[t]) { oldArea = teamMapping[t]; break; }
  }
  if (!oldArea && key) {
    const prefix = key.split('-')[0];
    const car = prefixToCar[prefix];
    if (car) oldArea = teamMapping[car] || car;
  }
  const oldTeam = oldArea || 'OUTROS SQUADS';
  oldTeams[oldTeam] = (oldTeams[oldTeam] || 0) + 1;

  // 2. New logic (customTeamRaw first)
  let newArea = '';
  const newRawValues = [customTeamRaw, teamRaw].filter(v => v && v !== ';;');
  const newPossible = newRawValues.join(';').split(';').map(v => v.trim().toUpperCase());
  for (const t of newPossible) {
    if (teamMapping[t]) { newArea = teamMapping[t]; break; }
  }
  if (!newArea && key) {
    const prefix = key.split('-')[0];
    const car = prefixToCar[prefix];
    if (car) newArea = teamMapping[car] || car;
  }
  const newTeam = newArea || 'OUTROS SQUADS';
  newTeams[newTeam] = (newTeams[newTeam] || 0) + 1;
});

console.log('\nOLD Mapping Counts:');
Object.entries(oldTeams).sort((a,b) => b[1] - a[1]).forEach(([t, count]) => {
  console.log(`- ${t}: ${count}`);
});

console.log('\nNEW Mapping Counts:');
Object.entries(newTeams).sort((a,b) => b[1] - a[1]).forEach(([t, count]) => {
  console.log(`- ${t}: ${count}`);
});
