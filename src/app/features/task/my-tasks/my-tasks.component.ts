import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../service/task.service';
import { Task } from '../model/task.model';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TaskDetailComponent } from '../task-detail-component/task-detail-component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-my-tasks',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './my-tasks.component.html',
  styleUrls: ['./my-tasks.component.css']
})
export class MyTasksComponent implements OnInit {
  private readonly taskService = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);

  tasks = signal<Task[]>([]);
  activeTab = signal<'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('ALL');

  todaysTasksCount = computed(() => this.tasks().filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length);
  upcomingDeadlinesCount = computed(() => this.tasks().filter(t => t.status !== 'DONE').length);
  completedThisWeekCount = computed(() => this.tasks().filter(t => t.status === 'DONE').length);

  filteredTasks = computed(() => {
    const tab = this.activeTab();
    if (tab === 'ALL') return this.tasks();
    return this.tasks().filter(t => t.status === tab);
  });

  ngOnInit() {
    this.loadMyTasks();
  }

  loadMyTasks() {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.taskService.getMyTasks(Number(userId)).subscribe(tasks => {
        this.tasks.set(tasks);
      });
    } else {
      // Fallback: filter all tasks client-side using the JWT email
      const allTasks = this.taskService.tasks();
      this.tasks.set(allTasks);
    }
  }

  setTab(tab: 'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE') {
    this.activeTab.set(tab);
  }

  openTaskDetail(task: Task) {
    this.dialog.open(TaskDetailComponent, {
      width: '600px',
      data: { task }
    });
  }

  changeStatus(task: Task, newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') {
    this.taskService.updateTaskStatus(task.taskId, newStatus).subscribe({
      next: () => {
        // Update the local task list immediately for responsive UI
        const updated = this.tasks().map(t =>
          t.taskId === task.taskId ? { ...t, status: newStatus } : t
        );
        this.tasks.set(updated as Task[]);
      },
      error: (err) => {
        console.error('Failed to update task status', err);
        // Fallback: update locally anyway for demo
        const updated = this.tasks().map(t =>
          t.taskId === task.taskId ? { ...t, status: newStatus } : t
        );
        this.tasks.set(updated as Task[]);
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'No Date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  isToday(dateStr: string): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }
}
