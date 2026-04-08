import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardResponse } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-engineer-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './engineer-dashboard.component.html',
  styleUrl: './engineer-dashboard.component.css'
})
export class EngineerDashboardComponent {
  
  dashboardData = input.required<DashboardResponse>();

  totalProjects = computed(() => this.dashboardData().totalProjects);
  activeTasks = computed(() => this.dashboardData().inProgressTasks + this.dashboardData().todoTasks);
  completedTasks = computed(() => this.dashboardData().completedTasks);
  totalTasks = computed(() => this.dashboardData().totalTasks);
  overdueTasks = computed(() => this.dashboardData().overdueTasks);
}
