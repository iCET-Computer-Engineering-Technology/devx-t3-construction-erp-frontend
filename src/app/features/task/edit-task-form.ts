import { ChangeDetectionStrategy, Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { UserService } from '../../core/services/user.service';
import { ProjectService } from '../projects/services/project.service';
import { TaskService } from './service/task.service';
import type { TaskStatus, TaskPriority, Task } from './model/task.model';
import type { User } from '../../core/models/user.model';

@Component({
    selector: 'app-edit-task-form',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './new-task-form.html', // Reuse the same HTML template!
    styleUrl: './new-task-form.css',     // Reuse the same CSS!
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditTaskFormComponent implements OnInit {
    private readonly fb = inject(FormBuilder);
    private readonly router = inject(Router);
    private readonly route = inject(ActivatedRoute);
    private readonly taskService = inject(TaskService);
    private readonly projectService = inject(ProjectService);
    private readonly userService = inject(UserService);

    readonly projects = this.projectService.projects;
    readonly tasks = this.taskService.tasks;
    readonly users = signal<User[]>([]);
    
    readonly currentAssigneeId = signal<string | null>(null);

    readonly workerUsers = computed(() => {
        const assignee = this.currentAssigneeId();
        return this.users().filter(u => 
            u.role === 'WORKER' || 
            (assignee && String(u.userId) === assignee)
        );
    });

    readonly isSubmitting = signal(false);
    readonly submitError = signal('');
    readonly selectedProjectId = signal<number | null>(null);

    readonly pageTitle = 'Edit Task';
    readonly submitLabel = 'Update Task';
    readonly submitLoadingLabel = 'Updating Task...';

    private taskId: number | null = null;

    readonly taskForm = this.fb.group({
        title: ['', [Validators.required, Validators.minLength(3)]],
        description: [''],
        projectId: ['', Validators.required],
        assigneeUserId: ['', Validators.required],
        startDate: ['', Validators.required],
        endDate: ['', Validators.required],
        status: ['TODO' as TaskStatus, Validators.required],
        priority: ['MEDIUM' as TaskPriority, Validators.required]
    });

    ngOnInit(): void {
        this.userService.getUsers().subscribe({
            next: (users) => this.users.set(users),
            error: (error: unknown) => console.error('Failed to load users', error)
        });

        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.taskId = Number(idParam);
            this.loadTask(this.taskId);
        }
    }

    private loadTask(id: number) {
        this.taskService.getTaskById(id).subscribe({
            next: (task) => {
                if (task) {
                    this.currentAssigneeId.set(String(task.assigneeUserId));
                    this.taskForm.patchValue({
                        title: task.title,
                        description: task.description,
                        projectId: task.projectId.toString(),
                        assigneeUserId: task.assigneeUserId.toString(),
                        startDate: task.startDate,
                        endDate: task.endDate,
                        status: task.status,
                        priority: task.priority,
                    });
                    this.selectedProjectId.set(task.projectId);
                } else {
                    this.submitError.set('Task not found.');
                }
            },
            error: (err) => {
                this.submitError.set('Could not fetch task.');
                console.error(err);
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

        if (!this.taskId) return;

        this.isSubmitting.set(true);
        const payload = {
            title: value.title,
            description: value.description ?? '',
            projectId: Number(value.projectId),
            assigneeUserId: Number(value.assigneeUserId),
            startDate: value.startDate,
            endDate: value.endDate,
            status: value.status,
            priority: value.priority
        };

        this.taskService.updateTask(this.taskId, payload).pipe(
            finalize(() => this.isSubmitting.set(false))
        ).subscribe({
            next: () => {
                this.router.navigate(['/tasks']);
            },
            error: (error: unknown) => {
                console.error('Failed to update task', error);
                this.submitError.set('Could not update task. Please check backend and try again.');
            }
        });
    }

    isAssigneeLockedForSelectedProject(userId: string | number): boolean {
        return false;
    }

    hasError(field: string): boolean {
        const control = this.taskForm.get(field);
        return !!control && control.invalid && (control.touched || control.dirty);
    }
}
