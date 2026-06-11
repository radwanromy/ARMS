import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  template: `
    <div class="profile-wrapper">
      <div class="profile-card glass-panel animate-fade-in">
        <h2 class="profile-title">My Profile</h2>
        <p class="profile-subtitle">Update your personal details and travel documents</p>

        <div class="alert alert-success" *ngIf="successMessage">
          {{ successMessage }}
        </div>
        <div class="alert alert-danger" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>

        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" *ngIf="!initialLoading; else loadingTpl">
          <!-- Profile Picture Section -->
          <div class="avatar-section">
            <div class="avatar-container">
              <img [src]="profileForm.value.profilePicture || defaultAvatar" 
                   alt="Avatar" class="avatar-img">
              <div class="avatar-edit-badge">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="camera-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
              </div>
              <input type="file" (change)="onFileChange($event)" accept="image/*" class="file-input">
            </div>
            <p class="avatar-help">Click the image or camera icon to upload a picture</p>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" [value]="user?.username" class="form-input disabled-input" readonly>
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="text" [value]="user?.email" class="form-input disabled-input" readonly>
            </div>

            <div class="form-group">
              <label class="form-label" for="firstName">First Name</label>
              <input 
                type="text" 
                id="firstName" 
                formControlName="firstName" 
                class="form-input" 
                placeholder="First name"
                [class.error-border]="submitted && f['firstName'].errors">
              <div *ngIf="submitted && f['firstName'].errors" class="error-msg">
                First name is required
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName" 
                formControlName="lastName" 
                class="form-input" 
                placeholder="Last name"
                [class.error-border]="submitted && f['lastName'].errors">
              <div *ngIf="submitted && f['lastName'].errors" class="error-msg">
                Last name is required
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="phoneNumber">Phone Number</label>
              <input 
                type="text" 
                id="phoneNumber" 
                formControlName="phoneNumber" 
                class="form-input" 
                placeholder="Phone number">
            </div>

            <div class="form-group">
              <label class="form-label" for="passportNumber">Passport Number</label>
              <input 
                type="text" 
                id="passportNumber" 
                formControlName="passportNumber" 
                class="form-input" 
                placeholder="Passport number">
            </div>

            <div class="form-group">
              <label class="form-label" for="nationality">Nationality</label>
              <input 
                type="text" 
                id="nationality" 
                formControlName="nationality" 
                class="form-input" 
                placeholder="Nationality">
            </div>

            <div class="form-group">
              <label class="form-label" for="dateOfBirth">Date of Birth</label>
              <input 
                type="date" 
                id="dateOfBirth" 
                formControlName="dateOfBirth" 
                class="form-input">
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="saving">
            <span class="spinner" *ngIf="saving"></span>
            <span *ngIf="!saving">Save Changes</span>
          </button>
        </form>

        <ng-template #loadingTpl>
          <div class="loading-container">
            <div class="spinner-large"></div>
            <p>Loading profile details...</p>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .profile-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 120px);
      padding: 40px 20px;
    }
    .profile-card {
      width: 100%;
      max-width: 680px;
      padding: 40px;
    }
    .profile-title {
      font-family: var(--font-title);
      font-size: 2rem;
      font-weight: 700;
      text-align: center;
      margin-bottom: 8px;
    }
    .profile-subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
      text-align: center;
      margin-bottom: 32px;
    }
    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 32px;
    }
    .avatar-container {
      position: relative;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 3px solid var(--primary);
      cursor: pointer;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      background: rgba(255, 255, 255, 0.05);
    }
    .avatar-edit-badge {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary);
      border: 2px solid var(--bg-secondary);
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
      transition: var(--transition-smooth);
    }
    .avatar-container:hover .avatar-edit-badge {
      transform: scale(1.1);
      background: var(--secondary);
    }
    .camera-icon {
      width: 18px;
      height: 18px;
    }
    .file-input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
      z-index: 10;
    }
    .avatar-help {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-top: 8px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 32px;
    }
    @media (max-width: 576px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
    }
    .disabled-input {
      background: rgba(255, 255, 255, 0.05) !important;
      border-color: rgba(255, 255, 255, 0.1) !important;
      color: var(--text-secondary) !important;
      cursor: not-allowed;
    }
    .btn-block {
      width: 100%;
      margin-top: 10px;
      gap: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .error-border {
      border-color: var(--danger) !important;
    }
    .error-msg {
      color: var(--danger);
      font-size: 0.8rem;
      margin-top: 6px;
    }
    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      margin-bottom: 24px;
      border: 1px solid transparent;
      text-align: center;
    }
    .alert-success {
      background: rgba(16, 185, 129, 0.15);
      border-color: #10b981;
      color: #a7f3d0;
    }
    .alert-danger {
      background: var(--danger-glow);
      border-color: var(--danger);
      color: #fca5a5;
    }
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0;
      color: var(--text-secondary);
    }
    .spinner-large {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.1);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  user: User | null = null;
  initialLoading = true;
  saving = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';
  defaultAvatar = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.profileForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: [''],
      profilePicture: [''],
      passportNumber: [''],
      nationality: [''],
      dateOfBirth: ['']
    });

    this.loadProfile();
  }

  get f() { return this.profileForm.controls; }

  loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (profile: User) => {
        this.user = profile;
        this.profileForm.patchValue({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          phoneNumber: profile.phoneNumber || '',
          profilePicture: profile.profilePicture || '',
          passportNumber: profile.passportNumber || '',
          nationality: profile.nationality || '',
          dateOfBirth: profile.dateOfBirth || ''
        });
        this.initialLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load profile details.';
        this.initialLoading = false;
      }
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.profileForm.patchValue({
          profilePicture: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';

    if (this.profileForm.invalid) {
      return;
    }

    this.saving = true;
    const updatedUser: User = {
      ...this.user,
      ...this.profileForm.value
    };

    this.authService.updateProfile(updatedUser).subscribe({
      next: (profile: User) => {
        this.user = profile;
        this.successMessage = 'Profile updated successfully!';
        this.saving = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update profile.';
        this.saving = false;
      }
    });
  }
}
