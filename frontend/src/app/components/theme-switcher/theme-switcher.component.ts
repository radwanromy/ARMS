import { Component, ElementRef, HostListener } from '@angular/core';
import { ThemeService, ColorTheme } from '../../services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  template: `
    <div class="theme-switcher-container">
      <!-- Minimised Trigger Button -->
      <button 
        class="trigger-btn" 
        (click)="toggleDropdown($event)" 
        title="Customize Theme & Density">
        <span class="active-icon">
          <span *ngIf="currentTheme === 'light'">☀️</span>
          <span *ngIf="currentTheme === 'mid'">🌗</span>
          <span *ngIf="currentTheme === 'dark'">🌙</span>
        </span>
        <span class="compact-dot" *ngIf="isCompact" title="Compact density active"></span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="chevron-icon" [class.rotated]="isDropdownOpen">
          <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <!-- Expandable Themes Menu (Dropdown Panel) -->
      <div class="theme-dropdown glass-panel" *ngIf="isDropdownOpen">
        <div class="dropdown-header">
          <span class="title">Visual Themes</span>
        </div>
        
        <div class="theme-options">
          <!-- Light Theme -->
          <button 
            class="option-item" 
            [class.active]="currentTheme === 'light'" 
            (click)="setTheme('light')"
            title="Light Theme">
            <span class="item-icon">☀️</span>
            <span class="item-label">Light Theme</span>
            <span class="check-mark" *ngIf="currentTheme === 'light'">✓</span>
          </button>

          <!-- Corporate Mid Theme -->
          <button 
            class="option-item" 
            [class.active]="currentTheme === 'mid'" 
            (click)="setTheme('mid')"
            title="Corporate Mid Theme">
            <span class="item-icon">🌗</span>
            <span class="item-label">Corporate Mid</span>
            <span class="check-mark" *ngIf="currentTheme === 'mid'">✓</span>
          </button>

          <!-- Dark Theme -->
          <button 
            class="option-item" 
            [class.active]="currentTheme === 'dark'" 
            (click)="setTheme('dark')"
            title="Dark Theme">
            <span class="item-icon">🌙</span>
            <span class="item-label">Dark Theme</span>
            <span class="check-mark" *ngIf="currentTheme === 'dark'">✓</span>
          </button>
        </div>

        <div class="dropdown-divider"></div>

        <!-- Compact Mode Toggle -->
        <button 
          class="option-item compact-toggle" 
          [class.active]="isCompact" 
          (click)="toggleCompact($event)"
          title="Toggle Compact Mode">
          <span class="item-icon">🎛️</span>
          <span class="item-label">Compact Density</span>
          <div class="toggle-switch" [class.on]="isCompact">
            <span class="switch-nob"></span>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .theme-switcher-container {
      position: relative;
      display: inline-block;
    }
    .trigger-btn {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
      width: 65px;
      height: 38px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
      position: relative;
      transition: var(--transition-smooth);
      padding: 0 10px;
      outline: none;
    }
    .trigger-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }
    .active-icon {
      font-size: 1.15rem;
      display: flex;
      align-items: center;
    }
    .compact-dot {
      width: 6px;
      height: 6px;
      background: var(--accent, #8b5cf6);
      border-radius: 50%;
      position: absolute;
      top: 6px;
      right: 24px;
      box-shadow: 0 0 6px var(--accent-glow);
    }
    .chevron-icon {
      width: 12px;
      height: 12px;
      color: var(--text-secondary);
      transition: transform 0.2s ease;
    }
    .chevron-icon.rotated {
      transform: rotate(180deg);
    }

    /* Dropdown panel */
    .theme-dropdown {
      position: absolute;
      top: calc(100% + 12px);
      right: 0;
      width: 200px;
      padding: 12px;
      border-radius: 12px;
      z-index: 1001;
      background: var(--glass-bg);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--glass-border);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
      animation: dropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes dropdownFade {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .dropdown-header {
      padding: 4px 6px 8px 6px;
      border-bottom: 1px solid var(--glass-border);
      margin-bottom: 8px;
    }
    .dropdown-header .title {
      font-family: var(--font-title);
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .theme-options {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .option-item {
      display: flex;
      align-items: center;
      width: 100%;
      background: transparent;
      border: none;
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: var(--transition-fast);
      color: var(--text-secondary);
      text-align: left;
      outline: none;
    }
    .option-item:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }
    .option-item.active {
      background: var(--primary-glow);
      color: var(--primary);
    }
    .item-icon {
      font-size: 1.1rem;
      margin-right: 10px;
      display: flex;
      align-items: center;
      width: 20px;
      justify-content: center;
    }
    .item-label {
      flex: 1;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .check-mark {
      font-size: 0.85rem;
      font-weight: bold;
      color: var(--primary);
    }
    .dropdown-divider {
      height: 1px;
      background: var(--glass-border);
      margin: 8px 0;
    }
    
    /* Toggle switch styling */
    .toggle-switch {
      width: 32px;
      height: 18px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid var(--glass-border);
      position: relative;
      transition: background 0.2s ease;
    }
    .toggle-switch.on {
      background: var(--accent, #8b5cf6);
      border-color: transparent;
    }
    .switch-nob {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #ffffff;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.2s ease;
    }
    .toggle-switch.on .switch-nob {
      transform: translateX(14px);
    }
  `]
})
export class ThemeSwitcherComponent {
  currentTheme: ColorTheme = 'light';
  isCompact = false;
  isDropdownOpen = false;

  constructor(
    private themeService: ThemeService,
    private eRef: ElementRef
  ) {
    this.themeService.activeTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
    this.themeService.compactMode$.subscribe(compact => {
      this.isCompact = compact;
    });
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  setTheme(theme: ColorTheme): void {
    this.themeService.setColorTheme(theme);
  }

  toggleCompact(event: Event): void {
    event.stopPropagation();
    this.themeService.setCompactMode(!this.isCompact);
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }
}
