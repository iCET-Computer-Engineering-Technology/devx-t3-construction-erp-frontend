import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Task {
  taskId: number;
  projectId: number;
  phaseId: number | null;
  assignedUserId: number | null;
  workerName?: string;
  title: string;
  description: string | null;
  startDate: string | null;
  dueDate: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

interface Milestone {
  id: number;
  name: string;
  plannedDate: string;
  forecastDate: string;
  status: 'Completed' | 'Delayed' | 'On Track';
}

@Component({
  selector: 'app-project-progress',
  templateUrl: './project-progress.html',
  styleUrls: ['./project-progress.css'],
  standalone: true,
  imports: [CommonModule]
})
export class ProjectProgressComponent implements OnInit {

  // --- DASHBOARD VARIABLES ---
  projectName: string = 'Skyview Tower Phase II';
  progressPercentage: number = 0;
  scheduleStatus: string = 'Delayed';
  daysBehind: number = 4;
  upcomingMilestonesCount: number = 12;
  criticalPathTasksCount: number = 5;

  totalTasks: number = 0;
  completedTasks: number = 0;
  pendingTasks: number = 0;

  // --- CHART VARIABLES (NEW) ---
  projectStartDate = new Date('2026-01-01');
  projectEndDate = new Date('2026-05-31');
  currentDate = new Date('2026-05-31'); // Dummy "today" date

  chartWidthPercentage: number = 0;
  chartHeightPercentage: number = 0;
  chartMonths: string[] = [];

  // --- GALLERY VARIABLES ---
  galleryImages: string[] = [
    'https://img.freepik.com/premium-photo/construction-site-with-workers-cranes-progress-image_1160544-754.jpg',
    'https://png.pngtree.com/thumb_back/fw800/background/20251021/pngtree-concrete-pouring-on-steel-rebar-at-construction-site-image_19942281.webp',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1000&auto=format&fit=crop'
  ];
  currentImageIndex: number = 0;

  // --- DUMMY DATA ---
  tasks: Task[] = [
    { taskId: 1, projectId: 1, phaseId: 1, assignedUserId: 2, workerName: 'Alex Johnson', title: 'Foundation Works', description: 'Pouring concrete', startDate: '2026-03-01', dueDate: '2026-03-10', status: 'DONE' },
    { taskId: 2, projectId: 1, phaseId: 1, assignedUserId: 2, workerName: 'Alex Johnson', title: 'Site Clearing', description: null, startDate: '2026-03-11', dueDate: '2026-03-15', status: 'DONE' },
    { taskId: 3, projectId: 1, phaseId: 2, assignedUserId: 3, workerName: 'Maria Garcia', title: 'Sub-surface Excavation', description: null, startDate: '2026-03-16', dueDate: '2026-03-20', status: 'DONE' },
    { taskId: 4, projectId: 1, phaseId: 3, assignedUserId: 4, workerName: 'David Smith', title: 'Superstructure (L1-L24)', description: null, startDate: '2026-03-21', dueDate: '2026-05-01', status: 'IN_PROGRESS' },
    { taskId: 5, projectId: 1, phaseId: 4, assignedUserId: 5, workerName: 'Sarah Lee', title: 'MEP Installations', description: null, startDate: '2026-05-02', dueDate: '2026-06-01', status: 'TODO' },
    { taskId: 6, projectId: 1, phaseId: 5, assignedUserId: 6, workerName: 'James Wilson', title: 'Interior Finishing', description: null, startDate: '2026-06-02', dueDate: '2026-07-01', status: 'TODO' },
  ];

  milestones: Milestone[] = [
    { id: 1, name: 'Foundation Approval', plannedDate: '2026-03-15', forecastDate: '2026-03-15', status: 'Completed' },
    { id: 2, name: 'Level 10 Reached', plannedDate: '2026-04-10', forecastDate: '2026-04-14', status: 'Delayed' },
    { id: 3, name: 'HVAC Rough-in', plannedDate: '2026-05-15', forecastDate: '2026-05-15', status: 'On Track' },
    { id: 4, name: 'Facade Completion', plannedDate: '2026-07-01', forecastDate: '2026-07-05', status: 'On Track' }
  ];

  // --- LOGIC ---
  ngOnInit(): void {
    this.calculateProgress();
    this.calculateChartData(); // Call the new chart logic
  }

  calculateProgress(): void {
    this.totalTasks = this.tasks.length;
    this.completedTasks = this.tasks.filter(task => task.status === 'DONE').length;
    this.pendingTasks = this.totalTasks - this.completedTasks;

    if (this.totalTasks > 0) {
      this.progressPercentage = Math.round((this.completedTasks / this.totalTasks) * 100);
    } else {
      this.progressPercentage = 0;
    }
  }

  calculateChartData(): void {
    // 1. Generate Month Labels dynamically based on Start and End dates
    const allMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const startMonth = this.projectStartDate.getMonth();
    const endMonth = this.projectEndDate.getMonth();

    this.chartMonths = [];
    for (let i = startMonth; i <= endMonth; i++) {
      this.chartMonths.push(allMonths[i]);
    }

    // 2. Calculate Width % (How much TIME has passed)
    const totalTime = this.projectEndDate.getTime() - this.projectStartDate.getTime();
    const elapsedTime = this.currentDate.getTime() - this.projectStartDate.getTime();

    let timePercentage = (elapsedTime / totalTime) * 100;
    this.chartWidthPercentage = Math.min(Math.max(timePercentage, 0), 100); // Cap between 0-100%

    // 3. Calculate Height % (How much WORK is done)
    this.chartHeightPercentage = this.progressPercentage; // Binds height to actual task progress
  }

  nextImage(): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.galleryImages.length;
  }

  scrollToSchedule(): void {
    const element = document.getElementById('task-schedule-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
