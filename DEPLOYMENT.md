# HyRyder — Complete Deployment Guide

> **First-time deployer guide.** This document walks you through every step from a blank machine to a live, production-ready platform. Read each section fully before running any commands.

---

## Table of Contents

1. [Understanding the Architecture](#1-understanding-the-architecture)
2. [Prerequisites — Software to Install on Your Computer](#2-prerequisites--software-to-install-on-your-computer)
3. [Clone the Repository](#3-clone-the-repository)
4. [Third-Party Accounts You Must Create](#4-third-party-accounts-you-must-create)
   - 4.1 [AWS Account](#41-aws-account)
   - 4.2 [Twilio (SMS / OTP)](#42-twilio-sms--otp)
   - 4.3 [Stripe (Payments)](#43-stripe-payments)
   - 4.4 [Google Maps Platform](#44-google-maps-platform)
   - 4.5 [OneSignal (Push Notifications)](#45-onesignal-push-notifications)
   - 4.6 [Sentry (Error Tracking)](#46-sentry-error-tracking)
5. [Local Development — Run Everything on Your Own Machine](#5-local-development--run-everything-on-your-own-machine)
   - 5.1 [Configure Environment Variables](#51-configure-environment-variables)
   - 5.2 [Start the Docker Stack](#52-start-the-docker-stack)
   - 5.3 [Apply Database Migrations](#53-apply-database-migrations)
   - 5.4 [Create the First Admin User](#54-create-the-first-admin-user)
   - 5.5 [Verify Everything Is Running](#55-verify-everything-is-running)
   - 5.6 [Start the Frontend Apps](#56-start-the-frontend-apps)
6. [Deploying the Backend to AWS](#6-deploying-the-backend-to-aws)
   - 6.1 [Install and Configure the AWS CLI](#61-install-and-configure-the-aws-cli)
   - 6.2 [Provision Infrastructure with Terraform](#62-provision-infrastructure-with-terraform)
   - 6.3 [Push the Docker Image to AWS ECR](#63-push-the-docker-image-to-aws-ecr)
   - 6.4 [Create the ECS Cluster and Services](#64-create-the-ecs-cluster-and-services)
   - 6.5 [Set Secrets in AWS Secrets Manager](#65-set-secrets-in-aws-secrets-manager)
   - 6.6 [Run Migrations on Production](#66-run-migrations-on-production)
   - 6.7 [Set Up the Application Load Balancer and SSL](#67-set-up-the-application-load-balancer-and-ssl)
7. [Deploying the Admin Dashboard to Vercel](#7-deploying-the-admin-dashboard-to-vercel)
8. [Building and Publishing the Mobile Apps](#8-building-and-publishing-the-mobile-apps)
   - 8.1 [Install Expo EAS CLI](#81-install-expo-eas-cli)
   - 8.2 [Configure EAS Build](#82-configure-eas-build)
   - 8.3 [Build the Passenger App](#83-build-the-passenger-app)
   - 8.4 [Build the Driver App](#84-build-the-driver-app)
   - 8.5 [Submit to Google Play Store](#85-submit-to-google-play-store)
   - 8.6 [Submit to Apple App Store](#86-submit-to-apple-app-store)
9. [Setting Up CI/CD (GitHub Actions)](#9-setting-up-cicd-github-actions)
10. [Domain Name and DNS Setup](#10-domain-name-and-dns-setup)
11. [Monitoring and Observability](#11-monitoring-and-observability)
12. [Celery Beat — Scheduled Tasks](#12-celery-beat--scheduled-tasks)
13. [PostGIS — Seeding Surge Zones](#13-postgis--seeding-surge-zones)
14. [Going Live Checklist](#14-going-live-checklist)
15. [Common Problems and Fixes](#15-common-problems-and-fixes)

---

## 1. Understanding the Architecture

Before touching any commands, understand what you are deploying and where each piece runs.

```
YOUR COMPUTER (Development)
  └── docker-compose.yml  →  runs Django + Redis + PostgreSQL + Celery locally

AWS Cloud (ap-southeast-2 — Sydney, closest to PNG)
  ├── ECS Fargate          →  runs Django API container
  ├── ECS Fargate          →  runs Daphne (WebSockets / Django Channels)
  ├── ECS Fargate          →  runs Celery worker
  ├── ECS Fargate          →  runs Celery Beat (scheduled jobs)
  ├── RDS PostgreSQL 16    →  main database (with PostGIS extension)
  ├── ElastiCache Redis 7  →  cache, WebSocket channel layer, Celery broker
  ├── S3                   →  driver documents, profile photos
  └── ALB                  →  load balancer, SSL termination, routes traffic

Vercel (or AWS Amplify)
  └── admin-web/           →  Next.js admin dashboard

Expo EAS Build
  ├── apps/passenger-app/  →  uploaded to Google Play + Apple App Store
  └── apps/driver-app/     →  uploaded to Google Play + Apple App Store
```

**Key rule:** The mobile apps talk to the Django API via HTTPS. They never talk to the database directly.

---

## 2. Prerequisites — Software to Install on Your Computer

Install each item below **in order**. Each link goes to the official installer page.

### macOS

Open the **Terminal** app (press `Cmd + Space`, type "Terminal", press Enter).

```bash
# 1. Install Homebrew (macOS package manager)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Git
brew install git

# 3. Install Node.js 20
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 4. Install Python 3.12
brew install python@3.12

# 5. Install Docker Desktop
# Go to https://www.docker.com/products/docker-desktop/ and download the Mac installer
# Open the .dmg file and drag Docker to Applications
# Launch Docker from Applications and wait for it to say "Docker Desktop is running"

# 6. Install AWS CLI
brew install awscli

# 7. Install Terraform
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# 8. Verify everything installed correctly
git --version          # should say: git version 2.x.x
node --version         # should say: v20.x.x
python3.12 --version   # should say: Python 3.12.x
docker --version       # should say: Docker version 26.x.x
aws --version          # should say: aws-cli/2.x.x
terraform --version    # should say: Terraform v1.x.x
```

### Windows

1. Install **Git for Windows**: https://git-scm.com/download/win — use all default options
2. Install **Node.js 20 LTS**: https://nodejs.org/en/download — use the Windows Installer (.msi)
3. Install **Python 3.12**: https://www.python.org/downloads/windows/ — **check the box that says "Add Python to PATH"**
4. Install **Docker Desktop**: https://www.docker.com/products/docker-desktop/ — requires Windows 10/11 with WSL 2
5. Install **AWS CLI**: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
6. Install **Terraform**: https://developer.hashicorp.com/terraform/install#windows

All subsequent commands should be run in **PowerShell** (search for it in the Start menu).

### Ubuntu / Debian Linux

```bash
# Update package list
sudo apt-get update

# Git
sudo apt-get install -y git

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Python 3.12
sudo apt-get install -y python3.12 python3.12-pip python3.12-venv

# Docker
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker

# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Terraform
sudo apt-get install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt-get install terraform
```

---

## 3. Clone the Repository

```bash
# Navigate to your projects folder (adjust path to wherever you keep your code)
cd ~/Documents

# Clone the repo
git clone https://github.com/zyakap/hyryder.git

# Enter the project folder — all commands in this guide run from here
cd hyryder

# Confirm you are on the right branch
git branch
# Should show: * claude/build-ride-hailing-apps-rcMwi
# If not, run:
git checkout claude/build-ride-hailing-apps-rcMwi
```

---

## 4. Third-Party Accounts You Must Create

You need accounts with 6 services. Set them up before running anything — their API keys go into your `.env` file in Section 5.

### 4.1 AWS Account

1. Go to https://aws.amazon.com/free/ and click **Create a Free Account**
2. Enter your email, create a password, and provide a credit card (AWS requires one even for the free tier)
3. Choose **Basic Support** (free)
4. Once logged in, go to the top-right corner → click your account name → **Security credentials**
5. Under **Access keys**, click **Create access key**
6. Choose **Command Line Interface (CLI)**
7. Click through the warnings and download the `.csv` file — **save this file, you cannot download it again**
8. The file contains two values you will need:
   - `AWS Access key ID` — looks like: `AKIAIOSFODNN7EXAMPLE`
   - `AWS Secret access key` — looks like: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

> **Important:** Change your default AWS region to Sydney (closest to PNG).
> In the AWS console, click the region dropdown (top-right, shows "N. Virginia") and select **Asia Pacific (Sydney) ap-southeast-2**.

### 4.2 Twilio (SMS / OTP)

1. Go to https://www.twilio.com/try-twilio and sign up for a free account
2. Verify your own phone number during signup
3. From the Twilio Console dashboard, note down:
   - **Account SID** — starts with `AC` followed by 32 hex characters (e.g. `AC` + 32 chars)
   - **Auth Token** — looks like: `your_auth_token_here` (click the eye icon to reveal)
4. In the left sidebar, go to **Verify** → **Services** → **Create new Service**
   - Name it `HyRyder OTP`
   - Click **Create**
   - Note the **Service SID** — starts with `VA` followed by 32 hex characters
5. Still in Twilio, go to **Phone Numbers** → **Manage** → **Buy a number**
   - Search for a PNG (+675) number or use any Twilio number
   - Note the phone number (e.g., `+12025551234`)

> **Note:** In development you can use the free Twilio trial. For production you must upgrade to a paid plan.

### 4.3 Stripe (Payments)

1. Go to https://dashboard.stripe.com/register and create an account
2. You will start in **Test Mode** — this is correct for development
3. From the Stripe Dashboard, go to **Developers** → **API keys**
4. Note down:
   - **Publishable key** — starts with `pk_test_`
   - **Secret key** — starts with `sk_test_` (click **Reveal test key** to see it)
5. For driver payouts, go to **Connect** → **Settings** and enable **Stripe Connect**
   - Note the **Connect Client ID** — starts with `ca_`
6. For webhooks (needed in production): go to **Developers** → **Webhooks** → **Add endpoint**
   - You will fill in the URL later (after deploying the backend)
   - Note the **Webhook secret** — starts with `whsec_`

### 4.4 Google Maps Platform

1. Go to https://console.cloud.google.com/
2. Sign in with a Google account
3. Create a new project: click the project dropdown at the top → **New Project** → name it `HyRyder` → **Create**
4. In the left sidebar, go to **APIs & Services** → **Library**
5. Enable these 6 APIs one by one (search for each and click **Enable**):
   - Maps SDK for Android
   - Maps SDK for iOS
   - Directions API
   - Distance Matrix API
   - Geocoding API
   - Places API
6. Go to **APIs & Services** → **Credentials** → **Create Credentials** → **API Key**
7. Note the API key (looks like `AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6`)
8. Click the key → **Restrict Key** → select the 6 APIs above → **Save**

> The first $200/month of Google Maps usage is free. At ~500 rides/day you will likely stay under this.

### 4.5 OneSignal (Push Notifications)

1. Go to https://onesignal.com/ and create a free account
2. Click **New App/Website** → name it `HyRyder Passenger`
3. Select **Mobile App** → follow the setup wizard
   - For Android: you will need a Firebase project (see below)
   - For iOS: you will need an Apple Developer account ($99/year)
4. Note the **App ID** and **REST API Key** from the OneSignal dashboard → **Settings** → **Keys & IDs**

**Firebase setup (for Android push):**
1. Go to https://console.firebase.google.com/
2. Create a new project called `HyRyder`
3. Add an Android app with package name `com.hyryder.passenger`
4. Download the `google-services.json` file — place it at `apps/passenger-app/google-services.json`
5. In Firebase → Project Settings → Cloud Messaging → copy the **Server key**
6. Paste the Server key into OneSignal's Android setup

### 4.6 Sentry (Error Tracking)

1. Go to https://sentry.io/ and create a free account
2. Create a new **Organization** called `HyRyder`
3. Create a new project → choose **Django** → name it `hyryder-backend`
4. Copy the **DSN** (Data Source Name) — looks like `https://abc123@o123.ingest.sentry.io/456`
5. Create a second project → choose **React Native** → name it `hyryder-passenger`
6. Copy that DSN too

---

## 5. Local Development — Run Everything on Your Own Machine

This section gets the entire platform running on your laptop so you can test it before deploying to AWS.

### 5.1 Configure Environment Variables

The `.env` file stores all your secret keys. **Never commit this file to Git** (it is already in `.gitignore`).

```bash
# From the project root folder (hyryder/)
cd backend
cp .env.example .env
```

Now open the file `backend/.env` in a text editor (VS Code, Notepad++, etc.) and fill in each value:

```bash
# -----------------------------------------------------------------------
# DJANGO CORE
# -----------------------------------------------------------------------
SECRET_KEY=change-this-to-a-random-50-character-string-right-now
# Generate one at: https://djecrety.ir/

DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_SETTINGS_MODULE=config.settings.development

# -----------------------------------------------------------------------
# DATABASE — do not change these for local development
# They match the docker-compose.yml settings
# -----------------------------------------------------------------------
DATABASE_URL=postgis://rideshare:localpassword@db:5432/rideshare

# -----------------------------------------------------------------------
# REDIS — do not change these for local development
# -----------------------------------------------------------------------
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/2
CELERY_RESULT_BACKEND=redis://redis:6379/2
CHANNEL_LAYERS_REDIS_URL=redis://redis:6379/1

# -----------------------------------------------------------------------
# TWILIO — paste values from Section 4.2
# -----------------------------------------------------------------------
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+12025551234
TWILIO_PROXY_SERVICE_SID=                          # leave blank for now

# -----------------------------------------------------------------------
# STRIPE — paste values from Section 4.3
# -----------------------------------------------------------------------
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_CONNECT_CLIENT_ID=ca_xxxxxxxxxxxxxxxxxxxxxxxx

# -----------------------------------------------------------------------
# AWS S3 — paste values from Section 4.1
# Leave blank for local development — files will save to local disk
# -----------------------------------------------------------------------
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_STORAGE_BUCKET_NAME=hyryder-documents
AWS_S3_REGION_NAME=ap-southeast-2
AWS_CLOUDFRONT_DOMAIN=

# -----------------------------------------------------------------------
# GOOGLE MAPS — paste value from Section 4.4
# -----------------------------------------------------------------------
GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# -----------------------------------------------------------------------
# ONESIGNAL — paste values from Section 4.5
# -----------------------------------------------------------------------
ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
ONESIGNAL_REST_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# -----------------------------------------------------------------------
# SENTRY — paste value from Section 4.6
# -----------------------------------------------------------------------
SENTRY_DSN=

# -----------------------------------------------------------------------
# ENCRYPTION KEY — generate a 32-character random string
# python3 -c "import secrets; print(secrets.token_hex(16))"
# -----------------------------------------------------------------------
FIELD_ENCRYPTION_KEY=your32characterencryptionkeyhere

# JWT settings — leave these as-is
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=15
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7
```

> **How to generate SECRET_KEY:** Run this in your terminal:
> ```bash
> python3 -c "import secrets; print(secrets.token_urlsafe(50))"
> ```
> Copy the output and paste it as the value of `SECRET_KEY`.

### 5.2 Start the Docker Stack

Make sure Docker Desktop is open and running (you should see the Docker whale icon in your taskbar/menu bar).

```bash
# Go back to the project root
cd ..    # you should now be in hyryder/

# Start all services in the background (-d means "detached" / background mode)
docker compose up -d

# Watch the startup logs (optional — press Ctrl+C to stop watching without stopping services)
docker compose logs -f

# Wait about 30 seconds for everything to initialize, then check the status
docker compose ps
```

You should see output like this — all services should say **Up** or **healthy**:

```
NAME                   STATUS          PORTS
hyryder-db-1           Up (healthy)    0.0.0.0:5432->5432/tcp
hyryder-redis-1        Up (healthy)    0.0.0.0:6379->6379/tcp
hyryder-django-1       Up              0.0.0.0:8000->8000/tcp
hyryder-channels-1     Up              0.0.0.0:8001->8001/tcp
hyryder-celery-1       Up
hyryder-celery-beat-1  Up
hyryder-flower-1       Up              0.0.0.0:5555->5555/tcp
```

If any service shows **Exit** or **Restarting**, check its logs:
```bash
docker compose logs django     # replace 'django' with the failing service name
```

### 5.3 Apply Database Migrations

Migrations create all the database tables. Run this once after first setup, and again any time models change.

```bash
# Run migrations inside the Django container
docker compose exec django python manage.py migrate

# You should see output like:
# Applying authentication.0001_initial... OK
# Applying users.0001_initial... OK
# Applying trips.0001_initial... OK
# ... (many lines)
# Applying analytics.0001_initial... OK
```

If you see an error like `could not connect to server`, wait 10 more seconds and retry — the database container may still be starting up.

### 5.4 Create the First Admin User

```bash
# Create a superuser account for the Django Admin panel
docker compose exec django python manage.py createsuperuser

# You will be prompted for:
# Phone number: +6757100001       (use any valid +675 PNG number)
# Password: (type a strong password — it will not be shown as you type)
# Password (again): (retype the same password)
```

### 5.5 Verify Everything Is Running

Open these URLs in your web browser to confirm each service works:

| URL | What you should see |
|---|---|
| http://localhost:8000/api/docs/ | Swagger UI — the full API documentation |
| http://localhost:8000/admin/ | Django Admin login page |
| http://localhost:5555/ | Flower — Celery task monitoring |

Log in to Django Admin at http://localhost:8000/admin/ using the phone number and password from Step 5.4.

### 5.6 Start the Frontend Apps

Open a **new terminal window** (keep docker compose running in the first one).

```bash
# From the project root (hyryder/)
# Install all Node.js dependencies for all apps
npm install

# Start the admin dashboard
cd admin-web
npm run dev
# Open http://localhost:3000 in your browser
```

For the **mobile apps**, open another new terminal:

```bash
# Install Expo CLI globally
npm install -g expo-cli @expo/eas-cli

# Start the passenger app
cd apps/passenger-app
npx expo start

# A QR code will appear in the terminal
# Install the Expo Go app on your phone:
#   Android: https://play.google.com/store/apps/details?id=host.exp.exponent
#   iOS: https://apps.apple.com/app/expo-go/id982107779
# Scan the QR code with your phone camera (iOS) or the Expo Go app (Android)
```

For the driver app, open yet another terminal:
```bash
cd apps/driver-app
npx expo start
```

> **Note:** Your phone and your computer must be on the same Wi-Fi network for Expo to work. If the app cannot connect, see Section 15 (Common Problems).

---

## 6. Deploying the Backend to AWS

This section deploys Django, Channels, and Celery to AWS ECS Fargate — a serverless container platform.

### 6.1 Install and Configure the AWS CLI

```bash
# Configure the AWS CLI with your credentials from Section 4.1
aws configure

# You will be prompted for 4 values:
# AWS Access Key ID: AKIAIOSFODNN7EXAMPLE       (from your downloaded .csv file)
# AWS Secret Access Key: wJalrXUtnFEMI/...       (from your downloaded .csv file)
# Default region name: ap-southeast-2            (Sydney — always use this)
# Default output format: json                    (just press Enter)

# Verify it works — this should list your S3 buckets (none yet is fine)
aws s3 ls
```

### 6.2 Provision Infrastructure with Terraform

Terraform reads the files in `infrastructure/environments/staging/main.tf` and creates all the AWS resources.

```bash
# Navigate to the Terraform staging folder
cd infrastructure/environments/staging

# Download the required Terraform plugins (only needed once)
terraform init

# Preview what Terraform will create — read this carefully before applying
terraform plan -var="db_password=ChooseAStrongDatabasePassword123!"

# The output will list every resource that will be created:
# + aws_vpc.this
# + aws_db_instance.postgres
# + aws_elasticache_replication_group.redis
# + aws_s3_bucket.documents
# ... etc

# If the plan looks correct, create the resources
# This takes about 10-15 minutes
terraform apply -var="db_password=ChooseAStrongDatabasePassword123!"

# Type "yes" when prompted: Enter a value: yes
```

When Terraform finishes, it will print output values including the RDS endpoint and Redis endpoint. **Save these** — you will need them for the production `.env` file.

Example output:
```
Outputs:
rds_endpoint    = "hyryder-staging-postgres.abc123.ap-southeast-2.rds.amazonaws.com:5432"
redis_endpoint  = "hyryder-staging-redis.abc123.cfg.apse2.cache.amazonaws.com:6379"
```

> **Important:** Do not lose your `db_password` value. Store it in a password manager.

### 6.3 Push the Docker Image to AWS ECR

ECR (Elastic Container Registry) is AWS's private Docker image storage.

```bash
# Go back to the project root
cd ../../..    # should be in hyryder/

# Create the ECR repository
aws ecr create-repository \
  --repository-name hyryder-backend \
  --region ap-southeast-2

# Note the repository URI from the output — looks like:
# 123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/hyryder-backend

# Log Docker in to ECR (replace 123456789012 with your AWS account ID)
aws ecr get-login-password --region ap-southeast-2 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.ap-southeast-2.amazonaws.com

# Build the production image
docker build \
  --target production \
  -t hyryder-backend:latest \
  ./backend

# Tag it with your ECR repository URI
docker tag hyryder-backend:latest \
  123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/hyryder-backend:latest

# Push it to ECR (this uploads the image — takes 2-5 minutes)
docker push \
  123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/hyryder-backend:latest
```

### 6.4 Create the ECS Cluster and Services

This creates the compute environment that runs your Docker containers.

```bash
# Create the ECS cluster
aws ecs create-cluster \
  --cluster-name hyryder-staging \
  --region ap-southeast-2

# Create a CloudWatch log group for the logs
aws logs create-log-group \
  --log-group-name /ecs/hyryder-staging \
  --region ap-southeast-2
```

Now you need to create **task definitions** — these tell ECS what Docker image to run and how much CPU/memory to give it. Go to the **AWS Console** in your browser:

1. Go to https://ap-southeast-2.console.aws.amazon.com/ecs/
2. Click **Task Definitions** → **Create new task definition**
3. Choose **Fargate** as the launch type
4. Fill in:
   - **Task definition name:** `hyryder-django`
   - **Task CPU:** `512` (0.5 vCPU — increase later as needed)
   - **Task memory:** `1024` (1 GB)
5. Under **Container definitions**, click **Add container**:
   - **Container name:** `django`
   - **Image:** `123456789012.dkr.ecr.ap-southeast-2.amazonaws.com/hyryder-backend:latest`
   - **Port mappings:** `8000`
   - **Environment variables:** add all variables from Step 6.5 below
   - **Log configuration:** choose `awslogs`, log group `/ecs/hyryder-staging`
6. Click **Create**
7. Repeat this process to create a second task definition called `hyryder-channels` with port `8001` and command `daphne -b 0.0.0.0 -p 8001 config.asgi:application`
8. Repeat for `hyryder-celery` with command `celery -A config worker --loglevel=info --concurrency=4`
9. Repeat for `hyryder-celery-beat` with command `celery -A config beat --loglevel=info`

### 6.5 Set Secrets in AWS Secrets Manager

Never put production secrets in plain text. Use AWS Secrets Manager.

```bash
# Create a secret with all your production environment variables
# Replace every value below with your real production values
aws secretsmanager create-secret \
  --name "hyryder/staging/env" \
  --region ap-southeast-2 \
  --secret-string '{
    "SECRET_KEY": "your-production-secret-key-here",
    "DATABASE_URL": "postgis://rideshare:YourDbPassword@hyryder-staging-postgres.abc123.ap-southeast-2.rds.amazonaws.com:5432/rideshare",
    "REDIS_URL": "rediss://hyryder-staging-redis.abc123.cfg.apse2.cache.amazonaws.com:6379/0",
    "CELERY_BROKER_URL": "rediss://hyryder-staging-redis.abc123.cfg.apse2.cache.amazonaws.com:6379/2",
    "CHANNEL_LAYERS_REDIS_URL": "rediss://hyryder-staging-redis.abc123.cfg.apse2.cache.amazonaws.com:6379/1",
    "TWILIO_ACCOUNT_SID": "ACxxxxxxxx",
    "TWILIO_AUTH_TOKEN": "xxxxxxxx",
    "TWILIO_VERIFY_SERVICE_SID": "VAxxxxxxxx",
    "STRIPE_SECRET_KEY": "sk_live_xxxxxxxx",
    "AWS_ACCESS_KEY_ID": "AKIAXXXXXXXX",
    "AWS_SECRET_ACCESS_KEY": "xxxxxxxx",
    "AWS_STORAGE_BUCKET_NAME": "hyryder-staging-documents",
    "GOOGLE_MAPS_API_KEY": "AIzaSyxxxxxxxx",
    "ONESIGNAL_APP_ID": "xxxxxxxx",
    "ONESIGNAL_REST_API_KEY": "xxxxxxxx",
    "SENTRY_DSN": "https://xxxxxxxx@o123.ingest.sentry.io/456",
    "FIELD_ENCRYPTION_KEY": "your32characterencryptionkeyhere",
    "DJANGO_SETTINGS_MODULE": "config.settings.production",
    "ALLOWED_HOSTS": "api.hyryder.com.pg,staging-api.hyryder.com.pg"
  }'
```

> **Note on Redis URL:** For ElastiCache with TLS enabled, use `rediss://` (with double-s) instead of `redis://`.

### 6.6 Run Migrations on Production

You need to run `migrate` on the production database once, before launching the services.

```bash
# Run a one-off ECS task to apply migrations
# Replace 'your-subnet-id' and 'your-security-group-id' with values from Terraform output
aws ecs run-task \
  --cluster hyryder-staging \
  --task-definition hyryder-django \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[your-subnet-id],securityGroups=[your-security-group-id],assignPublicIp=ENABLED}" \
  --overrides '{"containerOverrides":[{"name":"django","command":["python","manage.py","migrate"]}]}' \
  --region ap-southeast-2
```

Wait for this task to finish (check in the ECS Console under your cluster → Tasks).

### 6.7 Set Up the Application Load Balancer and SSL

1. In the AWS Console, go to **EC2** → **Load Balancers** → **Create Load Balancer**
2. Choose **Application Load Balancer**
3. Fill in:
   - **Name:** `hyryder-staging-alb`
   - **Scheme:** Internet-facing
   - **IP address type:** IPv4
   - **VPC:** select the VPC created by Terraform
   - **Subnets:** select the two **public** subnets
4. **Security groups:** create a new one allowing inbound port 80 and 443
5. **Listeners and routing:**
   - HTTP:80 → redirect to HTTPS:443
   - HTTPS:443 → forward to target group (create a new target group pointing to ECS service on port 8000)
6. **SSL Certificate:** click **Request a new ACM certificate**
   - Enter your domain name: `api.hyryder.com.pg`
   - Choose **DNS validation**
   - AWS will give you CNAME records to add to your DNS — do this in Section 10
7. Click **Create**

After the load balancer is created, note the **DNS name** (looks like `hyryder-staging-alb-123456.ap-southeast-2.elb.amazonaws.com`). You will point your domain to this in Section 10.

---

## 7. Deploying the Admin Dashboard to Vercel

Vercel is the easiest way to deploy the Next.js admin dashboard. It is free for small teams.

```bash
# Install the Vercel CLI
npm install -g vercel

# Navigate to the admin-web folder
cd admin-web

# Deploy (first time — follow the interactive prompts)
vercel

# Vercel will ask:
# Set up and deploy? Y
# Which scope? (select your account)
# Link to existing project? N
# Project name: hyryder-admin
# Which directory is your code? ./   (press Enter for current directory)
# Want to override the settings? N

# Vercel will deploy and give you a URL like: https://hyryder-admin.vercel.app
```

After the first deploy, you need to set environment variables in Vercel:

```bash
# Set the backend API URL
vercel env add NEXT_PUBLIC_API_URL
# When prompted, enter: https://api.hyryder.com.pg/api/v1
# Select: Production, Preview, Development

# Or set it in the Vercel web dashboard:
# Go to https://vercel.com/your-account/hyryder-admin/settings/environment-variables
```

For all future deploys:
```bash
# From the admin-web/ folder
vercel --prod
```

Or connect Vercel to your GitHub repository for automatic deploys on every push:
1. Go to https://vercel.com/new
2. Import your GitHub repository `zyakap/hyryder`
3. Set **Root Directory** to `admin-web`
4. Add the environment variable `NEXT_PUBLIC_API_URL`
5. Click **Deploy**

---

## 8. Building and Publishing the Mobile Apps

### 8.1 Install Expo EAS CLI

EAS (Expo Application Services) builds your app in the cloud and submits it to app stores.

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in with your Expo account (create one at https://expo.dev/ if you don't have one)
eas login
```

### 8.2 Configure EAS Build

```bash
# From the project root
# Initialize EAS for the passenger app
cd apps/passenger-app
eas init

# EAS will create a project on expo.dev and update app.json with the project ID
# Note the project ID shown — you'll need it
```

Create the EAS configuration file:

```bash
# Create apps/passenger-app/eas.json
cat > eas.json << 'EOF'
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "staging": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://staging-api.hyryder.com.pg/api/v1",
        "EXPO_PUBLIC_WS_URL": "wss://staging-api.hyryder.com.pg"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://api.hyryder.com.pg/api/v1",
        "EXPO_PUBLIC_WS_URL": "wss://api.hyryder.com.pg"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
EOF
```

Repeat the same `eas.json` for `apps/driver-app/eas.json` (change the project name).

### 8.3 Build the Passenger App

```bash
cd apps/passenger-app

# Build for Android (produces an .aab file for Google Play, or .apk for direct install)
eas build --platform android --profile production

# Build for iOS (produces an .ipa file for App Store)
eas build --platform ios --profile production

# EAS builds in the cloud — it takes about 10-20 minutes
# You will get a download link when the build finishes
# You can also monitor progress at: https://expo.dev/accounts/[your-account]/projects/hyryder-passenger/builds
```

### 8.4 Build the Driver App

```bash
cd apps/driver-app

# Same process as passenger app
eas build --platform android --profile production
eas build --platform ios --profile production
```

### 8.5 Submit to Google Play Store

**Pre-requisites:**
1. Create a Google Play Developer account at https://play.google.com/console/signup ($25 one-time fee)
2. Create a new app in the Play Console for each app (passenger + driver)

```bash
cd apps/passenger-app

# Submit the latest build to Google Play
eas submit --platform android --latest

# EAS will ask for your Google Play service account JSON key
# To get this:
# 1. Go to Google Play Console → Setup → API access
# 2. Link to a Google Cloud project
# 3. Create a service account with "Release Manager" role
# 4. Download the JSON key file
# 5. Provide the path to the JSON file when EAS asks
```

**First submission** must be done manually:
1. Download the `.aab` file from the EAS build link
2. Go to Google Play Console → your app → Production → Create new release
3. Upload the `.aab` file
4. Fill in the release notes
5. Submit for review (takes 1-3 days for the first submission)

Subsequent updates can use `eas submit --platform android --latest`.

### 8.6 Submit to Apple App Store

**Pre-requisites:**
1. Apple Developer Program membership at https://developer.apple.com/programs/enroll/ ($99/year)
2. Create an App ID in App Store Connect for `com.hyryder.passenger`

```bash
cd apps/passenger-app

# Submit to App Store Connect
eas submit --platform ios --latest

# EAS will ask for your Apple ID and password
# If you have 2FA on your Apple account (you should), you also need an App-Specific Password:
# 1. Go to https://appleid.apple.com/account/manage
# 2. Sign In & Security → App-Specific Passwords → Generate
# 3. Copy the password and provide it when EAS asks
```

After submission, log in to https://appstoreconnect.apple.com/:
1. Go to your app → TestFlight (for internal testing) or App Store (for public release)
2. Select the build you submitted
3. Fill in screenshots, description, and App Review information
4. Submit for review (takes 1-7 days)

---

## 9. Setting Up CI/CD (GitHub Actions)

The CI/CD pipeline is already configured in `.github/workflows/ci.yml`. It runs tests automatically on every push.

To enable it:

1. Push your code to GitHub (already done if you are reading this)
2. Go to your repository on GitHub: https://github.com/zyakap/hyryder
3. Click **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
4. Add each of these secrets:

| Secret Name | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | From Section 4.1 |
| `AWS_SECRET_ACCESS_KEY` | From Section 4.1 |
| `ECR_REGISTRY` | `123456789012.dkr.ecr.ap-southeast-2.amazonaws.com` |
| `ECR_REPOSITORY` | `hyryder-backend` |
| `ECS_CLUSTER` | `hyryder-staging` |
| `ECS_SERVICE_DJANGO` | `hyryder-django-service` |

After adding secrets, the CI pipeline will:
- Run `pytest` on every pull request
- Run `ruff` linter
- Run TypeScript type checking on the admin dashboard
- Auto-deploy to staging when code is merged to `main`

To check CI status: go to your GitHub repository → click the **Actions** tab.

---

## 10. Domain Name and DNS Setup

You need a domain name for the API. Recommended: `hyryder.com.pg` (PNG domain) or use any domain you own.

**Register a .com.pg domain:**
- Contact the PNG Internet Group (PING): https://www.pngnamesregistry.net/
- Or use a third-party registrar that supports .pg domains

**If using an international domain (.com, .io, etc.):**
- Namecheap: https://www.namecheap.com/
- Cloudflare: https://www.cloudflare.com/products/registrar/

**DNS Records to create:**

Go to your domain registrar's DNS settings and add these records:

| Type | Name | Value | What it does |
|---|---|---|---|
| `CNAME` | `api` | `hyryder-staging-alb-123456.ap-southeast-2.elb.amazonaws.com` | Points to your AWS Load Balancer |
| `CNAME` | `ws` | `hyryder-staging-alb-123456.ap-southeast-2.elb.amazonaws.com` | WebSocket endpoint (same ALB) |
| `CNAME` | `admin` | `hyryder-admin.vercel.app` | Points to your Vercel admin dashboard |

> DNS changes take 5 minutes to 48 hours to propagate globally.

**Verify DNS is working:**
```bash
# Should return your ALB's IP addresses
nslookup api.hyryder.com.pg

# Should return an HTTP 200 or redirect
curl -I https://api.hyryder.com.pg/api/docs/
```

**SSL Certificate for the ALB:**
- You requested an ACM certificate in Section 6.7
- AWS gave you DNS validation CNAME records
- Add those CNAMEs to your DNS provider
- AWS will automatically validate and issue the certificate (takes 5-30 minutes)
- Once issued, the certificate is automatically renewed — no manual action needed

---

## 11. Monitoring and Observability

### Sentry (Error Tracking)

The backend is already configured to send errors to Sentry when `SENTRY_DSN` is set in your environment.

To verify it works:
1. Deploy the backend with `SENTRY_DSN` set
2. Go to your Sentry project dashboard
3. You should see Django startup events within a minute

For the mobile apps, add Sentry to the passenger app:
```bash
cd apps/passenger-app
npx expo install @sentry/react-native

# In apps/passenger-app/app/_layout.tsx, add at the top:
# import * as Sentry from "@sentry/react-native";
# Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN });
```

### Flower (Celery Monitoring)

Flower runs at http://localhost:5555 in local development. In production, protect it with a password:

```bash
# In your production Celery command (ECS task definition), add:
celery -A config flower --port=5555 --basic-auth=admin:yourflowerpassword
```

### CloudWatch (AWS Logs)

View logs for your ECS tasks:
1. Go to AWS Console → CloudWatch → Log groups
2. Click `/ecs/hyryder-staging`
3. You will see separate log streams for each container
4. Use the search bar to filter: `ERROR` or a specific phone number

Set up an alarm for errors:
1. CloudWatch → Alarms → Create alarm
2. Select metric: `Logs` → filter for `ERROR` in your log group
3. Set threshold: alert if more than 10 errors in 5 minutes
4. Add an email notification

---

## 12. Celery Beat — Scheduled Tasks

Celery Beat runs scheduled tasks automatically. These tasks must be registered in the database.

After running migrations, add the scheduled tasks through Django Admin:

1. Open http://localhost:8000/admin/ (or your production admin URL)
2. Go to **Periodic Tasks** → **Add Periodic Task**
3. Add each task below:

| Task name | Task | Schedule |
|---|---|---|
| Calculate surge pricing | `apps.location.tasks.calculate_surge_pricing` | Every 5 minutes (Crontab: `*/5 * * * *`) |
| Generate daily snapshot | `apps.analytics.tasks.generate_daily_snapshot` | Every hour (Crontab: `0 * * * *`) |
| Document expiry reminders | `apps.notifications.tasks.send_document_expiry_reminders` | Daily at 8am (Crontab: `0 8 * * *`) |

To add a task:
1. Click **Add Periodic Task**
2. **Name:** `Calculate Surge Pricing`
3. **Task (registered):** select `apps.location.tasks.calculate_surge_pricing`
4. **Interval Schedule:** click the + button → set **Every** `5` **Period** `Minutes`
5. **Enabled:** checked
6. Click **Save**

---

## 13. PostGIS — Seeding Surge Zones

Port Moresby, Lae, and other cities need surge zones. Add them via Django Admin or a management command.

**Via Django Admin:**
1. Go to http://localhost:8000/admin/location/surgezone/
2. Click **Add Surge Zone**
3. Enter the zone name (e.g., `Port Moresby CBD`)
4. Draw the polygon in the map widget

**Via Python script (easier for initial setup):**

Create a file `backend/scripts/seed_surge_zones.py`:

```python
import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.contrib.gis.geos import Polygon
from apps.location.models import SurgeZone

# Port Moresby CBD approximate polygon
port_moresby_cbd = Polygon((
    (147.155, -9.420),
    (147.200, -9.420),
    (147.200, -9.465),
    (147.155, -9.465),
    (147.155, -9.420),
), srid=4326)

SurgeZone.objects.get_or_create(
    name="Port Moresby CBD",
    defaults={"zone": port_moresby_cbd, "multiplier": 1.00}
)
print("Surge zones seeded successfully.")
```

Run it:
```bash
docker compose exec django python scripts/seed_surge_zones.py
```

---

## 14. Going Live Checklist

Work through this list top to bottom before launching to real users. Do not skip items.

### Business (Do First)
- [ ] Company registered with PNG IPA (Investment Promotion Authority)
- [ ] Transport operator licence obtained
- [ ] Commercial agreement signed with Digicel Business (MiCash API + SMS gateway)
- [ ] Vodafone M-PAiSA commercial agreement (optional but recommended)
- [ ] BSP bank account opened for the business
- [ ] At least 50 verified drivers onboarded in the launch city

### Infrastructure
- [ ] Terraform apply completed without errors
- [ ] RDS PostgreSQL running and accessible from ECS tasks
- [ ] ElastiCache Redis running
- [ ] S3 bucket created with KMS encryption enabled
- [ ] ECR repository created and Docker image pushed
- [ ] ECS cluster created with all 4 services running (django, channels, celery, celery-beat)
- [ ] Application Load Balancer created and health checks passing
- [ ] SSL certificate issued by ACM and attached to ALB
- [ ] Domain DNS records pointing to ALB and Vercel

### Backend
- [ ] `python manage.py migrate` completed on production database
- [ ] Superuser account created
- [ ] `DJANGO_SETTINGS_MODULE=config.settings.production` set in all ECS tasks
- [ ] `DEBUG=False` confirmed
- [ ] All environment variables loaded from AWS Secrets Manager (not hardcoded)
- [ ] Stripe webhooks configured in Stripe Dashboard pointing to `https://api.hyryder.com.pg/api/v1/payments/webhook/`
- [ ] Celery Beat scheduled tasks registered in Django Admin
- [ ] PostGIS surge zones seeded for all launch cities
- [ ] Fare configurations set for Standard, Premium, XL in Django Admin (Pricing → Fare Configs)
- [ ] `https://api.hyryder.com.pg/api/docs/` loads correctly
- [ ] `https://api.hyryder.com.pg/admin/` loads correctly and login works

### Mobile Apps
- [ ] `EXPO_PUBLIC_API_URL` points to production API URL (`https://api.hyryder.com.pg/api/v1`)
- [ ] `EXPO_PUBLIC_WS_URL` points to production WebSocket URL (`wss://api.hyryder.com.pg`)
- [ ] Google Maps API key configured in `app.json` for both apps
- [ ] Passenger app builds successfully for Android and iOS
- [ ] Driver app builds successfully for Android and iOS
- [ ] OTP login works end-to-end on a real device with a real +675 phone number
- [ ] GPS location sharing works on a real Android device
- [ ] Both apps submitted to Google Play and App Store (allow 1-7 days for review)

### Admin Dashboard
- [ ] Deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` environment variable set in Vercel
- [ ] Admin login works
- [ ] Dashboard charts load and show data

### Security
- [ ] `DEBUG=False` in production (critical — never set True in production)
- [ ] `SECRET_KEY` is a unique random value, not the development value
- [ ] `ALLOWED_HOSTS` contains only your domain (e.g., `api.hyryder.com.pg`)
- [ ] AWS WAF enabled on the Application Load Balancer
- [ ] RDS is not publicly accessible (should only be reachable from ECS tasks within VPC)
- [ ] Redis is not publicly accessible
- [ ] S3 bucket does not have public access enabled
- [ ] No `.env` file committed to Git (check with `git log --all -- '**/.env'`)

### Monitoring
- [ ] Sentry DSN configured and test error received in Sentry dashboard
- [ ] CloudWatch log group receiving logs from ECS tasks
- [ ] CloudWatch alarm configured for errors
- [ ] Flower (Celery monitoring) running and accessible (with password protection)

---

## 15. Common Problems and Fixes

### Problem: `docker compose up` fails with "port is already allocated"

Another application is using port 5432 or 6379. Find and stop it:
```bash
# macOS/Linux — find what is using port 5432
lsof -i :5432

# Kill it (replace PID with the actual process ID shown)
kill -9 PID
```

### Problem: Mobile app cannot connect to the backend

1. Make sure your phone and computer are on the same Wi-Fi network
2. Find your computer's local IP address:
   - macOS/Linux: `ifconfig | grep "inet " | grep -v 127`
   - Windows: `ipconfig` → look for IPv4 Address (e.g., `192.168.1.100`)
3. In `apps/passenger-app/services/api.ts`, temporarily change the BASE_URL to:
   `http://192.168.1.100:8000/api/v1` (replace with your computer's IP)
4. Restart the Expo dev server

### Problem: Django says "GDAL library not found"

GDAL is the geospatial library PostGIS requires.
```bash
# macOS
brew install gdal

# Ubuntu
sudo apt-get install -y gdal-bin libgdal-dev

# After installing, rebuild the Docker image:
docker compose build django
docker compose up -d
```

### Problem: Terraform fails with "Error: no valid credential sources"

Your AWS CLI is not configured:
```bash
aws configure
# Re-enter your Access Key ID and Secret Access Key
```

### Problem: ECS task keeps restarting (Exit Code 1)

Check the CloudWatch logs for the error:
1. AWS Console → CloudWatch → Log Groups → `/ecs/hyryder-staging`
2. Look for the most recent log stream → expand it
3. Look for `ERROR` or `Traceback` lines
4. Common causes: wrong `DATABASE_URL`, missing environment variable, failed migration

### Problem: "No module named 'django'" in Docker

The Docker image did not build correctly:
```bash
# Rebuild from scratch without cache
docker compose build --no-cache django
docker compose up -d
```

### Problem: OTP SMS not arriving

1. Check Twilio Console → Monitor → Logs → verify the request was sent
2. Check if Twilio trial account is used — trial accounts can only send to verified numbers
3. Add your own PNG phone number as a verified caller ID in Twilio: Console → Phone Numbers → Verified Caller IDs
4. Check the phone number format — must be `+675XXXXXXX` (no spaces, no hyphens)

### Problem: Stripe webhooks not working

1. For local development, use the Stripe CLI to forward webhooks to localhost:
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe   # macOS
   # Windows: https://stripe.com/docs/stripe-cli

   # Forward webhooks to your local Django
   stripe listen --forward-to localhost:8000/api/v1/payments/webhook/
   ```
2. The CLI gives you a temporary webhook secret — use it in your `.env` as `STRIPE_WEBHOOK_SECRET`

### Problem: Next.js admin dashboard shows "API unreachable"

1. Check that the backend is running: open http://localhost:8000/api/docs/
2. Check CORS settings in `backend/config/settings/development.py` — `CORS_ALLOW_ALL_ORIGINS = True` should be set
3. Check the `NEXT_PUBLIC_API_URL` environment variable in `admin-web/.env.local`:
   ```bash
   # Create this file if it doesn't exist
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > admin-web/.env.local
   ```
   Then restart the Next.js dev server.

---

*Keep this document updated as you make infrastructure changes. Store the database password and all API keys in a password manager — losing them means rebuilding from scratch.*
