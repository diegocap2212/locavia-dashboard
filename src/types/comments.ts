export interface MetricComment {
  gap: string;
  action: string;
  updatedAt?: string; // ISO timestamp da última edição (gerado no servidor)
}

export interface QuinzenaComments {
  [metricName: string]: MetricComment;
}

export interface ReleaseComments {
  [quinzenaId: string]: QuinzenaComments;
}

export interface SquadComments {
  [releaseId: string]: ReleaseComments;
}

export interface CommentsData {
  [smOrSquadId: string]: SquadComments;
}
