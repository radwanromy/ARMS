import { Component, HostListener, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  template: `
    <nav class="navbar glass-panel">
      <div class="nav-container">
        <div class="brand">
          <app-logo [size]="55" variant="navbar"></app-logo>
        </div>
        
        <div class="nav-links">
          <a class="nav-link" routerLink="/search" routerLinkActive="active">Search Flights</a>
          <a class="nav-link" *ngIf="authService.isLoggedIn()" routerLink="/my-bookings" routerLinkActive="active">My Bookings</a>
          <a class="nav-link text-accent" href="javascript:void(0)" (click)="openAIVolantSupport($event)" style="font-weight: 700;">AI Volant Support</a>
          <a class="nav-link text-primary" *ngIf="authService.isLoggedIn() && authService.isAdmin()" routerLink="/admin/bookings" routerLinkActive="active">Manage Bookings</a>
          <a class="nav-link text-accent" *ngIf="authService.isLoggedIn() && (authService.getCurrentUser()?.role === 'SUPPORT_AGENT' || authService.isAdmin())" routerLink="/support/dashboard" routerLinkActive="active">Support Center</a>
        </div>

        <div class="nav-actions">
          <app-theme-switcher></app-theme-switcher>
          <ng-container *ngIf="authService.isLoggedIn(); else guestTpl">
            <div class="user-menu-container">
              <div class="user-profile-trigger" (click)="toggleDropdown($event)">
                <img [src]="authService.getCurrentUser()?.profilePicture || defaultAvatar" 
                     alt="Avatar" class="nav-avatar">
                <span class="welcome-msg">
                  {{ authService.getCurrentUser()?.firstName || authService.getCurrentUser()?.username }}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="chevron-icon" [class.rotated]="isDropdownOpen">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </div>

              <!-- Glassmorphic Dropdown Menu -->
              <div class="user-dropdown-menu glass-panel" *ngIf="isDropdownOpen">
                <div class="dropdown-header">
                  <img [src]="authService.getCurrentUser()?.profilePicture || defaultAvatar" alt="Avatar" class="dropdown-avatar">
                  <div class="user-info">
                    <span class="user-name">
                      {{ authService.getCurrentUser()?.firstName || 'User' }} {{ authService.getCurrentUser()?.lastName || '' }}
                    </span>
                    <span class="user-email">{{ authService.getCurrentUser()?.email }}</span>
                    <span class="user-role-badge">{{ authService.getCurrentUser()?.role }}</span>
                  </div>
                </div>
                
                <div class="dropdown-divider"></div>
                
                <a class="dropdown-item" *ngIf="authService.isAdmin()" (click)="goTo('/admin/bookings')">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="item-icon text-primary">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                  <span>Manage Bookings</span>
                </a>

                <a class="dropdown-item" *ngIf="authService.isLoggedIn() && (authService.getCurrentUser()?.role === 'SUPPORT_AGENT' || authService.isAdmin())" (click)="goTo('/support/dashboard')">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="item-icon text-accent">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94-3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                  <span>Support Center</span>
                </a>

                
                <a class="dropdown-item" (click)="goTo('/profile')">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="item-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  <span>My Profile</span>
                </a>
                
                <a class="dropdown-item" (click)="goTo('/my-bookings')">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="item-icon">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-3.75-12v.75m0 3v.75m0 3v.75m0 3V18m-3.75-12v.75m0 3v.75m0 3v.75m0 3V18M3 16.5v.75m0 3v.75m0 3v.75m0 3V21m-3.75-12v.75m0 3v.75m0 3v.75m0 3V21m-3.75-12v.75m0 3v.75m0 3v.75m0 3V21M3 12h18M3 8.25h18M3 4.5h18" />
                  </svg>
                  <span>My Bookings</span>
                </a>
                
                <div class="dropdown-divider"></div>
                
                <a class="dropdown-item logout-item" (click)="handleLogout()">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="item-icon text-danger">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
                  <span>Logout</span>
                </a>
              </div>
            </div>
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
      position: sticky;
      top: 16px;
      z-index: 1000;
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
      font-weight: 600;
      color: var(--text-primary);
    }
    .btn-sm {
      padding: 8px 16px;
      font-size: 0.85rem;
      border-radius: 6px;
    }
    .user-menu-container {
      position: relative;
    }
    .user-profile-trigger {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      padding: 6px 14px;
      border-radius: 50px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      transition: var(--transition-smooth);
    }
    .user-profile-trigger:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }
    .nav-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      object-fit: cover;
      border: 1.5px solid var(--primary);
      background: rgba(255, 255, 255, 0.1);
    }
    .chevron-icon {
      width: 14px;
      height: 14px;
      color: var(--text-secondary);
      transition: transform 0.2s ease;
    }
    .chevron-icon.rotated {
      transform: rotate(180deg);
    }
    .user-dropdown-menu {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      width: 280px;
      padding: 16px;
      z-index: 100;
      background: var(--glass-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      animation: dropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes dropdownFade {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .dropdown-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 12px;
    }
    .dropdown-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--primary);
      background: rgba(255, 255, 255, 0.1);
    }
    .user-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .user-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .user-email {
      font-size: 0.8rem;
      color: var(--text-muted);
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }
    .user-role-badge {
      align-self: flex-start;
      margin-top: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--primary-glow);
      color: #93c5fd;
      text-transform: uppercase;
    }
    .dropdown-divider {
      height: 1px;
      background: var(--glass-border);
      margin: 8px 0;
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      color: var(--text-secondary);
      text-decoration: none;
      font-weight: 500;
      font-size: 0.9rem;
      cursor: pointer;
      transition: var(--transition-fast);
    }
    .dropdown-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }
    .item-icon {
      width: 18px;
      height: 18px;
    }
    .logout-item:hover {
      background: var(--danger-glow);
      color: #fca5a5;
    }
  `]
})
export class NavbarComponent {
  isDropdownOpen = false;
  defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

  constructor(
    public authService: AuthService, 
    private router: Router, 
    private eRef: ElementRef
  ) {}

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  goTo(path: string): void {
    this.isDropdownOpen = false;
    this.router.navigate([path]);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  handleLogout(): void {
    this.isDropdownOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openAIVolantSupport(event: Event): void {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent('open-ai-chat', { detail: 'services' }));
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }
}
