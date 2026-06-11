import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as L from 'leaflet';
import { ThemeService, ColorTheme } from '../../services/theme.service';
import { AviationDataService } from '../../services/aviation-data.service';
import { Subscription } from 'rxjs';

interface Airport {
  name: string;
  iata: string;
  icao: string;
  city: string;
  country: string;
  coords: [number, number];
  weather: string;
  runway: string;
  departures: string[];
  arrivals: string[];
  delayStatus: 'green' | 'yellow' | 'red';
  delayReason?: string;
}

interface FlightSim {
  flightNumber: string;
  callsign: string;
  airline: string;
  aircraftType: string;
  manufacturer: string;
  registration: string;
  age: number;
  squawk: string;
  origin: string; // IATA code
  destination: string; // IATA code
  originCity: string;
  destCity: string;
  originCoords: [number, number];
  destCoords: [number, number];
  pathArcOffset: number; // offset to curve flight path
  speedKts: number;
  altitudeFt: number;
  headingDeg: number;
  status: 'En Route' | 'Delayed' | 'Landed' | 'Scheduled';
  category: 'Passenger' | 'Cargo' | 'Military' | 'Helicopter' | 'Private';
  viewerCount: number;
  progress: number; // 0 to 1
  currentCoords: [number, number];
}

@Component({
  selector: 'app-flight-tracker',
  template: `
    <div class="container">
      <div class="tracker-container glass-panel animate-fade-in" [class.fullscreen-radar]="isFullscreen">
      <!-- Top Tracker Header -->
      <div class="tracker-header">
        <div class="brand-row">
          <span class="pulse-radar-dot"></span>
          <h2 class="section-title gradient-text">Live Flight Radar</h2>
          <span class="badge badge-live">LIVE DATA FEED</span>
        </div>
        <p class="section-subtitle">Real-time aircraft telemetry, flight schedules, and global airspace disruptions.</p>
      </div>

      <!-- Main Radar Workspace -->
      <div class="tracker-workspace">
        
        <!-- LEFT SIDEBAR: Flights & Disruptions -->
        <div class="sidebar left-sidebar glass-sidebar">
          
          <!-- TAB SWITCHER -->
          <div class="sidebar-tabs">
            <button class="tab-btn" [class.active]="leftTab === 'tracked'" (click)="leftTab = 'tracked'">
              🔥 Most Tracked
            </button>
            <button class="tab-btn" [class.active]="leftTab === 'disruptions'" (click)="leftTab = 'disruptions'">
              ⚠️ Disruptions
            </button>
            <button class="tab-btn" [class.active]="leftTab === 'bookmarks'" (click)="leftTab = 'bookmarks'">
              ⭐ Bookmarks ({{ bookmarkedFlights.size }})
            </button>
          </div>

          <!-- TAB CONTENT: MOST TRACKED -->
          <div class="tab-content" *ngIf="leftTab === 'tracked'">
            <div class="tracked-list">
              <div 
                class="tracked-item" 
                *ngFor="let flight of getSortedTrackedFlights(); let idx = index"
                [class.selected]="selectedFlight?.flightNumber === flight.flightNumber"
                (click)="focusOnFlight(flight)">
                <div class="rank">#{{ idx + 1 }}</div>
                <div class="flight-brief">
                  <div class="flight-no">{{ flight.flightNumber }} <span class="badge" [class]="'cat-' + flight.category.toLowerCase()">{{ flight.category }}</span></div>
                  <div class="route">{{ flight.origin }} ➔ {{ flight.destination }}</div>
                </div>
                <div class="viewers">
                  <span class="eye-icon">👁️</span> {{ flight.viewerCount }}
                </div>
              </div>
            </div>
          </div>

          <!-- TAB CONTENT: DISRUPTIONS -->
          <div class="tab-content" *ngIf="leftTab === 'disruptions'">
            <div class="disruption-list">
              <div class="disruption-item" *ngFor="let apt of airports" (click)="focusOnAirport(apt)">
                <div class="disruption-header">
                  <span class="airport-name">{{ apt.city }} ({{ apt.iata }})</span>
                  <span class="status-indicator" [class]="apt.delayStatus"></span>
                </div>
                <div class="disruption-details">
                  <div class="weather-row">☁️ {{ apt.weather }} | Runway: {{ apt.runway }}</div>
                  <div class="delay-reason" *ngIf="apt.delayStatus !== 'green'">
                    <strong>Delays:</strong> {{ apt.delayReason }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB CONTENT: BOOKMARKS -->
          <div class="tab-content" *ngIf="leftTab === 'bookmarks'">
            <div class="bookmarks-list">
              <div class="empty-state" *ngIf="bookmarkedFlights.size === 0">
                <p>No bookmarked flights. Click the star on any flight details page to bookmark it.</p>
              </div>
              <div 
                class="bookmark-item" 
                *ngFor="let flight of getBookmarkedFlightsList()"
                [class.selected]="selectedFlight?.flightNumber === flight.flightNumber"
                (click)="focusOnFlight(flight)">
                <div class="flight-no">{{ flight.flightNumber }} ({{ flight.callsign }})</div>
                <div class="route">{{ flight.origin }} ➔ {{ flight.destination }}</div>
                <button class="remove-bookmark-btn" (click)="toggleBookmark(flight, $event)">★</button>
              </div>
            </div>
          </div>
        </div>

        <!-- CENTER: LEAFLET MAP WITH CONSOLES -->
        <div class="map-workspace">
          <!-- SEARCH & AI ASSISTANT OVERLAY -->
          <div class="top-console glass-overlay">
            <div class="search-bar-row">
              <input 
                type="text" 
                class="console-input" 
                placeholder="Search Flight, Airport, Route (e.g. JL23, HND)..."
                [(ngModel)]="searchQuery"
                (ngModelChange)="onSearchQueryChange()"
                (keydown.enter)="executeSearch()"/>
              <button class="btn-console-search" (click)="executeSearch()">🔍</button>
            </div>
            
            <!-- Autocomplete suggestions -->
            <div class="autocomplete-dropdown" *ngIf="searchSuggestions.length > 0">
              <div 
                class="suggestion-item" 
                *ngFor="let sug of searchSuggestions"
                (click)="selectSuggestion(sug)">
                <span class="sug-type" [class]="sug.type">{{ sug.type.toUpperCase() }}</span>
                <span class="sug-text">{{ sug.text }}</span>
              </div>
            </div>

            <!-- AI ASSISTANT PANEL TOGGLE -->
            <div class="ai-helper-panel">
              <div class="ai-header" (click)="toggleAIHelper()">
                <span class="ai-logo-img">✨</span>
                <span class="ai-title">AI Radar Assistant</span>
                <span class="chevron">{{ aiExpanded ? '▼' : '▲' }}</span>
              </div>
              
              <div class="ai-body" *ngIf="aiExpanded">
                <div class="ai-chat-history" #aiChatHistory>
                  <div class="ai-message" *ngFor="let msg of aiMessages" [class.user]="msg.sender === 'user'">
                    <span class="sender-name">{{ msg.sender === 'user' ? 'You' : 'Radar AI' }}:</span>
                    <p class="message-text">{{ msg.text }}</p>
                  </div>
                </div>
                <div class="ai-input-row">
                  <input 
                    type="text" 
                    class="ai-input" 
                    placeholder="Ask AI: 'Track VL802', 'Show cargo flights'..."
                    [(ngModel)]="aiQuery"
                    (keydown.enter)="sendAIQuery()"/>
                  <button class="btn btn-primary btn-ai-send" (click)="sendAIQuery()">Send</button>
                </div>
              </div>
            </div>
          </div>

          <!-- THE MAP ELEMENT -->
          <div class="leaflet-map-element" id="live-leaflet-radar"></div>

          <!-- FULL SCREEN TOGGLE BUTTON -->
          <button class="btn-fullscreen-toggle" (click)="toggleFullscreen()" title="Toggle Fullscreen Map">
            {{ isFullscreen ? '🗗 Exit Fullscreen' : '🗖 Fullscreen Radar' }}
          </button>
        </div>

        <!-- RIGHT SIDEBAR: Information Dashboard & Alerts -->
        <div class="sidebar right-sidebar glass-sidebar">
          
          <!-- TAB SWITCHER -->
          <div class="sidebar-tabs">
            <button class="tab-btn" [class.active]="rightTab === 'details'" (click)="rightTab = 'details'">
              📝 Details
            </button>
            <button class="tab-btn" [class.active]="rightTab === 'alerts'" (click)="rightTab = 'alerts'">
              🔔 Alerts
            </button>
            <button class="tab-btn" [class.active]="rightTab === 'analytics'" (click)="rightTab = 'analytics'">
              📊 Analytics
            </button>
          </div>

          <!-- TAB CONTENT: DETAILS (AIRCRAFT / AIRPORT) -->
          <div class="tab-content scrollable" *ngIf="rightTab === 'details'">
            <!-- NO SELECTION -->
            <div class="no-selection" *ngIf="!selectedFlight && !selectedAirport">
              <div class="radar-scan-graphic">
                <div class="radar-sweep"></div>
              </div>
              <p class="select-hint">Select an aircraft or airport on the map to display live telemetry & details.</p>
            </div>

            <!-- FLIGHT DETAILS SELECT -->
            <div class="flight-details-view" *ngIf="selectedFlight">
              <div class="detail-header">
                <h3>{{ selectedFlight.flightNumber }}</h3>
                <span class="callsign">{{ selectedFlight.callsign }}</span>
                <button class="bookmark-btn" (click)="toggleBookmark(selectedFlight, $event)">
                  {{ bookmarkedFlights.has(selectedFlight.flightNumber) ? '★ Bookmarked' : '☆ Bookmark' }}
                </button>
              </div>

              <div class="detail-section">
                <h4>Flight Details</h4>
                <div class="detail-grid">
                  <div class="lbl">Airline:</div><div class="val">{{ selectedFlight.airline }}</div>
                  <div class="lbl">Category:</div><div class="val">{{ selectedFlight.category }}</div>
                  <div class="lbl">Status:</div><div class="val status-pill" [class]="selectedFlight.status.toLowerCase().replace(' ', '-')">{{ selectedFlight.status }}</div>
                  <div class="lbl">Route:</div><div class="val bold">{{ selectedFlight.origin }} ➔ {{ selectedFlight.destination }}</div>
                  <div class="lbl">Cities:</div><div class="val">{{ originCountryFlag }} {{ selectedFlight.originCity }} to {{ destCountryFlag }} {{ selectedFlight.destCity }}</div>
                </div>
              </div>

              <div class="detail-section">
                <h4>Aircraft Information</h4>
                <div class="detail-grid">
                  <div class="lbl">Type:</div><div class="val">{{ selectedFlight.aircraftType }}</div>
                  <div class="lbl">Reg:</div><div class="val font-mono">{{ selectedFlight.registration }}</div>
                  <div class="lbl">Manufacturer:</div><div class="val">{{ selectedFlight.manufacturer }}</div>
                  <div class="lbl">Age:</div><div class="val">{{ selectedFlight.age }} years</div>
                </div>
              </div>

              <div class="detail-section">
                <h4>Live Telemetry</h4>
                <div class="detail-grid telemetry-grid">
                  <div class="lbl">Altitude:</div><div class="val neon-cyan">{{ selectedFlight.altitudeFt | number }} ft</div>
                  <div class="lbl">Speed:</div><div class="val neon-green">{{ selectedFlight.speedKts }} kt</div>
                  <div class="lbl">Heading:</div><div class="val">{{ selectedFlight.headingDeg }}°</div>
                  <div class="lbl">Squawk:</div><div class="val font-mono yellow-val">{{ selectedFlight.squawk }}</div>
                  <div class="lbl">Coordinates:</div><div class="val font-mono small-coords">{{ selectedFlight.currentCoords[0] | number:'1.4-4' }}, {{ selectedFlight.currentCoords[1] | number:'1.4-4' }}</div>
                </div>
              </div>
              
              <!-- Arrival Progress -->
              <div class="detail-section">
                <h4>Arrival Progress</h4>
                <div class="progress-bar-container">
                  <div class="progress-fill" [style.width.%]="selectedFlight.progress * 100"></div>
                </div>
                <div class="progress-labels">
                  <span>{{ selectedFlight.origin }}</span>
                  <span>{{ selectedFlight.progress * 100 | number:'1.0-0' }}%</span>
                  <span>{{ selectedFlight.destination }}</span>
                </div>
              </div>
            </div>

            <!-- AIRPORT DETAILS SELECT -->
            <div class="airport-details-view" *ngIf="selectedAirport">
              <div class="detail-header">
                <h3>{{ selectedAirport.name }}</h3>
                <span class="callsign">{{ selectedAirport.iata }} / {{ selectedAirport.icao }}</span>
              </div>

              <div class="detail-section">
                <h4>Airport Details</h4>
                <div class="detail-grid">
                  <div class="lbl">City:</div><div class="val">{{ selectedAirport.city }}</div>
                  <div class="lbl">Country:</div><div class="val">{{ selectedAirport.country }}</div>
                  <div class="lbl">Weather:</div><div class="val">☁️ {{ selectedAirport.weather }}</div>
                  <div class="lbl">Runways:</div><div class="val font-mono">{{ selectedAirport.runway }}</div>
                  <div class="lbl">Delay Status:</div>
                  <div class="val font-bold" [style.color]="selectedAirport.delayStatus === 'red' ? '#ef4444' : selectedAirport.delayStatus === 'yellow' ? '#f59e0b' : '#10b981'">
                    {{ selectedAirport.delayStatus.toUpperCase() }}
                  </div>
                </div>
              </div>

              <div class="detail-section" *ngIf="selectedAirport.delayStatus !== 'green'">
                <h4 style="color:#ef4444;">Disruption Notice</h4>
                <p class="disruption-text">{{ selectedAirport.delayReason }}</p>
              </div>

              <div class="detail-section">
                <h4>Active Schedule</h4>
                <div class="schedule-block">
                  <h5>Active Departures</h5>
                  <ul>
                    <li *ngFor="let dep of selectedAirport.departures">{{ dep }}</li>
                  </ul>
                  <h5 style="margin-top:10px;">Active Arrivals</h5>
                  <ul>
                    <li *ngFor="let arr of selectedAirport.arrivals">{{ arr }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB CONTENT: ALERTS -->
          <div class="tab-content scrollable" *ngIf="rightTab === 'alerts'">
            <div class="alerts-panel">
              <h4>Subscribe to Flight Alerts</h4>
              <p class="alert-desc">Get instant updates on delays, gate changes, takeoff, and landings.</p>
              
              <form [formGroup]="alertForm" (ngSubmit)="subscribeToAlerts()" class="alert-form">
                <div class="form-group">
                  <label class="form-label" for="alertFlight">Flight Number</label>
                  <input type="text" id="alertFlight" formControlName="flightNumber" class="form-input" placeholder="e.g. VL802" />
                </div>
                
                <div class="form-group">
                  <label class="form-label" for="alertEmail">Email Address</label>
                  <input type="email" id="alertEmail" formControlName="email" class="form-input" placeholder="you@example.com" />
                </div>
                
                <div class="form-group">
                  <label class="form-label" for="alertPhone">Phone (SMS) (Optional)</label>
                  <input type="text" id="alertPhone" formControlName="phone" class="form-input" placeholder="+1 555-0199" />
                </div>

                <div class="checkbox-group">
                  <label><input type="checkbox" formControlName="onTakeoff" /> Takeoff alerts</label>
                  <label><input type="checkbox" formControlName="onDelay" /> Delay alerts</label>
                  <label><input type="checkbox" formControlName="onArrival" /> Arrival alerts</label>
                </div>

                <button type="submit" class="btn btn-primary btn-alert-submit" [disabled]="alertForm.invalid">
                  Subscribe Alerts
                </button>
              </form>
              
              <div class="success-message-alert" *ngIf="alertSubscribed">
                ✅ Subscription registered! You will receive notifications for {{ alertForm.value.flightNumber }}.
              </div>
            </div>
          </div>

          <!-- TAB CONTENT: ANALYTICS & ADMIN -->
          <div class="tab-content scrollable" *ngIf="rightTab === 'analytics'">
            <div class="analytics-panel">
              <h4>Airspace Health & Analytics</h4>
              
              <div class="stat-card">
                <span class="stat-title">Simulated Traffic Count</span>
                <span class="stat-value neon-cyan">{{ flights.length }} Flights</span>
              </div>

              <div class="stat-card">
                <span class="stat-title">Active Simulated Users</span>
                <span class="stat-value neon-green">14,832 Online</span>
              </div>

              <div class="stat-card">
                <span class="stat-title">Airspace Disruption Ratio</span>
                <span class="stat-value yellow-val">22.4% Delayed</span>
              </div>

              <div class="analytics-section">
                <h5>Popular Routes Today</h5>
                <ul class="popular-routes">
                  <li><strong>Tokyo HND ➔ London LHR:</strong> 4 daily flights</li>
                  <li><strong>Tokyo HND ➔ New York JFK:</strong> 6 daily flights</li>
                  <li><strong>Singapore SIN ➔ Tokyo NRT:</strong> 8 daily flights</li>
                  <li><strong>Dubai DXB ➔ Tokyo NRT:</strong> 3 daily flights</li>
                </ul>
              </div>

              <div class="analytics-section">
                <h5>System Feed Health</h5>
                <div class="health-indicators">
                  <div class="health-row"><span>ADS-B Data Integrator:</span> <span class="health-dot active"></span> 100%</div>
                  <div class="health-row"><span>OpenSky API bridge:</span> <span class="health-dot active"></span> 99.8%</div>
                  <div class="health-row"><span>AviationStack DB:</span> <span class="health-dot active"></span> 100%</div>
                  <div class="health-row"><span>Weather Radar Feed:</span> <span class="health-dot active"></span> 98.4%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- BOTTOM TOOLBAR: Playback & Filter Controls -->
      <div class="tracker-footer">
        
        <!-- ROW 1: Control Categories -->
        <div class="toolbar-sections">
          
          <!-- PLAYBACK CONTROLS -->
          <div class="toolbar-card playback-card">
            <h4>📅 Flight Playback System</h4>
            <div class="playback-controls-row">
              <button class="btn-play-toggle" (click)="togglePlayback()">
                {{ isPaused ? '▶️ Play' : '⏸️ Pause' }}
              </button>
              <div class="timeline-slider-col">
                <span class="time-label">{{ getSimulationTimeFormatted() }}</span>
                <input 
                  type="range" 
                  class="timeline-slider" 
                  min="0" 
                  max="100" 
                  step="1"
                  [(ngModel)]="playbackProgress" 
                  (ngModelChange)="onTimelineSliderChange()"/>
              </div>
              <div class="speed-selector">
                <span class="lbl-speed">Speed:</span>
                <select class="speed-select" [(ngModel)]="playbackSpeed" (ngModelChange)="onPlaybackSpeedChange()">
                  <option [value]="1">1x</option>
                  <option [value]="2">2x</option>
                  <option [value]="4">4x</option>
                  <option [value]="8">8x</option>
                  <option [value]="16">16x</option>
                </select>
              </div>
            </div>
          </div>

          <!-- WEATHER OVERLAYS -->
          <div class="toolbar-card weather-card">
            <h4>☁️ Weather Layers</h4>
            <div class="weather-buttons">
              <button class="layer-toggle-btn" [class.active]="weatherLayers.clouds" (click)="toggleWeatherLayer('clouds')">
                ☁️ Clouds
              </button>
              <button class="layer-toggle-btn" [class.active]="weatherLayers.rain" (click)="toggleWeatherLayer('rain')">
                🌧️ Rain Radar
              </button>
              <button class="layer-toggle-btn" [class.active]="weatherLayers.turbulence" (click)="toggleWeatherLayer('turbulence')">
                🌀 Turbulence
              </button>
              <button class="layer-toggle-btn" [class.active]="weatherLayers.storms" (click)="toggleWeatherLayer('storms')">
                ⚡ Storms
              </button>
            </div>
          </div>

          <!-- ADVANCED FILTERS -->
          <div class="toolbar-card filters-card">
            <h4>⚙️ Advanced Radar Filters</h4>
            <div class="filters-row">
              <div class="filter-col">
                <label>Category:</label>
                <select [(ngModel)]="filterCategory" (ngModelChange)="applyMapFilters()">
                  <option value="All">All Categories</option>
                  <option value="Passenger">Passenger Only</option>
                  <option value="Cargo">Cargo Only</option>
                  <option value="Military">Military Only</option>
                  <option value="Helicopter">Helicopters Only</option>
                  <option value="Private">Private Jets Only</option>
                </select>
              </div>
              <div class="filter-col">
                <label>Min Altitude: {{ filterMinAlt }}k ft</label>
                <input type="range" min="0" max="40" step="5" [(ngModel)]="filterMinAlt" (ngModelChange)="applyMapFilters()"/>
              </div>
              <div class="filter-col">
                <label>Airline:</label>
                <select [(ngModel)]="filterAirline" (ngModelChange)="applyMapFilters()">
                  <option value="All">All Airlines</option>
                  <option value="Volant">Volant Airlines</option>
                  <option value="Japan Airlines">Japan Airlines</option>
                  <option value="Emirates">Emirates</option>
                  <option value="Singapore Airlines">Singapore Airlines</option>
                  <option value="Lufthansa">Lufthansa</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  `,
  styles: [`
    /* Outer Container styling (Theme Adapting) */
    .tracker-container {
      margin-top: 30px;
      margin-bottom: 50px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      transition: var(--transition-smooth);
    }
    
    .tracker-header {
      margin-bottom: 20px;
      border-bottom: 1px solid var(--glass-border);
      padding-bottom: 16px;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 4px;
    }
    .pulse-radar-dot {
      width: 12px;
      height: 12px;
      background: #ef4444;
      border-radius: 50%;
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
      animation: pulse-dot-effect 1.8s infinite;
    }
    @keyframes pulse-dot-effect {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    
    .section-title {
      font-size: 1.8rem;
      margin: 0;
    }
    .badge-live {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid #ef4444;
      color: #f87171;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }
    .section-subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
      margin: 0;
    }

    /* main workspace structure */
    .tracker-workspace {
      display: flex;
      gap: 20px;
      height: 600px;
      margin-bottom: 24px;
    }
    @media (max-width: 1024px) {
      .tracker-workspace {
        flex-direction: column;
        height: auto;
      }
      .sidebar {
        width: 100% !important;
        height: 250px !important;
      }
      .map-workspace {
        height: 500px !important;
      }
    }
    
    .sidebar {
      width: 280px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex-shrink: 0;
    }
    .glass-sidebar {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 12px;
    }
    
    /* sidebar tabs */
    .sidebar-tabs {
      display: flex;
      border-bottom: 1px solid var(--glass-border);
      background: var(--bg-secondary);
    }
    .tab-btn {
      flex: 1;
      padding: 10px 4px;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      color: var(--primary);
      background: var(--primary-glow);
      border-bottom: 2px solid var(--primary);
    }
    
    .tab-content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }
    .tab-content.scrollable {
      overflow-y: auto;
    }

    /* MOST TRACKED LIST */
    .tracked-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .tracked-item {
      display: flex;
      align-items: center;
      background: var(--bg-primary);
      border: 1px solid var(--glass-border);
      padding: 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tracked-item:hover, .tracked-item.selected {
      background: var(--primary-glow);
      border-color: var(--primary);
    }
    .tracked-item .rank {
      font-weight: 800;
      color: var(--primary);
      width: 30px;
      font-size: 0.95rem;
    }
    .flight-brief {
      flex: 1;
    }
    .flight-no {
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--text-primary);
    }
    .route {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .viewers {
      font-size: 0.8rem;
      color: #10b981;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .badge {
      font-size: 0.65rem;
      padding: 1px 4px;
      border-radius: 4px;
      font-weight: 600;
    }
    .cat-cargo { background: rgba(249, 115, 22, 0.2); color: #fb923c; border: 1px solid #f97316; }
    .cat-passenger { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; }
    .cat-military { background: rgba(148, 163, 184, 0.2); color: #cbd5e1; border: 1px solid #94a3b8; }
    .cat-helicopter { background: rgba(234, 179, 8, 0.2); color: #fde047; border: 1px solid #eab308; }
    .cat-private { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid #a855f7; }

    /* DISRUPTIONS LIST */
    .disruption-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .disruption-item {
      background: var(--bg-primary);
      border: 1px solid var(--glass-border);
      border-left: 4px solid #10b981;
      padding: 8px 10px;
      border-radius: 4px;
      cursor: pointer;
      color: var(--text-primary);
    }
    .disruption-item:hover {
      background: var(--bg-secondary);
    }
    .disruption-header {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 2px;
    }
    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .status-indicator.green { background: #10b981; }
    .status-indicator.yellow { background: #f59e0b; }
    .status-indicator.red { background: #ef4444; }
    
    .disruption-item:has(.status-indicator.yellow) { border-left-color: #f59e0b; }
    .disruption-item:has(.status-indicator.red) { border-left-color: #ef4444; }
    
    .disruption-details {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .delay-reason {
      color: #f87171;
      margin-top: 4px;
    }

    /* BOOKMARKS LIST */
    .bookmarks-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .bookmark-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-primary);
      border: 1px solid var(--glass-border);
      padding: 8px 10px;
      border-radius: 6px;
      cursor: pointer;
      color: var(--text-primary);
    }
    .bookmark-item.selected {
      background: var(--primary-glow);
      border: 1px solid var(--primary);
    }
    .bookmark-item:hover {
      background: var(--bg-secondary);
    }
    .remove-bookmark-btn {
      background: transparent;
      border: none;
      color: #eab308;
      cursor: pointer;
      font-size: 1.1rem;
    }

    /* MAP WORKSPACE */
    .map-workspace {
      flex: 1;
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--glass-border);
      background: #030712;
    }
    .leaflet-map-element {
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    
    /* TOP OVERLAY PANELS ON MAP */
    .top-console {
      position: absolute;
      top: 15px;
      left: 15px;
      right: 15px;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 420px;
      pointer-events: auto;
    }
    .glass-overlay {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      padding: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    }
    
    .search-bar-row {
      display: flex;
      gap: 6px;
    }
    .console-input {
      flex: 1;
      background: var(--bg-primary);
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      padding: 8px 12px;
      color: var(--text-primary);
      font-size: 0.85rem;
      outline: none;
    }
    .console-input:focus {
      border-color: var(--primary);
    }
    .btn-console-search {
      background: var(--bg-secondary);
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
      padding: 0 12px;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-console-search:hover {
      background: var(--primary-glow);
    }
    
    /* AUTOCOMPLETE DROPDOWN */
    .autocomplete-dropdown {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      max-height: 200px;
      overflow-y: auto;
    }
    .suggestion-item {
      padding: 8px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      border-bottom: 1px solid var(--glass-border);
    }
    .suggestion-item:hover {
      background: var(--primary-glow);
    }
    .sug-type {
      font-size: 0.65rem;
      padding: 1px 4px;
      border-radius: 3px;
      font-weight: 700;
    }
    .sug-type.flight { background: #3b82f6; color: white; }
    .sug-type.airport { background: #10b981; color: white; }
    .sug-text {
      color: var(--text-secondary);
    }

    /* AI FLIGHT ASSISTANT PANEL */
    .ai-helper-panel {
      border-top: 1px solid var(--glass-border);
      padding-top: 6px;
      margin-top: 4px;
    }
    .ai-header {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--primary);
      justify-content: space-between;
    }
    .ai-logo-img {
      color: var(--primary);
      font-weight: bold;
      margin-right: 6px;
    }
    .ai-title {
      flex: 1;
    }
    .ai-body {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-top: 8px;
    }
    .ai-chat-history {
      background: var(--bg-secondary);
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      padding: 8px;
      max-height: 120px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ai-message {
      font-size: 0.75rem;
      line-height: 1.3;
    }
    .ai-message.user {
      text-align: right;
    }
    .ai-message .sender-name {
      font-weight: 700;
      color: var(--primary);
      margin-right: 4px;
    }
    .ai-message.user .sender-name {
      color: var(--success);
    }
    .ai-message .message-text {
      display: inline-block;
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 4px 8px;
      border-radius: 6px;
      margin: 0;
      text-align: left;
    }
    .ai-message.user .message-text {
      background: var(--success-glow);
    }
    .ai-input-row {
      display: flex;
      gap: 6px;
    }
    .ai-input {
      flex: 1;
      background: var(--bg-primary);
      border: 1px solid var(--glass-border);
      border-radius: 4px;
      padding: 6px 10px;
      color: var(--text-primary);
      font-size: 0.75rem;
      outline: none;
    }
    .btn-ai-send {
      padding: 4px 10px;
      font-size: 0.75rem;
      border-radius: 4px;
    }

    /* FULLSCREEN MAP TOGGLE */
    .btn-fullscreen-toggle {
      position: absolute;
      bottom: 15px;
      right: 15px;
      z-index: 1000;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .btn-fullscreen-toggle:hover {
      background: var(--primary-glow);
    }
    
    /* Fullscreen Mode Styling override */
    .tracker-container.fullscreen-radar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      margin: 0;
      border-radius: 0;
    }
    .tracker-container.fullscreen-radar .tracker-workspace {
      height: calc(100% - 130px);
    }

    /* RIGHT SIDEBAR: Telemetry details */
    .no-selection {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 20px;
      color: var(--text-muted);
    }
    .radar-scan-graphic {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 2px solid var(--primary-glow);
      position: relative;
      margin-bottom: 20px;
      overflow: hidden;
    }
    .radar-scan-graphic::before {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 1px dashed var(--primary);
      top: -1px; left: -1px;
      transform: scale(0.6);
      opacity: 0.4;
    }
    .radar-sweep {
      position: absolute;
      width: 50%;
      height: 50%;
      background: linear-gradient(45deg, var(--primary-glow) 0%, transparent 100%);
      transform-origin: bottom right;
      top: 0; left: 0;
      animation: radar-sweep-anim 3s infinite linear;
    }
    @keyframes radar-sweep-anim {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .select-hint {
      font-size: 0.8rem;
    }
    
    .flight-details-view, .airport-details-view {
      display: flex;
      flex-direction: column;
      gap: 16px;
      color: var(--text-primary);
    }
    .detail-header {
      border-bottom: 1px solid var(--glass-border);
      padding-bottom: 12px;
    }
    .detail-header h3 {
      font-size: 1.3rem;
      margin: 0;
    }
    .detail-header .callsign {
      color: var(--primary);
      font-weight: 700;
      font-size: 0.9rem;
    }
    .bookmark-btn {
      background: rgba(234, 179, 8, 0.1);
      border: 1px solid #eab308;
      color: #f59e0b;
      font-size: 0.7rem;
      padding: 3px 8px;
      border-radius: 4px;
      margin-left: 10px;
      cursor: pointer;
    }
    
    .detail-section h4 {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary);
      border-left: 3px solid var(--primary);
      padding-left: 6px;
      margin-bottom: 8px;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 90px 1fr;
      gap: 6px 12px;
      font-size: 0.8rem;
    }
    .detail-grid .lbl {
      color: var(--text-muted);
    }
    .detail-grid .val {
      font-weight: 600;
    }
    .detail-grid .val.status-pill {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
      width: fit-content;
    }
    .detail-grid .val.status-pill.en-route { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .detail-grid .val.status-pill.delayed { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .detail-grid .val.status-pill.landed { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
    
    .neon-cyan { color: #06b6d4; text-shadow: 0 0 5px rgba(6, 182, 212, 0.2); }
    .neon-green { color: #10b981; text-shadow: 0 0 5px rgba(16, 185, 129, 0.2); }
    .yellow-val { color: #f59e0b; }
    .font-mono { font-family: monospace; font-size: 0.85rem; }
    .small-coords { font-size: 0.75rem; }
    
    .progress-bar-container {
      background: var(--bg-secondary);
      height: 6px;
      border-radius: 3px;
      overflow: hidden;
      margin-top: 6px;
    }
    .progress-fill {
      background: linear-gradient(90deg, var(--success), var(--primary));
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }
    .progress-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-top: 4px;
    }
    
    .disruption-text {
      font-size: 0.75rem;
      background: var(--danger-glow);
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      padding: 8px;
      color: var(--danger);
    }
    .schedule-block h5 {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .schedule-block ul {
      list-style: none;
      padding-left: 4px;
      font-size: 0.75rem;
    }
    .schedule-block ul li {
      padding: 2px 0;
      border-bottom: 1px solid var(--glass-border);
    }

    /* ALERTS TAB FORM */
    .alerts-panel h4, .analytics-panel h4 {
      margin-bottom: 8px;
      color: var(--text-primary);
    }
    .alert-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 15px;
    }
    .alert-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin: 8px 0;
    }
    .checkbox-group label {
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }
    .btn-alert-submit {
      width: 100%;
      height: 38px;
      font-size: 0.85rem;
    }
    .success-message-alert {
      margin-top: 12px;
      font-size: 0.75rem;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 8px;
      border-radius: 6px;
      color: #34d399;
    }

    /* ANALYTICS PANEL */
    .stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--glass-border);
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 10px;
      display: flex;
      flex-direction: column;
    }
    .stat-title {
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .stat-value {
      font-size: 1.15rem;
      font-weight: 700;
    }
    
    .analytics-section {
      margin-top: 15px;
    }
    .analytics-section h5 {
      font-size: 0.75rem;
      color: var(--text-primary);
      border-bottom: 1px solid var(--glass-border);
      padding-bottom: 4px;
      margin-bottom: 6px;
    }
    .popular-routes {
      list-style: none;
      font-size: 0.75rem;
      padding-left: 2px;
    }
    .popular-routes li {
      padding: 3px 0;
    }
    .health-indicators {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .health-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .health-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
      display: inline-block;
      box-shadow: 0 0 5px rgba(239, 68, 68, 0.5);
    }
    .health-dot.active {
      background: #10b981;
      box-shadow: 0 0 5px rgba(16, 185, 129, 0.5);
    }

    /* BOTTOM TOOLBAR styling */
    .tracker-footer {
      border-top: 1px solid var(--glass-border);
      padding-top: 16px;
    }
    .toolbar-sections {
      display: grid;
      grid-template-columns: 1.2fr 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 900px) {
      .toolbar-sections {
        grid-template-columns: 1fr;
      }
    }
    
    .toolbar-card {
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 10px;
      padding: 12px;
    }
    .toolbar-card h4 {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    /* Playback controls layout */
    .playback-controls-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-play-toggle {
      background: var(--primary-glow);
      border: 1px solid var(--primary);
      color: var(--text-primary);
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .btn-play-toggle:hover {
      background: var(--primary);
      color: #fff;
    }
    .timeline-slider-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .time-label {
      font-size: 0.7rem;
      font-family: monospace;
      color: var(--text-muted);
    }
    .timeline-slider {
      width: 100%;
      height: 4px;
      border-radius: 2px;
      outline: none;
      background: var(--bg-secondary);
      cursor: pointer;
    }
    .speed-selector {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .lbl-speed {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .speed-select {
      background: var(--bg-primary);
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
      border-radius: 4px;
      padding: 2px 4px;
      font-size: 0.75rem;
    }

    /* Weather Layers */
    .weather-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .layer-toggle-btn {
      background: var(--bg-primary);
      border: 1px solid var(--glass-border);
      color: var(--text-secondary);
      padding: 6px;
      font-size: 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    .layer-toggle-btn.active {
      background: var(--success-glow);
      border-color: var(--success);
      color: var(--success);
    }
    .layer-toggle-btn:hover {
      background: var(--bg-secondary);
    }

    /* Filters Row */
    .filters-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .filter-col {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }
    .filter-col label {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .filter-col select {
      background: var(--bg-primary);
      border: 1px solid var(--glass-border);
      color: var(--text-primary);
      border-radius: 4px;
      padding: 3px 6px;
      font-size: 0.75rem;
      width: 110px;
    }
    .filter-col input[type="range"] {
      width: 90px;
      height: 4px;
    }
  `]
})
export class FlightTrackerComponent implements OnInit, AfterViewInit, OnDestroy {
  leftTab: 'tracked' | 'disruptions' | 'bookmarks' = 'tracked';
  rightTab: 'details' | 'alerts' | 'analytics' = 'details';

