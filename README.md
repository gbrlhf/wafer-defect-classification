# Wafer Defect Classification System

Web-based Machine Learning system for semiconductor wafer defect classification and clustering analysis.

---

## Description

**Wafer Defect Classification System** adalah aplikasi Machine Learning terintegrasi berbasis web yang dirancang untuk mendeteksi, mengklasifikasikan, dan menganalisis pola cacat (defect) pada semiconductor wafer. Sistem ini menggabungkan dua paradigma Machine Learning:
1. **Supervised Learning (Classification):** Mengidentifikasi jenis atau status defect wafer berdasarkan fitur-fitur fisik dan elektrikal.
2. **Unsupervised Learning (Clustering):** Mengelompokkan karakteristik wafer ke dalam kluster tertentu guna menemukan pola tersembunyi tanpa label sebelumnya.

Seluruh proses training, exploratory data analysis (EDA), dan validasi model dilakukan secara terpisah di **Google Colab**. Model hasil pelatihan diekspor dalam format `.joblib` untuk kemudian di-load oleh **FastAPI Backend** sebagai inference engine berkecepatan tinggi. **Frontend** menyajikan antarmuka modern, interaktif, dan informatif menggunakan HTML5, Bootstrap 5, Vanilla JavaScript, serta Chart.js.

---

## Features

- **Dashboard Real-time:** Ringkasan status sistem, kesehatan koneksi API, dan informasi ringkas dataset & model.
- **Defect Classification:** Form input interaktif untuk mengirimkan data fitur wafer ke API dan menampilkan hasil prediksi serta probabilitas/confidence level.
- **Wafer Clustering:** Analisis pola data wafer ke dalam kelompok cluster karakteristik defect dan visualisasi Chart.js.
- **Dataset Explorer:** Eksplorasi karakteristik dataset, jumlah sampel, dimensi fitur, dan distribusi target.
- **RESTful API:** Arsitektur modular FastAPI yang cepat, terdokumentasi otomatis dengan Swagger UI dan ReDoc.
- **Containerized Deployment:** Konfigurasi Docker & Docker Compose siap pakai untuk frontend (Nginx) dan backend (Python Uvicorn).

---

## Technology Stack

### Frontend
- **Markup & Layout:** HTML5, CSS3, Bootstrap 5.3
- **Icons:** Bootstrap Icons
- **Scripting:** Vanilla JavaScript (ES6+ Fetch API)
- **Data Visualization:** Chart.js
- **Web Server:** Nginx (Alpine)

### Backend ML API & Database
- **Framework:** FastAPI
- **Database:** PostgreSQL 16
- **ORM:** SQLAlchemy 2.0
- **Database Migrations:** Alembic
- **Database Driver:** `psycopg2-binary`
- **ASGI Server:** Uvicorn
- **Data Validation & Schemas:** Pydantic
- **ML Runtime & Data Processing:** Scikit-learn, Pandas, NumPy, Joblib

### Machine Learning Environment
- **Platform:** Google Colab
- **Libraries:** Scikit-learn, Pandas, NumPy, Matplotlib, Seaborn, Joblib
- **Model Serialization:** `.joblib`

### DevOps & Tools
- **Containerization:** Docker, Docker Compose
- **Version Control:** Git & GitHub

---

## System Architecture

```text
User / Engineer
       │
       ▼
Browser Interface
(Bootstrap 5 + Vanilla JS + Chart.js)
       │
       │ HTTP / REST (Fetch API)
       ▼
Frontend Container (Nginx :8080)
       │
       │ HTTP / REST (Fetch API)
       ▼
Backend Container (FastAPI :8001)
       │
       ├── CORS Middleware & Request Validation (Pydantic)
       ├── Model Service (Cached In-Memory Loader)
       │
       ├──► Trained Models (backend/app/models/*.joblib)
       │      ├── classifier.joblib  (Supervised)
       │      ├── scaler.joblib      (Preprocessing)
       │      └── clustering.joblib  (Unsupervised)
       │
       └──► PostgreSQL Container (wafer-postgres :5432)
              ├── predictions   (Inference history & confidence)
              └── model_metrics (Model evaluation & performance)
       │
       ▼
FastAPI JSON Response
       │
       ▼
Frontend Dynamic Rendering & Chart.js Visualizations
```

---

## Machine Learning Workflow

