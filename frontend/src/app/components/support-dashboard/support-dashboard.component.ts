import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupportTicketService } from '../../services/support-ticket.service';
import { SupportTicket } from '../../models/support.model';
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-support-dashboard',
  template: `
    <div class="container">
      <div class="header-row animate-fade-in">
        <h2 class="page-title gradient-text">Support Operations Center</h2>
        <span class="role-badge">{{ authService.getCurrentUser()?.role }} VIEW</span>
      </div>

      <!-- Main Layout Grid -->
      <div class="dashboard-grid">
        <!-- Tickets Area -->
        <div class="tickets-section glass-panel animate-slide-down">
          <!-- Tabs row -->
          <div class="tabs-row">
            <button class="tab-btn" [class.active]="activeTab === 'PENDING'" (click)="setTab('PENDING')">
              Pending review ({{ getCount('PENDING') }})
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'ESCALATED'" (click)="setTab('ESCALATED')">
              Escalated requests ({{ getCount('ESCALATED') }})
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'APPROVED'" (click)="setTab('APPROVED')">
              Approved ({{ getCount('APPROVED') }})
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'REJECTED'" (click)="setTab('REJECTED')">
              Rejected ({{ getCount('REJECTED') }})
            </button>
          </div>

          <div class="loading-state" *ngIf="loading">
            <div class="spinner"></div>
            <p>Fetching support tickets...</p>
          </div>

          <!-- Tickets Grid -->
          <div class="tickets-list" *ngIf="!loading && filteredTickets.length > 0">
            <div *ngFor="let t of filteredTickets" class="ticket-card glass-panel" [class.selected]="selectedTicket?.id === t.id" (click)="selectTicket(t)">
              <div class="ticket-header">
                <span class="ref-pnr">Booking Reference: <strong>{{ t.bookingReference }}</strong></span>
                <span class="priority-badge" [class]="t.priority.toLowerCase()">{{ t.priority }}</span>
              </div>
              <h3 class="ticket-subject">{{ t.subject }}</h3>
              <p class="ticket-desc">{{ t.description }}</p>
              
              <div class="ticket-footer">
                <span class="created-by">By: {{ t.createdBy }}</span>
                <span class="assigned">Assigned: {{ t.assignedAgent || 'Unassigned' }}</span>
              </div>

              <!-- Action Buttons -->
              <div class="ticket-actions" (click)="$event.stopPropagation()">
                <!-- Assign self -->
                <button 
                  class="btn btn-secondary btn-sm" 
                  *ngIf="!t.assignedAgent" 
                  (click)="assignSelf(t)">
                  Assign to me
                </button>

                <!-- Support agent can escalate, but cannot approve/reject -->
                <button 
                  class="btn btn-secondary btn-sm escalate-btn" 
                  *ngIf="t.status === 'PENDING' && isSupportAgent" 
                  (click)="escalate(t)">
                  Escalate to Admin
                </button>

                <!-- Admin can approve or reject -->
                <button 
                  class="btn btn-success btn-sm" 
                  *ngIf="(t.status === 'PENDING' || t.status === 'ESCALATED') && isAdmin" 
                  (click)="approve(t)">
                  Approve Request
                </button>
                <button 
                  class="btn btn-danger btn-sm" 
                  *ngIf="(t.status === 'PENDING' || t.status === 'ESCALATED') && isAdmin" 
                  (click)="reject(t)">
                  Reject Request
                </button>
              </div>
            </div>
          </div>

          <div class="empty-state" *ngIf="!loading && filteredTickets.length === 0">
            <p>No support tickets found in this category.</p>
          </div>
        </div>

        <!-- Chat / Booking detail panel -->
        <div class="details-section" *ngIf="selectedTicket">
          <!-- Mini Reservation Summary -->
          <div class="booking-card glass-panel animate-fade-in" *ngIf="selectedBooking">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3 class="section-title" style="margin-bottom: 0;">Itinerary Details</h3>
              <button class="btn btn-secondary btn-sm" (click)="editBookingDetails()">📝 Edit Details</button>
            </div>
            <div class="detail-row">
              <span class="lbl">Route:</span>
              <span class="val">{{ selectedBooking.flight.origin }} ➔ {{ selectedBooking.flight.destination }}</span>
            </div>
            <div class="detail-row">
              <span class="lbl">Flight Date:</span>
              <span class="val">{{ selectedBooking.flight.departureTime | date:'mediumDate' }}</span>
            </div>
            <div class="detail-row">
              <span class="lbl">Class & Seat:</span>
              <span class="val">{{ selectedBooking.seatNumber }} ({{ selectedBooking.seatClass }})</span>
            </div>
          </div>

          <!-- Realtime Chat panel -->
          <app-chat-panel [bookingRef]="selectedTicket.bookingReference"></app-chat-panel>
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
    .role-badge {
      padding: 6px 12px;
      font-weight: 700;
      background: var(--accent-glow);
      color: var(--accent);
      border-radius: 20px;
      font-size: 0.8rem;
      border: 1px solid var(--accent);
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 32px;
    }
    @media (max-width: 992px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
    .tickets-section {
      padding: var(--card-padding, 30px);
    }
    .tabs-row {
      display: flex;
      gap: 8px;
      border-bottom: 1.5px solid var(--glass-border);
      padding-bottom: 12px;
      margin-bottom: 24px;
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: none;
      padding: 8px 16px;
      font-family: var(--font-title);
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--text-secondary);
      cursor: pointer;
      border-radius: 8px;
      white-space: nowrap;
      transition: var(--transition-fast);
    }
    .tab-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }
    .tab-btn.active {
      background: var(--primary);
      color: #ffffff;
    }
    .tickets-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .ticket-card {
      padding: 20px;
      cursor: pointer;
      border: 1px solid var(--glass-border);
      transition: var(--transition-smooth);
    }
    .ticket-card:hover {
      transform: translateY(-2px);
      border-color: var(--primary);
    }
    .ticket-card.selected {
      border-color: var(--primary);
      box-shadow: 0 4px 20px var(--primary-glow);
      background: var(--primary-glow);
    }
    .ticket-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 0.85rem;
    }
    .ref-pnr {
      color: var(--text-secondary);
    }
    .priority-badge {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid transparent;
    }
    .priority-badge.low { background: var(--success-glow); color: var(--success); border-color: var(--success); }
    .priority-badge.medium { background: var(--primary-glow); color: var(--primary); border-color: var(--primary); }
    .priority-badge.high { background: var(--accent-glow); color: var(--accent); border-color: var(--accent); }
    .priority-badge.urgent { background: var(--danger-glow); color: var(--danger); border-color: var(--danger); }
    
    .ticket-subject {
      font-family: var(--font-title);
      font-size: 1.15rem;
      margin-bottom: 8px;
      color: var(--text-primary);
    }
    .ticket-desc {
      font-size: 0.9rem;
      color: var(--text-secondary);
      line-height: 1.5;
      margin-bottom: 12px;
    }
    .ticket-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-muted);
      border-bottom: 1px dashed var(--glass-border);
      padding-bottom: 10px;
      margin-bottom: 14px;
    }
    .ticket-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }
    .btn-success {
      background: var(--success);
      color: #fff;
    }
    .btn-danger {
      background: var(--danger);
      color: #fff;
    }
    .escalate-btn {
      border-color: var(--accent);
      color: var(--accent);
    }
    .escalate-btn:hover {
      background: var(--accent-glow);
    }
    .empty-state, .loading-state {
      text-align: center;
      padding: 40px 10px;
      color: var(--text-muted);
    }
    .spinner {
      margin: 0 auto 12px auto;
    }

    /* Details Section */
    .details-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
      align-self: start;
    }
    .booking-card {
      padding: 20px;
    }
    .booking-card .section-title {
      font-family: var(--font-title);
      font-size: 1.05rem;
      color: var(--primary);
      margin-bottom: 12px;
      border-bottom: 1px solid var(--glass-border);
      padding-bottom: 6px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.88rem;
      margin-bottom: 8px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-row .lbl {
      color: var(--text-muted);
    }
    .detail-row .val {
      font-weight: 600;
      color: var(--text-primary);
    }
  `]
})
export class SupportDashboardComponent implements OnInit {
  tickets: SupportTicket[] = [];
  filteredTickets: SupportTicket[] = [];
  selectedTicket: SupportTicket | null = null;
  selectedBooking: Booking | null = null;
  activeTab = 'PENDING';
  loading = false;

