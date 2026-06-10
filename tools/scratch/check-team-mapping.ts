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

const unmapped: Record<string, number> = {};
const mappedCounts: Record<string, number> = {};

records.forEach((r: any) => {
  const tCol = String(r['time'] || '').replace(/;;/g, '').trim().toUpperCase();
  const cCol = String(r['Campo personalizado (Time)'] || '').replace(/;;/g, '').trim().toUpperCase();
  
  const rawValues = [tCol, cCol].filter(v => v && v !== ';;');
  let found = false;
  
  for (const val of rawValues) {
    const parts = val.split(';').map(p => p.trim());
    for (const p of parts) {
      if (teamMapping[p]) {
        mappedCounts[teamMapping[p]] = (mappedCounts[teamMapping[p]] || 0) + 1;
        found = true;
        break;
      }
    }
    if (found) break;
  }
  
  if (!found && rawValues.length > 0) {
    const key = rawValues.join(';');
    unmapped[key] = (unmapped[key] || 0) + 1;
  }
});

console.log('Mapped Area Counts:');
console.table(mappedCounts);

console.log('\nUnmapped values:');
console.table(unmapped);
