import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import type { Project } from './models/project.model';

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
export class ProjectFormDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ProjectFormDialogComponent>);
  protected data: ProjectFormData = inject(MAT_DIALOG_DATA);

  protected isEdit = !!this.data?.project;
  protected title = this.isEdit ? 'Edit Project' : 'New Project';

  protected form = this.fb.group({
    name: [this.data?.project?.name ?? '', Validators.required],
    type: [this.data?.project?.type ?? '', Validators.required],
    location: [this.data?.project?.location ?? '', Validators.required],
    status: [this.data?.project?.status ?? 'ACTIVE', Validators.required],
    manager: [this.data?.project?.manager ?? '', Validators.required],
    startDate: [this.data?.project?.startDate ?? '', Validators.required],
    endDate: [this.data?.project?.endDate ?? '', Validators.required],
    budgetTotal: [this.data?.project?.budgetTotal ?? '', Validators.required],
    address: [this.data?.project?.address ?? '', Validators.required],
  });

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
