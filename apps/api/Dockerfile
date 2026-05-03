# ─── builder ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

# Build deps for psycopg2 + bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY apps/api/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─── runtime ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
      libpq5 tini curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app && useradd --system --gid app app

WORKDIR /app
COPY --from=builder /install /usr/local

COPY apps/api/app ./app
COPY apps/api/alembic ./alembic
COPY apps/api/alembic.ini ./alembic.ini
COPY apps/api/seed.py ./seed.py

USER app
EXPOSE 4000

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "alembic upgrade head && python seed.py && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-4000}"]
