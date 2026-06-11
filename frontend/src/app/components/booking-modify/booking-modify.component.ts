import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { SupportTicketService } from '../../services/support-ticket.service';
import { Booking } from '../../models/booking.model';
import { BookingAuditLog, SupportTicket } from '../../models/support.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-booking-modify',
  template: `
    <div class="container">
      <div class="header-row animate-fade-in">
        <button class="btn btn-secondary btn-sm" (click)="goBack()">&larr; Back to History</button>
        <h2 class="page-title gradient-text">Manage Reservation</h2>
      </div>

      <div class="modify-grid" *ngIf="booking">
        <!-- Main Form / Lock details -->
        <div class="form-section glass-panel animate-slide-down">
          <!-- Status Alerts -->
          <div class="alert alert-warning" *ngIf="isCompleted && !(authService.isAdmin() || authService.getCurrentUser()?.role === 'SUPPORT_AGENT')">
            <strong>⚠️ Locked Status:</strong> This booking has been completed and can no longer be modified directly. Please use the Support Ticket form below to request corrections.
          </div>

          <div class="booking-summary-row">
            <div>
              <span class="lbl">PNR Reference</span>
              <span class="val highlight">{{ booking.bookingReference }}</span>
            </div>
            <div>
              <span class="lbl">Flight Details</span>
              <span class="val">{{ booking.flight.airline }} ({{ booking.flight.flightNumber }})</span>
            </div>
            <div>
              <span class="lbl">Status</span>
              <span class="badge" [class]="booking.status.toLowerCase()">{{ booking.status }}</span>
            </div>
          </div>

          <!-- Modification Form -->
          <form [formGroup]="modifyForm" (ngSubmit)="onSubmit()" *ngIf="!isCompleted || authService.isAdmin() || authService.getCurrentUser()?.role === 'SUPPORT_AGENT'">
            <!-- Contact Info -->
            <h3 class="section-title">Contact & Communication</h3>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label" for="contactEmail">Email Address</label>
                <input type="email" id="contactEmail" formControlName="contactEmail" class="form-input">
              </div>
              <div class="form-group">
                <label class="form-label" for="contactPhone">Phone Number</label>
                <input type="text" id="contactPhone" formControlName="contactPhone" class="form-input">
              </div>
            </div>

            <!-- Preferences -->
            <h3 class="section-title">Flight Preferences & Seat</h3>
            <div class="form-grid-3">
              <div class="form-group">
                <label class="form-label" for="seatNumber">Seat Number</label>
                <select id="seatNumber" formControlName="seatNumber" class="form-input">
                  <option *ngFor="let s of getAvailableSeats(booking.seatClass, booking.seatNumber)" [value]="s">
                    {{ s }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="mealPreference">Meal Preference</label>
                <select id="mealPreference" formControlName="mealPreference" class="form-input">
                  <option value="NONE">Standard Meal</option>
                  <option value="VEGETARIAN">Vegetarian (VGML)</option>
                  <option value="HALAL">Halal (MOML)</option>
                  <option value="KOSHER">Kosher (KSML)</option>
                  <option value="DIABETIC">Diabetic (DBML)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" for="specialAssistance">Special Assistance</label>
                <select id="specialAssistance" formControlName="specialAssistance" class="form-input">
                  <option value="NONE">None</option>
                  <option value="WHEELCHAIR">Wheelchair Access</option>
                  <option value="VISUALLY_IMPAIRED">Visually Impaired Assistance</option>
                  <option value="HEARING_IMPAIRED">Hearing Impaired Assistance</option>
                </select>
              </div>
            </div>

            <!-- Passengers Array -->
            <h3 class="section-title">Passenger Information</h3>
            <div formArrayName="passengers">
              <div *ngFor="let passForm of passengerControls.controls; let idx = index" [formGroupName]="idx" class="passenger-card glass-panel">
                <h4 class="pass-num">Passenger #{{ idx + 1 }}</h4>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Full Name</label>
                    <input type="text" formControlName="fullName" class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Passport Number</label>
                    <input type="text" formControlName="passportNumber" class="form-input">
                  </div>
                </div>
                <div class="form-grid">
                  <div class="form-group">
                    <label class="form-label">Nationality</label>
                    <input type="text" formControlName="nationality" class="form-input">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Date of Birth</label>
                    <input type="date" formControlName="dateOfBirth" class="form-input">
                  </div>
                </div>
              </div>
            </div>

            <!-- Reason for Modification (Only if booking is completed and user is admin/support) -->
            <div class="form-group" *ngIf="isCompleted && (authService.isAdmin() || authService.getCurrentUser()?.role === 'SUPPORT_AGENT')" style="margin-top: 15px; margin-bottom: 15px;">
              <label class="form-label text-warning" style="color:#f59e0b" for="modificationReason">Reason for Modification (Mandatory for Completed Booking)</label>
              <textarea id="modificationReason" formControlName="modificationReason" class="form-input" rows="3" placeholder="State reason for changes..."></textarea>
            </div>

            <!-- Action buttons -->
            <div class="action-row">
              <button type="submit" class="btn btn-primary" [disabled]="loading || modifyForm.invalid">
                <span class="spinner" *ngIf="loading"></span>
                <span>Save Changes</span>
              </button>
            </div>
          </form>

          <!-- Request Change Form (Only for Completed Booking) -->
          <div class="request-change-section" *ngIf="isCompleted && !(authService.isAdmin() || authService.getCurrentUser()?.role === 'SUPPORT_AGENT')">
            <h3 class="section-title">Submit Support Ticket Request</h3>
            <form [formGroup]="supportForm" (ngSubmit)="submitSupportTicket()">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="requestType">Request Type</label>
                  <select id="requestType" formControlName="requestType" class="form-input">
                    <option value="NAME_CORRECTION">Name Correction</option>
                    <option value="REFUND_REQUEST">Refund Request</option>
                    <option value="FLIGHT_ISSUE">Flight Issue / Date Change</option>
                    <option value="SEAT_ISSUE">Seat Allocation Issue</option>
                    <option value="OTHER">Other Assistance</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="priority">Priority</label>
                  <select id="priority" formControlName="priority" class="form-input">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label" for="subject">Subject</label>
                <input type="text" id="subject" formControlName="subject" class="form-input" placeholder="Summary of request">
              </div>

              <div class="form-group">
                <label class="form-label" for="description">Detailed Description</label>
                <textarea id="description" formControlName="description" class="form-input" rows="4" placeholder="Explain the corrections required..."></textarea>
              </div>

              <div class="action-row">
                <button type="submit" class="btn btn-primary" [disabled]="loading || supportForm.invalid">
                  <span class="spinner" *ngIf="loading"></span>
                  <span>Submit Support Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Timeline / Audit Logs -->
        <div class="timeline-section glass-panel animate-fade-in">
          <h3 class="timeline-title">Change History Timeline</h3>
          <div class="timeline" *ngIf="auditLogs.length > 0; else noLogs">
            <div class="timeline-item" *ngFor="let log of auditLogs">
              <div class="timeline-badge"></div>
              <div class="timeline-content">
                <span class="time">{{ formatLogDate(log.changeTimestamp) }}</span>
                <span class="user">By: {{ log.changedBy }}</span>
                <p class="desc">{{ log.description }}</p>
              </div>
            </div>
          </div>
          <ng-template #noLogs>
            <div class="empty-timeline">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="empty-icon">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <p>No changes recorded yet. This booking remains in its original state.</p>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xl, 32px);
    }
    .page-title {
      font-size: var(--font-size-title, 2.2rem);
    }
    .modify-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 32px;
    }
    @media (max-width: 992px) {
      .modify-grid {
        grid-template-columns: 1fr;
      }
    }
    .form-section {
      padding: var(--card-padding, 40px);
    }
    .booking-summary-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--glass-border);
      padding-bottom: 20px;
      margin-bottom: 30px;
      gap: 16px;
      flex-wrap: wrap;
    }
    .booking-summary-row .lbl {
      display: block;
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }
    .booking-summary-row .val {
      font-family: var(--font-title);
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .booking-summary-row .val.highlight {
      color: var(--primary);
    }
    .section-title {
      font-family: var(--font-title);
      font-size: 1.25rem;
      color: var(--primary);
      margin: 24px 0 16px 0;
      border-bottom: 1.5px solid var(--glass-border);
      padding-bottom: 8px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .form-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 576px) {
      .form-grid, .form-grid-3 {
        grid-template-columns: 1fr;
      }
    }
    .passenger-card {
      padding: var(--spacing-lg, 24px);
      margin-bottom: 20px;
      position: relative;
    }
    .pass-num {
      font-family: var(--font-title);
      color: var(--text-muted);
      margin-bottom: 12px;
      text-transform: uppercase;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
    }
    .action-row {
      display: flex;
      justify-content: flex-end;
      margin-top: 30px;
    }
    .alert {
      padding: 16px;
      border-radius: 8px;
      font-size: 0.95rem;
      line-height: 1.5;
      margin-bottom: 24px;
      border: 1px solid transparent;
    }
    .alert-warning {
      background: var(--danger-glow);
      border-color: var(--danger);
      color: var(--text-primary);
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: var(--primary-glow);
      color: var(--primary);
    }
    .badge.completed {
      background: var(--success-glow);
      color: var(--success);
    }
    .badge.cancelled {
      background: var(--danger-glow);
      color: var(--danger);
    }

    /* Timeline Styling */
    .timeline-section {
      padding: 30px 24px;
      align-self: start;
    }
    .timeline-title {
      font-family: var(--font-title);
      font-size: 1.35rem;
      margin-bottom: 24px;
      color: var(--text-primary);
    }
    .timeline {
      position: relative;
      padding-left: 24px;
      border-left: 2px solid var(--glass-border);
    }
    .timeline-item {
      position: relative;
      margin-bottom: 24px;
    }
    .timeline-item:last-child {
      margin-bottom: 0;
    }
    .timeline-badge {
      position: absolute;
      top: 4px;
      left: -32px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--primary);
      border: 3px solid var(--bg-primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .timeline-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .timeline-content .time {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .timeline-content .user {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .timeline-content .desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    .empty-timeline {
      text-align: center;
      padding: 40px 10px;
      color: var(--text-muted);
    }
    .empty-icon {
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      opacity: 0.5;
    }
  `]
})
export class BookingModifyComponent implements OnInit {
  booking!: Booking;
  bookingRef!: string;
  modifyForm!: FormGroup;
  supportForm!: FormGroup;
  isCompleted = false;
  loading = false;
  auditLogs: BookingAuditLog[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private bookingService: BookingService,
    private supportService: SupportTicketService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.bookingRef = this.route.snapshot.paramMap.get('bookingRef') || '';
    this.loadBooking();
    this.initSupportForm();
  }

