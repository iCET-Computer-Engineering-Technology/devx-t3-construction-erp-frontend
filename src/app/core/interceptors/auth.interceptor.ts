import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    let authReq = req;
    // Only add the token if we have a real JWT and we're not calling the login endpoint
    if (token && token !== 'session-active' && !req.url.includes('/api/auth/login')) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            },
            withCredentials: true // <--- ADDED THIS
        });
    } else if (!req.url.includes('/api/auth/login')) {
        // Even if there's no JWT, we might need to send cookies for session-based auth
        authReq = req.clone({
            withCredentials: true // <--- ADDED THIS
        });
    }

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            // Handle 401 Unauthorized errors, but not on the login endpoint
            if (error.status === 401 && !req.url.includes('/api/auth/login')) {
                authService.logout();
            }
            return throwError(() => error);
        })
    );
};
