import { JiraApiIssue, DashboardItem } from '../src/types/jira';

const teamMapping: Record<string, string> = {
  // De-para baseado na coluna "time" da planilha CSV
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
  
  // Siglas de fallback
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
  'D.LAKE DOMINIO': 'Relatórios de BI'
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
  'LI': 'GOL'
};

export function mapJiraIssueToDashboardItem(issue: JiraApiIssue): DashboardItem {
  // 1. Team Mapping (Using multiple fields + key prefix fallback)
  const key = issue.key;
  const prefix = key.split('-')[0].toUpperCase();
  
  // Potential Team fields: customfield_11795 (Time), customfield_10001 (Team)
  const timeField = issue.fields.customfield_11795;
  const teamField = issue.fields.customfield_10001;
  const jornadaValues = (issue.fields.customfield_12386 || []) as string[];

  let rawTeam = '';
  if (timeField && timeField.value) rawTeam = timeField.value;
  else if (teamField && teamField.value) rawTeam = teamField.value;
  else if (jornadaValues.length > 0) rawTeam = jornadaValues[0];
  else if (issue.fields.labels && issue.fields.labels.length > 0) {
    const matchedLabel = (issue.fields.labels as string[]).find(l => teamMapping[l.toUpperCase()]);
    if (matchedLabel) rawTeam = matchedLabel;
  }

  let foundArea = '';
  let carRef = '';
  
  const teamToTry = rawTeam.toUpperCase().replace(/\s+/g, '_');
  if (teamMapping[teamToTry]) {
    foundArea = teamMapping[teamToTry];
    carRef = teamToTry;
  } else {
    // Search for known keywords in the raw string (e.g. "SCANIA S 650" should match "SCANIA")
    const knownCars = Object.keys(teamMapping);
    const matched = knownCars.find(c => teamToTry.includes(c));
    if (matched) {
      foundArea = teamMapping[matched];
      carRef = matched;
    }
  }

  // Prefix Fallback
  if (!foundArea && prefixToCar[prefix]) {
    const carFromPrefix = prefixToCar[prefix];
    foundArea = teamMapping[carFromPrefix] || carFromPrefix;
    carRef = carFromPrefix;
  }

  let finalTeam = 'OUTROS SQUADS';
  if (foundArea) {
    finalTeam = foundArea;
  } else if (rawTeam) {
    finalTeam = rawTeam;
  }

  // 2. Release Cleaning (Priority: O4R Pattern)
  const releaseFieldValues = (issue.fields.customfield_11330 || []) as string[];
  const fixVersions = (issue.fields.fixVersions || []).map((v: any) => v.name);
  const allReleasesRaw = [...releaseFieldValues, ...fixVersions];
  
  let finalRelease = 'OUTROS';
  
  // 1. Tentar encontrar padrão O4R (O4R1, O4R2, etc)
  const mainRelease = allReleasesRaw.find(p => p.toUpperCase().startsWith('O4R'));
  if (mainRelease) {
    finalRelease = mainRelease.toUpperCase().replace(/[^A-Z0-9]/g, '');
  } else {
    // 2. Mapeamento Inteligente para O4R (O4R1, O4R2)
    const isO4R2 = allReleasesRaw.some(p => {
        const up = p.toUpperCase();
        return (up.includes('W4') && up.includes('R2')) || 
               (up.includes('WAVE 4') && up.includes('RELEASE 2')) ||
               (up.includes('ONDA 4') && up.includes('RELEASE 2'));
    });
    
    const isO4R1 = allReleasesRaw.some(p => {
        const up = p.toUpperCase();
        return (up.includes('W4') && up.includes('R1')) || 
               (up.includes('WAVE 4') && up.includes('RELEASE 1')) ||
               (up.includes('ONDA 4') && up.includes('RELEASE 1'));
    });
    
    if (isO4R2 || allReleasesRaw.some(p => p === '2024.1')) {
        finalRelease = 'O4R2';
    } else if (isO4R1) {
        finalRelease = 'O4R1';
    } else {
        // Backups comuns na planilha (CEM-R1/CEM-R2 agrupados como CEM-R1 e CEM-R2 para paridade)
        const backups = ['BAF', 'BAF-QW', 'CEM-R1', 'CEM-R2', 'CEM', 'WHATSAPP', 'MOB', 'ESTOQUE', 'CONTRATOS', 'COMPRAS'];
        const backup = allReleasesRaw.find(p => backups.includes(p.toUpperCase()));
        if (backup) finalRelease = backup.toUpperCase();
        else if (allReleasesRaw.length > 0) finalRelease = allReleasesRaw[0];
    }
  }

  // 3. Status Categorization
  const statusName = (issue.fields.status?.name || '').toUpperCase();
  const categoryName = (issue.fields.status?.statusCategory?.name || '').toUpperCase();
  
  let category: DashboardItem['StatusCategory'] = 'TODO';
  
  // Statuses that represent "DONE" (refined for full parity with CSV)
  const doneStatuses = ['CONCLUIDO', 'CONCLUÍDO', 'DESENV CONCLUIDO', 'TESTE CONCLUIDO', 'DONE', 'RESOLVIDO', 'FINALIZADO', 'ENTREGUE', 'FECHADO', 'ENTREGA FINALIZADA'];
  const inProgressStatuses = ['EM DESENVOLVIMENTO', 'IN PROGRESS', 'EM ANDAMENTO', 'DESENVOLVENDO', 'SENDO DESENVOLVIDO', 'FIXING', 'REFINANDO', 'EM REFINAMENTO', 'AGUARDANDO QA', 'QA EM PROGRESSO', 'AGUARDANDO CODE REVIEW', 'CODE REVIEW EM PROGRESSO', 'EM TESTE', 'AGUARDANDO TESTE', 'NOVAS ATIVIDADES', 'ATIVIDADES EM ANDAMENTO', 'PRONTO PARA DESENVOLVER', 'PRONTO PRA DESENVOLVER', 'PRIORIZADO', 'AGUARDANDO DEPLOY QA', 'AGUARDANDO DEPLOY PROD', 'AGUARDANDO HOMOLOG', 'HOMOLOG EM PROGRESSO'];

  if (categoryName.includes('DONE') || doneStatuses.some(s => statusName === s || statusName.includes(s))) {
    category = 'DONE';
  } else if (categoryName.includes('PROGRESS') || inProgressStatuses.some(s => statusName === s || statusName.includes(s))) {
    category = 'IN_PROGRESS';
  }

  return {
    Type: issue.fields.issuetype?.name || 'Task',
    Key: key,
    Summary: issue.fields.summary || '',
    Status: statusName,
    StatusCategory: category,
    Team: finalTeam,
    Created: issue.fields.created,
    Resolved: issue.fields.resolutiondate || null,
    Release: finalRelease,
    StoryPoints: null,
    Priority: issue.fields.priority?.name || 'Medium',
    Assignee: issue.fields.assignee?.displayName || null,
    Labels: issue.fields.labels || [],
    CycleTime: null,
    LeadTime: null,
    TimeInStatus: {},
    Source: 'api'
  };
}
