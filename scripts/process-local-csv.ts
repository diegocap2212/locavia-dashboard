import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const DATA_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/data.json');
const INPUT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../base_cone.csv');

const mapHeaderKey = (headers: string[], possibleNames: string[], exact: boolean = false) => {
  if (exact) {
    return headers.find(h => possibleNames.some(p => h === p));
  }
  return headers.find(h => possibleNames.some(p => h.toLowerCase().includes(p.toLowerCase())));
};

async function processLocalCsv() {
  console.log('📂 Iniciando processamento de CSV local...');
  
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Erro: Arquivo ${INPUT_FILE} não encontrado.`);
    console.log('📌 Por favor, salve a extração do SharePoint como "base_cone.csv" na raiz do projeto.');
    process.exit(1);
  }

  try {
    const rawCsv = fs.readFileSync(INPUT_FILE, 'latin1');
    const records = parse(rawCsv, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true,
      trim: true,
      delimiter: ';'
    });
    
    if (records.length === 0) throw new Error('O CSV está vazio.');

    const headers = Object.keys(records[0]);
    console.log('📊 Colunas encontradas:', headers.join(', '));

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

    const mapping = {
      Type: mapHeaderKey(headers, ['Tipo', 'Type']),
      Key: mapHeaderKey(headers, ['Chave', 'Key']),
      Summary: mapHeaderKey(headers, ['Resumo', 'Summary']),
      Status: mapHeaderKey(headers, ['Status']),
      Team: mapHeaderKey(headers, ['time'], true) || mapHeaderKey(headers, ['Team', 'Equipe', 'Time', 'Custom field (Team)', 'Campo personalizado (Time)']),
      CustomTeam: mapHeaderKey(headers, ['Campo personalizado (Time)']),
      Created: mapHeaderKey(headers, ['Criado', 'Created']),
      Resolved: mapHeaderKey(headers, ['Resolvido', 'Resolved']),
      Updated: mapHeaderKey(headers, ['Atualizado', 'Updated', 'Modificado', 'Modified']),
      Release: mapHeaderKey(headers, ['release'], true) || mapHeaderKey(headers, ['Versões', 'Fix Version', 'Release', 'Campo personalizado (Release)'])
    };

    const parseDateWithAutoDetect = (dateStr: string | null) => {
      if (!dateStr) return null;
      if (!isNaN(Number(dateStr)) && Number(dateStr) > 40000) {
        const excelDate = Number(dateStr);
        const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
        return jsDate.toISOString();
      }
      if (dateStr.includes('/')) {
         const parts = dateStr.split('/');
         if (parts.length === 3) {
            if (parseInt(parts[0]) > 12) return `${parts[2]}-${parts[1]}-${parts[0]}`;
         }
      }
      return dateStr;
    };

    const jiraData = records.map((r: Record<string, string | null | undefined>) => {
      const teamRaw = mapping.Team ? String(r[mapping.Team] || '').replace(/;;/g, '').trim() : '';
      const customTeamRaw = mapping.CustomTeam ? String(r[mapping.CustomTeam] || '').replace(/;;/g, '').trim() : '';
      
      const key = mapping.Key ? String(r[mapping.Key]).toUpperCase() : '';
      const rawValues = [customTeamRaw, teamRaw].filter(v => v && v !== ';;');
      
      let foundArea = '';
      const allPossibleTeams = rawValues.join(';').split(';').map(v => v.trim().toUpperCase());
      
      for (const t of allPossibleTeams) {
        if (teamMapping[t]) {
          foundArea = teamMapping[t];
          break;
        }
      }

      if (!foundArea && key && key.includes('-')) {
        const prefix = key.split('-')[0];
        const carFromPrefix = prefixToCar[prefix];
        if (carFromPrefix) {
          foundArea = teamMapping[carFromPrefix] || carFromPrefix;
        }
      }

      if (!foundArea && allPossibleTeams.length > 0) {
          const knownCars = Object.keys(teamMapping);
          const matchedCar = knownCars.find(c => allPossibleTeams.some(p => p.includes(c)));
          if (matchedCar) {
            foundArea = teamMapping[matchedCar];
          }
      }

      let finalTeam = 'OUTROS SQUADS';
      if (foundArea) {
        finalTeam = foundArea;
      } else if (allPossibleTeams.length > 0 && allPossibleTeams[0]) {
        finalTeam = allPossibleTeams[0];
      }

      const releaseRaw = mapping.Release ? String(r[mapping.Release] || '') : '';
      let release = '';
      if (releaseRaw) {
          const releaseParts = releaseRaw.split(';').map(p => p.trim().toUpperCase());
          const knownReleases = ['O4R1', 'O4R2', 'O4R3', 'BAF', 'BAF-QW', 'CEM', 'CEM-R1', 'CEM-R2'];
          const matched = releaseParts.find(p => knownReleases.includes(p));
          if (matched) {
            release = matched;
          } else {
            const o4rMatch = releaseParts.find(p => p.startsWith('O4R'));
            if (o4rMatch) {
              release = o4rMatch.replace(/[^A-Z0-9]/g, '');
            } else if (releaseParts[0]) {
              release = releaseParts[0];
            }
          }
      }

      // Calculate StatusCategory
      const status = mapping.Status ? String(r[mapping.Status]).toUpperCase().trim() : 'UNKNOWN';
      let statusCategory: 'TODO' | 'IN_PROGRESS' | 'DONE' = 'TODO';
      
      const doneStatuses = [
        'CONCLUIDO', 'CONCLUÍDO', 'DESENV CONCLUIDO', 'DESENV CONCLUÍDO',
        'DONE', 'RESOLVIDO', 'FINALIZADO', 'ENTREGUE', 'FECHADO', 'ENTREGA FINALIZADA',
        'TESTE CONCLUIDO', 'AGUARDANDO QA', 'QA EM PROGRESSO',
        'EM TESTE', 'AGUARDANDO TESTE',
        'AGUARDANDO DEPLOY QA', 'AGUARDANDO DEPLOY PROD',
        'AGUARDANDO HOMOLOG', 'HOMOLOG EM PROGRESSO'
      ];
      
      const inProgressStatuses = [
        'EM DESENVOLVIMENTO', 'IN PROGRESS', 'EM ANDAMENTO', 'DESENVOLVENDO', 
        'SENDO DESENVOLVIDO', 'FIXING', 'REFINANDO', 'EM REFINAMENTO', 
        'AGUARDANDO CODE REVIEW', 'CODE REVIEW EM PROGRESSO', 'NOVAS ATIVIDADES', 
        'ATIVIDADES EM ANDAMENTO', 'PRONTO PARA DESENVOLVER', 'PRONTO PRA DESENVOLVER', 
        'PRIORIZADO', 'PRIORIZADO PARA DESENVOLVER'
      ];

      if (doneStatuses.some(s => status === s || status.includes(s))) {
        statusCategory = 'DONE';
      } else if (inProgressStatuses.some(s => status === s || status.includes(s))) {
        statusCategory = 'IN_PROGRESS';
      }

      const created = parseDateWithAutoDetect(r[mapping.Created || '']);
      let resolved = parseDateWithAutoDetect(r[mapping.Resolved || '']);
      const updated = (mapping.Updated ? parseDateWithAutoDetect(r[mapping.Updated]) : null) || resolved || created;

      if (statusCategory === 'DONE' && !resolved) {
        resolved = updated;
      }

      let leadTime: number | null = null;
      if (statusCategory === 'DONE' && created && resolved) {
        const createdDate = new Date(created);
        const resolvedDate = new Date(resolved);
        if (!isNaN(createdDate.getTime()) && !isNaN(resolvedDate.getTime())) {
          const diffTime = resolvedDate.getTime() - createdDate.getTime();
          leadTime = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }
      }

      return {
        Type: mapping.Type ? r[mapping.Type] : 'Unknown',
        Key: key || 'Unknown',
        Summary: mapping.Summary ? r[mapping.Summary] : '',
        Status: status,
        StatusCategory: statusCategory,
        Team: finalTeam,
        Created: created,
        Resolved: resolved,
        UpdatedAt: updated || created,
        Release: release || 'OUTROS',
        LeadTime: leadTime,
        Source: 'excel'
      };
    }).filter(j => j.Key && j.Key !== 'Unknown');

    fs.writeFileSync(DATA_FILE, JSON.stringify(jiraData, null, 4));
    console.log(`✨ Dashboard atualizado com sucesso!`);
    console.log(`✅ ${jiraData.length} itens processados e salvos em: ${DATA_FILE}`);

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    process.exit(1);
  }
}

processLocalCsv();
