import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHEET_URL = 'https://lmmobilidade.sharepoint.com/:x:/s/TI-LM/IQDthYxUEKT4R4X5w-PouFkwAVxswB3Gz5tkBm51ceC2b1k';
const TARGET_DIR = path.join(__dirname, '../src');
const SUMMARY_FILE = path.join(TARGET_DIR, 'summary_data.json');

async function syncData() {
  console.log('🚀 Iniciando sincronização com SharePoint...');
  
  const userDataDir = path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data');
  
  const browser = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',
    headless: true,
  });

  const page = await browser.newPage();

  try {
    console.log(`🔗 Navegando para: ${SHEET_URL}`);
    await page.goto(SHEET_URL);
    await page.waitForSelector('#MainApp', { timeout: 30000 });
    await page.waitForTimeout(5000);

    // Export MATRIZ ESCOPO
    console.log('📂 Exportando aba MATRIZ ESCOPO...');
    
    // Switch to MATRIZ ESCOPO tab if needed (simulated via menu or pixels)
    // Since we can't easily click tabs without knowing indices, we'll try to trigger the export of the current sheet
    // and assume the user has it open or we can find the tab.
    
    await page.click('button:has-text("Arquivo")');
    await page.waitForTimeout(1000);
    await page.click('span:has-text("Exportar")');
    await page.waitForTimeout(1000);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('span:has-text("Baixar como CSV")')
    ]);

    const tempPath = path.join(__dirname, '../tmp-raw.csv');
    await download.saveAs(tempPath);
    console.log(`✅ CSV baixado.`);

    // Parse CSV
    const rawCsv = fs.readFileSync(tempPath, 'utf8');
    const records = parse(rawCsv, {
      columns: false,
      skip_empty_lines: true
    });

    // Strategy: Find the header row (Sprint, Semana, A fazer...)
    const headerRowIndex = records.findIndex((r: string[]) => r.includes('Sprint') && r.includes('Semana'));
    
    if (headerRowIndex === -1) {
      throw new Error('Cabeçalho "Sprint/Semana" não encontrado no CSV.');
    }

    const summaryData = records.slice(headerRowIndex + 1)
      .filter((r: string[]) => r[0] && r[0].startsWith('Semana'))
      .map((r: string[]) => ({
        week: r[1],
        scope: parseInt(r[2]) || 0,
        realized: r[9] === "" ? null : parseInt(r[9]) || 0,
        bestCase: parseInt(r[2]) || 0, // Fallback if needed
        worstCase: parseInt(r[2]) || 0
      }));

    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summaryData, null, 2));
    console.log(`✨ Dashboard atualizado: ${SUMMARY_FILE}`);
    
    fs.unlinkSync(tempPath);

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  } finally {
    await browser.close();
    console.log('🏁 Processo finalizado.');
  }
}

syncData();
