import 'dotenv/config';
import { JiraClient } from './sync/jira-client';

async function research() {
    const baseUrl = process.env.JIRA_BASE_URL!;
    const email = process.env.JIRA_USER_EMAIL!;
    const token = process.env.JIRA_API_TOKEN!;
    const client = new JiraClient(baseUrl, email, token);

    const jql = `project = WA AND (cf[11330] = "O4R2" OR cf[11330] = "2024.1") AND status = "DESENV CONCLUIDO"`;
    console.log(`Searching for O4R2/2024.1 items in WA with status DESENV CONCLUIDO...`);
    const issues = await client.searchIssues(jql, ['key', 'status', 'customfield_11330', 'customfield_12386', 'issuetype']);
    
    issues.slice(0, 5).forEach(i => {
        console.log(`Key: ${i.key} | Type: ${i.fields.issuetype.name} | Release: ${JSON.stringify(i.fields.customfield_11330)} | Jornada: ${JSON.stringify(i.fields.customfield_12386)}`);
    });
}

research();
