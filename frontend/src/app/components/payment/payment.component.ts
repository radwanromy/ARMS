import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../services/booking.service';
import { PaymentService } from '../../services/payment.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-payment',
  template: `
    <div class="container">
      <div class="payment-grid" *ngIf="booking; else loadingTpl">
        
        <!-- Payment processing overlay -->
        <div class="processing-overlay" *ngIf="processing">
          <div class="spinner large-spinner"></div>
          <h4>Authorizing Transaction...</h4>
          <p>Please do not refresh or close this tab.</p>
        </div>

        <!-- Success Modal/State -->
        <div class="confirmation-panel glass-panel" *ngIf="paymentStatus === 'success'">
          <div class="success-icon">&#10004;</div>
          <h2 class="confirm-title gradient-text">Payment Confirmed</h2>
          <p class="confirm-subtitle">Your ticket has been booked successfully!</p>
          
          <div class="receipt-box">
            <div class="receipt-row">
              <span class="label">Booking Reference</span>
              <span class="value ref-val">{{ booking.bookingReference }}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Transaction ID</span>
              <span class="value">{{ transactionId }}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Amount Paid</span>
              <span class="value price-lbl">\${{ booking.totalPrice }}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Route</span>
              <span class="value">{{ booking.flight.origin }} &rarr; {{ booking.flight.destination }}</span>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="downloadTicket()">Download Ticket</button>
            <button class="btn btn-primary" (click)="navigate('/my-bookings')">View My Bookings</button>
          </div>
        </div>

        <!-- Main Form Column -->
        <div class="form-column" *ngIf="paymentStatus !== 'success'">
          <div class="form-card glass-panel">
            <h2 class="title">Secure Payment</h2>
            <p class="subtitle">Complete your transaction using credit or debit card.</p>
            
            <div class="alert alert-danger" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>

            <!-- Card flip illustration -->
            <div class="card-container">
              <div class="credit-card" [class.flipped]="isCvvFocused">
                <!-- Front Side -->
                <div class="card-side card-front">
                  <div class="card-logo">VISA</div>
                  <div class="card-chip"></div>
                  <div class="card-num">
                    {{ formatCardNumber(paymentForm.value.cardNumber) || '•••• •••• •••• ••••' }}
                  </div>
                  <div class="card-footer-meta">
                    <div class="card-holder">
                      <span class="meta-lbl">Card Holder</span>
                      <span class="meta-val">{{ booking.user.firstName + ' ' + booking.user.lastName | uppercase }}</span>
                    </div>
                    <div class="card-expiry">
                      <span class="meta-lbl">Expires</span>
                      <span class="meta-val">{{ paymentForm.value.expiryDate || 'MM/YY' }}</span>
                    </div>
                  </div>
                </div>

                <!-- Back Side -->
                <div class="card-side card-back">
                  <div class="card-magnetic-strip"></div>
                  <div class="card-signature">
                    <span class="signature-line"></span>
                    <span class="card-cvv-val">{{ paymentForm.value.cvv || '•••' }}</span>
                  </div>
                  <div class="card-back-text">Authorized Signature Required</div>
                </div>
              </div>
            </div>

            <!-- Payment Form -->
            <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label class="form-label" for="cardNumber">Card Number</label>
                <input 
                  type="text" 
                  id="cardNumber" 
                  formControlName="cardNumber" 
                  class="form-input" 
                  placeholder="4111 2222 3333 4444"
                  maxLength="16"
                  [class.error-border]="submitted && f['cardNumber'].errors">
                <div *ngIf="submitted && f['cardNumber'].errors" class="error-msg">
                  Card number is required (16 digits)
                </div>
              </div>

              <div class="form-row">
                <div class="form-group col">
                  <label class="form-label" for="expiryDate">Expiry Date</label>
                  <input 
                    type="text" 
                    id="expiryDate" 
                    formControlName="expiryDate" 
                    class="form-input" 
                    placeholder="MM/YY"
                    maxLength="5"
                    [class.error-border]="submitted && f['expiryDate'].errors">
                  <div *ngIf="submitted && f['expiryDate'].errors" class="error-msg">
                    Required (MM/YY)
                  </div>
                </div>

                <div class="form-group col">
                  <label class="form-label" for="cvv">CVV</label>
                  <input 
                    type="password" 
                    id="cvv" 
                    formControlName="cvv" 
                    class="form-input" 
                    placeholder="123"
                    maxLength="3"
                    (focus)="isCvvFocused = true"
                    (blur)="isCvvFocused = false"
                    [class.error-border]="submitted && f['cvv'].errors">
                  <div *ngIf="submitted && f['cvv'].errors" class="error-msg">
                    Required (3 digits)
                  </div>
                </div>
              </div>

              <button type="submit" class="btn btn-primary submit-btn">
                Pay Now &middot; \${{ booking.totalPrice }}
              </button>
            </form>
          </div>
        </div>

        <!-- Sidebar Summary Panel -->
        <div class="summary-column" *ngIf="paymentStatus !== 'success'">
          <div class="summary-card glass-panel">
            <h3 class="side-title">Booking Details</h3>
            
            <div class="detail-row">
              <span class="lbl">Reference</span>
              <span class="val">{{ booking.bookingReference }}</span>
            </div>
            <div class="detail-row">
              <span class="lbl">Flight</span>
              <span class="val">{{ booking.flight.flightNumber }} ({{ booking.flight.airline }})</span>
            </div>
            <div class="detail-row">
              <span class="lbl">Route</span>
              <span class="val">{{ booking.flight.origin }} &rarr; {{ booking.flight.destination }}</span>
            </div>
            <div class="detail-row">
              <span class="lbl">Seat</span>
              <span class="val seat-badge">{{ booking.seatNumber }}</span>
            </div>
            <div class="detail-row">
              <span class="lbl">Seat Class</span>
              <span class="val capitalize">{{ booking.seatClass.toLowerCase() }}</span>
            </div>
            
            <div class="divider"></div>
            
            <div class="detail-row total-row">
              <span class="lbl">Total Cost</span>
              <span class="val price-val">\${{ booking.totalPrice }}</span>
            </div>
          </div>
        </div>

      </div>

      <ng-template #loadingTpl>
        <div class="loading-state">
          <div class="spinner large-spinner"></div>
          <p>Retrieving your reservation...</p>
        </div>
      </ng-template>
    </div>
  `,
  styles: [`
    .payment-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 32px;
      align-items: start;
      position: relative;
    }
    @media (max-width: 992px) {
      .payment-grid {
        grid-template-columns: 1fr;
      }
    }
    
    /* Processing Overlay */
    .processing-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(10, 15, 29, 0.9);
      backdrop-filter: blur(8px);
      z-index: 2000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }
    .processing-overlay h4 {
      font-family: var(--font-title);
      font-size: 1.5rem;
    }
    .processing-overlay p {
      color: var(--text-secondary);
    }
    
    /* Confirmation success panel */
    .confirmation-panel {
      grid-column: 1 / -1;
      max-width: 600px;
      margin: 40px auto;
      padding: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      animation: zoomIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    @keyframes zoomIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .success-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--success-glow);
      border: 3px solid var(--success);
      color: var(--success);
      font-size: 2.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      box-shadow: 0 0 20px var(--success-glow);
    }
    .confirm-title {
      font-size: 2.2rem;
      margin-bottom: 8px;
    }
    .confirm-subtitle {
      color: var(--text-secondary);
      margin-bottom: 32px;
    }
    .receipt-box {
      width: 100%;
      background: rgba(15, 23, 42, 0.4);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 32px;
      text-align: left;
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 0.95rem;
    }
    .receipt-row:last-child {
      margin-bottom: 0;
    }
    .receipt-row .label {
      color: var(--text-secondary);
    }
    .receipt-row .value {
      font-weight: 600;
    }
    .ref-val {
      color: #3b82f6;
    }
    .price-lbl {
      color: var(--success);
      font-weight: 700;
    }
    .modal-actions {
      display: flex;
      gap: 16px;
      width: 100%;
    }
    .modal-actions button {
      flex: 1;
    }

    .form-card {
      padding: 40px;
    }
    .title {
      font-family: var(--font-title);
      font-size: 2rem;
      margin-bottom: 4px;
    }
    .subtitle {
      color: var(--text-secondary);
      margin-bottom: 32px;
      font-size: 0.95rem;
    }
    
    /* 3D Card Flip CSS */
    .card-container {
      width: 100%;
      height: 200px;
      perspective: 1000px;
      margin-bottom: 32px;
    }
    .credit-card {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .credit-card.flipped {
      transform: rotateY(180deg);
    }
    .card-side {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .card-front {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #4f46e5 100%);
      color: #fff;
    }
    .card-back {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      transform: rotateY(180deg);
      padding: 0;
      justify-content: start;
    }
    .card-logo {
      font-family: var(--font-title);
      font-weight: 800;
      font-style: italic;
      font-size: 1.5rem;
      align-self: flex-end;
    }
    .card-chip {
      width: 40px;
      height: 30px;
      background: #f59e0b;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .card-num {
      font-family: 'Courier New', Courier, monospace;
      font-size: 1.4rem;
      letter-spacing: 0.1em;
      word-spacing: 0.1em;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
    }
    .card-footer-meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .card-holder, .card-expiry {
      display: flex;
      flex-direction: column;
    }
    .meta-lbl {
      font-size: 0.6rem;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 2px;
    }
    .meta-val {
      font-family: var(--font-title);
      font-weight: 600;
      font-size: 0.85rem;
      letter-spacing: 0.05em;
    }
    
    /* Card back elements */
    .card-magnetic-strip {
      height: 44px;
      background: #000;
      width: 100%;
      margin-top: 24px;
    }
    .card-signature {
      background: #cbd5e1;
      height: 36px;
      width: 75%;
      margin: 20px 24px 0 24px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 12px;
      border-radius: 4px;
    }
    .card-cvv-val {
      color: #000;
      font-family: 'Courier New', Courier, monospace;
      font-weight: 700;
      letter-spacing: 2px;
      font-size: 1rem;
    }
    .card-back-text {
      color: var(--text-muted);
      font-size: 0.55rem;
      margin: 16px 24px 0 24px;
      text-transform: uppercase;
      letter-spacing: 1px;
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
      margin-top: 16px;
    }
    
    .summary-card {
      padding: 32px;
    }
    .side-title {
      font-family: var(--font-title);
      font-size: 1.35rem;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--glass-border);
      padding-bottom: 12px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      font-size: 0.9rem;
    }
    .detail-row .lbl {
      color: var(--text-secondary);
    }
    .detail-row .val {
      font-weight: 600;
    }
    .seat-badge {
      background: var(--secondary-glow);
      border: 1px solid var(--secondary);
      padding: 4px 10px;
      border-radius: 6px;
      color: #a855f7;
    }
    .total-row {
      align-items: center;
    }
    .price-val {
      font-size: 1.5rem;
      font-weight: 800;
      color: #3b82f6;
      font-family: var(--font-title);
    }
    
    .error-msg {
      color: var(--danger);
      font-size: 0.8rem;
      margin-top: 6px;
    }
    .error-border {
      border-color: var(--danger) !important;
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
    .capitalize {
      text-transform: capitalize;
    }
    .loading-state {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 100px;
      gap: 16px;
      color: var(--text-secondary);
    }
    .large-spinner {
      width: 48px;
      height: 48px;
      border-width: 4px;
    }
  `]
})
export class PaymentComponent implements OnInit {
  bookingId!: string;
  booking!: Booking;
  paymentForm!: FormGroup;
  submitted = false;
  processing = false;
  paymentStatus: 'pending' | 'success' | 'failed' = 'pending';
  transactionId = '';
  errorMessage = '';
  isCvvFocused = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') || '';
    if (this.bookingId) {
      this.loadReservation();
    }