  loadBooking(): void {
    this.loading = true;
    this.bookingService.getReservationByReference(this.bookingRef).subscribe({
      next: (data) => {
        this.booking = data;
        this.isCompleted = data.status === 'COMPLETED';
        this.initModifyForm(data);
        this.loadAuditLogs();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load booking details', err);
        this.loading = false;
      }
    });
  }

  loadAuditLogs(): void {
    this.supportService.getBookingAuditLogs(this.bookingRef).subscribe({
      next: (logs) => this.auditLogs = logs,
      error: (err) => console.error('Failed to load audit logs', err)
    });
  }

  initModifyForm(b: Booking): void {
    this.modifyForm = this.fb.group({
      seatNumber: [b.seatNumber, Validators.required],
      mealPreference: [b.mealPreference || 'NONE'],
      specialAssistance: [b.specialAssistance || 'NONE'],
      contactEmail: [b.contactEmail || b.user.email, [Validators.required, Validators.email]],
      contactPhone: [b.contactPhone || b.user.phoneNumber || '', Validators.required],
      passengers: this.fb.array([]),
      modificationReason: ['']
    });

    // Populate passengers
    if (b.passengers && b.passengers.length > 0) {
      b.passengers.forEach(p => {
        this.passengerControls.push(this.fb.group({
          fullName: [p.fullName, Validators.required],
          passportNumber: [p.passportNumber || '', Validators.required],
          nationality: [p.nationality || '', Validators.required],
          dateOfBirth: [p.dateOfBirth || '', Validators.required]
        }));
      });
    }
  }

