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
      const errorText = await response.text();
      throw new Error(`Jira API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  // Busca issues via JQL com paginação automática
  async searchIssues(jql: string, fields: string[] = ['*all'], expand: string[] = []): Promise<JiraApiIssue[]> {
    const allIssues: JiraApiIssue[] = [];
    let startAt = 0;
    const maxResults = 100;
    let isLast = false;

    while (!isLast) {
      console.log(`Buscando iterativamente, startAt: ${startAt}...`);
      
      const queryParams = new URLSearchParams({
        jql,
        startAt: startAt.toString(),
        maxResults: maxResults.toString(),
        fields: fields.join(',')
      });
      if (expand && expand.length > 0) {
        queryParams.append('expand', expand.join(','));
      }

      const data = await this.request(`/search/jql?${queryParams.toString()}`, {
        method: 'GET'
      });

      if (data.issues && data.issues.length > 0) {
        allIssues.push(...data.issues);
      }

      startAt += data.issues.length;
      isLast = startAt >= data.total || data.issues.length === 0 || allIssues.length >= 10000; // Limit to 10000
    }

    return allIssues;
  }

  // Lista todos os campos disponíveis (para descobrir custom fields)
  async getFields(): Promise<{ id: string; name: string; custom: boolean; schema?: any }[]> {
    return this.request('/field');
  }
}
