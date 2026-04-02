import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';

import { ProjectService } from '../projects/services/project.service';
import { TaskService } from '../task/service/task.service';
import { ProcurementService } from '../procurement/service/procurement.service';
import { ClientViewService } from '../../core/services/client-view.service';

interface Activity {
  user: string;
  action: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatIconModule, MatRippleModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  projectService = inject(ProjectService);
  taskService = inject(TaskService);
  procurementService = inject(ProcurementService);

  readonly activeChartTab: 'monthly' | 'quarterly' = 'monthly';

  procurementStats = signal({ reqs: 0, pos: 0 });

  ngOnInit() {
    this.procurementService.getRequisitions().subscribe({
      next: (res) => this.procurementStats.update(s => ({ ...s, reqs: res?.length || 0 })),
      error: () => Object
    });
    this.procurementService.getPurchaseOrders().subscribe({
      next: (res) => this.procurementStats.update(s => ({ ...s, pos: res?.length || 0 })),
      error: () => Object
    });
  }

  // Live KPI Computations based on business logic
  totalProjects = computed(() => this.projectService.totalCount());
  activeProjects = computed(() => this.projectService.projects().filter(p => p.status === 'ACTIVE').length);

  totalTasks = computed(() => this.taskService.count());
  activeTasks = computed(() => this.taskService.tasks().filter(t => t.status === 'IN_PROGRESS' || t.status === 'TODO').length);

  overdueTasks = computed(() => {
    const today = new Date().getTime();
    return this.taskService.tasks().filter(t => {
      if(t.status === 'DONE') return false;
      const end = new Date(t.endDate).getTime();
      return end < today;
    }).length;
  });

  siteProgress = computed(() => {
    // Take the top 3 projects for the live widget
    const colors = ['#ea580c', '#3b82f6', '#16a34a'];
    return this.projectService.projects().slice(0, 3).map((p, i) => {

      // Compute actual progress based on tasks for this project
      const projectTasks = this.taskService.tasks().filter(t => String(t.projectId) === String(p.id));
      const doneTasks = projectTasks.filter(t => t.status === 'DONE').length;
      const actualProgress = projectTasks.length > 0 ? Math.round((doneTasks / projectTasks.length) * 100) : 0;

      return {
        name: p.name,
        progress: actualProgress,
        color: colors[i % 3]
      };
    });
  });

  recentActivity = computed(() => {
    const arr: Activity[] = [];
    const latestProjects = [...this.projectService.projects()].reverse().slice(0, 1);
    const latestTasks = [...this.taskService.tasks()].reverse().slice(0, 2);

    latestProjects.forEach(p => {
       arr.push({ user: p.manager || 'Project Manager', action: `created a new construction project: ${p.name}`, time: 'Recently', type: 'info' });
    });
    latestTasks.forEach(t => {
       arr.push({ user: t.assigneeUserName || 'The Planner', action: `assigned a new task: ${t.title}`, time: 'Recently', type: 'success' });
    });

    if (this.procurementStats().reqs > 0) {
       arr.push({ user: 'System', action: `${this.procurementStats().reqs} Material Requisitions are currently pending in Procurement.`, time: 'Now', type: 'warning' });
    }

    // Sort array so warning/now is on top, then success, then info
    return arr.reverse();
  });

  // Mocked Chart Data since there is no Budget/Timeline API yet
  readonly budgetMonths = ['JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN', 'FEB', 'MAR'];
  readonly budgetPlanned = [65, 70, 80, 75, 60, 55, 70, 85, 40];
  readonly budgetActual = [60, 68, 72, 78, 55, 50, 65, 80, 0];

  taskDays = computed(() => ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']);

  taskValues = computed(() => {
    const values = [0, 0, 0, 0, 0, 0, 0];
    const tasks = this.taskService.tasks();

    if (tasks.length === 0) {
      return [30, 45, 60, 40, 50, 20, 10]; // fallback for demo
    }

    tasks.forEach(t => {
      if (t.endDate) {
        const d = new Date(t.endDate);
        let dayOfWeek = d.getDay() - 1;
        if (dayOfWeek === -1) dayOfWeek = 6;
        values[dayOfWeek] += 25; // 25% height per task deadline
      }
    });

    return values.map(v => Math.min(v, 100)); // cap at 100% height
  });

  deadlines = computed(() => {
    const tasks = this.taskService.tasks()
      .filter(t => t.endDate && t.status !== 'DONE')
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
      .slice(0, 4); // Top 4 deadlines

    if (tasks.length === 0) {
      return [
        { month: 'OCT', day: 24, title: 'Foundation Inspection', location: 'Demo Site', urgent: true }
      ];
    }

    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

    return tasks.map(t => {
      const d = new Date(t.endDate);
      const isUrgent = d.getTime() - new Date().getTime() < (3 * 24 * 60 * 60 * 1000); // within 3 days
      return {
        month: monthNames[d.getMonth()],
        day: d.getDate(),
        title: t.title,
        location: t.projectName || 'Site',
        urgent: isUrgent
      };
    });
  });

  getBarHeight(value: number): number {
    return Math.round((value / 100) * 140);
  }

  projectDetails: any;
  constructor(private clientService: ClientViewService) {}


}
