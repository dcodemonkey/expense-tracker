# Expense Tracker – Full‑Stack Application

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)  
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 🎯 Overview

**Expense Tracker** is a production‑ready, multi‑platform expense‑tracking suite that consists of:

- **Web Dashboard** – React 18 + TypeScript UI built with Vite and Tailwind CSS.
- **Backend API** – FastAPI (Python 3.11) with async SQLAlchemy, JWT auth and a PostgreSQL database.
- **Android App** – Kotlin + Jetpack Compose client that parses SMS/Email transactions automatically and syncs in real‑time.

The app provides automatic transaction extraction, smart categorisation, budgeting, insights, and real‑time sync across devices.

---

## 📸 Screenshots

| Dashboard | Mobile App |
|----------|------------|
| ![Dashboard](/C:/Users/indev/.gemini/antigravity-ide/brain/f93a761e-9c4e-4b74-99c4-7a7e6906005d/media__1785152401309.png) | ![Android Home](/C:/Users/indev/.gemini/antigravity-ide/brain/f93a761e-9c4e-4b74-99c4-7a7e6906005d/media__1785153318971.png) |

---

## ✨ Key Features

- **Automatic Transaction Extraction** – SMS & email parsing for Indian banks and UPI apps.
- **Real‑time Sync** – WorkManager on Android pushes data to the FastAPI backend; the web client receives updates via TanStack Query.
- **Smart Categorisation** – ML‑driven merchant classification with customizable categories.
- **Budget Management** – Set per‑category budgets and receive push alerts when limits are exceeded.
- **Insights & Analytics** – Interactive charts (Recharts) showing trends, merchant analysis and spending breakdowns.
- **Location‑aware Weather Widget** – Uses the browser Geolocation API with a high‑accuracy fallback and IP‑consensus engine.

---

## 🏗️ Architecture

```mermaid
graph LR
    subgraph Frontend
        FE[React Web App]
    end
    subgraph Backend
        BE[FastAPI]
        DB[(PostgreSQL)]
        Cache[(Redis)]
    end
    subgraph Android
        AND[Jetpack Compose]
        Room[Room DB]
        WM[WorkManager]
    end
    FE --> BE
    AND --> BE
    BE --> DB
    BE --> Cache
    AND --> WM --> BE
    AND --> Room
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, SQLAlchemy 2.0, PostgreSQL, Alembic, Pydantic, JWT, Passlib |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts |
| **Android** | Kotlin, Jetpack Compose, Hilt, Room, WorkManager, Retrofit, Coroutines |
| **DevOps** | Docker Compose, Railway, GitHub Actions |

---

## 🚀 Getting Started

### Prerequisites

- **Docker & Docker‑Compose** (for production containers).
- **Node.js 18+** and **npm**.
- **Python 3.11+** (for the backend).
- **Android Studio** (for Android development).

### One‑Click Launcher (recommended)

From the repository root (`d:\Projects\expense-tracker`):

```powershell
# Windows PowerShell
.\start-all.ps1
```

Or on Unix‑like shells:

```bash
./start-all.sh
```

### Run All Services Locally (Manual)
If you prefer to start each component in separate terminals, follow these steps:
1. **Backend** – Open a terminal, navigate to `backend`, activate the virtual environment and run:
   ```bash
   cd backend
   source venv/Scripts/activate   # Windows
   # source venv/bin/activate      # macOS/Linux
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Frontend** – Open another terminal, navigate to `frontend`, install dependencies and start the dev server:
   ```bash
   cd frontend
   npm install
   npm run dev   # http://localhost:5173
   ```

3. **Android** – Open the `android-app` folder in Android Studio, sync Gradle and run the `app` module on an emulator or physical device.

4. **Admin Panel (optional)** – If you need the admin UI, run:
   ```bash
   cd admin
   pip install -r requirements.txt
   streamlit run app.py
   ```

#### Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate   # Windows
# source venv/bin/activate      # macOS/Linux
pip install .
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev   # Vite dev server (http://localhost:5173)
```

#### Android

Open `android-app` in Android Studio, sync Gradle and run the `app` module on an emulator or device.

---

## 📋 Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/expense_tracker
SECRET_KEY=super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=11520   # 8 days
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env.production`)

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 📚 API Reference

