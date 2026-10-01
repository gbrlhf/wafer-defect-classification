# `app/services/classification_service.py` — Logika klasifikasi defect (Supervised)

Menerima 6 nilai sensor dari route, memvalidasi, menjalankan **Random Forest**, menjelaskan
fitur paling berpengaruh, lalu menyimpan hasilnya ke database.

## Konstanta di atas file

### `STEP_MAPPING` — baris 11-15
Menerjemahkan singkatan proses ke nama baku. Contoh: `"RIE"` → `"Etching"`, `"CVD"` → `"Deposition"`, `"DUV"` → `"Lithography"`.

### `SUPPORTED_RANGES` — baris 17-24
Batas nilai yang diterima, satuan, dan label tampilan untuk tiap sensor. Nilai di luar batas ditolak (HTTP 400).
Rentang ini **harus sama** dengan `FIELD_SPECS` di frontend (`js/classification.js:48-55`) — saat ini sudah sama
(temp 380-530 °C, pressure 600-900 Torr, gas 70-170 sccm, etch 50-150 nm/min, voltage 3-7 V, current 10-30 mA).

### `FEATURE_KEY_MAP` — baris 26-33
Nama alternatif yang diterima untuk tiap field. Contoh: `temperature_c` boleh dikirim sebagai `temperature` atau `temp`.

---

## `validate_features(features)` — baris 39-65  ⟵ **pemeriksa data dari frontend**
- **Dipanggil oleh:** `predict()` baris 117.
- **Input:** dict fitur dari frontend, mis. `{"temperature_c": 450, ...}`.
- **Langkah untuk setiap 6 sensor:**
  1. Cari nilainya memakai nama-nama di `FEATURE_KEY_MAP`.
  2. Kosong → error `MISSING_FIELD` ("Field 'Chamber Temperature' wajib diisi.").
  3. Bukan angka / NaN / tak hingga → error `INVALID_FIELD_TYPE`.
  4. Di luar `SUPPORTED_RANGES` → error `INPUT_OUT_OF_RANGE` + info `supported_range`.
  5. Lolos → simpan ke `clean_row` sebagai float.
- **Output:** `(True, None, clean_row)` atau `(False, pesan_error, None)`.

## `_compute_influential_features(classifier, scaler, clean_row, is_defect)` — baris 67-114
Menghasilkan data untuk **kartu "Feature Importance" / "Top Influential Features"** di frontend.
- **Importance (baris 69-75):** ambil `classifier.feature_importances_` untuk 6 sensor pertama,
  ubah ke persen (total 100%). Jika tidak tersedia, pakai nilai cadangan.
- **Deviasi / z-score (baris 77-91):** `z = (nilai − mean) / std`, mean & std diambil dari
  `StandardScaler` di `scaler.joblib` (cadangan: statistik dataset). Artinya: "berapa standar deviasi nilai ini dari rata-rata data training".
- **Isi tiap item (baris 96-107):** `feature`, `label`, `value`, `unit`, `model_importance_pct`, `z_score`, `deviation` (mis. `"+2.67σ"`).
- **Urutan (baris 109-112):**
  - Normal → urut berdasarkan importance (fitur paling penting bagi model).
  - Defect → urut berdasarkan `|z-score| × importance` (sensor yang paling menyimpang **dan** penting di atas).

## `predict(features)` — baris 116-216  ⟵ **fungsi utama**
- **Dipanggil oleh:** `routes/classification.py` `predict_defect()` baris 32.
- **Langkah:**
  1. **Validasi** (baris 117-119) → gagal: return `(error, 400)`.
  2. **Ambil model** (baris 121-125): classifier + scaler dari `model_service`. Belum ada → `(pending_model, 503)`.
  3. **Process step** (baris 128-131): dibaca dari input; tidak ada/tidak dikenal → `"Lithography"`.
     *Catatan:* form frontend saat ini **tidak mengirim** `process_step`, jadi selalu `"Lithography"`.
  4. **Transformasi** (baris 133-136): bentuk DataFrame 1 baris → `scaler.transform()` (scaling + one-hot).
  5. **Prediksi** (baris 138-151): `predict_proba()` → peluang Normal & Defect.
     **Threshold 0.25** (baris 138): Defect jika peluang defect ≥ 25%.
  6. **Penjelasan fitur** (baris 157): `_compute_influential_features()`.
  7. **Pesan** (baris 159-163): kalimat ringkas hasil.
  8. **Simpan ke database** (baris 165-194): `PredictionRecord(task_type="classification", ...)` → `add` → `commit`.
     Kalau gagal: `rollback` + log, **prediksi tetap dikembalikan** (`db_record_id = None`).
  9. **Return** (baris 196-212): `(hasil, 200)`.
  10. Error tak terduga (baris 214-216) → `(INFERENCE_ERROR, 500)`.

## Pertanyaan yang mungkin muncul
- **Kenapa threshold 0.25?** Data defect sangat sedikit (7 dari 5000). Dengan 0.5 model hampir selalu menjawab
  Normal. Threshold lebih rendah = lebih sensitif terhadap defect (recall naik), risikonya alarm palsu bertambah.
- **Bagaimana kalau database mati?** Prediksi tetap berjalan, hanya tidak tersimpan.
- **Apakah validasi cukup di frontend?** Tidak — backend tetap memvalidasi karena API bisa dipanggil langsung (Postman, curl).
