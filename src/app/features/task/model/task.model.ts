export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  taskId: number;
  projectId: number;
  assigneeUserId: number;
  title: string;
  description: string;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  
  // Optional UI display fields if returned by backend DTO
  projectName?: string;
  assigneeUserName?: string;
}

export interface CreateTaskPayload {
  projectId: number;
  assigneeUserId: number;
  title: string;
  description: string;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  status: TaskStatus;
}
