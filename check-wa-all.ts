import 'dotenv/config';
import { JiraClient } from './sync/jira-client';

async function research() {
    const baseUrl = process.env.JIRA_BASE_URL!;
    const email = process.env.JIRA_USER_EMAIL!;
    const token = process.env.JIRA_API_TOKEN!;
    const client = new JiraClient(baseUrl, email, token);

    const jql = `project = WA AND status not in (Backlog, "1. Backlog", Cancelado, Descartado, "A Refinar", Saneamento)`;
    console.log(`Searching for all active items in project WA...`);
    const issues = await client.searchIssues(jql, ['customfield_11330', 'status', 'summary']);
    
    console.log(`Found ${issues.length} items in WA.`);
    const releaseSummary: any = {};
    issues.forEach(i => {
        const rel = JSON.stringify(i.fields.customfield_11330) || 'NONE';
        releaseSummary[rel] = (releaseSummary[rel] || 0) + 1;
    });
    console.table(releaseSummary);
}

research();
