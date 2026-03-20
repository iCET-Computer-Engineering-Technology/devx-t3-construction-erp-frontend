import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
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
        path: 'users',
        loadComponent: () => import('./features/user-management/user-list/user-list.component').then(c => c.UserListComponent),
        canActivate: [authGuard]
    }, 
    { path: '**', redirectTo: '/dashboard' }
];