  originCountryFlag = '';
  destCountryFlag = '';

  searchQuery = '';
  searchSuggestions: { type: 'flight' | 'airport', text: string, item: any }[] = [];

  // Map settings
  map!: L.Map;
  isFullscreen = false;
  selectedFlight: FlightSim | null = null;
  selectedAirport: Airport | null = null;
  bookmarkedFlights = new Set<string>();

  // Alerts
  alertForm: FormGroup;
  alertSubscribed = false;

  // Filters
  filterCategory = 'All';
  filterMinAlt = 0;
  filterAirline = 'All';

  // Playback & Sim Settings
  isPaused = false;
  playbackProgress = 50; // starts mid-way
  playbackSpeed = 1;
  simTime = new Date();
  playbackTimer: any;

  // Theme subscription
  private themeSub!: Subscription;
  private tileLayer!: L.TileLayer;

  // Weather toggle layers
  weatherLayers = {
    clouds: false,
    rain: false,
    turbulence: false,
    storms: false
  };

  // Weather graphic handles
  weatherOverlays: L.Layer[] = [];

  // AI Assistant Console
  aiExpanded = false;
  aiQuery = '';
  aiMessages: { sender: 'user' | 'ai', text: string }[] = [
    { sender: 'ai', text: 'Hello! I am your AI Space Radar. Ask me to "track VL802", "find cargo flights", or "show delayed airports" to adjust your map.' }
  ];

