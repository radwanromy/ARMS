import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Flight, Seat } from '../../models/flight.model';

@Component({
  selector: 'app-seat-selection',
  template: `
    <div class="container">
      <!-- Step Indicator for Round Trip -->
      <div class="steps-indicator mb-4 animate-fade-in" *ngIf="returnFlight">
        <div class="step" [class.active]="!isSelectingReturnSeat" [class.completed]="isSelectingReturnSeat">
          <span class="step-num">1</span>
          <span class="step-lbl">Outbound Seat Selection</span>
        </div>
        <div class="step-line" [class.completed]="isSelectingReturnSeat"></div>
        <div class="step" [class.active]="isSelectingReturnSeat">
          <span class="step-num">2</span>
          <span class="step-lbl">Return Seat Selection</span>
        </div>
      </div>

      <div class="seat-layout-grid" *ngIf="flight; else noFlightTpl">
        <!-- Main Map Panel -->
        <div class="map-card glass-panel">
          <h2 class="title gradient-text">Select Your Seat</h2>
          <p class="subtitle" *ngIf="!isSelectingReturnSeat">Flight: {{ flight.flightNumber }} | {{ flight.origin }} &rarr; {{ flight.destination }}</p>
          <p class="subtitle" *ngIf="isSelectingReturnSeat && returnFlight">Flight: {{ returnFlight.flightNumber }} | {{ returnFlight.origin }} &rarr; {{ returnFlight.destination }}</p>

          <!-- Legend -->
          <div class="legend">
            <div class="legend-item"><span class="box available"></span> Available</div>
            <div class="legend-item"><span class="box business"></span> Business</div>
            <div class="legend-item"><span class="box selected"></span> Selected</div>
            <div class="legend-item"><span class="box occupied"></span> Occupied</div>
          </div>

          <!-- Cabin Map -->
          <div class="cabin-map">
            <div class="cabin-header">Cockpit / Front</div>
            
            <div class="cabin-body">
              <div class="seat-row" *ngFor="let row of seatMap">
                <span class="row-number">{{ row[0].row }}</span>
                
                <div class="seat-cols">
                  <ng-container *ngFor="let seat of row; let colIdx = index">
                    <!-- Aisle markers -->
                    <span class="aisle" *ngIf="colIdx === 3 || colIdx === 7"></span>
                    
                    <button 
                       type="button"
                      class="seat-btn"
                      [class.business]="seat.class === 'BUSINESS' && seat.isAvailable"
                      [class.occupied]="!seat.isAvailable"
                      [class.selected]="selectedSeat?.row === seat.row && selectedSeat?.column === seat.column"
                      [disabled]="!seat.isAvailable"
                      [title]="seat.column + seat.row + ' - $' + seat.price"
                      (click)="selectSeat(seat)">
                      {{ seat.column }}
                    </button>
                  </ng-container>
                </div>

                <span class="row-number">{{ row[0].row }}</span>
              </div>
            </div>
            
            <div class="cabin-footer">Exit / Back</div>
          </div>
        </div>

        <!-- Sidebar Summary Card -->
        <div class="summary-card glass-panel">
          <h3 class="summary-title">Reservation Summary</h3>
          <div class="summary-details">
            <div class="summary-item">
              <span class="label">Trip Type</span>
              <span class="value">{{ returnFlight ? 'Round-Trip' : 'One-Way' }}</span>
            </div>

            <div class="summary-flight-section">
              <span class="flight-sec-title">Outbound Voyage</span>
              <div class="summary-item">
                <span class="label">Flight</span>
                <span class="value">{{ flight.flightNumber }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Route</span>
                <span class="value">{{ flight.origin }} &rarr; {{ flight.destination }}</span>
              </div>
              <div class="summary-item" *ngIf="isSelectingReturnSeat ? selectedOutboundSeat : selectedSeat">
                <span class="label">Seat</span>
                <span class="value seat-badge">{{ (isSelectingReturnSeat ? selectedOutboundSeat : selectedSeat)?.column }}{{ (isSelectingReturnSeat ? selectedOutboundSeat : selectedSeat)?.row }}</span>
              </div>
            </div>

            <div class="summary-flight-section mt-4" *ngIf="returnFlight">
              <span class="flight-sec-title">Return Voyage</span>
              <div class="summary-item">
                <span class="label">Flight</span>
                <span class="value">{{ returnFlight.flightNumber }}</span>
              </div>
              <div class="summary-item">
                <span class="label">Route</span>
                <span class="value">{{ returnFlight.origin }} &rarr; {{ returnFlight.destination }}</span>
              </div>
              <div class="summary-item" *ngIf="isSelectingReturnSeat ? selectedSeat : selectedReturnSeat">
                <span class="label">Seat</span>
                <span class="value seat-badge">{{ (isSelectingReturnSeat ? selectedSeat : selectedReturnSeat)?.column }}{{ (isSelectingReturnSeat ? selectedSeat : selectedReturnSeat)?.row }}</span>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="summary-item">
              <span class="label">Class Selected</span>
              <span class="value capitalize">{{ searchCriteria?.seatClass || 'ECONOMY' }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Passengers Count</span>
              <span class="value">{{ searchCriteria?.passengers || 1 }} traveler(s)</span>
            </div>

            <div class="total-price-row" *ngIf="selectedSeat || selectedOutboundSeat">
              <span class="label">Estimated Total</span>
              <span class="value price-tag">\${{ calculateTotal() }}</span>
            </div>
          </div>

          <div class="actions-wrapper">
            <button 
              type="button"
              class="btn btn-secondary w-full mb-2" 
              *ngIf="isSelectingReturnSeat" 
              (click)="backToOutbound()">
              &larr; Outbound Seat Selection
            </button>
            <button 
              type="button"
              class="btn btn-primary proceed-btn w-full" 
              *ngIf="returnFlight && !isSelectingReturnSeat" 
              [disabled]="!selectedSeat" 
              (click)="confirmOutboundSeat()">
              Confirm & Select Return Seat
            </button>
            <button 
              type="button"
              class="btn btn-primary proceed-btn w-full" 
              *ngIf="!returnFlight || isSelectingReturnSeat" 
              [disabled]="!selectedSeat" 
              (click)="proceedToBooking()">
              Proceed to Booking
            </button>
          </div>
        </div>
      </div>

      <ng-template #noFlightTpl>
        <div class="glass-panel error-card">
          <h4>No flight state found</h4>
          <p>Please return to the search screen to select a flight path.</p>
          <button type="button" class="btn btn-primary" routerLink="/search">Return to Search</button>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .seat-layout-grid {
      display: grid;
      grid-template-columns: 3fr 1fr;
      gap: 32px;
      align-items: start;
    }
    @media (max-width: 992px) {
      .seat-layout-grid {
        grid-template-columns: 1fr;
      }
    }
    .map-card {
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
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
    .legend {
      display: flex;
      gap: 24px;
      margin-bottom: 40px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }
    .box {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1px solid var(--glass-border);
    }
    .box.available { background: rgba(30, 41, 59, 0.5); border-color: #3b82f6; }
    .box.business { background: rgba(139, 92, 246, 0.2); border-color: #8b5cf6; }
    .box.selected { background: #3b82f6; border-color: #3b82f6; box-shadow: 0 0 10px #3b82f6; }
    .box.occupied { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.4); }
    
    .cabin-map {
      background: rgba(15, 23, 42, 0.4);
      border: 2px solid var(--glass-border);
      border-radius: 40px 40px 16px 16px;
      padding: 40px 24px;
      max-width: 520px;
      width: 100%;
      box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.6);
    }
    .cabin-header {
      text-align: center;
      color: var(--text-muted);
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.15em;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--glass-border);
      padding-bottom: 12px;
    }
    .cabin-footer {
      text-align: center;
      color: var(--text-muted);
      text-transform: uppercase;
      font-size: 0.8rem;
      letter-spacing: 0.15em;
      margin-top: 24px;
      border-top: 1px solid var(--glass-border);
      padding-top: 12px;
    }
    .cabin-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 500px;
      overflow-y: auto;
      padding-right: 8px;
    }
    .seat-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .row-number {
      font-family: var(--font-title);
      font-size: 0.85rem;
      color: var(--text-muted);
      width: 20px;
      text-align: center;
    }
    .seat-cols {
      display: flex;
      flex: 1;
      justify-content: space-between;
      align-items: center;
    }
    .seat-btn {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid #3b82f6;
      background: rgba(30, 41, 59, 0.5);
      color: var(--text-primary);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--transition-fast);
    }
    .seat-btn:hover:not(:disabled) {
      background: var(--primary-glow);
      transform: scale(1.15);
    }
    .seat-btn.business {
      border-color: #8b5cf6;
      background: rgba(139, 92, 246, 0.1);
    }
    .seat-btn.business:hover {
      background: var(--secondary-glow);
    }
    .seat-btn.occupied {
      background: rgba(239, 68, 68, 0.08);
      border-color: rgba(239, 68, 68, 0.3);
      color: var(--text-muted);
      cursor: not-allowed;
      opacity: 0.4;
    }
    .seat-btn.selected {
      background: #2563eb !important;
      border-color: #3b82f6 !important;
      box-shadow: 0 0 12px #2563eb;
      color: #fff;
    }
    .aisle {
      width: 16px;
      display: inline-block;
    }
    .summary-card {
      padding: 32px;
      position: sticky;
      top: 24px;
    }
    .summary-title {
      font-family: var(--font-title);
      font-size: 1.35rem;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--glass-border);
      padding-bottom: 12px;
    }
    .summary-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 32px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }
    .summary-item .label {
      color: var(--text-secondary);
    }
    .summary-item .value {
      font-weight: 600;
    }
    .seat-badge {
      background: var(--primary-glow);
      border: 1px solid var(--primary);
      padding: 4px 10px;
      border-radius: 6px;
      color: #3b82f6;
    }
    .divider {
      height: 1px;
      background: var(--glass-border);
      margin: 8px 0;
    }
    .total-price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }
    .total-price-row .label {
      font-family: var(--font-title);
      font-weight: bold;
    }
    .price-tag {
      font-size: 1.6rem;
      font-weight: 800;
      color: #3b82f6;
      font-family: var(--font-title);
    }
    .proceed-btn {
      width: 100%;
    }
    .error-card {
      text-align: center;
      padding: 60px 40px;
      max-width: 500px;
      margin: 60px auto;
    }
    .error-card h4 {
      font-family: var(--font-title);
      font-size: 1.5rem;
      margin-bottom: 12px;
    }
    .error-card p {
      color: var(--text-secondary);
      margin-bottom: 24px;
    }
    .capitalize {
      text-transform: capitalize;
    }

    .steps-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      padding: 16px 24px;
      border-radius: 12px;
      max-width: 800px;
      margin: 0 auto 32px auto;
    }
    .step {
      display: flex;
      align-items: center;
      gap: 10px;
      opacity: 0.5;
      transition: all 0.3s;
    }
    .step.active {
      opacity: 1;
      font-weight: 700;
    }
    .step.completed {
      opacity: 0.8;
      color: var(--success);
    }
    .step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--bg-secondary);
      border: 2px solid var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }
    .step.active .step-num {
      background: var(--primary);
      border-color: var(--primary);
      color: #fff;
      box-shadow: 0 0 10px var(--primary-glow);
    }
    .step.completed .step-num {
      background: var(--success);
      border-color: var(--success);
      color: #fff;
    }
    .step-line {
      flex-grow: 1;
      height: 2px;
      background: var(--glass-border);
      margin: 0 20px;
      max-width: 150px;
    }
    .step-line.completed {
      background: var(--success);
    }
    .step-lbl {
      font-size: 0.9rem;
    }
    .flight-sec-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--primary);
      font-weight: 700;
      margin-bottom: 8px;
      display: block;
    }
    .summary-flight-section {
      padding: 8px 0;
      border-bottom: 1px dashed rgba(255,255,255,0.06);
    }
    .mb-2 { margin-bottom: 8px; }
  `]
})
export class SeatSelectionComponent implements OnInit {
  flight!: Flight;
  returnFlight: Flight | null = null;
  searchCriteria: any;
  seatMap: Seat[][] = [];
  selectedSeat: Seat | null = null;

