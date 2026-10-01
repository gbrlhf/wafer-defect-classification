# Panduan Demo Lokal

## Persiapan
Jalankan dari folder utama repository menggunakan CMD Windows.

```bat
.venv\Scripts\activate
python -m pip install -r backend\requirements.txt
python -m pip install scikit-learn==1.9.0
```

Jika `.venv` belum ada, buat dengan `python -m venv .venv`.

## Backend dengan SQLite
Untuk setup pertama, salin `backend/.env.example` menjadi
`backend/.env` dan sesuaikan konfigurasi lokal.

Jika container `wafer-defect-backend` sedang memakai port 5000,
hentikan container tersebut sebelum menjalankan Flask lokal.

```bat
cd backend
set DATABASE_URL=sqlite:///wafer_defect.db
python -m alembic upgrade head
python -m flask --app app.main:app run --host 127.0.0.1 --port 5000 --debug
```

## Frontend
Buka terminal baru di folder utama repository.

```bat
python -m http.server 8081 --bind 127.0.0.1 --directory frontend
```

Buka http://127.0.0.1:8081/clustering.html.
Frontend menggunakan API http://localhost:5000.

## Pemeriksaan Demo
1. Buka http://localhost:5000/api/health/database.
   Pastikan status koneksi database berhasil.
2. Jalankan prediksi melalui halaman clustering.
   Pastikan hasil cluster muncul tanpa error penyimpanan.
3. Periksa riwayat melalui /api/clustering/history.

## Arti Hasil
Pipeline menerima enam sensor dan process_step.
Preprocessing menghasilkan 11 fitur, lalu K-Means menentukan
salah satu dari lima cluster.

Nomor cluster bukan tingkat cacat. Profil training menunjukkan:
0 = Lithography, 1 = Etching, 2 = CMP,
3 = Deposition, dan 4 = Oxidation.

Persentase anggota cluster merupakan distribusi data training,
bukan probabilitas prediksi. Jarak ke centroid bukan diagnosis
wafer cacat atau kerusakan mesin.