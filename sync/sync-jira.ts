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
  
  // JQL filtrando pelas labels e campos de time, ao invés de limitar por Release
  const teamsToFetch = [
    '"OPTIMUS"', '"NIVUS"', '"TAOS"', '"GOL"', '"FUSCA"', '"JETTA"', '"SCANIA"', '"PARATI"',
    '"WHATSAPP"', '"SEMINOVOS"', '"TERA"', '"PLATAFORMA"', '"PRICING"', '"SANTANA"', '"AMAROK"', 
    '"TIGUAN"', '"UP"', '"CONTRATOS"', '"MANUTENÇÃO"', '"MULTAS"', '"RESSARCIMENTO"', '"SALES_FORCE"',
    '"D.LAKE DOMINIO"', '"DATA LAKE ESTRUTURANTE"', '"COMPRAS"', '"ESTOQUE"', '"MOB"', '"LAKE-DOMINIO"'
  ];

  const simpleJql = [
    'project is not empty',
    `and (labels in (${teamsToFetch.join(',')}) or cf[11795] in (${teamsToFetch.join(',')}) or cf[12386] in (${teamsToFetch.join(',')}))`,
    'and type not in (Epic, subTaskIssueTypes())',
    'and cf[13065] is EMPTY',
    'and (cf[12683] not in ("TESTES-LOCAVIA") or cf[12683] is EMPTY)',
    'ORDER BY created DESC'
  ].join(' ');

  console.log(`Iniciando sincronização Jira... JQL: ${simpleJql}`);

  try {
    const issues = await client.searchIssues(simpleJql);
    console.log(`Foram retornadas ${issues.length} issues da API.`);

    if (issues.length === 0) {
      console.error("❌ ERRO CRÍTICO: A API do Jira retornou 0 itens.");
      console.error("Isso pode indicar um problema de autenticação ou mudança nos filtros JQL.");
      console.error("A sincronização foi ABORTADA para evitar limpar o dashboard.");
      process.exit(1);
    }

    const dashboardItems = issues.map(issue => calculateMetrics(mapJiraIssueToDashboardItem(issue), issue));
    
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
