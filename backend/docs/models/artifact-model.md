# File model hasil training (`backend/app/models/`)

Semua model **dilatih di Google Colab**, lalu filenya disalin ke folder ini.
Backend **tidak melatih** apa pun — hanya memuat file dan memakai untuk prediksi.

| File | Isi | Dimuat oleh | Dipakai oleh |
|---|---|---|---|
| `classifier.joblib` | `RandomForestClassifier` (100 pohon, `class_weight="balanced"`, `random_state=42`), menerima 11 fitur | `model_service.get_classifier()` | Classification |
| `scaler.joblib` | `ColumnTransformer`: `StandardScaler` untuk 6 sensor + `OneHotEncoder` untuk `process_step` | `model_service.get_scaler()` | Classification |
| `kmeans_pipeline.pkl` | Pipeline `ColumnTransformer → StandardScaler → KMeans(k=5)` | `model_service.get_clustering()` | Clustering |
| `cluster_profiles.json` | Rata-rata sensor & jumlah wafer per cluster | `model_service.get_cluster_profiles()` | Clustering |
| `rl_semiconductor_qtable.pkl` | Q-table numpy 31.250 × 3 | `model_service.get_rl_qtable()` | Control Optimization |
| `rl_semiconductor_metadata.pkl` | Dict: batas state, jumlah bin, nama action, target & skala reward, step transisi, parameter training, daftar state terlatih | `model_service.get_rl_metadata()` | Control Optimization |

## Kenapa 11 fitur untuk Random Forest?
6 sensor (di-scale) + 5 kolom hasil one-hot `process_step`
(CMP, Deposition, Etching, Lithography, Oxidation) = 11.

## Isi penting metadata RL
- `state_bounds`: temp 300-600, pressure 500-1000, gas 50-200, etch 50-200, voltage 2-10, current 10-40
- `n_bins`: `[10, 5, 5, 5, 5, 5]` → 31.250 state
- `reward.target`: rata-rata wafer normal (≈ 450.06 °C, 759.80 Torr, 120.11 sccm), `reward.scale`: std, `reward.floor`: −100
- `transition.step`: ½ std per action (temp ≈ 7.46, pressure ≈ 15.11, gas ≈ 5.00), `noise_std`: 5% std
- `training`: 30.000 episode × 20 langkah, α = 0.1, γ = 0.9, ε 1.0 → 0.05, seed 42
- `trained_state_indices`: 1.309 state yang pernah dikunjungi saat training

## Cara memperbarui model
1. Latih ulang di Colab → ekspor dengan `joblib.dump(...)` / `pickle.dump(...)`.
2. Timpa file di `backend/app/models/` (nama file harus sama).
3. Restart backend (`docker compose restart backend`) karena model disimpan di memori (cache).
