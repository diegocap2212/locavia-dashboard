import { DashboardItem } from '../src/types/jira';

export function calculateMetrics(item: DashboardItem): DashboardItem {
  if (item.Created && item.Resolved) {
    const createdDate = new Date(item.Created);
    const resolvedDate = new Date(item.Resolved);
    const diffTime = Math.abs(resolvedDate.getTime() - createdDate.getTime());
    const leadTimeDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    item.LeadTime = leadTimeDays;
  }
  
  // Future enhancements: parse `issue.changelog` to compute `TimeInStatus` and `CycleTime`
  
  return item;
}
