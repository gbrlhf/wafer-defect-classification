# `app/core/database.py` — Koneksi PostgreSQL (SQLAlchemy)

Menyiapkan koneksi ke database **sekali saat aplikasi start**, lalu menyediakan "sesi"
untuk dipakai service saat menyimpan/membaca data.

## Kode tingkat modul (jalan otomatis saat di-import)

| Baris | Kode | Penjelasan |
|---|---|---|
| 10 | `Base = declarative_base()` | Kelas induk untuk semua tabel (lihat `models/`) |
| 13-14 | `engine = None`, `SessionLocal = None` | Nilai awal; tetap `None` kalau koneksi gagal |
| 18-20 | ganti `postgresql://` → `postgresql+psycopg2://` | Memberi tahu SQLAlchemy driver yang dipakai (psycopg2) |
| 22-25 | `create_engine(db_url, pool_pre_ping=True)` | **Engine** = pengelola koneksi. `pool_pre_ping` mengecek koneksi masih hidup sebelum dipakai |
| 26-32 | `SessionLocal = scoped_session(sessionmaker(...))` | **Session** = "percakapan" dengan database. `scoped_session` → satu sesi per request/thread |
| 33-38 | `Base.metadata.create_all(bind=engine)` | **Membuat tabel otomatis** (`predictions`, `model_metrics`) kalau belum ada. Gagal → hanya warning |
| 39-42 | `except` | Kalau database tidak bisa diinisialisasi, `engine` & `SessionLocal` dikembalikan ke `None` → aplikasi tetap jalan |

Akibatnya: **backend tetap bisa start walau database mati.** Classification & RL tetap jalan,
yang butuh database (clustering, riwayat, `/api/health/database`) memberi error yang jelas.

## `get_db()` — baris 45-51
- **Tugas:** membuat satu sesi database baru.
- **Error:** `RuntimeError` jika `SessionLocal` belum ada.
- **Dipanggil oleh:** belum dipakai (service langsung memakai `SessionLocal()`).

## `check_db_connection()` — baris 54-68
- **Tugas:** tes koneksi dengan `SELECT 1`.
- **Output:** `{"status": "connected"}` / `{"status": "disconnected", "error": ...}` / `{"status": "unconfigured", ...}`.
- **Dipanggil oleh:** belum dipakai (route health membuat cek sendiri, lihat `routes/health.md`).

## Siapa yang memakai database?
| Fungsi | Operasi | Tabel |
|---|---|---|
| `classification_service.predict()` | INSERT | `predictions` |
| `clustering_service.predict()` | INSERT | `predictions` |
| `clustering_service.get_history()` | SELECT | `predictions` |
| `routes/prediction.py` `get_predictions()` | SELECT | `predictions` |
| `routes/health.py` `database_health_check()` | `SELECT 1` | – |
| `main.py` `shutdown_session()` | tutup sesi | – |
