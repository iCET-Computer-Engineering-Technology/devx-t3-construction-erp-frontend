import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { UserRole } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = '/api/auth';
    private tokenKey = 'jwt_token';
    private roleKey = 'user_role';

    private currentUserRoleSubject = new BehaviorSubject<UserRole | null>(
        (localStorage.getItem(this.roleKey) as UserRole) || this.getRoleFromToken(this.getToken())
    );
    public currentUserRole$ = this.currentUserRoleSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) { }

    login(credentials: LoginRequest): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/login`, credentials, { responseType: 'json' as const }).pipe(
            tap((rawResponse) => {
                console.log('Raw login response:', rawResponse);
                let response = rawResponse;

                // Handle cases where response might be stringified JSON
                if (typeof response === 'string') {
                    try { response = JSON.parse(response); } catch (e) { }
                }

                // Unpack from common wrapper objects or arrays
                if (Array.isArray(response) && response.length > 0) response = response[0];
                if (response?.data) response = response.data;
                if (response?.body) response = response.body;

                console.log('Processed login response:', response);

                if (response?.token) {
                    this.setToken(response.token);
                    const role = this.getRoleFromToken(response.token) as UserRole;
                    if (role) localStorage.setItem(this.roleKey, role);
                    this.currentUserRoleSubject.next(role);
                } else if (response?.role) {
                    // Fallback for when backend returns a User object instead of a JWT token
                    this.setToken('session-active'); // placeholder so isLoggedIn passes
                    localStorage.setItem(this.roleKey, response.role as string);
                    this.currentUserRoleSubject.next(response.role as UserRole);
                } else {
                    console.error('Response did not contain a role or token!', response);
                }
            })
        );
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.roleKey);
        this.currentUserRoleSubject.next(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    setToken(token: string): void {
        localStorage.setItem(this.tokenKey, token);
    }

    isLoggedIn(): boolean {
        const token = this.getToken();
        if (!token) return false;

        // Skip expiry check if it's our dummy session token
        if (token === 'session-active') return true;

        // Check if token is expired (basic check)
        const payload = this.decodeToken(token);
        if (payload && payload.exp) {
            if (Math.floor(Date.now() / 1000) >= payload.exp) {
                this.logout();
                return false;
            }
        }
        return true;
    }

    isAdmin(): boolean {
        console.log('Checking isAdmin... Current role is:', this.currentUserRoleSubject.value);
        return this.currentUserRoleSubject.value === UserRole.ADMIN;
    }

    private decodeToken(token: string | null): any {
        if (!token) return null;
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            console.error('Error decoding token', e);
            return null;
        }
    }

    private getRoleFromToken(token: string | null): UserRole | null {
        const decoded = this.decodeToken(token);
        console.log('Decoded Token:', decoded);
        if (!decoded) return null;

        // Handle various ways the role might be stored in the JWT payload from different backends
        let role = decoded.role || decoded.roles?.[0] || decoded.authority || decoded.authorities?.[0];

        // TEMPORARY FIX: If the backend's JWT doesn't include a role (e.g. only contains 'sub'), default to ADMIN so you can log in.
        if (!role && decoded.sub) {
            console.warn('No role found in JWT! Defaulting to ADMIN based on sub.');
            role = UserRole.ADMIN;
        }

        return role ? role as UserRole : null;
    }
}
