import { JiraApiIssue } from '../src/types/jira';

export class JiraClient {
  private baseUrl: string;
  private authHeader: string;

  constructor(baseUrl: string, email: string, apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    const credentials = Buffer.from(`${email}:${apiToken}`).toString('base64');
    this.authHeader = `Basic ${credentials}`;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}/rest/api/3${endpoint}`;
    
    // Add default headers
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', this.authHeader);
    headers.set('Accept', 'application/json');
    if (options.method === 'POST' || options.method === 'PUT') {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorData = await response.json();
        errorDetail = JSON.stringify(errorData);
      } catch {
        errorDetail = await response.text();
      }
      throw new Error(`Jira API Error: ${response.status} ${response.statusText} at ${url}\nDetails: ${errorDetail}`);
    }

    return response.json();
  }

  // Busca issues via Enhanced Search (JQL) com paginação por tokens
  async searchIssues(jql: string, fields: string[] = ['summary', 'status', 'issuetype', 'created', 'updated', 'labels', 'customfield_11330', 'customfield_12386', 'customfield_11795', 'customfield_10001', 'customfield_10215', 'customfield_13065', 'customfield_12683']): Promise<JiraApiIssue[]> {
    const allIssues: JiraApiIssue[] = [];
    let nextPageToken: string | undefined = undefined;
    const maxResults = 100;
    let isLast = false;

    while (!isLast) {
      console.log(`Buscando lote de issues (token: ${nextPageToken || 'inicial'})...`);
      
      const body: any = {
        jql,
        maxResults,
        fields,
        fieldsByKeys: false,
        expand: 'changelog'
      };
      
      if (nextPageToken) {
        body.nextPageToken = nextPageToken;
      }

      const data = await this.request('/search/jql', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (data.issues && data.issues.length > 0) {
        allIssues.push(...data.issues);
      }

      nextPageToken = data.nextPageToken;
      isLast = !nextPageToken || allIssues.length >= 30000;
      
      if (isLast && nextPageToken) {
        console.log(`Aviso: Limite de 30.000 itens atingido, mas ainda há mais dados.`);
      }
    }

    return allIssues;
  }

  // Lista todos os campos disponíveis (para descobrir custom fields)
  async getFields(): Promise<{ id: string; name: string; custom: boolean; schema?: any }[]> {
    return this.request('/field');
  }
}
