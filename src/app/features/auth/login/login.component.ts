import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatIconModule,
        MatCheckboxModule,
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    loginForm: FormGroup;
    errorMessage: string | null = null;
    isLoading = false;
    showPassword = signal(false);

    private fb = inject(FormBuilder);
    readonly authService = inject(AuthService);
    private router = inject(Router);

    constructor() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            remember: [false],
        });
    }

    togglePassword(): void {
        this.showPassword.update((v) => !v);
    }

    onSubmit(): void {
        if (this.loginForm.valid) {
            this.isLoading = true;
            this.errorMessage = null;
            const { email, password } = this.loginForm.value;
            this.authService.login({ email, password }).subscribe({
                next: () => {
                    this.isLoading = false;
                    const role = this.authService.getCurrentRole();
                    if (role) {
                        this.router.navigate(['/dashboard']);
                    } else {
                        this.errorMessage = 'Access Denied: No valid role assigned to this account.';
                        this.authService.logout();
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    console.error('Login failed. HTTP Status:', err?.status, '| Error body:', err?.error);
                    this.errorMessage = 'Invalid Credentials';
                }
            });
        } else {
            this.loginForm.markAllAsTouched();
        }
    }
}
