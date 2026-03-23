import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHEET_URL = 'https://lmmobilidade.sharepoint.com/:x:/s/TI-LM/IQDthYxUEKT4R4X5w-PouFkwAVxswB3Gz5tkBm51ceC2b1k';
const TARGET_DIR = path.join(__dirname, '../src');
const DATA_FILE = path.join(TARGET_DIR, 'data.json');

const mapHeaderKey = (headers: string[], possibleNames: string[]) => {
  return headers.find(h => possibleNames.some(p => h.toLowerCase().includes(p.toLowerCase())));
};

async function syncData() {
  console.log('🚀 Iniciando sincronização via UI (Modo Legado Robusto)...');
  
  const tempPath = path.join(__dirname, '../tmp-raw.csv');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  const page = await browser.newPage();

  try {
    console.log(`🔗 Navegando para: ${SHEET_URL}`);
    await page.goto(SHEET_URL, { waitUntil: 'networkidle', timeout: 90000 });
    
    // Wait for Excel to load
    await page.waitForSelector('#MainApp', { timeout: 60000 });
    console.log('✅ Interface do Excel carregada.');
    
    await page.waitForTimeout(5000);

    // Try to ensure "BASE CONE" tab is selected if possible, but usually the link opens on the right one.
    // If not, we can try to click it.
    try {
        await page.locator('text="BASE CONE"').first().click({ timeout: 5000 });
        console.log('✅ Aba "BASE CONE" selecionada.');
    } catch (e) {
        console.log('⚠️ Aba "BASE CONE" já deve estar ativa ou não foi encontrada pelo texto.');
    }

    // ARCHITECTURE: File -> Export -> Download as CSV
    console.log('📂 Abrindo menu Arquivo...');
    await page.click('button:has-text("Arquivo"), #fileMenuLauncher, button#FileMenuLauncher', { timeout: 20000 });
    await page.waitForTimeout(2000);

    console.log('📂 Selecionando Exportar...');
    await page.click('span:has-text("Exportar"), button:has-text("Exportar")', { timeout: 10000 });
    await page.waitForTimeout(2000);

    console.log('📥 Iniciando download do CSV...');
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      page.click('span:has-text("Baixar como CSV"), span:has-text("Download as CSV")')
    ]);

    await download.saveAs(tempPath);
    console.log(`✅ CSV baixado via UI.`);

    // Parse CSV
    const rawCsv = fs.readFileSync(tempPath, 'utf8');
    const records = parse(rawCsv, {
      columns: true,
      skip_empty_lines: true,
      relax_quotes: true
    });
    
    if (records.length === 0) throw new Error('O CSV exportado está vazio.');

    const headers = Object.keys(records[0]);
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
    console.log(`✨ Dashboard atualizado: ${DATA_FILE} (${jiraData.length} items extraídos).`);
    
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  } finally {
    await browser.close();
    console.log('🏁 Processo finalizado.');
  }
}

syncData();
