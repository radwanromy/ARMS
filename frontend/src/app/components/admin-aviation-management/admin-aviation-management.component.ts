import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AviationDataService } from '../../services/aviation-data.service';

@Component({
  selector: 'app-admin-aviation-management',
  template: `
    <div class="container">
      <div class="admin-header animate-fade-in">
        <div class="admin-header-row">
          <div>
            <h2 class="admin-title gradient-text">Aviation Database Manager</h2>
            <p class="admin-subtitle">Manage global countries, airports registry, and airline assets</p>
          </div>
          <app-logo [size]="55" variant="standard"></app-logo>
        </div>
      </div>

      <!-- Tab Selection -->
      <div class="tab-navigation glass-panel animate-fade-in">
        <button class="nav-tab" [class.active]="activeTab === 'countries'" (click)="selectTab('countries')">
          🌐 Countries ({{ countries.length }})
        </button>
        <button class="nav-tab" [class.active]="activeTab === 'airports'" (click)="selectTab('airports')">
          🛫 Airports ({{ airports.length }})
        </button>
        <button class="nav-tab" [class.active]="activeTab === 'airlines'" (click)="selectTab('airlines')">
          ✈️ Airlines ({{ airlines.length }})
        </button>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner large-spinner"></div>
        <p>Fetching database registries...</p>
      </div>

      <div class="content-body animate-fade-in" *ngIf="!loading">
        
        <!-- ================= COUNTRIES TAB ================= -->
        <div *ngIf="activeTab === 'countries'" class="tab-pane">
          <div class="pane-header">
            <h3>Registered Countries</h3>
            <button class="btn btn-primary" (click)="openAddCountry()">+ Add Country</button>
          </div>

          <!-- Country Form (Add/Edit) -->
          <div class="glass-panel form-panel animate-slide-down" *ngIf="showCountryForm">
            <h4 class="form-title">{{ editingCountryId ? 'Edit Country' : 'Add New Country' }}</h4>
            <form [formGroup]="countryForm" (ngSubmit)="saveCountry()">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Country Name</label>
                  <input type="text" formControlName="name" class="form-input" placeholder="e.g. United States">
                </div>
                <div class="form-group">
                  <label class="form-label">ISO Code</label>
                  <input type="text" formControlName="isoCode" class="form-input" placeholder="e.g. US">
                </div>
                <div class="form-group">
                  <label class="form-label">Currency</label>
                  <input type="text" formControlName="currency" class="form-input" placeholder="e.g. USD">
                </div>
                <div class="form-group">
                  <label class="form-label">Timezone</label>
                  <input type="text" formControlName="timezone" class="form-input" placeholder="e.g. GMT-5">
                </div>
                <div class="form-group">
                  <label class="form-label">Flag Emoji</label>
                  <input type="text" formControlName="flagEmoji" class="form-input" placeholder="e.g. 🇺🇸">
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="showCountryForm = false">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="countryForm.invalid">Save Country</button>
              </div>
            </form>
          </div>

          <!-- Countries Table -->
          <div class="table-wrapper glass-panel">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Flag</th>
                  <th>Country Name</th>
                  <th>ISO Code</th>
                  <th>Currency</th>
                  <th>Timezone</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of countries">
                  <td class="flag-cell">{{ c.flagEmoji }}</td>
                  <td class="primary-cell">{{ c.name }}</td>
                  <td><span class="badge badge-iso">{{ c.isoCode }}</span></td>
                  <td>{{ c.currency }}</td>
                  <td>{{ c.timezone }}</td>
                  <td class="text-right actions-cell">
                    <button class="btn-action edit" (click)="editCountry(c)" title="Edit">✎</button>
                    <button class="btn-action delete" (click)="deleteCountry(c.id)" title="Delete">🗑</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ================= AIRPORTS TAB ================= -->
        <div *ngIf="activeTab === 'airports'" class="tab-pane">
          <div class="pane-header">
            <h3>Airport Registry</h3>
            <button class="btn btn-primary" (click)="openAddAirport()">+ Add Airport</button>
          </div>

          <!-- Airport Form (Add/Edit) -->
          <div class="glass-panel form-panel animate-slide-down" *ngIf="showAirportForm">
            <h4 class="form-title">{{ editingAirportId ? 'Edit Airport' : 'Add New Airport' }}</h4>
            <form [formGroup]="airportForm" (ngSubmit)="saveAirport()">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Airport Name</label>
                  <input type="text" formControlName="name" class="form-input" placeholder="e.g. Haneda Airport">
                </div>
                <div class="form-group">
                  <label class="form-label">IATA Code</label>
                  <input type="text" formControlName="iataCode" class="form-input" placeholder="e.g. HND">
                </div>
                <div class="form-group">
                  <label class="form-label">ICAO Code</label>
                  <input type="text" formControlName="icaoCode" class="form-input" placeholder="e.g. RJTT">
                </div>
                <div class="form-group">
                  <label class="form-label">City</label>
                  <input type="text" formControlName="city" class="form-input" placeholder="e.g. Tokyo">
                </div>
                <div class="form-group">
                  <label class="form-label">Country ISO</label>
                  <input type="text" formControlName="countryIso" class="form-input" placeholder="e.g. JP">
                </div>
                <div class="form-group">
                  <label class="form-label">Latitude</label>
                  <input type="number" step="any" formControlName="latitude" class="form-input" placeholder="e.g. 35.5494">
                </div>
                <div class="form-group">
                  <label class="form-label">Longitude</label>
                  <input type="number" step="any" formControlName="longitude" class="form-input" placeholder="e.g. 139.7798">
                </div>
                <div class="form-group">
                  <label class="form-label">Timezone</label>
                  <input type="text" formControlName="timezone" class="form-input" placeholder="e.g. GMT+9">
                </div>
                <div class="form-group">
                  <label class="form-label">Type</label>
                  <select formControlName="type" class="form-input">
                    <option value="INTERNATIONAL">International</option>
                    <option value="DOMESTIC">Domestic</option>
                  </select>
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="showAirportForm = false">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="airportForm.invalid">Save Airport</button>
              </div>
            </form>
          </div>

          <!-- Airports Table -->
          <div class="table-wrapper glass-panel">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Codes</th>
                  <th>Airport Name</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Coordinates</th>
                  <th>Timezone</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of airports">
                  <td>
                    <div class="codes-cell">
                      <span class="badge badge-iata">{{ a.iataCode }}</span>
                      <span class="icao">{{ a.icaoCode }}</span>
                    </div>
                  </td>
                  <td class="primary-cell">{{ a.name }}</td>
                  <td>{{ a.city }}, {{ a.countryIso }}</td>
                  <td>
                    <span class="badge-type" [class.int]="a.type === 'INTERNATIONAL'">
                      {{ a.type }}
                    </span>
                  </td>
                  <td class="coords">{{ a.latitude | number:'1.2-4' }}, {{ a.longitude | number:'1.2-4' }}</td>
                  <td>{{ a.timezone }}</td>
                  <td class="text-right actions-cell">
                    <button class="btn-action edit" (click)="editAirport(a)" title="Edit">✎</button>
                    <button class="btn-action delete" (click)="deleteAirport(a.id)" title="Delete">🗑</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ================= AIRLINES TAB ================= -->
        <div *ngIf="activeTab === 'airlines'" class="tab-pane">
          <div class="pane-header">
            <h3>Registered Airlines</h3>
            <button class="btn btn-primary" (click)="openAddAirline()">+ Add Airline</button>
          </div>

          <!-- Airline Form (Add/Edit) -->
          <div class="glass-panel form-panel animate-slide-down" *ngIf="showAirlineForm">
            <h4 class="form-title">{{ editingAirlineId ? 'Edit Airline' : 'Add New Airline' }}</h4>
            <form [formGroup]="airlineForm" (ngSubmit)="saveAirline()">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Airline Name</label>
                  <input type="text" formControlName="name" class="form-input" placeholder="e.g. Japan Airlines">
                </div>
                <div class="form-group">
                  <label class="form-label">IATA Code</label>
                  <input type="text" formControlName="iataCode" class="form-input" placeholder="e.g. JL">
                </div>
                <div class="form-group">
                  <label class="form-label">Country ISO</label>
                  <input type="text" formControlName="countryIso" class="form-input" placeholder="e.g. JP">
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="showAirlineForm = false">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="airlineForm.invalid">Save Airline</button>
              </div>
            </form>
          </div>

          <!-- Airlines Table -->
          <div class="table-wrapper glass-panel">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Airline Name</th>
                  <th>Country ISO</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let a of airlines">
                  <td><span class="badge badge-iata">{{ a.iataCode }}</span></td>
                  <td class="primary-cell">{{ a.name }}</td>
                  <td>{{ a.countryIso }}</td>
                  <td class="text-right actions-cell">
                    <button class="btn-action edit" (click)="editAirline(a)" title="Edit">✎</button>
                    <button class="btn-action delete" (click)="deleteAirline(a.id)" title="Delete">🗑</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .pane-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .pane-header h3 {
      font-family: var(--font-title);
      font-size: 1.4rem;
      margin: 0;
    }
    .tab-navigation {
      display: flex;
      gap: 16px;
      padding: 12px 24px;
      margin-bottom: 24px;
      border-radius: 16px;
    }
    .nav-tab {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1rem;
      font-weight: 600;
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 8px;
      transition: var(--transition-fast);
    }
    .nav-tab:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-primary);
    }
    .nav-tab.active {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.3);
    }

    /* Form Panel styles */
    .form-panel {
      padding: 24px;
      margin-bottom: 24px;
    }
    .form-title {
      font-family: var(--font-title);
      font-size: 1.2rem;
      margin-bottom: 16px;
      color: var(--text-primary);
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* Table Styles */
    .admin-table {
      width: 100%;
      border-collapse: collapse;
    }
    .admin-table th, .admin-table td {
      padding: 14px 16px;
      text-align: left;
      border-bottom: 1px solid var(--glass-border);
    }
    .admin-table th {
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 600;
      background: rgba(255, 255, 255, 0.01);
    }
    .admin-table tbody tr:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    .primary-cell {
      font-weight: 600;
      color: #f8fafc;
    }
    .flag-cell {
      font-size: 1.5rem;
      width: 60px;
    }
    .badge-iso {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
      border: 1px solid rgba(59, 130, 246, 0.25);
    }
    .badge-iata {
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
      border: 1px solid rgba(168, 85, 247, 0.25);
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .icao {
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: monospace;
    }
    .codes-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .badge-type {
      font-size: 0.75rem;
      padding: 4px 8px;
      border-radius: 12px;
      background: rgba(234, 179, 8, 0.15);
      color: #facc15;
      border: 1px solid rgba(234, 179, 8, 0.25);
      font-weight: 600;
      display: inline-block;
    }
    .badge-type.int {
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.25);
    }
    .coords {
      font-family: monospace;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    /* Actions buttons */
    .btn-action {
      background: transparent;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: var(--transition-fast);
      margin-left: 6px;
    }
    .btn-action.edit {
      color: #60a5fa;
    }
    .btn-action.edit:hover {
      background: rgba(96, 165, 250, 0.15);
    }
    .btn-action.delete {
      color: #f87171;
    }
    .btn-action.delete:hover {
      background: rgba(248, 113, 113, 0.15);
    }

    /* Loading state */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      gap: 16px;
      color: var(--text-secondary);
    }
    .large-spinner {
      width: 48px;
      height: 48px;
      border-width: 4px;
    }

    /* Header styling */
    .admin-header {
      margin-bottom: 24px;
    }
    .admin-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .admin-title {
      font-size: 2rem;
      margin-bottom: 4px;
    }
    .admin-subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .animate-fade-in {
      animation: fadeIn 0.4s ease forwards;
    }
    .animate-slide-down {
      animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AdminAviationManagementComponent implements OnInit {
  activeTab = 'countries';
  loading = false;

  countries: any[] = [];
  airports: any[] = [];
  airlines: any[] = [];

  // Form states
  showCountryForm = false;
  editingCountryId: number | null = null;
  countryForm: FormGroup;

  showAirportForm = false;
  editingAirportId: number | null = null;
  airportForm: FormGroup;

  showAirlineForm = false;
  editingAirlineId: number | null = null;
  airlineForm: FormGroup;

  constructor(
    private aviationDataService: AviationDataService,
    private fb: FormBuilder
  ) {
    this.countryForm = this.fb.group({
      name: ['', Validators.required],
      isoCode: ['', [Validators.required, Validators.maxLength(10)]],
      currency: ['', [Validators.required, Validators.maxLength(10)]],
      timezone: ['', [Validators.required, Validators.maxLength(50)]],
      flagEmoji: ['', Validators.maxLength(10)]
    });

    this.airportForm = this.fb.group({
      name: ['', Validators.required],
      iataCode: ['', [Validators.required, Validators.maxLength(10)]],
      icaoCode: ['', [Validators.required, Validators.maxLength(10)]],
      city: ['', Validators.required],
      countryIso: ['', [Validators.required, Validators.maxLength(10)]],
      latitude: [0, Validators.required],
      longitude: [0, Validators.required],
      timezone: ['', Validators.required],
      type: ['INTERNATIONAL', Validators.required]
    });

    this.airlineForm = this.fb.group({
      name: ['', Validators.required],
      iataCode: ['', [Validators.required, Validators.maxLength(10)]],
      countryIso: ['', [Validators.required, Validators.maxLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
  }

  loadData(): void {
    this.loading = true;
    
    // Load countries, airports, and airlines in parallel
    this.aviationDataService.getCountries().subscribe({
      next: (countriesData) => {
        this.countries = countriesData;
        this.aviationDataService.getAirports().subscribe({
          next: (airportsData) => {
            this.airports = airportsData;
            this.aviationDataService.getAirlines().subscribe({
              next: (airlinesData) => {
                this.airlines = airlinesData;
                this.loading = false;
              },
              error: () => this.loading = false
            });
          },
          error: () => this.loading = false
        });
      },
      error: () => this.loading = false
    });
  }

  // --- Country Actions ---
  openAddCountry(): void {
    this.editingCountryId = null;
    this.countryForm.reset();
    this.showCountryForm = true;
  }

  editCountry(country: any): void {
    this.editingCountryId = country.id;
    this.countryForm.patchValue(country);
    this.showCountryForm = true;
  }

  saveCountry(): void {
    if (this.countryForm.invalid) return;

    if (this.editingCountryId) {
      this.aviationDataService.updateCountry(this.editingCountryId, this.countryForm.value).subscribe({
        next: () => {
          this.showCountryForm = false;
          this.loadData();
        }
      });
    } else {
      this.aviationDataService.createCountry(this.countryForm.value).subscribe({
        next: () => {
          this.showCountryForm = false;
          this.loadData();
        }
      });
    }
  }

  deleteCountry(id: number): void {
    if (confirm('Are you sure you want to delete this country?')) {
      this.aviationDataService.deleteCountry(id).subscribe({
        next: () => this.loadData()
      });
    }
  }

  // --- Airport Actions ---
  openAddAirport(): void {
    this.editingAirportId = null;
    this.airportForm.reset({ type: 'INTERNATIONAL' });
    this.showAirportForm = true;
  }

  editAirport(airport: any): void {
    this.editingAirportId = airport.id;
    this.airportForm.patchValue(airport);
    this.showAirportForm = true;
  }

  saveAirport(): void {
    if (this.airportForm.invalid) return;

    if (this.editingAirportId) {
      this.aviationDataService.updateAirport(this.editingAirportId, this.airportForm.value).subscribe({
        next: () => {
          this.showAirportForm = false;
          this.loadData();
        }
      });
    } else {
      this.aviationDataService.createAirport(this.airportForm.value).subscribe({
        next: () => {
          this.showAirportForm = false;
          this.loadData();
        }
      });
    }
  }

  deleteAirport(id: number): void {
    if (confirm('Are you sure you want to delete this airport?')) {
      this.aviationDataService.deleteAirport(id).subscribe({
        next: () => this.loadData()
      });
    }
  }

  // --- Airline Actions ---
  openAddAirline(): void {
    this.editingAirlineId = null;
    this.airlineForm.reset();
    this.showAirlineForm = true;
  }

  editAirline(airline: any): void {
    this.editingAirlineId = airline.id;
    this.airlineForm.patchValue(airline);
    this.showAirlineForm = true;
  }

  saveAirline(): void {
    if (this.airlineForm.invalid) return;

    if (this.editingAirlineId) {
      this.aviationDataService.updateAirline(this.editingAirlineId, this.airlineForm.value).subscribe({
        next: () => {
          this.showAirlineForm = false;
          this.loadData();
        }
      });
    } else {
      this.aviationDataService.createAirline(this.airlineForm.value).subscribe({
        next: () => {
          this.showAirlineForm = false;
          this.loadData();
        }
      });
    }
  }

  deleteAirline(id: number): void {
    if (confirm('Are you sure you want to delete this airline?')) {
      this.aviationDataService.deleteAirline(id).subscribe({
        next: () => this.loadData()
      });
    }
  }
}
