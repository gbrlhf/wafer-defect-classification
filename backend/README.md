# Wafer Defect Classification - Backend ML API

FastAPI-based REST API service for wafer defect classification and clustering inference with PostgreSQL persistence.

---

## Tech Stack
- **FastAPI**: Modern, high-performance web framework for building APIs.
- **PostgreSQL 16**: Relational persistent database for predictions, logs, and model metrics.
- **SQLAlchemy 2.0**: Object Relational Mapper (ORM) for Python.
- **Alembic**: Database migration tool for SQLAlchemy.
- **Uvicorn**: Lightning-fast ASGI server.
- **Pydantic**: Data parsing and schema validation.
- **Scikit-learn**: Machine learning inference engine.
- **Joblib**: Efficient serialization of Python/Scikit-learn model objects.
- **Pandas & NumPy**: Tabular data transformations.

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

## Local Development Setup

### 1. Buat Virtual Environment & Install Dependensi
```bash
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
copy .env.example .env
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
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
Akses server di:
- **Base URL:** `http://localhost:8001`
- **Health Check:** `http://localhost:8001/api/health`
- **Swagger Docs:** `http://localhost:8001/docs`
- **ReDoc Docs:** `http://localhost:8001/redoc`

---

## Endpoints

| Method | Path | Keterangan |
|---|---|---|
| `GET` | `/api/health` | Status health check API & koneksi PostgreSQL |
| `GET` | `/api/dataset/info` | Metadata dataset wafer |
| `GET` | `/api/model/metrics` | Metrik evaluasi model |
| `POST` | `/api/classification/predict` | Prediksi klasifikasi defect wafer |
| `POST` | `/api/clustering/predict` | Prediksi kluster kondisi wafer |
