import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { User, UserRole, UserStatus } from '../../../core/models/user.model';
import { UserService } from '../../../core/services/user.service';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule
    ],
    templateUrl: './user-form.component.html',
    styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
    userForm: FormGroup;
    isEditMode = false;

    // Available roles for selection
    roles = Object.values(UserRole);

    private fb = inject(FormBuilder);
    private userService = inject(UserService);

    constructor(
        public dialogRef: MatDialogRef<UserFormComponent>,
        @Inject(MAT_DIALOG_DATA) public data: User | null
    ) {
        this.isEditMode = !!data;

        this.userForm = this.fb.group({
            name: [data?.name || '', [Validators.required, Validators.minLength(3)]],
            email: [data?.email || '', [Validators.required, Validators.email]],
            role: [data?.role || null, Validators.required],
            // Password is only required when creating a new user
            password: ['']
        });

        if (!this.isEditMode) {
            this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        }
    }

    ngOnInit(): void { }

    onSubmit(): void {
        if (this.userForm.valid) {
            const formValue = this.userForm.value;

            if (this.isEditMode && this.data) {
                // Prepare update payload
                const updatePayload: Partial<User> = {
                    name: formValue.name,
                    email: formValue.email,
                    role: formValue.role
                };

                this.userService.updateUser(this.data.userId, updatePayload).subscribe({
                    next: (res) => this.dialogRef.close(res),
                    error: (err) => console.error('Update failed', err)
                });
            } else {
                // Create user
                const newUser: User = {
                    userId: '', // Let backend generate, or handle accordingly
                    name: formValue.name,
                    email: formValue.email,
                    role: formValue.role,
                    status: UserStatus.ACTIVE,
                    password: formValue.password
                };

                this.userService.createUser(newUser).subscribe({
                    next: (res) => this.dialogRef.close(res),
                    error: (err) => console.error('Creation failed', err)
                });
            }
        }
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
