import { JiraApiIssue, DashboardItem } from '../src/types/jira';

const teamMapping: Record<string, string> = {
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
  'DATA LAKE DOMINIO': 'Relatórios de BI',
  'D.LAKE DOMINIO': 'Relatórios de BI',
  'DATA LAKE ESTRUTURANTE': 'Construção do Data Lake',
  'PLATAFORMA': 'Core System'
};

const prefixToCar: Record<string, string> = {
  'CTO': 'OPTIMUS',
  'VAA': 'NIVUS',
  'SN': 'SANTANA',
  'WA': 'GOL',
  'APV': 'FUSCA',
  'JAC': 'GOL',
  'MDD': 'SANTANA',
  'LKD': 'D.LAKE DOMINIO',
  'MIGRA': 'SANTANA',
  'COMP': 'SCANIA',
  'RM': 'JETTA' // Based on sample investigation
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

  let foundArea = '';
  let carRef = '';
  
  const teamToTry = rawTeam.toUpperCase();
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
    finalTeam = carRef && carRef !== foundArea ? `${carRef} (${foundArea})` : foundArea;
  } else if (rawTeam) {
    finalTeam = rawTeam;
  }

  // 2. Release Cleaning (Priority: O4R Pattern)
  const releaseFieldValues = (issue.fields.customfield_11330 || []) as string[];
  const fixVersions = (issue.fields.fixVersions || []).map((v: any) => v.name);
  const allReleasesRaw = [...releaseFieldValues, ...fixVersions];
  
  let finalRelease = 'OUTROS';
  const mainRelease = allReleasesRaw.find(p => p.toUpperCase().startsWith('O4R'));
  if (mainRelease) {
    finalRelease = mainRelease.toUpperCase().replace(/[^A-Z0-9]/g, '');
  } else {
    const backup = allReleasesRaw.find(p => ['BAF', 'CEM', 'BAF-QW'].includes(p.toUpperCase()));
    if (backup) finalRelease = backup.toUpperCase();
    else if (allReleasesRaw.length > 0) finalRelease = allReleasesRaw[0];
  }

  // 3. Status Categorization
  const statusName = (issue.fields.status?.name || '').toUpperCase();
  const categoryName = (issue.fields.status?.statusCategory?.name || '').toUpperCase();
  
  let category: DashboardItem['StatusCategory'] = 'TODO';
  
  // Statuses that represent "DONE" (refined to avoid false positives like "Ready for Dev")
  const statusNameLower = statusName.toLowerCase();
  
  if (categoryName.includes('DONE') || 
      ['CONCLUÍDO', 'DONE', 'RESOLVIDO', 'FINALIZADO', 'ENTREGUE', 'FECHADO', 'CONCLUIDO'].includes(statusName) ||
      statusName === 'PRONTO' // Only if exactly "PRONTO"
  ) {
    category = 'DONE';
  } else if (categoryName.includes('PROGRESS') || 
             ['EM DESENVOLVIMENTO', 'IN PROGRESS', 'EM ANDAMENTO', 'DESENVOLVENDO', 'SENDO DESENVOLVIDO', 'FIXING', 'REFINANDO', 'EM REFINAMENTO'].some(s => statusName.includes(s))
  ) {
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
    Source: 'api',
    Metadata: { source: 'api' }
  };
}
