import { chromium } from '@playwright/test';

async function diagnose() {
  console.log('🌐 Opening browser to load Vercel app...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.error(`[BROWSER ERROR]: ${err.message}`);
    if (err.stack) console.error(err.stack);
  });

  const checkPath = async (pathStr) => {
    console.log(`🌐 Loading path: ${pathStr}...`);
    try {
      const response = await page.goto(`https://locavia-dashboard.vercel.app${pathStr}`, { waitUntil: 'networkidle' });
      console.log(`📡 [${pathStr}] HTTP Status: ${response?.status()}`);
      const content = await page.locator('#root').innerHTML();
      console.log(`📦 [${pathStr}] HTML Length: ${content.length}`);
      if (content.length < 100) {
        console.log(`⚠️ [${pathStr}] HTML is empty:`, content);
      }
    } catch (e) {
      console.error(`❌ [${pathStr}] failed to load:`, e);
    }
  };

  try {
    await checkPath('/');
    await checkPath('/sm/gabriela');
    await checkPath('/cone-bf-cem');
  } catch (error) {
    console.error('❌ Failed to run paths check:', error);
  } finally {
    await browser.close();
    console.log('🏁 Browser closed.');
  }
}

diagnose();
