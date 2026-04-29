export interface ActivityLog {
createdAt: string|number|Date;
    userId: number;
    action: string;
    moduleName: string;
    referenceId?: number;
    description?: string;
}