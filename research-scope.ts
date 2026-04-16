import 'dotenv/config';
import { JiraClient } from './sync/jira-client';

async function research() {
    const baseUrl = process.env.JIRA_BASE_URL!;
    const email = process.env.JIRA_USER_EMAIL!;
    const token = process.env.JIRA_API_TOKEN!;
    const client = new JiraClient(baseUrl, email, token);

    // Search for all items in projects that might belong to UP, GOL, TERA, etc.
    const jql = `project in (WA, VAA, TERA, SN, RM, PRICI, MS, MIGRA, MDD, LKE, LKD, LI, JAC, DESMOB, CTO, CRED, COMP, APV, GOL, UP) AND (cf[11330] ~ "O4R2" OR fixVersion ~ "O4R2")`;
    
    console.log(`Searching with JQL: ${jql}`);
    const issues = await client.searchIssues(jql, ['key', 'status', 'customfield_11330', 'fixVersions', 'issuetype']);
    
    console.log(`Found ${issues.length} potential items for O4R2.`);
    
    const summary: any = {};
    issues.forEach(i => {
        const prefix = i.key.split('-')[0];
        if (!summary[prefix]) summary[prefix] = { total: 0, statuses: {} };
        summary[prefix].total++;
        const status = i.fields.status.name;
        summary[prefix].statuses[status] = (summary[prefix].statuses[status] || 0) + 1;
    });

    console.table(Object.entries(summary).map(([p, data]: any) => ({
        Prefix: p,
        Total: data.total,
        StatusSummary: JSON.stringify(data.statuses)
    })));
}

research();
