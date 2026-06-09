import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  template: `
    <div class="register-wrapper">
      <div class="register-card glass-panel">
        <h2 class="register-title">Create Account</h2>
        <p class="register-subtitle">Join us to book your flight reservations</p>
        
        <div class="alert alert-danger" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>
        <div class="alert alert-success" *ngIf="successMessage">
          {{ successMessage }}
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group col">
              <label class="form-label" for="firstName">First Name</label>
              <input type="text" id="firstName" formControlName="firstName" class="form-input" placeholder="John">
            </div>
            <div class="form-group col">
              <label class="form-label" for="lastName">Last Name</label>
              <input type="text" id="lastName" formControlName="lastName" class="form-input" placeholder="Doe">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              formControlName="username" 
              class="form-input" 
              placeholder="Choose a username"
              [class.error-border]="submitted && f['username'].errors">
            <div *ngIf="submitted && f['username'].errors" class="error-msg">
              <span *ngIf="f['username'].errors['required']">Username is required</span>
              <span *ngIf="f['username'].errors['minlength']">Username must be at least 3 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              class="form-input" 
              placeholder="john.doe@example.com"
              [class.error-border]="submitted && f['email'].errors">
            <div *ngIf="submitted && f['email'].errors" class="error-msg">
              <span *ngIf="f['email'].errors['required']">Email is required</span>
              <span *ngIf="f['email'].errors['email']">Enter a valid email address</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              class="form-input" 
              placeholder="Create a strong password"
              [class.error-border]="submitted && f['password'].errors">
            <div *ngIf="submitted && f['password'].errors" class="error-msg">
              <span *ngIf="f['password'].errors['required']">Password is required</span>
              <span *ngIf="f['password'].errors['minlength']">Password must be at least 6 characters</span>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="phoneNumber">Phone Number</label>
            <input type="text" id="phoneNumber" formControlName="phoneNumber" class="form-input" placeholder="+1234567890">
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            <span class="spinner" *ngIf="loading"></span>
            <span *ngIf="!loading">Create Account</span>
          </button>
        </form>

        <div class="card-footer">
          Already have an account? <a routerLink="/login">Sign In here</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .register-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 120px);
      padding: 20px;
    }
    .register-card {
      width: 100%;
      max-width: 480px;
      padding: 40px;
    }
    .register-title {
      font-family: var(--font-title);
      font-size: 2rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 8px;
    }
    .register-subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
      text-align: center;
      margin-bottom: 32px;
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .col {
      flex: 1;
    }
    .btn-block {
      width: 100%;
      margin-top: 10px;
      gap: 10px;
    }
    .error-msg {
      color: var(--danger);
      font-size: 0.8rem;
      margin-top: 6px;
    }
    .error-border {
      border-color: var(--danger) !important;
    }
    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      margin-bottom: 24px;
      border: 1px solid transparent;
    }
    .alert-danger {
      background: var(--danger-glow);
      border-color: var(--danger);
      color: #fca5a5;
    }
    .alert-success {
      background: var(--success-glow);
      border-color: var(--success);
      color: #a7f3d0;
    }
    .card-footer {
      margin-top: 24px;
      text-align: center;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .card-footer a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }
    .card-footer a:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      firstName: [''],
      lastName: [''],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phoneNumber: ['']
    });
  }

  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.register(this.registerForm.value)
      .subscribe({
        next: () => {
          this.successMessage = 'Registration successful! Redirecting to login page...';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: error => {
          this.errorMessage = error.error?.message || error.error || 'Registration failed. Try again.';
          this.loading = false;
        }
      });
  }
}
