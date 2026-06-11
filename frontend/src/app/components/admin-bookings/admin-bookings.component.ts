import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { SupportTicketService } from '../../services/support-ticket.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-admin-bookings',
  template: `
    <div class="container">
      <div class="admin-header animate-fade-in">
        <div class="admin-header-row">
          <div>
            <h2 class="admin-title gradient-text">Admin Booking Center</h2>
            <p class="admin-subtitle">Monitor flights passenger reservations, status confirmations, and revenue statistics</p>
          </div>
          <app-logo [size]="55" variant="standard"></app-logo>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid animate-fade-in" *ngIf="bookings.length > 0">
        <div class="stat-card glass-panel glow-blue">
          <span class="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z" />
            </svg>
          </span>
          <div class="stat-content">
            <span class="stat-lbl">Total Bookings</span>
            <span class="stat-val">{{ bookings.length }}</span>
          </div>
        </div>

        <div class="stat-card glass-panel glow-green">
          <span class="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </span>
          <div class="stat-content">
            <span class="stat-lbl">Confirmed Bookings</span>
            <span class="stat-val text-success">{{ getCount('CONFIRMED') }}</span>
          </div>
        </div>

        <div class="stat-card glass-panel glow-yellow">
          <span class="stat-icon yellow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </span>
          <div class="stat-content">
            <span class="stat-lbl">Pending Bookings</span>
            <span class="stat-val text-warning">{{ getCount('PENDING') }}</span>
          </div>
        </div>

        <div class="stat-card glass-panel glow-purple">
          <span class="stat-icon purple">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5h16.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25H3.75a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 3.75 4.5ZM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
            </svg>
          </span>
          <div class="stat-content">
            <span class="stat-lbl">Total Revenue</span>
            <span class="stat-val text-primary">\${{ getRevenue() }}</span>
          </div>
        </div>
      </div>

      <!-- Controls Panel -->
      <div class="controls-card glass-panel animate-fade-in">
        <div class="search-box">
          <span class="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
            </svg>
          </span>
          <input 
            type="text" 
            placeholder="Search by PNR reference, passenger name, username..." 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="applyFilters()"
            class="search-input"
          />
        </div>

        <div class="filter-box">
          <label class="filter-label">Filter Status:</label>
          <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" class="filter-select">
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner large-spinner"></div>
        <p>Retrieving passenger bookings data...</p>
      </div>

      <!-- Table View -->
      <div class="table-wrapper glass-panel animate-fade-in" *ngIf="!loading && filteredBookings.length > 0">
        <table class="admin-table">
          <thead>
            <tr>
              <th>PNR / Reference</th>
              <th>Main Passenger / Account</th>
              <th>Itinerary (Route)</th>
              <th>Class & Price</th>
              <th>Booking Date</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let booking of filteredBookings">
              <td>
                <span class="pnr-code" (click)="viewDetails(booking)">{{ booking.bookingReference }}</span>
              </td>
              <td>
                <div class="passenger-cell">
                  <span class="passenger-name">{{ getPassengerName(booking) }}</span>
                  <span class="passenger-username">Account: {{ booking.user?.username || 'Guest' }}</span>
                </div>
              </td>
              <td>
                <div class="route-cell">
                  <span class="route-txt">{{ booking.flight.origin }} &rarr; {{ booking.flight.destination }}</span>
                  <span class="flight-no">{{ booking.flight.airline }} ({{ booking.flight.flightNumber }})</span>
                </div>
              </td>
              <td>
                <div class="price-cell">
                  <span class="class-lbl">{{ booking.seatClass }}</span>
                  <span class="price-val">\${{ booking.totalPrice }}</span>
                </div>
              </td>
              <td>
                <span class="date-txt">{{ formatDate(booking.bookingDate) }}</span>
              </td>
              <td>
                <span class="status-badge" [class]="booking.status.toLowerCase()">
                  {{ booking.status }}
                </span>
              </td>
              <td>
                <div class="actions-cell">
                  <button class="btn-action btn-view" (click)="viewDetails(booking)" title="View Details">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="btn-action-svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    View
                  </button>
                  <button 
                    *ngIf="booking.status === 'PENDING'" 
                    class="btn-action btn-confirm" 
                    (click)="updateStatus(booking.bookingReference, 'CONFIRMED')"
                    title="Confirm Reservation"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="btn-action-svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Confirm
                  </button>
                  <button 
                    *ngIf="booking.status === 'CONFIRMED'" 
                    class="btn-action btn-complete" 
                    (click)="updateStatus(booking.bookingReference, 'COMPLETED')"
                    title="Mark Completed"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="btn-action-svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Complete
                  </button>
                  <button 
                    *ngIf="booking.status === 'COMPLETED'" 
                    class="btn-action btn-activate" 
                    (click)="updateStatus(booking.bookingReference, 'CONFIRMED')"
                    title="Reopen Booking"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="btn-action-svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Reopen
                  </button>
                  <button 
                    *ngIf="booking.status === 'PENDING' || booking.status === 'CONFIRMED'" 
                    class="btn-action btn-cancel" 
                    (click)="updateStatus(booking.bookingReference, 'CANCELLED')"
                    title="Cancel Booking"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="btn-action-svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Cancel
                  </button>
                  <button 
                    *ngIf="booking.status === 'CANCELLED'" 
                    class="btn-action btn-activate" 
                    (click)="updateStatus(booking.bookingReference, 'PENDING')"
                    title="Re-activate Booking"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="btn-action-svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Re-activate
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div class="empty-state glass-panel animate-fade-in" *ngIf="!loading && filteredBookings.length === 0">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776" />
          </svg>
        </div>
        <h4>No reservations found</h4>
        <p>No reservations matched your active filter criteria.</p>
      </div>

      <!-- Details Modal Backdrop -->
      <div class="modal-backdrop" *ngIf="selectedBooking" (click)="closeDetails()">
        <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">Booking Details</h3>
            <button class="modal-close" (click)="closeDetails()">&times;</button>
          </div>

          <div class="modal-body" *ngIf="selectedBooking">
            <!-- View Details Mode -->
            <div *ngIf="!isEditing">
              <div class="modal-row">
                <div class="modal-sec">
                  <span class="sec-lbl">PNR Code</span>
                  <span class="sec-val highlight-val">{{ selectedBooking.bookingReference }}</span>
                </div>
                <div class="modal-sec">
                  <span class="sec-lbl">Status</span>
                  <span class="status-badge" [class]="selectedBooking.status.toLowerCase()">
                    {{ selectedBooking.status }}
                  </span>
                </div>
                <div class="modal-sec">
                  <span class="sec-lbl">Booking Date</span>
                  <span class="sec-val">{{ formatDate(selectedBooking.bookingDate) }}</span>
                </div>
              </div>

              <div class="modal-divider"></div>

              <!-- Flight Segment Details -->
              <div class="modal-flight">
                <h4 class="sub-sec-title">Flight Itinerary</h4>
                <div class="flight-route-flow">
                  <div class="flow-node">
                    <span class="time">{{ formatTime(selectedBooking.flight.departureTime) }}</span>
                    <span class="city">{{ selectedBooking.flight.origin }}</span>
                  </div>
                  <div class="flow-arrow">
                    <span class="duration">{{ calculateDuration(selectedBooking.flight.departureTime, selectedBooking.flight.arrivalTime) }}</span>
                    <div class="arrow-line">
                      <span class="arrow-dot"></span>
                      <span class="arrow-plane">&#9992;</span>
                      <span class="arrow-dot"></span>
                    </div>
                    <span class="airline-desc">{{ selectedBooking.flight.airline }} ({{ selectedBooking.flight.flightNumber }})</span>
                  </div>
                  <div class="flow-node">
                    <span class="time">{{ formatTime(selectedBooking.flight.arrivalTime) }}</span>
                    <span class="city">{{ selectedBooking.flight.destination }}</span>
                  </div>
                </div>
              </div>

              <div class="modal-divider"></div>

              <!-- Passengers Info -->
              <div class="modal-passengers">
                <h4 class="sub-sec-title">Travelers ({{ selectedBooking.passengers?.length || 1 }})</h4>
                <div class="passengers-list">
                  <div class="passenger-item" *ngFor="let p of selectedBooking.passengers; let i = index">
                    <div class="p-num">Passenger {{ i + 1 }}</div>
                    <div class="p-grid">
                      <div class="p-field">
                        <span class="p-lbl">Name</span>
                        <span class="p-val">{{ p.fullName }}</span>
                      </div>
                      <div class="p-field">
                        <span class="p-lbl">Passport</span>
                        <span class="p-val">{{ p.passportNumber || 'N/A' }}</span>
                      </div>
                      <div class="p-field">
                        <span class="p-lbl">Nationality</span>
                        <span class="p-val">{{ p.nationality || 'N/A' }}</span>
                      </div>
                      <div class="p-field">
                        <span class="p-lbl">DOB</span>
                        <span class="p-val">{{ p.dateOfBirth || 'N/A' }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="passenger-item" *ngIf="!selectedBooking.passengers || selectedBooking.passengers.length === 0">
                    <div class="p-num">Passenger 1 (Primary Account)</div>
                    <div class="p-grid">
                      <div class="p-field">
                        <span class="p-lbl">Name</span>
                        <span class="p-val">{{ selectedBooking.user?.firstName }} {{ selectedBooking.user?.lastName }}</span>
                      </div>
                      <div class="p-field">
                        <span class="p-lbl">Passport</span>
                        <span class="p-val">{{ selectedBooking.user?.passportNumber || 'N/A' }}</span>
                      </div>
                      <div class="p-field">
                        <span class="p-lbl">Nationality</span>
                        <span class="p-val">{{ selectedBooking.user?.nationality || 'N/A' }}</span>
                      </div>
                      <div class="p-field">
                        <span class="p-lbl">DOB</span>
                        <span class="p-val">{{ selectedBooking.user?.dateOfBirth || 'N/A' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-divider"></div>

              <!-- Billing Details -->
              <div class="modal-billing">
                <h4 class="sub-sec-title">Billing Breakdown</h4>
                <div class="bill-row">
                  <span class="bill-lbl">Seat Class Assigned:</span>
                  <span class="bill-val">{{ selectedBooking.seatClass }} Class</span>
                </div>
                <div class="bill-row">
                  <span class="bill-lbl">Assigned Seat:</span>
                  <span class="bill-val">{{ selectedBooking.seatNumber || 'N/A' }}</span>
                </div>
                <div class="bill-row total-row">
                  <span class="bill-lbl">Total Paid:</span>
                  <span class="bill-val text-success">\${{ selectedBooking.totalPrice }}</span>
                </div>
              </div>
            </div>

            <!-- Edit Details Mode -->
            <div *ngIf="isEditing && editFormModel">
              <div class="form-grid-3">
                <div class="form-group">
                  <label class="form-label">Assigned Seat</label>
                  <select [(ngModel)]="editFormModel.seatNumber" class="form-input">
                    <option *ngFor="let s of getAvailableSeats(selectedBooking.seatClass, selectedBooking.seatNumber)" [value]="s">
                      {{ s }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Meal Preference</label>
                  <select [(ngModel)]="editFormModel.mealPreference" class="form-input">
                    <option value="NONE">Standard Meal</option>
                    <option value="VEGETARIAN">Vegetarian (VGML)</option>
                    <option value="HALAL">Halal (MOML)</option>
                    <option value="KOSHER">Kosher (KSML)</option>
                    <option value="DIABETIC">Diabetic (DBML)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Special Assistance</label>
                  <select [(ngModel)]="editFormModel.specialAssistance" class="form-input">
                    <option value="NONE">None</option>
                    <option value="WHEELCHAIR">Wheelchair Access</option>
                    <option value="VISUALLY_IMPAIRED">Visually Impaired Assistance</option>
                    <option value="HEARING_IMPAIRED">Hearing Impaired Assistance</option>
                  </select>
                </div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Contact Email</label>
                  <input type="email" [(ngModel)]="editFormModel.contactEmail" class="form-input">
                </div>
                <div class="form-group">
                  <label class="form-label">Contact Phone</label>
                  <input type="text" [(ngModel)]="editFormModel.contactPhone" class="form-input">
                </div>
              </div>

              <div class="modal-divider"></div>

              <h4 class="sub-sec-title">Travelers Details</h4>
              <div class="passengers-list">
                <div class="passenger-item-edit" *ngFor="let p of editFormModel.passengers; let i = index">
                  <div class="p-num">Passenger {{ i + 1 }}</div>
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="form-label">Full Name</label>
                      <input type="text" [(ngModel)]="p.fullName" class="form-input">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Passport Number</label>
                      <input type="text" [(ngModel)]="p.passportNumber" class="form-input">
                    </div>
                  </div>
                  <div class="form-grid">
                    <div class="form-group">
                      <label class="form-label">Nationality</label>
                      <input type="text" [(ngModel)]="p.nationality" class="form-input">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Date of Birth</label>
                      <input type="date" [(ngModel)]="p.dateOfBirth" class="form-input">
                    </div>
                  </div>
                </div>
              </div>

              <div class="modal-divider"></div>

              <div class="form-group">
                <label class="form-label text-warning" style="color:#f59e0b">Reason for Modification (Mandatory for Audit Compliance)</label>
                <textarea [(ngModel)]="editReason" class="form-input" rows="3" placeholder="State reason for changes..."></textarea>
              </div>
            </div>
          </div>

          <div class="modal-footer" *ngIf="!isEditing">
            <button class="btn btn-secondary" style="margin-right: 8px;" (click)="startEdit()">📝 Edit Booking</button>
            <button class="btn btn-secondary" (click)="closeDetails()">Close</button>
          </div>
          <div class="modal-footer" *ngIf="isEditing">
            <button class="btn btn-secondary" style="margin-right: 8px;" (click)="cancelEdit()">Cancel</button>
            <button class="btn btn-primary" (click)="saveEdit()">💾 Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-header {
      margin-bottom: 32px;
    }
    .admin-title {
      font-size: 2.2rem;
      margin-bottom: 8px;
    }
    .admin-subtitle {
      color: var(--text-secondary);
      font-size: 1rem;
    }

    /* Stats cards styling */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .stat-card {
      display: flex;
      align-items: center;
      padding: 24px;
      gap: 16px;
      position: relative;
      overflow: hidden;
    }
    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      padding: 10px;
      flex-shrink: 0;
    }
    .stat-icon.blue {
      color: #60a5fa;
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.2);
    }
    .stat-icon.green {
      color: #34d399;
      background: rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.2);
    }
    .stat-icon.yellow {
      color: #fbbf24;
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.2);
    }
    .stat-icon.purple {
      color: #c084fc;
      background: rgba(139, 92, 246, 0.1);
      border-color: rgba(139, 92, 246, 0.2);
    }
    .stat-icon svg {
      width: 100%;
      height: 100%;
    }
    .stat-content {
      display: flex;
      flex-direction: column;
    }
    .stat-lbl {
      font-size: 0.8rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .stat-val {
      font-size: 1.8rem;
      font-weight: 800;
      font-family: var(--font-title);
    }
    
    /* Glimmer Glow highlights */
    .glow-blue::before {
      content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 60%);
      z-index: -1;
    }
    .glow-green::before {
      content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 60%);
      z-index: -1;
    }
    .glow-yellow::before {
      content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 60%);
      z-index: -1;
    }
    .glow-purple::before {
      content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 60%);
      z-index: -1;
    }

    /* Controls styling */
    .controls-card {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      padding: 20px 24px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 280px;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      left: 16px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
    }
    .search-icon svg {
      width: 100%;
      height: 100%;
    }
    .search-input {
      width: 100%;
      padding: 12px 16px 12px 48px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      color: var(--text-primary);
      outline: none;
      transition: var(--transition-smooth);
    }
    .search-input:focus {
      border-color: var(--primary);
      background: rgba(15, 23, 42, 0.9);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .filter-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .filter-label {
      font-size: 0.9rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .filter-select {
      padding: 10px 16px;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      color: var(--text-primary);
      outline: none;
      cursor: pointer;
      font-weight: 500;
    }

    /* Table styles */
    .table-wrapper {
      padding: 24px;
      overflow-x: auto;
    }
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .admin-table th {
      border-bottom: 1.5px solid var(--glass-border);
      padding: 12px 16px;
      color: var(--text-secondary);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .admin-table td {
      padding: 16px;
      border-bottom: 1px solid var(--glass-border);
      font-size: 0.95rem;
    }
    .admin-table tr:last-child td {
      border-bottom: none;
    }
    .pnr-code {
      font-family: var(--font-title);
      font-weight: 700;
      color: #3b82f6;
      cursor: pointer;
      text-decoration: underline;
    }
    .pnr-code:hover {
      color: #60a5fa;
    }
    .passenger-cell {
      display: flex;
      flex-direction: column;
    }
    .passenger-name {
      font-weight: 600;
      color: var(--text-primary);
    }
    .passenger-username {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .route-cell {
      display: flex;
      flex-direction: column;
    }
    .route-txt {
      font-weight: 600;
    }
    .flight-no {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .price-cell {
      display: flex;
      flex-direction: column;
    }
    .class-lbl {
      font-size: 0.7rem;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }
    .price-val {
      font-weight: 700;
      color: var(--text-primary);
    }
    .date-txt {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    /* Badges */
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .status-badge.confirmed {
      background: rgba(16, 185, 129, 0.12);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .status-badge.pending {
      background: rgba(245, 158, 11, 0.12);
      color: var(--warning);
      border: 1px solid rgba(245, 158, 11, 0.2);
    }
    .status-badge.cancelled {
      background: rgba(239, 68, 68, 0.12);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }
    .status-badge.completed {
      background: rgba(139, 92, 246, 0.12);
      color: #a78bfa;
      border: 1px solid rgba(139, 92, 246, 0.2);
    }

    /* Actions cell buttons */
    .actions-cell {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .btn-action {
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: var(--transition-fast);
      color: #fff;
    }
    .btn-action-svg {
      width: 14px;
      height: 14px;
      stroke-width: 2.5;
      flex-shrink: 0;
    }
    .btn-view {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
    }
    .btn-view:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .btn-confirm {
      background: var(--success);
    }
    .btn-confirm:hover {
      background: #059669;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
    }
    .btn-complete {
      background: #8b5cf6;
    }
    .btn-complete:hover {
      background: #7c3aed;
      box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
    }
    .btn-cancel {
      background: var(--danger);
    }
    .btn-cancel:hover {
      background: #dc2626;
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
    }
    .btn-activate {
      background: var(--primary);
    }
    .btn-activate:hover {
      background: #1d4ed8;
      box-shadow: 0 0 10px rgba(37, 99, 235, 0.4);
    }

    /* Loading state */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      gap: 16px;
      color: var(--text-secondary);
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      text-align: center;
    }
    .empty-icon {
      color: var(--text-muted);
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
    }
    .empty-icon svg {
      width: 100%;
      height: 100%;
    }
    .empty-state h4 {
      font-size: 1.25rem;
      font-family: var(--font-title);
      margin-bottom: 8px;
    }
    .empty-state p {
      color: var(--text-secondary);
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(10, 15, 29, 0.7);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }
    .modal-card {
      width: 90%;
      max-width: 600px;
      max-height: 85vh;
      overflow-y: auto;
      padding: 32px;
      animation: modalFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalFade {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .modal-title {
      font-family: var(--font-title);
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .modal-close {
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 1.8rem;
      cursor: pointer;
    }
    .modal-close:hover {
      color: var(--text-primary);
    }
    .modal-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .modal-sec {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sec-lbl {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-muted);
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .sec-val {
      font-size: 1rem;
      font-weight: 600;
    }
    .highlight-val {
      color: #3b82f6;
      font-family: var(--font-title);
      font-size: 1.15rem;
    }
    .modal-divider {
      height: 1px;
      background: var(--glass-border);
      margin: 20px 0;
    }
    .sub-sec-title {
      font-size: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--primary);
      margin-bottom: 16px;
      font-weight: 700;
    }

    /* Modal flight layout */
    .flight-route-flow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .flow-node {
      display: flex;
      flex-direction: column;
    }
    .flow-node .time {
      font-size: 1.4rem;
      font-weight: 700;
    }
    .flow-node .city {
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .flow-arrow {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .duration {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .arrow-line {
      display: flex;
      align-items: center;
      width: 100%;
      position: relative;
    }
    .arrow-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-muted);
    }
    .arrow-plane {
      flex: 1;
      text-align: center;
      font-size: 0.95rem;
      color: var(--primary);
      transform: rotate(90deg);
    }
    .arrow-plane::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 1px;
      background: var(--glass-border);
      z-index: -1;
    }
    .airline-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Modal passenger layout */
    .passengers-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .passenger-item {
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      padding: 12px 16px;
    }
    .p-num {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .p-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
    }
    .p-field {
      display: flex;
      flex-direction: column;
    }
    .p-lbl {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .p-val {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    /* Modal billing details */
    .bill-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }
    .bill-lbl {
      color: var(--text-secondary);
    }
    .bill-val {
      font-weight: 600;
    }
    .total-row {
      border-top: 1px solid var(--glass-border);
      padding-top: 10px;
      margin-top: 10px;
      font-size: 1.15rem;
      font-weight: 700;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .form-grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      margin-bottom: 12px;
    }
    .form-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .form-input {
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid var(--glass-border);
      background: rgba(15, 23, 42, 0.4);
      color: var(--text-primary);
      outline: none;
    }
    .form-input:focus {
      border-color: var(--primary);
    }
    .passenger-item-edit {
      padding: 16px;
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
    }
  `]
})
export class AdminBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  loading = true;
  searchQuery = '';
  statusFilter = 'ALL';
  selectedBooking: Booking | null = null;

  // Edit fields
  isEditing = false;
  editFormModel: any = null;
  editReason = '';

  constructor(
    private bookingService: BookingService,
    private supportService: SupportTicketService
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading = true;
    this.bookingService.getAllReservations().subscribe({
      next: (data) => {
        this.bookings = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load bookings', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredBookings = this.bookings.filter((b) => {
      // Status filter
      const matchesStatus = this.statusFilter === 'ALL' || b.status === this.statusFilter;

      // Text search filter
      let matchesText = true;
      if (q) {
        const matchesPNR = b.bookingReference.toLowerCase().includes(q);
        const matchesUsername = b.user?.username?.toLowerCase().includes(q) || false;
        const matchesMainPassenger = (b.user?.firstName + ' ' + b.user?.lastName).toLowerCase().includes(q);
        const matchesAnyPassenger = b.passengers?.some((p) => p.fullName.toLowerCase().includes(q)) || false;

        matchesText = matchesPNR || matchesUsername || matchesMainPassenger || matchesAnyPassenger;
      }

      return matchesStatus && matchesText;
    });
  }

  updateStatus(bookingRef: string, status: string): void {
    this.bookingService.updateReservationStatus(bookingRef, status).subscribe({
      next: (updatedBooking) => {
        // Find and replace in lists
        const idx = this.bookings.findIndex((b) => b.bookingReference === bookingRef);
        if (idx > -1) {
          this.bookings[idx] = updatedBooking;
        }

        if (this.selectedBooking && this.selectedBooking.bookingReference === bookingRef) {
          this.selectedBooking = updatedBooking;
        }

        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to update status', err);
        alert('Status update failed: ' + (err.error?.message || err.message));
      }
    });
  }

  viewDetails(booking: Booking): void {
    this.selectedBooking = booking;
    this.isEditing = false;
  }

  closeDetails(): void {
    this.selectedBooking = null;
    this.isEditing = false;
  }

  startEdit(): void {
    if (!this.selectedBooking) return;
    this.editFormModel = {
      seatNumber: this.selectedBooking.seatNumber,
      mealPreference: this.selectedBooking.mealPreference || 'NONE',
      specialAssistance: this.selectedBooking.specialAssistance || 'NONE',
      contactEmail: this.selectedBooking.contactEmail || this.selectedBooking.user?.email || '',
      contactPhone: this.selectedBooking.contactPhone || this.selectedBooking.user?.phoneNumber || '',
      passengers: this.selectedBooking.passengers ? this.selectedBooking.passengers.map(p => ({
        fullName: p.fullName,
        passportNumber: p.passportNumber || '',
        nationality: p.nationality || '',
        dateOfBirth: p.dateOfBirth || ''
      })) : []
    };
    this.editReason = '';
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editFormModel = null;
    this.editReason = '';
  }

  saveEdit(): void {
    if (!this.selectedBooking || !this.editFormModel) return;
    if (!this.editReason.trim()) {
      alert('A modification reason is strictly required for auditing compliance.');
      return;
    }

    const payload = {
      ...this.editFormModel,
      modificationReason: this.editReason.trim()
    };

    this.supportService.modifyBooking(this.selectedBooking.bookingReference, payload).subscribe({
      next: (updated) => {
        this.selectedBooking = updated;
        const idx = this.bookings.findIndex(b => b.bookingReference === updated.bookingReference);
        if (idx > -1) {
          this.bookings[idx] = updated;
        }
        this.applyFilters();
        this.isEditing = false;
        this.editFormModel = null;
        this.editReason = '';
        alert('Booking details modified and audited successfully!');
      },
      error: (err) => {
        console.error('Failed to save changes', err);
        alert(err.error?.message || 'Failed to modify booking details.');
      }
    });
  }

  // Helper calculation methods
  getCount(status: string): number {
    return this.bookings.filter((b) => b.status === status).length;
  }

  getRevenue(): string {
    const total = this.bookings
      .filter((b) => b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + b.totalPrice, 0);
    return total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getPassengerName(booking: Booking): string {
    if (booking.passengers && booking.passengers.length > 0) {
      const main = booking.passengers[0].fullName;
      const count = booking.passengers.length;
      return count > 1 ? `${main} (+${count - 1} traveler${count > 2 ? 's' : ''})` : main;
    }
    return `${booking.user?.firstName || 'User'} ${booking.user?.lastName || ''}`;
  }

  formatDate(dateTimeStr: string): string {
    if (!dateTimeStr) return 'N/A';
    const d = new Date(dateTimeStr);
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  formatTime(dateTimeStr: string): string {
    if (!dateTimeStr) return 'N/A';
    const d = new Date(dateTimeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  calculateDuration(depStr: string, arrStr: string): string {
    if (!depStr || !arrStr) return 'N/A';
    const dep = new Date(depStr).getTime();
    const arr = new Date(arrStr).getTime();
    const diffMs = arr - dep;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMins}m`;
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
}
