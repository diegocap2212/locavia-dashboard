import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { JiraClient } from './jira-client';
import { mapJiraIssueToDashboardItem } from './field-mapper';
import { calculateMetrics } from './metrics-calculator';

async function main() {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_USER_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !token) {
    console.error("❌ ERRO: Faltam variáveis de ambiente do Jira.");
    if (!baseUrl) console.error("- JIRA_BASE_URL não definida.");
    if (!email) console.error("- JIRA_USER_EMAIL não definida.");
    if (!token) console.error("- JIRA_API_TOKEN não definida.");
    console.log("Dica: No GitHub, verifique Settings > Secrets and variables > Actions");
    process.exit(1);
  }

  const client = new JiraClient(baseUrl, email, token);
  
  // JQL espelhando a estrutura da planilha CONE:
  // - cf[11330] = "Release[Labels]"
  // - cf[12386] = "Jornada[Labels]" (4 jornadas BF/CEM que a planilha usa)
  // - cf[13065] = "Automação[Select List (cascading)]" — excluídos (EMPTY)
  // - cf[12683] = "Natureza da Demanda[Labels]" — excluídos TESTES-LOCAVIA

  const releases = [
    '"O4R1"', '"O4R2"', '"O4R3"',
    '"BAF"', '"BAF-QW"',
    '"CEM"', '"CEM-R1"', '"CEM-R2"'
  ];

  const simpleJql = [
    'project is not empty',
    'and type not in (Epic, subTaskIssueTypes())',
    `and cf[11330] in (${releases.join(',')})`,
    'and cf[13065] is EMPTY',
    'and (cf[12683] not in ("TESTES-LOCAVIA") or cf[12683] is EMPTY)',
    'ORDER BY created DESC'
  ].join(' ');

  console.log(`Iniciando sincronização Jira... JQL: ${simpleJql}`);

  try {
    const issues = await client.searchIssues(simpleJql, ['*all']);
    console.log(`Foram retornadas ${issues.length} issues da API.`);

    if (issues.length === 0) {
      console.error("❌ ERRO CRÍTICO: A API do Jira retornou 0 itens.");
      console.error("Isso pode indicar um problema de autenticação ou mudança nos filtros JQL.");
      console.error("A sincronização foi ABORTADA para evitar limpar o dashboard.");
      process.exit(1);
    }

    const dashboardItems = issues.map(mapJiraIssueToDashboardItem).map(calculateMetrics);
    
    // Save to data.json
    const outputPath = path.resolve(process.cwd(), 'src/data.json');
    await fs.writeFile(outputPath, JSON.stringify(dashboardItems, null, 2), 'utf-8');
    
    console.log(`✅ Sucesso! ${dashboardItems.length} itens salvos em src/data.json`);
    
  } catch (error) {
    console.error("ERRO durante a sincronização:", error);
    process.exit(1);
  }
}

main();
