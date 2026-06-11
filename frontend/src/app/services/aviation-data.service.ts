import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface CountryInfo {
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  region: string;
  population: number;
}

export interface LiveWeather {
  temperature: number;
  windSpeed: number;
  conditionText: string;
  conditionIcon: string;
}

@Injectable({
  providedIn: 'root'
})
export class AviationDataService {
  
  // Static registry for fallback countries
  private fallbackCountries: { [key: string]: CountryInfo } = {
    'JP': { name: 'Japan', flag: '🇯🇵', currency: 'Japanese Yen', currencySymbol: '¥', region: 'Asia', population: 125800000 },
    'US': { name: 'United States', flag: '🇺🇸', currency: 'US Dollar', currencySymbol: '$', region: 'Americas', population: 331900000 },
    'GB': { name: 'United Kingdom', flag: '🇬🇧', currency: 'British Pound', currencySymbol: '£', region: 'Europe', population: 67300000 },
    'SG': { name: 'Singapore', flag: '🇸🇬', currency: 'Singapore Dollar', currencySymbol: 'S$', region: 'Asia', population: 5450000 },
    'AE': { name: 'United Arab Emirates', flag: '🇦🇪', currency: 'UAE Dirham', currencySymbol: 'د.إ', region: 'Asia', population: 9900000 }
  };

  // Static registry for airplane specifications
  private aircraftSpecs: { [key: string]: { manufacturer: string; passengerCap: number; rangeNm: number; cruiseSpeedKt: number; averageAge: number } } = {
    'Airbus A350-900': { manufacturer: 'Airbus', passengerCap: 325, rangeNm: 8100, cruiseSpeedKt: 488, averageAge: 3.2 },
    'Boeing 777-300ER': { manufacturer: 'Boeing', passengerCap: 396, rangeNm: 7370, cruiseSpeedKt: 490, averageAge: 9.4 },
    'Airbus A380-800': { manufacturer: 'Airbus', passengerCap: 525, rangeNm: 8000, cruiseSpeedKt: 487, averageAge: 5.6 },
    'Boeing 787-10': { manufacturer: 'Boeing', passengerCap: 330, rangeNm: 6430, cruiseSpeedKt: 488, averageAge: 4.1 },
    'Airbus A340-300': { manufacturer: 'Airbus', passengerCap: 295, rangeNm: 7400, cruiseSpeedKt: 470, averageAge: 18.2 },
    'Boeing 747-8F': { manufacturer: 'Boeing', passengerCap: 0, rangeNm: 4120, cruiseSpeedKt: 490, averageAge: 7.1 },
    'Eurocopter H145': { manufacturer: 'Airbus Helicopters', passengerCap: 8, rangeNm: 350, cruiseSpeedKt: 130, averageAge: 2.3 },
    'Gulfstream G650': { manufacturer: 'Gulfstream Aerospace', passengerCap: 15, rangeNm: 7500, cruiseSpeedKt: 516, averageAge: 6.0 },
    'Mitsubishi F-15J Eagle': { manufacturer: 'Mitsubishi / Boeing', passengerCap: 1, rangeNm: 2500, cruiseSpeedKt: 900, averageAge: 12.8 }
  };

  constructor(private http: HttpClient) {}

  // 1. Fetch Real Country Info from REST Countries API
  getCountryInfo(code: string): Observable<CountryInfo> {
    const cleanCode = code.toUpperCase();
    return this.http.get<any>(`https://restcountries.com/v3.1/alpha/${cleanCode}`).pipe(
      map(data => {
        const country = data[0];
        const currencyKey = Object.keys(country.currencies)[0];
        const currency = country.currencies[currencyKey];
        return {
          name: country.name.common,
          flag: country.flag || country.unicodeFlag || '🏳️',
          currency: currency.name,
          currencySymbol: currency.symbol || '',
          region: country.region,
          population: country.population
        };
      }),
      catchError(() => {
        // Fallback to local registry if API fails or rate limited
        return of(this.fallbackCountries[cleanCode] || {
          name: 'Global Node',
          flag: '🌐',
          currency: 'Global',
          currencySymbol: '$',
          region: 'International',
          population: 0
        });
      })
    );
  }

