import { Flight } from './flight.model';
import { User } from './user.model';

export interface Passenger {
  fullName: string;
  dateOfBirth?: string;
  passportNumber?: string;
  nationality?: string;
}

export interface ReservationRequest {
  flightId: number;
  seatNumber: string;
  seatClass: 'BUSINESS' | 'ECONOMY';
  passengers: Passenger[];
}

export interface Booking {
  id: number;
  bookingReference: string;
  flight: Flight;
  seatNumber: string;
  seatClass: 'BUSINESS' | 'ECONOMY';
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  bookingDate: string;
  user: User;
  passengers: Passenger[];
}

export interface PaymentRequest {
  bookingReference: string;
  amount: number;
  paymentMethod: string;
  cardNumber?: string;
  cvv?: string;
  expiryDate?: string;
}

export interface PaymentResponse {
  transactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
}
