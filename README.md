# HyRyder — PNG Ride-Hailing Platform

> Papua New Guinea's premium ride-hailing platform, built to international standards and engineered for PNG's infrastructure realities.

## Products

| Product | Platform | Tech Stack |
|---|---|---|
| **Passenger App** | iOS + Android | React Native + Expo |
| **Driver App** | iOS + Android | React Native + Expo |
| **Admin Dashboard** | Browser | Next.js 14 + Tailwind |
| **Backend API** | Server | Django REST Framework |

## Architecture

```
apps/passenger-app/     React Native (Expo) — passenger booking app
apps/driver-app/        React Native (Expo) — driver app with GPS broadcast
admin-web/              Next.js 14 — operations & analytics dashboard
backend/                Django REST Framework + Channels + Celery
packages/shared-types/  Shared TypeScript types (all three apps)
infrastructure/         Terraform — AWS ap-southeast-2 (Sydney)
```

## Quick Start — Local Development

### Prerequisites
- Docker + Docker Compose
- Node.js 20+
- Python 3.12+

### 1. Clone and set up backend

```bash
cd backend
cp .env.example .env
# Edit .env with your credentials (Twilio, Stripe, Google Maps)
```

### 2. Start all services

```bash
docker compose up -d
```

This starts:
- PostgreSQL 16 + PostGIS (port 5432)
- Redis 7 (port 6379)
- Django REST API (port 8000)
- Django Channels / Daphne (port 8001)
- Celery worker + Celery Beat
- Flower monitoring (port 5555)

### 3. Apply migrations

```bash
docker compose exec django python manage.py migrate
docker compose exec django python manage.py createsuperuser
```

### 4. Start frontend apps

```bash
npm install
npm run dev
```

Or individually:

```bash
# Admin dashboard
cd admin-web && npm run dev    # → http://localhost:3000

# Passenger app (requires Expo Go or simulator)
cd apps/passenger-app && npx expo start

# Driver app
cd apps/driver-app && npx expo start
```

## API Documentation

Once Django is running, visit:

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Django Admin**: http://localhost:8000/admin/

## Key Features

### Backend (Django)
- Phone OTP authentication via Twilio Verify
- JWT tokens with refresh rotation & blacklisting
- Real-time driver tracking via Django Channels WebSockets
- PostGIS geo queries — nearest drivers within N km
- Trip state machine (REQUESTED → DRIVER_MATCHED → DRIVER_ARRIVED → IN_PROGRESS → COMPLETED)
- Dynamic surge pricing via Celery Beat (every 5 minutes)
- Payment support: Cash, Stripe card, Digicel MiCash, Vodafone M-PAiSA
- Driver wallet + payout system
- All money stored as integers in **toea** (1 PGK = 100 toea) — never floats
- Document expiry reminders via Celery Beat
- Structured JSON logging (structlog) + Sentry integration
- Auto-generated OpenAPI 3 documentation (drf-spectacular)

### Passenger App
- Phone number OTP login (+675 PNG validation)
- Live map with nearby driver markers
- Ride booking with fare estimation
- Real-time driver location tracking via WebSocket
- Multiple payment methods (Cash, Card, MiCash, M-PAiSA)
- Trip history
- In-app SOS emergency button with GPS snapshot

### Driver App
- Online/offline toggle with GPS broadcast (every 3 seconds)
- Auto-reconnect WebSocket with exponential backoff
- Earnings dashboard + wallet balance
- Payout request via MiCash / M-PAiSA / Stripe Connect

### Admin Dashboard
- Operations overview — KPI cards, revenue charts, trip volume
- Driver management — verification status, KYC documents
- Payments reconciliation
- TanStack Table for sortable trip grids
- Recharts for analytics visualization

## PNG-Specific Considerations

- **Cash is always supported** — unbanked passengers can book and pay cash
- **Offline-first** — mobile apps handle reconnection gracefully
- **Low bandwidth** — API responses compressed with gzip
- **Toea (not PGK)** — all monetary values stored as integers
- **Tok Pisin** — i18n support with `i18next` (en + tpi)
- **+675 phone validation** — PNG country code enforced

## Technology Stack

| Layer | Technology |
|---|---|
| Mobile Apps | React Native + Expo (TypeScript) |
| Web Admin | Next.js 14 (TypeScript, App Router) |
| API | Django REST Framework 3.x |
| Real-Time | Django Channels 4 + Redis Channel Layer |
| Async Tasks | Celery 5 + Celery Beat |
| Database | PostgreSQL 16 + PostGIS |
| Cache | Redis 7 |
| Object Storage | AWS S3 |
| Cloud | AWS ap-southeast-2 (Sydney) |
| Containers | Docker + AWS ECS Fargate |
| Infrastructure | Terraform |
| Maps | Google Maps Platform |
| Payments | Stripe + Digicel MiCash + Vodafone M-PAiSA + Cash |
| SMS / OTP | Twilio Verify |
| Monitoring | Sentry + structlog |

## Development Roadmap

- **Phase 1** (Months 1–3): Foundation — auth, profiles, vehicles, CI/CD ✅
- **Phase 2** (Months 3–5): Core ride flow — trips, real-time tracking, pricing
- **Phase 3** (Months 5–7): Payments, ratings, promo codes
- **Phase 4** (Months 7–9): Surge pricing, scheduled rides, corporate accounts, pre-launch

## Testing

```bash
cd backend
pytest                          # Run all tests
pytest tests/test_auth.py       # Auth tests only
pytest tests/test_pricing.py    # Pricing / fare calculation tests
pytest --cov=apps               # With coverage report
```

## Deployment

```bash
cd infrastructure/environments/staging
terraform init
terraform plan -var="db_password=YOUR_PASSWORD"
terraform apply
```

See [`PNG_RideHailing_Blueprint.md`](./PNG_RideHailing_Blueprint.md) for the complete technical blueprint.
