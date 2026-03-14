import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Project } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/projects';

  private readonly projectsSignal = signal<Project[]>([]);

  readonly projects = this.projectsSignal.asReadonly();
  readonly totalCount = computed(() => this.projectsSignal().length);

  constructor() {
    this.refreshProjects();
  }

  refreshProjects(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        const mapped = (data || []).map(p => {
          const sd = p.start_date ? new Date(p.start_date).toISOString().split('T')[0] : '';
          const ed = p.estimated_end_date ? new Date(p.estimated_end_date).toISOString().split('T')[0] : '';
          return {
            id: p.project_Id,
            name: p.project_name,
            type: 'Construction',
            location: p.location,
            status: p.status,
            manager: `Manager ${p.project_manager_id}`,
            managerId: p.project_manager_id,
            managerInitials: `M${p.project_manager_id}`,
            startDate: sd,
            endDate: ed,
            budgetUsed: '$0',
            budgetTotal: `$${p.total_budget || 0}`,
            budgetStatus: 'On Track' as const,
            progress: 0,
            estimatedCompletion: ed,
            manHours: '0 hrs',
            riskLevel: 'LOW' as const,
            totalSubcontractors: 0,
            milestones: [],
            coordinates: { lat: '0', lng: '0' },
            address: p.location
          } as Project;
        });
        this.projectsSignal.set(mapped);
      },
      error: (err) => console.error('Failed to load projects', err)
    });
  }

  addProject(data: Omit<Project, 'id'>): void {
    const payload = {
      project_name: data.name,
      location: data.location,
      start_date: new Date(data.startDate).getTime(),
      estimated_end_date: new Date(data.endDate).getTime(),
      status: data.status,
      project_manager_id: Number(data.managerId) || 1,
      total_budget: parseFloat((data.budgetTotal || '0').replace(/[^0-9.-]+/g,""))
    };
    this.http.post<boolean>(this.apiUrl, payload).subscribe({
      next: (success) => {
        if (success) {
          this.refreshProjects();
        }
      },
      error: (err) => console.error('Failed to add project', err)
    });
  }

  updateProject(id: number, data: Partial<Project>): void {
    const payload: any = {};
    if (data.name) payload.project_name = data.name;
    if (data.location) payload.location = data.location;
    if (data.startDate) payload.start_date = new Date(data.startDate).getTime();
    if (data.endDate) payload.estimated_end_date = new Date(data.endDate).getTime();
    if (data.status) payload.status = data.status;
    if (data.managerId) payload.project_manager_id = Number(data.managerId);
    if (data.budgetTotal) payload.total_budget = parseFloat(data.budgetTotal.replace(/[^0-9.-]+/g,""));

    this.http.patch<boolean>(`${this.apiUrl}/${id}`, payload).subscribe({
      next: (success) => {
        if (success) {
          this.refreshProjects();
        }
      },
      error: (err) => console.error('Failed to update project', err)
    });
  }

  deleteProject(id: number): void {
    this.http.delete<boolean>(`${this.apiUrl}/${id}`).subscribe({
      next: (success) => {
        if (success) {
          this.refreshProjects();
        }
      },
      error: (err) => console.error('Failed to delete project', err)
    });
  }
}
