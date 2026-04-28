// Tipo bruto vindo da API Jira
export interface JiraApiIssue {
  key: string;
  fields: {
    issuetype: { name: string };
    summary: string;
    status: { name: string; statusCategory: { name: string } };
    created: string;        // ISO 8601
    resolutiondate: string | null;
    fixVersions: { name: string }[];
    [key: string]: any; // Allow custom fields
    labels: string[];
    priority: { name: string };
    assignee: { displayName: string } | null;
  };
  changelog?: {
    histories: StatusTransition[];
  };
}

// Transição de status (para métricas avançadas)
export interface StatusTransition {
  created: string; // ISO timestamp
  items: {
    field: string;
    fromString: string;
    toString: string;
  }[];
}

// Formato normalizado para o dashboard (evolução do formato atual)
export interface DashboardItem {
  Type: string;
  Key: string;
  Summary: string;
  Status: string;
  StatusCategory: 'TODO' | 'IN_PROGRESS' | 'DONE';
  Team: string;
  Created: string;          // ISO 8601
  Resolved: string | null;  // ISO 8601 — resolutiondate do Jira (só preenchido no fechamento final)
  UpdatedAt: string;        // ISO 8601 — fields.updated do Jira; fallback de data para itens DONE sem Resolved
  Release: string;
  StoryPoints: number | null;
  Priority: string;
  Assignee: string | null;
  Labels: string[];
  CycleTime: number | null;  // Dias (calculado via changelog)
  LeadTime: number | null;   // Dias (Created → Resolved)
  TimeInStatus: Record<string, number>; // Horas por status
  Source: 'api' | 'excel';
}
