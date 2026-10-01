# Wafer Defect Classification - Backend ML API

Flask-based REST API service for wafer defect classification and clustering inference with PostgreSQL persistence.

---

## Tech Stack
- **Flask**: Lightweight and flexible Python web framework.
- **Flask-CORS**: Cross-Origin Resource Sharing handling for Flask.
- **Gunicorn**: Production WSGI HTTP server.
- **PostgreSQL 16**: Relational persistent database for predictions, logs, and model metrics.
- **SQLAlchemy 2.0**: Object Relational Mapper (ORM) with `pool_pre_ping=True` and `scoped_session`.
- **Alembic**: Database migration tool for SQLAlchemy.
- **Pydantic & Pydantic Settings**: Data parsing, schema validation, and environment configuration.
- **Docker & Docker Compose**: Containerization for backend and PostgreSQL.

---

## Database Architecture
PostgreSQL runs as a dedicated container (`wafer-postgres`) within the `wafer-network` Docker bridge.

### Database Tables:
1. `predictions`:
   - `id`: Primary key (autoincrement)
   - `task_type`: `'classification'` or `'clustering'`
   - `features`: JSON wafer measurement input map
   - `prediction`: Predicted defect category or cluster assignment
   - `confidence`: Confidence / probability score
   - `created_at`: Timestamp
2. `model_metrics`:
   - `id`: Primary key (autoincrement)
   - `model_name`: `'classifier'`, `'clustering'`, etc.
   - `version`: Version tag
   - `accuracy`, `f1_score`, `precision`, `recall`, `silhouette_score`
   - `parameters`: Hyperparameter JSON metadata
   - `created_at`: Timestamp

---

## Docker Compose Setup

Jalankan backend dan database PostgreSQL secara terisolasi:

```bash
docker compose up --build -d
```

Cek status container:
```bash
docker ps
```
Target container yang running:
- `wafer-defect-backend`
- `wafer-postgres`

---

## Local Development Setup

### 1. Buat Virtual Environment & Install Dependensi
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Untuk menjalankan di Docker, `DATABASE_URL` menggunakan host `postgres`:
```env
DATABASE_URL=postgresql://wafer_user:wafer_password@postgres:5432/wafer_db
```
Untuk menjalankan lokal di luar Docker:
```env
DATABASE_URL=postgresql://wafer_user:wafer_password@localhost:5432/wafer_db
```

### 3. Database Migration (Alembic)
```bash
# Generate migration baru otomatis
alembic revision --autogenerate -m "Initial tables"

# Jalankan migrasi ke database
alembic upgrade head
```

### 4. Menjalankan Server
```bash
flask --app app.main:app run --host 0.0.0.0 --port 8001 --debug
```
Akses server di:
- **Base URL:** `http://localhost:8001`
- **Health Check API:** `http://localhost:8001/api/health`
- **Health Check Database:** `http://localhost:8001/api/health/database`

---

## Endpoints

| Method | Path | Keterangan |
|---|---|---|
| `GET` | `/` | Root information |
| `GET` | `/api/health` | Health check API backend (`{"status": "ok", "service": "wafer-defect-api"}`) |
| `GET` | `/api/health/database` | Health check koneksi PostgreSQL via SQLAlchemy `SELECT 1` |
| `GET` | `/api/dataset/info` | Metadata dataset wafer |
| `GET` | `/api/model/metrics` | Metrik evaluasi model |
| `POST` | `/api/classification/predict` | Prediksi klasifikasi defect wafer |
| `POST` | `/api/clustering/predict` | Prediksi kluster kondisi wafer |
