import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, debounceTime, distinctUntilChanged, switchMap, combineLatest, startWith } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectService } from './services/project.service';
import { ProjectFormDialogComponent } from './project-form-dialog.component';
import { UserService } from '../../core/services/user.service';
import type { Project } from './models/project.model';
import type { User } from '../../core/models/user.model';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [MatIconModule, MatRippleModule, MatDialogModule],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private projectService = inject(ProjectService);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  // ── Search & filter signals ──────────────────────────────────────────────
  readonly searchKeyword = signal<string>('');
  readonly statusFilter = signal<string>('all');
  readonly managerFilter = signal<number>(0);   // 0 = all

  // ── UI state ─────────────────────────────────────────────────────────────
  readonly isLoading = signal<boolean>(false);
  readonly activeTab = signal<'active' | 'details' | 'resources'>('active');
  readonly selectedProject = signal<Project | null>(null);

  // ── Results ───────────────────────────────────────────────────────────────
  /** All results returned by the current search call */
  readonly searchResults = signal<Project[]>([]);

  /** Project managers loaded for the filter dropdown */
  readonly projectManagers = signal<User[]>([]);

  // ── Pagination ────────────────────────────────────────────────────────────
  readonly pageSize = 3;
  readonly currentPage = signal(1);

  readonly pagedProjects = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.searchResults().slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.searchResults().length / this.pageSize)
  );

  // ── Subjects for reactive search ──────────────────────────────────────────
  private keywordSubject$ = new Subject<string>();
  private statusSubject$ = new Subject<string>();
  private managerSubject$ = new Subject<number>();

  // Keep all projects as fallback reference (for full-data mapping)
  readonly projects = this.projectService.projects;

  ngOnInit(): void {
    // Load project managers list for the dropdown
    this.userService.getUsers().subscribe({
      next: (users) => {
        const managers = users.filter(u =>
          (u.role as string) === 'PROJECT_MANAGER'
        );
        this.projectManagers.set(managers);
      },
      error: (err) => console.error('Failed to load users for filter', err)
    });

    // Reactive pipeline: any filter change triggers a debounced backend call
    combineLatest([
      this.keywordSubject$.pipe(startWith(''), debounceTime(400), distinctUntilChanged()),
      this.statusSubject$.pipe(startWith('all'), distinctUntilChanged()),
      this.managerSubject$.pipe(startWith(0), distinctUntilChanged()),
    ])
      .pipe(
        switchMap(([keyword, status, managerId]) => {
          this.isLoading.set(true);
          return this.projectService.searchProjects({ keyword, status, projectManagerId: managerId > 0 ? managerId : undefined });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (results) => {
          this.searchResults.set(results);
          this.currentPage.set(1);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Search failed', err);
          this.isLoading.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Filter handlers ───────────────────────────────────────────────────────

  onSearchInput(value: string): void {
    this.searchKeyword.set(value);
    this.keywordSubject$.next(value);
  }

  onStatusFilter(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(value);
    this.statusSubject$.next(value);
    this.selectedProject.set(null);
  }

  onManagerFilter(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.managerFilter.set(value);
    this.managerSubject$.next(value);
    this.selectedProject.set(null);
  }

  clearSearch(): void {
    this.searchKeyword.set('');
    this.keywordSubject$.next('');
  }

  prevPage(): void {
    this.currentPage.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.currentPage.update((p) => Math.min(this.totalPages(), p + 1));
  }


  setTab(tab: 'active' | 'details' | 'resources'): void {
    this.activeTab.set(tab);
  }

  selectProject(project: Project): void {
    this.router.navigate(['/projects', project.id]);
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
      // Refresh search after add
      setTimeout(() => this.keywordSubject$.next(this.searchKeyword()), 500);
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
      this.projectService.updateProject(project.id, {
        ...result, manager: managerStr, managerInitials: initials, managerId: result.managerId
      });
      setTimeout(() => this.keywordSubject$.next(this.searchKeyword()), 500);
    });
  }

  deleteProject(project: Project, event: Event): void {
    event.stopPropagation();
    this.projectService.deleteProject(project.id);
    if (this.selectedProject()?.id === project.id) {
      this.selectedProject.set(null);
    }
    setTimeout(() => this.keywordSubject$.next(this.searchKeyword()), 500);
  }

  // ── Display helpers ───────────────────────────────────────────────────────

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
