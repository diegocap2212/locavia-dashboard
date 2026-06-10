import 'dotenv/config';
import { JiraClient } from '../sync/jira-client';

async function investigate() {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_USER_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !token) {
    console.error("❌ Faltam credenciais do Jira no .env");
    return;
  }

  const client = new JiraClient(baseUrl, email, token);
  
  // JQL para buscar itens resolvidos na semana do dia 13/Abril
  // Vamos buscar um período um pouco maior para ter contexto
  const jql = `project = VAA AND resolved >= "2026-04-01" AND resolved <= "2026-04-17" ORDER BY resolved DESC`;
  
  console.log(`Buscando issues com JQL: ${jql}`);
  const issues = await client.searchIssues(jql, ['summary', 'status', 'resolutiondate', 'updated', 'issuetype', 'assignee', 'creator']);
  
  console.log(`Encontradas ${issues.length} issues resolvidas.`);
  
  const suspiciousIssues: any[] = [];

  for (const issue of issues) {
    const changelog = (issue as any).changelog;
    const history = changelog?.histories || [];
    
    // Encontrar quando ela chegou em "Desenvolvimento Concluído" (ou similar)
    // E quando foi movida para "Done" (ou similar)
    
    let devFinishedDate: string | null = null;
    let doneDate: string | null = null;
    let movedBy: string | null = null;
    
    for (const h of history) {
      for (const item of h.items) {
        if (item.field === 'status') {
          const toStatus = item.toString;
          const fromStatus = item.fromString;
          const author = h.author.displayName;
          const date = h.created;
          
          console.log(`[DEBUG] ${issue.key}: ${fromStatus} -> ${toStatus} por ${author} em ${date}`);

          if (toStatus.toUpperCase().includes('CONCLUÍDO') || toStatus.toUpperCase().includes('DONE') || toStatus.toUpperCase().includes('FINALIZADO')) {
            doneDate = date;
            movedBy = author;
          }
          
          if (toStatus.toUpperCase().includes('DESENVOLVIMENTO CONCLUÍDO') || toStatus.toUpperCase().includes('PRONTO PARA QA')) {
            devFinishedDate = date;
          }
        }
      }
    }

    const resolvedDate = (issue.fields as any).resolutiondate;
    
    suspiciousIssues.push({
      key: issue.key,
      summary: issue.fields.summary,
      assignee: issue.fields.assignee?.displayName || 'N/A',
      resolved: resolvedDate,
      devFinished: devFinishedDate,
      doneDate: doneDate,
      movedBy: movedBy,
      status: issue.fields.status.name
    });
  }

  // Ordenar por data de resolução
  suspiciousIssues.sort((a, b) => new Date(b.resolved).getTime() - new Date(a.resolved).getTime());

  console.log('\nRelatório de Transições - Projeto VAA:\n');
  console.table(suspiciousIssues.map(i => ({
    Key: i.key,
    Summary: i.summary.substring(0, 50),
    Resolved: i.resolved ? new Date(i.resolved).toLocaleDateString() : 'N/A',
    'Dev Concl.': i.devFinished ? new Date(i.devFinished).toLocaleDateString() : 'N/A',
    'Movido Por': i.movedBy || 'N/A'
  })));

  // Analisar os "9" itens mencionados pelo usuário
  const closedInWeek = suspiciousIssues.filter(i => {
    const date = new Date(i.resolved);
    return date >= new Date('2026-04-12') && date <= new Date('2026-04-15');
  });

  console.log(`\nIssues fechadas entre 12/Abr e 15/Abr: ${closedInWeek.length}`);
  for (const i of closedInWeek) {
    if (i.devFinished && i.resolved) {
      const diffDays = Math.floor((new Date(i.resolved).getTime() - new Date(i.devFinished).getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 7) {
        console.log(`⚠️ ${i.key} estava parada em "Dev Concluído" há ${diffDays} dias antes de ser fechada por ${i.movedBy}`);
      }
    }
  }
}

investigate();
