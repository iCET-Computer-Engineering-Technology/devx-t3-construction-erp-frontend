import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest } from '../models/auth.model';
import { UserRole } from '../models/user.model';
import { Router } from '@angular/router';

export interface CurrentUserInfo {
    userId: string;
    name: string;
    role: UserRole;
    email?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = '/api/auth';
    private tokenKey = 'jwt_token';
    private roleKey = 'user_role';
    private nameKey = 'user_name';
    private emailKey = 'user_email';
    private userIdKey = 'user_id';

    private currentUserRoleSubject = new BehaviorSubject<UserRole | null>(
        (localStorage.getItem(this.roleKey) as UserRole) || this.getRoleFromToken(this.getToken())
    );

    public currentUserRole$ = this.currentUserRoleSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) { }

    private currentUserInfoSubject = new BehaviorSubject<CurrentUserInfo | null>(
        this.buildUserInfoFromStorage()
    );

    public currentUserInfo$ = this.currentUserInfoSubject.asObservable(); 

    login(credentials: LoginRequest): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/login`, credentials, { responseType: 'json' as const }).pipe(
            tap((rawResponse) => {
                console.log('Raw login response:', rawResponse);
                let response = rawResponse;

                if (typeof response === 'string') {
                    try { response = JSON.parse(response); } catch (e) { }
                }
 
                if (Array.isArray(response) && response.length > 0) response = response[0];
                if (response?.data) response = response.data;
                if (response?.body) response = response.body;

                console.log('Processed login response:', response);
 
                if (response?.token) { 
                    this.setToken(response.token); 
                    let role = response.role as UserRole; 
                    
                    if (!role) {
                        role = this.getRoleFromToken(response.token) as UserRole;
                    }

                    if (role) {
                        localStorage.setItem(this.roleKey, role);
                    } else {
                        console.warn("Backend eken role eka awilla naha!");
                    }
 
                    if (response?.name) localStorage.setItem(this.nameKey, response.name);
                    if (response?.email) localStorage.setItem(this.emailKey, response.email);
                    if (response?.userId) localStorage.setItem(this.userIdKey, response.userId);
 
                    this.currentUserRoleSubject.next(role);
                    this.currentUserInfoSubject.next(this.buildUserInfoFromStorage());
                    
                } else {
                    console.error('Response did not contain a token!', response);
                }
            })
        );
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.roleKey);
        localStorage.removeItem(this.nameKey);
        localStorage.removeItem(this.emailKey);
        localStorage.removeItem(this.userIdKey);
        this.currentUserRoleSubject.next(null);
        this.currentUserInfoSubject.next(null);
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

        if (token === 'session-active') return true;

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

    getCurrentUserInfo(): CurrentUserInfo | null {
        return this.currentUserInfoSubject.value;
    }

    getCurrentRole(): UserRole | null {
        return this.currentUserRoleSubject.value;
    }

    getCurrentUserId(): string | null {
        return localStorage.getItem(this.userIdKey);
    }

    private buildUserInfoFromStorage(): CurrentUserInfo | null {
        const role = localStorage.getItem(this.roleKey) as UserRole;
        if (!role) return null;
        return {
            userId: localStorage.getItem(this.userIdKey) || '',
            name: localStorage.getItem(this.nameKey) || 'User',
            role,
            email: localStorage.getItem(this.emailKey) || undefined,
        };
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
 
        let role = decoded.role || decoded.roles?.[0] || decoded.authority || decoded.authorities?.[0];

        console.log("Role : ",role);
        
        if (!role && decoded.sub) {
            console.warn('No role found in JWT! Defaulting to ADMIN based on sub.');
            role = UserRole.ADMIN;
        }

        return role ? role as UserRole : null;
    }
}
