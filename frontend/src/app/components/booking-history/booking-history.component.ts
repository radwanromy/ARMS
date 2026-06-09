import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-booking-history',
  template: `
    <div class="container">
      <div class="header-section">
        <h2 class="title gradient-text">My Bookings</h2>
        <p class="subtitle">Manage and review your active flight reservations and boarding passes.</p>
      </div>

      <div class="alert alert-success" *ngIf="successMessage">
        {{ successMessage }}
      </div>
      <div class="alert alert-danger" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>

      <div class="loading-state" *ngIf="loading">
        <div class="spinner large-spinner"></div>
        <p>Loading your flight bookings...</p>
      </div>

      <div class="empty-state glass-panel" *ngIf="!loading && bookings.length === 0">
        <div class="empty-icon">&#128196;</div>
        <h4>No Bookings Found</h4>
        <p>You haven't made any flight reservations yet. Start searching to book your first flight!</p>
        <button class="btn btn-primary" (click)="navigate('/search')">Search Flights</button>
      </div>

      <div class="bookings-grid" *ngIf="!loading && bookings.length > 0">
        <div class="booking-card glass-panel" *ngFor="let booking of bookings">
          <div class="card-header">
            <div class="header-left">
              <span class="ref-label">Booking Reference</span>
              <span class="ref-value">{{ booking.bookingReference }}</span>
            </div>
            
            <span 
              class="status-badge" 
              [class.confirmed]="booking.status === 'CONFIRMED'"
              [class.pending]="booking.status === 'PENDING'"
              [class.cancelled]="booking.status === 'CANCELLED'">
              {{ booking.status }}
            </span>
          </div>

          <div class="card-body">
            <!-- Route -->
            <div class="route-block">
              <div class="airport">
                <span class="code">{{ booking.flight.origin }}</span>
                <span class="time">{{ formatTime(booking.flight.departureTime) }}</span>
              </div>
              <div class="flight-path">
                <span class="flight-no">{{ booking.flight.flightNumber }}</span>
                <div class="line">
                  <span class="line-dot"></span>
                  <span class="plane">&#9992;</span>
                  <span class="line-dot"></span>
                </div>
                <span class="airline">{{ booking.flight.airline }}</span>
              </div>
              <div class="airport">
                <span class="code">{{ booking.flight.destination }}</span>
                <span class="time">{{ formatTime(booking.flight.arrivalTime) }}</span>
              </div>
            </div>

            <!-- Meta details -->
            <div class="meta-details">
              <div class="meta-item">
                <span class="lbl">Departure Date</span>
                <span class="val">{{ formatDate(booking.flight.departureTime) }}</span>
              </div>
              <div class="meta-item">
                <span class="lbl">Seat</span>
                <span class="val seat-badge">{{ booking.seatNumber }} ({{ booking.seatClass }})</span>
              </div>
              <div class="meta-item">
                <span class="lbl">Amount Paid</span>
                <span class="val price-val">\${{ booking.totalPrice }}</span>
              </div>
            </div>

            <!-- Passengers list -->
            <div class="passenger-list" *ngIf="booking.passengers && booking.passengers.length > 0">
              <span class="passenger-lbl">Travelers:</span>
              <div class="passengers-tags">
                <span class="passenger-tag" *ngFor="let p of booking.passengers">
                  &#128100; {{ p.fullName }}
                </span>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-actions">
              <!-- Cancel Booking -->
              <button 
                class="btn btn-secondary btn-danger" 
                *ngIf="booking.status !== 'CANCELLED'" 
                (click)="cancelBooking(booking.bookingReference)">
                Cancel Booking
              </button>
              
              <!-- Download Boarding Pass -->
              <button 
                class="btn btn-secondary" 
                *ngIf="booking.status === 'CONFIRMED'" 
                (click)="downloadTicket(booking)">
                Download Boarding Pass
              </button>

              <!-- Pay Now link -->
              <button 
                class="btn btn-primary" 
                *ngIf="booking.status === 'PENDING'" 
                (click)="navigate('/payment/' + booking.bookingReference)">
                Complete Payment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .header-section {
      margin-bottom: 32px;
    }
    .title {
      font-size: 2.2rem;
      margin-bottom: 8px;
    }
    .subtitle {
      color: var(--text-secondary);
      font-size: 1rem;
    }
    .bookings-grid {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    .booking-card {
      display: flex;
      flex-direction: column;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--glass-border);
      background: rgba(255,255,255,0.01);
      border-radius: 16px 16px 0 0;
    }
    .header-left {
      display: flex;
      flex-direction: column;
    }
    .ref-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .ref-value {
      font-family: var(--font-title);
      font-size: 1.25rem;
      font-weight: 700;
      color: #3b82f6;
    }
    .status-badge {
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-badge.confirmed {
      background: var(--success-glow);
      color: var(--success);
      border: 1px solid var(--success);
    }
    .status-badge.pending {
      background: rgba(245, 158, 11, 0.15);
      color: var(--warning);
      border: 1px solid var(--warning);
    }
    .status-badge.cancelled {
      background: var(--danger-glow);
      color: var(--danger);
      border: 1px solid var(--danger);
    }
    
    .card-body {
      padding: 24px;
    }
    .route-block {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .route-block .airport {
      display: flex;
      flex-direction: column;
    }
    .route-block .airport .code {
      font-size: 1.8rem;
      font-weight: 800;
      font-family: var(--font-title);
    }
    .route-block .airport .time {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .flight-path {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 300px;
    }
    .flight-no {
      font-weight: 700;
      font-size: 0.95rem;
    }
    .airline {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .flight-path .line {
      display: flex;
      align-items: center;
      width: 100%;
    }
    .flight-path .line-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-muted);
    }
    .flight-path .plane {
      flex: 1;
      text-align: center;
      font-size: 1rem;
      color: var(--primary);
      transform: rotate(90deg);
      position: relative;
    }
    .flight-path .plane::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 1px;
      background: var(--glass-border);
      z-index: -1;
    }
    
    .meta-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      background: rgba(15, 23, 42, 0.3);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--glass-border);
      margin-bottom: 20px;
    }
    .meta-item {
      display: flex;
      flex-direction: column;
    }
    .meta-item .lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .meta-item .val {
      font-weight: 600;
      font-size: 0.95rem;
    }
    .seat-badge {
      background: var(--primary-glow);
      border: 1px solid var(--primary);
      padding: 2px 8px;
      border-radius: 4px;
      color: #3b82f6;
      display: inline-block;
      width: fit-content;
    }
    .price-val {
      color: var(--success);
      font-weight: 700;
    }
    
    .passenger-list {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .passenger-lbl {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 600;
    }
    .passengers-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .passenger-tag {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--glass-border);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
    }

    .card-footer {
      padding: 20px 24px;
      border-top: 1px solid var(--glass-border);
      background: rgba(255,255,255,0.005);
      border-radius: 0 0 16px 16px;
    }
    .footer-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
    }
    .btn-danger {
      border-color: rgba(239, 68, 68, 0.4);
      color: #fca5a5;
    }
    .btn-danger:hover {
      background: var(--danger-glow);
      border-color: var(--danger);
    }
    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.9rem;
      margin-bottom: 24px;
      border: 1px solid transparent;
    }
    .alert-danger {
      background: var(--danger-glow);
      border-color: var(--danger);
      color: #fca5a5;
    }
    .alert-success {
      background: var(--success-glow);
      border-color: var(--success);
      color: #a7f3d0;
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px;
      gap: 16px;
      color: var(--text-secondary);
    }
    .large-spinner {
      width: 48px;
      height: 48px;
      border-width: 4px;
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 60px 20px;
    }
    .empty-icon {
      font-size: 4rem;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    .empty-state h4 {
      font-family: var(--font-title);
      font-size: 1.4rem;
      margin-bottom: 8px;
    }
    .empty-state p {
      color: var(--text-secondary);
      max-width: 400px;
      margin-bottom: 24px;
    }
  `]
})
export class BookingHistoryComponent implements OnInit {
  bookings: Booking[] = [];
  loading = true;
  successMessage = '';
  errorMessage = '';

  constructor(
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.bookingService.getUserBookings().subscribe({
      next: (data) => {
        this.bookings = data.reverse(); // Show newest first
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bookings', error);
        this.errorMessage = 'Failed to load booking history.';
        this.loading = false;
      }
    });
  }

  cancelBooking(bookingRef: string): void {
    if (confirm('Are you sure you want to cancel this flight booking? This will release your reserved seats.')) {
      this.bookingService.cancelBooking(bookingRef).subscribe({
        next: () => {
          this.successMessage = 'Booking cancelled successfully. Reserved seats released.';
          this.loadBookings();
          setTimeout(() => this.successMessage = '', 4000);
        },
        error: (error) => {
          console.error('Cancellation failed', error);
          this.errorMessage = error.error?.message || 'Cancellation failed. Please try again.';
          setTimeout(() => this.errorMessage = '', 4000);
        }
      });
    }
  }

  downloadTicket(booking: Booking): void {
    this.bookingService.generateTicket(booking.bookingReference)
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${booking.bookingReference}.html`;
        a.click();
      });
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  // Helpers
  formatTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  formatDate(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
}
