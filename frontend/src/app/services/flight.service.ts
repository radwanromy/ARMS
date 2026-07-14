import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Flight, SearchCriteria } from '../models/flight.model';
import { API_BASE } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class FlightService {
  private apiUrl = `${API_BASE}/api/flights`;

  constructor(private http: HttpClient) { }

  searchFlights(criteria: SearchCriteria): Observable<Flight[]> {
    let params = new HttpParams()
      .set('origin', criteria.origin)
      .set('destination', criteria.destination)
      .set('date', criteria.departureDate);

    if (criteria.seatClass) {
      params = params.set('seatClass', criteria.seatClass);
    }

    return this.http.get<Flight[]>(`${this.apiUrl}/search`, { params });
  }

  getFlightById(id: number): Observable<Flight> {
    return this.http.get<Flight>(`${this.apiUrl}/${id}`);
  }

  createFlight(flight: Flight): Observable<Flight> {
    return this.http.post<Flight>(`${this.apiUrl}/create`, flight);
  }
}
