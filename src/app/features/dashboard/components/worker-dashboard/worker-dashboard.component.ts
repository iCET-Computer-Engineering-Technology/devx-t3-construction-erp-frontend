import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardResponse } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-worker-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './worker-dashboard.component.html',
  styleUrl: './worker-dashboard.component.css'
})
export class WorkerDashboardComponent {
  dashboardData = input.required<DashboardResponse>();

  activeTasks = computed(() => this.dashboardData().inProgressTasks + this.dashboardData().todoTasks);
  completedTasks = computed(() => this.dashboardData().completedTasks);
  overdueTasks = computed(() => this.dashboardData().overdueTasks);
}
