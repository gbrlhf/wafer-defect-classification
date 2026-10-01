# `app/models/` — Tabel database (ORM SQLAlchemy)

**ORM** (Object Relational Mapping) = tabel database ditulis sebagai kelas Python.
Satu kelas = satu tabel, satu atribut `Column` = satu kolom.

> Catatan: folder `app/models/` juga berisi **file model ML** (`.joblib`, `.pkl`) — itu dijelaskan
> di [artifact-model.md](artifact-model.md). Dokumen ini hanya membahas kelas tabel.

---

## `prediction.py` → `class PredictionRecord` — tabel `predictions` (baris 5-20)

Menyimpan **riwayat setiap prediksi** classification dan clustering.

| Kolom | Tipe | Wajib | Isi |
|---|---|---|---|
| `id` | Integer, primary key, auto increment | ya | nomor urut |
| `task_type` | String(50), ber-index | ya | `"classification"` atau `"clustering"` |
| `features` | JSON | ya | input sensor + detail hasil (probabilitas, jarak centroid, dll.) |
| `prediction` | String(100) | ya | `"Normal"` / `"Defect"` atau `"Cluster 1 - Etching"` |
| `confidence` | Float | tidak | probabilitas kelas terpilih (classification); kosong untuk clustering |
| `created_at` | DateTime (timezone) | ya | diisi otomatis oleh database (`func.now()`) |

`__repr__()` (baris 19-20): teks ringkas saat objek di-print, untuk debugging.

**Ditulis oleh:** `classification_service.predict()` (baris 166-194), `clustering_service.predict()` (baris 294-319).
**Dibaca oleh:** `clustering_service.get_history()` (baris 341-371), `routes/prediction.py` `get_predictions()`.

Contoh **bentuk** satu baris data classification (angka hanya ilustrasi):
```json
{
  "id": 12, "task_type": "classification", "prediction": "Defect", "confidence": 0.61,
  "features": {"temperature_c": 490, "pressure_torr": 680, "...": "...",
               "process_step": "Lithography", "defect_probability": 0.61, "decision_threshold": 0.25}
}
```

---

## `model_metrics.py` → `class ModelMetricRecord` — tabel `model_metrics` (baris 5-24)

Disiapkan untuk menyimpan metrik evaluasi model per versi.

| Kolom | Tipe |
|---|---|
| `id` | Integer PK |
| `model_name` | String(100), index |
| `version` | String(50), default `"1.0.0"` |
| `accuracy`, `f1_score`, `precision`, `recall`, `silhouette_score` | Float (boleh kosong) |
| `parameters` | JSON |
| `created_at` | DateTime otomatis |

**Status:** tabelnya dibuat, tetapi **belum ada kode yang mengisi atau membacanya**.

---

## `__init__.py` (baris 1-6)
Mengumpulkan `Base`, `PredictionRecord`, `ModelMetricRecord` agar bisa di-import dari satu tempat
(dipakai `alembic/env.py` dan `core/database.py` saat `create_all`).