  @ViewChild('aiChatHistory') private aiChatHistoryContainer!: ElementRef;

  // Flight Sim Data
  flights: FlightSim[] = [
    {
      flightNumber: 'VL802',
      callsign: 'VOLANT802',
      airline: 'Volant Airlines',
      aircraftType: 'Airbus A350-900',
      manufacturer: 'Airbus',
      registration: 'VN-A899',
      age: 3,
      squawk: '7701',
      origin: 'HND',
      destination: 'LHR',
      originCity: 'Tokyo',
      destCity: 'London',
      originCoords: [35.5494, 139.7798],
      destCoords: [51.4700, -0.4543],
      pathArcOffset: 12,
      speedKts: 470,
      altitudeFt: 37000,
      headingDeg: 335,
      status: 'En Route',
      category: 'Passenger',
      viewerCount: 2450,
      progress: 0.42,
      currentCoords: [0, 0]
    },
    {
      flightNumber: 'JL23',
      callsign: 'JAL23',
      airline: 'Japan Airlines',
      aircraftType: 'Boeing 777-300ER',
      manufacturer: 'Boeing',
      registration: 'JA732J',
      age: 9,
      squawk: '1205',
      origin: 'HND',
      destination: 'JFK',
      originCity: 'Tokyo',
      destCity: 'New York',
      originCoords: [35.5494, 139.7798],
      destCoords: [40.6413, -73.7781],
      pathArcOffset: 15,
      speedKts: 490,
      altitudeFt: 35000,
      headingDeg: 45,
      status: 'En Route',
      category: 'Passenger',
      viewerCount: 1820,
      progress: 0.65,
      currentCoords: [0, 0]
    },
    {
      flightNumber: 'EK318',
      callsign: 'EMIRATES318',
      airline: 'Emirates',
      aircraftType: 'Airbus A380-800',
      manufacturer: 'Airbus',
      registration: 'A6-EVG',
      age: 5,
      squawk: '4223',
      origin: 'DXB',
      destination: 'NRT',
      originCity: 'Dubai',
      destCity: 'Tokyo',
      originCoords: [25.2532, 55.3657],
      destCoords: [35.7720, 140.3929],
      pathArcOffset: -8,
      speedKts: 510,
      altitudeFt: 39000,
      headingDeg: 82,
      status: 'En Route',
      category: 'Passenger',
      viewerCount: 940,
      progress: 0.28,
      currentCoords: [0, 0]
    },
    {
      flightNumber: 'SQ638',
      callsign: 'SINGAPORE638',
      airline: 'Singapore Airlines',
      aircraftType: 'Boeing 787-10',
      manufacturer: 'Boeing',
      registration: '9V-SCA',
      age: 4,
      squawk: '3104',
      origin: 'SIN',
      destination: 'NRT',
      originCity: 'Singapore',
      destCity: 'Tokyo',
      originCoords: [1.3644, 103.9915],
      destCoords: [35.7720, 140.3929],
      pathArcOffset: 5,
      speedKts: 460,
      altitudeFt: 36000,
      headingDeg: 35,
      status: 'En Route',
      category: 'Passenger',
      viewerCount: 1205,
      progress: 0.78,
      currentCoords: [0, 0]
    },
    {
      flightNumber: 'LH714',
      callsign: 'LUFTHANSA714',
      airline: 'Lufthansa',
      aircraftType: 'Airbus A340-300',
      manufacturer: 'Airbus',
      registration: 'D-AIGW',
      age: 18,
      squawk: '2217',
      origin: 'HND',
      destination: 'FRA',
      originCity: 'Tokyo',
      destCity: 'Frankfurt',
      originCoords: [35.5494, 139.7798],
      destCoords: [50.0379, 8.5622],
      pathArcOffset: 10,
      speedKts: 450,
      altitudeFt: 34000,
      headingDeg: 320,
      status: 'Delayed',
      category: 'Passenger',
      viewerCount: 710,
      progress: 0.15,
      currentCoords: [0, 0]
    },
    {
      flightNumber: 'PAC982',
      callsign: 'POLAR982',
      airline: 'Polar Air Cargo',
      aircraftType: 'Boeing 747-8F',
      manufacturer: 'Boeing',
      registration: 'N858GT',
      age: 7,
      squawk: '5150',
      origin: 'ANC',
      destination: 'NRT',
      originCity: 'Anchorage',
      destCity: 'Tokyo',
      originCoords: [61.1742, -149.9963],
      destCoords: [35.7720, 140.3929],
      pathArcOffset: 10,
      speedKts: 485,
      altitudeFt: 32000,
      headingDeg: 230,
      status: 'En Route',
      category: 'Cargo',
      viewerCount: 1480,
      progress: 0.52,
      currentCoords: [0, 0]
    },
    {
      flightNumber: 'VL102',
      callsign: 'VOLANT102',
      airline: 'Volant Airlines',
      aircraftType: 'Eurocopter H145',
      manufacturer: 'Airbus Helicopters',
      registration: 'JA145V',
      age: 2,
      squawk: '0024',
      origin: 'TYO',
      destination: 'YOK',
      originCity: 'Tokyo Heliport',
      destCity: 'Yokohama Heliport',
      originCoords: [35.6267, 139.8267],
      destCoords: [35.4437, 139.6380],
      pathArcOffset: 0.5,
      speedKts: 120,
      altitudeFt: 2500,
      headingDeg: 190,
      status: 'En Route',
      category: 'Helicopter',
      viewerCount: 380,
      progress: 0.35,
      currentCoords: [0, 0]
    },
    {
      flightNumber: 'N500P',
      callsign: 'N500P',
      airline: 'Private Owner',
      aircraftType: 'Gulfstream G650',
      manufacturer: 'Gulfstream',
      registration: 'N500P',
      age: 6,
      squawk: '1000',
      origin: 'UKY',
      destination: 'HND',
      originCity: 'Kyoto',
      destCity: 'Tokyo',
      originCoords: [35.0116, 135.7681],
      destCoords: [35.5494, 139.7798],
      pathArcOffset: -1.5,
      speedKts: 430,
      altitudeFt: 28000,
      headingDeg: 75,
      status: 'En Route',
      category: 'Private',
      viewerCount: 220,
      progress: 0.85,
      currentCoords: [0, 0]
    },
    {
      flightNumber: 'JSDF01',
      callsign: 'JASDF01',
      airline: 'Japan Air Self-Defense Force',
      aircraftType: 'Mitsubishi F-15J Eagle',
      manufacturer: 'Mitsubishi / Boeing',
      registration: '52-8951',
      age: 12,
      squawk: '7777',
      origin: 'IBR',
      destination: 'TRA',
      originCity: 'Hyakuri Air Base',
      destCity: 'Pacific Training Zone',
      originCoords: [36.1808, 140.4131],
      destCoords: [35.0, 142.5],
      pathArcOffset: 2.0,
      speedKts: 850,
      altitudeFt: 45000,
      headingDeg: 135,
      status: 'En Route',
      category: 'Military',
      viewerCount: 5120,
      progress: 0.45,
      currentCoords: [0, 0]
    }
  ];

