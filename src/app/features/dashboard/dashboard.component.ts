import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

interface KpiCard {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  trend?: { value: string; direction: 'up' | 'down' | 'stable' };
  badge?: { text: string; color: 'orange' | 'green' | 'red' };
}

interface Deadline {
  month: string;
  day: number;
  title: string;
  location: string;
  urgent: boolean;
}

interface SiteProgress {
  name: string;
  progress: number;
  color: string;
}

interface Activity {
  user: string;
  action: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, MatRippleModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  readonly activeChartTab: 'monthly' | 'quarterly' = 'monthly';

  readonly kpiCards: KpiCard[] = [
    {
      title: 'TOTAL PROJECTS',
      value: '24',
      subtitle: '18 Active, 6 Pending',
      icon: 'architecture',
      trend: { value: '+2.4%', direction: 'up' },
    },
    {
      title: 'ACTIVE TASKS',
      value: '142',
      subtitle: '32 critical overdue',
      icon: 'assignment_late',
      trend: { value: 'Stable', direction: 'stable' },
    },
    {
      title: 'WORKFORCE AVAIL.',
      value: '88%',
      subtitle: '',
      icon: 'groups',
      trend: { value: '+5.1%', direction: 'up' },
    },
    {
      title: 'BUDGET USAGE',
      value: '$1.2M',
      subtitle: '76% of Q3 Allocation',
      icon: 'account_balance_wallet',
      trend: { value: '-0.8%', direction: 'down' },
    },
    {
      title: 'MATERIAL INVENTORY',
      value: '94%',
      subtitle: 'Reorder triggered for Steel',
      icon: 'inventory_2',
      badge: { text: '12 ALERTS', color: 'orange' },
    },
  ];

  readonly budgetMonths = ['JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];
  readonly budgetPlanned = [65, 70, 80, 75, 60, 55, 70, 85, 40];
  readonly budgetActual = [60, 68, 72, 78, 55, 50, 65, 80, 0];

  readonly deadlines: Deadline[] = [
    { month: 'OCT', day: 24, title: 'Foundation Inspection', location: 'Harbor View Site A', urgent: true },
    { month: 'OCT', day: 26, title: 'Steel Delivery #12', location: 'Skyline Tower', urgent: true },
    { month: 'OCT', day: 29, title: 'Q3 Audit Submission', location: 'Financial Office', urgent: false },
  ];

  readonly taskDays = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  readonly taskValues = [55, 70, 85, 45, 65];

  readonly siteProgress: SiteProgress[] = [
    { name: 'Harbor View Residential', progress: 72, color: '#ea580c' },
    { name: 'Bridge #42 Repair', progress: 45, color: '#3b82f6' },
    { name: 'Skyline Office Tower', progress: 91, color: '#16a34a' },
  ];

  readonly recentActivity: Activity[] = [
    {
      user: 'Mark Thompson',
      action: 'approved concrete pour for Sector B',
      time: '2 hours ago',
      type: 'success',
    },
    {
      user: 'Sarah Chen',
      action: 'uploaded 4 new architectural blueprints',
      time: '5 hours ago',
      type: 'info',
    },
    {
      user: 'System',
      action: 'flagged low inventory for Structural Steel Grade A',
      time: 'Yesterday',
      type: 'warning',
    },
  ];

  getBarHeight(value: number): number {
    return Math.round((value / 100) * 140);
  }
}
