import 'dotenv/config';
import { JiraClient } from './sync/jira-client';

async function research() {
    const baseUrl = process.env.JIRA_BASE_URL!;
    const email = process.env.JIRA_USER_EMAIL!;
    const token = process.env.JIRA_API_TOKEN!;
    const client = new JiraClient(baseUrl, email, token);

    console.log(`\n--- Researching Key Found in Spreadsheet: WA-747 ---`);
    try {
        const issues = await client.searchIssues('key = WA-747', ['*all']);
        if (issues.length > 0) {
            const i = issues[0];
            console.log(`Key: ${i.key}`);
            console.log(`Type: ${i.fields.issuetype.name}`);
            console.log(`Status: ${i.fields.status.name}`);
            console.log(`Release (cf[11330]): ${JSON.stringify(i.fields.customfield_11330)}`);
            console.log(`Fix Versions: ${JSON.stringify(i.fields.fixVersions.map((v: any) => v.name))}`);
            console.log(`Jornada (cf[12386]): ${JSON.stringify(i.fields.customfield_12386)}`);
            console.log(`Labels: ${JSON.stringify(i.fields.labels)}`);
        } else {
            console.log('WA-747 not found in Jira!');
        }
    } catch (e) {
        console.error(`Error: ${e}`);
    }
}

research();
