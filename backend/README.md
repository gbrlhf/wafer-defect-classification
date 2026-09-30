# Wafer Defect Classification Backend

## Description

Backend service untuk **Wafer Defect Classification System**. Service ini bertindak sebagai API server dan inference engine yang menghubungkan client/frontend dengan model Machine Learning dan database persistent PostgreSQL.

Arsitektur backend dibangun dengan komponen utama:
```text
FastAPI
   +
PostgreSQL
   +
SQLAlchemy
   +
Alembic
   +
Machine Learning Inference
```

Tugas utama backend:
1. Menyediakan REST API untuk client/frontend.
2. Menyimpan data persistent (history prediksi, metadata model, metrik) ke PostgreSQL.
3. Melakukan inference machine learning menggunakan model pre-trained `.joblib` hasil training terpisah (Google Colab).
4. Menyediakan health checks untuk monitoring availability server dan koneksi database.

---

## Technology Stack

* **Language**: Python 3.11
* **Web Framework**: FastAPI (high performance ASGI web framework)
* **ASGI Server**: Uvicorn
* **Database**: PostgreSQL
* **ORM**: SQLAlchemy 2.0 (with `pool_pre_ping=True`)
* **Database Migrations**: Alembic
* **Data Validation & Settings**: Pydantic v2 & Pydantic Settings
* **Containerization**: Docker (Python 3.11 slim)
* **Testing**: Pytest & HTTPX TestClient

---

## Project Structure

```text
backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI application entry point & CORS configuration
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py            # Environment configuration via Pydantic Settings
│   │   └── database.py          # SQLAlchemy engine, SessionLocal, Base, get_db
│   │
│   ├── models/
│   │   └── __init__.py          # SQLAlchemy ORM models (Prediction, ModelMetric)
│   │
│   ├── schemas/
│   │   ├── __init__.py          # Pydantic schemas module
│   │   ├── classification.py    # Classification request/response schemas
│   │   ├── clustering.py        # Clustering schemas
│   │   ├── metric.py            # Model metrics schemas
│   │   └── prediction.py        # Prediction history schemas
│   │
│   ├── routes/
│   │   ├── __init__.py          # Central API router aggregator
│   │   ├── health.py            # Health check endpoints (/api/health, /api/health/database)
│   │   ├── classification.py    # Wafer defect classification inference endpoints
│   │   ├── clustering.py        # Wafer pattern clustering endpoints
│   │   ├── predictions.py       # Prediction history retrieval endpoints
│   │   └── model.py             # Model metadata & status endpoints
│   │
│   └── services/
│       ├── __init__.py          # Services module
│       ├── classification_service.py # Classification inference logic
│       ├── clustering_service.py     # Clustering inference logic
│       ├── model_service.py          # Serialized .joblib model loader
│       └── prediction_service.py     # Database persistence service
│
├── alembic/
│   ├── env.py                   # Alembic environment linked to Base.metadata
│   ├── script.py.mako           # Migration script template
│   ├── README                   # Alembic instructions
│   └── versions/                # Database migration version files (.gitkeep)
│
├── tests/
│   ├── __init__.py
│   └── test_health.py           # Automated health check tests
│
├── Dockerfile                   # Docker image definition (Python 3.11-slim)
├── .dockerignore                # Build exclusions
├── requirements.txt             # Backend dependencies
├── .env.example                 # Example environment variables template
├── alembic.ini                  # Alembic CLI configuration
└── README.md                    # Backend documentation
```

---

## Environment Variables

Salin `.env.example` menjadi `.env` sebelum menjalankan aplikasi secara lokal:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `APP_ENV` | Environment runtime (`development`, `production`) | `development` |
| `API_PORT` | Port server FastAPI | `8001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://wafer_user:wafer_password@postgres:5432/wafer_db` |
| `ALLOWED_ORIGINS` | Comma-separated list origin CORS yang diizinkan | `http://localhost:8080,http://127.0.0.1:8080` |

> **Catatan Penting**:
> * File `.env` tidak boleh di-commit ke Git repository (sudah terdaftar di `.gitignore`).
> * Saat backend dijalankan di dalam Docker container, gunakan host PostgreSQL `postgres` (bukan `localhost`).

