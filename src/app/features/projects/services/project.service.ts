import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Project } from '../models/project.model';
import { UserService } from '../../../core/services/user.service';
import { TaskService } from '../../task/service/task.service';
import { map, Observable } from 'rxjs';

export interface ProjectSearchParams {
  keyword?: string;
  status?: string;
  projectManagerId?: number;
}

export interface ProjectSearchResult {
  projectId: number;
  projectName: string;
  location: string;
  status: string;
  projectManagerId: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private taskService = inject(TaskService);
  private apiUrl = '/projects';
  private searchApiUrl = `${this.apiUrl}/search`;

  private readonly projectsSignal = signal<Project[]>([]);
  private usersMap = new Map<number, string>();

  readonly projects = computed(() => {
    const tasks = this.taskService.tasks();
    return this.projectsSignal().map(p => {
      const projectTasks = tasks.filter(t => String(t.projectId) === String(p.id));
      const doneTasks = projectTasks.filter(t => t.status === 'DONE').length;
      const progress = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;
      return { ...p, progress };
    });
  });

  readonly totalCount = computed(() => this.projectsSignal().length);

  constructor() {
    this.loadUsersAndProjects();
  }

  private loadUsersAndProjects(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        users.forEach(u => this.usersMap.set(Number(u.userId), u.name));
        this.refreshProjects();
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.refreshProjects();
      }
    });
  }

  refreshProjects(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        const mapped = (data || []).map(p => this.mapRawProject(p));
        this.projectsSignal.set(mapped);
      },
      error: (err) => console.error('Failed to load projects', err)
    });
  } 

  searchProjects(params: ProjectSearchParams): Observable<Project[]> {
    return new Observable<Project[]>(observer => {
      let filtered = [...this.projectsSignal()];
      
      if (params.keyword && params.keyword.trim()) {
        const kw = params.keyword.trim().toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(kw) || 
          p.location.toLowerCase().includes(kw)
        );
      }
      
      if (params.status && params.status !== 'all') {
        filtered = filtered.filter(p => p.status === params.status);
      }
      
      if (params.projectManagerId != null && params.projectManagerId > 0) {
        filtered = filtered.filter(p => Number(p.managerId) === Number(params.projectManagerId));
      }

      // Add the progress calculation that the computed `projects` signal does
      const tasks = this.taskService.tasks();
      const result = filtered.map(p => {
        const projectTasks = tasks.filter(t => String(t.projectId) === String(p.id));
        const doneTasks = projectTasks.filter(t => t.status === 'DONE').length;
        const progress = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;
        return { ...p, progress };
      });
      
      observer.next(result);
      observer.complete();
    });
  }
 
  private mapRawProject(p: any): Project {
    const sd = p.start_date ? new Date(p.start_date).toISOString().split('T')[0] : '';
    const ed = p.estimated_end_date ? new Date(p.estimated_end_date).toISOString().split('T')[0] : '';
    const managerName = this.usersMap.get(Number(p.project_manager_id)) || `Manager ${p.project_manager_id}`;
    const managerInitials = managerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

    return {
      id: p.project_Id,
      name: p.project_name,
      type: 'Construction',
      location: p.location,
      status: p.status,
      manager: managerName,
      managerId: p.project_manager_id,
      managerInitials,
      startDate: sd,
      endDate: ed,
      budgetUsed: '$0',
      budgetTotal: `$${p.total_budget || 0}`,
      budgetStatus: 'On Track',
      progress: 0,
      estimatedCompletion: ed,
      manHours: '0 hrs',
      riskLevel: 'LOW',
      totalSubcontractors: 0,
      milestones: [],
      coordinates: { lat: '0', lng: '0' },
      address: p.location,
    } as Project;
  }
 
  private mapSearchResult(sr: ProjectSearchResult): Project {
    const managerName = this.usersMap.get(Number(sr.projectManagerId)) || `Manager ${sr.projectManagerId}`;
    const managerInitials = managerName.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
 
    const existing = this.projectsSignal().find(p => p.id === sr.projectId);
    if (existing) {
      return { ...existing, name: sr.projectName, location: sr.location, status: sr.status as any, manager: managerName, managerInitials, managerId: sr.projectManagerId };
    }

    return {
      id: sr.projectId,
      name: sr.projectName,
      type: 'Construction',
      location: sr.location,
      status: sr.status as any,
      manager: managerName,
      managerId: sr.projectManagerId,
      managerInitials,
      startDate: '',
      endDate: '',
      budgetUsed: '$0',
      budgetTotal: '$0',
      budgetStatus: 'On Track',
      progress: 0,
      estimatedCompletion: '',
      manHours: '0 hrs',
      riskLevel: 'LOW',
      totalSubcontractors: 0,
      milestones: [],
      coordinates: { lat: '0', lng: '0' },
      address: sr.location,
    } as Project;
  }

  addProject(data: Omit<Project, 'id'>): void {
    const payload = {
      project_name: data.name,
      location: data.location,
      start_date: data.startDate ? new Date(data.startDate).toISOString() : null,
      estimated_end_date: data.endDate ? new Date(data.endDate).toISOString() : null,
      status: data.status,
      project_manager_id: Number(data.managerId) || 1,
      total_budget: parseFloat((data.budgetTotal || '0').replace(/[^0-9.-]+/g, ''))
    };
    // Backend @PostMapping is mapped to /addProject
    this.http.post<boolean>(`${this.apiUrl}/addProject`, payload).subscribe({
      next: (success) => { if (success) this.refreshProjects(); },
      error: (err) => console.error('Failed to add project', err)
    });
  }

  updateProject(id: number, data: Partial<Project>): void {
    const payload: any = {};
    if (data.name) payload.project_name = data.name;
    if (data.location) payload.location = data.location;
    if (data.startDate) payload.start_date = new Date(data.startDate).toISOString();
    if (data.endDate) payload.estimated_end_date = new Date(data.endDate).toISOString();
    if (data.status) payload.status = data.status;
    if (data.managerId) payload.project_manager_id = Number(data.managerId);
    if (data.budgetTotal) payload.total_budget = parseFloat(data.budgetTotal.replace(/[^0-9.-]+/g, ''));

    this.http.patch<boolean>(`${this.apiUrl}/${id}`, payload).subscribe({
      next: (success) => { if (success) this.refreshProjects(); },
      error: (err) => console.error('Failed to update project', err)
    });
  }

  deleteProject(id: number): void {
    this.http.delete<boolean>(`${this.apiUrl}/${id}`).subscribe({
      next: (success) => { if (success) this.refreshProjects(); },
      error: (err) => console.error('Failed to delete project', err)
    });
  }

  getProjectMembers(projectId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/${projectId}/members`).pipe(
      map(res => res.data || [])
    );
  }

  addMember(projectId: number, userId: number, projectRoleLabel: string, currentUserId: number) {
    return this.http.post(
      `${this.apiUrl}/${projectId}/member`,
      { userId, projectRoleLabel },
      { headers: { 'User-Id': currentUserId.toString() } }
    );
  }

  removeMember(projectId: number, userId: number, currentUserId: number) {
    return this.http.delete(
      `${this.apiUrl}/${projectId}/members/${userId}`,
      { headers: { 'User-Id': currentUserId.toString() } }
    );
  }

  updateMemberRole(projectId: number, userId: number, newRoleLabel: string, currentUserId: number) {
    return this.http.patch(
      `${this.apiUrl}/${projectId}/members/${userId}/role`,
      { projectRoleLable: newRoleLabel },
      { headers: { 'User-Id': currentUserId.toString() } }
    );
  }
}
