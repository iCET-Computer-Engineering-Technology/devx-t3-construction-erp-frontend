import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from "@angular/router";
import { TaskService } from './service/task.service';
import { ProjectService } from '../projects/services/project.service';
import type { Task, TaskPriority, TaskStatus } from './model/task.model';

@Component({
    selector: "app-tasks",
    templateUrl: "./task.component.html",
    styleUrls: ["./task.component.css"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TasksComponent {
    private readonly router = inject(Router);
    private readonly taskService = inject(TaskService);
    private readonly projectService = inject(ProjectService);

    readonly tasks = this.taskService.tasks;
    readonly projects = this.projectService.projects;
    
    readonly selectedProjectId = signal<number | null>(null);

    readonly filteredTasks = computed(() => {
        const projectId = this.selectedProjectId();
        if (projectId) {
            return this.tasks().filter(task => task.projectId === projectId);
        }
        return this.tasks();
    });

    readonly todoTasks = computed(() => this.tasksByStatus('TODO'));
    readonly inProgressTasks = computed(() => this.tasksByStatus('IN_PROGRESS'));
    readonly doneTasks = computed(() => this.tasksByStatus('DONE'));

    onNewTaskClick() {
        this.router.navigate(["/tasks/new"]);
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

    private tasksByStatus(status: TaskStatus): Task[] {
        return this.filteredTasks().filter((task) => task.status === status);
    }
}