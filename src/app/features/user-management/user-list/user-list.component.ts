import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { UserService } from '../../../core/services/user.service';
import { User, UserStatus } from '../../../core/models/user.model';
import { UserFormComponent } from '../user-form/user-form.component';
import { catchError, of } from 'rxjs';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatChipsModule
    ],
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
    displayedColumns: string[] = ['name', 'email', 'role', 'status', 'actions'];
    users: User[] = [];
    isLoading = true;

    private userService = inject(UserService);
    private dialog = inject(MatDialog);

    ngOnInit(): void {
        this.loadUsers();
    }

    loadUsers(): void {
        this.isLoading = true;
        this.userService.getUsers().subscribe({
            next: (data) => {
                this.users = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error fetching users:', err);
                // Fallback mock data if backend isn't ready or auth is failing for dev
                this.users = [];
                this.isLoading = false;
            }
        });
    }

    openUserForm(user?: User): void {
        const dialogRef = this.dialog.open(UserFormComponent, {
            width: '500px',
            data: user ? { ...user } : null
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Optimistically reload the list or push local update
                this.loadUsers();
            }
        });
    }

    deleteUser(userId: string): void {
        if (confirm('Are you sure you want to delete this user?')) {
            this.userService.deleteUser(userId).subscribe({
                next: () => this.loadUsers(),
                error: (err) => console.error('Delete failed', err)
            });
        }
    }

    toggleStatus(user: User): void {
        if (user.status === UserStatus.ACTIVE) {
            this.userService.deactivateUser(user.userId).subscribe({
                next: () => this.loadUsers(),
                error: (err) => console.error('Deactivate failed', err)
            });
        } else {
            this.userService.activateUser(user.userId).subscribe({
                next: () => this.loadUsers(),
                error: (err) => console.error('Activate failed', err)
            });
        }
    }
}
