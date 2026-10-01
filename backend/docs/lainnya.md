# File pendukung: schemas, Alembic, test, Docker

## `app/schemas/` — skema Pydantic
Kelas untuk mendefinisikan bentuk request/response secara formal:

| File | Kelas |
|---|---|
| `common.py` | `HealthResponse` (baris 4), `MessageResponse` (9), `ErrorResponse` (14) |
| `classification.py` | `ClassificationRequest` (4), `ClassificationResponse` (11) |
| `clustering.py` | `ClusteringRequest` (4), `ClusteringResponse` (11) |
| `prediction.py` | `PredictionRecordBase` (5), `PredictionRecordCreate` (11), `PredictionRecordResponse` (14) |
| `model_metrics.py` | `ModelMetricsBase` (5), `ModelMetricsCreate` (15), `ModelMetricsResponse` (18) |

**Status:** belum di-import oleh route/service mana pun. Validasi saat ini dilakukan manual di service
(mis. `classification_service.validate_features()`). Skema ini bisa dipakai nanti untuk validasi otomatis.

---

## `alembic.ini` & `alembic/` — migrasi database
- **Alembic** = alat untuk mencatat perubahan struktur tabel database secara bertahap (seperti "git untuk tabel").
- `alembic/env.py`: mengambil `DATABASE_URL` dari `settings` (baris 25-28) dan daftar tabel dari `Base.metadata` (baris 32).
- `alembic/versions/`: **masih kosong** (hanya `.gitkeep`) — belum ada migrasi.
- Tabel saat ini dibuat otomatis oleh `Base.metadata.create_all()` di `core/database.py`.
- Cara membuat migrasi pertama (bila diperlukan):
  ```bash
  cd backend
  alembic revision --autogenerate -m "create predictions and model_metrics"
  alembic upgrade head
  ```

---

## `tests/test_health.py` — unit test (pytest)
Memakai `app.test_client()` Flask (server tidak perlu dijalankan).

| Test | Baris | Yang dicek | Hasil sekarang |
|---|---|---|---|
| `test_health_endpoint` | 12 | `/api/health` → 200, `status: ok` | lulus |
| `test_database_health_endpoint_response_format` | 20 | `/api/health/database` → 200 atau 503 dengan format benar | lulus |
| `test_root_endpoint` | 30 | `/` → versi `1.0.0` | lulus |
| `test_dataset_info_pending` | 37 | `/api/dataset/info` → `pending_eda` | lulus |
| `test_classification_pending_model` | 44 | mengharapkan `pending_model` | **gagal** (sekarang 400, model sudah ada) |
| `test_clustering_pending_model` | 51 | mengharapkan `pending_model` | **gagal** (sekarang 400, model sudah ada) |

Dua test terakhir ditulis saat model belum ada; perilaku backend sekarang benar, test-nya yang perlu diperbarui.
```bash
cd backend
python -m pytest -q
```

---

## `backend/Dockerfile` — resep image backend
| Baris | Instruksi | Arti |
|---|---|---|
| 1 | `FROM python:3.11-slim` | mulai dari image Python 3.11 versi ringan |
| 3 | `WORKDIR /app` | folder kerja di dalam container |
| 5-7 | `COPY requirements.txt` + `pip install` | pasang library dulu (supaya cache build efisien) |
| 9 | `COPY . .` | salin seluruh kode + file model |
| 11 | `EXPOSE 5000` | port yang dipakai |
| 13 | `CMD python -m flask --app app.main:app run --host 0.0.0.0 --port 5000` | perintah menjalankan server |

`backend/.dockerignore` mengecualikan `.env`, `.venv`, `.git`, `__pycache__` dari image.

## `docker-compose.yml` (root) — menjalankan semua container
| Service | Isi | Port | Catatan |
|---|---|---|---|
| `backend` | build dari `./backend` | 5000 | folder `./backend` di-mount ke `/app` (kode/model di laptop langsung terpakai setelah restart); `DATABASE_URL` dari file `.env` root; menunggu postgres sehat |
| `postgres` | `postgres:16-alpine` | 5432 | data di volume `postgres_data` (tidak hilang saat container dihapus); healthcheck `pg_isready` tiap 5 detik |

Keduanya di jaringan `wafer-network`, jadi backend memanggil database dengan host `postgres`.

```bash
docker compose up --build          # build & jalankan
docker compose logs -f backend     # lihat log backend
docker compose restart backend     # setelah ganti kode / model
docker compose down                # hentikan (data DB tetap di volume)
```

## `requirements.txt`
`flask`, `flask-cors`, `gunicorn` (belum dipakai), `sqlalchemy`, `psycopg2-binary` (driver PostgreSQL),
`pydantic`, `pydantic-settings`, `python-dotenv`, `alembic`, `pytest`, `numpy`, `scipy`, `pandas`, `scikit-learn`, `joblib`.
