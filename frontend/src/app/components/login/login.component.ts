import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-wrapper">
      <div class="login-card glass-panel animate-slide-down">
        <div class="brand-logo-container">
          <app-logo [size]="75" variant="hero"></app-logo>
        </div>
        <h2 class="login-title">Sign In</h2>
        <p class="login-subtitle">Access your flight reservations</p>
        
        <div class="alert alert-danger" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              formControlName="username" 
              class="form-input" 
              placeholder="Enter your username"
              [class.error-border]="submitted && f['username'].errors">
            <div *ngIf="submitted && f['username'].errors" class="error-msg">
              Username is required
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              class="form-input" 
              placeholder="Enter your password"
              [class.error-border]="submitted && f['password'].errors">
            <div *ngIf="submitted && f['password'].errors" class="error-msg">
              Password is required
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="loading">
            <span class="spinner" *ngIf="loading"></span>
            <span *ngIf="!loading">Sign In</span>
          </button>
        </form>

        <div class="card-footer">
          Don't have an account? <a routerLink="/register">Register here</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 120px);
      padding: 20px;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 40px;
    }
    .brand-logo-container {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }
    .login-title {
      font-family: var(--font-title);
      font-size: 2rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 8px;
    }
    .login-subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
      text-align: center;
      margin-bottom: 32px;
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
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  returnUrl = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/search';
  }

  get f() { return this.loginForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login(this.loginForm.value)
      .subscribe({
        next: () => {
          this.router.navigateByUrl(this.returnUrl);
        },
        error: error => {
          this.errorMessage = error.error?.message || 'Invalid username or password';
          this.loading = false;
        }
      });
  }
}
