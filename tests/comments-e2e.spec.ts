import { test, expect } from '@playwright/test';

// String fixa para não depender de Date.now() entre workers
const TEST_TEXT = 'TESTE-E2E-PERSISTENCIA-TAOS-FIXO';
const EMPTY_PLACEHOLDER = 'Nenhum diagnóstico registrado pelo Scrum Master';

// Helper: espera o MetricCommentEditor renderizar no modo visualização
// O label "🔴 Diagnóstico" sempre aparece quando o componente está em view mode
async function waitForCommentLoaded(page: import('@playwright/test').Page) {
  await page.locator('text=🔴 Diagnóstico').first().waitFor({ state: 'visible', timeout: 15000 });
}

test.describe('Comments E2E — Persistência e Isolamento', () => {
  test.describe.configure({ mode: 'serial' }); // Garantir ordem e estado compartilhado

  test('setup: limpar dado de teste anterior se existir', async ({ page }) => {
    await page.goto('/sm/gabriela');
    await page.waitForSelector('text=Carregando métricas...', { state: 'hidden', timeout: 30000 });
    const taosBtn = page.locator('button').filter({ hasText: /taos/i });
    await taosBtn.click();
    await waitForCommentLoaded(page);
    // Não falha — é apenas warm-up
  });

  test('1. salvar análise em TAOS e verificar persistência após navegação', async ({ page }) => {
    await page.goto('/sm/gabriela');
    await page.waitForSelector('text=Carregando métricas...', { state: 'hidden', timeout: 30000 });

    // Selecionar time TAOS
    const taosBtn = page.locator('button').filter({ hasText: /taos/i });
    await taosBtn.click();
    await waitForCommentLoaded(page);

    // Abrir edição no primeiro card (Vazão Semanal)
    const editBtn = page.locator('button').filter({ hasText: /Registrar Diagnóstico/i }).first();
    await editBtn.click();

    // Botão deve mostrar "Salvar Análise"
    await expect(page.locator('button').filter({ hasText: /Salvar Análise/i }).first()).toBeVisible();

    // Preencher diagnóstico
    const textarea = page.locator('textarea').first();
    await textarea.fill(TEST_TEXT);

    // Salvar
    await page.locator('button').filter({ hasText: /Salvar Análise/i }).first().click();

    // Aguardar retorno ao modo visualização
    await expect(page.locator('button').filter({ hasText: /Registrar Diagnóstico/i }).first()).toBeVisible({ timeout: 15000 });

    // Verificar sem erro vermelho
    await expect(page.locator('text=Erro ao salvar')).not.toBeVisible({ timeout: 2000 });

    // Texto deve aparecer
    await expect(page.locator(`text=${TEST_TEXT}`)).toBeVisible();

    // === Navegar para Principal e voltar ===
    await page.goto('/');
    await page.waitForSelector('text=Carregando Workspace...', { state: 'hidden', timeout: 30000 });

    await page.goto('/sm/gabriela');
    await page.waitForSelector('text=Carregando métricas...', { state: 'hidden', timeout: 30000 });

    const taosBtnAgain = page.locator('button').filter({ hasText: /taos/i });
    await taosBtnAgain.click();
    await waitForCommentLoaded(page);

    // PERSISTÊNCIA: texto deve estar lá depois de navegar e voltar
    await expect(page.locator(`text=${TEST_TEXT}`)).toBeVisible({ timeout: 10000 });
  });

  test('2. análise do TAOS não replica para GOL nem Visão Geral', async ({ page }) => {
    await page.goto('/sm/gabriela');
    await page.waitForSelector('text=Carregando métricas...', { state: 'hidden', timeout: 30000 });

    // TAOS deve ter o texto
    const taosBtn = page.locator('button').filter({ hasText: /taos/i });
    await taosBtn.click();
    await waitForCommentLoaded(page);
    await expect(page.locator(`text=${TEST_TEXT}`)).toBeVisible({ timeout: 10000 });

    // Mudar para GOL — aguardar carregamento assíncrono
    const golBtn = page.locator('button').filter({ hasText: /gol/i });
    await golBtn.click();
    // Aguardar o placeholder aparecer (indica que comentário carregou e está vazio)
    await expect(page.locator(`text=${EMPTY_PLACEHOLDER}`).first()).toBeVisible({ timeout: 10000 });
    // Texto do TAOS NÃO deve estar visível
    await expect(page.locator(`text=${TEST_TEXT}`)).not.toBeVisible({ timeout: 3000 });

    // Mudar para Visão Geral
    const visaoBtn = page.locator('button').filter({ hasText: /Visão Geral/i });
    await visaoBtn.click();
    await expect(page.locator(`text=${EMPTY_PLACEHOLDER}`).first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${TEST_TEXT}`)).not.toBeVisible({ timeout: 3000 });
  });

  test('3. mudança de quinzena limpa análise e retorno restaura', async ({ page }) => {
    await page.goto('/sm/gabriela');
    await page.waitForSelector('text=Carregando métricas...', { state: 'hidden', timeout: 30000 });

    const taosBtn = page.locator('button').filter({ hasText: /taos/i });
    await taosBtn.click();
    await waitForCommentLoaded(page);

    // TAOS deve ter o texto (salvo no teste 1)
    await expect(page.locator(`text=${TEST_TEXT}`)).toBeVisible({ timeout: 10000 });

    // Pegar quinzena atual
    const quinzenaSelect = page.locator('select').filter({ has: page.locator('option[value="CUSTOM"]') });
    const currentVal = await quinzenaSelect.inputValue();

    // Mudar para outra quinzena
    const options = await quinzenaSelect.locator('option').all();
    let nextVal = '';
    for (const opt of options) {
      const val = await opt.getAttribute('value');
      if (val && val !== currentVal && val !== 'CUSTOM') {
        nextVal = val;
        break;
      }
    }

    if (nextVal) {
      await quinzenaSelect.selectOption(nextVal);
      // Aguardar carregamento (placeholder deve aparecer — outra quinzena sem dados)
      await expect(page.locator(`text=${EMPTY_PLACEHOLDER}`).first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator(`text=${TEST_TEXT}`)).not.toBeVisible({ timeout: 3000 });

      // Voltar para quinzena original
      await quinzenaSelect.selectOption(currentVal);
      await waitForCommentLoaded(page);
      // Texto deve voltar
      await expect(page.locator(`text=${TEST_TEXT}`)).toBeVisible({ timeout: 10000 });
    }
  });

  test('4. feedback visual dos botões durante save', async ({ page }) => {
    await page.goto('/sm/gabriela');
    await page.waitForSelector('text=Carregando métricas...', { state: 'hidden', timeout: 30000 });

    const taosBtn = page.locator('button').filter({ hasText: /taos/i });
    await taosBtn.click();
    await waitForCommentLoaded(page);

    // Entrar em modo edição
    await page.locator('button').filter({ hasText: /Registrar Diagnóstico/i }).first().click();
    await expect(page.locator('button').filter({ hasText: /Salvar Análise/i }).first()).toBeVisible();

    // Editar e salvar
    await page.locator('textarea').first().fill(`${TEST_TEXT} ATUALIZADO`);
    await page.locator('button').filter({ hasText: /Salvar Análise/i }).first().click();

    // Após save: sem erro, voltou ao modo visualização
    await expect(page.locator('button').filter({ hasText: /Registrar Diagnóstico/i }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Erro ao salvar')).not.toBeVisible({ timeout: 2000 });
  });
});
