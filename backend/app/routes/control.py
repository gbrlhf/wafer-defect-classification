from flask import Blueprint, jsonify, request
from ..services.rl_service import rl_service

router = Blueprint("control_optimization", __name__, url_prefix="/api/control-optimization")


@router.route("/recommend", methods=["POST"])
def get_recommendation():
    """
    Evaluates greedy Q-Learning policy for current process state inputs.
    """
    data = request.get_json(silent=True) or {}
    sensor_inputs = data.get("sensor_inputs", data)
    result = rl_service.evaluate_policy(sensor_inputs)
    return jsonify(result), 200


@router.route("/simulate-step", methods=["POST"])
def simulate_step():
    """
    Simulates 1 environment transition step (Current State -> Selected Action -> Next State -> Reward).
    """
    data = request.get_json(silent=True) or {}
    sensor_inputs = data.get("sensor_inputs", data)
    action_id = data.get("action_id")
    result = rl_service.simulate_step(sensor_inputs, action_id=action_id)
    return jsonify(result), 200


@router.route("/simulate-episodes", methods=["POST"])
def simulate_episodes():
    """
    Simulates N episodes in the Q-Learning environment for trajectory evaluation and reward curve plotting.
    """
    data = request.get_json(silent=True) or {}
    sensor_inputs = data.get("sensor_inputs", data)
    num_episodes = int(data.get("num_episodes", 10))
    result = rl_service.simulate_episodes(sensor_inputs, num_episodes=num_episodes)
    return jsonify(result), 200


@router.route("/info", methods=["GET"])
def get_rl_info():
    """
    Returns Q-Learning model parameters, Q-table dimensions, state bounds, and discrete action space.
    """
    info = rl_service.get_info()
    return jsonify(info), 200
