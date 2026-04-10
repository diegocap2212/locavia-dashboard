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
    console.error("ERRO: Faltam variáveis de ambiente do Jira (.env)");
    process.exit(1);
  }

  const client = new JiraClient(baseUrl, email, token);
  
  const simpleJql = `project is not empty and type not in (Epic, subTaskIssueTypes()) and ("Release[Labels]" in (O4R1,O4R2,BAF,BAF-QW) or "Jornada[Labels]" in (COMPRAS, ESTOQUE, MOB,LAKE-DOMINIO)) and "Automação[Select List (cascading)]" = EMPTY and ("Natureza da Demanda[Labels]" not in (TESTES-LOCAVIA) or "Natureza da Demanda[Labels]" is EMPTY) AND created >= -60d ORDER BY created DESC`;

  console.log(`Iniciando sincronização Jira... JQL: ${simpleJql}`);

  try {
    const issues = await client.searchIssues(simpleJql, ['*all'], []);
    console.log(`Foram retornadas ${issues.length} issues da API.`);

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
