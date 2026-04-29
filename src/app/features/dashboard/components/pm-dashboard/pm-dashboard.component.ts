import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardResponse } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-pm-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './pm-dashboard.component.html',
  styleUrl: './pm-dashboard.component.css'
})
export class PmDashboardComponent {
  
  dashboardData = input.required<DashboardResponse>();

  totalProjects = computed(() => this.dashboardData().totalProjects);
  activeTasks = computed(() => this.dashboardData().inProgressTasks + this.dashboardData().todoTasks);
  completedTasks = computed(() => this.dashboardData().completedTasks);
  totalTasks = computed(() => this.dashboardData().totalTasks);
  overdueTasks = computed(() => this.dashboardData().overdueTasks);
  budgetUsedPercentage = computed(() => this.dashboardData().budgetUsedPercentage);
}