  initSupportForm(): void {
    this.supportForm = this.fb.group({
      bookingReference: [this.bookingRef],
      requestType: ['NAME_CORRECTION', Validators.required],
      subject: ['', Validators.required],
      description: ['', Validators.required],
      priority: ['MEDIUM', Validators.required]
    });
  }

  get passengerControls() {
    return this.modifyForm.get('passengers') as FormArray;
  }

  onSubmit(): void {
    if (this.modifyForm.invalid) return;

    const formData = this.modifyForm.value;

    if (this.isCompleted && (this.authService.isAdmin() || this.authService.getCurrentUser()?.role === 'SUPPORT_AGENT')) {
      if (!formData.modificationReason || !formData.modificationReason.trim()) {
        alert('A modification reason is strictly required for completed bookings.');
        return;
      }
    }

    this.loading = true;

    this.supportService.modifyBooking(this.bookingRef, formData).subscribe({
      next: (updatedBooking) => {
        this.booking = updatedBooking;
        this.isCompleted = updatedBooking.status === 'COMPLETED';
        this.initModifyForm(updatedBooking);
        this.loadAuditLogs();
        this.loading = false;
        alert('Booking successfully modified!');
      },
      error: (err) => {
        console.error('Failed to modify booking', err);
        this.loading = false;
        alert(err.error?.message || 'Failed to modify booking details.');
      }
    });
  }

