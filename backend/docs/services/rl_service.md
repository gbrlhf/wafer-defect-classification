# `app/services/rl_service.py` — Logika Control Optimization (Reinforcement Learning, Q-Learning)

Memakai **Q-table** hasil training di Colab untuk merekomendasikan action (Turunkan / Pertahankan /
Naikkan parameter) dan mensimulasikan akibatnya. **Tidak ada training dan Q-table tidak pernah diubah** di sini.

## Istilah singkat
| Istilah | Di sini |
|---|---|
| State | kombinasi "bin" 6 sensor → 10×5×5×5×5×5 = **31.250 state** |
| Action | 0 Turunkan, 1 Pertahankan, 2 Naikkan (temp, pressure, gas flow sekaligus) |
| Q-table | tabel 31.250 × 3; Q(s, a) = perkiraan total reward ke depan |
| Reward | `10 − 2 × Σ((x − target)/scale)²` untuk temp, pressure, gas flow; minimum −100 |
| Policy greedy | pilih action dengan Q terbesar |

## Konstanta — baris 9-19
- `FEATURE_KEYS`: urutan 6 fitur state (`temperature_c`, `pressure_torr`, `gas_flow_sccm`, `etch_rate_nm_min`, `voltage_v`, `current_ma`).
- `FEATURE_ALIASES`: nama lain yang diterima (mis. `wafer_temp`, `chamber_pressure`).
- `ACTION_NAMES_FALLBACK`: nama action cadangan jika tidak ada di metadata.

---

## `_rl_ctx()` — baris 39-87  (persiapan, dipanggil semua fungsi lain)
- Mengambil metadata + Q-table dari `model_service`, lalu menghitung sekali dan menyimpan (cache) semua yang dibutuhkan:
  batas bawah/atas state, lebar bin, `strides` (untuk menghitung nomor state), target & skala reward, step & noise transisi,
  rata-rata/std dataset (nilai default input), nama action, panjang episode (20), dan **daftar state terlatih** (`trained_state_indices`).
- **Semua angka berasal dari metadata**, tidak ada angka reward/step yang ditulis di kode.
- Artifact tidak ada → `None` (pemanggil membalas `pending_model`).

## `_parse_features(ctx, sensor_inputs)` — baris 89-103  ⟵ **membaca data dari frontend**
- Ambil 6 nilai sensor dari JSON frontend (memakai `FEATURE_ALIASES`). Field yang tidak dikirim → diisi **rata-rata dataset**.
- Bukan angka → `ValueError` (route → HTTP 400).
- Nilai di luar batas state **di-clip** (dipotong ke batas) dan nama fiturnya dicatat di `out_of_range_features`.

## `_bins(ctx, x)` — baris 105-107
Mengubah nilai kontinu menjadi nomor bin per fitur. Contoh temperature: batas 300-600 dibagi 10 bin → lebar 30;
450 °C → bin 5.

## `_lookup(ctx, x)` — baris 109-129
- Hitung nomor state: `state = Σ bin_i × stride_i` (konversi koordinat bin → satu angka, *row-major*).
- **State terlatih** → status `MATCH`, Q dari state itu, action = argmax Q.
- **State belum terlatih** → status `UNTRAINED`: cari state terlatih **terdekat** (jarak Manhattan antar-bin),
  pakai Q dan action dari state itu, laporkan `distance`.

## `evaluate_policy(sensor_inputs)` — baris 131-173  ⟵ **dipakai `/recommend`**
- **Dipanggil oleh:** `routes/control.py` `get_recommendation()`, dan di dalam `simulate_step()`.
- **Langkah:** `_rl_ctx` → `_parse_features` → `_lookup` → susun respons.
- **Output:** `state_index`, `matched_state`, `match_distance`, `bin_coordinates`, `q_table_match_status`
  (`MATCH` / `UNTRAINED`), `q_table_match_label` ("Q-Table Match" / "Untrained State"), `action_id`, `action_name`,
  `q_value`, `q_values`, `rationale`, `out_of_range_features`, `inputs_received`.
