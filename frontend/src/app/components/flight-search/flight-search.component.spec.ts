import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FlightSearchComponent } from './flight-search.component';
import { FlightService } from '../../services/flight.service';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

describe('FlightSearchComponent', () => {
  let component: FlightSearchComponent;
  let fixture: ComponentFixture<FlightSearchComponent>;
  let flightService: jasmine.SpyObj<FlightService>;
  let router: Router;

  beforeEach(async () => {
    const flightSpy = jasmine.createSpyObj('FlightService', ['searchFlights']);

    await TestBed.configureTestingModule({
      declarations: [ FlightSearchComponent ],
      imports: [ ReactiveFormsModule, RouterTestingModule ],
      providers: [
        FormBuilder,
        { provide: FlightService, useValue: flightSpy }
      ]
    })
    .compileComponents();

    flightService = TestBed.inject(FlightService) as jasmine.SpyObj<FlightService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FlightSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.searchForm.get('origin')?.value).toBe('');
    expect(component.searchForm.get('destination')?.value).toBe('');
    expect(component.searchForm.get('seatClass')?.value).toBe('ECONOMY');
    expect(component.searchForm.get('passengers')?.value).toBe(1);
  });

  it('should search flights when form is submitted and valid', () => {
    const mockFlights = [
      { id: 1, flightNumber: 'AA123', airline: 'American', origin: 'New York', destination: 'London', departureTime: '2026-12-25T10:00:00', arrivalTime: '2026-12-25T22:00:00', economyPrice: 500, businessPrice: 1200, totalEconomySeats: 150, totalBusinessSeats: 30, availableEconomySeats: 150, availableBusinessSeats: 30, status: 'SCHEDULED' as const }
    ];
    flightService.searchFlights.and.returnValue(of(mockFlights));

    component.searchForm.setValue({
      origin: 'New York',
      destination: 'London',
      departureDate: '2026-12-25',
      seatClass: 'ECONOMY',
      passengers: 1
    });

    component.searchFlights();

    expect(flightService.searchFlights).toHaveBeenCalled();
    expect(component.flights.length).toBe(1);
    expect(component.flights[0].flightNumber).toBe('AA123');
  });
});
