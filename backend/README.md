# Wafer Defect Classification - Backend ML API

FastAPI-based REST API service for wafer defect classification and clustering inference.

---

## Tech Stack
- **FastAPI**: Modern, high-performance web framework for building APIs.
- **Uvicorn**: Lightning-fast ASGI server.
- **Pydantic**: Data parsing and schema validation.
- **Scikit-learn**: Machine learning inference engine.
- **Joblib**: Efficient serialization of Python/Scikit-learn model objects.
- **Pandas & NumPy**: Tabular data transformations.

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

### 3. Menjalankan Server
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
| `GET` | `/api/health` | Status health check API |
| `GET` | `/api/dataset/info` | Metadata dataset wafer |
| `GET` | `/api/model/metrics` | Metrik evaluasi model |
| `POST` | `/api/classification/predict` | Prediksi klasifikasi defect wafer |
| `POST` | `/api/clustering/predict` | Prediksi kluster kondisi wafer |

---

## Model Serialization
Model hasil pelatihan dari Google Colab diekspor menggunakan Joblib dan diletakkan pada:
`backend/app/models/`
- `classifier.joblib`
- `scaler.joblib`
- `clustering.joblib`
