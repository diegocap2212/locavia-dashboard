import 'dotenv/config';
import { JiraClient } from './sync/jira-client';

async function research() {
    const baseUrl = process.env.JIRA_BASE_URL!;
    const email = process.env.JIRA_USER_EMAIL!;
    const token = process.env.JIRA_API_TOKEN!;
    const client = new JiraClient(baseUrl, email, token);

    const jql = `project = WA AND (cf[11330] = "O4R2" OR cf[11330] = "2024.1")`;
    console.log(`Searching for O4R2/2024.1 items in WA...`);
    const issues = await client.searchIssues(jql, ['status', 'customfield_11330']);
    
    const statusSummary: any = {};
    issues.forEach(i => {
        const s = i.fields.status.name;
        statusSummary[s] = (statusSummary[s] || 0) + 1;
    });
    console.table(statusSummary);
}

research();