The backend automatically generates an OpenAPI spec at `http://localhost:8000/docs`.

Key groups include:

- **Authentication** – `/auth/register`, `/auth/login`, `/auth/me`
- **Categories** – CRUD endpoints under `/categories`
- **Transactions** – CRUD and summary under `/transactions`
- **Budgets** – CRUD under `/budgets`
- **Insights** – Dashboard, trends, merchant analysis, etc.
- **Sync** – Android device registration and message sync (`/sync`)

---

## 📂 Project Structure

```
expense-tracker/
├─ backend/                 # FastAPI server
│  ├─ app/
│  │   ├─ api/v1/endpoints/   # Route handlers
│  │   ├─ core/                # Config, security, DB
│  │   ├─ models/              # SQLAlchemy models
│  │   ├─ schemas/             # Pydantic schemas
│  │   └─ services/            # Business logic (parser, insights)
│  └─ pyproject.toml
├─ frontend/                # React + Vite
│  ├─ src/
│  │   ├─ components/          # UI widgets (WeatherWidget, LiveLocationTracker, …)
│  │   ├─ pages/               # Dashboard, Budgets, Settings, …
│  │   ├─ hooks/               # Custom React hooks
│  │   ├─ lib/                 # API client utilities
│  │   └─ types/               # TypeScript definitions
│  └─ vite.config.ts
├─ android-app/              # Kotlin Compose app
│  └─ app/src/main/java/com/expensetracker/app/
│      ├─ data/      # Repository, Room DAO
│      ├─ di/        # Hilt modules
│      ├─ ui/        # Compose UI screens
│      ├─ service/   # SMS receiver, FCM service
│      └─ worker/    # WorkManager workers
└─ admin/                    # Optional admin panel (Streamlit)
```

---

## ✅ Testing

```bash
# Backend tests
cd backend && pytest

# Frontend tests
cd frontend && npm run test

# Android unit tests
./gradlew test
```

---

## 🤝 Contributing

1. Fork the repo.
2. Create a feature branch (`git checkout -b feat/awesome-feature`).
3. Install dependencies and run the relevant tests.
4. Ensure code style passes (`npm run lint` / `flake8`).
5. Open a Pull Request describing the change.

---

## 📄 License

MIT License – see the `LICENSE` file for details.

---

*Happy coding! 🚀*

A comprehensive expense tracking application with web (React + FastAPI) and Android (Kotlin + Compose) clients that automatically extracts transactions from SMS and email messages.

## Features

### Core Features
- **Automatic Transaction Extraction**: Parse SMS and email messages for financial transactions
- **Multi-platform**: Web dashboard + Android app with real-time sync
- **Smart Categorization**: ML-based merchant categorization (Food, Transport, Shopping, etc.)
- **Budget Management**: Set budgets by category with alerts
- **Insights & Analytics**: Daily/weekly/monthly spending trends, merchant analysis, category breakdowns
- **Real-time Sync**: Background sync from Android to cloud

### Web Application (React + FastAPI)
- Modern React 18 + TypeScript + Vite frontend
- FastAPI + SQLAlchemy + PostgreSQL backend
- JWT Authentication with secure password hashing
- Interactive charts with Recharts
- Responsive design with Tailwind CSS
- RESTful API with OpenAPI documentation

### Android Application (Kotlin + Compose)
- Jetpack Compose UI with Material 3
- Hilt Dependency Injection
- Room Database for offline-first architecture
- WorkManager for background sync
- SMS BroadcastReceiver for automatic parsing
- Firebase Cloud Messaging for push notifications
- SMS parsing with regex patterns for Indian banks/UPI

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Android App   │◄───►│   FastAPI Backend│◄───►│  React Web App  │
│  (SMS/Email)    │     │  (PostgreSQL)   │     │  (Dashboard)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Local Room DB  │     │  Redis Cache    │     │  LocalStorage   │
│  (Offline)      │     │  (Sessions)     │     │  (Auth Token)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+
- Android Studio (for Android development)

### 🚀 Unified One-Click Launcher (Recommended)

From the root directory (`d:\Projects\expense-tracker`), choose your favorite way to start all 3 services (**Backend**, **Frontend**, and **Admin**) in one command:

