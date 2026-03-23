import { chromium } from 'playwright';

async function testLaunch() {
  console.log('🚀 Testando lançamento simples do Chromium...');
  try {
    const browser = await chromium.launch({ headless: true });
    console.log('✅ Chromium lançado com sucesso!');
    const page = await browser.newPage();
    await page.goto('https://www.google.com');
    console.log('✅ Navegou para Google!');
    await browser.close();
  } catch (err) {
    console.error('❌ Erro no Chromium:', err);
  }

  console.log('\n🚀 Testando lançamento com Canal Chrome...');
  try {
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });
    console.log('✅ Chrome lançado com sucesso!');
    await browser.close();
  } catch (err) {
    console.error('❌ Erro no Chrome:', err);
  }
}

testLaunch();