Proses machine learning dijalankan secara terpisah menggunakan **Google Colab**:

```text
Semiconductor Wafer Dataset (Kaggle)
                ↓
    Exploratory Data Analysis (EDA)
                ↓
           Data Cleaning
                ↓
       Data Preprocessing
                ↓
       Feature Engineering
                ↓
       Train / Test Split
        ├── Supervised Learning (Classification Models & Hyperparameter Tuning)
        └── Unsupervised Learning (Clustering Algorithms & Silhouette Evaluation)
                ↓
       Evaluasi Performa Model
                ↓
       Ekspor Serialized Model:
        - classifier.joblib
        - scaler.joblib
        - clustering.joblib
                ↓
    Deploy ke backend/app/models/
```

> **Catatan Penting:** Model dummy tidak digunakan. Fitur dan target tidak dikarang sebelum EDA dan eksperimen training pada Google Colab selesai.

---

## Project Structure

```text
wafer-defect-classification/
│
├── frontend/                     # Static Web Application
│   ├── index.html                # Dashboard Home
│   ├── classification.html       # Supervised Defect Classification
│   ├── clustering.html           # Unsupervised Wafer Clustering
│   ├── dataset.html              # Dataset Exploration & Stats
│   ├── about.html                # Project, Stack, & Team Info
│   ├── css/
│   │   └── style.css             # Industrial + AI Custom Styling
│   ├── js/
│   │   ├── api.js                # Central API Base Configuration & Helpers
│   │   ├── dashboard.js          # Home Dashboard Logic & Live Health Check
│   │   ├── classification.js     # Classification Form & Prediction Handling
│   │   ├── clustering.js         # Clustering Form & Cluster Visualizations
│   │   └── dataset.js            # Dataset Metadata Fetching & Rendering
│   ├── assets/
│   │   └── .gitkeep
│   ├── Dockerfile                # Nginx Alpine Container for Frontend
│   └── nginx.conf                # Nginx Server Configuration
│
├── backend/                      # FastAPI ML Inference Engine
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI App & Router Setup
│   │   ├── routes/               # API Route Handlers
│   │   │   ├── __init__.py
│   │   │   ├── health.py         # GET /api/health
│   │   │   ├── classification.py # POST /api/classification/predict
│   │   │   ├── clustering.py     # POST /api/clustering/predict
│   │   │   ├── dataset.py        # GET /api/dataset/info
│   │   │   └── model.py          # GET /api/model/metrics
│   │   ├── schemas/              # Pydantic Schemas
│   │   │   ├── __init__.py
│   │   │   ├── classification.py
│   │   │   ├── clustering.py
│   │   │   └── common.py
│   │   ├── services/             # Business Logic & Model Inference
│   │   │   ├── __init__.py
│   │   │   ├── classification_service.py
│   │   │   ├── clustering_service.py
│   │   │   └── model_service.py  # Safe .joblib Loader & Cache
│   │   └── models/               # Directory for exported .joblib models
│   │       └── .gitkeep
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_health.py
│   │   └── .gitkeep
│   ├── requirements.txt          # Python Dependencies
│   ├── Dockerfile                # Python 3.11-slim Container
│   ├── .dockerignore
│   ├── .env.example
│   └── README.md
│
├── training/                     # Machine Learning Pipeline in Google Colab
│   ├── notebooks/                # Jupyter / Colab Notebooks
│   │   └── README.md
│   ├── scripts/                  # Preprocessing & Training Utilities
│   │   └── README.md
│   ├── models/                   # Exported Model Checkpoints & Metrics
│   │   └── README.md
│   └── README.md                 # Complete Training Documentation
│
├── data/                         # Dataset Documentation & Placeholder
│   ├── README.md
│   └── .gitkeep
│
├── docs/                         # Project Documentation
│   └── .gitkeep
│
├── tests/                        # System-wide Integration Tests
│   └── .gitkeep
│
├── docker-compose.yml            # Multi-container Compose Specification
├── .gitignore                    # Git Ignore Configuration
└── README.md                     # Root Documentation
```

---

## Installation

### Prerequisites
- Python 3.10+ (atau gunakan Docker)
- Web Browser modern (Chrome, Edge, Firefox)

### Manual Local Setup (Without Docker)

