import { DashboardItem, JiraApiIssue } from '../src/types/jira';

const IN_PROGRESS = [
  'in progress', 'em andamento', 'em desenvolvimento', 'developing', 
  'em execução', 'doing', 'em progresso', 'em refinamento',
  'code review em progresso'
];
  
const DONE_STATUSES = [
  'concluido', 'concluído', 'done', 'resolvido', 'finalizado', 
  'entregue', 'fechado', 'desenv concluido', 'desenv concluído',
  'teste concluido', 'entrega finalizada', 'aguardando qa', 'qa em progresso',
  'em teste', 'aguardando teste', 'aguardando deploy qa', 'aguardando deploy prod',
  'aguardando homolog', 'homolog em progresso'
];

export function calculateMetrics(item: DashboardItem, rawIssue: JiraApiIssue): DashboardItem {
  // 1. Calculate IsPlanned
  item.IsPlanned = !!item.CommitmentDate;
  
  // 2. Cycle Time & Time In Todo from Changelog
  if (rawIssue.changelog && rawIssue.changelog.histories) {
    let firstInProgressDate: Date | null = null;
    let finalDoneDate: Date | null = null;
    
    // Sort histories chronological
    const histories = rawIssue.changelog.histories.sort((a, b) => 
      new Date(a.created).getTime() - new Date(b.created).getTime()
    );
    
    for (const history of histories) {
      for (const historyItem of history.items) {
        if (historyItem.field === 'status') {
          const toString = (historyItem.toString || '').toLowerCase();
          const isDone = DONE_STATUSES.some(s => toString === s || toString.includes(s));
          
          if (isDone) {
            if (!finalDoneDate) {
              finalDoneDate = new Date(history.created);
            }
          } else {
            finalDoneDate = null;
            if (!firstInProgressDate && IN_PROGRESS.some(s => toString.includes(s))) {
              firstInProgressDate = new Date(history.created);
            }
          }
        }
      }
    }
    
    if (finalDoneDate) {
      item.Resolved = finalDoneDate.toISOString();
    } else if (!finalDoneDate && item.StatusCategory === 'DONE') {
      finalDoneDate = item.Resolved ? new Date(item.Resolved) : new Date(item.UpdatedAt);
    }
    
    if (firstInProgressDate && finalDoneDate && finalDoneDate >= firstInProgressDate) {
      const diffTime = finalDoneDate.getTime() - firstInProgressDate.getTime();
      item.CycleTime = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else if (firstInProgressDate && item.StatusCategory === 'IN_PROGRESS') {
      const diffTime = new Date().getTime() - firstInProgressDate.getTime();
      item.CycleTime = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    if (firstInProgressDate && item.Created) {
       const createdDate = new Date(item.Created);
       if (firstInProgressDate > createdDate) {
           item.TimeInTodo = Math.ceil((firstInProgressDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
       } else {
           item.TimeInTodo = 0;
       }
    }
  }

  if (item.StatusCategory === 'DONE' && !item.Resolved) {
    item.Resolved = item.UpdatedAt;
  }

  // 3. Raw LeadTime (Created to Resolved)
  if (item.Created && item.Resolved) {
    const createdDate = new Date(item.Created);
    const resolvedDate = new Date(item.Resolved);
    const diffTime = Math.abs(resolvedDate.getTime() - createdDate.getTime());
    item.LeadTime = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } else if (item.StatusCategory === 'DONE' && item.Created && item.UpdatedAt) {
    const createdDate = new Date(item.Created);
    const resolvedDate = new Date(item.UpdatedAt);
    const diffTime = Math.abs(resolvedDate.getTime() - createdDate.getTime());
    item.LeadTime = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  // 4. Data Quality Flags
  const untouchedDays = Math.ceil((new Date().getTime() - new Date(item.UpdatedAt).getTime()) / (1000 * 60 * 60 * 24));
  
  item.DataQuality = {
    missingResolutionDate: item.StatusCategory === 'DONE' && !item.Resolved,
    missingAssignee: !item.Assignee,
    noStatusTransitions: (!rawIssue.changelog || !rawIssue.changelog.histories || rawIssue.changelog.histories.length === 0) && item.StatusCategory !== 'TODO',
    noSprint: false,
    staleTodo: item.StatusCategory === 'TODO' && untouchedDays > 30,
    suspiciouslyLongLead: (item.LeadTime || 0) > 180,
    doneWithoutCycleData: item.StatusCategory === 'DONE' && item.CycleTime === null
  };
  
  return item;
}
