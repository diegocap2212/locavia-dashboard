import 'dotenv/config';
import { JiraClient } from '../sync/jira-client';

async function discover() {
  const baseUrl = process.env.JIRA_BASE_URL!;
  const email = process.env.JIRA_USER_EMAIL!;
  const token = process.env.JIRA_API_TOKEN!;

  const client = new JiraClient(baseUrl, email, token);
  
  const projects = ['WA', 'VAA', 'TERA', 'SN', 'RM', 'PRICI', 'MS', 'MIGRA', 'MDD', 'LKE', 'LKD', 'LI', 'JAC', 'DESMOB', 'CTO', 'CRED', 'COMP', 'APV'];
  
  // Search for issues updated in the last 7 days in these projects
  const discoveryJql = `project in (${projects.join(',')}) and updated >= -7d and type not in (Epic, subTaskIssueTypes())`;
  
  console.log(`Searching for recent updates: ${discoveryJql}`);
  
  try {
    const issues = await client.searchIssues(discoveryJql, ['labels', 'customfield_11330', 'summary', 'project']);
    console.log(`Found ${issues.length} recently updated issues.`);
    
    const labelCounts: Record<string, number> = {};
    const releaseFieldCounts: Record<string, number> = {};
    
    issues.forEach(issue => {
      (issue.fields.labels || []).forEach((l: string) => {
        labelCounts[l] = (labelCounts[l] || 0) + 1;
      });
      const rf = issue.fields.customfield_11330;
      if (Array.isArray(rf)) {
        rf.forEach((v: any) => {
            const val = typeof v === 'string' ? v : (v.value || v.name || JSON.stringify(v));
            releaseFieldCounts[val] = (releaseFieldCounts[val] || 0) + 1;
        });
      }
    });
    
    console.log('\n--- Top Labels in Recent Updates ---');
    Object.entries(labelCounts).sort((a,b) => b[1]-a[1]).slice(0, 40).forEach(([l, c]) => console.log(`${l}: ${c}`));
    
    console.log('\n--- Release Field (customfield_11330) Values ---');
    Object.entries(releaseFieldCounts).sort((a,b) => b[1]-a[1]).forEach(([v, c]) => console.log(`${v}: ${c}`));

  } catch (error) {
    console.error('Error:', error);
  }
}

discover();
