import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { Flight, Seat } from '../../models/flight.model';
import { Passenger } from '../../models/booking.model';

@Component({
  selector: 'app-booking-form',
  template: `
    <div class="container">
      <div class="booking-grid" *ngIf="flight && selectedSeat; else errorTpl">
        <!-- Main Form Panel -->
        <div class="form-card glass-panel">
          <h2 class="title gradient-text">Passenger Details</h2>
          <p class="subtitle">Please enter the traveler details exactly as shown on their passport.</p>

          <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()">
            <div formArrayName="passengers">
              <div 
                *ngFor="let passengerForm of passengers.controls; let idx = index" 
                [formGroupName]="idx" 
                class="passenger-section">
                
                <h4 class="passenger-title">Traveler #{{ idx + 1 }}</h4>
                
                <div class="form-group">
                  <label class="form-label" [for]="'fullName-' + idx">Full Name (First & Last Name)</label>
                  <input 
                    type="text" 
                    [id]="'fullName-' + idx" 
                    formControlName="fullName" 
                    class="form-input" 
                    placeholder="JOHN SMITH"
                    [class.error-border]="submitted && passengerForm.get('fullName')?.errors">
                  <div *ngIf="submitted && passengerForm.get('fullName')?.errors" class="error-msg">
                    Full name is required
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group col">
                    <label class="form-label" [for]="'dateOfBirth-' + idx">Date of Birth</label>
                    <input type="date" [id]="'dateOfBirth-' + idx" formControlName="dateOfBirth" class="form-input">
                  </div>
                  <div class="form-group col">
                    <label class="form-label" [for]="'nationality-' + idx">Nationality</label>
                    <input type="text" [id]="'nationality-' + idx" formControlName="nationality" class="form-input" placeholder="Japanese">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" [for]="'passportNumber-' + idx">Passport Number</label>
                  <input type="text" [id]="'passportNumber-' + idx" formControlName="passportNumber" class="form-input" placeholder="AB1234567">
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary submit-btn" [disabled]="loading">
              <span class="spinner" *ngIf="loading"></span>
              <span *ngIf="!loading">Create Reservation</span>
            </button>
          </form>
        </div>

        <!-- Sidebar Flight Details Panel -->
        <div class="flight-detail-card glass-panel">
          <h3 class="side-title">Your Flight</h3>
          
          <div class="flight-meta">
            <div class="meta-row">
              <span class="airline-badge">{{ flight.airline }}</span>
              <span class="flight-no">{{ flight.flightNumber }}</span>
            </div>
            
            <div class="route-display">
              <div class="station">
                <span class="code">{{ flight.origin }}</span>
                <span class="label">Origin</span>
              </div>
              <div class="separator">&rarr;</div>
              <div class="station">
                <span class="code">{{ flight.destination }}</span>
                <span class="label">Destination</span>
              </div>
            </div>

            <div class="time-meta">
              <div>
                <span class="meta-label">Departure</span>
                <span class="meta-val">{{ formatDateTime(flight.departureTime) }}</span>
              </div>
              <div>
                <span class="meta-label">Arrival</span>
                <span class="meta-val">{{ formatDateTime(flight.arrivalTime) }}</span>
              </div>
            </div>

            <div class="divider"></div>

            <div class="seat-meta">
              <div class="meta-item">
                <span class="meta-label">Class</span>
                <span class="meta-val capitalize">{{ selectedSeat.class }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Seat Chosen</span>
                <span class="meta-val seat-badge">{{ selectedSeat.column }}{{ selectedSeat.row }}</span>
              </div>
            </div>

            <div class="price-summary">
              <div class="meta-item">
                <span class="meta-label">Price per seat</span>
                <span class="meta-val">\${{ selectedSeat.price }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Travelers</span>
                <span class="meta-val">x {{ travelersCount }}</span>
              </div>
              <div class="divider"></div>
              <div class="total-row">
                <span class="total-lbl">Total Amount</span>
                <span class="total-val">\${{ selectedSeat.price * travelersCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ng-template #errorTpl>
        <div class="glass-panel error-card">
          <h4>No flight state found</h4>
          <p>Please return to the search screen to select a flight path.</p>
          <button class="btn btn-primary" routerLink="/search">Return to Search</button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .booking-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 32px;
      align-items: start;
    }
    @media (max-width: 992px) {
      .booking-grid {
        grid-template-columns: 1fr;
      }
    }
    .form-card {
      padding: 40px;
    }
    .title {
      font-size: 2rem;
      margin-bottom: 4px;
    }
    .subtitle {
      color: var(--text-secondary);
      margin-bottom: 32px;
      font-size: 0.95rem;
    }
    .passenger-section {
      border: 1px solid var(--glass-border);
      background: rgba(15, 23, 42, 0.2);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .passenger-title {
      font-family: var(--font-title);
      font-size: 1.1rem;
      color: #3b82f6;
      margin-bottom: 20px;
      border-bottom: 1px dashed var(--glass-border);
      padding-bottom: 8px;
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .col {
      flex: 1;
    }
    .submit-btn {
      width: 100%;
      height: 48px;
      gap: 10px;
    }
    .error-msg {
      color: var(--danger);
      font-size: 0.8rem;
      margin-top: 6px;
    }
    .error-border {
      border-color: var(--danger) !important;
    }
    .flight-detail-card {
      padding: 32px;
      position: sticky;
      top: 24px;
    }
    .side-title {
      font-family: var(--font-title);
      font-size: 1.35rem;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--glass-border);
      padding-bottom: 12px;
    }
    .flight-meta {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .airline-badge {
      background: var(--primary-glow);
      border: 1px solid var(--primary);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #3b82f6;
    }
    .flight-no {
      font-weight: 700;
      color: var(--text-secondary);
    }
    .route-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(15, 23, 42, 0.4);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--glass-border);
    }
    .station {
      display: flex;
      flex-direction: column;
    }
    .station .code {
      font-size: 1.6rem;
      font-weight: 800;
      font-family: var(--font-title);
    }
    .station .label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .separator {
      font-size: 1.5rem;
      color: var(--primary);
    }
    .time-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .meta-label {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      display: block;
      margin-bottom: 4px;
    }
    .meta-val {
      font-size: 0.9rem;
      font-weight: 600;
    }
    .seat-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .seat-badge {
      background: var(--secondary-glow);
      border: 1px solid var(--secondary);
      padding: 4px 10px;
      border-radius: 6px;
      color: #a855f7;
    }
    .price-summary {
      background: rgba(15, 23, 42, 0.2);
      padding: 16px;
      border-radius: 8px;
      border: 1px dashed var(--glass-border);
    }
    .price-summary .meta-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 0.85rem;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }
    .total-lbl {
      font-family: var(--font-title);
      font-weight: bold;
      color: var(--text-primary);
    }
    .total-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: #3b82f6;
      font-family: var(--font-title);
    }
    .divider {
      height: 1px;
      background: var(--glass-border);
      margin: 8px 0;
    }
    .capitalize {
      text-transform: capitalize;
    }
    .error-card {
      text-align: center;
      padding: 60px 40px;
      max-width: 500px;
      margin: 60px auto;
    }
  `]
})
export class BookingFormComponent implements OnInit {
  flight!: Flight;
  selectedSeat!: Seat;
  searchCriteria: any;
  travelersCount = 1;

