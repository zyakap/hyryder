FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies for PostGIS / GDAL
RUN apt-get update && apt-get install -y --no-install-recommends \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    binutils \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --------------------------------------------------------------------------- #
FROM base AS development

COPY requirements/development.txt ./requirements/development.txt
RUN pip install -r requirements/development.txt

COPY . .

EXPOSE 8000 8001

# --------------------------------------------------------------------------- #
FROM base AS production

COPY requirements/production.txt ./requirements/production.txt
RUN pip install -r requirements/production.txt

COPY . .

RUN python manage.py collectstatic --noinput --settings=config.settings.production

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
