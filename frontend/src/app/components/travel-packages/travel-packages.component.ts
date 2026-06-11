import { Component, OnInit } from '@angular/core';

interface TravelPackage {
  id: string;
  name: string;
  destinationCity: string;
  durationDays: number;
  imagePath: string;
  priceEconomy: number;
  priceBusiness: number;
  showBusinessPrice: boolean; // toggle state
  inclusions: string[];
  itinerary: { day: number; title: string; description: string }[];
  showItinerary: boolean; // accordion state
}

@Component({
  selector: 'app-travel-packages',
  template: `
    <div class="packages-section-wrapper animate-fade-in">
      
      <!-- 1. DESTINATION GALLERY -->
      <div class="gallery-container">
        <div class="section-header">
          <h2 class="title gradient-text">Curated Destinations</h2>
          <p class="subtitle">Handpicked global gateways for absolute comfort and exploration.</p>
        </div>
        
        <div class="gallery-grid">
          <div class="gallery-item" *ngFor="let dest of destinations">
            <img [src]="dest.image" [alt]="dest.name" loading="lazy" class="gallery-img" />
            <div class="gallery-overlay">
              <div class="overlay-text">
                <h3>{{ dest.name }}</h3>
                <span class="price-hint">Flights from \${{ dest.startPrice }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. TRAVEL PACKAGE CARDS -->
      <div class="packages-container">
        <div class="section-header">
          <h2 class="title gradient-text">All-in-One Travel Packages</h2>
          <p class="subtitle">Premium accommodation, roundtrip flights, rail passes, and private tours fully pre-arranged.</p>
        </div>

        <div class="packages-grid">
          <div class="package-card glass-panel" *ngFor="let pkg of packages">
            <div class="card-img-container">
              <img [src]="pkg.imagePath" [alt]="pkg.name" loading="lazy" class="card-img" />
              <span class="duration-badge">{{ pkg.durationDays }} Days</span>
            </div>

            <div class="card-content">
              <h3 class="package-title">{{ pkg.name }}</h3>
              <p class="package-dest">📍 {{ pkg.destinationCity }}</p>

              <!-- Economy vs Business Price Toggle -->
              <div class="price-toggle-container">
                <span class="toggle-lbl" [class.active]="!pkg.showBusinessPrice">Economy</span>
                <label class="switch">
                  <input type="checkbox" [(ngModel)]="pkg.showBusinessPrice" />
                  <span class="slider round"></span>
                </label>
                <span class="toggle-lbl" [class.active]="pkg.showBusinessPrice">Business</span>
              </div>

              <!-- Price Box -->
              <div class="price-box">
                <span class="price-val">\${{ pkg.showBusinessPrice ? pkg.priceBusiness : pkg.priceEconomy }}</span>
                <span class="price-sub">/ passenger all-inclusive</span>
              </div>

              <!-- Inclusions -->
              <div class="inclusions-section">
                <h4>Package Inclusions</h4>
                <ul class="inclusions-list">
                  <li *ngFor="let inc of pkg.inclusions">
                    <span class="check-icon">✓</span> {{ inc }}
                  </li>
                </ul>
              </div>

              <!-- Expandable Itinerary Accordion -->
              <div class="itinerary-accordion">
                <button class="accordion-trigger" (click)="pkg.showItinerary = !pkg.showItinerary">
                  <span>{{ pkg.showItinerary ? 'Hide Itinerary' : 'View Daily Itinerary' }}</span>
                  <span class="accordion-arrow">{{ pkg.showItinerary ? '▲' : '▼' }}</span>
                </button>
                
                <div class="accordion-content" *ngIf="pkg.showItinerary">
                  <div class="itinerary-timeline">
                    <div class="timeline-step" *ngFor="let day of pkg.itinerary">
                      <div class="timeline-badge">Day {{ day.day }}</div>
                      <div class="timeline-desc">
                        <h5>{{ day.title }}</h5>
                        <p>{{ day.description }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action button -->
              <button class="btn btn-primary btn-book-pkg" (click)="bookPackage(pkg)">
                Book Package Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. PRIVILEGES COMPARISON TABLE -->
      <div class="pricing-table-container">
        <div class="section-header">
          <h2 class="title gradient-text">Cabin privilege Tiers</h2>
          <p class="subtitle">Compare Economy vs Business privileges to find your perfect style of travel.</p>
        </div>

        <div class="table-responsive glass-panel">
          <table class="pricing-table">
            <thead>
              <tr>
                <th class="feature-col">Privileges & Benefits</th>
                <th class="tier-col">Essential Economy</th>
                <th class="tier-col premium-tier">Premium Business Suite</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="lbl">Air Travel Class</td>
                <td>Ergonomic Economy Cabin</td>
                <td class="premium-tier bold">Luxury Business Cabin</td>
              </tr>
              <tr>
                <td class="lbl">Seat Comfort</td>
                <td>Standard seat (32" legroom)</td>
                <td class="premium-tier">180° Lie-Flat Suite (78" bed)</td>
              </tr>
              <tr>
                <td class="lbl">Lounge Access</td>
                <td>Not Included</td>
                <td class="premium-tier">Free VIP Airport Lounge access</td>
              </tr>
              <tr>
                <td class="lbl">Baggage Allowance</td>
                <td>1x 23kg Checked Bag</td>
                <td class="premium-tier">2x 32kg Checked Bags (Priority tagged)</td>
              </tr>
              <tr>
                <td class="lbl">In-Flight Dining</td>
                <td>Complimentary Hot Meals & Beverage</td>
                <td class="premium-tier">Multi-course Michelin dining & Champagne</td>
              </tr>
              <tr>
                <td class="lbl">Priority Privileges</td>
                <td>Standard boarding</td>
                <td class="premium-tier">Priority Check-in, Security, & Boarding</td>
              </tr>
              <tr>
                <td class="lbl">Refund & Modifications</td>
                <td>Change fees apply</td>
                <td class="premium-tier">Free modifications & refunds allowed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .packages-section-wrapper {
      margin-top: 40px;
      margin-bottom: 50px;
      display: flex;
      flex-direction: column;
      gap: 50px;
    }

    .section-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .section-header .title {
      font-size: 2rem;
      margin: 0 0 8px 0;
    }
    .section-header .subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
      margin: 0;
    }

    /* 1. DESTINATION GALLERY STYLING */
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
    }
    .gallery-item {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 4/3;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      cursor: pointer;
      transition: var(--transition-smooth);
    }
    .gallery-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .gallery-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0) 100%);
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      height: 60%;
      transition: var(--transition-smooth);
    }
    .overlay-text h3 {
      margin: 0 0 4px 0;
      color: #ffffff;
      font-size: 1.25rem;
      font-family: var(--font-title);
      font-weight: 700;
    }
    .overlay-text .price-hint {
      color: #93c5fd;
      font-size: 0.85rem;
      font-weight: 600;
    }
    .gallery-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .gallery-item:hover .gallery-img {
      transform: scale(1.08);
    }

    /* 2. TRAVEL PACKAGE CARDS STYLING */
    .packages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 30px;
    }
    .package-card {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: var(--transition-smooth);
    }
    .card-img-container {
      position: relative;
      height: 200px;
      overflow: hidden;
    }
    .card-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .duration-badge {
      position: absolute;
      top: 15px;
      right: 15px;
      background: var(--primary);
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 20px;
      box-shadow: 0 2px 10px var(--primary-glow);
    }
    
    .card-content {
      padding: 24px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .package-title {
      font-size: 1.25rem;
      margin: 0 0 4px 0;
      font-family: var(--font-title);
      color: var(--text-primary);
    }
    .package-dest {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 20px;
      font-weight: 600;
    }

    /* Economy vs Business pricing toggle slider */
    .price-toggle-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    .toggle-lbl {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: color 0.2s;
    }
    .toggle-lbl.active {
      color: var(--primary);
    }
    .switch {
      position: relative;
      display: inline-block;
      width: 46px;
      height: 22px;
    }
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: var(--bg-secondary);
      transition: .3s;
      border: 1px solid var(--glass-border);
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 16px; width: 16px;
      left: 2px; bottom: 2px;
      background-color: var(--primary);
      transition: .3s;
    }
    input:checked + .slider {
      background-color: var(--primary-glow);
    }
    input:checked + .slider:before {
      transform: translateX(24px);
    }
    .slider.round {
      border-radius: 20px;
    }
    .slider.round:before {
      border-radius: 50%;
    }

    .price-box {
      text-align: center;
      background: var(--bg-secondary);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--glass-border);
    }
    .price-val {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-primary);
      font-family: var(--font-title);
    }
    .price-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .inclusions-section {
      margin-bottom: 20px;
    }
    .inclusions-section h4 {
      font-size: 0.85rem;
      text-transform: uppercase;
      color: var(--text-secondary);
      margin-bottom: 10px;
      font-weight: 700;
    }
    .inclusions-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .inclusions-list li {
      font-size: 0.8rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .check-icon {
      color: var(--success);
      font-weight: bold;
    }

    /* Expandable Accordion */
    .itinerary-accordion {
      margin-bottom: 20px;
      border-top: 1px solid var(--glass-border);
      border-bottom: 1px solid var(--glass-border);
      padding: 12px 0;
    }
    .accordion-trigger {
      background: transparent;
      border: none;
      width: 100%;
      display: flex;
      justify-content: space-between;
      color: var(--primary);
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      outline: none;
    }
    .accordion-content {
      margin-top: 15px;
    }
    .itinerary-timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;
      position: relative;
      padding-left: 10px;
      border-left: 1px dashed var(--glass-border);
    }
    .timeline-step {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .timeline-badge {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
    }
    .timeline-desc h5 {
      font-size: 0.8rem;
      margin: 0 0 2px 0;
      color: var(--text-primary);
    }
    .timeline-desc p {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin: 0;
      line-height: 1.3;
    }
    .btn-book-pkg {
      width: 100%;
      height: 42px;
      font-size: 0.9rem;
    }

    /* 3. PRIVILEGES COMPARISON TABLE STYLING */
    .pricing-table-container {
      margin-top: 20px;
    }
    .table-responsive {
      overflow-x: auto;
      border-radius: 12px;
    }
    .pricing-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;
    }
    .pricing-table th, .pricing-table td {
      padding: 16px 20px;
      border-bottom: 1px solid var(--glass-border);
      color: var(--text-primary);
    }
    .pricing-table th {
      font-family: var(--font-title);
      font-weight: 700;
      background: var(--bg-secondary);
    }
    .pricing-table .feature-col {
      width: 30%;
      font-weight: 600;
    }
    .pricing-table .tier-col {
      width: 35%;
      text-align: center;
    }
    .pricing-table td:not(.feature-col) {
      text-align: center;
    }
    .pricing-table .premium-tier {
      background: var(--primary-glow);
    }
    .pricing-table th.premium-tier {
      color: var(--primary);
    }
    .pricing-table td.lbl {
      font-weight: 600;
      color: var(--text-secondary);
    }
  `]
})
export class TravelPackagesComponent implements OnInit {
  
