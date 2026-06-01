import 'dotenv/config';
import { JiraClient } from '../sync/jira-client';

async function listProjects() {
  const baseUrl = process.env.JIRA_BASE_URL!;
  const email = process.env.JIRA_USER_EMAIL!;
  const token = process.env.JIRA_API_TOKEN!;

  const client = new JiraClient(baseUrl, email, token);
  
  try {
    const projects = await client.request('/project');
    console.log('--- ALL JIRA PROJECTS ---');
    projects.forEach((p: any) => console.log(`${p.key}: ${p.name}`));
  } catch (error) {
    console.error('Error:', error);
  }
}

listProjects();
