import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { ProjectService } from '../../projects/services/project.service'; // ✅ path check කරන්න

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
  imports: [CommonModule, FormsModule]
})
export class ProjectProgressComponent implements OnInit {

  @Input() projectId: number = 1; // ✅ parent component එකෙන් pass කරන්න

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

  // --- CHART VARIABLES ---
  projectStartDate = new Date('2026-01-01');
  projectEndDate = new Date('2026-05-31');
  currentDate = new Date('2026-05-31');
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
  currentUserId: number = 1; // ✅ AuthService එකෙන් ගන්න ඕනෙ නම් කියන්න

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

  constructor(
    private projectService: ProjectService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.calculateProgress();
    this.calculateChartData();
    this.loadMembers();
    this.loadAllUsers();
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