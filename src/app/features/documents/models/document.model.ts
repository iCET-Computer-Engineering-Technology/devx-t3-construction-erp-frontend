export interface DocumentFile {
  documentId: number;
  projectId: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: number;
  uploaderName?: string;
  uploaderAvatar?: string;
  version: string;
}

export interface UploadDocumentRequest {
  projectId: number;
  uploadedBy: number;
  file: File;
}

export type DocumentTab = 'Contracts' | 'Site Photos' | 'Blueprints' | 'Safety Logs';
