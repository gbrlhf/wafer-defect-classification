from flask import Blueprint, jsonify, request
from ..services.rl_service import rl_service

router = Blueprint("control_optimization", __name__, url_prefix="/api/control-optimization")

MAX_EPISODES = 100


def _bad_request(message: str):
    return jsonify({"status": "error", "message": message}), 400


@router.route("/recommend", methods=["POST"])
def get_recommendation():
    """
    Evaluates greedy Q-Learning policy for current process state inputs.
    """
    data = request.get_json(silent=True) or {}
    sensor_inputs = data.get("sensor_inputs", data)
    result = rl_service.evaluate_policy(sensor_inputs)
    return jsonify(result), 400 if result.get("status") == "error" else 200


@router.route("/simulate-step", methods=["POST"])
def simulate_step():
    """
    Simulates 1 environment transition step (Current State -> Selected Action -> Next State -> Reward).
    """
    data = request.get_json(silent=True) or {}
    sensor_inputs = data.get("sensor_inputs", data)
    action_id = data.get("action_id")
    if action_id is not None:
        if isinstance(action_id, bool) or not isinstance(action_id, (int, str)):
            return _bad_request(f"action_id tidak valid: {action_id!r} (harus 0, 1, atau 2)")
        try:
            action_id = int(action_id)
        except ValueError:
            return _bad_request(f"action_id tidak valid: {action_id!r} (harus 0, 1, atau 2)")
        if action_id not in (0, 1, 2):
            return _bad_request(f"action_id tidak valid: {action_id} (harus 0, 1, atau 2)")
    result = rl_service.simulate_step(sensor_inputs, action_id=action_id)
    return jsonify(result), 400 if result.get("status") == "error" else 200


@router.route("/simulate-episodes", methods=["POST"])
def simulate_episodes():
    """
    Simulates N episodes in the Q-Learning environment for trajectory evaluation and reward curve plotting.
    """
    data = request.get_json(silent=True) or {}
    sensor_inputs = data.get("sensor_inputs", data)
    raw_n = data.get("n_episodes", data.get("num_episodes", 10))
    try:
        if isinstance(raw_n, bool):
            raise ValueError
        n_episodes = int(raw_n)
    except (TypeError, ValueError):
        return _bad_request(f"n_episodes tidak valid: {raw_n!r}")
    if not 1 <= n_episodes <= MAX_EPISODES:
        return _bad_request(f"n_episodes harus antara 1 dan {MAX_EPISODES}")
    result = rl_service.simulate_episodes(sensor_inputs, n_episodes=n_episodes)
    return jsonify(result), 400 if result.get("status") == "error" else 200


@router.route("/info", methods=["GET"])
def get_rl_info():
    """
    Returns Q-Learning model parameters, Q-table dimensions, state bounds, and discrete action space.
    """
    info = rl_service.get_info()
    return jsonify(info), 200
