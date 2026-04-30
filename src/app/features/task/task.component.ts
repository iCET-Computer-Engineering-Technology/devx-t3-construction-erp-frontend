import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from "@angular/router";
import { TaskService } from './service/task.service';
import { ProjectService } from '../projects/services/project.service';
import { MatDialog } from '@angular/material/dialog';
import { TaskDetailComponent } from './task-detail-component/task-detail-component';
import type { Task, TaskPriority, TaskStatus } from './model/task.model';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models/user.model';

@Component({
    selector: "app-tasks",
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: "./task.component.html",
    styleUrls: ["./task.component.css"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksComponent {
    private readonly router = inject(Router);
    private readonly taskService = inject(TaskService);
    private readonly projectService = inject(ProjectService);
    private readonly dialog = inject(MatDialog);
    private readonly authService = inject(AuthService);

    readonly currentRole = signal<UserRole | null>(null);

    readonly tasks = this.taskService.tasks;
    readonly projects = this.projectService.projects;
    
    constructor() {
        this.authService.currentUserRole$.subscribe(role => this.currentRole.set(role));
    }
    
    readonly selectedProjectId = signal<number | null>(null);

    readonly canEditTask = computed(() => {
        const role = this.currentRole();
        return role === UserRole.ADMIN || role === UserRole.PROJECT_MANAGER;
    });

    readonly projectsWithTasks = computed(() => {
        const selectedId = this.selectedProjectId();
        let displayProjects = this.projects();
        
        if (selectedId) {
            displayProjects = displayProjects.filter(p => p.id === selectedId);
        }

        return displayProjects.map(project => {
            const pTasks = this.tasks().filter(t => t.projectId === project.id);
            return {
                project,
                todoTasks: pTasks.filter(t => t.status === 'TODO'),
                inProgressTasks: pTasks.filter(t => t.status === 'IN_PROGRESS'),
                doneTasks: pTasks.filter(t => t.status === 'DONE'),
                totalTasks: pTasks.length
            };
        }).filter(p => p.totalTasks > 0 || selectedId); // Show if has tasks OR if explicitly selected
    });

    readonly selectedTask = signal<Task | null>(null);

    onNewTaskClick() {
        this.router.navigate(["/tasks/new"]);
    }

    openTaskDetail(task: Task) {
        this.selectedTask.set(task);
    }

    editTask(task: Task) {
        this.router.navigate(['/tasks', task.taskId, 'edit']);
    }

    closeTaskDetail() {
        this.selectedTask.set(null);
    }

    updateTaskStatus(taskId: number, newStatus: TaskStatus) {
        this.taskService.updateTaskStatus(taskId, newStatus).subscribe({
            next: () => {
                // Close modal and let the UI refresh its kanban board automatically via the signal
                if (this.selectedTask()?.taskId === taskId) {
                    this.closeTaskDetail();
                }
            },
            error: (err) => {
                console.error('Failed to update task status', err);
                
                // DEMO FALLBACK: If backend PATCH fails or is unimplemented, update local signal manually
                alert('Backend update failed. Falling back to local state update for demo.');
                const currentTasks = this.taskService['tasksSignal']();
                const index = currentTasks.findIndex(t => t.taskId === taskId);
                if (index !== -1) {
                    const updated = [...currentTasks];
                    updated[index] = { ...updated[index], status: newStatus };
                    this.taskService['tasksSignal'].set(updated);
                }
                if (this.selectedTask()?.taskId === taskId) {
                    this.closeTaskDetail();
                }
            }
        });
    }

    onProjectFilterChange(event: Event) {
        const selectElement = event.target as HTMLSelectElement;
        const value = selectElement.value;
        this.selectedProjectId.set(value ? Number(value) : null);
    }

    formatStatus(status: TaskStatus): string {
        switch (status) {
            case 'IN_PROGRESS':
                return 'IN PROGRESS';
            case 'DONE':
                return 'DONE';
            default:
                return 'TO DO';
        }
    }

    formatPriority(priority: TaskPriority): string {
        return priority;
    }

    formatDate(value: string): string {
        if (!value) {
            return 'No Date';
        }

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'No Date';
        }

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit'
        });
    }

}