  // Airport Data
  airports: Airport[] = [
    {
      name: 'Tokyo Haneda International Airport',
      iata: 'HND',
      icao: 'RJTT',
      city: 'Tokyo',
      country: 'Japan',
      coords: [35.5494, 139.7798],
      weather: 'Clear, Temp 22°C, Wind 12kt S',
      runway: '16R/34L, 16L/34R, 04/22, 05/23',
      departures: ['VL802 to London (LHR) - 11:30', 'JL23 to New York (JFK) - 12:00', 'LH714 to Frankfurt (FRA) - 12:15'],
      arrivals: ['EK318 from Dubai (DXB) - 13:45', 'N500P from Kyoto (UKY) - 12:20'],
      delayStatus: 'green'
    },
    {
      name: 'New York John F. Kennedy Int\'l Airport',
      iata: 'JFK',
      icao: 'KJFK',
      city: 'New York',
      country: 'USA',
      coords: [40.6413, -73.7781],
      weather: 'Heavy Thunderstorms, Temp 18°C, Wind 25kt ENE',
      runway: '04L/22R, 04R/22L, 13L/31R, 13R/31L',
      departures: ['AA102 to London - 14:00', 'DL45 to Paris - 14:30'],
      arrivals: ['JL23 from Tokyo (HND) - 15:40 (Delayed)'],
      delayStatus: 'red',
      delayReason: 'Adverse weather (Thunderstorms) causing ground delay program of 45-60 minutes on all arrivals.'
    },
    {
      name: 'London Heathrow Airport',
      iata: 'LHR',
      icao: 'EGLL',
      city: 'London',
      country: 'United Kingdom',
      coords: [51.4700, -0.4543],
      weather: 'Foggy, Temp 12°C, Wind 4kt W',
      runway: '09L/27R, 09R/27L',
      departures: ['BA005 to Tokyo - 13:00', 'VS103 to New York - 13:30'],
      arrivals: ['VL802 from Tokyo (HND) - 15:15 (On Time)'],
      delayStatus: 'yellow',
      delayReason: 'Low visibility procedures in effect due to morning fog. Departures average 15-20 min delays.'
    },
    {
      name: 'Singapore Changi Airport',
      iata: 'SIN',
      icao: 'WSSS',
      city: 'Singapore',
      country: 'Singapore',
      coords: [1.3644, 103.9915],
      weather: 'Showers, Temp 30°C, Wind 8kt SW',
      runway: '02L/20R, 02C/20C, 02R/20L',
      departures: ['SQ638 to Tokyo (NRT) - 09:15'],
      arrivals: ['SQ307 from London (LHR) - 18:40'],
      delayStatus: 'green'
    },
    {
      name: 'Dubai International Airport',
      iata: 'DXB',
      icao: 'OMDB',
      city: 'Dubai',
      country: 'United Arab Emirates',
      coords: [25.2532, 55.3657],
      weather: 'Sunny, Temp 41°C, Wind 15kt NW',
      runway: '12L/30R, 12R/30L',
      departures: ['EK318 to Tokyo (NRT) - 03:00'],
      arrivals: ['EK106 from London (LHR) - 19:20'],
      delayStatus: 'green'
    }
  ];