  // 2. Fetch Real Weather Conditions from Open-Meteo weather API
  getAirportWeather(lat: number, lng: number): Observable<LiveWeather> {
    return this.http.get<any>(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`).pipe(
      map(data => {
        const curr = data.current_weather;
        const temp = Math.round(curr.temperature);
        const wind = Math.round(curr.windspeed);
        const code = curr.weathercode;
        
        let conditionText = 'Clear';
        let conditionIcon = '☀️';

        if (code === 0) { conditionText = 'Clear Sky'; conditionIcon = '☀️'; }
        else if ([1, 2, 3].includes(code)) { conditionText = 'Partly Cloudy'; conditionIcon = '⛅'; }
        else if ([45, 48].includes(code)) { conditionText = 'Foggy'; conditionIcon = '🌫️'; }
        else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) { conditionText = 'Rainy'; conditionIcon = '🌧️'; }
        else if ([71, 73, 75].includes(code)) { conditionText = 'Snowy'; conditionIcon = '❄️'; }
        else if ([95, 96, 99].includes(code)) { conditionText = 'Thunderstorm'; conditionIcon = '⛈️'; }

        return {
          temperature: temp,
          windSpeed: wind,
          conditionText,
          conditionIcon
        };
      }),
      catchError(() => {
        // Fallback mock weather
        return of({
          temperature: 20,
          windSpeed: 10,
          conditionText: 'Overcast',
          conditionIcon: '☁️'
        });
      })
    );
  }

  // 3. Fetch Live Aircraft States from OpenSky Network
  // Bounding box around Japan/East Asia: lamin=20, lomin=120, lamax=50, lomax=150
  getOpenSkyLiveFlights(): Observable<any[]> {
    return this.http.get<any>(`https://opensky-network.org/api/states/all?lamin=20&lomin=120&lamax=50&lomax=150`).pipe(
      map(data => {
        const states = data.states || [];
        // Map OpenSky states structure to aircraft representations
        return states.slice(0, 10).map((state: any) => {
          const callsign = state[1].trim() || 'N/A';
          const heading = Math.round(state[10] || 0);
          const speedKnots = Math.round((state[9] || 0) * 1.94384); // m/s to knots
          const altitudeFeet = Math.round((state[7] || 0) * 3.28084); // meters to feet

          return {
            flightNumber: callsign ? callsign : 'SK' + Math.floor(Math.random() * 900 + 100),
            callsign: callsign,
            airline: this.detectAirline(callsign),
            aircraftType: this.detectAircraftType(altitudeFeet),
            manufacturer: 'Boeing / Airbus',
            registration: state[0].toUpperCase(),
            age: Math.floor(Math.random() * 12) + 1,
            squawk: state[14] || '1200',
            origin: 'HND',
            destination: 'SIN',
            originCity: 'Tokyo',
            destCity: 'Singapore',
            originCoords: [35.5494, 139.7798],
            destCoords: [1.3644, 103.9915],
            pathArcOffset: 4,
            speedKts: speedKnots > 0 ? speedKnots : 450,
            altitudeFt: altitudeFeet > 0 ? altitudeFeet : 34000,
            headingDeg: heading,
            status: 'En Route',
            category: this.detectCategory(callsign),
            viewerCount: Math.floor(Math.random() * 200) + 10,
            progress: 0.3 + Math.random() * 0.4,
            currentCoords: [state[6], state[5]] // lat, lon
          };
        });
      }),
      catchError(() => {
        return of([]); // Return empty array on failure, tracker component will handle merging
      })
    );
  }

