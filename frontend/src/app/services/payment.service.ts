import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentRequest, PaymentResponse } from '../models/booking.model';
import { API_BASE } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${API_BASE}/api/payments`;

  constructor(private http: HttpClient) { }

  processPayment(request: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.apiUrl}/process`, request);
  }
}
