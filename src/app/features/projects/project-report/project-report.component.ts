import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../services/project.service';
import { ProjectReport } from '../../../core/models/report.model';
import { Project } from '../models/project.model';

@Component({
  selector: 'app-project-report',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './project-report.component.html',
  styleUrl: './project-report.component.css'
})
export class ProjectReportComponent implements OnInit {
  private router = inject(Router);
  private projectService = inject(ProjectService);

  readonly projects = signal<Project[]>([]);
  readonly selectedProjectId = signal<number | null>(null);
  readonly report = signal<ProjectReport | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.isLoading.set(true);
    this.error.set(null);

    // Get projects from the service's computed signal
    const allProjects = this.projectService.projects();
    if (allProjects.length > 0) {
      this.projects.set(allProjects);
      this.isLoading.set(false);
    } else {
      // If projects haven't loaded yet, trigger a refresh and wait
      this.projectService.refreshProjects();
      
      // Wait a bit for the projects to load
      setTimeout(() => {
        this.projects.set(this.projectService.projects());
        this.isLoading.set(false);
      }, 1000);
    }
  }

  onProjectSelect(event: any): void {
    const selectedId = Number(event.value);
    
    if (!selectedId || isNaN(selectedId)) {
      this.error.set('Invalid project selection');
      return;
    }

    this.selectedProjectId.set(selectedId);
    this.loadReport(selectedId);
  }

  private loadReport(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.report.set(null);

    this.projectService.getProjectReport(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.report.set(response.data);
        } else {
          this.error.set('Failed to load project report');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading project report:', err);
        this.error.set(err.error?.message || 'Failed to load project report. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  retry(): void {
    const id = this.selectedProjectId();
    if (id) {
      this.loadReport(id);
    } else {
      this.loadProjects();
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getBudgetStatusClass(): string {
    const r = this.report();
    if (!r) return '';
    
    const percentageUsed = (r.totalExpenses / r.totalBudget) * 100;
    
    if (percentageUsed > 100) return 'budget-over';
    if (percentageUsed > 90) return 'budget-warning';
    return 'budget-on-track';
  }

  getProgressStatusClass(): string {
    const r = this.report();
    if (!r) return '';
    
    if (r.progressPercentage >= 90) return 'progress-high';
    if (r.progressPercentage >= 60) return 'progress-medium';
    return 'progress-low';
  }
}
