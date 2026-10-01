# `app/core/config.py` — Konfigurasi aplikasi

Membaca pengaturan dari **environment variable** atau file **`.env`** memakai library
`pydantic-settings`, supaya alamat database, port, dll. tidak ditulis langsung di kode.

## `class Settings(BaseSettings)` — baris 5-23

| Variabel | Default | Dipakai di | Fungsi |
|---|---|---|---|
| `APP_ENV` | `"development"` | `main.py:69` | Mode aplikasi (debug saat dijalankan langsung) |
| `APP_NAME` | `"Wafer Defect Classification API"` | belum dipakai | Nama aplikasi |
| `API_PORT` | `5000` | `main.py:68` | Port server |
| `DATABASE_URL` | URL PostgreSQL lokal | `core/database.py`, `alembic/env.py` | Alamat database |
| `ALLOWED_ORIGINS` | `http://localhost:8080,http://127.0.0.1:8080` | `main.py:21-24` | Daftar asal frontend yang diizinkan (CORS) |
| `MODELS_DIR` | `"app/models"` | belum dipakai | (model_service menghitung path sendiri) |

`model_config` (baris 18-23): baca file `.env`, huruf besar/kecil dibedakan, variabel lain diabaikan.

## `database_url` (property) — baris 25-27
- **Tugas:** mengembalikan `DATABASE_URL`. Dipakai `core/database.py:16`.

## `cors_origins` (property) — baris 29-33
- **Tugas:** memecah teks `ALLOWED_ORIGINS` (dipisah koma) menjadi list.
- **Contoh:** `"http://localhost:8080,http://127.0.0.1:8080"` → `["http://localhost:8080", "http://127.0.0.1:8080"]`.
- **Dipakai:** `main.py:21-22`.

## `settings = Settings()` — baris 36
Objek tunggal yang di-import file lain (`from .core.config import settings`).

## Catatan
- Di Docker, nilai diambil dari `docker-compose.yml` (bagian `environment`) dan file `.env` di root.
- Nilai default `DATABASE_URL` masih berisi password — sebaiknya dikosongkan dan hanya diisi lewat `.env`.
