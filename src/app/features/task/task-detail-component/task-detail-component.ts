import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { Task } from '../model/task.model';
import { ProjectService } from '../../projects/services/project.service';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-task-detail-component',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatChipsModule, MatDividerModule],
  templateUrl: './task-detail-component.html',
  styleUrl: './task-detail-component.css',
})
export class TaskDetailComponent implements OnInit {
  projectName: string = '';
  assigneeName: string = '';

  constructor(
    public dialogRef: MatDialogRef<TaskDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { task: Task },
    private projectService: ProjectService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    // Try to get project name from injected data first, fallback to checking project service
    if (this.data.task.projectName) {
      this.projectName = this.data.task.projectName;
    } else {
      const project = this.projectService.projects().find(p => p.id === this.data.task.projectId);
      this.projectName = project ? project.name : `Project ${this.data.task.projectId}`;
    }

    // Try to get assignee name from injected data first, fallback to API
    if (this.data.task.assigneeUserName) {
      this.assigneeName = this.data.task.assigneeUserName;
    } else {
      this.userService.getUserById(this.data.task.assigneeUserId.toString()).subscribe({
        next: (user) => {
          this.assigneeName = user.name;
        },
        error: () => {
          this.assigneeName = `Unknown User`;
        }
      });
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
