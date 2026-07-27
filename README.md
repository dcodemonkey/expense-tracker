# Expense Tracker - Full Stack Application

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