  // Leaflet references
  private mapMarkers: { [key: string]: L.Marker } = {};
  private airportMarkers: L.CircleMarker[] = [];
  private flightPathLine: L.Polyline | null = null;
  private flightDashedLine: L.Polyline | null = null;

  constructor(
    private fb: FormBuilder, 
    private elementRef: ElementRef,
    private themeService: ThemeService,
    private aviationDataService: AviationDataService
  ) {
    this.alertForm = this.fb.group({
      flightNumber: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      onTakeoff: [true],
      onDelay: [true],
      onArrival: [true]
    });
  }

  ngOnInit(): void {
    // Generate current simulation coordinates
    this.updateFlightCoordinates();

    // Fetch real live flights from OpenSky Network
    this.loadOpenSkyLiveFlights();
  }

  ngAfterViewInit(): void {
    // Initialize map
    this.initMap();
    this.startSimulation();

    // Subscribe to color theme updates to switch Leaflet map styles dynamically
    this.themeSub = this.themeService.activeTheme$.subscribe(theme => {
      this.updateMapTiles(theme);
    });
  }

  ngOnDestroy(): void {
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
    }
    if (this.themeSub) {
      this.themeSub.unsubscribe();
    }
  }

  private initMap(): void {
    // Center initially on global view, zoom level 2
    this.map = L.map('live-leaflet-radar', {
      center: [30, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: false
    });

    // Set initial tiles matching active theme
    this.updateMapTiles(this.themeService.getCurrentTheme());

    // Draw airports on map
    this.renderAirports();

    // Draw active flights
    this.renderFlights();
  }

  private updateMapTiles(theme: ColorTheme): void {
    if (!this.map) return;

    if (this.tileLayer) {
      this.tileLayer.remove();
    }

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'; // Positron (light grey)
    if (theme === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'; // Dark Matter
    } else if (theme === 'mid') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'; // Voyager (steel blue)
    }

    this.tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 18
    }).addTo(this.map);
  }

  private renderAirports(): void {
    this.airports.forEach(apt => {
      // Color based on status
      const color = apt.delayStatus === 'red' ? '#ef4444' : apt.delayStatus === 'yellow' ? '#f59e0b' : '#10b981';
      
      const marker = L.circleMarker(apt.coords, {
        radius: 6,
        fillColor: color,
        color: '#ffffff',
        weight: 1,
        opacity: 0.9,
        fillOpacity: 0.8
      }).addTo(this.map);

      // Tooltip/popup
      marker.bindTooltip(`<b>${apt.city} (${apt.iata})</b><br>${apt.name}`, {
        direction: 'top',
        className: 'custom-map-tooltip'
      });

      marker.on('click', () => {
        this.selectAirport(apt);
      });

      this.airportMarkers.push(marker);
    });
  }

  private renderFlights(): void {
    // Clear old markers first
    Object.keys(this.mapMarkers).forEach(key => {
      this.mapMarkers[key].remove();
    });
    this.mapMarkers = {};

    // Create a custom flight marker for each flight
    this.flights.forEach(flight => {
      // Apply map filters
      if (!this.matchesFilters(flight)) {
        return;
      }

      // Aircraft color based on category
      let planeColor = '#10b981'; // green for passenger
      if (flight.category === 'Cargo') planeColor = '#f97316'; // orange
      if (flight.category === 'Military') planeColor = '#cbd5e1'; // grey
      if (flight.category === 'Helicopter') planeColor = '#eab308'; // yellow
      if (flight.category === 'Private') planeColor = '#c084fc'; // purple

      // DivIcon containing a custom rotating SVG plane
      const planeHtml = `
        <div class="custom-plane-icon" style="transform: rotate(${flight.headingDeg}deg); transition: transform 0.3s ease;">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="${planeColor}" stroke="#ffffff" stroke-width="0.8">
            <path d="M21,16V14L13,9V3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: planeHtml,
        className: 'leaflet-plane-div',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(flight.currentCoords, {
        icon: customIcon
      }).addTo(this.map);

      // Tooltip showing flight number and route
      marker.bindTooltip(`<b>${flight.flightNumber}</b><br>${flight.origin} ➔ ${flight.destination}`, {
        direction: 'right',
        className: 'custom-map-tooltip'
      });

      // Selection click event
      marker.on('click', () => {
        this.selectFlight(flight);
      });

      this.mapMarkers[flight.flightNumber] = marker;
    });

    // Update active flight path line if selected flight exists
    this.updateFlightPathOverlay();
  }

  private matchesFilters(flight: FlightSim): boolean {
    if (this.filterCategory !== 'All' && flight.category !== this.filterCategory) {
      return false;
    }
    if (flight.altitudeFt < this.filterMinAlt * 1000) {
      return false;
    }
    if (this.filterAirline !== 'All' && flight.airline !== this.filterAirline) {
      return false;
    }
    return true;
  }

  selectFlight(flight: FlightSim): void {
    this.selectedAirport = null;
    this.selectedFlight = flight;
    this.rightTab = 'details';
    this.originCountryFlag = '';
    this.destCountryFlag = '';
    
    // Pan slightly to focus on flight
    this.map.panTo(flight.currentCoords);

    // Render path route line
    this.updateFlightPathOverlay();

    // Query REST Countries API for actual origin and destination flags
    const originCode = this.getCountryCodeFromIata(flight.origin);
    const destCode = this.getCountryCodeFromIata(flight.destination);

    this.aviationDataService.getCountryInfo(originCode).subscribe(info => {
      this.originCountryFlag = info.flag;
    });

    this.aviationDataService.getCountryInfo(destCode).subscribe(info => {
      this.destCountryFlag = info.flag;
    });
  }

  selectAirport(airport: Airport): void {
    this.selectedFlight = null;
    this.selectedAirport = airport;
    this.rightTab = 'details';
    
    // Pan to airport
    this.map.panTo(airport.coords);

    // Clear path lines
    this.clearFlightPaths();

    // Query real-time weather conditions from Open-Meteo API
    this.aviationDataService.getAirportWeather(airport.coords[0], airport.coords[1]).subscribe({
      next: (weatherData) => {
        if (this.selectedAirport && this.selectedAirport.iata === airport.iata) {
          this.selectedAirport.weather = `${weatherData.conditionIcon} ${weatherData.conditionText}, Temp ${weatherData.temperature}°C, Wind ${weatherData.windSpeed}kt`;
        }
      }
    });
  }

  private clearFlightPaths(): void {
    if (this.flightPathLine) {
      this.flightPathLine.remove();
      this.flightPathLine = null;
    }
    if (this.flightDashedLine) {
      this.flightDashedLine.remove();
      this.flightDashedLine = null;
    }
  }

  private updateFlightPathOverlay(): void {
    this.clearFlightPaths();

    if (!this.selectedFlight) return;

    // Draw path line from Origin, curving slightly, to Destination
    const flight = this.selectedFlight;
    const origin = flight.originCoords;
    const dest = flight.destCoords;
    const t = flight.progress;

    // Generate curve coordinates using arc interpolation
    const pathPoints: [number, number][] = [];
    const steps = 30;
    for (let i = 0; i <= steps; i++) {
      const stepT = i / steps;
      pathPoints.push(this.interpolateCoords(origin, dest, stepT, flight.pathArcOffset));
    }

    // Split points into completed and remaining parts based on current progress t
    const splitIndex = Math.floor(t * steps);
    const completedPoints = pathPoints.slice(0, splitIndex + 1);
    const remainingPoints = pathPoints.slice(splitIndex);

    // Drawing lines
    if (completedPoints.length > 1) {
      this.flightPathLine = L.polyline(completedPoints, {
        color: '#10b981', // emerald path completed
        weight: 2,
        opacity: 0.85
      }).addTo(this.map);
    }

    if (remainingPoints.length > 1) {
      this.flightDashedLine = L.polyline(remainingPoints, {
        color: '#94a3b8', // grey path remaining
        weight: 2,
        dashArray: '5, 5',
        opacity: 0.6
      }).addTo(this.map);
    }
  }

  // Linear Interpolation helper with simple Arc Offset
  private interpolateCoords(
    c1: [number, number], 
    c2: [number, number], 
    t: number, 
    arcOffset: number = 0
  ): [number, number] {
    const lat = c1[0] + t * (c2[0] - c1[0]);
    
    // Handle short / long routes crossing meridian
    let lng1 = c1[1];
    let lng2 = c2[1];
    if (Math.abs(lng2 - lng1) > 180) {
      if (lng1 > 0 && lng2 < 0) lng2 += 360;
      else if (lng1 < 0 && lng2 > 0) lng1 += 360;
    }
    
    let lng = lng1 + t * (lng2 - lng1);
    if (lng > 180) lng -= 360;
    if (lng < -180) lng += 360;

    // Curve formula: adding sine wave deviation to the mid point perpendicular vector
    // This creates beautiful great-circle arcs on 2D mercator projections
    const arcDelta = Math.sin(t * Math.PI) * arcOffset;
    
    return [lat + arcDelta * 0.3, lng + arcDelta];
  }

  private startSimulation(): void {
    // Refresh sim state every 1.5 seconds
    this.playbackTimer = setInterval(() => {
      if (this.isPaused) return;

      // Increment progress of each flight based on speed
      this.flights.forEach(flight => {
        // Speed scaling: base increments of 0.003
        // Multiply by current playback Speed setting
        const baseIncrement = (flight.speedKts / 500) * 0.002;
        flight.progress += baseIncrement * this.playbackSpeed;

        if (flight.progress >= 1) {
          // Loop flight back to origin when landing
          flight.progress = 0;
          flight.viewerCount = Math.floor(Math.random() * 3000) + 100;
        }

        // Calculate heading (simplistic look-ahead coordinate comparison)
        const currentPos = this.interpolateCoords(flight.originCoords, flight.destCoords, flight.progress, flight.pathArcOffset);
        const nextPos = this.interpolateCoords(flight.originCoords, flight.destCoords, flight.progress + 0.01, flight.pathArcOffset);
        
        // Compute heading angle
        const y = Math.sin(nextPos[1] - currentPos[1]) * Math.cos(nextPos[0]);
        const x = Math.cos(currentPos[0]) * Math.sin(nextPos[0]) - Math.sin(currentPos[0]) * Math.cos(nextPos[0]) * Math.cos(nextPos[1] - currentPos[1]);
        const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        
        flight.headingDeg = Math.round(bearing);
        flight.currentCoords = currentPos;
        
        // Randomly perturb altitude and telemetry slightly to look alive
        if (Math.random() > 0.7) {
          flight.altitudeFt += (Math.random() > 0.5 ? 100 : -100);
          flight.speedKts += (Math.random() > 0.5 ? 2 : -2);
          flight.viewerCount += (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5);
        }
      });

      // Update positions of markers on leaflet map
      this.flights.forEach(flight => {
        const marker = this.mapMarkers[flight.flightNumber];
        if (marker && this.matchesFilters(flight)) {
          marker.setLatLng(flight.currentCoords);
          
          // Re-create the divicon with updated rotation
          let planeColor = '#10b981';
          if (flight.category === 'Cargo') planeColor = '#f97316';
          if (flight.category === 'Military') planeColor = '#cbd5e1';
          if (flight.category === 'Helicopter') planeColor = '#eab308';
          if (flight.category === 'Private') planeColor = '#c084fc';

          const planeHtml = `
            <div class="custom-plane-icon" style="transform: rotate(${flight.headingDeg}deg); transition: transform 0.3s ease;">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="${planeColor}" stroke="#ffffff" stroke-width="0.8">
                <path d="M21,16V14L13,9V3.5A1.5,1.5 0 0,0 11.5,2A1.5,1.5 0 0,0 10,3.5V9L2,14V16L10,13.5V19L8,20.5V22L11.5,21L15,22V20.5L13,19V13.5L21,16Z"/>
              </svg>
            </div>
          `;
          marker.setIcon(L.divIcon({
            html: planeHtml,
            className: 'leaflet-plane-div',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          }));
        }
      });

      // Redraw selected path overlay
      this.updateFlightPathOverlay();

      // Slowly increment simulation time label
      this.simTime = new Date(this.simTime.getTime() + (1000 * 30 * this.playbackSpeed));
      
      // Sync timeline slider progress
      if (this.selectedFlight) {
        this.playbackProgress = Math.round(this.selectedFlight.progress * 100);
      } else {
        // Average progress of active Volant VL802
        const mainFlight = this.flights.find(f => f.flightNumber === 'VL802');
        if (mainFlight) {
          this.playbackProgress = Math.round(mainFlight.progress * 100);
        }
      }
    }, 1500);
  }

  private updateFlightCoordinates(): void {
    this.flights.forEach(f => {
      f.currentCoords = this.interpolateCoords(f.originCoords, f.destCoords, f.progress, f.pathArcOffset);
    });
  }

  // Sidebar List sorting
  getSortedTrackedFlights(): FlightSim[] {
    return [...this.flights].sort((a, b) => b.viewerCount - a.viewerCount);
  }

  getBookmarkedFlightsList(): FlightSim[] {
    return this.flights.filter(f => this.bookmarkedFlights.has(f.flightNumber));
  }

  toggleBookmark(flight: FlightSim, event: Event): void {
    event.stopPropagation();
    if (this.bookmarkedFlights.has(flight.flightNumber)) {
      this.bookmarkedFlights.delete(flight.flightNumber);
    } else {
      this.bookmarkedFlights.add(flight.flightNumber);
    }
  }

  focusOnFlight(flight: FlightSim): void {
    this.selectFlight(flight);
    // Zoom closer to look at it
    this.map.setView(flight.currentCoords, 5);
  }

  focusOnAirport(airport: Airport): void {
    this.selectAirport(airport);
    // Zoom closer to airport
    this.map.setView(airport.coords, 6);
  }

  // Full Screen toggle
  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    
    // Invalidate map size to recalculate viewport container bounds
    setTimeout(() => {
      this.map.invalidateSize();
    }, 300);
  }

  // Playback Control Triggers
  togglePlayback(): void {
    this.isPaused = !this.isPaused;
  }

  onTimelineSliderChange(): void {
    const targetProgress = this.playbackProgress / 100;
    
    // Jump the flight/simulators to match target progress
    if (this.selectedFlight) {
      this.selectedFlight.progress = targetProgress;
      this.selectedFlight.currentCoords = this.interpolateCoords(
        this.selectedFlight.originCoords, 
        this.selectedFlight.destCoords, 
        targetProgress, 
        this.selectedFlight.pathArcOffset
      );
      this.map.panTo(this.selectedFlight.currentCoords);
    } else {
      // Perturb all flights
      this.flights.forEach(f => {
        f.progress = (targetProgress + (f.flightNumber.charCodeAt(2) % 10) / 20) % 1;
        f.currentCoords = this.interpolateCoords(f.originCoords, f.destCoords, f.progress, f.pathArcOffset);
      });
    }
    
    this.renderFlights();
  }

  onPlaybackSpeedChange(): void {
    // Simulation timer speeds up coordinates progress calculations
  }

  getSimulationTimeFormatted(): string {
    return this.simTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) + ' UTC';
  }

  // Weather toggle overlays drawing
  toggleWeatherLayer(layer: 'clouds' | 'rain' | 'turbulence' | 'storms'): void {
    this.weatherLayers[layer] = !this.weatherLayers[layer];
    this.drawWeatherLayers();
  }

  private drawWeatherLayers(): void {
    // Clear old weather shapes
    this.weatherOverlays.forEach(w => w.remove());
    this.weatherOverlays = [];

    // Draw clouds (translucent white circles near flight paths)
    if (this.weatherLayers.clouds) {
      const cloudCenter1: L.LatLngExpression = [45.0, 100.0];
      const cloudCenter2: L.LatLngExpression = [55.0, 40.0];
      
      const c1 = L.circle(cloudCenter1, { radius: 800000, fillColor: '#ffffff', color: 'transparent', fillOpacity: 0.15 }).addTo(this.map);
      const c2 = L.circle(cloudCenter2, { radius: 1000000, fillColor: '#ffffff', color: 'transparent', fillOpacity: 0.15 }).addTo(this.map);
      
      this.weatherOverlays.push(c1, c2);
    }

    // Draw Rain Radar (translucent green polygons over Japan / Europe corridors)
    if (this.weatherLayers.rain) {
      // Polygon covering Japan Sea corridor
      const japanCorridorCoords: L.LatLngExpression[] = [
        [41.0, 136.0], [43.0, 142.0], [38.0, 143.0], [35.0, 137.0]
      ];
      const rainPoly = L.polygon(japanCorridorCoords, {
        fillColor: '#10b981',
        color: '#059669',
        weight: 1,
        fillOpacity: 0.25
      }).addTo(this.map);
      
      this.weatherOverlays.push(rainPoly);
    }

    // Draw Turbulence (translucent amber circles with warning messages)
    if (this.weatherLayers.turbulence) {
      const turbCoords: L.LatLngExpression = [48.0, -10.0]; // off-shore Europe LHR corridor
      const turbCircle = L.circle(turbCoords, {
        radius: 400000,
        fillColor: '#f59e0b',
        color: '#d97706',
        weight: 1.5,
        fillOpacity: 0.2
      }).addTo(this.map);
      turbCircle.bindTooltip('Severe Turbulence CAT 3', { permanent: true, className: 'weather-label-tooltip' });
      
      this.weatherOverlays.push(turbCircle);
    }

    // Draw Storms (blinking red circle radars near New York JFK coords)
    if (this.weatherLayers.storms) {
      const stormCenter: L.LatLngExpression = [40.6413, -73.7781];
      const stormCircle = L.circle(stormCenter, {
        radius: 350000,
        fillColor: '#ef4444',
        color: '#b91c1c',
        weight: 2,
        fillOpacity: 0.3
      }).addTo(this.map);
      stormCircle.bindTooltip('⛈️ Severe Storm Area - Airport Delays active', { permanent: true, className: 'weather-label-tooltip' });

      this.weatherOverlays.push(stormCircle);
    }
  }

  // Filter application
  applyMapFilters(): void {
    this.renderFlights();
  }

  // Alerts Form
  subscribeToAlerts(): void {
    if (this.alertForm.valid) {
      this.alertSubscribed = true;
      setTimeout(() => {
        this.alertSubscribed = false;
        this.alertForm.reset({
          flightNumber: '',
          email: '',
          phone: '',
          onTakeoff: true,
          onDelay: true,
          onArrival: true
        });
      }, 4000);
    }
  }

  // Autocomplete search suggestions
  onSearchQueryChange(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.searchSuggestions = [];
    
    if (q.length < 2) return;

    // Search flights
    this.flights.forEach(f => {
      if (f.flightNumber.toLowerCase().includes(q) || f.airline.toLowerCase().includes(q)) {
        this.searchSuggestions.push({
          type: 'flight',
          text: `${f.flightNumber} (${f.airline})`,
          item: f
        });
      }
    });

    // Search airports
    this.airports.forEach(a => {
      if (a.iata.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)) {
        this.searchSuggestions.push({
          type: 'airport',
          text: `${a.iata} - ${a.city} (${a.name})`,
          item: a
        });
      }
    });

    // Cap suggestions at 5
    this.searchSuggestions = this.searchSuggestions.slice(0, 5);
  }

  selectSuggestion(sug: { type: 'flight' | 'airport', text: string, item: any }): void {
    this.searchQuery = sug.item.flightNumber || sug.item.iata;
    this.searchSuggestions = [];
    
    if (sug.type === 'flight') {
      this.focusOnFlight(sug.item);
    } else {
      this.focusOnAirport(sug.item);
    }
  }

  executeSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (q.length === 0) return;

    // Direct match flight
    const matchedFlight = this.flights.find(f => f.flightNumber.toLowerCase() === q);
    if (matchedFlight) {
      this.focusOnFlight(matchedFlight);
      this.searchSuggestions = [];
      return;
    }

    // Direct match airport
    const matchedApt = this.airports.find(a => a.iata.toLowerCase() === q || a.city.toLowerCase() === q);
    if (matchedApt) {
      this.focusOnAirport(matchedApt);
      this.searchSuggestions = [];
      return;
    }

    // Heuristic fuzzy search first hit
    if (this.searchSuggestions.length > 0) {
      this.selectSuggestion(this.searchSuggestions[0]);
    }
  }

  // AI assistant handlers
  toggleAIHelper(): void {
    this.aiExpanded = !this.aiExpanded;
    if (this.aiExpanded) {
      this.scrollAIChatToBottom();
    }
  }

  sendAIQuery(): void {
    const query = this.aiQuery.trim();
    if (query.length === 0) return;

    this.aiMessages.push({ sender: 'user', text: query });
    this.aiQuery = '';

    this.scrollAIChatToBottom();

    // AI Query processing logic
    setTimeout(() => {
      const q = query.toLowerCase();
      let aiText = '';

      if (q.includes('track') || q.includes('find flight') || q.includes('show flight')) {
        // Find flight number match
        const found = this.flights.find(f => q.includes(f.flightNumber.toLowerCase()));
        if (found) {
          this.focusOnFlight(found);
          aiText = `Radar AI: I have located and highlighted flight ${found.flightNumber} (${found.airline}) en route from ${found.originCity} (${found.origin}) to ${found.destCity} (${found.destination}). Speed: ${found.speedKts} kt. Altitude: ${found.altitudeFt} ft.`;
        } else {
          aiText = `Radar AI: I couldn't find a specific active flight matching your search query. Try typing: "Track VL802" or "Track JL23".`;
        }
      } else if (q.includes('cargo')) {
        // filter cargo
        this.filterCategory = 'Cargo';
        this.applyMapFilters();
        const cargoFlight = this.flights.find(f => f.category === 'Cargo');
        if (cargoFlight) {
          this.focusOnFlight(cargoFlight);
          aiText = `Radar AI: Filtered radar display to show CARGO flights only. Centering on flight ${cargoFlight.flightNumber} (Boeing 747-8F) flying over the Alaska Anchorage Corridor.`;
        } else {
          aiText = `Radar AI: Filtered map to Cargo flights. No cargo planes found in your immediate filter.`;
        }
      } else if (q.includes('military') || q.includes('f-15') || q.includes('jsdf')) {
        this.filterCategory = 'Military';
        this.applyMapFilters();
        const milFlight = this.flights.find(f => f.category === 'Military');
        if (milFlight) {
          this.focusOnFlight(milFlight);
          aiText = `Radar AI: Showing military operations. Active aircraft JSDF01 (Mitsubishi F-15J Eagle) performing drills at 45,000 ft over the Pacific training region.`;
        }
      } else if (q.includes('helo') || q.includes('helicopter')) {
        this.filterCategory = 'Helicopter';
        this.applyMapFilters();
        const helo = this.flights.find(f => f.category === 'Helicopter');
        if (helo) {
          this.focusOnFlight(helo);
          aiText = `Radar AI: Airspace filter set to Helicopters. Active aircraft VL102 (Volant H145 Eurocopter) en route from Tokyo Heliport to Yokohama.`;
        }
      } else if (q.includes('private') || q.includes('jet')) {
        this.filterCategory = 'Private';
        this.applyMapFilters();
        const jet = this.flights.find(f => f.category === 'Private');
        if (jet) {
          this.focusOnFlight(jet);
          aiText = `Radar AI: Displaying Private airspace traffic. Highlighted N500P (Gulfstream G650) flying at 28,000 ft from Kyoto to Tokyo Haneda.`;
        }
      } else if (q.includes('delay') || q.includes('disrupt') || q.includes('storm')) {
        const delayed = this.airports.filter(a => a.delayStatus !== 'green');
        const listText = delayed.map(d => `${d.city} (${d.iata}) - ${d.delayReason}`).join('; ');
        aiText = `Radar AI: The following airports are experiencing traffic restrictions: ${listText}. Highlighting disrupted nodes on the radar screen.`;
        this.leftTab = 'disruptions';
      } else if (q.includes('tokyo') || q.includes('london') || q.includes('hnd') || q.includes('lhr')) {
        const vl = this.flights.find(f => f.flightNumber === 'VL802');
        if (vl) {
          this.focusOnFlight(vl);
          aiText = `Radar AI: Found flight VL802 connecting Tokyo (HND) to London (LHR). Currently cruising at 37,000 ft, on schedule.`;
        }
      } else if (q.includes('reset') || q.includes('all') || q.includes('clear')) {
        this.filterCategory = 'All';
        this.filterAirline = 'All';
        this.filterMinAlt = 0;
        this.applyMapFilters();
        this.map.setView([30, 0], 2);
        aiText = `Radar AI: Airspace filters cleared. Centered back to global radar view showing all active passenger, cargo, military, and private air traffic.`;
      } else {
        aiText = `Radar AI: I can scan the radar map for you. Try asking me:\n- "Track VL802"\n- "Show cargo planes"\n- "Which airports have delays?"\n- "Clear filters" to reset.`;
      }

      this.aiMessages.push({ sender: 'ai', text: aiText });
      this.scrollAIChatToBottom();
    }, 1000);
  }

  private scrollAIChatToBottom(): void {
    setTimeout(() => {
      try {
        if (this.aiChatHistoryContainer) {
          const element = this.aiChatHistoryContainer.nativeElement;
          element.scrollTop = element.scrollHeight;
        }
      } catch (err) {
        console.error('Scroll error', err);
      }
    }, 50);
  }

  private getCountryCodeFromIata(iata: string): string {
    if (iata === 'HND' || iata === 'NRT' || iata === 'TYO' || iata === 'IBR') return 'JP';
    if (iata === 'JFK' || iata === 'ANC') return 'US';
    if (iata === 'LHR') return 'GB';
    if (iata === 'SIN') return 'SG';
    if (iata === 'DXB') return 'AE';
    if (iata === 'FRA') return 'DE'; // Germany
    return 'JP';
  }

  private loadOpenSkyLiveFlights(): void {
    this.aviationDataService.getOpenSkyLiveFlights().subscribe({
      next: (liveFlights) => {
        if (liveFlights && liveFlights.length > 0) {
          liveFlights.forEach(lf => {
            const existingIdx = this.flights.findIndex(f => f.flightNumber === lf.flightNumber);
            if (existingIdx !== -1) {
              this.flights[existingIdx] = { ...this.flights[existingIdx], ...lf };
            } else {
              this.flights.push(lf);
            }
          });
          this.renderFlights();
        }
      },
      error: (err) => console.warn('OpenSky API offline or rate-limited. Falling back to simulated flight matrix.', err)
    });
  }
}
