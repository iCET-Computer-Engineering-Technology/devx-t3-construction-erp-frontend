import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/users', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(c => c.LoginComponent)
    },
    {
        path: 'users',
        loadComponent: () => import('./features/user-management/user-list/user-list.component').then(c => c.UserListComponent),
        canActivate: [authGuard]
    },
    { path: '**', redirectTo: '/users' }
];
