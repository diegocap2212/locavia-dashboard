export interface MetricComment {
  gap: string;
  action: string;
}

export interface ReleaseComments {
  [metricName: string]: MetricComment;
}

export interface SquadComments {
  [releaseId: string]: ReleaseComments;
}

export interface CommentsData {
  [smOrSquadId: string]: SquadComments;
}
