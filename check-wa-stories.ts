import 'dotenv/config';
import { JiraClient } from './sync/jira-client';

async function research() {
    const baseUrl = process.env.JIRA_BASE_URL!;
    const email = process.env.JIRA_USER_EMAIL!;
    const token = process.env.JIRA_API_TOKEN!;
    const client = new JiraClient(baseUrl, email, token);

    // Search for Stories/Tasks in project WA for O4R2
    const jql = `project = WA AND (cf[11330] = "O4R2" OR cf[11330] = "2024.1") AND type in (Story, Task, Bug, "Tarefa") AND status not in (Backlog, "1. Backlog", Cancelado, Descartado, "A Refinar", Saneamento)`;
    
    console.log(`Searching for Stories/Tasks in project WA for O4R2...`);
    const issues = await client.searchIssues(jql, ['key', 'status', 'customfield_11330', 'issuetype']);
    
    console.log(`Found ${issues.length} items.`);
    issues.forEach(i => {
        console.log(`Key: ${i.key} | Type: ${i.fields.issuetype.name} | Status: ${i.fields.status.name} | Release: ${JSON.stringify(i.fields.customfield_11330)}`);
    });
}

research();