* **Windows Batch (Double-Click)**:
  Double-click `start-all.bat` or run in CMD:
  ```cmd
  start-all.bat
  ```

* **Git Bash / Terminal**:
  ```bash
  ./start-all.sh
  ```

* **PowerShell**:
  ```powershell
  .\start-all.ps1
  ```

---

### Manual Individual Setup
If you prefer running services in separate terminals:

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/Scripts/activate
pip install .
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

#### Admin Panel Setup
```bash
cd admin
pip install -r requirements.txt
export API_BASE_URL=http://127.0.0.1:8000/api/v1
streamlit run app.py
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login (OAuth2 password flow)
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/me` - Update profile

### Categories
- `GET /api/v1/categories` - List categories
- `POST /api/v1/categories` - Create category
- `PUT /api/v1/categories/{id}` - Update category
- `DELETE /api/v1/categories/{id}` - Delete category

### Transactions
- `GET /api/v1/transactions` - List transactions (with filters)
- `POST /api/v1/transactions` - Create transaction
- `GET /api/v1/transactions/summary` - Get summary stats
- `PUT /api/v1/transactions/{id}` - Update transaction
- `DELETE /api/v1/transactions/{id}` - Delete transaction

### Budgets
- `GET /api/v1/budgets` - List budgets with progress
- `POST /api/v1/budgets` - Create budget
- `PUT /api/v1/budgets/{id}` - Update budget
- `DELETE /api/v1/budgets/{id}` - Delete budget

### Insights
- `GET /api/v1/insights/dashboard` - Dashboard summary
- `GET /api/v1/insights/spending-trend` - Spending trends
- `GET /api/v1/insights/merchant-analysis` - Top merchants
- `GET /api/v1/insights/category-breakdown` - Category breakdown
- `GET /api/v1/insights/daily-insights` - Daily insights

### Sync (Android)
- `POST /api/v1/sync/sync` - Sync device messages
- `GET /api/v1/sync/devices` - List registered devices
- `DELETE /api/v1/sync/devices/{id}` - Remove device

## SMS Parsing

Supports major Indian banks and payment apps:
- HDFC, ICICI, SBI, Axis, Kotak, Yes Bank, IDFC, Federal, RBL, IndusInd
- PhonePe, Google Pay, Paytm, Amazon Pay
- Generic UPI and card transaction formats

### Example Parsed Messages
```
"Rs.500.00 debited from A/c XX1234 on 15-Jan-2024 at Swiggy. Info: Order #12345"
→ Amount: ₹500, Merchant: Swiggy, Category: Food & Dining, Type: Expense

"Rs.50000.00 credited to A/c XX1234 on 01-Jan-2024. Salary for Jan 2024"
→ Amount: ₹50,000, Type: Income, Category: Salary
```

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy 2.0** - Async ORM
- **PostgreSQL** - Primary database
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Passlib** - Password hashing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Query** - Server state management
- **React Router** - Routing
- **Recharts** - Charts
- **Tailwind CSS** - Styling
- **React Hook Form + Zod** - Forms & validation

### Android
- **Kotlin** - Language
- **Jetpack Compose** - UI toolkit
- **Hilt** - Dependency injection
- **Room** - Local database
- **Retrofit** - Networking
- **WorkManager** - Background tasks
- **Coroutines/Flow** - Async programming

## Project Structure

```
expense-tracker/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # API route handlers
│   │   ├── core/                # Config, security, database
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Business logic (SMS parser, insights)
│   │   └── main.py              # FastAPI app entry
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utilities, API client
│   │   └── types/               # TypeScript types
│   ├── package.json
│   └── vite.config.ts
└── android-app/
    └── app/
        └── src/main/java/com/expensetracker/app/
            ├── data/            # Data layer (local, remote, repository)
            ├── di/              # Hilt modules
            ├── ui/              # Compose UI screens
            ├── service/         # SMS receiver, FCM service
            └── worker/          # WorkManager workers
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/expense_tracker
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=11520
FRONTEND_URL=http://localhost:3000
```

## Development

### Running Tests
```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && npm run test

# Android
./gradlew test
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Deployment

### Docker Compose (Production)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes
Helm charts available in `deploy/kubernetes/`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details