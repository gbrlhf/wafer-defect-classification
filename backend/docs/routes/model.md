# `app/routes/model.py` — Status file model

Blueprint `model`, awalan URL `/api/model` (baris 4). Juga didaftarkan ulang sebagai
`/api/models` di `main.py:39`, jadi kedua alamat sama-sama bekerja.

## `get_model_status_metrics()` — baris 7-42
- **Endpoint:** `GET /api/model/status` dan `GET /api/model/metrics` (dua URL, satu fungsi);
  alias `/api/models/status`, `/api/models/metrics`.
- **Tugas:** melaporkan apakah file model untuk ketiga paradigma ML tersedia.
- **Dipanggil oleh frontend:** `ApiClient.getModelStatus()` (`js/api.js:40`) — fungsi ini **belum dipanggil** halaman mana pun.
- **Langkah:**
  1. Panggil `model_service.get_models_status()` (baris 14) → cek keberadaan file.
  2. Susun ringkasan per paradigma (baris 19-42).
- **Output (ringkas):**
  ```json
  {
    "status": "active",            // "partial" jika ada model yang belum lengkap
    "artifacts_status": {...},     // hasil mentah get_models_status()
    "classification_metrics": {"status": "Ready", "accuracy": null, "f1_score": null, ...},
    "clustering_metrics": {"status": "Ready", "n_clusters": 5, ...},
    "reinforcement_learning_metrics": {"status": "Ready", ...}
  }
  ```
- **Catatan:** `accuracy` dan `f1_score` masih `null` (belum diisi dari hasil training), dan
  `classification_metrics.file` bernilai `null` karena kunci `file` tidak ada di bagian `supervised`.
