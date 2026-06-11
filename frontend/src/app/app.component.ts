import { Component, OnInit } from '@angular/core';
import { BRANDING_CONFIG } from './core/config/branding.config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'frontend';
  branding = BRANDING_CONFIG;
  showSplash = true;
  isFading = false;

  ngOnInit(): void {
    // Simulate loading completion and animate splash screen fade-out
    setTimeout(() => {
      this.isFading = true;
      setTimeout(() => {
        this.showSplash = false;
      }, 500); // Duration of fade-out animation
    }, 1500); // Keep splash visible for 1.5 seconds initially
  }
}