  // Round Trip selections
  selectedOutboundSeat: Seat | null = null;
  selectedReturnSeat: Seat | null = null;
  isSelectingReturnSeat = false;

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.flight = navigation.extras.state['flight'];
      this.returnFlight = navigation.extras.state['returnFlight'];
      this.searchCriteria = navigation.extras.state['searchCriteria'];
    }
  }

  ngOnInit(): void {
    if (this.flight) {
      this.generateSeatMap(this.flight);
    }
  }

  generateSeatMap(targetFlight: Flight): void {
    this.seatMap = [];
    const rows = 30;
    const columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];

    for (let i = 1; i <= rows; i++) {
      const row: Seat[] = [];
      columns.forEach(col => {
        const isBusiness = i <= 5;
        row.push({
          row: i,
          column: col,
          class: isBusiness ? 'BUSINESS' : 'ECONOMY',
          isAvailable: this.isSeatAvailable(i, col),
          price: isBusiness ? targetFlight.businessPrice : targetFlight.economyPrice
        });
      });
      this.seatMap.push(row);
    }
  }

  isSeatAvailable(row: number, col: string): boolean {
    const seatHash = (row * 3) + col.charCodeAt(0);
    return seatHash % 5 !== 0 && seatHash % 7 !== 0;
  }

  selectSeat(seat: Seat): void {
    if (seat.isAvailable) {
      this.selectedSeat = seat;
    }
  }

  calculateTotal(): number {
    const travelers = this.searchCriteria?.passengers || 1;
    let total = 0;
    
    if (this.selectedOutboundSeat) {
      total += this.selectedOutboundSeat.price;
    } else if (!this.isSelectingReturnSeat && this.selectedSeat) {
      total += this.selectedSeat.price;
    }
    
    if (this.isSelectingReturnSeat && this.selectedSeat) {
      total += this.selectedSeat.price;
    } else if (this.selectedReturnSeat) {
      total += this.selectedReturnSeat.price;
    }

    return total * travelers;
  }

  confirmOutboundSeat(): void {
    if (this.selectedSeat && this.returnFlight) {
      this.selectedOutboundSeat = this.selectedSeat;
      this.selectedSeat = this.selectedReturnSeat; // restore previous return selection if any
      this.isSelectingReturnSeat = true;
      this.generateSeatMap(this.returnFlight);
    }
  }

  backToOutbound(): void {
    if (this.returnFlight) {
      this.selectedReturnSeat = this.selectedSeat;
      this.selectedSeat = this.selectedOutboundSeat;
      this.isSelectingReturnSeat = false;
      this.generateSeatMap(this.flight);
    }
  }

  proceedToBooking(): void {
    if (this.returnFlight) {
      const returnSeat = this.selectedSeat;
      if (this.selectedOutboundSeat && returnSeat) {
        this.router.navigate(['/booking'], {
          state: {
            flight: this.flight,
            selectedSeat: this.selectedOutboundSeat,
            returnFlight: this.returnFlight,
            selectedReturnSeat: returnSeat,
            searchCriteria: this.searchCriteria
          }
        });
      }
    } else {
      if (this.selectedSeat) {
        this.router.navigate(['/booking'], {
          state: {
            flight: this.flight,
            selectedSeat: this.selectedSeat,
            searchCriteria: this.searchCriteria
          }
        });
      }
    }
  }
}
