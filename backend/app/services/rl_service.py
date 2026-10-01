import logging
from typing import Dict, Any, List, Optional
import numpy as np
from .model_service import model_service

logger = logging.getLogger(__name__)


class RLControlService:
    """
    Reinforcement Learning Service for In-situ Semiconductor Process Control using Q-Learning.
    Operates on 6 continuous sensor features discretized into 31,250 discrete states (10x5x5x5x5x5)
    and selects discrete actions from 3 choices:
      0: 'Turunkan Parameter'
      1: 'Pertahankan'
      2: 'Naikkan Parameter'
    """

    def __init__(self):
        self.model_service = model_service

    def _discretize(self, values: List[float], bounds: List[List[float]], n_bins: List[int]) -> List[int]:
        bin_coords = []
        for val, (low, high), bins in zip(values, bounds, n_bins):
            val_clamped = max(low, min(high, float(val)))
            step = (high - low) / bins
            idx = int((val_clamped - low) / step)
            if idx >= bins:
                idx = bins - 1
            bin_coords.append(idx)
        return bin_coords

    def evaluate_policy(self, sensor_inputs: Dict[str, Any]) -> Dict[str, Any]:
        metadata = self.model_service.get_rl_metadata()
        qtable = self.model_service.get_rl_qtable()

        if metadata is None or qtable is None:
            return {
                "status": "pending_model",
                "action_name": "Pertahankan",
                "action_id": 1,
                "q_value": 0.0,
                "q_table_match_status": "UNTRAINED",
                "q_table_match_label": "Untrained State",
                "message": "RL Model artifacts missing."
            }

        try:
            state_bounds = metadata.get("state_bounds", [
                (300, 600), (500, 1000), (50, 200), (50, 200), (2, 10), (10, 40)
            ])
            n_bins = metadata.get("n_bins", [10, 5, 5, 5, 5, 5])
            action_names = ["Turunkan Parameter", "Pertahankan", "Naikkan Parameter"]

            temp = float(sensor_inputs.get("temperature_c", sensor_inputs.get("temp", sensor_inputs.get("wafer_temp", 200.0))))
            if temp < 300.0:
                temp_for_state = 300.0 + ((temp - 100.0) / 250.0) * 300.0
            else:
                temp_for_state = temp

            raw_pressure = float(sensor_inputs.get("pressure_torr", sensor_inputs.get("pressure", sensor_inputs.get("chamber_pressure", 15.0))))
            if raw_pressure < 300.0:
                pressure_for_state = 500.0 + ((raw_pressure - 5.0) / 45.0) * 500.0
            else:
                pressure_for_state = raw_pressure

            flow = float(sensor_inputs.get("gas_flow_sccm", sensor_inputs.get("flow", sensor_inputs.get("gas_flow_rate", 120.0))))
            rf_power = float(sensor_inputs.get("rf_power_w", sensor_inputs.get("rf_power", sensor_inputs.get("power", 850.0))))
            duration = float(sensor_inputs.get("duration_s", sensor_inputs.get("duration", sensor_inputs.get("etch_duration", 60.0))))
            est_etch = float(sensor_inputs.get("etch_rate_nm_min", sensor_inputs.get("etch_rate", sensor_inputs.get("rate", 1.2))))

            if est_etch < 10.0:
                etch_for_state = 50.0 + ((est_etch - 0.5) / 2.5) * 150.0
            else:
                etch_for_state = est_etch

            voltage_for_state = max(2.0, min(10.0, 2.0 + ((rf_power - 400.0) / 1100.0) * 8.0))
            current_for_state = max(10.0, min(40.0, 10.0 + ((duration - 20.0) / 160.0) * 30.0))

            features_list = [temp_for_state, pressure_for_state, flow, etch_for_state, voltage_for_state, current_for_state]

            bin_coords = self._discretize(features_list, state_bounds, n_bins)
            total_discrete_states = int(np.prod(n_bins))
            state_idx = int(np.ravel_multi_index(bin_coords, n_bins))

            if 0 <= state_idx < total_discrete_states:
                q_values_raw = qtable[state_idx]
                is_directly_trained = bool(np.any(q_values_raw != 0))

                if is_directly_trained:
                    match_status = "MATCH"
                    match_label = "Q-Table Match"
                    q_vals = [float(v) for v in q_values_raw]
                    best_action_idx = int(np.argmax(q_values_raw))
                    matched_state = state_idx
                else:
                    match_status = "UNTRAINED"
                    match_label = "Untrained State"
                    nonzero_indices = np.where(np.any(qtable != 0, axis=1))[0]
                    if len(nonzero_indices) > 0:
                        current_coords = np.array(bin_coords)
                        best_dist = float("inf")
                        nearest_idx = nonzero_indices[0]
                        for cand_idx in nonzero_indices:
                            cand_coords = np.array(np.unravel_index(cand_idx, n_bins))
                            dist = np.sum(np.abs(current_coords - cand_coords))
                            if dist < best_dist:
                                best_dist = dist
                                nearest_idx = cand_idx
                        q_vals = [float(v) for v in qtable[nearest_idx]]
                        best_action_idx = int(np.argmax(qtable[nearest_idx]))
                        matched_state = int(nearest_idx)
                    else:
                        q_vals = [0.0, 0.0, 0.0]
                        best_action_idx = 1
                        matched_state = state_idx
            else:
                match_status = "INVALID"
                match_label = "Invalid State"
                q_vals = [0.0, 0.0, 0.0]
                best_action_idx = 1
                matched_state = -1

            selected_action_name = action_names[best_action_idx]
            max_q_val = round(q_vals[best_action_idx], 2)

            q_values_dict = {
                action_names[i]: round(q_vals[i], 2) for i in range(len(action_names))
            }

            action_title = f"Selected Action: {selected_action_name}"
            rationale = f"Action dipilih karena memiliki Q-value tertinggi (Q = {max_q_val:.2f}) pada state terdiskritisasi saat ini."

            return {
                "status": "success",
                "algorithm": "Q-Learning",
                "state_index": state_idx,
                "matched_state": matched_state,
                "bin_coordinates": bin_coords,
                "q_table_match_status": match_status,
                "q_table_match_label": match_label,
                "action_id": best_action_idx,
                "selected_action": selected_action_name,
                "action_name": selected_action_name,
                "action_title": action_title,
                "q_value": max_q_val,
                "q_values": q_values_dict,
                "policy_selection": "Greedy Q-Table Policy",
                "rationale": rationale,
                "estimated_etch_rate": round(est_etch, 2),
                "inputs_received": {
                    "temperature_c": temp,
                    "pressure_torr": raw_pressure,
                    "gas_flow_sccm": flow,
                    "rf_power_w": rf_power,
                    "duration_s": duration,
                    "etch_rate_nm_min": round(est_etch, 2)
                }
            }
        except Exception as e:
            logger.error(f"Error evaluating Q-learning policy: {e}", exc_info=True)
            return {
                "status": "error",
                "selected_action": "Pertahankan",
                "action_id": 1,
                "q_value": 0.0,
                "q_table_match_status": "INVALID",
                "q_table_match_label": "Invalid State",
                "message": f"Q-Learning inference error: {str(e)}"
            }

    def calculate_reward(self, features: Dict[str, float]) -> float:
        temp = float(features.get("temperature_c", 200.0))
        press = float(features.get("pressure_torr", 15.0))
        flow = float(features.get("gas_flow_sccm", 120.0))

        dev_temp = (temp - 200.0) / 20.0
        dev_press = (press - 15.0) / 5.0
        dev_flow = (flow - 120.0) / 20.0

        sq_dev = dev_temp**2 + dev_press**2 + dev_flow**2
        reward = 10.0 - (sq_dev * 2.0)
        return round(float(reward), 2)

    def simulate_step(self, sensor_inputs: Dict[str, Any], action_id: Optional[int] = None) -> Dict[str, Any]:
        policy = self.evaluate_policy(sensor_inputs)
        if action_id is None:
            action_id = policy.get("action_id", 1)

        curr_features = policy.get("inputs_received", {
            "temperature_c": 200.0,
            "pressure_torr": 15.0,
            "gas_flow_sccm": 120.0,
            "rf_power_w": 850.0,
            "duration_s": 60.0,
            "etch_rate_nm_min": 1.2
        })

        delta_mult = {0: -1.0, 1: 0.0, 2: 1.0}.get(action_id, 0.0)
        rng = np.random.default_rng()
        noise = rng.normal(0, 0.02, size=3)

        next_temp = round(float(np.clip(curr_features["temperature_c"] + (delta_mult * 3.0) + (noise[0] * 2.0), 100.0, 350.0)), 1)
        next_press = round(float(np.clip(curr_features["pressure_torr"] + (delta_mult * 1.0) + (noise[1] * 0.5), 5.0, 50.0)), 1)
        next_flow = round(float(np.clip(curr_features["gas_flow_sccm"] + (delta_mult * 2.0) + (noise[2] * 2.0), 50.0, 250.0)), 1)

        next_features = {
            "temperature_c": next_temp,
            "pressure_torr": next_press,
            "gas_flow_sccm": next_flow,
            "rf_power_w": curr_features["rf_power_w"],
            "duration_s": curr_features["duration_s"],
            "etch_rate_nm_min": round((curr_features["rf_power_w"] * 0.001) + (next_temp * 0.00175), 2)
        }

        reward = self.calculate_reward(next_features)
        next_policy = self.evaluate_policy(next_features)

        action_names = ["Turunkan Parameter", "Pertahankan", "Naikkan Parameter"]
        action_name = action_names[action_id]

        reward_evaluation = (
            "Action menghasilkan reward positif berdasarkan reward function environment."
            if reward >= 0 else
            "Action menghasilkan penalty berdasarkan reward function environment."
        )

        return {
            "status": "success",
            "current_state": {
                "state_index": policy.get("state_index"),
                "features": curr_features
            },
            "selected_action": {
                "action_id": action_id,
                "action_name": action_name,
                "q_value": policy.get("q_value", 0.0)
            },
            "next_state": {
                "state_index": next_policy.get("state_index"),
                "features": next_features
            },
            "reward": reward,
            "evaluation": reward_evaluation,
            "q_table_match_status": policy.get("q_table_match_status", "UNTRAINED"),
            "q_table_match_label": policy.get("q_table_match_label", "Untrained State")
        }

    def simulate_episodes(self, sensor_inputs: Dict[str, Any], num_episodes: int = 10) -> Dict[str, Any]:
        episodes = []
        episode_rewards = []
        curr_state = dict(sensor_inputs)

        for ep in range(1, num_episodes + 1):
            step_res = self.simulate_step(curr_state)
            reward = step_res["reward"]
            action_name = step_res["selected_action"]["action_name"]
            episodes.append({
                "episode": ep,
                "reward": reward,
                "action": action_name,
                "state_index": step_res["next_state"]["state_index"]
            })
            episode_rewards.append(reward)
            curr_state = step_res["next_state"]["features"]

        avg_reward = round(float(np.mean(episode_rewards)), 2) if episode_rewards else 0.0

        return {
            "status": "success",
            "num_episodes": num_episodes,
            "episodes": episodes,
            "episode_rewards": episode_rewards,
            "final_reward": episode_rewards[-1] if episode_rewards else 0.0,
            "average_reward": avg_reward,
            "summary": f"Diperoleh {num_episodes} episode simulasi Q-Learning. Total return rata-rata per episode: {avg_reward}."
        }

    def get_info(self) -> Dict[str, Any]:
        metadata = self.model_service.get_rl_metadata()
        qtable = self.model_service.get_rl_qtable()

        if metadata is None or qtable is None:
            return {
                "status": "pending_model",
                "available": False,
                "message": "RL Model artifacts not found."
            }

        nonzero_count = int(np.count_nonzero(np.any(qtable != 0, axis=1))) if qtable is not None else 0

        return {
            "status": "success",
            "available": True,
            "algorithm": "Q-Learning",
            "qtable_shape": list(qtable.shape) if qtable is not None else [],
            "total_discrete_states": int(len(qtable)),
            "trained_states_count": nonzero_count,
            "active_q_values_count": int(np.count_nonzero(qtable)),
            "action_space": ["Turunkan Parameter", "Pertahankan", "Naikkan Parameter"],
            "state_bounds": metadata.get("state_bounds", []),
            "n_bins": metadata.get("n_bins", []),
        }


rl_service = RLControlService()
