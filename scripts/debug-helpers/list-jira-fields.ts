import 'dotenv/config';
import { JiraClient } from '../sync/jira-client';
import fs from 'fs/promises';

async function listFields() {
  const baseUrl = process.env.JIRA_BASE_URL!;
  const email = process.env.JIRA_USER_EMAIL!;
  const token = process.env.JIRA_API_TOKEN!;

  const client = new JiraClient(baseUrl, email, token);
  
  try {
    const fields = await client.getFields();
    await fs.writeFile('jira_fields.json', JSON.stringify(fields, null, 2));
    console.log(`Saved ${fields.length} fields to jira_fields.json`);
    
    const relevant = fields.filter(f => f.id === 'customfield_11330' || f.id === 'customfield_12386' || f.name.toLowerCase().includes('release') || f.name.toLowerCase().includes('jornada'));
    console.log('Relevant Fields:', relevant);
  } catch (error) {
    console.error('Error:', error);
  }
}

listFields();
