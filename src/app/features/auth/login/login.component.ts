import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, MatIconModule, MatCheckboxModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    loginForm: FormGroup;
    errorMessage: string | null = null;
    isLoading = false;
    showPassword = signal(false);

    private fb           = inject(FormBuilder);
    readonly authService = inject(AuthService);
    private router       = inject(Router);
    private route        = inject(ActivatedRoute);

    constructor() { 
        if (this.authService.isLoggedIn()) {
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
            const destination = returnUrl ?? this.getRoleLandingPage(this.authService.getCurrentRole());
            this.router.navigateByUrl(destination);
        }

        this.loginForm = this.fb.group({
            email:    ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            remember: [false],
        });
    }

    togglePassword(): void {
        this.showPassword.update(v => !v);
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
                        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
                        const destination = returnUrl ?? this.getRoleLandingPage(role);
                        this.router.navigateByUrl(destination);
                    } else {
                        this.errorMessage = 'Access Denied: No valid role assigned to this account.';
                        this.authService.logout();
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    console.error('Login failed. HTTP Status:', err?.status, '| Error:', err?.error);
                    this.errorMessage = 'Invalid email or password.';
                }
            });
        } else {
            this.loginForm.markAllAsTouched();
        }
    }
 
    private getRoleLandingPage(role: UserRole | null): string {
        switch (role) {
            case UserRole.ADMIN:           return '/dashboard';
            case UserRole.PROJECT_MANAGER: return '/dashboard';
            case UserRole.SITE_ENGINEER:   return '/dashboard';
            case UserRole.ACCOUNTANT:      return '/dashboard';
            case UserRole.WORKER:          return '/my-tasks';
            default:                       return '/dashboard';
        }
    }
}