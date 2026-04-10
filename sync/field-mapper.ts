import { JiraApiIssue, DashboardItem } from '../src/types/jira';

// Mapeamento de Status Categories
const STATUS_CATEGORY_MAP: Record<string, DashboardItem['StatusCategory']> = {
  'To Do': 'TODO',
  'In Progress': 'IN_PROGRESS',
  'Done': 'DONE',
  'new': 'TODO',
  'indeterminate': 'IN_PROGRESS'
};

export function mapJiraIssueToDashboardItem(issue: JiraApiIssue): DashboardItem {
  // 11795 -> Time
  // 11330 -> Release

  const teamField = issue.fields.customfield_11795;
  const teamValue = teamField ? teamField.value : 'N/A';

  const releaseField = issue.fields.customfield_11330;
  const fixVersions = issue.fields.fixVersions || [];
  
  let releaseValue = 'N/A';
  if (fixVersions.length > 0) {
    releaseValue = fixVersions.map((v: any) => v.name).join(', ');
  } else if (releaseField && Array.isArray(releaseField) && releaseField.length > 0) {
    releaseValue = releaseField.join(', ');
  } else if (typeof releaseField === 'string' && releaseField) {
    releaseValue = releaseField;
  }

  const statusName = issue.fields.status?.name || 'Unknown';
  let categoryName = issue.fields.status?.statusCategory?.name || 'To Do';
  
  let category: DashboardItem['StatusCategory'] = 'TODO';
  if (categoryName === 'Done' || statusName.toLowerCase().includes('concluído') || statusName.toLowerCase().includes('done')) {
    category = 'DONE';
  } else if (categoryName === 'In Progress' || statusName.toLowerCase().includes('progress')) {
    category = 'IN_PROGRESS';
  }

  // Story Points (usually 10016, 10026, etc, but we'll try to find any numeric field that looks like SP, or just assume 1 if not found for now)
  // Or we can leave it null until we locate the story points custom field.
  const storyPoints = issue.fields.customfield_10016 || issue.fields.customfield_10026 || null;

  return {
    Type: issue.fields.issuetype?.name || 'Task',
    Key: issue.key,
    Summary: issue.fields.summary || '',
    Status: statusName,
    StatusCategory: category,
    Team: teamValue,
    Created: issue.fields.created,
    Resolved: issue.fields.resolutiondate || null,
    Release: releaseValue,
    StoryPoints: typeof storyPoints === 'number' ? storyPoints : null,
    Priority: issue.fields.priority?.name || 'Medium',
    Assignee: issue.fields.assignee?.displayName || null,
    Labels: issue.fields.labels || [],
    CycleTime: null, // Will calculate later using changelog
    LeadTime: null,  // Will calculate later if both dates present
    TimeInStatus: {}, // Will calculate later
    Source: 'api'
  };
}
