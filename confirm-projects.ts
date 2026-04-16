import 'dotenv/config';
import { JiraClient } from './sync/jira-client';

async function research() {
    const baseUrl = process.env.JIRA_BASE_URL!;
    const email = process.env.JIRA_USER_EMAIL!;
    const token = process.env.JIRA_API_TOKEN!;
    const client = new JiraClient(baseUrl, email, token);

    const jql = `key in (GOL-316, CONE-891, WA-696, WA-659)`;
    console.log(`Searching for specific keys...`);
    const issues = await client.searchIssues(jql, ['project', 'customfield_11330', 'status']);
    
    issues.forEach(i => {
        console.log(`Key: ${i.key} | Project: ${i.fields.project.key} | Status: ${i.fields.status.name} | Release: ${JSON.stringify(i.fields.customfield_11330)}`);
    });
}

research();
