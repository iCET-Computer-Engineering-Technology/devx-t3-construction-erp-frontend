import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardResponse {
  role: string;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
  budgetUsedPercentage: number;
}

export interface StandardResponse {
  code: number;
  message: string;
  data: DashboardResponse;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = '/api/dashboard';

  getDashboardData(): Observable<StandardResponse> {
    return this.http.get<StandardResponse>(this.apiUrl);
  }
}