#### 1. Backend Setup
```bash
# Pindah ke direktori backend
cd backend

# Buat virtual environment
python -m venv venv

# Aktivasi virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependensi
pip install -r requirements.txt

# Salin konfigurasi environment
copy .env.example .env

# Jalankan FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
FastAPI akan berjalan pada `http://localhost:8001`.

#### 2. Frontend Setup
Buka browser dan buka file `frontend/index.html` secara langsung, atau jalankan local HTTP server:
```bash
cd frontend
python -m http.server 8080
```
Frontend akan dapat diakses pada `http://localhost:8080`.

---

## Running with Docker

Menjalankan seluruh sistem secara konsisten menggunakan Docker Compose:

```bash
# Build dan jalankan seluruh container
docker compose up --build
```

Untuk menjalankan di background (detached mode):
```bash
docker compose up --build -d
```

Untuk menghentikan container:
```bash
docker compose down
```

### URLs Saat Berjalan:
- **Frontend Web UI:** [http://localhost:8080](http://localhost:8080)
- **Backend API Root:** [http://localhost:8001](http://localhost:8001)
- **API Health Check:** [http://localhost:8001/api/health](http://localhost:8001/api/health)
- **FastAPI Interactive Docs (Swagger):** [http://localhost:8001/docs](http://localhost:8001/docs)
- **FastAPI ReDoc Documentation:** [http://localhost:8001/redoc](http://localhost:8001/redoc)

---

## API Documentation

| Method | Endpoint | Description | Status |
|---|---|---|---|
| `GET` | `/api/health` | Service health check | Active |
| `GET` | `/api/dataset/info` | Dataset metadata & feature list | Pending EDA |
| `GET` | `/api/model/metrics` | Model evaluation metrics | Pending Training |
| `POST` | `/api/classification/predict` | Supervised defect prediction | Pending Model |
| `POST` | `/api/clustering/predict` | Unsupervised cluster assignment | Pending Model |

---

## Git Workflow

Pengembangan dilakukan secara kolaboratif menggunakan Git dan GitHub:

1. **Branch Utama:** `main` (Protected, hanya menerima perubahan via Pull Request).
2. **Branch Anggota:** Setiap anggota memiliki branch dengan nama masing-masing.

### Daily Routine Anggota
```bash
# 1. Update branch main lokal
git checkout main
git fetch origin
git pull origin main

# 2. Pindah ke branch pribadi dan sinkronkan dengan main
git checkout [Nama]
git fetch origin
git merge origin/main

# 3. Lakukan pekerjaan, simpan perubahan
git status
git add .
git commit -m "[TIPE] Deskripsi perubahan yang jelas"

# 4. Sinkronkan kembali sebelum push
git fetch origin
git merge origin/main
git push origin [Nama]

# 5. Buat Pull Request (PR) di GitHub: [Nama] → main
```

### Commit Convention
Format penamaan commit:
```text
[TIPE] Deskripsi
```

Prefix tipe:
- `[FEAT]`: Fitur baru
- `[FIX]`: Perbaikan bug
- `[REFACTOR]`: Refactoring kode
- `[STYLE]`: Perubahan styling/UI
- `[TEST]`: Penambahan atau perbaikan testing
- `[DOCS]`: Pembaruan dokumentasi
- `[CHORE]`: Konfigurasi dependensi atau environment

> **Ketentuan:** Setiap anggota tim wajib melakukan minimal **3 commit per hari**.

---

## Team Members

| No | Nama | Role | Branch |
|:---:|---|---|---|
| 1 | **Gibral** | Project Lead & Fullstack Developer | `Gibral` |
| 2 | **Nama Anggota 2** | Machine Learning Engineer | `Nama2` |
| 3 | **Nama Anggota 3** | Data Analyst & EDA Specialist | `Nama3` |
| 4 | **Nama Anggota 4** | Backend API Developer | `Nama4` |
| 5 | **Nama Anggota 5** | Frontend & Visualization Developer | `Nama5` |

---

## Project Screenshots

*(Tangkapan layar UI Dashboard, Halaman Klasifikasi, Clustering, dan Swagger API docs akan ditambahkan di sini)*
=======
# Wafer Defect Classification
Proyek kelompok Machine Learning untuk klasifikasi defect dan clustering wafer.
>>>>>>> 8b1b0e6d28a3f6b643bac00bbb65d43872047d0c
