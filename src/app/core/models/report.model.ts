export interface ProjectReport {
  projectId: number;
  projectName: string;
  status: string;
  totalBudget: number;
  totalExpenses: number;
  remainingBudget: number;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}

export interface ProjectReportResponse {
  data: ProjectReport;
  success: boolean;
}
