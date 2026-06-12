# ✈️ Volant Airlines - Reservation Management System (ARMS)

Volant Airlines is a production-ready, full-stack airline reservation and flight tracking system built with **Java Spring Boot 3.x** and **Angular 18+**. The project features a premium glassmorphic dashboard design, live flight radar tracking, an AI-powered travel assistant chatbot, dynamic travel packages with currency/class pricing toggles, and robust real-time API integrations (Open-Meteo, REST Countries, and OpenSky Network).

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
