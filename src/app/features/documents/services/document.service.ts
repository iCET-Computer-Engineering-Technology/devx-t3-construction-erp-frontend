import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { DocumentFile } from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = '/api/projects';

  private readonly documentsSignal = signal<DocumentFile[]>([]);
  readonly documents = this.documentsSignal.asReadonly();

  getDocuments(projectId: number): Observable<DocumentFile[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${projectId}/documents`).pipe(
      map(rawDocs => (rawDocs || []).map(d => ({
        documentId: d.documentId || d.document_id || d.id,
        projectId: d.projectId || d.project_id || projectId,
        fileName: d.fileName || d.file_name || d.name || 'Untitled Document',
        fileSize: d.fileSize || d.file_size || d.size || 0,
        fileType: d.fileType || d.file_type || d.type || 'application/octet-stream',
        uploadedAt: d.uploadedAt || d.uploaded_at || d.created_at || new Date().toISOString(),
        uploadedBy: d.uploadedBy || d.uploaded_by || d.user_id || 0,
        uploaderName: d.uploaderName || d.uploader_name || d.user_name,
        uploaderAvatar: d.uploaderAvatar || d.uploader_avatar,
        version: d.version || 'v1.0'
      } as DocumentFile))),
      tap(docs => this.documentsSignal.set(docs))
    );
  }

  uploadDocument(projectId: number, uploadedBy: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('uploadedBy', uploadedBy.toString());
    formData.append('file', file);

    return this.http.post(`${this.apiUrl}/${projectId}/documents`, formData).pipe(
      tap(() => this.getDocuments(projectId).subscribe())
    );
  }

  deleteDocument(projectId: number, documentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${projectId}/documents/${documentId}`).pipe(
      tap(() => this.getDocuments(projectId).subscribe())
    );
  }
}
