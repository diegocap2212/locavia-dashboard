import 'dotenv/config';
import { JiraClient } from './sync/jira-client';

async function research() {
    const baseUrl = process.env.JIRA_BASE_URL!;
    const email = process.env.JIRA_USER_EMAIL!;
    const token = process.env.JIRA_API_TOKEN!;
    const client = new JiraClient(baseUrl, email, token);

    const projects = ['WA', 'VAA', 'TERA', 'SN', 'RM', 'PRICI', 'MS', 'MIGRA', 'MDD', 'LKE', 'LKD', 'LI', 'JAC', 'DESMOB', 'CTO', 'CRED', 'COMP', 'APV', 'CON', 'GOL', 'UP'];
    const jornadas = ['"WHATSAPP"', '"Comercial"', '"Pos_venda"', '"Migra_Blip"', '"VENDAS_AUTO-ATENDIMENTO"', '"CADASTRO_DE_USUÁRIO"', '"MOB"', '"SEMINOVOS"', '"FATURAMENTO"', '"CONTRATOS"', '"ESTOQUE"', '"COMPRAS"', '"JURÍDICO"', '"RH"', '"FINANCEIRO"', '"FISCAL"', '"CONTROLADORIA"', '"TI"', '"OPERAÇÕES"', '"MANUTENÇÃO"', '"LOGÍSTICA"', '"SINISTRO"', '"QUALIDADE"', '"CLIENTE"', '"FORNECEDOR"', '"FROTA"', '"EQUIPAMENTO"', '"TELECOM"', '"FACILITIE"', '"GESTÃO"', '"OUTROS"', '"LAKE-DOMINIO"', '"VENDAS_ASSISTIDAS"', '"PRICING"', '"MIGRAÇÃO"'];
    const releases = ['"O4R1"', '"O4R2"', '"O4R3"', '"BAF"', '"BAF-QW"', '"CEM"', '"Wave 4"', '"Release 2"', '"Onda 4"', '"Release 01"', '"Release_01"', '"2024.1"', '"2024.2"'];
    const excludedStatuses = ['"1. BACKLOG"', '"BACKLOG"', '"EM REFINAMENTO"', '"REFINANDO"', '"A REFINAR"', '"SANEAMENTO"', '"ESPERANDO"', '"DESCARTADO"', '"CANCELADO"'];

    const jql = `project in (${projects.join(',')}) and type not in (Epic, subTaskIssueTypes()) and (cf[11330] in (${releases.join(',')}) or (cf[12386] in (${jornadas.join(',')}) and project in (WA, JAC, VAA, LKD, SN)) or (cf[10215] in (${jornadas.join(',')}) and project in (WA, JAC, VAA, LKD, SN))) and status not in (${excludedStatuses.join(',')}) AND key = WA-781`;
    
    console.log(`Searching for WA-781 with full JQL logic...`);
    const issues = await client.searchIssues(jql);
    
    if (issues.length > 0) {
        console.log(`✅ FOUND WA-781!`);
    } else {
        console.log(`❌ NOT FOUND. Checking why...`);
        // Test parts of JQL
        const test1 = await client.searchIssues(`key = WA-781 AND status not in (${excludedStatuses.join(',')})`);
        console.log(`Status test: ${test1.length > 0 ? 'Passed' : 'Failed'}`);
        
        const test2 = await client.searchIssues(`key = WA-781 AND (cf[11330] in (${releases.join(',')}))`);
        console.log(`Release test: ${test2.length > 0 ? 'Passed' : 'Failed'}`);
        
        const test3 = await client.searchIssues(`key = WA-781 AND (cf[12386] in (${jornadas.join(',')}))`);
        console.log(`Jornada test: ${test3.length > 0 ? 'Passed' : 'Failed'}`);
    }
}

research();
