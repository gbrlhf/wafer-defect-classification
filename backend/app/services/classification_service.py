import logging
from typing import Dict, Any, Tuple, Optional, List
import numpy as np
import pandas as pd
from .model_service import model_service

logger = logging.getLogger(__name__)

STEP_MAPPING = {
    "RIE": "Etching", "ETCHING": "Etching", "ETCH": "Etching", "CMP": "CMP",
    "TO": "Oxidation", "OXIDATION": "Oxidation", "DUV": "Lithography",
    "LITHO": "Lithography", "LITHOGRAPHY": "Lithography", "CVD": "Deposition", "DEPOSITION": "Deposition",
}

SUPPORTED_RANGES = {
    "temperature_c": {"min": 300.0, "max": 600.0, "unit": "°C", "label": "Chamber Temperature"},
    "pressure_torr": {"min": 500.0, "max": 1000.0, "unit": "Torr", "label": "Base Chamber Pressure"},
    "gas_flow_sccm": {"min": 50.0, "max": 200.0, "unit": "sccm", "label": "Gas Flow Rate"},
    "etch_rate_nm_min": {"min": 50.0, "max": 200.0, "unit": "nm/min", "label": "Plasma Etch Rate"},
    "voltage_v": {"min": 2.0, "max": 10.0, "unit": "V", "label": "RF Voltage"},
    "current_ma": {"min": 10.0, "max": 40.0, "unit": "mA", "label": "Plasma Current"},
}

FEATURE_KEY_MAP = {
    "temperature_c": ["temperature_c", "temperature", "temp"],
    "pressure_torr": ["pressure_torr", "pressure"],
    "gas_flow_sccm": ["gas_flow_sccm", "gas_flow", "gas"],
    "etch_rate_nm_min": ["etch_rate_nm_min", "etch_rate", "etch"],
    "voltage_v": ["voltage_v", "voltage"],
    "current_ma": ["current_ma", "current"],
}

