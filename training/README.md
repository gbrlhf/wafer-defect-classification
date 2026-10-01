# Machine Learning Training Pipeline (Google Colab)

Direktori ini berisi seluruh artefak, notebook, dan panduan untuk proses eksplorasi data, rekayasa fitur, pemodelan, evaluasi, dan ekspor model. Seluruh pelatihan model dilakukan di **Google Colab** untuk memanfaatkan akselerasi komputasi dan menghindari beban komputasi di container backend/frontend.

---

## Tahapan Pipeline Machine Learning

```text
Dataset (Kaggle)
    ↓
1. Exploratory Data Analysis (EDA)
    ├── Identifikasi tipe data & dimensi
    ├── Pengecekan missing values & duplicate data
    ├── Distribusi label target & skewness fitur
    └── Analisis korelasi antar fitur
    ↓
2. Data Cleaning & Preprocessing
    ├── Imputasi missing values (jika ada)
    ├── Penanganan outlier
    └── Penskalaan fitur (StandardScaler / MinMaxScaler)
    ↓
3. Feature Engineering & Selection
    ├── Seleksi fitur relevan (Variance threshold / Feature importance)
    └── Dimensi reduksi (PCA) jika dimensi tinggi
    ↓
4. Supervised Learning (Classification)
    ├── Train / Test Split (Stratified split)
    ├── Evaluasi kandidat model (Random Forest, SVM, LightGBM/XGBoost, Logistic Regression)
    ├── Hyperparameter Tuning (GridSearchCV / RandomizedSearchCV)
    └── Evaluasi metrik (Accuracy, Precision, Recall, F1-Score, Confusion Matrix)
    ↓
5. Unsupervised Learning (Clustering)
    ├── Analisis Elbow Method & Silhouette Score
    ├── Evaluasi algoritma (K-Means, DBSCAN, atau Hierarchical Clustering)
    └── Karakterisasi profil masing-masing kluster wafer
    ↓
6. Model Serialization & Export (.joblib)
    ├── classifier.joblib  (Model klasifikasi terbaik)
    ├── scaler.joblib      (Objek scaler preprocessing)
    └── clustering.joblib  (Model clustering terbaik)
    ↓
Deployment ke backend/app/models/
```

---

## Struktur Direktori
- `notebooks/`: Berisi Jupyter Notebook (`.ipynb`) yang dieksekusi di Google Colab.
- `scripts/`: Berisi script Python bantuan untuk reproduktibilitas training lokal/Colab.
- `models/`: Dokumentasi dan checkpoint metrik model hasil training.

---

## Aturan Pelatihan
1. **Dilarang hardcode prediksi atau membuat model dummy.**
2. **Nama fitur dan label target harus berasal langsung dari dataset yang valid.**
3. Semua model yang akan digunakan di backend harus diekspor menggunakan `joblib.dump(model, 'filename.joblib')` dengan versi library yang kompatibel dengan backend `requirements.txt`.
