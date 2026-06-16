# ✈️ Volant Airlines - Reservation Management System (ARMS)

Volant Airlines is a production-ready, full-stack airline reservation and flight tracking system built with **Java Spring Boot 3.x** and **Angular 18+**. The project features a premium glassmorphic dashboard design, live flight radar tracking, an AI-powered travel assistant chatbot, dynamic travel packages with currency/class pricing toggles, and robust real-time API integrations (Open-Meteo, REST Countries, and OpenSky Network).

---

## ✨ Key Features & Recent Upgrades

Volant Airlines includes several advanced features that make it an industry-grade airline portal:

### 1. 🔁 Two-Way Round-Trip Booking Flow
- **Dual Flight Selection**: The booking page features a synchronized search layout. Selecting an outbound flight automatically saves it in the application state, presents an Outbound Flight details banner with a "Change" button, and swaps search inputs to query return flight paths dynamically on the return date.
- **Multi-Step Seat Selection Map**: An interactive passenger seat assignment layout guides travelers sequentially. Passengers choose their seat for the outbound leg (e.g., Seat 12A), then proceed to a dedicated seat map for the return leg, with back-navigation to modify outbound selections at any time.
- **Combined Checkout & Ticket Generation**: Computes total pricing by aggregating base fares, seat fees, taxes, and baggage allowances for both flights. The backend generates sequential reservation records, processes single-swipe sequential credit authorization, and generates concurrent download links for both outbound and return e-ticket PDFs.

