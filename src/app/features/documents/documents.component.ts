import { Component, inject, signal, computed, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DocumentService } from './services/document.service';
import { ProjectService } from '../projects/services/project.service';
import { DocumentFile, DocumentTab } from './models/document.model';
import { DocumentUploadDialogComponent } from './document-upload-dialog.component';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatRippleModule, MatDialogModule],
  templateUrl: './documents.component.html',
  styleUrl: './documents.component.css',
})
export class DocumentsComponent implements OnInit {
  private documentService = inject(DocumentService);
  private projectService = inject(ProjectService);
  private dialog = inject(MatDialog);

  readonly placeholderImage = 'file:///C:/Users/94778/.gemini/antigravity/brain/3f675778-7257-44e8-858b-f81254d14684/document_preview_placeholder_1774460332504.png';

  readonly tabs: DocumentTab[] = ['Contracts', 'Site Photos', 'Blueprints', 'Safety Logs'];
  readonly activeTab = signal<DocumentTab>('Blueprints');
  
  readonly projects = this.projectService.projects;
  readonly selectedProjectId = signal<number | null>(null);

  readonly documents = computed(() => this.documentService.documents());
  readonly selectedFile = signal<DocumentFile | null>(null);

  ngOnInit(): void {
    // Select first project by default if available
    const projList = this.projects();
    if (projList.length > 0) {
      this.selectProject(projList[0].id);
    }
  }

  selectProject(projectId: number): void {
    this.selectedProjectId.set(projectId);
    this.documentService.getDocuments(projectId).subscribe({
      next: (docs: DocumentFile[]) => {
        console.log('Documents received:', docs);
        if (docs.length > 0) {
          this.selectedFile.set(docs[0]);
        } else {
          this.selectedFile.set(null);
        }
      }
    });
  }

  selectFile(file: DocumentFile): void {
    this.selectedFile.set(file);
  }

  setActiveTab(tab: DocumentTab): void {
    this.activeTab.set(tab);
  }

  triggerUpload(): void {
    const dialogRef = this.dialog.open(DocumentUploadDialogComponent, {
      data: {
        projects: this.projects(),
        selectedProjectId: this.selectedProjectId()
      },
      panelClass: 'document-upload-dialog',
      maxWidth: '450px',
      width: '100%'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.file) {
        this.documentService.uploadDocument(
          Number(result.projectId), 
          Number(result.uploadedBy), 
          result.file
        ).subscribe({
          next: () => {
            console.log('File uploaded successfully');
            // Real-time update: the service already triggers a refresh
            this.selectProject(Number(result.projectId));
          },
          error: (err: any) => console.error('Upload failed', err)
        });
      }
    });
  }

  deleteFile(file: DocumentFile): void {
    if (confirm(`Are you sure you want to delete ${file.fileName}?`)) {
      this.documentService.deleteDocument(file.projectId, file.documentId).subscribe({
        next: () => {
          if (this.selectedFile()?.documentId === file.documentId) {
            this.selectedFile.set(null);
          }
        }
      });
    }
  }

  getFileIcon(type: string): string {
    if (!type) return 'insert_drive_file';
    const t = type.toLowerCase();
    if (t.includes('pdf')) return 'description';
    if (t.includes('jpg') || t.includes('png') || t.includes('img') || t.includes('image')) return 'image';
    if (t.includes('xlsx') || t.includes('xls') || t.includes('csv')) return 'table_chart';
    return 'insert_drive_file';
  }

  getFileIconColor(type: string): string {
    if (!type) return 'text-gray-500 bg-gray-50';
    const t = type.toLowerCase();
    if (t.includes('pdf')) return 'text-red-500 bg-red-50';
    if (t.includes('jpg') || t.includes('png') || t.includes('img') || t.includes('image')) return 'text-orange-500 bg-orange-50';
    if (t.includes('xlsx') || t.includes('xls') || t.includes('csv')) return 'text-green-500 bg-green-50';
    return 'text-gray-500 bg-gray-50';
  }

  formatSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
