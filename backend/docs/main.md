# `app/main.py` — Pintu masuk aplikasi

File ini **membuat aplikasi Flask** dan menyambungkan semua bagian: konfigurasi CORS,
penutupan sesi database, dan pendaftaran semua route.

## Isi dari atas ke bawah

| Baris | Kode | Penjelasan |
|---|---|---|
| 4-12 | `import ...` | Mengambil `settings`, `SessionLocal`, dan semua `router` (Blueprint) dari folder `routes/` |
| 16 | `app = Flask(__name__)` | Membuat objek aplikasi Flask |
| 17-18 | `app.config[...]` | Nama & versi API (ditampilkan di endpoint `/`) |
| 21-24 | `CORS(...)` | **CORS** = izin agar halaman frontend (beda port, mis. 8080) boleh memanggil API. Origin yang diizinkan dibaca dari `ALLOWED_ORIGINS` |
| 35-43 | `app.register_blueprint(...)` | Mendaftarkan semua route. Baris 39 membuat alias `/api/models/...` untuk route model |
| 65-70 | `if __name__ == "__main__"` | Dipakai hanya kalau file dijalankan langsung (`python app/main.py`) |

---

## `shutdown_session(exception=None)` — baris 28-31
- **Tugas:** menutup sesi database setelah setiap request selesai, supaya koneksi tidak bocor.
- **Dipanggil oleh:** Flask otomatis (dekorator `@app.teardown_appcontext`), bukan oleh frontend.
- **Langkah:** jika `SessionLocal` ada → `SessionLocal.remove()`.

## `root()` — baris 46-62
- **Endpoint:** `GET /`
- **Tugas:** menampilkan nama API, versi, dan daftar endpoint utama.
- **Dipanggil oleh:** tidak ada di frontend; dipakai untuk cek manual di browser & di unit test.
- **Output:** `{"message": "...", "version": "1.0.0", "endpoints": {...}}` (HTTP 200).

---

## Pertanyaan yang mungkin muncul
- **Apa itu Blueprint?** Cara Flask memecah route ke beberapa file. Setiap file di `routes/`
  membuat satu Blueprint dengan awalan URL sendiri (mis. `/api/classification`), lalu
  didaftarkan di sini.
- **Server dijalankan pakai apa?** Di Docker: `python -m flask --app app.main:app run --host 0.0.0.0 --port 5000`
  (lihat `backend/Dockerfile`).
