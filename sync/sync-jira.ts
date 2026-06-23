import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { JiraClient } from './jira-client';
import { mapJiraIssueToDashboardItem } from './field-mapper';
import { calculateMetrics } from './metrics-calculator';

// Schema mínimo de sanidade do item normalizado — barra gravar lixo por cima de dado bom.
const ItemSchema = z.object({
  Key: z.string().min(1),
  Type: z.string(),
  Status: z.string(),
  StatusCategory: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
  Team: z.string(),
  Created: z.string(),
  Release: z.string(),
}).passthrough();

// Escrita atômica: grava em tmp e renomeia (rename é atômico no mesmo FS).
async function writeAtomic(filePath: string, content: string) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  await fs.writeFile(tmp, content, 'utf-8');
  await fs.rename(tmp, filePath);
}

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

  // Filtro dos times LM (labels/campos de time) + saneamentos específicos da LM.
  const teamClause = `(labels in (${teamsToFetch.join(',')}) or cf[11795] in (${teamsToFetch.join(',')}) or cf[12386] in (${teamsToFetch.join(',')}))`;
  const commonExclusions = `type not in (Epic, subTaskIssueTypes()) and cf[13065] is EMPTY and (cf[12683] not in ("TESTES-LOCAVIA") or cf[12683] is EMPTY)`;
  const lmFilter = `${teamClause} and ${commonExclusions}`;
  // SFMKT (Salesforce Marketplace) é projeto próprio: traz tudo do projeto, só excluindo épicos/subtarefas.
  // Não aplicar cf[13065]/cf[12683] (filtros específicos dos projetos LM) para não descartar issues do SFMKT.
  const sfmktFilter = `project = SFMKT and type not in (Epic, subTaskIssueTypes())`;
  const simpleJql = `(${lmFilter}) OR (${sfmktFilter}) ORDER BY created DESC`;

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

    // Validação de schema: se os itens normalizados não baterem, ABORTA (não sobrescreve dado bom).
    const parsed = z.array(ItemSchema).safeParse(dashboardItems);
    if (!parsed.success) {
      console.error("❌ ERRO: dados normalizados inválidos — sync abortado para não corromper data.json.");
      console.error(parsed.error.issues.slice(0, 5));
      process.exit(1);
    }

    // Save to data.json (escrita atômica)
    const outputPath = path.resolve(process.cwd(), 'src/data.json');
    await writeAtomic(outputPath, JSON.stringify(dashboardItems, null, 2));

    // Grava o timestamp real desta sincronização. O header dos dashboards de SM
    // lê este valor (em vez de inferir a "frescura" a partir de uma issue qualquer),
    // e ele também serve de heartbeat: se travar em produção enquanto o git mostra
    // novos commits de sync, é sinal de que o Vercel não está redeployando.
    const metaPath = path.resolve(process.cwd(), 'src/data-meta.json');
    await writeAtomic(metaPath, JSON.stringify({ syncedAt: new Date().toISOString() }, null, 2));

    console.log(`✅ Sucesso! ${dashboardItems.length} itens salvos em src/data.json`);
    
  } catch (error) {
    console.error("ERRO durante a sincronização:", error);
    process.exit(1);
  }
}

main();
