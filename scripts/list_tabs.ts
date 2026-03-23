import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHEET_URL = 'https://lmmobilidade.sharepoint.com/:x:/s/TI-LM/IQDthYxUEKT4R4X5w-PouFkwAVxswB3Gz5tkBm51ceC2b1k';

async function listTabs() {
  const userDataDir = path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/User Data');
  const browser = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chrome',
    headless: true,
  });

  const page = await browser.newPage();
  try {
    await page.goto(SHEET_URL);
    await page.waitForSelector('#MainApp', { timeout: 30000 });
    await page.waitForTimeout(5000); // give it time to load the tabs

    // In Excel Online, tabs are usually buttons with role="tab" or within a tab list
    const tabs = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[role="tab"]'));
      return elements.map(el => {
        const title = el.getAttribute('title') || el.getAttribute('aria-label') || (el as HTMLElement).innerText;
        const id = el.id;
        return { title: title.trim(), id };
      }).filter(t => t.title);
    });

    console.log('TABS FOUND:', JSON.stringify(tabs, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

listTabs();
