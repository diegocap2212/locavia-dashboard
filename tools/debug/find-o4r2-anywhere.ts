import 'dotenv/config';
import { JiraClient } from '../sync/jira-client';

async function findO4R2() {
  const baseUrl = process.env.JIRA_BASE_URL!;
  const email = process.env.JIRA_USER_EMAIL!;
  const token = process.env.JIRA_API_TOKEN!;

  const client = new JiraClient(baseUrl, email, token);
  
  // Search for anything with O4R2 in Release or Labels, NOT in our current project list
  const currentProjects = ['WA', 'VAA', 'TERA', 'SN', 'RM', 'PRICI', 'MS', 'MIGRA', 'MDD', 'LKE', 'LKD', 'LI', 'JAC', 'DESMOB', 'CTO', 'CRED', 'COMP', 'APV'];
  const jql = `(cf[11330] = "O4R2" or labels = "O4R2") and project not in (${currentProjects.join(',')})`;
  
  console.log(`Searching for O4R2 in other projects: ${jql}`);
  
  try {
    const issues = await client.searchIssues(jql, ['project', 'summary']);
    console.log(`Found ${issues.length} issues in OTHER projects.`);
    
    const projectsCount: Record<string, number> = {};
    issues.forEach(i => {
        const pk = i.fields.project?.key || 'Unknown';
        projectsCount[pk] = (projectsCount[pk] || 0) + 1;
    });
    
    console.log('Projects with O4R2 not in list:', projectsCount);
  } catch (error) {
    console.error('Error:', error);
  }
}

findO4R2();
