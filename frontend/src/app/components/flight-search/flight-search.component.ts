import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FlightService } from '../../services/flight.service';
import { Flight } from '../../models/flight.model';

@Component({
  selector: 'app-flight-search',
  template: `
    <div class="container">
      <!-- Search Form Card -->
      <div class="search-card glass-panel">
        <h2 class="search-title gradient-text">Book Your Flight</h2>
        <p class="search-subtitle">Search cheap flight tickets across the globe</p>

        <form [formGroup]="searchForm" (ngSubmit)="searchFlights()">
          <div class="grid-form">
            <div class="form-group">
              <label class="form-label" for="origin">Origin</label>
              <select id="origin" formControlName="origin" class="form-input">
                <option value="" disabled>Select origin city</option>
                <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="destination">Destination</label>
              <select id="destination" formControlName="destination" class="form-input">
                <option value="" disabled>Select destination city</option>
                <option *ngFor="let city of cities" [value]="city" [disabled]="city === searchForm.value.origin">{{ city }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="departureDate">Departure Date</label>
              <input type="date" id="departureDate" formControlName="departureDate" class="form-input" [min]="minDate">
            </div>

            <div class="form-group">
              <label class="form-label" for="seatClass">Travel Class</label>
              <select id="seatClass" formControlName="seatClass" class="form-input">
                <option value="ECONOMY">Economy Class</option>
                <option value="BUSINESS">Business Class</option>
              </select>
            </div>
          </div>

          <div class="flex-actions">
            <div class="form-group passengers-field">
              <label class="form-label" for="passengers">Passengers</label>
              <input type="number" id="passengers" formControlName="passengers" class="form-input" min="1" max="9">
            </div>

            <button type="submit" class="btn btn-primary search-btn" [disabled]="loading || searchForm.invalid">
              <span class="spinner" *ngIf="loading"></span>
              <span *ngIf="!loading">Search Flights</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Results Grid -->
      <div class="results-wrapper">
        <div class="results-header" *ngIf="searched">
          <h3>Available Flights ({{ flights.length }})</h3>
          <p>Showing flights from {{ searchForm.value.origin }} to {{ searchForm.value.destination }} on {{ searchForm.value.departureDate }}</p>
        </div>

        <div class="loading-state" *ngIf="loading">
          <div class="spinner large-spinner"></div>
          <p>Searching flights paths...</p>
        </div>

        <div class="empty-state glass-panel" *ngIf="searched && !loading && flights.length === 0">
          <div class="empty-icon">&#9992;</div>
          <h4>No Flights Found</h4>
          <p>We couldn't find any flights matching your criteria. Try adjusting your dates or destinations.</p>
        </div>

        <div class="flights-list" *ngIf="searched && !loading && flights.length > 0">
          <div class="flight-card glass-panel" *ngFor="let flight of flights">
            <div class="flight-main">
              <div class="airline-section">
                <div class="airline-logo">
                  <span class="plane-icon">&#9992;</span>
                </div>
                <div>
                  <h4 class="airline-name">{{ flight.airline }}</h4>
                  <span class="flight-number">{{ flight.flightNumber }}</span>
                </div>
              </div>

              <div class="route-timeline">
                <div class="time-node origin-node">
                  <span class="time">{{ formatTime(flight.departureTime) }}</span>
                  <span class="airport-code">{{ flight.origin }}</span>
                </div>

                <div class="timeline-path">
                  <span class="duration">{{ calculateDuration(flight.departureTime, flight.arrivalTime) }}</span>
                  <div class="line">
                    <span class="line-dot"></span>
                    <span class="line-plane">&#9992;</span>
                    <span class="line-dot"></span>
                  </div>
                  <span class="stops-label">Direct</span>
                </div>

                <div class="time-node destination-node">
                  <span class="time">{{ formatTime(flight.arrivalTime) }}</span>
                  <span class="airport-code">{{ flight.destination }}</span>
                </div>
              </div>
            </div>

            <div class="flight-pricing">
              <div class="price-container">
                <span class="class-label">{{ searchForm.value.seatClass }}</span>
                <span class="price-val">\${{ getPrice(flight) }}</span>
                <span class="price-sub">per passenger</span>
              </div>

              <button class="btn btn-primary select-btn" (click)="selectFlight(flight)">
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .search-card {
      padding: 40px;
      margin-bottom: 40px;
    }
    .search-title {
      font-size: 2.2rem;
      margin-bottom: 8px;
    }
    .search-subtitle {
      color: var(--text-secondary);
      margin-bottom: 32px;
      font-size: 1rem;
    }
    .grid-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }
    .flex-actions {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 24px;
      border-top: 1px solid var(--glass-border);
      padding-top: 24px;
    }
    .passengers-field {
      max-width: 150px;
      margin-bottom: 0;
    }
    .search-btn {
      min-width: 200px;
      height: 48px;
      gap: 10px;
    }
    .results-wrapper {
      margin-top: 24px;
    }
    .results-header {
      margin-bottom: 24px;
    }
    .results-header h3 {
      font-family: var(--font-title);
      font-size: 1.5rem;
      margin-bottom: 4px;
    }
    .results-header p {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
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
      transform: rotate(45deg);
    }
    .empty-state h4 {
      font-family: var(--font-title);
      font-size: 1.4rem;
      margin-bottom: 8px;
    }
    .empty-state p {
      color: var(--text-secondary);
      max-width: 400px;
    }
    .flights-list {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .flight-card {
      display: flex;
      flex-direction: row;
      overflow: hidden;
    }
    @media (max-width: 768px) {
      .flight-card {
        flex-direction: column;
      }
      .flight-pricing {
        border-left: none !important;
        border-top: 1px solid var(--glass-border);
        width: 100% !important;
        flex-direction: row !important;
        justify-content: space-between;
        align-items: center;
      }
      .price-container {
        text-align: left !important;
      }
    }
    .flight-main {
      flex: 3;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
    .airline-section {
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 180px;
    }
    .airline-logo {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--primary-glow) 0%, var(--secondary-glow) 100%);
      border: 1px solid var(--glass-border);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .plane-icon {
      font-size: 1.4rem;
      transform: rotate(45deg);
      color: #3b82f6;
    }
    .airline-name {
      font-family: var(--font-title);
      font-size: 1.1rem;
      font-weight: 600;
    }
    .flight-number {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .route-timeline {
      display: flex;
      align-items: center;
      flex: 1;
      justify-content: space-around;
      gap: 16px;
    }
    .time-node {
      display: flex;
      flex-direction: column;
    }
    .time-node.origin-node {
      align-items: flex-end;
      text-align: right;
    }
    .time-node.destination-node {
      align-items: flex-start;
      text-align: left;
    }
    .time-node .time {
      font-size: 1.3rem;
      font-weight: 700;
    }
    .time-node .airport-code {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .timeline-path {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 150px;
    }
    .duration {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .stops-label {
      font-size: 0.75rem;
      color: var(--success);
      font-weight: 600;
      margin-top: 4px;
    }
    .line {
      display: flex;
      align-items: center;
      width: 100%;
      position: relative;
    }
    .line-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-muted);
    }
    .line-plane {
      flex: 1;
      text-align: center;
      font-size: 0.9rem;
      color: var(--primary);
      transform: rotate(90deg);
      position: relative;
    }
    .line-plane::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 1px;
      background: var(--glass-border);
      z-index: -1;
    }
    .flight-pricing {
      flex: 1;
      padding: 24px;
      border-left: 1px solid var(--glass-border);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 16px;
      min-width: 180px;
      background: rgba(255,255,255,0.01);
    }
    .price-container {
      text-align: center;
      display: flex;
      flex-direction: column;
    }
    .class-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-muted);
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .price-val {
      font-size: 1.8rem;
      font-weight: 800;
      color: #f8fafc;
      font-family: var(--font-title);
    }
    .price-sub {
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .select-btn {
      width: 100%;
    }
  `]
})
export class FlightSearchComponent {
  searchForm: FormGroup;
  flights: Flight[] = [];
  loading = false;
  searched = false;
  minDate: string;

