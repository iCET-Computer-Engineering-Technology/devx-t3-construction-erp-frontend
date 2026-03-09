export enum UserRole {
    ADMIN = 'ADMIN',
    PROJECT_MANAGER = 'PROJECT_MANAGER',
    SITE_ENGINEER = 'SITE_ENGINEER',
    ACCOUNTANT = 'ACCOUNTANT',
    WORKER = 'WORKER'
}

export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE'
}

export interface User {
    userId: string;
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    password?: string;
}
