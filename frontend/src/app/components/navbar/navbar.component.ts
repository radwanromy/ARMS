import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar glass-panel">
      <div class="nav-container">
        <div class="brand" (click)="navigate('/')">
          <span class="gradient-text logo">ARMS</span>
          <span class="brand-sub">Airlines</span>
        </div>
        
        <div class="nav-links">
          <a class="nav-link" routerLink="/search" routerLinkActive="active">Search Flights</a>
          <a class="nav-link" *ngIf="authService.isLoggedIn()" routerLink="/my-bookings" routerLinkActive="active">My Bookings</a>
        </div>

        <div class="nav-actions">
          <ng-container *ngIf="authService.isLoggedIn(); else guestTpl">
            <span class="welcome-msg">Welcome, <strong>{{ authService.getCurrentUser()?.username }}</strong></span>
            <button class="btn btn-secondary btn-sm" (click)="logout()">Logout</button>
          </ng-container>
          <ng-template #guestTpl>
            <button class="btn btn-secondary btn-sm" (click)="navigate('/login')">Login</button>
            <button class="btn btn-primary btn-sm" (click)="navigate('/register')">Register</button>
          </ng-template>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      margin: 16px 24px;
      padding: 12px 24px;
      border-radius: 12px;
    }
    .nav-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }
    .brand {
      display: flex;
      align-items: baseline;
      gap: 6px;
      cursor: pointer;
    }
    .logo {
      font-size: 1.8rem;
      font-weight: 800;
      letter-spacing: -0.03em;
    }
    .brand-sub {
      font-family: var(--font-title);
      font-size: 0.9rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .nav-links {
      display: flex;
      gap: 24px;
    }
    .nav-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-family: var(--font-title);
      font-weight: 600;
      font-size: 0.95rem;
      transition: var(--transition-fast);
      position: relative;
      padding: 4px 0;
    }
    .nav-link:hover {
      color: var(--text-primary);
    }
    .nav-link.active {
      color: #3b82f6;
    }
    .nav-link.active::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      border-radius: 2px;
    }
    .nav-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .welcome-msg {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .btn-sm {
      padding: 8px 16px;
      font-size: 0.85rem;
      border-radius: 6px;
    }
  `]
})
export class NavbarComponent {
  constructor(public authService: AuthService, private router: Router) {}

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
