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
      'DATA LAKE ESTRUTURANTE': 'Construção do Data Lake'
    };

    const prefixToCar: Record<string, string> = {
      'CTO': 'OPTIMUS',
      'VAA': 'NIVUS',
      'SN': 'SANTANA',
      'WA': 'GOL',
      'APV': 'FUSCA',
      'JAC': 'GOL',
      'MDD': 'SANTANA'
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
      Release: mapHeaderKey(headers, ['release'], true) || mapHeaderKey(headers, ['Versões', 'Fix Version', 'Release', 'Campo personalizado (Release)'])
    };

    const parseDateWithAutoDetect = (dateStr: string | null) => {
      if (!dateStr) return null;
      // Handle Excel numbers (if they leak into CSV as raw numbers)
      if (!isNaN(Number(dateStr)) && Number(dateStr) > 40000) {
        const excelDate = Number(dateStr);
        const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
        return jsDate.toISOString();
      }
      // Try simple split if it's DD/MM/YYYY or MM/DD/YYYY
      if (dateStr.includes('/')) {
         const parts = dateStr.split('/');
         if (parts.length === 3) {
            if (parseInt(parts[0]) > 12) return `${parts[2]}-${parts[1]}-${parts[0]}`;
         }
      }
      return dateStr;
    };

    const jiraData = records.map((r: any) => {
      let teamRaw = mapping.Team ? String(r[mapping.Team] || '').replace(/;;/g, '').trim() : '';
      let customTeamRaw = mapping.CustomTeam ? String(r[mapping.CustomTeam] || '').replace(/;;/g, '').trim() : '';
      
      const key = mapping.Key ? String(r[mapping.Key]).toUpperCase() : '';
      let rawValues = [teamRaw, customTeamRaw].filter(v => v && v !== ';;');
      
      // If team field has multiple values, try to find the one we know
      let foundArea = '';
      let carRef = '';
      const allPossibleTeams = rawValues.join(';').split(';').map(v => v.trim().toUpperCase());
      
      for (const t of allPossibleTeams) {
        if (teamMapping[t]) {
          foundArea = teamMapping[t];
          carRef = t;
          break;
        }
      }

      // Fallback: Jira Key Prefix
      if (!foundArea && key && key.includes('-')) {
        const prefix = key.split('-')[0];
        const carFromPrefix = prefixToCar[prefix];
        if (carFromPrefix) {
          foundArea = teamMapping[carFromPrefix] || carFromPrefix;
          carRef = carFromPrefix;
        }
      }

      // Last fallback: search for known car names in the strings
      if (!foundArea && allPossibleTeams.length > 0) {
          const knownCars = Object.keys(teamMapping);
          const matchedCar = knownCars.find(c => allPossibleTeams.some(p => p.includes(c)));
          if (matchedCar) {
            foundArea = teamMapping[matchedCar];
            carRef = matchedCar;
          }
      }

      // Final Team Formatting: "VEHICLE (Functional Area)"
      let finalTeam = 'OUTROS SQUADS';
      if (foundArea) {
        if (carRef && carRef !== foundArea) {
          finalTeam = `${carRef} (${foundArea})`;
        } else {
          finalTeam = foundArea;
        }
      } else if (allPossibleTeams.length > 0 && allPossibleTeams[0]) {
          finalTeam = allPossibleTeams[0];
      }

      // Release Cleaning - strictly keep O4R1, O4R2 etc
      let releaseRaw = mapping.Release ? String(r[mapping.Release] || '') : '';
      let release = '';
      if (releaseRaw) {
          const releaseParts = releaseRaw.split(';').map(p => p.trim());
          const mainRelease = releaseParts.find(p => p.toUpperCase().startsWith('O4R'));
          if (mainRelease) {
            release = mainRelease.toUpperCase().replace(/[^A-Z0-9]/g, '');
          } else {
            const backup = releaseParts[0].toUpperCase();
            if (['BAF', 'CEM'].includes(backup)) release = backup;
          }
      }

      return {
        Type: mapping.Type ? r[mapping.Type] : 'Unknown',
        Key: key || 'Unknown',
        Summary: mapping.Summary ? r[mapping.Summary] : '',
        Status: mapping.Status ? String(r[mapping.Status]).toUpperCase() : 'UNKNOWN',
        Team: finalTeam,
        Created: parseDateWithAutoDetect(r[mapping.Created || '']),
        Resolved: parseDateWithAutoDetect(r[mapping.Resolved || '']),
        Release: release
      };
    }).filter((j: any) => j.Key && j.Key !== 'Unknown');

    fs.writeFileSync(DATA_FILE, JSON.stringify(jiraData, null, 4));
    console.log(`✨ Dashboard atualizado com sucesso!`);
    console.log(`✅ ${jiraData.length} itens processados e salvos em: ${DATA_FILE}`);

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    process.exit(1);
  }
}

processLocalCsv();