  bookingForm!: FormGroup;
  loading = false;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private bookingService: BookingService
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.flight = navigation.extras.state['flight'];
      this.selectedSeat = navigation.extras.state['selectedSeat'];
      this.searchCriteria = navigation.extras.state['searchCriteria'];
      this.travelersCount = this.searchCriteria?.passengers || 1;
    }
  }

  ngOnInit(): void {
    if (this.flight && this.selectedSeat) {
      this.initForm();
    }
  }

  initForm(): void {
    const passengerGroups = [];
    for (let i = 0; i < this.travelersCount; i++) {
      passengerGroups.push(this.fb.group({
        fullName: ['', Validators.required],
        dateOfBirth: [''],
        passportNumber: [''],
        nationality: ['']
      }));
    }

    this.bookingForm = this.fb.group({
      passengers: this.fb.array(passengerGroups)
    });
  }

  get passengers(): FormArray {
    return this.bookingForm.get('passengers') as FormArray;
  }

  onSubmit(): void {
    this.submitted = true;

    if (this.bookingForm.invalid) {
      return;
    }

    this.loading = true;
    const requestPayload = {
      flightId: this.flight.id!,
      seatNumber: this.selectedSeat.column + this.selectedSeat.row,
      seatClass: this.selectedSeat.class,
      passengers: this.bookingForm.value.passengers
    };

    this.bookingService.makeReservation(requestPayload)
      .subscribe({
        next: (reservation) => {
          this.router.navigate(['/payment', reservation.bookingReference]);
        },
        error: (err) => {
          console.error('Reservation failed', err);
          this.loading = false;
        }
      });
  }

  // Helpers
  formatDateTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}
