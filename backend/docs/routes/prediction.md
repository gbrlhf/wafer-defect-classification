# `app/routes/prediction.py` — Riwayat prediksi dari database

Blueprint `predictions`, awalan URL `/api/predictions` (baris 8).
Satu-satunya route yang **langsung** membaca database tanpa lewat service.

## `get_predictions()` — baris 11-60
- **Endpoint:** `GET /api/predictions` (dengan atau tanpa `/` di akhir)
- **Query string:**
  - `type` atau `task_type`: `classification` / `clustering` (opsional, untuk filter)
  - `limit`: jumlah data (default 20)
- **Dipanggil oleh frontend:** `ApiClient.getPredictions(type, limit)` (`js/api.js:179`) — belum dipakai halaman.
- **Langkah:**
  1. Database belum siap (`SessionLocal is None`) → HTTP **503**.
  2. `db.query(PredictionRecord)` + filter `task_type` (jika ada).
  3. Urutkan terbaru dulu (`created_at desc`), batasi `limit`.
  4. Ubah tiap baris ke dict (tanggal diformat `YYYY-MM-DD HH:MM:SS`).
  5. Gagal query → HTTP **500**. `finally`: sesi ditutup.
- **Output:** `{"status": "success", "count": n, "predictions": [{id, task_type, prediction, features, confidence, created_at}, ...]}`.
- **Contoh uji:** buka `http://localhost:5000/api/predictions?type=classification&limit=5`.
