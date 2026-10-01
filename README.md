# WaferSense AI — Wafer Defect Classification

Aplikasi web Machine Learning untuk analisis wafer semikonduktor dengan tiga modul:

| Modul | Metode | Fungsi |
|---|---|---|
| **Classification** | Random Forest (Supervised) | Memprediksi wafer **Normal / Defect** dari 6 sensor |
| **Clustering** | K-Means k=5 (Unsupervised) | Mengelompokkan wafer berdasarkan process step + visualisasi PCA |
| **Control Optimization** | Q-Learning (Reinforcement Learning) | Merekomendasikan action: Turunkan / Pertahankan / Naikkan parameter |

Model dilatih di **Google Colab**, lalu file model (`.joblib` / `.pkl`) dipakai backend untuk prediksi.

---

## Teknologi
- **Frontend:** HTML, Tailwind CSS, JavaScript, Chart.js
- **Backend:** Python Flask, scikit-learn, pandas, NumPy
- **Database:** PostgreSQL + SQLAlchemy (menyimpan riwayat prediksi)
- **Deploy:** Docker Compose, ngrok

## Arsitektur
```
Browser ──► Frontend (nginx :8090) ──► /api ──► Backend Flask (:5000) ──► PostgreSQL (:5432)
                                                     └── file model di backend/app/models/
```

## Struktur Folder
```
backend/        API Flask (routes/, services/, models/ berisi file model)
backend/docs/   Dokumentasi backend per file & per fungsi
frontend/       Halaman web (HTML, js/, css/) + Dockerfile & nginx.conf
docker-compose.yml
```

---

## Menjalankan

### Dengan Docker (disarankan)
```bash
docker compose up -d --build
```
- Web: http://localhost:8090
- API: http://localhost:5000/api/health

Hentikan: `docker compose down`

### Tanpa Docker
```bash
# Backend
cd backend
pip install -r requirements.txt
python -m flask --app app.main:app run --port 5000

# Frontend (terminal lain)
cd frontend
python -m http.server 8000
```
Buka http://localhost:8000

### Akses dari internet (ngrok)
```bash
docker compose up -d
ngrok http 8090
```
Bagikan link `https://....ngrok-free.dev` yang muncul.

---

## Endpoint Utama
| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/health` | Cek server |
| POST | `/api/classification/predict` | Prediksi defect |
| POST | `/api/clustering/predict` | Tentukan cluster |
| GET | `/api/clustering/metrics` | Metrik & persen varians PCA |
| POST | `/api/control-optimization/recommend` | Rekomendasi action Q-Learning |
| POST | `/api/control-optimization/simulate-step` | Simulasi 1 langkah |
| POST | `/api/control-optimization/simulate-episodes` | Simulasi 10 episode |
| GET | `/api/predictions` | Riwayat prediksi dari database |

Penjelasan lengkap tiap fungsi: [`backend/docs/README.md`](backend/docs/README.md)

---

## Alur Git
- Setiap anggota bekerja di branch masing-masing, lalu Pull Request ke `main`.
- Format commit: `[TIPE] Deskripsi` — tipe: `FEAT`, `FIX`, `REFACTOR`, `STYLE`, `TEST`, `DOCS`, `CHORE`.

## Tim
| Nama | Peran |
|---|---|
| Gibral | Project Lead & Backend |
| Hassyfa | Frontend |
| Vyasa | ML Engineer 1 |
| Naila M | ML Engineer 2 |
| Nur Sabrina | ML Engineer 3 |
