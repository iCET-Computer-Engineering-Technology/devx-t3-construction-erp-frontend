import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Project } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/projets';

  private readonly projectsSignal = signal<Project[]>([]);

  readonly projects = this.projectsSignal.asReadonly();
  readonly totalCount = computed(() => this.projectsSignal().length);

  constructor() {
    this.refreshProjects();
  }

  refreshProjects(): void {
    this.http.get<Project[]>(this.apiUrl + '/getAllproject').subscribe({
      next: (data) => this.projectsSignal.set(data || []),
      error: (err) => console.error('Failed to load projects', err)
    });
  }

  addProject(data: Omit<Project, 'id'>): void {
    this.http.post<boolean>(this.apiUrl + '/addproject', data).subscribe({
      next: (success) => {
        if (success) {
          this.refreshProjects();
        }
      },
      error: (err) => console.error('Failed to add project', err)
    });
  }

  updateProject(id: number, data: Partial<Project>): void {
    this.http.patch<boolean>(this.apiUrl + '/updateproject', data, { params: { id: id.toString() } }).subscribe({
      next: (success) => {
        if (success) {
          this.refreshProjects();
        }
      },
      error: (err) => console.error('Failed to update project', err)
    });
  }

  deleteProject(id: number): void {
    this.http.delete<boolean>(this.apiUrl + '/deleteprojet', { body: id }).subscribe({
      next: (success) => {
        if (success) {
          this.refreshProjects();
        }
      },
      error: (err) => console.error('Failed to delete project', err)
    });
  }
}