  cities = ['New York', 'London', 'Tokyo', 'Paris', 'Dubai', 'Singapore'];

  constructor(
    private fb: FormBuilder,
    private flightService: FlightService,
    private router: Router
  ) {
    // Determine today's date formatted as YYYY-MM-DD
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];

    this.searchForm = this.fb.group({
      origin: ['', Validators.required],
      destination: ['', Validators.required],
      departureDate: [this.minDate, Validators.required],
      seatClass: ['ECONOMY', Validators.required],
      passengers: [1, [Validators.required, Validators.min(1), Validators.max(9)]]
    });
  }

  searchFlights(): void {
    if (this.searchForm.valid) {
      this.loading = true;
      this.searched = true;
      this.flightService.searchFlights(this.searchForm.value)
        .subscribe({
          next: (data) => {
            this.flights = data;
            this.loading = false;
          },
          error: (error) => {
            console.error('Search failed', error);
            this.loading = false;
          }
        });
    }
  }

  selectFlight(flight: Flight): void {
    this.router.navigate(['/seat-selection'], {
      state: { flight, searchCriteria: this.searchForm.value }
    });
  }

  // Helper Methods
  formatTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  calculateDuration(depStr: string, arrStr: string): string {
    const dep = new Date(depStr).getTime();
    const arr = new Date(arrStr).getTime();
    const diffMs = arr - dep;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMins}m`;
  }

  getPrice(flight: Flight): number {
    return this.searchForm.value.seatClass === 'BUSINESS' 
        ? flight.businessPrice 
        : flight.economyPrice;
  }
}
