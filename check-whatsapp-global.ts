import 'dotenv/config';
import { JiraClient } from './sync/jira-client';

async function research() {
    const baseUrl = process.env.JIRA_BASE_URL!;
    const email = process.env.JIRA_USER_EMAIL!;
    const token = process.env.JIRA_API_TOKEN!;
    const client = new JiraClient(baseUrl, email, token);

    // Search for any Story/Task in any project with Jornada "WHATSAPP" for O4R2
    const jql = `(cf[12386] = "WHATSAPP" OR cf[10215] = "WHATSAPP") AND (cf[11330] = "O4R2" OR cf[11330] = "2024.1") AND type in (Story, Task, Bug, "Tarefa") AND status not in (Backlog, "1. Backlog", Cancelado, Descartado, "A Refinar", Saneamento)`;
    
    console.log(`Searching for any Story/Task with Jornada "WHATSAPP" for O4R2...`);
    const issues = await client.searchIssues(jql, ['key', 'project', 'status', 'customfield_11330', 'issuetype']);
    
    console.log(`Found ${issues.length} items.`);
    issues.forEach(i => {
        console.log(`Key: ${i.key} | Project: ${i.fields.project.key} | Status: ${i.fields.status.name} | Release: ${JSON.stringify(i.fields.customfield_11330)}`);
    });
}

research();