### 2. 🏢 Volant Corporate Portal & Support Hub
- Located at a unified path `/info/:page`, the portal acts as a central hub for **13 distinct corporate, service, and contact sections** linked directly from the global footer:
  - **About Volant**: *Our Company* (details on Volant's founding, mission, and leadership under CEO **A S M RADWAN** at the **Tokyo, Japan** headquarters), *News & Press* (recent company highlights, flight path openings), *Global Alliances* (partner codeshare systems), and *Careers* (job application submissions).
  - **Services**: *Premium Business Class*, *Volant First Class* (amenities, flatbeds, private suite experiences), *In-Flight Dining* (curated chef menus), and *Cargo Services* (logistical freight).
  - **Support & Contact**: *Customer Service* (support ticketing dashboard), *Special Assistance* (medical and disability travel planning), *Baggage Information* (rules and calculators), *Email Support* (direct category-based inquiry form), and *Call Support* (hotlines supporting interactive `tel:` click-to-dial links, with the central helpdesk at **+817092026067**).

### 3. 🧮 Interactive Corporate Portal Widgets
- **Baggage Allowance Calculator**: Located in the Baggage Information section, this utility lets users input their cabin class, bag counts, and weights to dynamically determine checked and carry-on allowances. It computes over-limit fee estimates ($75 per extra piece, $50 for overweight items up to 32kg) in real-time.
- **In-Flight Dining Menu Viewer**: An elegant tabbed interface allowing travelers to view culinary menus by meal types (*Appetizers, Main Courses, Desserts, Wine List*). Features premium descriptions of gourmet entries (e.g., Wagyu Beef Ribeye, Match Crème Brûlée, Sake pairings).
- **Interactive Forms**:
  - *Customer Ticket Form*: Includes input validation, reservation reference lookup, and mock ticket creation.
  - *Careers Application Form*: Features mock resume uploads (`A_S_M_Radwan_CV.pdf` preset) and dropdown selector for Tokyo/global crew and pilot bases.
  - *Email Composer*: Dynamic category router (e.g., Booking Inquiry, Refund, Baggage, Corporate) with notification alerts upon submission.

### 4. 🎨 Design System, Theme Configurations, and Accessibility
- **Three Core Theme Variations**: Toggleable via the global settings panel:
  - *Light (White) Mode*: High-contrast clean styling with soft grey borders and high-legibility charcoal text.
  - *Mid (Steel/Blue) Mode*: Space-inspired blue and slate backgrounds with balanced grey text.
  - *Dark Mode*: Premium deep space black backgrounds with neon emerald overlays and white text.
- **Glassmorphism Design Tokens**: All themes share glassmorphic tokens using custom CSS properties (`--glass-bg`, `--glass-border`, `--glass-shadow`, `--text-primary`, `--input-bg`). Input forms, focus highlights, search fields, autocomplete options, and dropdown lists automatically adapt color structures to ensure AAA accessibility.
- **Responsive Layout**: Designed using CSS Flexbox, Grid, and media queries to offer a premium UI across standard desktop screens, tablets, and mobile devices.

### 5. ✈️ Live Flight Radar Tracker
- **Leaflet Map Integration**: Integrates a theme-adapting world map layer (switching between CartoDB Voyager, Positron, and Dark Matter tile basemaps).
- **Simulation Flight Engine**: Interpolates flight trajectories along geodesic curves, displaying telemetry (speed, heading, altitude, squawk, lat/lng coordinates) in real-time.
- **Interactive Sidebars & Timelines**:
  - *Left Sidebar*: Tabbed navigation showing *Most Tracked* flights (ranked by active viewer counts), *Disruptions* (delay boards for global airports), and *Bookmarks* (to save and watch target flights).
  - *Right Sidebar*: Telemetry dashboard HUD and *Alert Signup* forms (SMS/Email alerts on delays).
  - *Playback Controls*: A bottom toolbar containing timeline scrubbers, Play/Pause toggles, and playback speed multipliers (1x to 16x).
  - *Weather Radar Layers*: Renders Rain Radar polygons, Cloud density patterns, Turbulence areas, and Storm alert indicators.
  - *Radar Filters*: Dropdowns to filter traffic by aircraft type (Passenger, Cargo, Military, Private Jet, Helicopter) and airline.
- **AI Space Radar Assistant**: Natural language console to query map entities (e.g., `"Track flight JL23"`, `"find cargo planes"`, `"airports with delays"`, `"clear filters"`). Dynamically pans and zooms the camera and applies filters based on user inputs.

### 6. 📡 Real-Time APIs & Global Coverage
- **REST Countries Integration**: Calls the REST Countries API on-demand to fetch ISO-standard flag emojis (e.g., 🇯🇵, 🇧🇩, 🇺🇸) based on flight registers.
- **Open-Meteo Integration**: Computes real-time weather details (current temp, wind vectors, clear/rain status) using GPS coordinate fetches when querying airports on the map.
- **OpenSky Network Integration**: Directly interfaces with OpenSky API states arrays to merge live civilian flight trajectories into the simulation map.
- **Haversine Geodesic Scheduler**: Backed by a math-based flight generation algorithm. Generates on-demand flights for any airport pair worldwide, allowing users to search and book journeys between 6,000+ commercial airports and 240+ countries.

### 7. 🤖 AI Volant Support Assistant Chatbot
- A natural-language assistant panel embedded in the navbar.
- Directly parses destination/origin inputs from conversational statements (e.g., *"I want to fly from Dhaka to Tokyo on 2026-06-16"*).
- Interrogates the backend database to suggest matching flight routes, pricing, schedules, and handles seat reservations through friendly conversational prompts.
- Displays responsive adaptive components, markdown text, and links.


---

## 🏗️ Project Architecture & Layout

The codebase is structured into two main components and a database configuration directory:

```text
ARMS/
├── backend/                  # Spring Boot REST API (Java 21, Maven 3.x)
│   ├── src/main/java/com/airline/  # Controllers, Services, Repositories, Security, Models
│   └── src/main/resources/        # Database configurations, application properties
├── frontend/                 # Angular 18+ SPA (Single Page Application)
│   ├── src/app/components/        # Navbar, Flight Search, Radar Tracker, Chatbot, Admin views
│   └── src/app/services/          # Real-time API integrations, auth, and lookup connectors
├── database/                 # SQL Schemas and migrations
│   └── schema.sql            # Core database schema (partitioned reservations, search indexes)
├── docker-compose.yml        # Multi-container orchestration (MySQL, Redis, Services)
└── Jenkinsfile               # Local CI/CD deployment pipeline configuration
```

---

## 💻 System Prerequisites

Before setting up the project, make sure the following environment runtimes are installed on your machine:

| Prerequisite | Recommended Version | Purpose | OS Download Links |
| :--- | :--- | :--- | :--- |
| **Java JDK** | JDK 17 or 21 (LTS) | Runs the Spring Boot Backend | [Windows/macOS (Adoptium)](https://adoptium.net/) |
| **Node.js & npm** | Node.js 18+ / npm 10+ | Runs the Angular Frontend CLI | [Windows/macOS (NodeJS)](https://nodejs.org/) |
| **Database** | MySQL 8.0+ | Persistent Relational Store | [Windows/macOS (MySQL)](https://dev.mysql.com/downloads/) |
| **Docker** (Optional) | Desktop 4.x+ | Spins up MySQL/Redis instantly | [Windows/macOS (Docker)](https://www.docker.com/products/docker-desktop/) |
| **IDE** | IntelliJ / VS Code | Development environment | [IntelliJ IDEA](https://www.jetbrains.com/idea/) |

---

## 🚀 Step-by-Step Local Setup Guide

Follow these instructions to run the database, backend, and frontend servers locally on **Windows** or **macOS**.

### Step 1: Clone the Repository
Clone the codebase to your local directory:
```bash
git clone https://github.com/radwanromy/ARMS.git
cd ARMS
```

---

### Step 2: Database Setup

You can set up the MySQL database either using **Docker Compose (Recommended)** or via a **Local MySQL Installation**.

#### Option A: Using Docker Compose (Recommended)
This spins up a preconfigured MySQL database on host port `3306` (or mapping custom ports if `3306` is already occupied on your host).
* **Command (Windows PowerShell & macOS terminal)**:
  ```bash
  docker-compose up -d mysql
  ```

#### Option B: Using a Local MySQL Installation
1. Open your MySQL Command Line Client or favorite GUI (e.g., DBeaver, MySQL Workbench) and connect to your local server.
2. Run the SQL schema script located at `database/schema.sql` to create the databases, tables, partitioning structures, and optimization indexes:
   * **Windows Command Prompt (CMD)**:
     ```cmd
     mysql -u root -p < database\schema.sql
     ```
   * **macOS Terminal / Git Bash**:
     ```bash
     mysql -u root -p < database/schema.sql
     ```

---

### Step 3: Run the Backend Server (Spring Boot)

The backend project includes a built-in Maven Wrapper (`mvnw` for macOS, `mvnw.cmd` for Windows) to run commands without requiring a global Maven installation.

#### 🛠️ Configure Environment Variables
By default, the backend connects to `localhost:3306` with username `root` and password `root`. If your local setup differs, configure the following environment variables before starting:

* **Windows (PowerShell)**:
  ```powershell
  $env:DATABASE_PORT="3306"
  $env:DATABASE_USER="root"
  $env:DATABASE_PASSWORD="YourPasswordHere"
  $env:SPRING_CACHE_TYPE="simple"
  ```
* **macOS / Linux (Bash)**:
  ```bash
  export DATABASE_PORT="3306"
  export DATABASE_USER="root"
  export DATABASE_PASSWORD="YourPasswordHere"
  export SPRING_CACHE_TYPE="simple"
  ```

#### 🏃 Starting the Application
1. Navigate into the `backend` directory:
   ```bash
   cd backend
   ```
2. Compile, run seeds, and start the application:
   * **Windows (PowerShell / Command Prompt)**:
     ```powershell
     .\mvnw.cmd spring-boot:run
     ```
   * **macOS / Linux (Terminal)**:
     ```bash
     chmod +x mvnw
     ./mvnw spring-boot:run
     ```
3. The server will boot up, run database seeding scripts automatically (creating mock users, countries, airports, airlines, and flight dates), and run on **`http://localhost:8080`**.

---

### Step 4: Run the Frontend Server (Angular)

1. Open a new terminal window and navigate into the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install npm package dependencies:
   ```bash
   npm install
   ```
3. Start the Angular local development server:
   ```bash
   npm start
   ```
4. Once compiling is complete, open your browser and navigate to **`http://localhost:4200`** to view the application.

---

## 🧪 Testing and Verification

### 1. Running Backend Unit & Integration Tests
You can run surefire test suites locally:
* **Windows (PowerShell)**:
  ```powershell
  # If your username has multibyte or Japanese characters causing local repo creation errors, pass a clean repo path:
  $env:MAVEN_OPTS="-Dmaven.repo.local=C:\Users\Public\.m2\repository"
  .\mvnw.cmd test
  ```
* **macOS / Linux**:
  ```bash
  ./mvnw test
  ```

### 2. E2E Features Verification checklist
* **Default Credentials**: Login to the dashboard using username `user` and password `user123` (or `admin` / `admin123` for administrator dashboard access).
* **Airport Autocomplete**: Navigate to **Search Flights** page, type `"Dhaka"` or `"Tokyo"` into the Origin/Destination input fields, and verify that the glassmorphic autocomplete dropdown suggestions appear correctly.
* **AI Chatbot Support**: Click on **AI Volant Support** in the navbar and ask a query like: *"I want to fly from Dhaka to Tokyo on 2026-06-15"*. The assistant will dynamically resolve city/airport names to airport codes (`DAC` and `HND/NRT`) and list matching flights.
* **Live Radar Tracker**: Click **Live Radar** in the navigation bar to see interactive aircraft nodes traveling dynamically on aLeaflet map. Click on any plane icon to view live telemetry updates.

---

## 🐳 Docker Production Deploy (Optional)

To build and run the entire stack (MySQL, Redis, Backend, Frontend) in containerized production mode, execute:
```bash
docker-compose up --build -d
```
The services will orchestrate automatically:
* Frontend Web App: `http://localhost`
* Backend Rest API: `http://localhost:8080`
