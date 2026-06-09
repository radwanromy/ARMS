import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Booking, ReservationRequest } from '../models/booking.model';

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

  generateTicket(bookingRef: string): Observable<Blob> {
    // Generate a beautiful mock HTML boarding pass ticket
    const ticketHtml = `
      <html>
      <head>
        <style>
          body { font-family: 'Outfit', sans-serif; background-color: #0b0f19; color: #fff; padding: 40px; display: flex; justify-content: center; }
          .boarding-pass { border: 2px solid #3b82f6; border-radius: 12px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); width: 600px; padding: 24px; box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2); }
          .header { display: flex; justify-content: space-between; border-bottom: 2px dashed #334155; padding-bottom: 16px; margin-bottom: 16px; }
          .title { font-size: 24px; font-weight: bold; color: #3b82f6; }
          .ref { font-size: 16px; color: #94a3b8; }
          .route { display: flex; justify-content: space-between; align-items: center; margin: 24px 0; }
          .airport { font-size: 32px; font-weight: bold; }
          .arrow { font-size: 24px; color: #3b82f6; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; border-top: 1px solid #334155; padding-top: 16px; }
          .label { color: #64748b; font-size: 12px; text-transform: uppercase; }
          .value { font-size: 16px; font-weight: 600; margin-top: 4px; }
          .footer { margin-top: 32px; text-align: center; border-top: 2px dashed #334155; padding-top: 16px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="boarding-pass">
          <div class="header">
            <span class="title">ARMS BOARDING PASS</span>
            <span class="ref">REF: ${bookingRef}</span>
          </div>
          <div class="route">
            <div>
              <div class="label">DEPARTURE</div>
              <div class="airport">ARMS FLIGHT</div>
            </div>
            <div class="arrow">&rarr;</div>
            <div>
              <div class="label">ARRIVAL</div>
              <div class="airport">DESTINATION</div>
            </div>
          </div>
          <div class="details">
            <div>
              <div class="label">FLIGHT NO</div>
              <div class="value">CONFIRMED</div>
            </div>
            <div>
              <div class="label">CLASS</div>
              <div class="value">SEAT SELECTED</div>
            </div>
          </div>
          <div class="footer">
            Thank you for flying with us. Please present this ticket at the boarding gate.
          </div>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([ticketHtml], { type: 'text/html' });
    return of(blob);
  }
}
