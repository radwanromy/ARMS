import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SupportGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isLoggedIn()) {
      const role = this.authService.getCurrentUser()?.role;
      if (role === 'SUPPORT_AGENT' || role === 'ADMIN') {
        return true;
      }
    }

    this.router.navigate(['/search']);
    return false;
  }
}
