import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import type { Project } from './models/project.model';
import type { User } from '../../core/models/user.model';
import { UserService } from '../../core/services/user.service';

export interface ProjectFormData {
  project?: Project;
}

@Component({
  selector: 'app-project-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatIconModule],
  templateUrl: './project-form-dialog.component.html',
  styleUrl: './project-form-dialog.component.css',
})
export class ProjectFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProjectFormDialogComponent>);
  private userService = inject(UserService);
  protected data: ProjectFormData = inject(MAT_DIALOG_DATA);

  protected isEdit = !!this.data?.project;
  protected title = this.isEdit ? 'Edit Project' : 'New Project';
  protected managers: User[] = [];

  protected form = this.fb.group({
    name: [this.data?.project?.name ?? '', Validators.required],
    location: [this.data?.project?.location ?? '', Validators.required],
    status: [this.data?.project?.status ?? 'ACTIVE', Validators.required],
    managerId: [this.data?.project?.managerId ?? '', Validators.required],
    startDate: [this.data?.project?.startDate ?? '', Validators.required],
    endDate: [this.data?.project?.endDate ?? '', Validators.required],
    budgetTotal: [this.data?.project?.budgetTotal ?? '', Validators.required],
    address: [this.data?.project?.address ?? '', Validators.required],
  });

  ngOnInit(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.managers = users.filter((u) => u.role?.toString() === 'PROJECT_MANAGER' || u.role?.toString() === 'ADMIN' || !u.role);
        if (this.managers.length === 0) {
          this.managers = users;
        }
      },
      error: (err) => console.error('Failed to load users for manager selection', err)
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.value);
  }
}
