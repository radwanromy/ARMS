import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Booking, ReservationRequest } from '../models/booking.model';
import { BRANDING_CONFIG } from '../core/config/branding.config';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = 'http://localhost:8080/api/reservations';

  constructor(private http: HttpClient) { }

  makeReservation(request: ReservationRequest): Observable<Booking> {
    return this.http.post<Booking>(`${this.apiUrl}/reserve`, request);
  }

  getUserBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/user`);
  }

  cancelBooking(bookingRef: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${bookingRef}/cancel`);
  }

  getReservationByReference(bookingRef: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${bookingRef}`);
  }

  getAllReservations(): Observable<Booking[]> {
    return this.http.get<Booking[]>('http://localhost:8080/api/admin/reservations');
  }

  updateReservationStatus(bookingRef: string, status: string): Observable<Booking> {
    return this.http.patch<Booking>(`http://localhost:8080/api/admin/reservations/${bookingRef}/status?status=${status}`, {});
  }

  generateTicket(booking: Booking, cardNumber?: string, transactionId?: string): Observable<Blob> {
    const mainPassenger = booking.passengers && booking.passengers.length > 0
      ? booking.passengers[0]
      : null;

    const passengerName = mainPassenger
      ? mainPassenger.fullName.toUpperCase()
      : `${booking.user?.firstName || 'USER'} ${booking.user?.lastName || ''}`.toUpperCase();

    const passportNo = mainPassenger?.passportNumber || booking.user?.passportNumber || 'N/A';
    const nationality = mainPassenger?.nationality || booking.user?.nationality || 'N/A';

    const depDateObj = new Date(booking.flight.departureTime);
    const arrDateObj = new Date(booking.flight.arrivalTime);
    const bookingDateObj = booking.bookingDate ? new Date(booking.bookingDate) : new Date();

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
    };

    const depTime = formatTime(depDateObj);
    const depDate = formatDate(depDateObj);
    const arrTime = formatTime(arrDateObj);
    const arrDate = formatDate(arrDateObj);
    const bookingDateStr = formatDate(bookingDateObj);

    const ticketNo = `205-92048${booking.id || '29'}592`;
    const baseFare = (booking.totalPrice * 0.85).toFixed(2);
    const taxes = (booking.totalPrice * 0.15).toFixed(2);
    const totalPrice = booking.totalPrice.toFixed(2);

    let formOfPayment = 'CREDIT CARD (SECURED TRANSACTION)';
    if (cardNumber) {
      const cleanedCard = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
      if (cleanedCard.length >= 4) {
        formOfPayment = `VISA •••• •••• •••• ${cleanedCard.substring(cleanedCard.length - 4)}`;
      } else {
        formOfPayment = `CREDIT CARD •••• ${cleanedCard}`;
      }
    } else {
      formOfPayment = 'VISA •••• •••• •••• 4111';
    }

    const txnId = transactionId || `TXN-${booking.bookingReference.substring(3)}-${booking.id || '99'}`;

    const ticketHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Electronic Ticket Receipt - ${booking.bookingReference}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Courier+Prime&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #2563eb;
      --secondary: #64748b;
      --bg-light: #ffffff;
      --bg-card: #f8fafc;
      --text-main: #0f172a;
      --text-secondary: #334155;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #f1f5f9;
      color: var(--text-main);
      font-family: 'Outfit', sans-serif;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
      min-height: 100vh;
      background-image: 
        radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.05) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.05) 0px, transparent 50%);
    }
    .receipt-container {
      width: 760px;
      background: var(--bg-light);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(148, 163, 184, 0.1);
      padding: 40px;
      position: relative;
    }
    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--primary);
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo-img {
      height: 55px;
      width: auto;
      object-fit: contain;
    }
    .document-title {
      text-align: right;
    }
    .document-title h1 {
      font-size: 20px;
      font-weight: 800;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .document-title p {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    
    .notice-box {
      background: rgba(37, 99, 235, 0.04);
      border: 1px solid rgba(37, 99, 235, 0.1);
      border-radius: 8px;
      padding: 14px 20px;
      font-size: 12px;
      color: var(--primary);
      line-height: 1.5;
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: 12px;
      letter-spacing: 0.05em;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    /* Tables styling */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .data-table th {
      background: var(--bg-card);
      color: var(--text-muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
      padding: 10px 16px;
      font-weight: 600;
      border: 1px solid var(--border);
    }
    .data-table td {
      padding: 12px 16px;
      font-size: 13px;
      color: var(--text-main);
      border: 1px solid var(--border);
    }
    .data-table tr:nth-child(even) {
      background: rgba(0, 0, 0, 0.01);
    }
    
    /* Two column grid */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 30px;
    }
    
    .info-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 13px;
    }
    .info-row:last-child {
      margin-bottom: 0;
    }
    .info-lbl {
      color: var(--text-muted);
    }
    .info-val {
      font-weight: 600;
      color: var(--text-secondary);
    }
    
    /* Receipt Details */
    .receipt-details {
      border-top: 1px solid var(--border);
      padding-top: 16px;
      margin-top: 16px;
    }
    .receipt-total {
      font-size: 16px;
      font-weight: 800;
      color: var(--primary);
      border-top: 2px solid var(--border);
      padding-top: 10px;
      margin-top: 10px;
    }
    
    /* Footer Carriage Conditions */
    .conditions-footer {
      border-top: 1px solid var(--border);
      padding-top: 20px;
      margin-top: 40px;
      font-size: 10px;
      color: var(--text-muted);
      line-height: 1.6;
    }
    .conditions-footer h4 {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 8px;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge.confirmed {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
      border: 1px solid var(--success);
    }
    .badge.paid {
      background: rgba(37, 99, 235, 0.1);
      color: var(--primary);
      border: 1px solid var(--primary);
    }
    
    /* Security Stamp & QR Code */
    .security-row {
      display: flex;
      gap: 24px;
      margin-top: 20px;
      align-items: center;
    }
    .security-stamp {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(16, 185, 129, 0.03);
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 8px;
      padding: 12px 16px;
      flex: 1;
    }
    .security-stamp svg {
      width: 24px;
      height: 24px;
      fill: var(--success);
      flex-shrink: 0;
    }
    .security-stamp-text {
      font-size: 11px;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    .qr-container {
      width: 80px;
      height: 80px;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 6px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="receipt-header">
      <div class="brand">
        <img class="brand-logo-img" src="${BRANDING_CONFIG.logoBase64}" alt="Volant Airlines Logo">
      </div>
      <div class="document-title">
        <h1>Electronic Ticket Receipt</h1>
        <p>Booking Reference (PNR): <strong style="color: var(--primary);">${booking.bookingReference}</strong></p>
      </div>
    </div>
    
    <div class="notice-box">
      <strong>Important Notice:</strong> This document is your Electronic Ticket Receipt and Purchase Confirmation. It contains a complete summary of your reservation itinerary, fare details, and payment authorization. Please present a print or digital copy of this document at check-in or security when requested.
    </div>
    
    <div class="grid-2">
      <div class="info-card">
        <div class="section-title">Passenger & Ticket Info</div>
        <div class="info-row">
          <span class="info-lbl">Passenger Name</span>
          <span class="info-val">${passengerName}</span>
        </div>
        <div class="info-row">
          <span class="info-lbl">Ticket Number</span>
          <span class="info-val" style="font-family: 'Courier Prime', monospace; font-size: 12px;">${ticketNo}</span>
        </div>
        <div class="info-row">
          <span class="info-lbl">Passport Number</span>
          <span class="info-val">${passportNo}</span>
        </div>
        <div class="info-row">
          <span class="info-lbl">Nationality</span>
          <span class="info-val">${nationality}</span>
        </div>
      </div>
      
      <div class="info-card">
        <div class="section-title">Booking Details</div>
        <div class="info-row">
          <span class="info-lbl">Booking Reference</span>
          <span class="info-val" style="color: var(--primary);">${booking.bookingReference}</span>
        </div>
        <div class="info-row">
          <span class="info-lbl">Booking Date</span>
          <span class="info-val">${bookingDateStr}</span>
        </div>
        <div class="info-row">
          <span class="info-lbl">Booking Status</span>
          <span class="badge confirmed">Confirmed</span>
        </div>
        <div class="info-row">
          <span class="info-lbl">Assigned Seat</span>
          <span class="info-val">${booking.seatNumber} (${booking.seatClass} Class)</span>
        </div>
      </div>
    </div>
    
    <div class="section-title">Flight Itinerary</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Flight</th>
          <th>Departing</th>
          <th>Arriving</th>
          <th>Class</th>
          <th>Seat</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>${booking.flight.airline}</strong><br>
            <span style="color: var(--primary); font-weight: 600;">${booking.flight.flightNumber}</span>
          </td>
          <td>
            <strong>${booking.flight.origin}</strong><br>
            ${depDate} &middot; ${depTime}
          </td>
          <td>
            <strong>${booking.flight.destination}</strong><br>
            ${arrDate} &middot; ${arrTime}
          </td>
          <td>
            <span style="text-transform: uppercase;">${booking.seatClass}</span>
          </td>
          <td>
            <strong>${booking.seatNumber}</strong>
          </td>
          <td>
            <span class="badge confirmed" style="font-size: 9px;">Confirmed</span>
          </td>
        </tr>
      </tbody>
    </table>
    
    <div class="grid-2">
      <div class="info-card" style="grid-column: 1 / -1;">
        <div class="section-title">Payment & Billing Summary</div>
        <div class="info-row">
          <span class="info-lbl">Base Airfare</span>
          <span class="info-val">$${baseFare}</span>
        </div>
        <div class="info-row">
          <span class="info-lbl">Taxes, Carrier Surcharges & Fees</span>
          <span class="info-val">$${taxes}</span>
        </div>
        <div class="info-row receipt-total">
          <span>Total Amount Charged</span>
          <span>$${totalPrice}</span>
        </div>
        
        <div class="receipt-details">
          <div class="info-row">
            <span class="info-lbl">Form of Payment</span>
            <span class="info-val" style="font-family: 'Courier Prime', monospace; font-size: 12px;">${formOfPayment}</span>
          </div>
          <div class="info-row">
            <span class="info-lbl">Transaction ID</span>
            <span class="info-val" style="font-family: 'Courier Prime', monospace; font-size: 12px; color: var(--text-muted);">${txnId}</span>
          </div>
          <div class="info-row">
            <span class="info-lbl">Payment Status</span>
            <span class="badge paid">Paid & Secured</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="security-row">
      <div class="security-stamp">
        <svg viewBox="0 0 24 24">
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        <div class="security-stamp-text">
          <strong>Secured Transaction Receipt</strong><br>
          This transaction was completed successfully and is secured via 256-bit SSL encryption. All card numbers and personal details are encrypted and masked for confidentiality.
        </div>
      </div>
      
      <div class="qr-container">
        <svg viewBox="0 0 100 100" style="width: 100%; height: 100%; fill: #0f172a;">
          <path d="M0 0h30v30H0zm5 5v20h20V5zm35-5h30v30H40zm5 5v20h20V5zM0 40h30v30H0zm5 5v20h20V5zm45-5h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm-20 10h5v5h-5zm5 0h5v5h-5zm15 0h5v5h-5zm-15 10h5v5h-5zm5 0h5v5h-5zm5 0h5v5h-5zm-15 10h5v5h-5zm15 0h5v5h-5zm10 0h5v5h-5zM0 80h30v30H0zm5 5v20h20V5zm45-5h5v5h-5zm10 0h5v5h-5zm10 0h5v5h-5zm-20 10h5v5h-5zm5 0h5v5h-5zm15 0h5v5h-5zm-15 10h5v5h-5zm5 0h5v5h-5zm5 0h5v5h-5zm-15 10h5v5h-5zm15 0h5v5h-5zm10 0h5v5h-5z" />
        </svg>
      </div>
    </div>
    
    <div class="conditions-footer">
      Condition of Carriage:<br>
      <h4>Notice of Carriage Conditions</h4>
      Carriage and other services provided by the carrier are subject to conditions of carriage, which are incorporated by reference. These conditions may be obtained from the issuing carrier. The itinerary/receipt constitutes the passenger ticket for the purposes of Article 3 of the Warsaw Convention, except where the carrier delivers to the passenger another document complying with the requirements of Article 3. Please ensure to check-in at least 2 hours before international flight departures and 1 hour before domestic departures.
    </div>
  </div>
</body>
</html>
    `;
    const blob = new Blob([ticketHtml], { type: 'text/html' });
    return of(blob);
  }
}
