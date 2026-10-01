# Dokumentasi Backend — WaferSense AI

Dokumentasi per file dan per fungsi. Setiap file `.md` di folder ini menjelaskan satu file kode
di `backend/app/`. Nomor baris mengacu ke kode saat dokumen ini ditulis — kalau kodenya
berubah, cek lagi dengan Ctrl+F nama fungsinya.

## Isi folder ini

| Dokumen | Menjelaskan file |
|---|---|
| [main.md](main.md) | `app/main.py` — pintu masuk aplikasi Flask |
| [core/config.md](core/config.md) | `app/core/config.py` — konfigurasi `.env` |
| [core/database.md](core/database.md) | `app/core/database.py` — koneksi PostgreSQL |
| [models/tabel-database.md](models/tabel-database.md) | `app/models/prediction.py`, `model_metrics.py`, `__init__.py` |
| [models/artifact-model.md](models/artifact-model.md) | file `.joblib` / `.pkl` / `.json` hasil training |
| [routes/health.md](routes/health.md) | `app/routes/health.py` |
| [routes/dataset.md](routes/dataset.md) | `app/routes/dataset.py` |
| [routes/model.md](routes/model.md) | `app/routes/model.py` |
| [routes/classification.md](routes/classification.md) | `app/routes/classification.py` |
| [routes/clustering.md](routes/clustering.md) | `app/routes/clustering.py` |
| [routes/control.md](routes/control.md) | `app/routes/control.py` |
| [routes/prediction.md](routes/prediction.md) | `app/routes/prediction.py` |
| [services/model_service.md](services/model_service.md) | `app/services/model_service.py` |
| [services/classification_service.md](services/classification_service.md) | `app/services/classification_service.py` |
| [services/clustering_service.md](services/clustering_service.md) | `app/services/clustering_service.py` |
| [services/rl_service.md](services/rl_service.md) | `app/services/rl_service.py` |
| [lainnya.md](lainnya.md) | `schemas/`, `alembic/`, `tests/`, `Dockerfile`, `docker-compose.yml` |

---

## Gambaran besar

Backend = REST API **Flask**. Pola tiap request:

```
Frontend (js)  ──fetch JSON──►  ROUTE (routes/*.py)  ──►  SERVICE (services/*.py)  ──►  model_service (file model)
                                   │ cek format, status HTTP        │ logika ML            └► database (SQLAlchemy → PostgreSQL)
Frontend  ◄──────── JSON ──────────┘
```

- **Route** = "pintu": terima request, cek format, panggil service, kirim JSON + kode HTTP.
- **Service** = "otak": validasi, prediksi, simpan ke database.
- **model_service** = "gudang model": memuat file model sekali lalu disimpan di memori.

---

## Peta alur: fungsi frontend → endpoint → fungsi backend

Ini bagian yang paling sering ditanya: *"data dari frontend diterima di fungsi mana?"*

| Halaman | Fungsi frontend (file:baris) | Request | Route backend | Service backend |
|---|---|---|---|---|
| Semua halaman (navbar) | `ApiClient.updateNavbarStatus()` → `getHealth()` (`js/api.js:231`, `:11`), tiap 30 detik | `GET /api/health` | `health_check()` [routes/health.py:12] | – |
| Dataset | `ApiClient.getDatasetInfo()` (`js/api.js:25`) dipanggil `js/dataset.js:13` | `GET /api/dataset/info` | `get_dataset_info()` [routes/dataset.py:7] | – |
| Classification | `executePrediction()` (`js/classification.js:274`) → `ApiClient.predictClassification(features)` (`js/api.js:54`) | `POST /api/classification/predict` body `{"features": {6 sensor}}` | `predict_defect()` [routes/classification.py:8] | `classification_service.predict()` |
| Clustering | `executeClustering()` (`js/clustering.js:128`) → `ApiClient.predictClustering({process_step})` (`js/api.js:100`) | `POST /api/clustering/predict` body `{"process_step": "Etching"}` | `predict_cluster()` [routes/clustering.py:11] | `clustering_service.predict()` |
| Clustering | `initMetricsAndProfiles()` (`js/clustering.js:294`) → `getClusterMetrics()` + `getClusterProfiles()` | `GET /api/clustering/metrics`, `GET /api/clustering/profiles` | `get_metrics()` [:71], `get_profiles()` [:58] | `clustering_service.get_metrics()`, `get_all_profiles()` |
| Control Optimization | `updateRecommendation()` (`js/control-optimization.js:370`) — saat halaman dibuka, slider digeser (debounce 300 ms), Reset | `POST /api/control-optimization/recommend` body `{"sensor_inputs": {6 sensor}}` | `get_recommendation()` [routes/control.py:14] | `rl_service.evaluate_policy()` |
| Control Optimization | `simulateSingleStep()` (`js/control-optimization.js:199`) — tombol *Simulate Process Control* | `POST /api/control-optimization/simulate-step` | `simulate_step()` [routes/control.py:25] | `rl_service.simulate_step()` |
| Control Optimization | `runTenEpisodes()` (`js/control-optimization.js:267`) — tombol *Run 10 Episodes* | `POST /api/control-optimization/simulate-episodes` body `{"sensor_inputs": {...}, "num_episodes": 10}` | `simulate_episodes()` [routes/control.py:46] | `rl_service.simulate_episodes()` |

Fungsi di `js/api.js` yang **ada tapi belum dipanggil halaman mana pun**: `getModelStatus()` (→ `/api/model/status`),
`getClusteringHistory()` (→ `/api/clustering/history`), `getPredictions()` (→ `/api/predictions`),
`predictControl()` dan `getControlInfo()` (→ `/control-optimization/recommend` dan `/info`; halaman Control memakai
`fetch` sendiri di `control-optimization.js`). Endpoint-nya tetap bisa dites lewat browser/Postman.

---

## Kode status HTTP yang dipakai

| Kode | Arti | Contoh |
|---|---|---|
| 200 | Sukses | prediksi berhasil |
| 400 | Input salah | field kosong, bukan angka, di luar rentang, `action_id` bukan 0/1/2 |
| 500 | Error di server | inferensi gagal, gagal simpan DB (clustering) |
| 503 | Belum siap | model belum ada, database tidak terhubung |

## Cara menjalankan singkat

```bash
docker compose up --build            # backend (port 5000) + PostgreSQL (port 5432)
curl http://localhost:5000/api/health
cd backend && python -m pytest -q    # unit test
```