---

## Local Development

### 1. Prasyarat
* Python 3.11+
* PostgreSQL server

### 2. Setup Virtual Environment
```bash
cd backend
python -m venv .venv

# Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Linux / macOS:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Menjalankan Server
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

Akses API:
* **Interactive API Docs (Swagger UI)**: [http://localhost:8001/docs](http://localhost:8001/docs)
* **Alternative API Docs (ReDoc)**: [http://localhost:8001/redoc](http://localhost:8001/redoc)
* **General Health Check**: [http://localhost:8001/api/health](http://localhost:8001/api/health)
* **Database Health Check**: [http://localhost:8001/api/health/database](http://localhost:8001/api/health/database)

---

## Docker

Backend dikemas dalam container terisolasi berbasis `python:3.11-slim`.

### Build Docker Image
```bash
cd backend
docker build -t wafer-defect-backend:latest .
```

### Run Docker Container
```bash
docker run -d \
  -p 8001:8001 \
  --name wafer-backend \
  --env-file .env \
  wafer-defect-backend:latest
```

Backend diekspos pada `0.0.0.0:8001` agar dapat diakses dari luar container.

---

## Database

Backend menggunakan **PostgreSQL** sebagai database relasional persistent via **SQLAlchemy 2.0**.
Database connection pool dikonfigurasi dengan `pool_pre_ping=True` untuk menangani koneksi stale secara otomatis.

Alur akses database:
```text
FastAPI route
    ↓
get_db() dependency
    ↓
SQLAlchemy Session
    ↓
PostgreSQL
```

### Database Migrations (Alembic)
Konfigurasi migrasi dikelola oleh Alembic dengan metadata yang terhubung ke `app.core.database.Base`.

Menjalankan migrasi:
```bash
cd backend

# Membuat migration baru secara otomatis berdasarkan SQLAlchemy models
alembic revision --autogenerate -m "initial migration"

# Menerapkan migrasi ke database
alembic upgrade head

# Rollback satu revisi
alembic downgrade -1
```

---

## API

### Health Endpoints

#### 1. General Service Health
* **Method**: `GET`
* **Path**: `/api/health`
* **Response**:
```json
{
    "status": "ok",
    "service": "wafer-defect-api"
}
```
*Endpoint ini independen dan dapat berjalan tanpa database.*

#### 2. Database Health
* **Method**: `GET`
* **Path**: `/api/health/database`
* **Query Internal**: `SELECT 1`
* **Response (Connected)**:
```json
{
    "status": "ok",
    "database": "connected"
}
```
* **Response (Disconnected / Unavailable)**:
```json
{
    "status": "error",
    "database": "disconnected"
}
```
*(Tidak mengekspos kredensial database saat koneksi gagal).*

---

## Machine Learning Integration

Proses training Machine Learning dilakukan secara terpisah di **Google Colab** oleh anggota tim lainnya. Backend bertugas khusus pada tahap **Inference**.

Model terlatih akan diserahkan dalam bentuk file serialisasi:
* `classifier.joblib` (Defect Classification model)
* `scaler.joblib` (Feature Scaler/Preprocessor)
* `clustering.joblib` (Defect Pattern Clustering model)

Arsitektur pemanggilan model:
1. `app/services/model_service.py` akan memuat file `.joblib` ke dalam memory saat service start.
2. Endpoint `/api/classification` menerima input parameter wafer.
3. `app/services/classification_service.py` memproses input dan menjalankan inference.
4. `app/services/prediction_service.py` mencatat hasil prediksi ke PostgreSQL.

> **Catatan**: Tidak ada implementasi dummy model, nama feature fiktif, atau dummy predictions yang dibuat sebelum EDA dataset dan training model selesai.

---

## Testing

Testing unit dan integrasi dijalankan menggunakan `pytest`.

```bash
cd backend
pytest
```

Test suite mencakup:
* Verifikasi endpoint `/api/health` mengembalikan status `200 OK` tanpa dependensi database.
* Verifikasi endpoint `/api/health/database` menangani kondisi disconnected secara graceful dan aman.
