import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(c => c.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'projects',
        loadComponent: () => import('./features/projects/projects.component').then(c => c.ProjectsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'reports',
        loadComponent: () => import('./features/projects/project-report/project-report.component').then(c => c.ProjectReportComponent),
        canActivate: [authGuard]
    },
    {
        path: 'projects/:id',
        loadComponent: () => import('./features/projects/project-details/project-details.component').then(c => c.ProjectDetailsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'users',
        loadComponent: () => import('./features/user-management/user-list/user-list.component').then(c => c.UserListComponent),
        canActivate: [authGuard]
    },
    {
        path: 'my-tasks',
        loadComponent: () => import('./features/task/my-tasks/my-tasks.component').then(c => c.MyTasksComponent),
        canActivate: [authGuard]
    },
    {
        path: 'tasks',
        loadComponent: () => import('./features/task/task.component').then(c => c.TasksComponent),
        canActivate: [authGuard]
    },
    {
        path: 'tasks/new',
        loadComponent: () => import('./features/task/new-task-form').then(c => c.NewTaskFormComponent),
        canActivate: [authGuard]
    },
    {
        path: 'procurement',
        loadComponent: () => import('./features/procurement/procurement.component').then(c => c.ProcurementComponent),
        canActivate: [authGuard]
    },
    {
        path: 'budget',
        loadComponent: () => import('./features/budget/budget.component').then(c => c.BudgetComponent),
        canActivate: [authGuard]
    },
    {
        path: 'documents',
        loadComponent: () => import('./features/documents/documents.component').then(c => c.DocumentsComponent),
        canActivate: [authGuard]
    },
    {
        path: 'equipment',
        loadComponent: () => import('./features/equipment/equipment-list/equipment-list').then(c => c.EquipmentListComponent),
        canActivate: [authGuard]

    },
    { path: '**', redirectTo: '/dashboard' }
];
