import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export type ColorTheme = 'light' | 'mid' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private activeThemeSubject = new BehaviorSubject<ColorTheme>('light');
  public activeTheme$: Observable<ColorTheme> = this.activeThemeSubject.asObservable();

  private compactModeSubject = new BehaviorSubject<boolean>(false);
  public compactMode$: Observable<boolean> = this.compactModeSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // 1. Check local storage
    const savedTheme = localStorage.getItem('volant-theme') as ColorTheme;
    const savedCompact = localStorage.getItem('volant-compact') === 'true';

    // 2. Check user profile config (if logged in)
    const currentUser = this.authService.getCurrentUser();
    const userTheme = currentUser?.theme as ColorTheme;

    const finalTheme = userTheme || savedTheme || 'light';
    const finalCompact = savedCompact || false;

    this.setColorTheme(finalTheme, false);
    this.setCompactMode(finalCompact, false);
  }

  public setColorTheme(theme: ColorTheme, persist = true): void {
    this.activeThemeSubject.next(theme);
    localStorage.setItem('volant-theme', theme);

    // Apply classes to body
    const body = document.body;
    body.classList.remove('theme-mid', 'theme-dark');
    
    if (theme === 'mid') {
      body.classList.add('theme-mid');
    } else if (theme === 'dark') {
      body.classList.add('theme-dark');
    }

    if (persist && this.authService.isLoggedIn()) {
      this.syncThemeWithBackend(theme);
    }
  }

  public setCompactMode(isCompact: boolean, persist = true): void {
    this.compactModeSubject.next(isCompact);
    localStorage.setItem('volant-compact', isCompact ? 'true' : 'false');

    const body = document.body;
    if (isCompact) {
      body.classList.add('theme-compact');
    } else {
      body.classList.remove('theme-compact');
    }
  }

  public getCurrentTheme(): ColorTheme {
    return this.activeThemeSubject.value;
  }

  public isCompact(): boolean {
    return this.compactModeSubject.value;
  }

  private syncThemeWithBackend(theme: ColorTheme): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      user.theme = theme;
      // Trigger a profile update on the backend
      this.http.put('http://localhost:8080/api/auth/profile', user).subscribe({
        next: (updatedUser: any) => {
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        },
        error: (err) => console.error('Failed to sync theme with profile database', err)
      });
    }
  }
}
