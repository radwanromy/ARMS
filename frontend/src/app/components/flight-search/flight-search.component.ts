import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FlightService } from '../../services/flight.service';
import { Flight } from '../../models/flight.model';

@Component({
  selector: 'app-flight-search',
  template: `
    <div class="container">
      <!-- Full Search Form Card -->
      <div class="search-card glass-panel animate-slide-down" *ngIf="!searched || showSearchForm">
        <div class="form-header-row">
          <div>
            <h2 class="search-title gradient-text">Book Your Flight</h2>
            <p class="search-subtitle">Search cheap flight tickets across the globe</p>
          </div>
          <button type="button" class="btn-close-form" *ngIf="searched" (click)="showSearchForm = false" title="Close Search Form">
            &times;
          </button>
        </div>

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
              <input type="date" id="departureDate" formControlName="departureDate" class="form-input" [min]="minDate" (change)="onDateChange()">
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

            <div class="action-buttons">
              <button type="button" class="btn btn-secondary cancel-btn" *ngIf="searched" (click)="showSearchForm = false">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary search-btn" [disabled]="loading || searchForm.invalid">
                <span class="spinner" *ngIf="loading"></span>
                <span *ngIf="!loading">Search Flights</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Compact Search Header (shown when searched is true and showSearchForm is false) -->
      <div class="compact-header glass-panel animate-fade-in" *ngIf="searched && !showSearchForm">
        <div class="compact-info">
          <div class="compact-route">
            <span class="city">{{ searchForm.value.origin }}</span>
            <span class="route-plane">&#9992;</span>
            <span class="city">{{ searchForm.value.destination }}</span>
          </div>
          <div class="compact-details">
            <span class="detail-badge">
              <i class="calendar-icon">&#128197;</i> {{ formatHeaderDate(searchForm.value.departureDate) }}
            </span>
            <span class="detail-badge">
              <i class="class-icon">&#128186;</i> {{ searchForm.value.seatClass }}
            </span>
            <span class="detail-badge">
              <i class="passenger-icon">&#128101;</i> {{ searchForm.value.passengers }} Passenger{{ searchForm.value.passengers > 1 ? 's' : '' }}
            </span>
          </div>
        </div>
        <button class="btn btn-secondary modify-btn" (click)="showSearchForm = true">
          <span class="edit-icon">&#9998;</span> Modify Search
        </button>
      </div>

      <!-- Price Calendar Carousel Header (remains visible when loading) -->
      <div class="calendar-carousel glass-panel animate-fade-in" *ngIf="searched && carouselDates.length > 0" [class.carousel-loading]="loading">
        <div class="carousel-header-row">
          <div>
            <h3 class="carousel-title">Fares Calendar</h3>
            <p class="carousel-subtitle">Compare pricing details around your departure date (+/- 3 days)</p>
          </div>
          <div class="carousel-nav-hint">
            <span>Scroll for more days</span> &rarr;
          </div>
        </div>
        
        <div class="carousel-container">
          <div 
            class="carousel-card" 
            *ngFor="let item of carouselDates" 
            [class.active]="item.active"
            (click)="selectCarouselDate(item.dateStr)">
            <span class="day-lbl">{{ item.dayName }}</span>
            <span class="date-lbl">{{ item.dateFormatted }}</span>
            <span class="price-lbl">\${{ item.price }}</span>
          </div>
        </div>
      </div>

      <!-- Results Grid -->
      <div class="results-wrapper">
        <div class="results-header" *ngIf="searched && !loading">
          <h3>Available Flights ({{ flights.length }})</h3>
          <p>Showing flights from {{ searchForm.value.origin }} to {{ searchForm.value.destination }} on {{ formatHeaderDate(searchForm.value.departureDate) }}</p>
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

    /* Price Calendar Carousel styles */
    .calendar-carousel {
      padding: 24px;
      margin-bottom: 32px;
    }
    .carousel-title {
      font-family: var(--font-title);
      font-size: 1.35rem;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .carousel-subtitle {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: 20px;
    }
    .carousel-container {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
    }
    .carousel-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 16px;
      min-width: 100px;
      border-radius: 10px;
      border: 1px solid var(--glass-border);
      cursor: pointer;
      transition: var(--transition-smooth);
      background: rgba(255, 255, 255, 0.01);
      flex: 1;
    }
    .carousel-card:hover {
      border-color: var(--primary);
      background: rgba(255, 255, 255, 0.05);
      transform: translateY(-2px);
    }
    .carousel-card.active {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      border-color: transparent;
      box-shadow: 0 4px 15px var(--primary-glow);
    }
    .carousel-card.active .day-lbl,
    .carousel-card.active .date-lbl,
    .carousel-card.active .price-lbl {
      color: #fff !important;
    }
    .day-lbl {
      font-size: 0.75rem;
      color: var(--text-muted);
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
    .date-lbl {
      font-size: 1rem;
      font-weight: 700;
      margin: 4px 0 6px 0;
      color: var(--text-primary);
    }
    .price-lbl {
      font-size: 0.95rem;
      font-weight: 800;
      color: var(--success);
    }

    /* Form Header and Close button */
    .form-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .btn-close-form {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--glass-border);
      color: var(--text-secondary);
      font-size: 1.5rem;
      cursor: pointer;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      transition: var(--transition-fast);
    }
    .btn-close-form:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-primary);
      border-color: rgba(255, 255, 255, 0.2);
    }

    /* Action buttons grouping */
    .action-buttons {
      display: flex;
      gap: 12px;
    }
    .cancel-btn {
      height: 48px;
      padding: 0 24px;
    }

    /* Compact Header styles */
    .compact-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 32px;
      margin-bottom: 24px;
      border-radius: 16px;
      background: rgba(30, 41, 59, 0.4);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
    }
    .compact-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .compact-route {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .compact-route .city {
      font-size: 1.4rem;
      font-weight: 700;
      color: #f8fafc;
      font-family: var(--font-title);
    }
    .compact-route .route-plane {
      color: #3b82f6;
      font-size: 1.2rem;
      transform: rotate(45deg);
    }
    .compact-details {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .detail-badge {
      font-size: 0.8rem;
      padding: 6px 12px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.04);
      border-radius: 20px;
      color: var(--text-secondary);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .modify-btn {
      height: 40px;
      padding: 0 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
    }
    .edit-icon {
      font-size: 1rem;
    }

    /* Carousel Nav Hint & Header Row */
    .carousel-header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 20px;
    }
    .carousel-nav-hint {
      font-size: 0.8rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* Carousel loading styles */
    .calendar-carousel {
      position: relative;
      transition: opacity 0.3s ease;
    }
    .calendar-carousel.carousel-loading {
      opacity: 0.7;
      pointer-events: none;
    }
    .calendar-carousel.carousel-loading::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 100%;
      background: linear-gradient(90deg, transparent, #3b82f6, transparent);
      animation: carousel-shimmer 1.5s infinite linear;
    }

    /* Animations styling */
    .animate-fade-in {
      animation: fadeIn 0.4s ease forwards;
    }
    .animate-slide-down {
      animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes carousel-shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    @media (max-width: 768px) {
      .compact-header {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
        padding: 16px 20px;
      }
      .modify-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class FlightSearchComponent {
  searchForm: FormGroup;
  flights: Flight[] = [];
  loading = false;
  searched = false;
  showSearchForm = true;
  minDate: string;
  carouselDates: { dateStr: string, dayName: string, dateFormatted: string, price: number, active: boolean }[] = [];

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

  onDateChange(): void {
    if (this.searched && this.searchForm.valid) {
      this.searchFlights();
    }
  }

  searchFlights(): void {
    if (this.searchForm.valid) {
      this.loading = true;
      this.searched = true;
      this.flightService.searchFlights(this.searchForm.value)
        .subscribe({
          next: (data) => {
            this.flights = data;
            this.generateCarousel(this.searchForm.value.departureDate, data);
            this.loading = false;
            this.showSearchForm = false;
          },
          error: (error) => {
            console.error('Search failed', error);
            this.loading = false;
          }
        });
    }
  }

  generateCarousel(selectedDateStr: string, flights: Flight[]): void {
    const selectedDateObj = new Date(selectedDateStr);
    const seatClass = this.searchForm.value.seatClass;
    
    // Find base price
    let basePrice = 0;
    if (flights.length > 0) {
      basePrice = Math.min(...flights.map(f => this.getPrice(f)));
    } else {
      // Fallback base price based on route and seat class
      const origin = this.searchForm.value.origin;
      const destination = this.searchForm.value.destination;
      const key = `${origin}-${destination}`;
      
      const prices: { [key: string]: { ECONOMY: number, BUSINESS: number } } = {
        'Tokyo-Paris': { ECONOMY: 850, BUSINESS: 2100 },
        'Tokyo-New York': { ECONOMY: 980, BUSINESS: 2450 },
        'Tokyo-Seoul': { ECONOMY: 220, BUSINESS: 550 },
        'Tokyo-Singapore': { ECONOMY: 450, BUSINESS: 1150 },
        'Tokyo-London': { ECONOMY: 890, BUSINESS: 2300 },
        'Tokyo-Sydney': { ECONOMY: 680, BUSINESS: 1750 },
        'Paris-Tokyo': { ECONOMY: 850, BUSINESS: 2100 },
        'New York-Tokyo': { ECONOMY: 980, BUSINESS: 2450 },
        'Seoul-Tokyo': { ECONOMY: 220, BUSINESS: 550 },
        'Singapore-Tokyo': { ECONOMY: 450, BUSINESS: 1150 },
        'London-Tokyo': { ECONOMY: 890, BUSINESS: 2300 },
        'Sydney-Tokyo': { ECONOMY: 680, BUSINESS: 1750 }
      };
      
      const routePrice = prices[key] || { ECONOMY: 500, BUSINESS: 1200 };
      basePrice = seatClass === 'BUSINESS' ? routePrice.BUSINESS : routePrice.ECONOMY;
    }
    
    this.carouselDates = [];
    
    // Generate dates: selectedDate +/- 3 days
    for (let i = -3; i <= 3; i++) {
      const currentDateObj = new Date(selectedDateObj);
      currentDateObj.setDate(selectedDateObj.getDate() + i);
      
      // Do not show dates before minDate
      const minDateObj = new Date(this.minDate);
      minDateObj.setHours(0,0,0,0);
      currentDateObj.setHours(0,0,0,0);
      
      if (currentDateObj < minDateObj) {
        continue;
      }
      
      const dateStr = currentDateObj.toISOString().split('T')[0];
      const dayName = currentDateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const dateFormatted = currentDateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      
      // Calculate a realistic price variation based on day of week
      const dayOfWeek = currentDateObj.getDay();
      let multiplier = 1.0;
      if (dayOfWeek === 5 || dayOfWeek === 0) { // Friday or Sunday
        multiplier = 1.15;
      } else if (dayOfWeek === 6) { // Saturday
        multiplier = 1.10;
      } else if (dayOfWeek === 2 || dayOfWeek === 3) { // Tuesday or Wednesday
        multiplier = 0.90;
      }
      
      // Add slight deterministic offset based on day number
      const offset = (currentDateObj.getDate() % 4) * 5; 
      const finalPrice = Math.round((basePrice * multiplier) + offset);
      
      this.carouselDates.push({
        dateStr,
        dayName,
        dateFormatted,
        price: finalPrice,
        active: dateStr === selectedDateStr
      });
    }
  }

  selectCarouselDate(dateStr: string): void {
    this.searchForm.patchValue({ departureDate: dateStr });
    this.searchFlights();
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

  formatHeaderDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
