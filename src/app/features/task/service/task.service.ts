import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CreateTaskPayload, Task } from '../model/task.model';

interface TaskApiResponse {
  id?: number;
  task_id?: number;
  taskId?: number;
  title?: string;
  task_title?: string;
  description?: string;
  project_id?: number;
  projectId?: number;
  project_name?: string;
  projectName?: string;
  assigned_user_id?: string | number;
  assigneeUserId?: string | number;
  assigned_user_name?: string;
  assignedUserName?: string;
  start_date?: string | number;
  startDate?: string | number;
  end_date?: string | number;
  endDate?: string | number;
  due_date?: string | number;
  dueDate?: string | number;
  status?: string;
  priority?: string;
}

import { UserService } from '../../../core/services/user.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly apiUrl = 'http://localhost:8080/tasks';
  
  private readonly tasksSignal = signal<Task[]>([]);
  private usersMap = new Map<number, string>();

  readonly tasks = this.tasksSignal.asReadonly();
  readonly count = computed(() => this.tasksSignal().length);

  constructor() {
    this.loadUsersAndTasks();
  }

  private loadUsersAndTasks(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        (users || []).forEach((u: any) => this.usersMap.set(Number(u.userId), u.name));
        this.refreshTasks();
      },
      error: (err) => {
        console.error('Failed to load users for tasks', err);
        this.refreshTasks();
      }
    });
  }

  refreshTasks(): void {
    this.http.get<TaskApiResponse[]>(this.apiUrl).subscribe({
      next: (items) => {
        const mapped = (items ?? []).map((task) => this.mapFromApi(task));
        this.tasksSignal.set(mapped);
      },
      error: (error: unknown) => {
        console.error('Failed to load tasks', error);
        this.tasksSignal.set([]);
      },
    });
  }

  createTask(payload: CreateTaskPayload) {
    const body = this.mapToApi(payload);

    return this.http.post<unknown>(this.apiUrl, body).pipe(tap(() => this.refreshTasks()));
  }

  updateTaskStatus(taskId: number, newStatus: Task['status']) {
    return this.http.patch<unknown>(`${this.apiUrl}/${taskId}`, { status: newStatus }).pipe(
      tap(() => this.refreshTasks())
    );
  }

  getTaskById(id: number): Observable<Task | null> {
    const existing = this.tasksSignal().find((task) => task.taskId === id);
    if (existing) {
      return of(existing);
    }

    return this.http.get<TaskApiResponse>(`${this.apiUrl}/${id}`).pipe(
      map((item) => this.mapFromApi(item)),
      catchError((error: unknown) => {
        console.error('Failed to load task by id', error);
        return of(null);
      })
    );
  }

  getMyTasks(userId: number): Observable<Task[]> {
    return this.http.get<TaskApiResponse[]>(`${this.apiUrl}/my`, {
      headers: { 'User-Id': userId.toString() }
    }).pipe(
      map(items => (items ?? []).map(task => this.mapFromApi(task))),
      catchError(error => {
        console.error('Failed to load my tasks', error);
        return of([]);
      })
    );
  }

  private mapToApi(payload: CreateTaskPayload) {
    return {
      taskId: undefined, // Usually null for creation
      projectId: payload.projectId,
      assigneeUserId: payload.assigneeUserId,
      title: payload.title,
      description: payload.description,
      priority: payload.priority,
      startDate: new Date(payload.startDate).getTime(),
      endDate: new Date(payload.endDate).getTime(),
      status: payload.status,
    };
  }

  private mapFromApi(item: TaskApiResponse): Task {
    const status = (item.status ?? 'TODO').toUpperCase();
    const priority = (item.priority ?? 'MEDIUM').toUpperCase();

    const assigneeId = Number(item.assigneeUserId ?? item.assigned_user_id ?? 0);
    const resolvedAssigneeName = item.assigned_user_name ?? item.assignedUserName ?? this.usersMap.get(assigneeId);

    return {
      taskId: Number(item.id ?? item.task_id ?? item.taskId ?? 0),
      projectId: Number(item.project_id ?? item.projectId ?? 0),
      assigneeUserId: assigneeId,
      title: item.title ?? item.task_title ?? 'Untitled Task',
      description: item.description ?? '',
      priority: this.normalizePriority(priority),
      startDate: this.toIsoDate(item.start_date ?? item.startDate),
      endDate: this.toIsoDate(item.end_date ?? item.endDate ?? item.due_date ?? item.dueDate),
      status: this.normalizeStatus(status),
      projectName: item.project_name ?? item.projectName,
      assigneeUserName: resolvedAssigneeName,
    };
  }

  private toIsoDate(value: string | number | undefined): string {
    if (value === undefined || value === null || value === '') {
      return '';
    }

    if (typeof value === 'number') {
      return new Date(value).toISOString().split('T')[0];
    }

    const asNumber = Number(value);
    if (!Number.isNaN(asNumber) && value.trim() !== '') {
      return new Date(asNumber).toISOString().split('T')[0];
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().split('T')[0];
  }

  private normalizeStatus(value: string): Task['status'] {
    switch (value) {
      case 'IN_PROGRESS':
        return 'IN_PROGRESS';
      case 'DONE':
        return 'DONE';
      default:
        return 'TODO';
    }
  }

  private normalizePriority(value: string): Task['priority'] {
    switch (value) {
      case 'LOW':
        return 'LOW';
      case 'HIGH':
        return 'HIGH';
      default:
        return 'MEDIUM';
    }
  }
}
