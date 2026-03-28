import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ProjectService } from './services/project.service';
import { ProjectFormDialogComponent } from './project-form-dialog.component';
import type { Project } from './models/project.model';
import { ProjectProgressComponent } from './project-progress/project-progress';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [MatIconModule, MatRippleModule, MatDialogModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
})
export class ProjectsComponent {
  private projectService = inject(ProjectService);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  readonly projects = this.projectService.projects;
  readonly selectedProject = signal<Project | null>(null);
  readonly activeTab = signal<'active' | 'details' | 'resources'>('active');

  // Filters
  readonly statusFilter = signal<string>('all');
  readonly managerFilter = signal<string>('all');

  // Pagination
  readonly pageSize = 3;
  readonly currentPage = signal(1);

  readonly filteredProjects = computed(() => {
    let list = this.projects();
    const status = this.statusFilter();
    const manager = this.managerFilter();
    if (status !== 'all') list = list.filter((p) => p.status === status);
    if (manager !== 'all') list = list.filter((p) => p.manager === manager);
    return list;
  });

  readonly pagedProjects = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredProjects().slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.filteredProjects().length / this.pageSize)
  );

  readonly managers = computed(() => {
    const names = new Set(this.projects().map((p) => p.manager));
    return Array.from(names);
  });

  readonly showingRange = computed(() => {
    const total = this.filteredProjects().length;
    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, total);
    return `${start}-${end}`;
  });

  selectProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
  }

  setTab(tab: 'active' | 'details' | 'resources'): void {
    this.activeTab.set(tab);
  }

  onStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
    this.selectedProject.set(null);
  }

  onManagerFilter(event: Event): void {
    this.managerFilter.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
    this.selectedProject.set(null);
  }

  prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }

  openNewProjectDialog(): void {
    const ref = this.dialog.open(ProjectFormDialogComponent, {
      data: {},
      panelClass: 'project-dialog',
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const managerStr = String(result.managerId || 'PM');
      const initials = managerStr.slice(0, 2).toUpperCase();
      this.projectService.addProject({
        ...result,
        manager: managerStr,
        managerId: result.managerId,
        managerInitials: initials,
        budgetUsed: '$0',
        budgetStatus: 'On Track',
        progress: 0,
        estimatedCompletion: result.endDate,
        manHours: '0 hrs',
        riskLevel: 'LOW',
        totalSubcontractors: 0,
        milestones: [],
        coordinates: { lat: '30.2672° N', lng: '97.7431° W' },
      } as Omit<Project, 'id'>);
    });
  }

  openEditDialog(project: Project, event: Event): void {
    event.stopPropagation();
    const ref = this.dialog.open(ProjectFormDialogComponent, {
      data: { project },
      panelClass: 'project-dialog',
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const managerStr = String(result.managerId || 'PM');
      const initials = managerStr.slice(0, 2).toUpperCase();
      this.projectService.updateProject(project.id, { ...result, manager: managerStr, managerInitials: initials, managerId: result.managerId });
      if (this.selectedProject()?.id === project.id) {
        const updated = this.projects().find((p) => p.id === project.id);
        if (updated) this.selectedProject.set(updated);
      }
    });
  }

  deleteProject(project: Project, event: Event): void {
    event.stopPropagation();
    this.projectService.deleteProject(project.id);
    if (this.selectedProject()?.id === project.id) {
      this.selectedProject.set(null);
    }
  }

  formatStatus(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'In Progress';
      case 'ON_HOLD': return 'On Hold';
      case 'COMPLETED': return 'Completed';
      case 'PLANNING': return 'Planning';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'status-progress';
      case 'ON_HOLD': return 'status-hold';
      case 'COMPLETED': return 'status-completed';
      case 'PLANNING': return 'status-planning';
      case 'CANCELLED': return 'status-cancelled';
      default: return '';
    }
  }

  getBudgetClass(status: string): string {
    switch (status) {
      case 'On Track': return 'budget-on-track';
      case 'Over Budget': return 'budget-over';
      case 'Under Budget': return 'budget-under';
      default: return '';
    }
  }

  getProgressColor(progress: number): string {
    if (progress >= 90) return '#16a34a';
    if (progress >= 60) return '#ea580c';
    return '#3b82f6';
  }
}
