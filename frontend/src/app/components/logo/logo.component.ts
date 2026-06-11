import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { BRANDING_CONFIG } from '../../core/config/branding.config';

@Component({
  selector: 'app-logo',
  template: `
    <div class="logo-wrapper" [class]="variant" [style.height]="size ? size + 'px' : 'var(--logo-height)'" (click)="navigateHome()">
      <img [src]="logoPath" alt="Volant Airlines Logo" class="logo-img" [style.height]="size ? size + 'px' : 'var(--logo-height)'">
    </div>
  `,
  styles: [`
    .logo-wrapper {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      user-select: none;
      transition: var(--transition-smooth);
    }
    .logo-wrapper:hover {
      transform: scale(1.03);
    }
    .logo-img {
      width: auto;
      object-fit: contain;
      /* Blends the white background of the image out, making it transparent */
      mix-blend-mode: multiply;
      display: block;
    }

    /* Variant adjustments */
    .navbar {
      filter: drop-shadow(0 2px 4px rgba(37, 99, 235, 0.06));
    }
    .hero {
      transform: scale(1.1);
    }
    .hero:hover {
      transform: scale(1.13);
    }
    .footer {
      opacity: 0.9;
    }
  `]
})
export class LogoComponent {
  @Input() size: number | null = null;
  @Input() variant: 'navbar' | 'hero' | 'footer' | 'standard' = 'standard';

  logoPath = BRANDING_CONFIG.logoPath;

  constructor(private router: Router) {}

  navigateHome(): void {
    this.router.navigate(['/search']);
  }
}
