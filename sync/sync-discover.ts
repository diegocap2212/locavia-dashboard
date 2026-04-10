import 'dotenv/config';
import { JiraClient } from './jira-client';

async function discover() {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_USER_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !token) {
    console.error("Missing JIRA variables in .env");
    process.exit(1);
  }

  const client = new JiraClient(baseUrl, email, token);

  try {
    console.log("Conectando e buscando campos customizados...");
    const fields = await client.getFields();
    
    // Filtra apenas campos preenchíveis/customizados relevantes
    const interesting = fields.filter(f => 
      f.name.toLowerCase().includes('time') || 
      f.name.toLowerCase().includes('team') || 
      f.name.toLowerCase().includes('squad') || 
      f.name.toLowerCase().includes('release') ||
      f.name.toLowerCase().includes('versão') ||
      f.name.toLowerCase().includes('version')
    );

    console.log(`\nEncontrados ${interesting.length} campos possivelmente relevantes:`);
    interesting.forEach(f => {
      console.log(`- ${f.name} (ID: ${f.id}) [Custom: ${f.custom}]`);
    });

  } catch (error) {
    console.error("Erro na request:", error);
  }
}

discover();
