import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserRole, UserStatus } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = '/api/users';
    private http = inject(HttpClient);

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl);
    }

    getUserById(userId: string): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/${userId}`);
    }

    createUser(user: User): Observable<User> {
        return this.http.post<User>(this.apiUrl, user);
    }

    updateUser(userId: string, user: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/${userId}`, user);
    }

    deleteUser(userId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${userId}`);
    }

    deactivateUser(userId: string): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/${userId}/deactivate`, {});
    }

    activateUser(userId: string): Observable<User> {
        return this.http.patch<User>(`${this.apiUrl}/${userId}/activate`, {});
    }
}
