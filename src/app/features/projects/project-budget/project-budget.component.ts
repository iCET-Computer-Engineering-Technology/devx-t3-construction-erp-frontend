import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { ProjectService } from '../services/project.service'; // Import the service!

@Component({
  selector: 'app-project-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatRippleModule],
  templateUrl: './project-budget.component.html'
})
export class ProjectBudgetComponent implements OnInit {
  @Input({ required: true }) projectId!: number;

  // Use the ProjectService instead of HttpClient
  private projectService = inject(ProjectService);

  budget = signal<number | null>(null);
  isEditing = signal(false);
  editValue = signal<number>(0);
  isLoading = signal(true);
  errorMessage = signal('');

  ngOnInit() {
    this.fetchBudget();
  }

  fetchBudget() {
    this.isLoading.set(true);
    // Call the service method
    this.projectService.getProjectBudget(this.projectId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.budget.set(res.data.totalBudget);
          this.editValue.set(res.data.totalBudget);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        if (err.status !== 404) {
          this.errorMessage.set('Failed to load budget.');
        }
        this.isLoading.set(false);
      }
    });
  }

  startEdit() {
    this.editValue.set(this.budget() || 0);
    this.isEditing.set(true);
    this.errorMessage.set('');
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.errorMessage.set('');
  }

  saveBudget() {
    const currentVal = this.editValue();

    if (currentVal === null || currentVal === undefined || currentVal <= 0) {
      this.errorMessage.set('Budget must be greater than 0.');
      return;
    }

    const decimalCheck = currentVal.toString().split('.');
    if (decimalCheck[1] && decimalCheck[1].length > 2) {
      this.errorMessage.set('Budget cannot have more than 2 decimal places.');
      return;
    }

    this.isLoading.set(true);
    const hasExistingBudget = this.budget() !== null;
    const method = hasExistingBudget ? 'patch' : 'post';

    // Call the service method
    this.projectService.saveProjectBudget(this.projectId, currentVal, method).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.budget.set(res.data.totalBudget);
          this.isEditing.set(false);
          this.errorMessage.set('');
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        if (err.status === 403) {
          this.errorMessage.set('Warning: Only Project Managers and Admins can modify the budget.');
        } else if (err.status === 401) {
          this.errorMessage.set('Warning: You must be logged in to save the budget.');
        } else {
          this.errorMessage.set(err.error?.message || 'Error saving budget.');
        }
        this.isLoading.set(false);
      }
    });
  }
}
