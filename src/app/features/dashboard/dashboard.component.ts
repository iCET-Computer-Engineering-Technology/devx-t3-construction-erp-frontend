import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardService, DashboardResponse } from '../../core/services/dashboard.service';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { PmDashboardComponent } from './components/pm-dashboard/pm-dashboard.component';
import { AccountantDashboardComponent } from './components/accountant-dashboard/accountant-dashboard.component';
import { EngineerDashboardComponent } from './components/engineer-dashboard/engineer-dashboard.component';
import { WorkerDashboardComponent } from './components/worker-dashboard/worker-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    AdminDashboardComponent, 
    PmDashboardComponent, 
    AccountantDashboardComponent, 
    EngineerDashboardComponent, 
    WorkerDashboardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  dashboardService = inject(DashboardService);
  dashboardData = signal<DashboardResponse | null>(null);

  ngOnInit() {
    this.dashboardService.getDashboardData().subscribe({
      next: (res) => {
        if (res.code === 200 && res.data) {
          this.dashboardData.set(res.data);
        }
      },
      error: (err) => console.error('Failed to load dashboard data', err)
    });
  }
}
