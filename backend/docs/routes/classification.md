# `app/routes/classification.py` — Endpoint klasifikasi defect

Blueprint `classification`, awalan URL `/api/classification` (baris 4).

## `predict_defect()` — baris 7-33  ⟵ **menerima data dari frontend**
- **Endpoint:** `POST /api/classification/predict`
- **Dipanggil oleh frontend:**
  1. User klik tombol *Predict* / preset → `executePrediction()` (`js/classification.js:274`).
  2. `validateFormInputs()` (`js/classification.js:138`) mengambil 6 input form dan mengecek rentangnya.
  3. `ApiClient.predictClassification(features)` (`js/api.js:54`) mengirim:
     ```json
     {"features": {"temperature_c": 450, "pressure_torr": 760, "gas_flow_sccm": 120,
                   "etch_rate_nm_min": 95, "voltage_v": 5.0, "current_ma": 20}}
     ```
- **Langkah di backend:**
  1. `request.get_json(silent=True)` (baris 14) — baca body JSON. Bukan JSON → HTTP **400** `INVALID_JSON`.
  2. `features = data.get("features", data)` (baris 23) — ambil isi `features`; kalau tidak ada, seluruh body dianggap fitur.
  3. Kosong / bukan objek → HTTP **400** `EMPTY_PAYLOAD`.
  4. Panggil `classification_service.predict(features)` (baris 32) → dapat `(hasil, kode_status)`.
  5. Kirim `jsonify(hasil), kode_status`.
- **Output sukses (HTTP 200), ringkas:**
  ```json
  {"success": true, "status": "success", "prediction": 0, "label": "Normal",
   "defect_probability": 0.0, "defect_probability_percent": 0.0,
   "decision_threshold": 0.25, "influential_features": [...], "message": "...", "db_record_id": 12}
  ```
- **Kemungkinan error:** 400 (input salah, lihat service), 503 (model belum ada), 500 (inferensi gagal).
- **Setelah diterima frontend:** `executePrediction()` menampilkan view Normal/Defect, probabilitas,
  dan kartu fitur lewat `renderInfluentialFeatures()` (`js/classification.js:214`).

Detail logikanya: [../services/classification_service.md](../services/classification_service.md).
