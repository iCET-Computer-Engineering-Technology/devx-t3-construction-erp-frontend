import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatFormFieldModule
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    loginForm: FormGroup;
    errorMessage: string | null = null;
    isLoading = false;

    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);

    constructor() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

    onSubmit(): void {
        if (this.loginForm.valid) {
            this.isLoading = true;
            this.errorMessage = null;
            this.authService.login(this.loginForm.value).subscribe({
                next: (res) => {
                    this.isLoading = false;
                    console.log('Login Response:', res);
                    if (this.authService.isAdmin()) {
                        this.router.navigate(['/users']);
                    } else {
                        this.errorMessage = 'Access Denied: Admin role required';
                        this.authService.logout();
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    this.errorMessage = 'Invalid Credentials';
                    console.error('Login error:', err);
                }
            });
        } else {
            this.loginForm.markAllAsTouched();
        }
    }
}
