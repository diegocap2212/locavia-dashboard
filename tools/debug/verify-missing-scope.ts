import 'dotenv/config';
import { JiraClient } from '../sync/jira-client';

async function verifyMissing() {
  const baseUrl = process.env.JIRA_BASE_URL!;
  const email = process.env.JIRA_USER_EMAIL!;
  const token = process.env.JIRA_API_TOKEN!;

  const client = new JiraClient(baseUrl, email, token);
  
  const projects = ['WA', 'VAA', 'TERA', 'SN', 'RM', 'PRICI', 'MS', 'MIGRA', 'MDD', 'LKE', 'LKD', 'LI', 'JAC', 'DESMOB', 'CTO', 'CRED', 'COMP', 'APV'];
  
  // Search EVERYTHING in the last 15 days, no release filter
  const jql = `project in (${projects.join(',')}) and created >= -15d and type not in (Epic, subTaskIssueTypes())`;
  
  try {
    const issues = await client.searchIssues(jql, ['labels', 'customfield_11330', 'summary', 'project', 'status']);
    console.log(`Found ${issues.length} issues created in the last 15 days.`);
    
    issues.forEach(issue => {
        const release = issue.fields.customfield_11330 || [];
        if (release.length === 0) {
            console.log(`MISSING RELEASE: ${issue.key} - ${issue.fields.summary} | Labels: ${issue.fields.labels.join(',')}`);
        }
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

verifyMissing();
