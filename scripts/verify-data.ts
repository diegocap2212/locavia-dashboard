import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../src/data.json');
const INPUT_FILE = path.join(__dirname, '../base_cone.csv');

async function verifyData() {
  console.log('🔍 Iniciando Verificação de Integridade de Dados...');
  
  if (!fs.existsSync(INPUT_FILE) || !fs.existsSync(DATA_FILE)) {
    console.error('❌ Arquivos necessários não encontrados.');
    return;
  }

  const rawCsv = fs.readFileSync(INPUT_FILE, 'latin1');
  const csvRecords = parse(rawCsv, { delimiter: ';', columns: true, skip_empty_lines: true, relax_quotes: true, trim: true });
  const jsonData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

  console.log('\n--- Estatísticas Gerais ---');
  console.log(`Potal de linhas no CSV: ${csvRecords.length}`);
  console.log(`Total de itens no JSON: ${jsonData.length}`);

  const csvKeys = new Set(csvRecords.map((r: any) => Object.values(r)[1])); // Assuming 2nd col is Key (Chave)
  // Wait, better to find the key column
  const headers = Object.keys(csvRecords[0]);
  const keyCol = headers.find(h => h.toLowerCase().includes('chave'));
  
  if (keyCol) {
      const validCsvItems = csvRecords.filter((r: any) => r[keyCol] && !String(r[keyCol]).toLowerCase().includes('unknown'));
      console.log(`Itens válidos no CSV (com Chave): ${validCsvItems.length}`);
      
      if (validCsvItems.length !== jsonData.length) {
          console.warn('⚠️ Alerta: O número de itens processados difere do CSV original!');
      } else {
          console.log('✅ Contagem de itens bate com o esperado.');
      }
  }

  console.log('\n--- Qualidade dos Dados (JSON) ---');
  const itemsMissingTeam = jsonData.filter((i: any) => !i.Team);
  const itemsMissingRelease = jsonData.filter((i: any) => !i.Release);
  const itemsMissingStatus = jsonData.filter((i: any) => !i.Status || i.Status === 'UNKNOWN');

  if (itemsMissingTeam.length > 0) console.warn(`⚠️ ${itemsMissingTeam.length} itens sem Time.`);
  else console.log('✅ Todos os itens possuem Time.');

  if (itemsMissingRelease.length > 0) console.warn(`⚠️ ${itemsMissingRelease.length} itens sem Release.`);
  else console.log('✅ Todos os itens possuem Release.');

  if (itemsMissingStatus.length > 0) console.error(`❌ ${itemsMissingStatus.length} itens com Status desconhecido.`);
  else console.log('✅ Todos os itens possuem Status válido.');

  const teams = Array.from(new Set(jsonData.map((i: any) => i.Team))).filter(Boolean);
  console.log(`\nTimes detectados (${teams.length}): ${teams.join(', ')}`);
}

verifyData();
