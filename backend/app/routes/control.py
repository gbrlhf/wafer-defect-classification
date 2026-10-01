from flask import Blueprint, jsonify, request
from ..services.rl_service import rl_service

router = Blueprint("control_optimization", __name__, url_prefix="/api/control-optimization")


@router.route("/recommend", methods=["POST"])
def get_recommendation():
    """
    Receives current semiconductor fabrication sensor telemetry, evaluates
    Reinforcement Learning policy (Q-table), and returns recommended action.
    """
    data = request.get_json(silent=True) or {}
    sensor_inputs = data.get("sensor_inputs", data)
    result = rl_service.recommend_action(sensor_inputs)
    return jsonify(result), 200


@router.route("/info", methods=["GET"])
def get_rl_info():
    """
    Returns environment action space, state discretization bounds, and Q-table summary.
    """
    info = rl_service.get_info()
    return jsonify(info), 200
