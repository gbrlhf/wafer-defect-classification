# `app/services/model_service.py` — Pemuat & cache file model

Satu-satunya tempat yang **membuka file model** dari disk. Service lain (classification,
clustering, RL) meminta model lewat sini.

**Konsep kunci:** *lazy loading + cache (singleton)* — file baru dibuka saat pertama kali dibutuhkan,
lalu disimpan di atribut objek. Request berikutnya langsung memakai yang ada di memori → cepat.

## Shim kompatibilitas scikit-learn — baris 10-18
Model di-*pickle* dengan scikit-learn versi lain di Colab. Kode ini menambahkan kelas
`_RemainderColsList` yang hilang di versi lokal, supaya `scaler.joblib` & `kmeans_pipeline.pkl` bisa dibuka.

## `class ModelService` — baris 21

### `__init__(models_dir=None)` — baris 30-42
- Menentukan folder model: `backend/app/models` (dihitung dari lokasi file ini, baris 33).
- Menyiapkan 6 "slot cache" bernilai `None`: classifier, scaler, clustering, rl_metadata, rl_qtable, cluster_profiles.

### `_load_joblib_file(filename)` — baris 44-57
- Membuka file dengan `joblib.load`. File tidak ada / gagal → log + return `None` (tidak crash).

### `_load_pickle_file(filename)` — baris 59-76
- Membuka file dengan `pickle.load`; kalau gagal, dicoba lagi dengan `joblib.load`. Tetap gagal → `None`.

### Getter (semua pola sama: "kalau slot kosong → muat → simpan → kembalikan")
| Fungsi | Baris | File | Dipakai oleh |
|---|---|---|---|
| `get_classifier()` | 78-82 | `classifier.joblib` | `classification_service.predict()` |
| `get_scaler()` | 84-88 | `scaler.joblib` | `classification_service.predict()` |
| `get_clustering()` | 90-100 | `kmeans_pipeline.pkl` (cadangan `clustering.joblib`) | `clustering_service` |
| `get_cluster_profiles()` | 102-112 | `cluster_profiles.json` | `clustering_service.get_all_profiles()` |
| `get_rl_metadata()` | 114-118 | `rl_semiconductor_metadata.pkl` (pickle) | `rl_service._rl_ctx()` |
| `get_rl_qtable()` | 120-126 | `rl_semiconductor_qtable.pkl` (joblib, cadangan pickle) | `rl_service._rl_ctx()` |

### `get_models_status()` — baris 128-159
- **Tugas:** cek **keberadaan** file (tidak memuat model) untuk ketiga paradigma.
- **Dipakai oleh:** `routes/model.py` → `GET /api/model/status`.
- **Output:** `models_directory`, blok `supervised` / `unsupervised` / `reinforcement_learning`
  (masing-masing `available: true/false`), dan `ready_for_inference`.

### `reload()` — baris 161-169
- **Tugas:** mengosongkan semua cache agar request berikutnya memuat ulang dari disk.
- **Dipakai oleh:** belum ada route yang memanggil — saat ini cukup restart server.

## `model_service = ModelService()` — baris 173
Objek tunggal (singleton) yang di-import semua service.

## Kapan model benar-benar dimuat?
- Classification & RL: saat request pertama ke endpoint-nya.
- Clustering: **saat server start**, karena `ClusteringService.__init__` langsung memanggil `get_clustering()` untuk menyiapkan PCA.
