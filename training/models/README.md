# Model Artifacts & Checkpoints

Direktori ini digunakan untuk menyimpan arsip metadata, log training, ringkasan metrik, atau file checkpoint model hasil training di Google Colab sebelum di-deploy ke backend.

## Artefak Model yang Diharapkan:
1. `classifier.joblib`: Model supervised learning terlatih untuk klasifikasi jenis defect.
2. `scaler.joblib`: Preprocessing transformer terlatih (misalnya `StandardScaler`).
3. `clustering.joblib`: Model unsupervised learning terlatih untuk pengelompokan kondisi wafer.
4. `model_metadata.json`: Catatan parameter hyperparameter, versi scikit-learn, akurasi, dan daftar nama fitur sebenarnya.
