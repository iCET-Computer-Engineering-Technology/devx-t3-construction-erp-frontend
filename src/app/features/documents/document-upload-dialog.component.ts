import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Project } from '../projects/models/project.model';

export interface DocumentUploadData {
  projects: Project[];
  selectedProjectId?: number;
}

@Component({
  selector: 'app-document-upload-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatIconModule],
  template: `
    <div class="p-6 max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <mat-icon class="text-orange-600">upload_file</mat-icon>
          </div>
          <h2 class="text-xl font-bold text-gray-900 tracking-tight">Upload Document</h2>
        </div>
        <button (click)="onCancel()" class="p-2 hover:bg-gray-100 rounded-full transition-colors group">
          <mat-icon class="text-gray-400 group-hover:text-gray-600">close</mat-icon>
        </button>
      </div>

      <form [formGroup]="uploadForm" (ngSubmit)="onUpload()" class="space-y-5">
        <!-- Project Selection -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Project</label>
          <div class="relative group">
            <select formControlName="projectId" 
                    class="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer">
              <option value="" disabled>Select a project</option>
              @for (proj of data.projects; track proj.id) {
                <option [value]="proj.id">{{ proj.name }}</option>
              }
            </select>
            <mat-icon class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-orange-500 transition-colors">expand_more</mat-icon>
          </div>
        </div>

        <!-- Uploader ID -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Uploader ID</label>
          <input type="number" formControlName="uploadedBy" placeholder="Enter your User ID"
                 class="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all" />
        </div>

        <!-- File Dropzone -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Document File</label>
          <div (click)="fileInput.click()"
               (dragover)="onDragOver($event)"
               (dragleave)="onDragLeave($event)"
               (drop)="onDrop($event)"
               [class.border-orange-500]="isDragging()"
               [class.bg-orange-50]="isDragging()"
               class="w-full aspect-video border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-orange-300 hover:bg-orange-50/30 transition-all group relative overflow-hidden">
            
            <input type="file" #fileInput (change)="onFileSelected($event)" class="hidden" />
            
            @if (!selectedFile()) {
              <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <mat-icon class="text-gray-400 group-hover:text-orange-500">cloud_upload</mat-icon>
              </div>
              <p class="text-sm font-medium text-gray-700">Drop your file here or <span class="text-orange-600">click to browse</span></p>
              <p class="text-xs text-gray-400 mt-1">PDF, DOCX, XLSX, or Images up to 10MB</p>
            } @else {
              <div class="flex items-center gap-4 bg-white p-3 rounded-xl border border-orange-100 shadow-sm animate-in fade-in zoom-in duration-300">
                <div class="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <mat-icon class="text-orange-600">insert_drive_file</mat-icon>
                </div>
                <div class="flex flex-col min-w-0 pr-4">
                  <span class="text-sm font-bold text-gray-900 truncate max-w-[180px]">{{ selectedFile()?.name }}</span>
                  <span class="text-[10px] text-gray-400 font-mono uppercase">{{ formatSize(selectedFile()?.size || 0) }}</span>
                </div>
                <button (click)="removeFile($event)" class="p-1 hover:bg-red-50 rounded-full text-red-400 hover:text-red-500 transition-colors">
                  <mat-icon class="text-lg">delete_outline</mat-icon>
                </button>
              </div>
            }
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-2">
          <button type="button" (click)="onCancel()"
                  class="flex-1 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button type="submit" [disabled]="uploadForm.invalid || !selectedFile()"
                  class="flex-[2] py-3 bg-orange-600 text-white text-sm font-bold rounded-xl hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed transition-all">
            Confirm Upload
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-in { animation: animate-in 0.3s ease-out; }
    @keyframes animate-in {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class DocumentUploadDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<DocumentUploadDialogComponent>);
  protected data: DocumentUploadData = inject(MAT_DIALOG_DATA);

  protected uploadForm = this.fb.group({
    projectId: [this.data.selectedProjectId?.toString() || '', Validators.required],
    uploadedBy: ['', [Validators.required, Validators.min(1)]]
  });

  protected selectedFile = signal<File | null>(null);
  protected isDragging = signal(false);

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.selectedFile.set(event.dataTransfer.files[0]);
    }
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
  }

  onUpload(): void {
    if (this.uploadForm.valid && this.selectedFile()) {
      this.dialogRef.close({
        ...this.uploadForm.value,
        file: this.selectedFile()
      });
    }
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
