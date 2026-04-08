import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DashboardResponse } from '../../../../core/services/dashboard.service';

@Component({
  selector: 'app-accountant-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './accountant-dashboard.component.html',
  styleUrl: './accountant-dashboard.component.css'
})
export class AccountantDashboardComponent {
  dashboardData = input.required<DashboardResponse>();

  totalProjects = computed(() => this.dashboardData().totalProjects);
  budgetUsedPercentage = computed(() => this.dashboardData().budgetUsedPercentage);
}
