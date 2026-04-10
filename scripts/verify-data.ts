import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const DATA_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/data.json');
const INPUT_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '../base_cone.csv');

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
  const statusCol = headers.find(h => h.toLowerCase().includes('status'));
  const teamCol = headers.find(h => h.toLowerCase().includes('time') || h.toLowerCase().includes('equipe'));

  console.log('\n--- Estatísticas de Qualidade ---');
  if (keyCol) {
      const validCsvItems = csvRecords.filter((r: any) => r[keyCol] && !String(r[keyCol]).toLowerCase().includes('unknown'));
      console.log(`Itens válidos no CSV (com Chave): ${validCsvItems.length}`);
      
      if (validCsvItems.length !== jsonData.length) {
          console.warn(`⚠️ ALERTA: O número de itens processados (${jsonData.length}) difere do CSV original (${validCsvItems.length})!`);
      } else {
          console.log('✅ Contagem de itens bate com o esperado.');
      }
  }

  const itemsMissingTeam = jsonData.filter((i: any) => !i.Team);
  const itemsMissingStatus = jsonData.filter((i: any) => !i.Status || i.Status === 'UNKNOWN');

  if (itemsMissingTeam.length > 0) console.warn(`⚠️ ${itemsMissingTeam.length} itens sem Time.`);
  if (itemsMissingStatus.length > 0) console.error(`❌ ${itemsMissingStatus.length} itens com Status desconhecido.`);

  console.log('\n--- Resumo por Time (Itens Concluídos) ---');
  const teams = Array.from(new Set(jsonData.map((i: any) => i.Team))).filter(Boolean).sort();
  
  teams.forEach(team => {
      const teamItems = jsonData.filter((i: any) => i.Team === team);
      const doneItems = teamItems.filter((i: any) => 
        ['CONCLUÍDO', 'DONE', 'RESOLVIDO', 'FINALIZADO', 'ENTREGUE'].includes(String(i.Status).toUpperCase())
      );
      console.log(`Team [${String(team).padEnd(15)}]: ${doneItems.length} Concluídos / ${teamItems.length} Total`);
  });

  const allDone = jsonData.filter((i: any) => 
     ['CONCLUÍDO', 'DONE', 'RESOLVIDO', 'FINALIZADO', 'ENTREGUE'].includes(String(i.Status).toUpperCase())
  ).length;
  console.log(`\n🏆 TOTAL GERAL CONCLUÍDOS: ${allDone}`);
}

verifyData();
