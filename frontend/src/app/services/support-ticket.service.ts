import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupportTicket, BookingAuditLog } from '../models/support.model';
import { Booking } from '../models/booking.model';
import { API_BASE } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class SupportTicketService {
  private apiTicketUrl = `${API_BASE}/api/support/tickets`;
  private apiResUrl = `${API_BASE}/api/reservations`;

  constructor(private http: HttpClient) { }

  createTicket(ticket: SupportTicket): Observable<SupportTicket> {
    return this.http.post<SupportTicket>(this.apiTicketUrl, ticket);
  }

  getMyTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.apiTicketUrl}/my`);
  }

  getAllTickets(): Observable<SupportTicket[]> {
    return this.http.get<SupportTicket[]>(`${this.apiTicketUrl}/all`);
  }

  assignTicket(id: number, agentUsername: string): Observable<SupportTicket> {
    return this.http.patch<SupportTicket>(`${this.apiTicketUrl}/${id}/assign?agentUsername=${agentUsername}`, {});
  }

  updateTicketStatus(id: number, status: string): Observable<SupportTicket> {
    return this.http.patch<SupportTicket>(`${this.apiTicketUrl}/${id}/status?status=${status}`, {});
  }

  modifyBooking(bookingRef: string, modification: any): Observable<Booking> {
    return this.http.put<Booking>(`${this.apiResUrl}/${bookingRef}/modify`, modification);
  }

  getBookingAuditLogs(bookingRef: string): Observable<BookingAuditLog[]> {
    return this.http.get<BookingAuditLog[]>(`${this.apiResUrl}/${bookingRef}/logs`);
  }
}