  constructor(
    private supportService: SupportTicketService,
    private bookingService: BookingService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    this.loading = true;
    this.supportService.getAllTickets().subscribe({
      next: (data) => {
        this.tickets = data;
        this.filterTickets();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load tickets', err);
        this.loading = false;
      }
    });
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.selectedTicket = null;
    this.selectedBooking = null;
    this.filterTickets();
  }

  filterTickets(): void {
    this.filteredTickets = this.tickets.filter(t => t.status === this.activeTab);
  }

  getCount(status: string): number {
    return this.tickets.filter(t => t.status === status).length;
  }

  selectTicket(t: SupportTicket): void {
    this.selectedTicket = t;
    this.selectedBooking = null;
    // Load booking details in parallel
    this.bookingService.getReservationByReference(t.bookingReference).subscribe({
      next: (res) => this.selectedBooking = res,
      error: (err) => console.error('Failed to load reservation details', err)
    });
  }

  assignSelf(t: SupportTicket): void {
    const username = this.authService.getCurrentUser()?.username || 'agent';
    this.supportService.assignTicket(t.id!, username).subscribe({
      next: (updated) => {
        t.assignedAgent = updated.assignedAgent;
        this.loadTickets();
      },
      error: (err) => console.error('Assign failed', err)
    });
  }

  escalate(t: SupportTicket): void {
    this.supportService.updateTicketStatus(t.id!, 'ESCALATED').subscribe({
      next: () => this.loadTickets(),
      error: (err) => console.error('Escalation failed', err)
    });
  }

  approve(t: SupportTicket): void {
    this.supportService.updateTicketStatus(t.id!, 'APPROVED').subscribe({
      next: () => {
        this.loadTickets();
        this.selectedTicket = null;
        this.selectedBooking = null;
        alert('Ticket approved! Booking parameters auto-updated.');
      },
      error: (err) => console.error('Approval failed', err)
    });
  }

  reject(t: SupportTicket): void {
    this.supportService.updateTicketStatus(t.id!, 'REJECTED').subscribe({
      next: () => {
        this.loadTickets();
        this.selectedTicket = null;
        this.selectedBooking = null;
        alert('Ticket rejected.');
      },
      error: (err) => console.error('Rejection failed', err)
    });
  }

  get isSupportAgent(): boolean {
    return this.authService.getCurrentUser()?.role === 'SUPPORT_AGENT';
  }

  editBookingDetails(): void {
    if (this.selectedBooking) {
      this.router.navigate(['/booking/modify', this.selectedBooking.bookingReference]);
    }
  }

  get isAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'ADMIN';
  }
}
