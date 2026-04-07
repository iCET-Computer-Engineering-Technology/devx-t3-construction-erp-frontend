import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProjectService } from '../services/project.service';
import { ProjectReport } from '../../../core/models/report.model';

@Component({
  selector: 'app-project-report',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './project-report.component.html',
  styleUrl: './project-report.component.css'
})
export class ProjectReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);

  readonly report = signal<ProjectReport | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    
    if (!idParam) {
      this.error.set('No project ID provided');
      this.isLoading.set(false);
      return;
    }

    const id = Number(idParam);
    
    if (isNaN(id)) {
      this.error.set('Invalid project ID');
      this.isLoading.set(false);
      return;
    }

    this.loadReport(id);
  }

  private loadReport(id: number): void {
    this.isLoading.set(true);
    this.error.set(null);

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

  goBack(): void {
    this.router.navigate(['/projects']);
  }

  retry(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadReport(Number(idParam));
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