    this.paymentForm = this.fb.group({
      cardNumber: ['', [Validators.required, Validators.pattern('^[0-9]{16}$')]],
      expiryDate: ['', [Validators.required, Validators.pattern('^(0[1-9]|1[0-2])\\/?([0-9]{2})$')]],
      cvv: ['', [Validators.required, Validators.pattern('^[0-9]{3}$')]]
    });
  }

  loadReservation(): void {
    this.bookingService.getReservationByReference(this.bookingId)
      .subscribe({
        next: (data) => {
          this.booking = data;
          if (this.booking.status === 'CONFIRMED') {
            this.paymentStatus = 'success';
            this.transactionId = 'ALREADY_PAID';
          }
        },
        error: (err) => {
          console.error('Failed to load reservation', err);
          this.errorMessage = 'Failed to load booking details.';
        }
      });
  }

  get f() { return this.paymentForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.paymentForm.invalid) {
      return;
    }

    this.processing = true;

    const requestPayload = {
      bookingReference: this.booking.bookingReference,
      amount: this.booking.totalPrice,
      paymentMethod: 'Credit Card',
      cardNumber: this.paymentForm.value.cardNumber,
      cvv: this.paymentForm.value.cvv,
      expiryDate: this.paymentForm.value.expiryDate
    };

    // Simulate network latency (2 seconds)
    setTimeout(() => {
      this.paymentService.processPayment(requestPayload)
        .subscribe({
          next: (res) => {
            this.processing = false;
            this.transactionId = res.transactionId;
            if (res.status === 'COMPLETED') {
              this.paymentStatus = 'success';
            } else {
              this.paymentStatus = 'failed';
              this.errorMessage = 'Card payment failed. Please check your details and try again (Do not use test code 0000000000000000).';
            }
          },
          error: (err) => {
            console.error('Payment failed', err);
            this.processing = false;
            this.paymentStatus = 'failed';
            this.errorMessage = err.error?.message || 'Payment server failed to authorize card.';
          }
        });
    }, 2000);
  }

  downloadTicket(): void {
    this.bookingService.generateTicket(this.booking.bookingReference)
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ticket-${this.booking.bookingReference}.html`;
        a.click();
      });
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  // Formatting Helpers
  formatCardNumber(numStr: string): string {
    if (!numStr) return '';
    const matches = numStr.match(/.{1,4}/g);
    return matches ? matches.join(' ') : numStr;
  }
}
