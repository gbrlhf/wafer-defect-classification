# `app/routes/control.py` — Endpoint Control Optimization (Q-Learning)

Blueprint `control_optimization`, awalan URL `/api/control-optimization` (baris 4).
Semua endpoint POST menerima body `{"sensor_inputs": {...}}` (atau field sensor langsung di body).

Key sensor yang dikirim frontend (`getSensorInputs()`, `js/control-optimization.js:145`):
```json
{"temperature_c": 450, "pressure_torr": 760, "gas_flow_sccm": 120,
 "etch_rate_nm_min": 95, "voltage_v": 5.0, "current_ma": 20}
```

## Konstanta & helper
- `MAX_EPISODES = 100` (baris 6): batas jumlah episode per request.
- `_bad_request(message)` (baris 9-10): membuat respons `{"status": "error", "message": ...}` dengan HTTP **400**.

## `get_recommendation()` — baris 13-21  ⟵ **menerima data dari frontend**
- **Endpoint:** `POST /api/control-optimization/recommend`
- **Dipanggil oleh:** `updateRecommendation()` (`js/control-optimization.js:370`) — saat halaman dibuka,
  setiap slider digeser (ditunda 300 ms), dan saat Reset. Hasilnya tampil sebagai baris
  "Rekomendasi action: ... (Q-Table Match / Untrained State)".
- **Langkah:** ambil `sensor_inputs` → `rl_service.evaluate_policy()` (baris 20) → status `error` jadi HTTP 400, lainnya 200.
- **Output penting:** `action_id`, `action_name`, `state_index`, `q_table_match_status` (`MATCH`/`UNTRAINED`),
  `q_table_match_label`, `match_distance`, `q_values`, `out_of_range_features`.

## `simulate_step()` — baris 24-42  ⟵ **menerima data dari frontend**
- **Endpoint:** `POST /api/control-optimization/simulate-step`
- **Dipanggil oleh:** `simulateSingleStep()` (`js/control-optimization.js:199`) — tombol *Simulate Process Control*.
- **Input tambahan opsional:** `action_id` (0/1/2). Kalau tidak dikirim, dipakai action terbaik dari Q-table.
- **Validasi `action_id`** (baris 31-40): boolean, list, `1.5`, `"x"`, `5`, `-1` → HTTP **400**;
  angka string seperti `"2"` diterima.
- **Langkah:** validasi → `rl_service.simulate_step()` (baris 41) → JSON.
- **Output:** `current_state`, `selected_action`, `next_state.features` (ditampilkan frontend sebagai
  "Next State: °C · Torr · sccm"), `reward`, `evaluation`, `q_table_match_label`.

## `simulate_episodes()` — baris 45-62  ⟵ **menerima data dari frontend**
- **Endpoint:** `POST /api/control-optimization/simulate-episodes`
- **Dipanggil oleh:** `runTenEpisodes()` (`js/control-optimization.js:267`) — tombol *Run 10 Episodes*,
  body `{"sensor_inputs": {...}, "num_episodes": 10}`.
- **Validasi jumlah episode** (baris 52-60): dibaca dari `n_episodes` atau `num_episodes` (default 10);
  bukan angka atau di luar 1-100 → HTTP **400**.
- **Langkah:** → `rl_service.simulate_episodes(sensor_inputs, n_episodes)` (baris 61).
- **Output:** `episode_rewards` (dipakai untuk grafik), `episodes`, `total_episodes`/`num_episodes`,
  `final_reward`, `average_reward`, `steps_per_episode`, `untrained_step_ratio`.

## `get_rl_info()` — baris 65-71
- **Endpoint:** `GET /api/control-optimization/info`
- **Dipanggil oleh:** `ApiClient.getControlInfo()` (`js/api.js:217`) — belum dipakai halaman.
- **Output:** ukuran Q-table (31250×3), jumlah state terlatih (1309), nama fitur, nama action, batas state.

Detail logikanya: [../services/rl_service.md](../services/rl_service.md).
