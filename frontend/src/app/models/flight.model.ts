export interface Flight {
  id?: number;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  economyPrice: number;
  businessPrice: number;
  totalEconomySeats: number;
  totalBusinessSeats: number;
  availableEconomySeats: number;
  availableBusinessSeats: number;
  status: 'SCHEDULED' | 'DELAYED' | 'CANCELLED' | 'COMPLETED';
}

export interface SearchCriteria {
  origin: string;
  destination: string;
  departureDate: string;
  seatClass?: string;
  passengers?: number;
}

export interface Seat {
  row: number;
  column: string;
  class: 'BUSINESS' | 'ECONOMY';
  isAvailable: boolean;
  price: number;
}
