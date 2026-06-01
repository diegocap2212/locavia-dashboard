import { test, expect } from '@playwright/test';

test.describe('Dashboard Locavia E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for data to load (App.tsx shows loading state)
    await page.waitForSelector('text=Carregando Workspace...', { state: 'hidden', timeout: 30000 });
  });

  test('deve carregar o cabeçalho corretamente', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard de Métricas LM');
  });

  test('deve exibir as métricas principais', async ({ page }) => {
    const metrics = page.locator('.metric-card');
    await expect(metrics).toHaveCount(4);
    
    // Check if values are numbers/not empty
    for (let i = 0; i < 4; i++) {
      const val = await metrics.nth(i).locator('.metric-value').innerText();
      expect(val).not.toBe('');
      expect(parseFloat(val)).toBeGreaterThanOrEqual(0);
    }
  });

  test('deve popular o dropdown de Times', async ({ page }) => {
    const teamFilter = page.locator('.filter-dropdown').first();
    await teamFilter.click();
    
    // Wait for options to appear
    const options = page.locator('.premium-card div[style*="cursor: pointer"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(1); // "TODOS" + at least one team
  });

  test('deve renderizar os gráficos', async ({ page }) => {
    // AreaChart for Burndown
    await expect(page.locator('.recharts-responsive-container').first()).toBeVisible();
    // ComposedChart for Throughput
    await expect(page.locator('.recharts-responsive-container').nth(1)).toBeVisible();
  });

  test('deve carregar a tabela de backlog', async ({ page }) => {
    const rows = page.locator('.data-table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Scrum Master View E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sm/gabriela');
    await page.waitForSelector('text=Carregando métricas...', { state: 'hidden', timeout: 10000 });
  });

  test('deve carregar a tela de SM de Gabriela com 4 KPIs e sem Cycle Time', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Dashboard — Gabriela');
    
    const metrics = page.locator('.metric-card');
    await expect(metrics).toHaveCount(4);

    // Verify that none of the metric labels contain "Cycle Time"
    const count = await metrics.count();
    for (let i = 0; i < count; i++) {
      const label = await metrics.nth(i).locator('.metric-label').innerText();
      expect(label).not.toContain('Cycle Time');
    }
  });

  test('deve permitir navegar pelos times do SM', async ({ page }) => {
    // Find team selector buttons
    const buttons = page.locator('button:has-text("Visão Geral"), button:has-text("Taos"), button:has-text("Gol")');
    await expect(buttons).toHaveCount(3); // Visão Geral + Taos + Gol (SFMktplace is separate)
  });
});
