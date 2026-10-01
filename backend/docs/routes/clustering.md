# `app/routes/clustering.py` — Endpoint clustering

Blueprint `clustering`, awalan URL `/api/clustering` (baris 7).

## `predict_cluster()` — baris 10-54  ⟵ **menerima data dari frontend**
- **Endpoint:** `POST /api/clustering/predict`
- **Dipanggil oleh frontend:** `executeClustering()` (`js/clustering.js:128`) → `ApiClient.predictClustering(payload)` (`js/api.js:100`), body:
  ```json
  {"process_step": "Etching"}
  ```
  (juga diterima: `{"features": {"process_step": "Etching"}}`)
- **Langkah:**
  1. Baca JSON (baris 17). Bukan JSON → HTTP **400** `invalid_json`.
  2. `clustering_service.predict(data)` (baris 27).
  3. Hasil `status == "error"` (model tidak ada) → HTTP **500**; selain itu HTTP 200.
  4. Penanganan error (baris 31-54):
     | Exception | Arti | HTTP |
     |---|---|---|
     | `ValueError` | `process_step` kosong / tidak valid | 400 `validation_error` |
     | `RuntimeError` | gagal simpan ke database / DB mati | 500 `persistence_error` |
     | lainnya | error tak terduga | 500 `server_error` |
- **Output sukses:** `cluster_id`, `cluster_name`, `process_step`, `distance_to_centroid`,
  `baseline_parameters`, `profile`, `point_coordinates` (PCA), `db_record_id`, `message`.

## `get_profiles()` — baris 57-67
- **Endpoint:** `GET /api/clustering/profiles`
- **Dipanggil oleh:** `initMetricsAndProfiles()` (`js/clustering.js:294`) → `ApiClient.getClusterProfiles()`.
- **Output:** `{"status": "success", "clusters_count": 5, "profiles": {...}}` dari `clustering_service.get_all_profiles()`.

## `get_metrics()` — baris 70-76
- **Endpoint:** `GET /api/clustering/metrics`
- **Dipanggil oleh:** `initMetricsAndProfiles()` (`js/clustering.js:294`) → `ApiClient.getClusterMetrics()`; dipakai untuk kartu jumlah cluster & silhouette.
- **Output:** dari `clustering_service.get_metrics()` (nilai tetap di kode).

## `get_history(limit)` — baris 79-90
- **Endpoint:** `GET /api/clustering/history?limit=10`
- **Dipanggil oleh:** `ApiClient.getClusteringHistory()` (`js/api.js:165`) — belum dipakai halaman.
- **Langkah:** baca `limit` dari query string (default 10) → `clustering_service.get_history(limit)`.
- **Output:** `{"status": "success", "count": n, "history": [...]}`.

Detail logikanya: [../services/clustering_service.md](../services/clustering_service.md).
