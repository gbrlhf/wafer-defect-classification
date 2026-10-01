# `app/routes/health.py` — Cek kesehatan server

Blueprint `health`, awalan URL `/api/health` (baris 8).

## `health_check()` — baris 11-20
- **Endpoint:** `GET /api/health`
- **Tugas:** memberi tahu bahwa server Flask hidup. **Tidak** menyentuh database atau model.
- **Dipanggil oleh frontend:** `ApiClient.getHealth()` (`js/api.js:11`) lewat `updateNavbarStatus()` (`js/api.js:231`)
  — dijalankan saat halaman dibuka lalu **setiap 30 detik** (`js/api.js:251-254`) untuk indikator
  "API: Online / Offline" di navbar.
- **Output:** `{"status": "ok", "service": "wafer-defect-api"}` — HTTP 200.

## `database_health_check()` — baris 23-51
- **Endpoint:** `GET /api/health/database`
- **Tugas:** mengecek koneksi PostgreSQL dengan query `SELECT 1`.
- **Dipanggil oleh frontend:** tidak ada (untuk cek manual / unit test).
- **Langkah:**
  1. `SessionLocal` belum ada (DB gagal diinisialisasi) → `{"status": "error", "database": "disconnected"}`, HTTP **503**.
  2. Buka sesi, jalankan `SELECT 1`.
  3. Berhasil → `{"status": "ok", "database": "connected"}`, HTTP 200.
  4. Gagal → log nama error saja (password tidak ikut tercatat), HTTP 503.
  5. `finally`: sesi selalu ditutup (`SessionLocal.remove()`).
