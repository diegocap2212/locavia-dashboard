import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, '../src/data.json');
const INPUT_FILE = path.join(__dirname, '../base_cone.csv');

const mapHeaderKey = (headers: string[], possibleNames: string[]) => {
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
    const rawCsv = fs.readFileSync(INPUT_FILE, 'utf8');
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

    const mapping = {
      Type: mapHeaderKey(headers, ['Tipo', 'Type']),
      Key: mapHeaderKey(headers, ['Chave', 'Key']),
      Summary: mapHeaderKey(headers, ['Resumo', 'Summary']),
      Status: mapHeaderKey(headers, ['Status']),
      Team: mapHeaderKey(headers, ['Team', 'Equipe', 'Custom field (Team)']),
      Created: mapHeaderKey(headers, ['Criado', 'Created']),
      Resolved: mapHeaderKey(headers, ['Resolvido', 'Resolved']),
      Release: mapHeaderKey(headers, ['Versões', 'Fix Version', 'Release'])
    };

    const jiraData = records.map((r: any) => ({
      Type: mapping.Type ? r[mapping.Type] : 'Unknown',
      Key: mapping.Key ? r[mapping.Key] : 'Unknown',
      Summary: mapping.Summary ? r[mapping.Summary] : '',
      Status: mapping.Status ? String(r[mapping.Status]).toUpperCase() : 'UNKNOWN',
      Team: mapping.Team ? r[mapping.Team] : '',
      Created: r[mapping.Created || ''] || '',
      Resolved: r[mapping.Resolved || ''] || null,
      Release: mapping.Release ? r[mapping.Release] : ''
    })).filter((j: any) => j.Key && j.Key !== 'Unknown');

    fs.writeFileSync(DATA_FILE, JSON.stringify(jiraData, null, 4));
    console.log(`✨ Dashboard atualizado com sucesso!`);
    console.log(`✅ ${jiraData.length} itens processados e salvos em: ${DATA_FILE}`);

  } catch (error) {
    console.error('❌ Erro no processamento:', error);
    process.exit(1);
  }
}

processLocalCsv();
