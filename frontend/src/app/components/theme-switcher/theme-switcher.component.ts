import { Component } from '@angular/core';
import { ThemeService, ColorTheme } from '../../services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  template: `
    <div class="theme-switcher glass-panel">
      <!-- Color Themes -->
      <button 
        class="theme-btn" 
        [class.active]="currentTheme === 'light'" 
        (click)="setTheme('light')" 
        title="Light Theme">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="theme-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      </button>

      <button 
        class="theme-btn" 
        [class.active]="currentTheme === 'mid'" 
        (click)="setTheme('mid')" 
        title="Corporate Mid Theme">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="theme-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      </button>

      <button 
        class="theme-btn" 
        [class.active]="currentTheme === 'dark'" 
        (click)="setTheme('dark')" 
        title="Dark Theme">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="theme-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      </button>

      <div class="divider"></div>

      <!-- Compact Mode Toggle -->
      <button 
        class="theme-btn compact-toggle" 
        [class.active]="isCompact" 
        (click)="toggleCompact()" 
        title="Compact Density Mode">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="theme-icon">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .theme-switcher {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      gap: 6px;
      border-radius: 50px;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .theme-btn {
      background: transparent;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-secondary);
      transition: var(--transition-smooth);
      position: relative;
    }
    .theme-btn:hover {
      background: rgba(255, 255, 255, 0.15);
      color: var(--text-primary);
    }
    .theme-btn.active {
      background: var(--primary);
      color: #ffffff;
      box-shadow: 0 2px 8px var(--primary-glow);
    }
    .theme-icon {
      width: 18px;
      height: 18px;
    }
    .divider {
      width: 1px;
      height: 20px;
      background: var(--glass-border);
      margin: 0 4px;
    }
    .compact-toggle.active {
      background: var(--accent, #8b5cf6);
      box-shadow: 0 2px 8px var(--accent-glow);
    }
  `]
})
export class ThemeSwitcherComponent {
  currentTheme: ColorTheme = 'light';
  isCompact = false;

  constructor(private themeService: ThemeService) {
    this.themeService.activeTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
    this.themeService.compactMode$.subscribe(compact => {
      this.isCompact = compact;
    });
  }

  setTheme(theme: ColorTheme): void {
    this.themeService.setColorTheme(theme);
  }

  toggleCompact(): void {
    this.themeService.setCompactMode(!this.isCompact);
  }
}
