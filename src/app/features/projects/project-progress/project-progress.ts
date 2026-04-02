import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { ProjectService } from '../../projects/services/project.service';
import { TaskService } from '../../task/service/task.service';

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

interface ProjectMember {
  userId: number;
  name: string;
  role: string;
  projectRoleLabel: string;
}

@Component({
  selector: 'app-project-progress',
  templateUrl: './project-progress.html',
  styleUrls: ['./project-progress.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule]
})
export class ProjectProgressComponent implements OnInit, OnChanges {

  @Input() projectId: number = 1;

  // --- DASHBOARD VARIABLES (computed from real data) ---
  projectName: string = '';
  progressPercentage: number = 0;
  scheduleStatus: string = 'On Track';
  daysBehind: number = 0;
  upcomingMilestonesCount: number = 0;
  criticalPathTasksCount: number = 0;
  totalTasks: number = 0;
  completedTasks: number = 0;
  pendingTasks: number = 0;

  // --- CHART VARIABLES ---
  projectStartDate = new Date();
  projectEndDate = new Date();
  currentDate = new Date();
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

  // --- MEMBER VARIABLES ---
  projectMembers: ProjectMember[] = [];
  allUsers: User[] = [];
  showAddMemberModal: boolean = false;
  showEditMemberModal: boolean = false;
  selectedUserId: string = '';
  selectedRoleLabel: string = '';
  editingMember: ProjectMember | null = null;
  editRoleLabel: string = '';
  currentUserId: number = 1;

  // --- REAL DATA ---
  tasks: Task[] = [];
  milestones: Milestone[] = [];

  constructor(
    private projectService: ProjectService,
    private userService: UserService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadProjectData();
    this.loadMembers();
    this.loadAllUsers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && !changes['projectId'].firstChange) {
      this.loadProjectData();
      this.loadMembers();
    }
  }

  private loadProjectData(): void {
    // Get project name from projects signal
    const projects = this.projectService.projects();
    const project = projects.find(p => p.id === this.projectId);
    this.projectName = project?.name || 'Project #' + this.projectId;

    // Derive dates from project if available
    if (project) {
      const rawStart = (project as any).startDate;
      const rawEnd = (project as any).endDate || (project as any).estimatedCompletion;
      if (rawStart) this.projectStartDate = new Date(rawStart);
      if (rawEnd) this.projectEndDate = new Date(rawEnd);
    }

    // Load tasks from the TaskService signal, filtered by projectId
    const allTasks = this.taskService.tasks();
    this.tasks = allTasks
      .filter(t => String(t.projectId) === String(this.projectId))
      .map(t => ({
        taskId: t.taskId,
        projectId: t.projectId,
        phaseId: null,
        assignedUserId: t.assigneeUserId || null,
        workerName: t.assigneeUserName || 'Unassigned',
        title: t.title,
        description: t.description || null,
        startDate: t.startDate || null,
        dueDate: t.endDate || null,
        status: t.status as 'TODO' | 'IN_PROGRESS' | 'DONE',
      }));

    this.calculateProgress();
    this.calculateChartData();
    this.deriveMilestones();
  }

  private deriveMilestones(): void {
    // Derive milestones from completed tasks as real data points
    this.milestones = [];
    const doneTasks = this.tasks.filter(t => t.status === 'DONE');
    const inProgressTasks = this.tasks.filter(t => t.status === 'IN_PROGRESS');
    const todoTasks = this.tasks.filter(t => t.status === 'TODO');

    doneTasks.forEach((t, i) => {
      this.milestones.push({
        id: i + 1,
        name: t.title + ' — Complete',
        plannedDate: t.dueDate || '—',
        forecastDate: t.dueDate || '—',
        status: 'Completed',
      });
    });
    inProgressTasks.forEach((t, i) => {
      this.milestones.push({
        id: doneTasks.length + i + 1,
        name: t.title,
        plannedDate: t.dueDate || '—',
        forecastDate: t.dueDate || '—',
        status: 'On Track',
      });
    });

    this.upcomingMilestonesCount = inProgressTasks.length + todoTasks.length;
    this.criticalPathTasksCount = inProgressTasks.length;
  }

  // =====================
  // MEMBER METHODS
  // =====================

  loadMembers(): void {
    this.projectService.getProjectMembers(this.projectId).subscribe({
      next: (members) => this.projectMembers = members,
      error: (err) => console.error('Failed to load members', err)
    });
  }

  loadAllUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => this.allUsers = users,
      error: (err) => console.error('Failed to load users', err)
    });
  }

  // --- ADD ---
  openAddMemberModal(): void {
    this.selectedUserId = '';
    this.selectedRoleLabel = '';
    this.showAddMemberModal = true;
  }

  closeAddMemberModal(): void {
    this.showAddMemberModal = false;
  }

  onAddMember(): void {
    if (!this.selectedUserId || !this.selectedRoleLabel.trim()) return;

    this.projectService.addMember(
      this.projectId,
      Number(this.selectedUserId),
      this.selectedRoleLabel,
      this.currentUserId
    ).subscribe({
      next: () => {
        this.loadMembers();
        this.closeAddMemberModal();
      },
      error: (err) => console.error('Failed to add member', err)
    });
  }

  // --- EDIT ---
  onEditRole(member: ProjectMember): void {
    this.editingMember = member;
    this.editRoleLabel = member.projectRoleLabel;
    this.showEditMemberModal = true;
  }

  closeEditMemberModal(): void {
    this.showEditMemberModal = false;
    this.editingMember = null;
  }

  onUpdateRole(): void {
  if (!this.editingMember || !this.editRoleLabel.trim()) return;

  this.projectService.updateMemberRole(
    this.projectId,
    this.editingMember.userId,
    this.editRoleLabel,
    this.currentUserId
  ).subscribe({
    next: () => {
      this.loadMembers();
      this.closeEditMemberModal();
    },
    error: (err) => console.error('Failed to update role', err)
  });
}

  // --- DELETE ---
  onDeleteMember(userId: number): void {
    if (!confirm('Are you sure you want to remove this member?')) return;

    this.projectService.removeMember(this.projectId, userId, this.currentUserId).subscribe({
      next: () => this.loadMembers(),
      error: (err) => console.error('Failed to remove member', err)
    });
  }

  // =====================
  // EXISTING METHODS
  // =====================

  calculateProgress(): void {
    this.totalTasks = this.tasks.length;
    this.completedTasks = this.tasks.filter(task => task.status === 'DONE').length;
    this.pendingTasks = this.totalTasks - this.completedTasks;
    this.progressPercentage = this.totalTasks > 0
      ? Math.round((this.completedTasks / this.totalTasks) * 100)
      : 0;
  }

  calculateChartData(): void {
    const allMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const startMonth = this.projectStartDate.getMonth();
    const endMonth = this.projectEndDate.getMonth();
    this.chartMonths = [];
    for (let i = startMonth; i <= endMonth; i++) {
      this.chartMonths.push(allMonths[i]);
    }
    const totalTime = this.projectEndDate.getTime() - this.projectStartDate.getTime();
    const elapsedTime = this.currentDate.getTime() - this.projectStartDate.getTime();
    this.chartWidthPercentage = Math.min(Math.max((elapsedTime / totalTime) * 100, 0), 100);
    this.chartHeightPercentage = this.progressPercentage;
  }

  nextImage(): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.galleryImages.length;
  }

  scrollToSchedule(): void {
    const element = document.getElementById('task-schedule-section');
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}