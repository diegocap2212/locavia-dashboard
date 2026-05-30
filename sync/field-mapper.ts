import { JiraApiIssue, DashboardItem } from '../src/types/jira';

const teamMapping: Record<string, string> = {
  // Aliases based on user provided table
  'VENDAS_ASSISTIDAS': 'GOL',
  'FATURAMENTO': 'TERA',
  'S&D': 'OPTIMUS',
  'COMERCIAL': 'NIVUS',
  'CRÉDITO': 'TAOS',
  'SALES_FORCE': 'FUSCA',
  'WHATSAPP': 'UP',
  'D.LAKE': 'BI',
  'D.LAKE_DOMINIO': 'BI',
  'COMPRAS': 'CEM',
  'ESTOQUE': 'CEM',
  'MOB': 'CEM'
};

const prefixToCar: Record<string, string> = {
  'CTO': 'OPTIMUS',
  'VAA': 'NIVUS',
  'APV': 'FUSCA',
  'LI': 'GOL',
  'JVE': 'JETTA'
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
  
  // Statuses that represent "DONE":
  // Primary gate: DESENV CONCLUÍDO (planilha conta entrega aqui para filhos US/Task/Bug/Spike)
  // Post-dev statuses: itens já passaram do gate de desenvolvimento, portanto também são DONE
  const doneStatuses = [
    'CONCLUIDO', 'CONCLUÍDO', 'DESENV CONCLUIDO', 'DESENV CONCLUÍDO',
    'DONE', 'RESOLVIDO', 'FINALIZADO', 'ENTREGUE', 'FECHADO', 'ENTREGA FINALIZADA',
    'TESTE CONCLUIDO', 'AGUARDANDO QA', 'QA EM PROGRESSO',
    'EM TESTE', 'AGUARDANDO TESTE',
    'AGUARDANDO DEPLOY QA', 'AGUARDANDO DEPLOY PROD',
    'AGUARDANDO HOMOLOG', 'HOMOLOG EM PROGRESSO',
  ];
  const inProgressStatuses = ['EM DESENVOLVIMENTO', 'IN PROGRESS', 'EM ANDAMENTO', 'DESENVOLVENDO', 'SENDO DESENVOLVIDO', 'FIXING', 'REFINANDO', 'EM REFINAMENTO', 'AGUARDANDO CODE REVIEW', 'CODE REVIEW EM PROGRESSO', 'NOVAS ATIVIDADES', 'ATIVIDADES EM ANDAMENTO', 'PRONTO PARA DESENVOLVER', 'PRONTO PRA DESENVOLVER', 'PRIORIZADO'];

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
    UpdatedAt: issue.fields.updated || issue.fields.created,
    Release: finalRelease,
    StoryPoints: null,
    Priority: issue.fields.priority?.name || 'Medium',
    Assignee: issue.fields.assignee?.displayName || null,
    Labels: issue.fields.labels || [],
    CommitmentDate: issue.fields.customfield_10102 || null, // Data de Compromentimento
    StartDate: issue.fields.customfield_10015 || null,      // Start date
    FuraFila: issue.fields.customfield_10165 || [],         // Fura Fila
    NaturezaDemanda: issue.fields.customfield_12683 || [],  // Natureza da Demanda
    CycleTime: null,
    TimeInTodo: null,
    LeadTime: null,
    LeadTimeP85: null,
    LeadTimeP15: null,
    TimeInStatus: {},
    IsPlanned: false, // Calculated later
    DataQuality: {
      missingResolutionDate: false,
      missingAssignee: false,
      noStatusTransitions: false,
      noSprint: false,
      staleTodo: false,
      suspiciouslyLongLead: false,
      doneWithoutCycleData: false
    },
    Source: 'api'
  };
}