- Error → `status: "error"` (route → HTTP 400).
- **Contoh:** input default (450, 760, 120, 95, 5.0, 20) → state **17156**, MATCH, **Pertahankan**.

## `calculate_reward(features)` — baris 175-184
- `dev = (x − target) / scale` untuk temp, pressure, gas flow → `reward = 10 − 2 × Σ dev²`, dibatasi minimal `floor` (−100).
- Target = rata-rata wafer **normal** dari dataset (≈ 450 °C, 760 Torr, 120 sccm); scale = standar deviasinya.
- Tepat di target → +10; makin jauh → makin negatif.

## `_transition(ctx, x, action_id, rng)` — baris 186-191
"Lingkungan" simulasi: action 0/1/2 dikali −1/0/+1, lalu temp, pressure, gas flow digeser sebesar `step`
(± ½ standar deviasi) **ditambah noise acak kecil** (5% std). Hasil di-clip ke batas state. Etch rate, voltage, current tidak berubah.

## `simulate_step(sensor_inputs, action_id=None)` — baris 193-226  ⟵ **dipakai `/simulate-step`**
- **Dipanggil oleh:** `routes/control.py` `simulate_step()`; tombol *Simulate Process Control* di frontend.
- **Langkah:**
  1. `action_id` di luar 0/1/2 → error.
  2. `evaluate_policy()` untuk state saat ini; jika `action_id` tidak dikirim, pakai action terbaik.
  3. `_transition()` → state berikutnya.
  4. `calculate_reward()` pada state berikutnya; `evaluate_policy()` untuk nomor state berikutnya.
- **Output:** `current_state`, `selected_action` (Q dari action yang benar-benar dijalankan), `next_state.features`, `reward`, `evaluation`, status match.

## `simulate_episodes(sensor_inputs, n_episodes=10)` — baris 228-270  ⟵ **dipakai `/simulate-episodes`**
- **Dipanggil oleh:** `routes/control.py` `simulate_episodes()`; tombol *Run 10 Episodes*.
- **Langkah:**
  1. Episode 1 mulai dari input pengguna; episode 2..N mulai dari input + gangguan acak (±1,5 std) — supaya mirip kondisi training.
  2. Tiap episode **20 langkah**: `_lookup` → action greedy → `_transition` → tambah reward.
  3. Reward episode = **jumlah** reward 20 langkah (kira-kira −2000 s/d +200).
- **Output:** `episode_rewards` (grafik di frontend), `episodes`, `total_episodes`, `num_episodes`, `steps_per_episode`,
  `final_reward`, `average_reward`, `untrained_step_ratio` (porsi langkah yang memakai state terdekat), `mode: "evaluation"`.
- **Ini evaluasi, bukan training** — tidak ada epsilon, tidak ada update Q.

## `get_info()` — baris 272-297  ⟵ **dipakai `/info`**
Ringkasan: ukuran Q-table, jumlah state (31.250), state terlatih (1.309), jumlah nilai Q non-nol, nama action & fitur, batas state, n_bins, panjang episode.

## `rl_service = RLControlService()` — baris 300
Objek tunggal yang di-import route.

## Pertanyaan yang mungkin muncul
- **Kenapa banyak state belum terlatih?** Agen hanya pernah mengunjungi 1.309 state selama 30.000 episode training,
  karena data nyata berkumpul di sekitar kondisi normal. Backend menandainya dengan jujur ("Untrained State") dan memakai state terdekat.
- **Apa bedanya Q-value dan reward?** Reward = nilai langsung satu langkah; Q-value = perkiraan total reward ke depan (dengan diskon γ = 0.9).
- **Kenapa reward episode bisa sangat negatif?** Jika mulai jauh dari target, setiap langkah bernilai negatif (sampai −100), dijumlah 20 langkah.
- **Parameter training?** 30.000 episode, 20 langkah, α = 0.1, γ = 0.9, ε-greedy 1.0 → 0.05, seed 42 (tersimpan di metadata).