  destinations = [
    { name: 'Tokyo, Japan', startPrice: 850, image: 'assets/tokyo_package.png' },
    { name: 'Paris, France', startPrice: 920, image: 'assets/paris_package.png' },
    { name: 'Dubai, UAE', startPrice: 780, image: 'assets/dubai_package.png' },
    { name: 'London, UK', startPrice: 890, image: 'assets/london_package.png' }
  ];

  packages: TravelPackage[] = [
    {
      id: 'pkg_tokyo_kyoto',
      name: 'Grand Tokyo & Kyoto Explorer',
      destinationCity: 'Tokyo & Kyoto, Japan',
      durationDays: 5,
      imagePath: 'assets/tokyo_package.png',
      priceEconomy: 1250,
      priceBusiness: 2850,
      showBusinessPrice: false,
      inclusions: [
        'Roundtrip flights (Economy / Business)',
        '4-star boutique hotel accommodation',
        'Shinkansen bullet train pass (Green Car for Business)',
        'Daily traditional buffet breakfast',
        'Guided tour of Fushimi Inari Shrine'
      ],
      showItinerary: false,
      itinerary: [
        { day: 1, title: 'Tokyo Arrival & Shinjuku Neon Walk', description: 'Arrive at Tokyo Haneda Airport, transfer to your hotel, and enjoy a guided evening walking tour of Shinjuku.' },
        { day: 2, title: 'Historic Asakusa & Shibuya Crossing', description: 'Explore Asakusa Senso-ji temple, take a cruise down the Sumida River, and witness the famous Shibuya Crossing.' },
        { day: 3, title: 'Bullet Train to Kyoto & Fushimi Inari', description: 'Board the Shinkansen to Kyoto. Visit the iconic Fushimi Inari Shrine and walk through the thousand vermilion torii gates.' },
        { day: 4, title: 'Arashiyama Bamboo Grove & Golden Pavilion', description: 'Walk through the towering Bamboo Grove and admire the stunning Kinkaku-ji (Golden Pavilion) reflecting in the pond.' },
        { day: 5, title: 'Kyoto Crafts & Tokyo Departure', description: 'Participate in a matcha tea ceremony, board the return bullet train, and transfer to Haneda Airport for your flight.' }
      ]
    },
    {
      id: 'pkg_london_paris',
      name: 'European Heritage: London & Paris',
      destinationCity: 'London, UK & Paris, France',
      durationDays: 5,
      imagePath: 'assets/paris_package.png',
      priceEconomy: 1480,
      priceBusiness: 3450,
      showBusinessPrice: false,
      inclusions: [
        'Roundtrip flights (Economy / Business)',
        'Eurostar high-speed rail ticket',
        '4-star central city hotel stays',
        'Daily English / French breakfasts',
        'Sena River Dinner Cruise (Paris)'
      ],
      showItinerary: false,
      itinerary: [
        { day: 1, title: 'London Arrival & Westminster Walk', description: 'Arrive at Heathrow Airport, check into your hotel, and see Big Ben, Westminster Abbey, and the London Eye.' },
        { day: 2, title: 'Tower Bridge & British Museum', description: 'Enjoy priority entry to the Tower of London and see the Crown Jewels, followed by an afternoon at the British Museum.' },
        { day: 3, title: 'Eurostar to Paris & Seine Cruise', description: 'Board the Eurostar to Paris Gare du Nord. Experience a romantic dinner cruise on the Seine River under twinkling Eiffel lights.' },
        { day: 4, title: 'Louvre Art & Eiffel Tower Ascent', description: 'Tour the Louvre Museum to see the Mona Lisa, and ascend to the 2nd floor of the Eiffel Tower for panoramic city views.' },
        { day: 5, title: 'Palace of Versailles & Departure', description: 'Visit the Hall of Mirrors at Versailles, and return to Charles de Gaulle Airport for your flight home.' }
      ]
    },
    {
      id: 'pkg_dubai_luxury',
      name: 'Arabian Nights: Dubai Luxury Escape',
      destinationCity: 'Dubai, United Arab Emirates',
      durationDays: 5,
      imagePath: 'assets/dubai_package.png',
      priceEconomy: 1150,
      priceBusiness: 2700,
      showBusinessPrice: false,
      inclusions: [
        'Roundtrip flights (Economy / Business)',
        '5-star luxury resort accommodation',
        'Desert Safari with BBQ dinner & show',
        'Burj Khalifa 124th floor entry ticket',
        'Private airport Mercedes transfers'
      ],
      showItinerary: false,
      itinerary: [
        { day: 1, title: 'Dubai Arrival & Marina Dhow Cruise', description: 'Arrive at Dubai DXB, private transfer to your resort, and board a luxury glass-enclosed yacht dinner cruise.' },
        { day: 2, title: 'Burj Khalifa & Fountain Show', description: 'Ascend the tallest building in the world, shop at Dubai Mall, and watch the spectacular Dubai Fountain Show.' },
        { day: 3, title: 'Desert Safari & Dunes BBQ', description: 'Dune bash in a 4x4 Land Cruiser, ride camels, and enjoy a traditional Arabian buffet dinner under the desert stars.' },
        { day: 4, title: 'Palm Jumeirah & Waterpark', description: 'Relax at Palm Jumeirah beach, visit the Atlantis resort, and enjoy access to Aquaventure Waterpark.' },
        { day: 5, title: 'Souk Madinat & Departure', description: 'Shop for spices and gold at Souk Madinat Jumeirah, take a final private transfer to DXB for your return flight.' }
      ]
    }
  ];

  constructor() {}

  ngOnInit(): void {}

  bookPackage(pkg: TravelPackage): void {
    const flightClass = pkg.showBusinessPrice ? 'BUSINESS' : 'ECONOMY';
    const price = pkg.showBusinessPrice ? pkg.priceBusiness : pkg.priceEconomy;
    
    alert(`🎉 Package Selected!\n\nPackage: ${pkg.name}\nCabin Tier: ${flightClass}\nPrice: $${price}\n\nOur Volant AI Concierge has generated your itinerary! Redirecting to booking confirmation...`);
  }
}
