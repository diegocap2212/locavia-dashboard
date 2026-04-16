import 'dotenv/config';
import { JiraClient } from './sync/jira-client';

async function research() {
    const baseUrl = process.env.JIRA_BASE_URL!;
    const email = process.env.JIRA_USER_EMAIL!;
    const token = process.env.JIRA_API_TOKEN!;
    const client = new JiraClient(baseUrl, email, token);

    const keys = ['WA-696', 'GOL-316', 'CONE-891'];
    
    for (const key of keys) {
        console.log(`\n--- Researching Key: ${key} ---`);
        try {
            const issue = await client.getIssue(key, ['*all']);
            console.log(`Key: ${key}`);
            console.log(`Project: ${issue.fields.project.key}`);
            console.log(`Status: ${issue.fields.status.name}`);
            console.log(`Release (cf[11330]): ${JSON.stringify(issue.fields.customfield_11330)}`);
            console.log(`Fix Versions: ${JSON.stringify(issue.fields.fixVersions.map((v: any) => v.name))}`);
            console.log(`Time field (cf[11795]): ${JSON.stringify(issue.fields.customfield_11795)}`);
            console.log(`Jornada field (cf[12386]): ${JSON.stringify(issue.fields.customfield_12386)}`);
            console.log(`Team field (cf[10001]): ${JSON.stringify(issue.fields.customfield_10001)}`);
        } catch (e) {
            console.error(`Error fetching ${key}: ${e}`);
        }
    }
}

research();
