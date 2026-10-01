import logging
import math
from typing import Dict, Any, List, Optional
import numpy as np
from .model_service import model_service

logger = logging.getLogger(__name__)

FEATURE_KEYS = ["temperature_c", "pressure_torr", "gas_flow_sccm",
                "etch_rate_nm_min", "voltage_v", "current_ma"]
FEATURE_ALIASES = {
    "temperature_c": ["temperature_c", "temperature", "temp", "wafer_temp"],
    "pressure_torr": ["pressure_torr", "pressure", "chamber_pressure"],
    "gas_flow_sccm": ["gas_flow_sccm", "flow", "gas_flow_rate", "gas_flow"],
    "etch_rate_nm_min": ["etch_rate_nm_min", "etch_rate", "rate"],
    "voltage_v": ["voltage_v", "voltage", "rf_voltage"],
    "current_ma": ["current_ma", "current", "plasma_current"],
}
ACTION_NAMES_FALLBACK = ["Turunkan Parameter", "Pertahankan", "Naikkan Parameter"]


class RLControlService:
    """
    Reinforcement Learning Service for In-situ Semiconductor Process Control using Q-Learning.
    Operates on 6 dataset-scale sensor features (temperature_c, pressure_torr, gas_flow_sccm,
    etch_rate_nm_min, voltage_v, current_ma) discretized into 31,250 discrete states (10x5x5x5x5x5)
    and selects discrete actions from 3 choices:
      0: 'Turunkan Parameter'
      1: 'Pertahankan'
      2: 'Naikkan Parameter'
    Reward target/scale, transition step/noise, and trained states are read from metadata v2.
    The Q-table is never updated here (evaluation/simulation only).
    """

    def __init__(self):
        self.model_service = model_service

    # ------------------------------------------------------------------ util
    def _rl_ctx(self) -> Optional[Dict[str, Any]]:
        """Bangun (dan cache) semua konstanta dari metadata + Q-table."""
        metadata = self.model_service.get_rl_metadata()
        qtable = self.model_service.get_rl_qtable()
        if metadata is None or qtable is None:
            return None
        cache = getattr(self, "_rl_cache", None)
        if cache is not None and cache["meta_id"] == id(metadata) and cache["q_id"] == id(qtable):
            return cache

        n_bins = np.array(metadata["n_bins"], dtype=int)
        bounds = metadata["state_bounds"]
        low = np.array([b[0] for b in bounds], dtype=float)
        high = np.array([b[1] for b in bounds], dtype=float)
        strides = np.array([int(np.prod(n_bins[i + 1:])) for i in range(len(n_bins))])
        feat_names = list(metadata.get("feature_names", FEATURE_KEYS))
        rew = metadata["reward"]
        trans = metadata["transition"]

        trained_idx = np.array(metadata.get("trained_state_indices", []), dtype=int)
        if trained_idx.size == 0:  # fallback jika metadata lama tanpa daftar trained state
            trained_idx = np.where(np.any(qtable != 0, axis=1))[0]
        trained_coords = (np.array(np.unravel_index(trained_idx, tuple(n_bins))).T
                          if trained_idx.size else np.zeros((0, len(n_bins)), dtype=int))
        trained_mask = np.zeros(qtable.shape[0], dtype=bool)
        trained_mask[trained_idx] = True

        ctrl = list(metadata.get("controllable_features", feat_names[:3]))
        ctx = {
            "meta_id": id(metadata), "q_id": id(qtable),
            "qtable": qtable, "n_bins": n_bins, "low": low, "high": high,
            "bin_w": (high - low) / n_bins, "strides": strides,
            "n_states": int(np.prod(n_bins)),
            "feat_names": feat_names,
            "ctrl_idx": [feat_names.index(c) for c in ctrl],
            "target": np.array([rew["target"][c] for c in ctrl], dtype=float),
            "scale": np.array([rew["scale"][c] for c in ctrl], dtype=float),
            "floor": float(rew.get("floor", -100.0)),
            "step": np.array([trans["step"][c] for c in ctrl], dtype=float),
            "noise": np.array([trans["noise_std"][c] for c in ctrl], dtype=float),
            "defaults": np.array(metadata["dataset_stats"]["mean"], dtype=float),
            "dstd": np.array(metadata["dataset_stats"]["std"], dtype=float),
            "action_names": list(metadata.get("action_names", ACTION_NAMES_FALLBACK)),
            "episode_len": int(metadata.get("training", {}).get("episode_len", 20)),
            "trained_idx": trained_idx, "trained_coords": trained_coords,
            "trained_mask": trained_mask,
        }
        self._rl_cache = ctx
        return ctx

    def _parse_features(self, ctx, sensor_inputs: Dict[str, Any]):
        """Baca 6 fitur (skala dataset). Default = rata-rata dataset. Nilai di luar bounds di-clip dan dilaporkan."""
        vals = []
        for i, key in enumerate(FEATURE_KEYS):
            v = ctx["defaults"][i]
            for alias in FEATURE_ALIASES[key]:
                if alias in sensor_inputs and sensor_inputs[alias] not in (None, ""):
                    v = float(sensor_inputs[alias])
                    break
            if not math.isfinite(v):
                raise ValueError(f"Nilai {key} tidak valid")
            vals.append(v)
        x = np.array(vals, dtype=float)
        out_of_range = [FEATURE_KEYS[i] for i in range(len(x)) if x[i] < ctx["low"][i] or x[i] > ctx["high"][i]]
        return np.clip(x, ctx["low"], ctx["high"]), out_of_range

    def _bins(self, ctx, x: np.ndarray) -> np.ndarray:
        idx = ((np.clip(x, ctx["low"], ctx["high"]) - ctx["low"]) / ctx["bin_w"]).astype(int)
        return np.minimum(idx, ctx["n_bins"] - 1)

    def _lookup(self, ctx, x: np.ndarray) -> Dict[str, Any]:
        """Status state jujur: MATCH (pernah dilatih) / UNTRAINED (pakai state terlatih terdekat)."""
        coords = self._bins(ctx, x)
        s = int(np.dot(coords, ctx["strides"]))
        if not (0 <= s < ctx["n_states"]):
            return {"status": "INVALID", "state": s, "coords": coords.tolist(), "matched": -1,
                    "distance": None, "q": np.zeros(3), "action": 1}
        if ctx["trained_mask"][s]:
            q = ctx["qtable"][s]
            return {"status": "MATCH", "state": s, "coords": coords.tolist(), "matched": s,
                    "distance": 0, "q": q, "action": int(np.argmax(q))}
        if ctx["trained_idx"].size == 0:
            return {"status": "UNTRAINED", "state": s, "coords": coords.tolist(), "matched": s,
                    "distance": None, "q": np.zeros(3), "action": 1}
        d = np.abs(ctx["trained_coords"] - coords).sum(axis=1)
        j = int(np.argmin(d))
        ms = int(ctx["trained_idx"][j])
        q = ctx["qtable"][ms]
        return {"status": "UNTRAINED", "state": s, "coords": coords.tolist(), "matched": ms,
                "distance": int(d[j]), "q": q, "action": int(np.argmax(q))}

    # --------------------------------------------------------------- policy
    def evaluate_policy(self, sensor_inputs: Dict[str, Any]) -> Dict[str, Any]:
        ctx = self._rl_ctx()
        if ctx is None:
            return {"status": "pending_model", "action_name": "Pertahankan", "action_id": 1,
                    "q_value": 0.0, "q_table_match_status": "UNTRAINED",
                    "q_table_match_label": "Untrained State", "message": "RL Model artifacts missing."}
        try:
            x, out_of_range = self._parse_features(ctx, sensor_inputs)
            lk = self._lookup(ctx, x)
            names = ctx["action_names"]
            a = lk["action"]
            q = [float(v) for v in lk["q"]]
            labels = {"MATCH": "Q-Table Match",
                      "UNTRAINED": "Untrained State",
                      "INVALID": "Invalid State"}
            if lk["status"] == "MATCH":
                rationale = (f"Action dipilih karena memiliki Q-value tertinggi (Q = {q[a]:.2f}) "
                             f"pada state terdiskritisasi saat ini.")
                policy_selection = "Greedy Q-Table Policy"
            else:
                rationale = (f"State saat ini belum pernah dilatih. Rekomendasi memakai state terlatih terdekat "
                             f"(jarak {lk['distance']} bin) dengan Q-value tertinggi (Q = {q[a]:.2f}).")
                policy_selection = "Greedy (nearest trained state)"
            return {
                "status": "success", "algorithm": "Q-Learning",
                "state_index": lk["state"], "matched_state": lk["matched"],
                "match_distance": lk["distance"], "bin_coordinates": lk["coords"],
                "q_table_match_status": lk["status"], "q_table_match_label": labels[lk["status"]],
                "action_id": a, "selected_action": names[a], "action_name": names[a],
                "action_title": f"Selected Action: {names[a]}",
                "q_value": round(q[a], 2),
                "q_values": {names[i]: round(q[i], 2) for i in range(len(names))},
                "policy_selection": policy_selection, "rationale": rationale,
                "estimated_etch_rate": round(float(x[3]), 2),
                "out_of_range_features": out_of_range,
                "inputs_received": {k: round(float(x[i]), 3) for i, k in enumerate(FEATURE_KEYS)},
            }
        except Exception as e:  # noqa: BLE001
            logger.error(f"Error evaluating Q-learning policy: {e}", exc_info=True)
            return {"status": "error", "selected_action": "Pertahankan", "action_id": 1, "q_value": 0.0,
                    "q_table_match_status": "INVALID", "q_table_match_label": "Invalid State",
                    "message": f"Q-Learning inference error: {e}"}

    # --------------------------------------------------------------- reward
    def calculate_reward(self, features: Dict[str, float]) -> float:
        """10 - 2 * sum(((x - target) / scale)^2) pada parameter yang dikontrol. Target/skala dari metadata."""
        ctx = self._rl_ctx()
        if ctx is None:
            raise RuntimeError("RL artifacts missing")
        x = np.array([float(features[k]) for k in FEATURE_KEYS], dtype=float)
        dev = (x[ctx["ctrl_idx"]] - ctx["target"]) / ctx["scale"]
        r = 10.0 - 2.0 * float(np.sum(dev ** 2))
        return round(max(ctx["floor"], r), 2)

    # ----------------------------------------------------------- transition
    def _transition(self, ctx, x: np.ndarray, action_id: int, rng) -> np.ndarray:
        mult = (-1.0, 0.0, 1.0)[action_id]
        nx = x.copy()
        for k, i in enumerate(ctx["ctrl_idx"]):
            nx[i] += mult * ctx["step"][k] + rng.normal(0.0, ctx["noise"][k])
        return np.clip(nx, ctx["low"], ctx["high"])

    def simulate_step(self, sensor_inputs: Dict[str, Any], action_id: Optional[int] = None,
                      rng: Optional[np.random.Generator] = None) -> Dict[str, Any]:
        ctx = self._rl_ctx()
        if ctx is None:
            return {"status": "pending_model", "message": "RL Model artifacts missing."}
        if action_id is not None and action_id not in (0, 1, 2):
            return {"status": "error", "message": f"action_id tidak valid: {action_id} (harus 0, 1, atau 2)"}
        policy = self.evaluate_policy(sensor_inputs)
        if policy.get("status") != "success":
            return policy
        rng = rng or np.random.default_rng()
        names = ctx["action_names"]
        if action_id is None:
            action_id = policy["action_id"]
        x, _ = self._parse_features(ctx, sensor_inputs)
        nx = self._transition(ctx, x, action_id, rng)
        curr = {k: round(float(x[i]), 3) for i, k in enumerate(FEATURE_KEYS)}
        nxt = {k: round(float(nx[i]), 3) for i, k in enumerate(FEATURE_KEYS)}
        reward = self.calculate_reward(nxt)
        next_policy = self.evaluate_policy(nxt)
        q_selected = policy["q_values"][names[action_id]]  # Q untuk action yang benar-benar dijalankan
        evaluation = ("Reward positif: kondisi hasil action berada dekat target rata-rata wafer normal."
                      if reward >= 0 else
                      "Reward negatif: kondisi hasil action masih jauh dari target rata-rata wafer normal.")
        return {
            "status": "success",
            "current_state": {"state_index": policy["state_index"], "features": curr},
            "selected_action": {"action_id": action_id, "action_name": names[action_id], "q_value": q_selected},
            "next_state": {"state_index": next_policy.get("state_index"), "features": nxt},
            "reward": reward, "evaluation": evaluation,
            "q_table_match_status": policy["q_table_match_status"],
            "q_table_match_label": policy["q_table_match_label"],
        }

    # ------------------------------------------------------------- episodes
    def simulate_episodes(self, sensor_inputs: Dict[str, Any], n_episodes: int = 10,
                          rng: Optional[np.random.Generator] = None) -> Dict[str, Any]:
        """EVALUASI (bukan training): n_episodes independen, tiap episode episode_len step greedy.
        Episode 1 mulai dari input pengguna; episode lain mulai dari input + jitter (seperti saat training).
        Reward per episode = total reward selama episode. Q-table tidak diubah."""
        ctx = self._rl_ctx()
        if ctx is None:
            return {"status": "pending_model", "message": "RL Model artifacts missing."}
        if n_episodes < 1:
            return {"status": "error", "message": f"n_episodes tidak valid: {n_episodes} (minimal 1)"}
        rng = rng or np.random.default_rng()
        try:
            x0, _ = self._parse_features(ctx, sensor_inputs)
        except (TypeError, ValueError) as e:
            return {"status": "error", "message": f"Input tidak valid: {e}"}
        rewards: List[float] = []
        episodes: List[Dict[str, Any]] = []
        fallback_steps, total_steps = 0, 0
        for ep in range(n_episodes):
            x = x0.copy()
            if ep > 0:
                x[ctx["ctrl_idx"]] += rng.normal(0.0, 1.5, size=len(ctx["ctrl_idx"])) * ctx["dstd"][ctx["ctrl_idx"]]
                x = np.clip(x, ctx["low"], ctx["high"])
            total = 0.0
            for _ in range(ctx["episode_len"]):
                lk = self._lookup(ctx, x)
                fallback_steps += int(lk["status"] != "MATCH")
                total_steps += 1
                x = self._transition(ctx, x, lk["action"], rng)
                total += self.calculate_reward({k: float(x[i]) for i, k in enumerate(FEATURE_KEYS)})
            total = round(total, 2)
            rewards.append(total)
            episodes.append({"episode": ep + 1, "reward": total,
                             "final_temperature_c": round(float(x[0]), 2)})
        return {
            "status": "success", "mode": "evaluation",
            "total_episodes": n_episodes, "num_episodes": n_episodes,
            "steps_per_episode": ctx["episode_len"],
            "episode_rewards": rewards, "episodes": episodes,
            "final_reward": rewards[-1], "average_reward": round(float(np.mean(rewards)), 2),
            "untrained_step_ratio": round(fallback_steps / max(1, total_steps), 3),
            "note": "Evaluasi policy dengan Q-table yang sudah ada (tanpa update/training).",
        }

    def get_info(self) -> Dict[str, Any]:
        ctx = self._rl_ctx()
        metadata = self.model_service.get_rl_metadata()

        if ctx is None:
            return {
                "status": "pending_model",
                "available": False,
                "message": "RL Model artifacts not found."
            }

        qtable = ctx["qtable"]
        return {
            "status": "success",
            "available": True,
            "algorithm": "Q-Learning",
            "qtable_shape": list(qtable.shape),
            "total_discrete_states": int(len(qtable)),
            "trained_states_count": int(ctx["trained_idx"].size),
            "active_q_values_count": int(np.count_nonzero(qtable)),
            "action_space": ctx["action_names"],
            "feature_names": ctx["feat_names"],
            "state_bounds": metadata.get("state_bounds", []),
            "n_bins": metadata.get("n_bins", []),
            "steps_per_episode": ctx["episode_len"],
        }


rl_service = RLControlService()