  // Helper mapping specs
  getAircraftSpecs(type: string) {
    return this.aircraftSpecs[type] || {
      manufacturer: 'Commercial Jetliner',
      passengerCap: 300,
      rangeNm: 6000,
      cruiseSpeedKt: 480,
      averageAge: 8.5
    };
  }

  private detectAirline(callsign: string): string {
    const prefix = callsign.slice(0, 3).toUpperCase();
    if (prefix === 'JAL' || callsign.startsWith('JL')) return 'Japan Airlines';
    if (prefix === 'ANA' || callsign.startsWith('NH')) return 'All Nippon Airways';
    if (prefix === 'SIA' || callsign.startsWith('SQ')) return 'Singapore Airlines';
    if (prefix === 'UAE' || callsign.startsWith('EK')) return 'Emirates';
    if (prefix === 'DLH' || callsign.startsWith('LH')) return 'Lufthansa';
    if (prefix === 'VLA' || callsign.startsWith('VL')) return 'Volant Airlines';
    if (prefix === 'PAC') return 'Polar Air Cargo';
    return 'International Skies';
  }

  private detectAircraftType(alt: number): string {
    if (alt < 5000) return 'Eurocopter H145';
    if (alt > 40000) return 'Mitsubishi F-15J Eagle';
    if (alt > 38000) return 'Airbus A380-800';
    if (alt > 35000) return 'Airbus A350-900';
    if (alt > 32000) return 'Boeing 787-10';
    return 'Boeing 777-300ER';
  }

  private detectCategory(callsign: string): 'Passenger' | 'Cargo' | 'Military' | 'Helicopter' | 'Private' {
    const callLower = callsign.toLowerCase();
    if (callLower.startsWith('jsdf') || callLower.startsWith('mil')) return 'Military';
    if (callLower.startsWith('pac') || callLower.includes('cargo') || callLower.startsWith('fdx')) return 'Cargo';
    if (callLower.startsWith('helo') || callLower.startsWith('cop')) return 'Helicopter';
    if (callLower.startsWith('pvt') || callLower.startsWith('gulf')) return 'Private';
    return 'Passenger';
  }

  // --- API Lookup Endpoints ---
  searchAirports(query: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/airports/search?query=${query}`);
  }

  searchCountries(query: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/countries/search?query=${query}`);
  }

  searchAirlines(query: string): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/airlines/search?query=${query}`);
  }

  // --- Country Admin Management ---
  getCountries(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/countries`);
  }

  createCountry(country: any): Observable<any> {
    return this.http.post<any>(`http://localhost:8080/api/countries`, country);
  }

  updateCountry(id: number, country: any): Observable<any> {
    return this.http.put<any>(`http://localhost:8080/api/countries/${id}`, country);
  }

  deleteCountry(id: number): Observable<any> {
    return this.http.delete<any>(`http://localhost:8080/api/countries/${id}`);
  }

  // --- Airport Admin Management ---
  getAirports(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/airports`);
  }

  createAirport(airport: any): Observable<any> {
    return this.http.post<any>(`http://localhost:8080/api/airports`, airport);
  }

  updateAirport(id: number, airport: any): Observable<any> {
    return this.http.put<any>(`http://localhost:8080/api/airports/${id}`, airport);
  }

  deleteAirport(id: number): Observable<any> {
    return this.http.delete<any>(`http://localhost:8080/api/airports/${id}`);
  }

  // --- Airline Admin Management ---
  getAirlines(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/airlines`);
  }

  createAirline(airline: any): Observable<any> {
    return this.http.post<any>(`http://localhost:8080/api/airlines`, airline);
  }

  updateAirline(id: number, airline: any): Observable<any> {
    return this.http.put<any>(`http://localhost:8080/api/airlines/${id}`, airline);
  }

  deleteAirline(id: number): Observable<any> {
    return this.http.delete<any>(`http://localhost:8080/api/airlines/${id}`);
  }
}
