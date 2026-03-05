# PNG Ride-Hailing Platform — Master Technical Blueprint

> **International-standard architecture for Papua New Guinea**
> Premium ride-hailing platform: Passenger App · Driver App · Web Admin Dashboard

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Architecture Overview](#2-platform-architecture-overview)
3. [Full Technology Stack](#3-full-technology-stack)
4. [Third-Party Services & Pricing](#4-third-party-services--pricing)
5. [Security Architecture](#5-security-architecture)
6. [Papua New Guinea — Specific Considerations](#6-papua-new-guinea--specific-considerations)
7. [Development Roadmap](#7-development-roadmap)
8. [Recommended Team Structure](#8-recommended-team-structure)
9. [Estimated Monthly Operating Costs](#9-estimated-monthly-operating-costs)
10. [Monorepo & Project Structure](#10-monorepo--project-structure)
11. [Key Recommendations & Next Steps](#11-key-recommendations--next-steps)

---

## 1. Executive Summary

This document is a complete, production-grade technical blueprint for building a **premium ride-hailing platform** targeting Papua New Guinea — functionally equivalent to Uber but engineered for PNG's infrastructure realities: intermittent connectivity, local payment methods, low-bandwidth devices, and a largely unbanked population.

### Three Products

| Product | Platform | Audience |
|---|---|---|
| Passenger Mobile App | iOS + Android | Riders booking trips |
| Driver Mobile App | iOS + Android | Drivers accepting & completing trips |
| Web Admin Dashboard | Browser | Operations, support, analytics |

All three share a single **Django REST Framework backend** with real-time capabilities via Django Channels + Redis, async task processing via Celery, and PostgreSQL (with PostGIS) as the primary database.

---

## 2. Platform Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                         │
│  Passenger App (RN)   Driver App (RN)   Admin Web (Next.js) │
└──────────────┬──────────────┬───────────────────┬──────────┘
               │  REST + WS   │                   │
┌──────────────▼──────────────▼───────────────────▼──────────┐
│               API GATEWAY  (AWS ALB + Nginx)                │
│          Rate limiting · SSL termination · Routing          │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  DJANGO APPLICATION LAYER                   │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Django REST  │  │   Django     │  │  Celery Workers  │  │
│  │ Framework   │  │  Channels    │  │  (Async Tasks)   │  │
│  │ (HTTP APIs) │  │ (WebSockets) │  │                  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└────────────┬─────────────────┬──────────────────┬──────────┘
             │                 │                  │
┌────────────▼──┐  ┌───────────▼──┐  ┌───────────▼──────────┐
│  PostgreSQL   │  │    Redis     │  │      AWS S3           │
│  + PostGIS   │  │  (Cache,     │  │  (Documents, Photos)  │
│  (Primary DB) │  │  Channels,   │  └──────────────────────┘
└──────────────┘  │  Celery Brkr)│
                  └──────────────┘
```

### 2.2 Django App Structure

The Django project is broken into focused, reusable apps — each owning its models, serializers, views, and URLs.

| Django App | Responsibility |
|---|---|
| `apps.authentication` | Phone/OTP registration, JWT tokens, refresh |
| `apps.users` | Passenger & driver profiles, KYC documents, ratings |
| `apps.trips` | Booking lifecycle — request → match → ride → complete |
| `apps.location` | Real-time GPS tracking, geofencing, nearby driver queries |
| `apps.pricing` | Fare calculation, surge pricing, promotions, promo codes |
| `apps.payments` | Wallet, card payments, mobile money, driver payouts |
| `apps.notifications` | Push, SMS, in-app alerts via Celery tasks |
| `apps.support` | Help tickets, disputes, in-app chat |
| `apps.analytics` | Business intelligence, reporting, admin metrics |
| `apps.vehicles` | Vehicle profiles, verification, categories (Standard/Premium/XL) |

### 2.3 Real-Time Architecture (Django Channels)

Live features — driver location, trip status, ETA updates — use **Django Channels** over WebSockets backed by a **Redis Channel Layer**.

```
Mobile App ──WebSocket──► Django Channels ──► Redis Channel Layer
                                │                      │
                           Consumer Groups        Pub/Sub
                                │                      │
                         Trip State Machine    Driver Location
                         (connected clients   (broadcast to
                          receive updates)     passenger)
```

### 2.4 Async Task Processing (Celery)

Long-running and scheduled work is handled by **Celery workers** with Redis as the broker and result backend.

| Celery Task | Trigger |
|---|---|
| Send OTP SMS | User registration / login |
| Send push notification | Trip status change |
| Process driver payout | Daily/weekly schedule (Celery Beat) |
| Calculate surge pricing | Every 5 minutes (Celery Beat) |
| Send trip receipt email | Trip completed |
| Driver document renewal reminder | 48h before expiry |
| Cleanup expired JWT tokens | Nightly |
| Generate analytics snapshots | Hourly |

---

## 3. Full Technology Stack

### 3.1 Backend — Django + DRF

| Concern | Library / Tool | Notes |
|---|---|---|
| **Framework** | Django 5.x | Stable LTS, batteries-included |
| **API Layer** | Django REST Framework 3.x | Serializers, viewsets, routers |
| **Real-Time** | Django Channels 4.x | WebSockets for live tracking |
| **Async Tasks** | Celery 5.x + celery-beat | Background jobs, scheduled tasks |
| **Message Broker** | Redis 7 (via `redis-py`) | Celery broker + Channels layer |
| **Database ORM** | Django ORM + `psycopg3` | PostgreSQL driver |
| **Geo Queries** | GeoDjango + PostGIS | Nearby drivers, polygon zones |
| **Authentication** | `djangorestframework-simplejwt` | JWT access + refresh tokens |
| **Phone OTP** | Twilio Verify + custom OTP model | SMS-based verification |
| **Permissions** | DRF permissions + custom RBAC | Passenger, driver, admin roles |
| **Filtering** | `django-filter` | Query param filtering on list endpoints |
| **Search** | `django-elasticsearch-dsl` | Full-text search via Elasticsearch |
| **File Uploads** | `django-storages` + boto3 | Direct S3 uploads with presigned URLs |
| **Caching** | `django-redis` | Cache framework on top of Redis |
| **Rate Limiting** | `django-ratelimit` + DRF throttling | Per-user and per-IP limits |
| **CORS** | `django-cors-headers` | Allow mobile apps + web dashboard |
| **API Docs** | `drf-spectacular` (OpenAPI 3) | Auto-generated Swagger / Redoc docs |
| **Environment** | `django-environ` + `.env` files | 12-factor config management |
| **Logging** | `structlog` | Structured JSON logs |
| **Testing** | `pytest-django` + `factory_boy` | Unit + integration tests |
| **Code Quality** | `ruff` + `black` + `mypy` | Linting, formatting, type checking |
| **Admin Panel** | Django Admin + `django-unfold` | Beautiful built-in admin UI |

### 3.2 Database — PostgreSQL + PostGIS

| Concern | Tool | Notes |
|---|---|---|
| **Primary Database** | PostgreSQL 16 (AWS RDS) | ACID transactions, battle-tested |
| **Geospatial Extension** | PostGIS 3.x | Geo queries: nearby drivers, zones, distance |
| **Connection Pooling** | PgBouncer | Reduces connection overhead at scale |
| **Read Replica** | AWS RDS Read Replica | Offload analytics queries |
| **Backups** | AWS RDS automated snapshots | Daily snapshots, 7-day retention minimum |

**Example PostGIS query — find drivers within 5km:**

```python
from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D

passenger_location = Point(147.1803, -9.4438, srid=4326)  # Port Moresby

nearby_drivers = DriverLocation.objects.filter(
    location__distance_lte=(passenger_location, D(km=5)),
    is_online=True,
    has_active_trip=False
).annotate(
    distance=Distance('location', passenger_location)
).order_by('distance')[:10]
```

### 3.3 Redis — Three Distinct Roles

| Role | Redis DB | What It Stores |
|---|---|---|
| **Django Cache** | DB 0 | API response cache, rate limit counters, session data |
| **Channels Layer** | DB 1 | WebSocket group messages, live driver positions |
| **Celery Broker** | DB 2 | Task queue, task results, Celery Beat schedule |

### 3.4 Mobile Apps — React Native (Expo)

| Concern | Library | Notes |
|---|---|---|
| **Framework** | React Native + Expo SDK 51 | Cross-platform iOS + Android |
| **Language** | TypeScript | Type safety |
| **State Management** | Zustand + TanStack Query | Global state + server-state caching |
| **Navigation** | Expo Router (file-based) | Deep links, tabs, modals |
| **Maps** | `react-native-maps` + Google Maps SDK | Map tiles, markers, polylines |
| **Real-Time** | Native WebSocket → Django Channels | Live driver location, trip updates |
| **Push Notifications** | Expo Notifications + FCM/APNs | Unified Android + iOS push |
| **Payments** | Stripe React Native SDK | Card tokenisation |
| **Offline Storage** | AsyncStorage + WatermelonDB | Offline-first data persistence |
| **Animations** | React Native Reanimated 3 | 60fps smooth animations |
| **Forms** | React Hook Form + Zod | Validation |
| **Crash Reporting** | Sentry | Real-time error tracking |
| **Analytics** | Mixpanel | User behaviour events |
| **OTA Updates** | Expo Updates (EAS) | Push JS fixes without App Store review |
| **CI/CD** | EAS Build | Cloud builds, App Store + Play Store submissions |

### 3.5 Web Admin Dashboard — Next.js

| Concern | Library | Notes |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | SSR, API routes |
| **Language** | TypeScript | Type safety |
| **UI** | shadcn/ui + Tailwind CSS | Accessible, clean components |
| **Data Tables** | TanStack Table v8 | High-performance grids |
| **Charts** | Recharts + Tremor | Analytics dashboards |
| **Maps** | Google Maps JS API + deck.gl | Fleet overview, heat maps |
| **Real-Time** | Native WebSocket → Django Channels | Live fleet monitoring |
| **Auth** | JWT in httpOnly cookies | Secure admin authentication |
| **Hosting** | Vercel or AWS Amplify | SSR + global CDN |

---

## 4. Third-Party Services & Pricing

### 4.1 Maps & Location

| Service | Provider | What It Does | Pricing (USD) |
|---|---|---|---|
| Maps SDK (Mobile) | Google Maps Platform | Map tiles, markers, polylines | Free $200/mo credit; ~$7/1,000 loads after |
| Directions API | Google Maps Platform | Turn-by-turn routes, ETAs | $5–10 / 1,000 requests |
| Distance Matrix API | Google Maps Platform | Multi-origin ETA for driver matching | $5 / 1,000 elements |
| Geocoding API | Google Maps Platform | Address ↔ coordinates | $5 / 1,000 requests |
| Places Autocomplete | Google Maps Platform | Pickup/dropoff address search | $2.83 / 1,000 requests |
| Roads API | Google Maps Platform | Snap GPS points to roads | $10 / 1,000 requests |
| Fallback | HERE Maps or Mapbox | Backup if Google costs spike | Free tier + pay-per-use |

> **Estimated Maps cost at 1,000 rides/day: ~USD $400–800/month.** Google's $200 free monthly credit offsets early-stage costs.

### 4.2 Payments

| Service | Provider | What It Does | Pricing |
|---|---|---|---|
| Card Payments | Stripe | Visa/Mastercard processing, tokenisation | 2.9% + $0.30 / transaction |
| Driver Payouts | Stripe Connect | Automated driver disbursements | 0.25% + $0.25 per payout |
| Fraud Detection | Stripe Radar | ML-based fraud scoring | Included; $0.05/charge for custom rules |
| Driver KYC | Stripe Identity (optional) | Document verification | $1.50 per verification |
| Mobile Money | Digicel MiCash | Largest PNG mobile wallet | Contact Digicel Business |
| Mobile Money | Vodafone M-PAiSA | Vodafone PNG wallet | Contact Vodafone PNG |
| Local Banking | BSP Mobile Banking API | Bank South Pacific transfers | Contact BSP for API access |

> ⚠️ **Cash is not optional in PNG.** A significant share of users are unbanked. Build a full cash-payment flow with driver-confirms-receipt and admin reconciliation.

### 4.3 Communications

| Service | Provider | What It Does | Pricing |
|---|---|---|---|
| SMS OTP + Alerts | Twilio Verify | Global SMS, OTP verification | $0.05 / verification; ~$0.05/SMS to PNG |
| SMS (PNG Local) | Digicel Business SMS | Local gateway — better delivery in PNG | Contact Digicel Business |
| Android Push | Firebase Cloud Messaging | Android push notifications | Free |
| iOS Push | Apple Push Notification (APNs) | iOS push notifications | Free |
| Push Orchestration | OneSignal | Unified push, segmentation, scheduling | Free up to 10K subs; $9+/mo after |
| In-App Chat | Stream Chat or SendBird | Passenger ↔ driver messaging | Free tier; $0.007/MAU after |
| Email (Receipts) | AWS SES | Transactional email | $0.10 / 1,000 emails |
| Phone Masking | Twilio Proxy | Passenger/driver number privacy | $0.004/min + $1/mo per number |

### 4.4 Cloud Infrastructure — AWS Sydney (ap-southeast-2)

Sydney is the geographically closest AWS region to PNG — approximately 3,000km, minimising latency.

| Service | AWS Product | Role | Est. Monthly Cost |
|---|---|---|---|
| Compute | ECS Fargate | Run Django + Channels + Celery containers | $150–400 |
| Load Balancer | ALB | Traffic distribution, SSL termination | $20–50 |
| Database | RDS PostgreSQL Multi-AZ | Primary DB with automatic failover | $100–300 |
| Cache / Broker | ElastiCache Redis | Django cache, Channels layer, Celery | $50–150 |
| Search | OpenSearch Service | Full-text search, log analytics | $80–200 |
| Object Storage | S3 | Driver docs, profile photos, receipts | $10–40 |
| CDN | CloudFront | Mobile app assets, web dashboard | $10–30 |
| Secrets | Secrets Manager | DB passwords, API keys | $5–15 |
| Monitoring | CloudWatch | Logs, metrics, alarms | $20–60 |
| DNS + SSL | Route 53 + ACM | Domain routing, free SSL certs | $5–15 |
| CI/CD | CodePipeline + CodeBuild | Automated deploy pipelines | $20–50 |

### 4.5 Developer & DevOps Tools

| Tool | Purpose | Pricing |
|---|---|---|
| GitHub | Source code, PRs, CI triggers | Free; $4/user/mo (Teams) |
| GitHub Actions | CI/CD — test, lint, build, deploy | Free 2,000 min/mo; $0.008/min after |
| Docker + AWS ECR | Container images | ECR: $0.10/GB; free pull within AWS |
| Datadog | APM, logs, dashboards, alerting | $15–23/host/mo; free trial |
| Sentry | Error tracking (mobile + backend) | Free up to 5K errors/mo; $26/mo Team |
| Terraform | Infrastructure as Code | Open source — free |
| Postman | API design, testing, docs | Free; $12/user/mo Teams |
| Linear | Engineering project management | $8/user/mo |
| Figma | UI/UX design and prototyping | Free; $12/editor/mo Pro |

---

## 5. Security Architecture

### 5.1 Authentication & Authorisation

- Phone number + OTP verification via Twilio Verify for all users
- JWT access tokens (15-minute expiry) via `djangorestframework-simplejwt`
- Rotating refresh tokens (7-day expiry, single-use, blacklisted on rotation via Redis)
- Role-Based Access Control: `passenger`, `driver`, `admin`, `superadmin`
- Admin portal: 2FA via TOTP authenticator (`django-two-factor-auth`)
- Optional Google Sign-In for passengers via `social-auth-app-django`

### 5.2 Data Security

- All data encrypted **in transit** — TLS 1.3 minimum, enforced at the ALB
- All data encrypted **at rest** — AWS KMS-managed keys for RDS and S3
- PII fields (name, phone, home address) encrypted at column level with `django-encrypted-model-fields`
- Driver documents stored in private S3 buckets — accessed only via time-limited presigned URLs
- Payment card data never stored — only Stripe payment method IDs stored in your DB

### 5.3 API Security

- DRF throttling: 100 req/min standard users; 5 OTP attempts/hour per phone number
- OWASP API Security Top 10 applied to all endpoints
- AWS WAF on Application Load Balancer for all public traffic
- Secrets only via AWS Secrets Manager — never committed to git
- Django security settings enforced: `SECURE_HSTS_SECONDS`, `SECURE_SSL_REDIRECT`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`
- Dependency scanning via GitHub Dependabot + `pip-audit` in CI pipeline

### 5.4 Privacy

- Phone number masking via Twilio Proxy — neither passenger nor driver sees the other's real number
- Location data retained for maximum 90 days post-trip
- GDPR-style data deletion endpoint (right to erasure) — best practice regardless of current PNG law

---

## 6. Papua New Guinea — Specific Considerations

### 6.1 Connectivity & Performance

PNG has inconsistent network coverage outside Port Moresby, Lae, and Kokopo. The app must be resilient.

- **Offline-first mobile architecture** — cache trip state locally with WatermelonDB; sync on reconnect
- **Optimistic UI** — show immediate feedback before server confirms
- **API response compression** — gzip/brotli via Django `GZipMiddleware`; reduces payload ~70%
- **Image compression** — auto-compress photos to <200KB before S3 upload
- **Retry logic** — exponential backoff with jitter on all mobile API calls
- **Low-bandwidth map tiles** — configure Google Maps lite mode for 2G/3G users
- **App bundle size** — target <30MB initial install; dynamic imports, tree-shaking
- **Django query optimisation** — `select_related`, `prefetch_related`, `only()` on all list endpoints; no N+1 queries

### 6.2 Payments & Financial Inclusion

- **Cash payment mode** — driver confirms receipt in-app; ops team reconciles in admin
- **Digicel MiCash** — largest mobile wallet in PNG; highest priority integration
- **Vodafone M-PAiSA** — second-largest; important for coverage
- **BSP bank transfer** — for drivers preferring direct bank deposit
- **Driver wallet** — earnings accumulate in-app; driver triggers payout to preferred method
- **PGK (Papua New Guinean Kina)** — store all money as integers in **toea** (1 PGK = 100 toea) — never floats
- **No card required to register** — passengers can book and pay cash with zero payment setup

### 6.3 Regulatory & Compliance

- Comply with the **PNG Motor Traffic Act** for commercial vehicle operation
- Driver onboarding must collect: valid driver's licence, vehicle registration, roadworthy certificate, police clearance, recent photo
- **ICCC** (Independent Consumer & Competition Commission) pricing guidelines for transport
- **IPA registration** (Investment Promotion Authority) — your company must be registered in PNG
- Store all driver compliance document expiry dates; automate renewal reminders via Celery Beat
- Consider a RDS read replica in-region if PNG data localisation laws emerge

### 6.4 Localisation

- **English** (primary) + **Tok Pisin** — use Django `i18n` + React Native `i18next` from day one
- PNG phone validation: `+675` country code, 7–8 digit local numbers
- Google Maps coverage adequate for Port Moresby, Lae, Mount Hagen, Kokopo
- Support **Android 9+** minimum; **iOS 15+** minimum
- Test on 2GB RAM mid-range Android devices — dominant hardware in PNG market

---

## 7. Development Roadmap

### Phase 1 — Foundation (Months 1–3)

**Backend**
- Django project setup: app structure, settings split (base/dev/prod), Docker, `docker-compose.yml`
- PostgreSQL + PostGIS setup; base models and migrations
- `apps.authentication`: phone OTP via Twilio, `simplejwt` tokens with refresh rotation
- `apps.users`: passenger and driver profile models, serializers, endpoints
- `apps.vehicles`: vehicle model, categories, document upload to S3 via presigned URLs
- CI/CD: GitHub Actions — `pytest-django`, `ruff`, `mypy` on every PR → deploy to staging on merge
- AWS infrastructure via Terraform: VPC, RDS, ElastiCache, ECS cluster, S3, ALB

**Mobile**
- Turborepo monorepo setup with shared `packages/` for TypeScript types and UI components
- Passenger app: onboarding screens, phone verification, home map screen
- Driver app: onboarding, document upload, online/offline toggle

---

### Phase 2 — Core Ride Flow (Months 3–5)

**Backend**
- `apps.trips`: full booking state machine
  ```
  REQUESTED → DRIVER_MATCHED → DRIVER_ARRIVED → IN_PROGRESS → COMPLETED
                                                             → CANCELLED
  ```
- `apps.location`: `DriverLocation` model with PostGIS `PointField`; Django Channels WebSocket consumers
- Real-time: passenger subscribes to trip channel; driver broadcasts location every 3 seconds
- `apps.pricing`: base fare, per-km rate, per-minute rate, minimum fare — all configurable in Django Admin
- Driver matching algorithm: PostGIS proximity query weighted by rating and acceptance rate

**Mobile**
- Passenger app: request ride flow, live driver tracking on map, trip history
- Driver app: accept/decline rides, in-ride navigation screen, earnings summary

**Notifications**
- Celery tasks: OTP SMS, trip status push, driver arrived alert

---

### Phase 3 — Payments & Polish (Months 5–7)

**Backend**
- `apps.payments`: Stripe card charges + refunds, driver wallet model, payout scheduling
- Mobile money integrations: Digicel MiCash + Vodafone M-PAiSA
- Cash flow: passenger selects cash → driver confirms receipt → trip marked paid
- Rating system: bidirectional (passenger rates driver; driver rates passenger)
- Promo codes: model, validation, usage tracking
- Phone number masking: Twilio Proxy integration

**Mobile**
- Passenger app: payment methods, promo code entry, rate driver screen
- Driver app: earnings breakdown, payout request, rate passenger

**Admin Dashboard**
- Trip management table, driver verification workflow, payment reconciliation, basic analytics charts

---

### Phase 4 — Premium Features & Launch (Months 7–9)

**Backend**
- Ride categories: Standard, Premium, XL — separate pricing tiers and vehicle requirements
- Scheduled rides: book up to 7 days ahead; Celery Beat triggers driver matching 15 min before pickup
- Dynamic surge pricing: Celery Beat job every 5 minutes; demand/supply ratio per zone
- Corporate accounts: company billing profiles, invoicing, per-ride approval flows
- SOS feature: emergency contact alert with GPS location snapshot stored in DB

**Pre-Launch**
- Load testing with `locust` — simulate 500 concurrent rides and 1,000 active WebSocket connections
- External security penetration test
- App Store + Google Play submission (allow 2–4 weeks for review)
- Full admin dashboard: fleet heat map, surge visualisation, driver earnings analytics

---

## 8. Recommended Team Structure

| Role | Responsibility | Engagement |
|---|---|---|
| Tech Lead / Architect | System design, code review, infrastructure decisions | Full-time |
| Backend Engineers (2) | Django apps, DRF APIs, Celery tasks, Channels consumers | Full-time |
| Mobile Engineers (2) | React Native — passenger app + driver app | Full-time |
| Frontend Engineer (1) | Next.js admin dashboard | Full-time or part-time |
| DevOps / Cloud Engineer | Terraform, AWS ECS, CI/CD, monitoring | Part-time or contract |
| UX/UI Designer | Figma designs, prototypes, design system | Contract |
| QA Engineer | Manual + automated testing, real-device testing | Part-time |
| Product Manager | Roadmap, priorities, stakeholder communication | Full-time |

---

## 9. Estimated Monthly Operating Costs

All costs in **USD** at modest launch scale (~500–1,000 rides/day).

| Category | Service | Est. Monthly Cost |
|---|---|---|
| Cloud — Compute | AWS ECS Fargate (Django + Celery + Channels) | $150–400 |
| Cloud — Database | AWS RDS PostgreSQL Multi-AZ | $100–300 |
| Cloud — Cache | AWS ElastiCache Redis | $50–150 |
| Cloud — Search | AWS OpenSearch | $80–200 |
| Cloud — Storage/CDN | S3 + CloudFront | $20–70 |
| Cloud — Misc | ALB, Route 53, Secrets Manager | $50–130 |
| Maps | Google Maps Platform | $400–800 |
| SMS / Voice | Twilio | $100–300 |
| Monitoring | Datadog | $100–300 |
| Error Tracking | Sentry | $0–50 |
| CI/CD | EAS Build + GitHub Actions | $50–150 |
| SaaS Tools | Linear, Figma, Postman | $50–150 |
| **TOTAL ESTIMATE** | **At 500–1,000 rides/day** | **~$1,150–3,000/month** |

> **Stripe payment processing** is revenue-dependent and not included above.
> At 1,000 rides/day × avg PGK 25 (~USD $6.50) × 20% platform take × 2.9% Stripe fee ≈ ~USD $38/day.
> Supporting Digicel MiCash and cash directly reduces card processing costs significantly.

---

## 10. Monorepo & Project Structure

```
rideshare/
├── backend/                          # Django project root
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   ├── asgi.py                   # Django Channels entry point
│   │   ├── wsgi.py
│   │   └── celery.py                 # Celery app config
│   ├── apps/
│   │   ├── authentication/
│   │   ├── users/
│   │   ├── trips/
│   │   ├── location/
│   │   ├── pricing/
│   │   ├── payments/
│   │   ├── notifications/
│   │   ├── support/
│   │   ├── analytics/
│   │   └── vehicles/
│   ├── requirements/
│   │   ├── base.txt
│   │   ├── development.txt
│   │   └── production.txt
│   ├── Dockerfile
│   └── manage.py
│
├── apps/
│   ├── passenger-app/                # React Native (Expo)
│   │   ├── app/                      # Expo Router screens
│   │   ├── components/
│   │   ├── stores/                   # Zustand state
│   │   ├── services/                 # API + WebSocket clients
│   │   └── app.json
│   └── driver-app/                   # React Native (Expo)
│       ├── app/
│       ├── components/
│       ├── stores/
│       └── services/
│
├── admin-web/                        # Next.js admin dashboard
│   ├── app/                          # App Router pages
│   ├── components/
│   └── lib/
│
├── packages/
│   ├── shared-types/                 # TypeScript interfaces (shared across all apps)
│   └── ui-components/                # Shared React Native component library
│
├── infrastructure/                   # Terraform (AWS)
│   ├── modules/
│   │   ├── rds/
│   │   ├── elasticache/
│   │   ├── ecs/
│   │   └── s3/
│   └── environments/
│       ├── staging/
│       └── production/
│
├── docs/
│   ├── architecture/                 # Architecture Decision Records (ADRs)
│   ├── api/                          # OpenAPI specs (generated by drf-spectacular)
│   └── runbooks/                     # Ops runbooks for incidents
│
├── docker-compose.yml                # Local dev: Django + Redis + PostgreSQL + Celery
├── turbo.json                        # Turborepo config
└── README.md
```

### Local Development (docker-compose.yml)

```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: rideshare
      POSTGRES_USER: rideshare
      POSTGRES_PASSWORD: localpassword
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  django:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    depends_on: [db, redis]
    volumes:
      - ./backend:/app
    env_file: ./backend/.env
    ports:
      - "8000:8000"

  channels:
    build: ./backend
    command: daphne -b 0.0.0.0 -p 8001 config.asgi:application
    depends_on: [db, redis]
    env_file: ./backend/.env
    ports:
      - "8001:8001"

  celery:
    build: ./backend
    command: celery -A config worker --loglevel=info --concurrency=4
    depends_on: [db, redis]
    env_file: ./backend/.env

  celery-beat:
    build: ./backend
    command: celery -A config beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    depends_on: [db, redis]
    env_file: ./backend/.env
```

---

## 11. Key Recommendations & Next Steps

### Do These First

1. **Register your company** with PNG IPA and secure transport operator licences — before writing code
2. **Open your AWS account** and set default region to `ap-southeast-2` (Sydney) immediately
3. **Create a Google Maps Platform account** — the $200/month free credit starts from your first API call
4. **Contact Digicel Business PNG** early — MiCash API access requires a commercial agreement with lead time
5. **Set up monorepo + Terraform** before any feature development — retrofitting these is extremely painful
6. **Design your database schema carefully** — especially the trip state machine and pricing models — before writing Django models

### Critical Success Factors for PNG

- **Always support cash** — never make card the only payment option
- **Test under real PNG network conditions** — throttle to 3G/2G in dev tools before every release
- **Partner with Digicel early** — SMS gateway + MiCash + largest PNG telco
- **Driver supply must precede passenger demand** — verify 50+ drivers in a city before opening to passengers
- **Hire local operations staff** — someone who knows Port Moresby traffic patterns, driver culture, and can handle ground-level issues

### What Not To Do

- **Do not use floats for money** — always use integers in toea (smallest PGK unit)
- **Do not skip `select_related` / `prefetch_related`** in Django — N+1 queries will kill performance at scale
- **Do not launch without phone number masking** — passenger and driver privacy is non-negotiable
- **Do not skip observability** — structured logging, Sentry, Datadog, and health check endpoints must be live from day one in production
- **Do not ignore Celery task failures** — use Flower or Datadog to monitor workers; silent failures in a payments context are dangerous

---

## Stack Summary Card

| Layer | Technology |
|---|---|
| Mobile Apps | React Native + Expo (TypeScript) |
| Web Admin | Next.js 14 (TypeScript) |
| API | Django REST Framework |
| Real-Time | Django Channels 4 + Redis Channel Layer |
| Async Tasks | Celery 5 + Celery Beat + Redis Broker |
| Database | PostgreSQL 16 + PostGIS |
| Cache | Redis 7 |
| Object Storage | AWS S3 |
| Cloud | AWS ap-southeast-2 (Sydney) |
| Containers | Docker + AWS ECS Fargate |
| Infrastructure as Code | Terraform |
| Maps | Google Maps Platform |
| Payments | Stripe + Digicel MiCash + Vodafone M-PAiSA + Cash |
| SMS / Voice | Twilio |
| Monitoring | Datadog + Sentry |

---

*This is a living document. Update it as architecture decisions are made. Record significant decisions as Architecture Decision Records (ADRs) in `/docs/architecture/`.*
