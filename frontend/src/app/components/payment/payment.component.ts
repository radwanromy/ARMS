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
        <div class="processing-overlay" *ngIf="processing || biometricProcessing">
          <div class="spinner large-spinner"></div>
          <h4 *ngIf="biometricProcessing">Verifying Biometric Credentials...</h4>
          <h4 *ngIf="processing && !biometricProcessing">Authorizing Transaction...</h4>
          <p>Please do not refresh or close this tab.</p>
        </div>

        <!-- Pre-Payment Re-Authentication Modal -->
        <div class="auth-modal-overlay" *ngIf="showAuthModal">
          <div class="auth-modal glass-panel animate-zoom">
            <h3 class="auth-title">🛡️ Security Verification Required</h3>
            <p class="auth-desc">Please complete re-authentication to secure your booking payment.</p>
            
            <div class="auth-toggle">
              <button class="toggle-btn" [class.active]="authMethod === 'password'" (click)="setAuthMethod('password')">Password</button>
              <button class="toggle-btn" [class.active]="authMethod === 'otp'" (click)="setAuthMethod('otp')">One-Time OTP</button>
            </div>

            <!-- Password Re-auth Form -->
            <div *ngIf="authMethod === 'password'" class="auth-body">
              <div class="form-group">
                <label class="form-label" for="reauthPassword">Enter Account Password</label>
                <input type="password" id="reauthPassword" [(ngModel)]="authPassword" class="form-input" placeholder="••••••••">
              </div>
            </div>

            <!-- OTP Re-auth Form -->
            <div *ngIf="authMethod === 'otp'" class="auth-body">
              <div class="otp-actions" *ngIf="!otpSent">
                <p>We will send a 6-digit One-Time Password to your registered contact details.</p>
                <button class="btn btn-primary btn-sm" (click)="sendMockOtp()">Send OTP Code</button>
              </div>
              
              <div *ngIf="otpSent">
                <div class="form-group">
                  <label class="form-label" for="reauthOtp">Enter 6-Digit OTP</label>
                  <input type="text" id="reauthOtp" [(ngModel)]="authOtp" class="form-input text-center" placeholder="123456" maxLength="6">
                </div>
                <p class="otp-hint">Simulated OTP Sent: <strong>{{ sentOtpCode }}</strong></p>
              </div>
            </div>

            <div class="alert alert-danger" *ngIf="authError">
              {{ authError }}
            </div>

            <div class="modal-actions">
              <button class="btn btn-secondary" (click)="cancelAuth()">Cancel</button>
              <button class="btn btn-primary" (click)="verifyAuth()" [disabled]="authMethod === 'otp' && !otpSent">Verify & Authorize</button>
            </div>
          </div>
        </div>

        <!-- Success Modal/State -->
        <div class="confirmation-panel glass-panel" *ngIf="paymentStatus === 'success'">
          <div class="success-icon">&#10004;</div>
          <h2 class="confirm-title gradient-text">Payment Confirmed</h2>
          <p class="confirm-subtitle">Your ticket has been booked successfully!</p>
          
          <div class="receipt-box">
            <div class="receipt-row">
              <span class="label">Outbound Booking Reference</span>
              <span class="value ref-val">{{ booking.bookingReference }}</span>
            </div>
            <div class="receipt-row" *ngIf="returnBooking">
              <span class="label">Return Booking Reference</span>
              <span class="value ref-val">{{ returnBooking.bookingReference }}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Transaction ID</span>
              <span class="value">{{ transactionId }}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Amount Paid</span>
              <span class="value price-lbl">\${{ getCombinedPrice() }}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Payment Method</span>
              <span class="value capitalize">{{ paymentMethod }}</span>
            </div>
            <div class="receipt-row">
              <span class="label">Status</span>
              <span class="value text-success">Paid & Secured via SSL</span>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-secondary" (click)="downloadTicket()">Download Ticket(s)</button>
            <button class="btn btn-primary" (click)="navigate('/my-bookings')">View My Bookings</button>
          </div>
        </div>

        <!-- Main Form Column -->
        <div class="form-column" *ngIf="paymentStatus !== 'success'">
          <div class="form-card glass-panel">
            <h2 class="title">Secure Checkout</h2>
            <p class="subtitle">Select your preferred payment method and authorize.</p>
            
            <div class="alert alert-danger" *ngIf="errorMessage">
              {{ errorMessage }}
            </div>

            <!-- Payment Method Tabs -->
            <div class="payment-method-selector">
              <button class="method-tab" [class.active]="paymentMethod === 'card'" (click)="setPaymentMethod('card')">
                💳 Credit Card
              </button>
              <button class="method-tab" [class.active]="paymentMethod === 'debit'" (click)="setPaymentMethod('debit')">
                🏧 Debit Card
              </button>
              <button class="method-tab" [class.active]="paymentMethod === 'applepay'" (click)="setPaymentMethod('applepay')">
                 Apple Pay
              </button>
              <button class="method-tab" [class.active]="paymentMethod === 'googlepay'" (click)="setPaymentMethod('googlepay')">
                🤖 Google Pay
              </button>
            </div>

            <!-- Card flip illustration (Only for Cards) -->
            <div class="card-container" *ngIf="paymentMethod === 'card' || paymentMethod === 'debit'">
              <div class="credit-card" [class.flipped]="isCvvFocused">
                <!-- Front Side -->
                <div class="card-side card-front">
                  <div class="card-logo">{{ paymentMethod === 'debit' ? 'DEBIT' : 'VISA' }}</div>
                  <div class="card-chip"></div>
                  <div class="card-num">
                    {{ formatCardNumber(paymentForm.value.cardNumber) || '•••• •••• •••• ••••' }}
                  </div>
                  <div class="card-footer-meta">
                    <div class="card-holder">
                      <span class="meta-lbl">Card Holder</span>
                      <span class="meta-val">{{ paymentForm.value.cardholderName || 'CARDHOLDER NAME' | uppercase }}</span>
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

            <!-- Standard Card Form -->
            <form [formGroup]="paymentForm" (ngSubmit)="onPreSubmit()" *ngIf="paymentMethod === 'card' || paymentMethod === 'debit'">
              <div class="form-group">
                <label class="form-label" for="cardholderName">Cardholder Name</label>
                <input 
                  type="text" 
                  id="cardholderName" 
                  formControlName="cardholderName" 
                  class="form-input" 
                  placeholder="John Doe"
                  [class.error-border]="submitted && f['cardholderName'].errors">
                <div *ngIf="submitted && f['cardholderName'].errors" class="error-msg">
                  Cardholder name is required
                </div>
              </div>

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

              <div class="form-group">
                <label class="form-label" for="billingAddress">Billing Address</label>
                <input 
                  type="text" 
                  id="billingAddress" 
                  formControlName="billingAddress" 
                  class="form-input" 
                  placeholder="123 Main St, New York, NY 10001"
                  [class.error-border]="submitted && f['billingAddress'].errors">
                <div *ngIf="submitted && f['billingAddress'].errors" class="error-msg">
                  Billing address is required
                </div>
              </div>

              <button type="submit" class="btn btn-primary submit-btn">
                Verify & Pay &middot; \${{ getCombinedPrice() }}
              </button>
            </form>

            <!-- Express Mobile/Apple Pay Layout -->
            <div class="express-checkout-container" *ngIf="paymentMethod === 'applepay' || paymentMethod === 'googlepay'">
              <div class="express-badge">Express Secure Checkout</div>
              <p>Pay instantly using your default device wallet and biometric signature.</p>
              
              <button class="express-pay-btn" [class.apple]="paymentMethod === 'applepay'" [class.google]="paymentMethod === 'googlepay'" (click)="onExpressPreSubmit()">
                <span *ngIf="paymentMethod === 'applepay'"> Pay with Apple Pay</span>
                <span *ngIf="paymentMethod === 'googlepay'">🤖 Pay with Google Pay</span>
              </button>
            </div>

            <!-- Security Trust Indicators -->
            <div class="security-badges-container">
              <span class="sec-badge">🔒 SSL Secure Payment</span>
              <span class="sec-badge">🛡️ Encrypted Transaction</span>
              <span class="sec-badge">✅ Trusted Gateway</span>
            </div>

          </div>
        </div>

        <!-- Sidebar Summary Panel -->
        <div class="summary-column" *ngIf="paymentStatus !== 'success'">
          <div class="summary-card glass-panel">
            <h3 class="side-title">Booking Details</h3>
            
            <div class="flight-leg-details">
              <span class="flight-leg-title">Outbound Voyage</span>
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
            </div>

            <div class="flight-leg-details mt-4" *ngIf="returnBooking">
              <span class="flight-leg-title">Return Voyage</span>
              <div class="detail-row">
                <span class="lbl">Reference</span>
                <span class="val">{{ returnBooking.bookingReference }}</span>
              </div>
              <div class="detail-row">
                <span class="lbl">Flight</span>
                <span class="val">{{ returnBooking.flight.flightNumber }} ({{ returnBooking.flight.airline }})</span>
              </div>
              <div class="detail-row">
                <span class="lbl">Route</span>
                <span class="val">{{ returnBooking.flight.origin }} &rarr; {{ returnBooking.flight.destination }}</span>
              </div>
              <div class="detail-row">
                <span class="lbl">Seat</span>
                <span class="val seat-badge">{{ returnBooking.seatNumber }}</span>
              </div>
              <div class="detail-row">
                <span class="lbl">Seat Class</span>
                <span class="val capitalize">{{ returnBooking.seatClass.toLowerCase() }}</span>
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="detail-row total-row">
              <span class="lbl">Total Cost</span>
              <span class="val price-val">\${{ getCombinedPrice() }}</span>
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
    
    /* Security Verification Modal */
    .auth-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.7);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1500;
    }
    .auth-modal {
      width: 100%;
      max-width: 450px;
      padding: 30px;
      text-align: center;
      border: 1px solid var(--glass-border);
    }
    .auth-title {
      font-family: var(--font-title);
      font-size: 1.35rem;
      margin-bottom: 8px;
    }
    .auth-desc {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 20px;
    }
    .auth-toggle {
      display: flex;
      background: rgba(255,255,255,0.05);
      border-radius: 8px;
      padding: 4px;
      margin-bottom: 20px;
    }
    .toggle-btn {
      flex: 1;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      padding: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      border-radius: 6px;
    }
    .toggle-btn.active {
      background: var(--primary);
      color: #fff;
    }
    .auth-body {
      margin-bottom: 24px;
      text-align: left;
    }
    .otp-actions {
      text-align: center;
    }
    .otp-actions p {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    .otp-hint {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-top: 10px;
      text-align: center;
    }

    /* Express payment buttons */
    .express-checkout-container {
      text-align: center;
      padding: 30px 10px;
      border: 1.5px dashed var(--glass-border);
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .express-badge {
      display: inline-block;
      padding: 4px 8px;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--primary);
      background: var(--primary-glow);
      border-radius: 4px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .express-checkout-container p {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin-bottom: 20px;
    }
    .express-pay-btn {
      width: 100%;
      height: 48px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1.05rem;
      cursor: pointer;
      border: none;
      transition: transform 0.2s ease;
    }
    .express-pay-btn:hover {
      transform: scale(1.02);
    }
    .express-pay-btn.apple {
      background: #000;
      color: #fff;
    }
    .express-pay-btn.google {
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #cbd5e1;
    }

    /* Security trust badges */
    .security-badges-container {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 24px;
      border-top: 1px solid var(--glass-border);
      padding-top: 20px;
    }
    .sec-badge {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--text-muted);
      display: inline-flex;
      align-items: center;
      gap: 4px;
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
      margin-bottom: 24px;
      font-size: 0.95rem;
    }

    /* Tabs */
    .payment-method-selector {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      overflow-x: auto;
    }
    .method-tab {
      flex: 1;
      padding: 10px;
      background: transparent;
      border: 1px solid var(--glass-border);
      color: var(--text-secondary);
      font-family: var(--font-title);
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      white-space: nowrap;
      transition: var(--transition-fast);
    }
    .method-tab.active {
      background: var(--primary);
      color: #fff;
      border-color: transparent;
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
    .flight-leg-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--primary);
      font-weight: 700;
      margin-bottom: 8px;
      display: block;
    }
    .flight-leg-details {
      padding: 8px 0;
      border-bottom: 1px dashed rgba(255,255,255,0.06);
    }
    .mt-4 { margin-top: 16px; }
  `]
})
export class PaymentComponent implements OnInit {
  bookingId!: string;
  booking!: Booking;
  paymentForm!: FormGroup;
  submitted = false;
  processing = false;
  biometricProcessing = false;
  paymentStatus: 'pending' | 'success' | 'failed' = 'pending';
  transactionId = '';
  errorMessage = '';
  isCvvFocused = false;

  // Enhancements
  paymentMethod: 'card' | 'debit' | 'applepay' | 'googlepay' = 'card';
  showAuthModal = false;
  authMethod: 'password' | 'otp' = 'password';
  authPassword = '';
  authOtp = '';
  otpSent = false;
  sentOtpCode = '';
  authError = '';

  // Round Trip additions
  returnBookingId = '';
  returnBooking: Booking | null = null;
  outboundTransactionId = '';
  returnTransactionId = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') || '';
    
    // Check navigation state or history for return booking reference
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.returnBookingId = navigation.extras.state['returnBookingReference'] || '';
    } else if (history.state) {
      this.returnBookingId = history.state['returnBookingReference'] || '';
    }

    if (this.bookingId) {
      this.loadReservation();
    }

    if (this.returnBookingId) {
      this.loadReturnReservation();
    }

    this.paymentForm = this.fb.group({
      cardholderName: ['', Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern('^[0-9]{16}$')]],
      expiryDate: ['', [Validators.required, Validators.pattern('^(0[1-9]|1[0-2])\\/?([0-9]{2})$')]],
      cvv: ['', [Validators.required, Validators.pattern('^[0-9]{3}$')]],
      billingAddress: ['', Validators.required]
    });
  }

  loadReservation(): void {
    this.bookingService.getReservationByReference(this.bookingId)
      .subscribe({
        next: (data) => {
          this.booking = data;
          if (this.booking.status === 'CONFIRMED' || this.booking.status === 'PAID') {
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

  loadReturnReservation(): void {
    this.bookingService.getReservationByReference(this.returnBookingId)
      .subscribe({
        next: (data) => {
          this.returnBooking = data;
        },
        error: (err) => {
          console.error('Failed to load return reservation', err);
        }
      });
  }

  getCombinedPrice(): number {
    let price = this.booking?.totalPrice || 0;
    if (this.returnBooking) {
      price += this.returnBooking.totalPrice;
    }
    return price;
  }

  setPaymentMethod(method: 'card' | 'debit' | 'applepay' | 'googlepay'): void {
    this.paymentMethod = method;
    this.errorMessage = '';
    
    // Adjust validators dynamically based on selection
    if (method === 'applepay' || method === 'googlepay') {
      this.paymentForm.get('cardholderName')?.clearValidators();
      this.paymentForm.get('cardNumber')?.clearValidators();
      this.paymentForm.get('expiryDate')?.clearValidators();
      this.paymentForm.get('cvv')?.clearValidators();
      this.paymentForm.get('billingAddress')?.clearValidators();
    } else {
      this.paymentForm.get('cardholderName')?.setValidators([Validators.required]);
      this.paymentForm.get('cardNumber')?.setValidators([Validators.required, Validators.pattern('^[0-9]{16}$')]);
      this.paymentForm.get('expiryDate')?.setValidators([Validators.required, Validators.pattern('^(0[1-9]|1[0-2])\\/?([0-9]{2})$')]);
      this.paymentForm.get('cvv')?.setValidators([Validators.required, Validators.pattern('^[0-9]{3}$')]);
      this.paymentForm.get('billingAddress')?.setValidators([Validators.required]);
    }
    
    this.paymentForm.get('cardholderName')?.updateValueAndValidity();
    this.paymentForm.get('cardNumber')?.updateValueAndValidity();
    this.paymentForm.get('expiryDate')?.updateValueAndValidity();
    this.paymentForm.get('cvv')?.updateValueAndValidity();
    this.paymentForm.get('billingAddress')?.updateValueAndValidity();
  }

  get f() { return this.paymentForm.controls; }

  // Re-authentication Controls
  setAuthMethod(method: 'password' | 'otp'): void {
    this.authMethod = method;
    this.authError = '';
    this.authOtp = '';
    this.authPassword = '';
  }

  sendMockOtp(): void {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.sentOtpCode = code;
    this.otpSent = true;
  }

  onPreSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';
    if (this.paymentForm.invalid) {
      return;
    }
    this.showAuthModal = true;
  }

  onExpressPreSubmit(): void {
    this.biometricProcessing = true;
    setTimeout(() => {
      this.biometricProcessing = false;
      this.showAuthModal = true;
    }, 1800);
  }

  cancelAuth(): void {
    this.showAuthModal = false;
    this.authPassword = '';
    this.authOtp = '';
    this.otpSent = false;
    this.authError = '';
  }

  verifyAuth(): void {
    this.authError = '';
    
    if (this.authMethod === 'password') {
      if (!this.authPassword.trim()) {
        this.authError = 'Password is required.';
        return;
      }
      this.showAuthModal = false;
      this.executePayment();
    } else {
      if (this.authOtp !== this.sentOtpCode) {
        this.authError = 'Invalid One-Time Password code. Please enter the correct code.';
        return;
      }
      this.showAuthModal = false;
      this.executePayment();
    }
  }

  executePayment(): void {
    this.processing = true;

    const methodLabel = this.paymentMethod === 'applepay' ? 'Apple Pay' : 
                        this.paymentMethod === 'googlepay' ? 'Google Pay' : 
                        this.paymentMethod === 'debit' ? 'Debit Card' : 'Credit Card';

    const outboundPayload = {
      bookingReference: this.booking.bookingReference,
      amount: this.booking.totalPrice,
      paymentMethod: methodLabel,
      cardNumber: this.paymentForm.value.cardNumber || '4111222233334444',
      cvv: this.paymentForm.value.cvv || '123',
      expiryDate: this.paymentForm.value.expiryDate || '12/28'
    };

    setTimeout(() => {
      this.paymentService.processPayment(outboundPayload)
        .subscribe({
          next: (res) => {
            this.outboundTransactionId = res.transactionId;
            this.transactionId = res.transactionId;

            if (res.status === 'COMPLETED') {
              if (this.returnBooking) {
                const returnPayload = {
                  bookingReference: this.returnBooking.bookingReference,
                  amount: this.returnBooking.totalPrice,
                  paymentMethod: methodLabel,
                  cardNumber: outboundPayload.cardNumber,
                  cvv: outboundPayload.cvv,
                  expiryDate: outboundPayload.expiryDate
                };

                this.paymentService.processPayment(returnPayload).subscribe({
                  next: (retRes) => {
                    this.processing = false;
                    this.returnTransactionId = retRes.transactionId;
                    if (retRes.status === 'COMPLETED') {
                      this.paymentStatus = 'success';
                    } else {
                      this.paymentStatus = 'failed';
                      this.errorMessage = 'Return flight card authorization failed. Please try again.';
                    }
                  },
                  error: (err) => {
                    console.error('Return payment failed', err);
                    this.processing = false;
                    this.paymentStatus = 'failed';
                    this.errorMessage = 'Failed to charge return flight booking.';
                  }
                });
              } else {
                this.processing = false;
                this.paymentStatus = 'success';
              }
            } else {
              this.processing = false;
              this.paymentStatus = 'failed';
              this.errorMessage = 'Card authorization failed. Please try again.';
            }
          },
          error: (err) => {
            console.error('Outbound payment failed', err);
            this.processing = false;
            this.paymentStatus = 'failed';
            this.errorMessage = err.error?.message || 'Payment server failed to authorize outbound transaction.';
          }
        });
    }, 2000);
  }

  downloadTicket(): void {
    this.bookingService.generateTicket(this.booking, this.paymentForm.value.cardNumber || '••••••••••••4111', this.outboundTransactionId || this.transactionId)
      .subscribe(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `e-ticket-outbound-${this.booking.bookingReference}.html`;
        a.click();
      });

    if (this.returnBooking) {
      setTimeout(() => {
        this.bookingService.generateTicket(this.returnBooking!, this.paymentForm.value.cardNumber || '••••••••••••4111', this.returnTransactionId || this.transactionId)
          .subscribe(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `e-ticket-return-${this.returnBooking!.bookingReference}.html`;
            a.click();
          });
      }, 500);
    }
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  formatCardNumber(numStr: string): string {
    if (!numStr) return '';
    const matches = numStr.match(/.{1,4}/g);
    return matches ? matches.join(' ') : numStr;
  }
}