  submitSupportTicket(): void {
    if (this.supportForm.invalid) return;

    this.loading = true;
    const ticketData: SupportTicket = this.supportForm.value;

    this.supportService.createTicket(ticketData).subscribe({
      next: () => {
        this.loading = false;
        alert('Your support request has been submitted successfully. A support agent will review and get back to you shortly.');
        this.supportForm.reset({
          bookingReference: this.bookingRef,
          requestType: 'NAME_CORRECTION',
          priority: 'MEDIUM'
        });
        this.loadAuditLogs();
      },
      error: (err) => {
        console.error('Failed to submit support ticket', err);
        this.loading = false;
        alert('Failed to submit support request.');
      }
    });
  }

  getAvailableSeats(seatClass: string, currentSeat: string): string[] {
    const available: string[] = [];
    const rows = 30;
    const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
    const targetClass = (seatClass || 'ECONOMY').toUpperCase();

    for (let r = 1; r <= rows; r++) {
      const isBusiness = r <= 5;
      const rowClass = isBusiness ? 'BUSINESS' : 'ECONOMY';
      if (rowClass !== targetClass) continue;

      for (const col of columns) {
        const seatStr = `${col}${r}`;
        if (seatStr === currentSeat || this.isSeatAvailableMock(r, col)) {
          available.push(seatStr);
        }
      }
    }
    return available;
  }

  isSeatAvailableMock(row: number, col: string): boolean {
    const seatHash = (row * 3) + col.charCodeAt(0);
    return seatHash % 5 !== 0 && seatHash % 7 !== 0;
  }

  formatLogDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatLogDateText(dateStr?: string): string {
    return this.formatLogDate(dateStr);
  }

  goBack(): void {
    this.router.navigate(['/my-bookings']);
  }
}
