# Training Helper Scripts

Direktori ini digunakan untuk menyimpan modular Python scripts yang dapat dipanggil saat training otomatis atau batch processing data wafer.

## Rencana Modular Scripts:
- `data_loader.py`: Fungsi utilitas untuk memuat dan memvalidasi raw dataset.
- `preprocessor.py`: Skrip pipeline transformasi data dan penskalaan (StandardScaler/MinMaxScaler).
- `evaluate.py`: Fungsi kalkulasi metrik evaluasi klasifikasi (Confusion matrix, ROC-AUC) dan clustering (Silhouette, Davies-Bouldin).
- `export_model.py`: Utilitas pembungkusan dan serialisasi model dengan joblib.
