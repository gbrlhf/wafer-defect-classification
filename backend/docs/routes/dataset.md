# `app/routes/dataset.py` — Info dataset

Blueprint `dataset`, awalan URL `/api/dataset` (baris 3).

## `get_dataset_info()` — baris 6-26
- **Endpoint:** `GET /api/dataset/info`
- **Tugas:** mengembalikan informasi dataset.
- **Dipanggil oleh frontend:** `ApiClient.getDatasetInfo()` (`js/api.js:25`), dipanggil `js/dataset.js:13`.
- **Output:** JSON **statis** dengan `status: "pending_eda"`, nama dataset, sumber (Kaggle);
  `total_samples`, `features`, `classes` masih kosong/`null`.
- **Catatan:** isinya belum disinkronkan dengan hasil EDA (dataset sebenarnya 5000 baris, 6 sensor + `process_step`,
  label `defect_label`). Ini kandidat perbaikan berikutnya.
