import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { UserService } from '../../core/services/user.service';
import { ProjectService } from '../projects/services/project.service';
import { TaskService } from './service/task.service';
import type { TaskStatus, TaskPriority } from './model/task.model';
import type { User } from '../../core/models/user.model';

@Component({
    selector: 'app-new-task-form',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './new-task-form.html',
    styleUrl: './new-task-form.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewTaskFormComponent {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly taskService = inject(TaskService);
    private readonly projectService = inject(ProjectService);
    private readonly userService = inject(UserService);

    readonly projects = this.projectService.projects;
    readonly tasks = this.taskService.tasks;
    readonly users = signal<User[]>([]);
    readonly workerUsers = computed(() => {
        const workers = this.users().filter(u => u.role === 'WORKER');
        const activeTasks = this.tasks().filter(t => t.status !== 'DONE');
        
        return workers.filter(worker => {
            const hasActiveTask = activeTasks.some(task => task.assigneeUserId === Number(worker.userId));
            return !hasActiveTask;
        });
    });
    readonly isSubmitting = signal(false);
    readonly submitError = signal('');
    readonly selectedProjectId = signal<number | null>(null);

    readonly pageTitle = 'Create New Task';
    readonly submitLabel = 'Create Task';
    readonly submitLoadingLabel = 'Creating Task...';

    readonly taskForm = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        description: [''],
        projectId: ['', Validators.required],
        assigneeUserId: ['', Validators.required], // changed from assignedUserId
        startDate: ['', Validators.required],
        endDate: ['', Validators.required], // changed from dueDate
        status: ['TODO' as TaskStatus, Validators.required],
        priority: ['MEDIUM' as TaskPriority, Validators.required]
    });

    constructor() {
        this.userService.getUsers().subscribe({
            next: (users) => this.users.set(users),
            error: (error: unknown) => console.error('Failed to load users', error)
        });

        this.taskForm.controls.projectId.valueChanges.subscribe((value) => {
            const projectId = value ? Number(value) : null;
            this.selectedProjectId.set(projectId);

            const assigneeUserId = this.taskForm.controls.assigneeUserId.value;
            if (assigneeUserId && this.isAssigneeLockedForProject(Number(assigneeUserId), projectId)) {
                this.taskForm.controls.assigneeUserId.setValue('');
            }
        });
    }

    onSubmit(): void {
        this.submitError.set('');
        if (this.taskForm.invalid) {
            this.taskForm.markAllAsTouched();
            return;
        }

        const value = this.taskForm.getRawValue();
        if (!value.projectId || !value.assigneeUserId || !value.startDate || !value.endDate || !value.status || !value.priority || !value.title) {
            this.submitError.set('Please fill all required fields.');
            return;
        }

        const projectId = Number(value.projectId);
        const assigneeUserId = Number(value.assigneeUserId);
        if (this.isAssigneeLockedForProject(assigneeUserId, projectId)) {
            this.submitError.set('This assignee already has tasks in another project. Assign a user within the same project only.');
            return;
        }

        this.isSubmitting.set(true);
        const payload = {
            title: value.title,
            description: value.description ?? '',
            projectId: projectId,
            assigneeUserId: assigneeUserId,
            startDate: value.startDate,
            endDate: value.endDate,
            status: value.status,
            priority: value.priority
        };

        this.taskService.createTask(payload).pipe(
            finalize(() => this.isSubmitting.set(false))
        ).subscribe({
            next: () => {
                this.router.navigate(['/tasks']);
            },
            error: (error: unknown) => {
                console.error('Failed to save task', error);
                this.submitError.set('Could not save task. Please check backend and try again.');
            }
        });
    }

    hasError(field: string): boolean {
        const control = this.taskForm.get(field);
        return !!control && control.invalid && (control.touched || control.dirty);
    }

    isAssigneeLockedForSelectedProject(userId: number | string): boolean {
        // Now that the list only shows available workers, they are no longer locked within the dropdown.
        return false;
    }

    private isAssigneeLockedForProject(userId: number, projectId: number | null): boolean {
        if (!userId || !projectId) {
            return false;
        }

        const activeTasks = this.tasks().filter((task) => task.status !== 'DONE');
        const hasActiveTask = activeTasks.some((task) => task.assigneeUserId === userId);

        return hasActiveTask;
    }
}