class ClassificationService:
    def __init__(self):
        self.model_service = model_service

    def validate_features(self, features: Dict[str, Any]) -> Tuple[bool, Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        clean_row = {}
        for standard_key, aliases in FEATURE_KEY_MAP.items():
            val = None
            for alias in aliases:
                if alias in features and features[alias] is not None:
                    val = features[alias]
                    break
            meta = SUPPORTED_RANGES[standard_key]
            if val is None or str(val).strip() == "":
                return False, {"success": False, "status": "error", "error_code": "MISSING_FIELD", "message": f"Field '{meta['label']}' wajib diisi.", "field": standard_key}, None
            try:
                num_val = float(val)
                if np.isnan(num_val) or np.isinf(num_val):
                    raise ValueError()
            except Exception:
                return False, {"success": False, "status": "error", "error_code": "INVALID_FIELD_TYPE", "message": f"Field '{meta['label']}' harus berupa angka numerik yang valid.", "field": standard_key}, None

            if num_val < meta["min"] or num_val > meta["max"]:
                return False, {
                    "success": False, "status": "error", "error_code": "INPUT_OUT_OF_RANGE",
                    "message": f"{meta['label']} ({num_val} {meta['unit']}) is outside supported range [{meta['min']} - {meta['max']} {meta['unit']}].",
                    "field": standard_key, "supported_range": {"min": meta["min"], "max": meta["max"], "unit": meta["unit"]}
                }, None

            clean_row[standard_key] = num_val
        return True, None, clean_row

    def _compute_influential_features(self, classifier: Any, scaler: Any, clean_row: Dict[str, float], is_defect: bool) -> List[Dict[str, Any]]:
        cols = ['temperature_c', 'pressure_torr', 'gas_flow_sccm', 'etch_rate_nm_min', 'voltage_v', 'current_ma']
        raw_importances = getattr(classifier, "feature_importances_", None)
        if raw_importances is not None and len(raw_importances) >= 6:
            sensor_imps = [float(imp) for imp in raw_importances[:6]]
            total_sensor_imp = sum(sensor_imps) if sum(sensor_imps) > 0 else 1.0
            norm_imps = [round((imp / total_sensor_imp) * 100.0, 1) for imp in sensor_imps]
        else:
            norm_imps = [18.6, 41.5, 5.3, 14.5, 12.1, 8.0]

        try:
            std_scaler = scaler.transformers_[0][1]
            means = [float(m) for m in std_scaler.mean_]
            scales = [float(s) for s in std_scaler.scale_]
        except Exception:
            means = [450.08, 759.70, 120.11, 95.13, 4.99, 19.99]
            scales = [14.95, 30.31, 9.99, 8.03, 0.39, 2.00]

        features_list = []
        for idx, col in enumerate(cols):
            val = float(clean_row[col])
            meta = SUPPORTED_RANGES[col]
            mean_val = means[idx]
            scale_val = scales[idx] if scales[idx] > 0 else 1.0
            z_score = (val - mean_val) / scale_val
            z_score_rounded = round(z_score, 2)
            dev_str = f"+{z_score_rounded:.2f}σ" if z_score_rounded >= 0 else f"{z_score_rounded:.2f}σ"
            val_formatted = int(val) if val == int(val) else round(val, 2)

            features_list.append({
                "feature": col,
                "label": meta["label"],
                "value": val_formatted,
                "unit": meta["unit"],
                "model_importance_pct": norm_imps[idx],
                "contribution_percent": norm_imps[idx],
                "z_score": z_score_rounded,
                "abs_z_score": round(abs(z_score), 2),
                "deviation": dev_str,
                "deviation_sigma": z_score_rounded
            })

        if is_defect:
            features_list.sort(key=lambda x: x["abs_z_score"] * x["model_importance_pct"], reverse=True)
        else:
            features_list.sort(key=lambda x: x["model_importance_pct"], reverse=True)

        return features_list

    def predict(self, features: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        is_valid, val_error, clean_row = self.validate_features(features)
        if not is_valid:
            return val_error, 400

        classifier = self.model_service.get_classifier()
        scaler = self.model_service.get_scaler()

        if classifier is None or scaler is None:
            return {"success": False, "status": "pending_model", "error_code": "MODEL_UNAVAILABLE", "message": "Model not ready"}, 503

        try:
            raw_step = str(features.get("process_step", features.get("step", "Lithography"))).strip()
            clean_step = STEP_MAPPING.get(raw_step.upper(), raw_step.capitalize())
            if clean_step not in ["CMP", "Deposition", "Etching", "Lithography", "Oxidation"]:
                clean_step = "Lithography"

            pipeline_row = dict(clean_row)
            pipeline_row["process_step"] = clean_step
            input_df = pd.DataFrame([pipeline_row])
            X_transformed = scaler.transform(input_df)

            decision_threshold = 0.25
            if hasattr(classifier, "predict_proba"):
                probabilities = classifier.predict_proba(X_transformed)[0]
                normal_prob = round(float(probabilities[0]), 4) if len(probabilities) > 0 else 0.0
                defect_prob = round(float(probabilities[1]), 4) if len(probabilities) > 1 else 0.0
                is_defect = bool(defect_prob >= decision_threshold)
                prediction_val = 1 if is_defect else 0
                label_name = "Defect" if is_defect else "Normal"
            else:
                prediction_val = int(classifier.predict(X_transformed)[0])
                is_defect = bool(prediction_val == 1)
                label_name = "Defect" if is_defect else "Normal"
                defect_prob = 1.0 if is_defect else 0.0
                normal_prob = 0.0 if is_defect else 1.0

            defect_prob_pct = round(defect_prob * 100.0, 1)
            normal_prob_pct = round(normal_prob * 100.0, 1)
            threshold_pct = round(decision_threshold * 100.0, 1)

            influential_features = self._compute_influential_features(classifier, scaler, clean_row, is_defect)

            message = (
                f"Defect anomaly detected (Class 1) with {defect_prob_pct}% defect probability (exceeds {threshold_pct}% threshold)."
                if is_defect
                else f"Wafer substrate nominal (Class 0) with {normal_prob_pct}% normal probability."
            )

            return {
                "success": True,
                "status": "success",
                "prediction": prediction_val,
                "label": label_name,
                "defect_probability": defect_prob,
                "defect_probability_percent": defect_prob_pct,
                "normal_probability": normal_prob,
                "normal_probability_percent": normal_prob_pct,
                "decision_threshold": decision_threshold,
                "decision_threshold_percent": threshold_pct,
                "features_analyzed": clean_row,
                "influential_features": influential_features,
                "feature_contributions": influential_features,
                "message": message,
            }, 200

        except Exception as e:
            logger.error(f"Inference error: {e}", exc_info=True)
            return {"success": False, "status": "error", "error_code": "INFERENCE_ERROR", "message": "Inference failed"}, 500

classification_service = ClassificationService()
