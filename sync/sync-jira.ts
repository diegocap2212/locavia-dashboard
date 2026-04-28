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
  
  const projects = ['WA', 'VAA', 'TERA', 'SN', 'RM', 'PRICI', 'MS', 'MIGRA', 'MDD', 'LKE', 'LKD', 'LI', 'JAC', 'DESMOB', 'CTO', 'CRED', 'COMP', 'APV', 'CON', 'GOL', 'UP'];
  
  // Regra de Paridade: Jornadas mapeadas na planilha CONE
  const jornadas = [
    '"WHATSAPP"', '"Comercial"', '"Pos_venda"', '"Migra_Blip"', '"VENDAS_AUTO-ATENDIMENTO"', 
    '"CADASTRO_DE_USUÁRIO"', '"MOB"', '"SEMINOVOS"', '"FATURAMENTO"', '"CONTRATOS"', 
    '"ESTOQUE"', '"COMPRAS"', '"JURÍDICO"', '"RH"', '"FINANCEIRO"', '"FISCAL"', 
    '"CONTROLADORIA"', '"TI"', '"OPERAÇÕES"', '"MANUTENÇÃO"', '"LOGÍSTICA"', 
    '"SINISTRO"', '"QUALIDADE"', '"CLIENTE"', '"FORNECEDOR"', '"FROTA"', 
    '"EQUIPAMENTO"', '"TELECOM"', '"FACILITIE"', '"GESTÃO"', '"OUTROS"', 
    '"LAKE-DOMINIO"', '"VENDAS_ASSISTIDAS"', '"PRICING"', '"MIGRAÇÃO"'
  ];

  // Regra de Paridade: Releases mapeadas na planilha CONE
  // CEM-R1 e CEM-R2 adicionados após comparação com BASE CONE da planilha
  const releases = [
    '"O4R1"', '"O4R2"', '"O4R3"',
    '"BAF"', '"BAF-QW"',
    '"CEM"', '"CEM-R1"', '"CEM-R2"',
    '"Wave 4"', '"Release 2"', '"Onda 4"', '"Release 01"', '"Release_01"',
    '"2024.1"', '"2024.2"'
  ];

  // Removemos DESCARTADO/CANCELADO do filtro JQL para paridade com a planilha
  // (a planilha inclui esses itens no escopo total; o dashboard os exibe como "fora do cone ativo")
  const excludedStatuses = ['"ESPERANDO"'];

  // JQL: Itens que tenham a Release OU Jornada específica em projetos chave
  // Projetos que usam Jornada como critério de inclusão (além do campo Release)
  const jornadaProjects = 'WA, JAC, VAA, LKD, SN, MIGRA, COMP, RM';

  const simpleJql = `project in (${projects.join(',')}) and type not in (Epic, subTaskIssueTypes()) and (cf[11330] in (${releases.join(',')}) or (cf[12386] in (${jornadas.join(',')}) and project in (${jornadaProjects})) or (cf[10215] in (${jornadas.join(',')}) and project in (${jornadaProjects}))) and status not in (${excludedStatuses.join(',')}) ORDER BY created DESC`;

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
