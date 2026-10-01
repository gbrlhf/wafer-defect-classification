# Notebooks Panduan (Google Colab)

Direktori ini dirancang untuk menyimpan notebook Google Colab / Jupyter yang digunakan oleh tim Machine Learning.

## Rencana Notebook
1. `01_eda_and_cleaning.ipynb`:
   - Eksplorasi awal dataset semiconductor wafer.
   - Pengecekan distribusi kelas dan visualisasi pola defect.
   - Penanganan missing values dan outler.
2. `02_classification_training.ipynb`:
   - Eksperimen model supervised learning (e.g. Random Forest, SVM, dll).
   - Validasi silang (cross-validation) dan evaluasi metrik (F1, Precision, Recall).
   - Ekspor model classifier dan scaler ke format `.joblib`.
3. `03_clustering_training.ipynb`:
   - Eksperimen unsupervised learning (e.g. K-Means, DBSCAN).
   - Analisis inertia, elbow curve, dan silhouette score.
   - Ekspor model clustering ke format `.joblib`.

## Cara Menjalankan di Google Colab
1. Upload notebook ke Google Drive atau buka langsung dari repository GitHub via Google Colab.
2. Pastikan runtime menggunakan Python 3 dengan GPU/CPU standar.
3. Install pustaka yang relevan jika belum tersedia di Colab:
   ```bash
   !pip install scikit-learn pandas numpy matplotlib seaborn joblib
   ```
4. Jalankan notebook dari atas ke bawah secara berurutan.
5. Download file `.joblib` hasil export dan letakkan di `backend/app/models/`.
