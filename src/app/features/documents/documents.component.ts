import { Component, inject, signal, computed, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DocumentService } from './services/document.service';
import { ProjectService } from '../projects/services/project.service';
import { DocumentFile, DocumentTab } from './models/document.model';
import { DocumentUploadDialogComponent } from './document-upload-dialog.component';
import { HttpClient } from '@angular/common/http';

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

  readonly placeholderImage = '';

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

  constructor(private http: HttpClient) {}

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
  // ── Custom Delete Confirmation ──
  readonly showDeleteConfirm = signal(false);
  readonly fileToDelete = signal<DocumentFile | null>(null);

  // ── Toast Notification ──
  readonly toastMessage = signal('');
  readonly toastVisible = signal(false);
  private toastTimeout: any;

  requestDeleteFile(file: DocumentFile): void {
    this.fileToDelete.set(file);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.fileToDelete.set(null);
  }

  confirmDelete(): void {
    const file = this.fileToDelete();
    if (!file) return;
    this.showDeleteConfirm.set(false);
    this.fileToDelete.set(null);

    this.documentService.deleteDocument(file.projectId, file.documentId).subscribe({
      next: () => {
        if (this.selectedFile()?.documentId === file.documentId) {
          this.selectedFile.set(null);
        }
        this.showToast(`"${file.fileName}" has been removed.`);
      },
      error: () => {
        this.showToast('Failed to delete document. Please try again.');
      }
    });
  }

  // ── Download ──
  downloadFile(file: DocumentFile): void {
    const url = `/api/documents/${file.projectId}/documents/${file.documentId}/download`;

  this.http.get(url, { responseType: 'blob' }).subscribe({
    next: (blob) => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = file.fileName;
      a.click();
      window.URL.revokeObjectURL(downloadUrl);

      this.showToast(`Downloading "${file.fileName}"…`);
    },
    error: () => {
      this.showToast('Download failed');
    }
  });
  }

  // ── Share ──
  shareFile(file: DocumentFile): void {
    const projectName = this.getProjectName(file.projectId);
    const info = `📄 ${file.fileName}\n📂 Project: ${projectName}\n📦 Size: ${this.formatSize(file.fileSize)}\n📅 Uploaded: ${file.uploadedAt}\n🔖 Version: ${file.version || 'v1.0'}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(info).then(() => {
        this.showToast('Document details copied to clipboard!');
      });
    } else {
      this.showToast('Clipboard not available in this browser.');
    }
  }

  private showToast(message: string): void {
    clearTimeout(this.toastTimeout);
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    this.toastTimeout = setTimeout(() => {
      this.toastVisible.set(false);
    }, 3000);
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

  getFileExtension(fileName: string): string {
    if (!fileName) return 'FILE';
    const ext = fileName.split('.').pop()?.toUpperCase() || '';
    return ext || 'FILE';
  }

  getDocumentStatus(doc: DocumentFile): string {
    if (!doc.uploadedAt) return 'Pending';
    return 'Uploaded';
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Uploaded': return 'text-green-600';
      case 'Pending': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  }

  getPreviewIcon(fileType: string): string {
    if (!fileType) return 'insert_drive_file';
    const t = fileType.toLowerCase();
    if (t.includes('pdf')) return 'picture_as_pdf';
    if (t.includes('image') || t.includes('jpg') || t.includes('png')) return 'image';
    if (t.includes('spreadsheet') || t.includes('xlsx') || t.includes('csv')) return 'table_chart';
    if (t.includes('word') || t.includes('doc')) return 'article';
    if (t.includes('zip') || t.includes('rar')) return 'folder_zip';
    return 'description';
  }

  getPreviewIconColor(fileType: string): string {
    if (!fileType) return '#94a3b8';
    const t = fileType.toLowerCase();
    if (t.includes('pdf')) return '#dc2626';
    if (t.includes('image') || t.includes('jpg') || t.includes('png')) return '#ea580c';
    if (t.includes('spreadsheet') || t.includes('xlsx') || t.includes('csv')) return '#16a34a';
    if (t.includes('word') || t.includes('doc')) return '#3b82f6';
    return '#64748b';
  }

  getProjectName(projectId: number): string {
    const proj = this.projects().find(p => p.id === projectId);
    return proj?.name || 'PRJ-' + projectId;
  }
}
