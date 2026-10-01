# `app/services/clustering_service.py` — Logika clustering (Unsupervised, K-Means)

Menentukan **cluster** wafer untuk sebuah *process step*, menghitung jarak ke pusat cluster,
memproyeksikan ke 2D (PCA) untuk gambar, dan menyimpan hasil ke database.

## Konstanta
| Nama | Baris | Isi |
|---|---|---|
| `VALID_PROCESS_STEPS` | 13 | `Lithography, Etching, CMP, Deposition, Oxidation` |
| `PROCESS_STEP_BASELINES` | 16-57 | Nilai rata-rata 6 sensor per process step (dari profil training) |
| `FALLBACK_PROFILES` | 60-146 | Profil 5 cluster + koordinat PCA cadangan, dipakai jika `cluster_profiles.json` tidak ada |

## `class ClusteringService` — baris 149

### `__init__()` — baris 156-159
Menyimpan `model_service` dan langsung memanggil `_init_pca()` → model K-Means **dimuat saat server start**.

### `_init_pca()` — baris 161-173
- Ambil 5 titik pusat cluster (`kmeans.cluster_centers_`), lalu `PCA(n_components=2).fit(centers)`.
- **Tujuan:** mengubah data berdimensi banyak menjadi 2 angka (PC1, PC2) supaya bisa digambar sebagai titik di peta frontend.

### `get_all_profiles()` — baris 175-193
- **Dipanggil oleh:** `GET /api/clustering/profiles`, dan `predict()` baris 289.
- Membaca `cluster_profiles.json`, menambahkan nama cluster, persentase, dan koordinat PCA. File tidak ada → `FALLBACK_PROFILES`.

### `get_metrics()` — baris 195-211
- **Dipanggil oleh:** `GET /api/clustering/metrics`.
- Mengembalikan metrik kualitas: silhouette 0.812, Davies-Bouldin 0.542, Calinski-Harabasz 1420.5, varians PCA.
- **Catatan jujur:** angka ini **ditulis tetap di kode** (hasil evaluasi di Colab), tidak dihitung saat request.

### `predict(data)` — baris 213-339  ⟵ **menerima data dari frontend**
- **Dipanggil oleh:** `routes/clustering.py` `predict_cluster()` baris 27; data asal dari `executeClustering()` (`js/clustering.js:128`) berupa `{"process_step": "Etching"}`.
- **Langkah:**
  1. Model belum ada → return dict `status: "error"` (route → HTTP 500) (baris 220-228).
  2. Ambil `process_step` (baris 234-236), validasi terhadap `VALID_PROCESS_STEPS` (baris 238-244) → salah: `ValueError` (HTTP 400).
  3. **Bentuk input**: baseline sensor step tsb + `process_step` (baris 247-253).
  4. **Prediksi cluster**: `clustering_pipeline.predict(df)` (baris 256-257).
  5. **Jarak ke centroid** (baris 259-267): data diproses seperti saat training (preprocessor → scaler), lalu jarak Euclidean ke pusat cluster.
  6. **Koordinat PCA** (baris 269-286): PC1/PC2 → dikonversi ke posisi SVG untuk marker di peta.
  7. **Profil cluster** (baris 288-292).
  8. **Simpan ke database** (baris 294-319): `PredictionRecord(task_type="clustering")`. Gagal atau DB mati → `RuntimeError` (HTTP 500) — **berbeda dengan classification**, clustering tidak mengembalikan hasil kalau gagal disimpan.
  9. **Return** (baris 321-339): `cluster_id`, `cluster_name`, `distance_to_centroid`, `baseline_parameters`, `profile`, `point_coordinates`, `db_record_id`, `message`.

### `get_history(limit=10)` — baris 341-371
- **Dipanggil oleh:** `GET /api/clustering/history`.
- `SELECT` dari `predictions` dengan `task_type = "clustering"`, terbaru dulu, sebanyak `limit`. DB mati / error → list kosong.

## `clustering_service = ClusteringService()` — baris 374
Objek tunggal yang di-import route.

## Pertanyaan yang mungkin muncul
- **Kenapa input clustering hanya process step?** Halaman clustering dirancang untuk melihat profil tiap proses;
  backend memakai nilai rata-rata sensor proses tersebut sebagai input model.
- **Apa arti hasilnya?** Tiap cluster berisi 100% satu process step (lihat `persentase_proses_dominan`), jadi K-Means
  memisahkan wafer berdasarkan jenis proses.
- **Apa itu jarak ke centroid?** Seberapa dekat data dengan pusat cluster-nya; makin kecil makin "khas" cluster tersebut.
