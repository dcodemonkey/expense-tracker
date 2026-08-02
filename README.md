# Expense Tracker

A multi-platform application that parses transactional SMS and email messages automatically to track your spending. It syncs data in real-time between a React-based web dashboard and an Android mobile client, backed by a robust FastAPI service.

---

## How it works

The core idea is simple: instead of manually logging every coffee or grocery purchase, the system captures transactions from the financial notifications you already receive.

1. **Capture:** The Android app listens for incoming transaction SMS alerts (supporting major Indian banks like HDFC, SBI, ICICI, etc., and payment apps like Paytm or PhonePe).
2. **Sync:** A local background worker extracts details (amount, merchant, transaction type) and securely pushes them to the backend server.
3. **Visualize:** You log in to the web dashboard to see real-time charts, daily analytics, custom budget progression, and category breakdowns.

---

## Key Features

* **Auto-Extraction:** Regex-based parsers extract amounts, merchants, and categories from standard banking notification templates.
* **Offline Support:** The Android app uses an offline-first Room database, queuing sync requests with WorkManager to push transactions once an internet connection is established.
* **Smart Categorization:** Uses a basic rule engine to auto-assign categories (e.g., Food & Dining, Travel, Utilities) based on merchant names.
* **Budget Tracking:** Set category-level limits and receive warnings when spending approaches your limit.
* **Weather & Context Integration:** Features a location-aware weather widget on the dashboard (using browser geolocation with a reliable multi-provider IP consensus fallback).

---

## Tech Stack

* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts
* **Backend:** FastAPI, SQLAlchemy 2.0 (Async), PostgreSQL, Alembic, Redis
* **Android:** Kotlin, Jetpack Compose, Hilt, Room DB, WorkManager, Retrofit
* **Deployment:** Docker Compose, GitHub Actions

---

## Getting Started

### Prerequisites

To run the web dashboard and API server, you only need:
* **Docker Desktop** (make sure it is running)
* **Android Studio** (only if you want to run the mobile app)

---

### Running the Services (Docker)

We provide automated scripts to verify that Docker is installed and running, then spin up the backend, frontend, database, and Redis cache containers.

#### PowerShell (Windows)
Run the script:
```powershell
.\start.ps1
```

#### Git Bash (or Linux / macOS)
Run the shell script:
```bash
chmod +x start.sh
./start.sh
```

Once started, the services are accessible at:
* **Web Dashboard:** http://localhost:3000
* **API Documentation:** http://localhost:8000/docs
* **Admin Dashboard:** http://localhost:8501

To stop all services and container processes:
```bash
docker compose down
```

---

### Running the Android Client

1. Open the `android-app` folder inside Android Studio.
2. Let Gradle sync project files.
3. Start an emulator or connect a physical device via USB debugging.
4. Click **Run**.
> *Note: If you run an emulator on the same machine as the backend, ensure the API base URL in the app configurations points to `http://10.0.2.2:8000/api/v1` so the emulator can bridge to your machine's localhost.*

---

## Config & Environment Variables

### Backend Configuration (`backend/.env`)

Copy the example env file and update your variables:
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/expense_tracker
SECRET_KEY=generate-a-secure-random-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=11520   # 8-day token validity
FRONTEND_URL=http://localhost:3000
```

### Frontend Configuration (`frontend/.env.production`)

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## Project Layout

```
expense-tracker/
├── backend/            # FastAPI API server, SQLAlchemy models, migration scripts
├── frontend/           # Vite + React source code and styling assets
├── android-app/        # Native Kotlin app with Jetpack Compose
└── admin/              # Basic Streamlit admin client for debugging database tables
```

---

## Testing

To run tests across any of the platforms:

```bash
# Backend unit tests
cd backend && pytest

# Frontend tests
cd frontend && npm run test

# Android tests
./gradlew test
```

---

## Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/cool-idea`).
3. Make changes and verify by running tests.
4. Commit your changes and open a Pull Request.

---

## License

This project is licensed under the MIT License.