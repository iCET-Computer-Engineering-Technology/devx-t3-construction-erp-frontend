import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // if (authService.isLoggedIn() && authService.isAdmin()) {
    //     return true;
    // }

    if (authService.isLoggedIn()) {
        return true;
    }

    // Not logged in or not admin, redirect to login page
    return router.parseUrl('/login');
};
