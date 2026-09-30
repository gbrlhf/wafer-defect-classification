import logging
from typing import Dict, Any, Optional
import pandas as pd
from .model_service import model_service

logger = logging.getLogger(__name__)

# Fallback profile dictionary matching 5 physical semiconductor steps
FALLBACK_PROFILES = {
    "0": {
        "cluster_id": 0,
        "cluster_name": "Cluster 0 - Lithography",
        "proses_dominan": "Lithography",
        "persentase_proses_dominan": 100.0,
        "jumlah_wafer": 992,
        "insight": "Nominal baseline process with photolithography pattern alignment.",
        "recommended_action": "Maintain standard optical alignment recipe.",
        "rata_rata_sensor": {
            "temperature_c": 449.98,
            "pressure_torr": 760.87,
            "gas_flow_sccm": 120.14,
            "etch_rate_nm_min": 95.49,
            "voltage_v": 4.99,
            "current_ma": 19.94
        }
    },
    "1": {
        "cluster_id": 1,
        "cluster_name": "Cluster 1 - Etching",
        "proses_dominan": "Etching",
        "persentase_proses_dominan": 100.0,
        "jumlah_wafer": 997,
        "insight": "Reactive Ion Etching (RIE) phase with active plasma discharge.",
        "recommended_action": "Inspect RF electrode match network and chamber vacuum throttle.",
        "rata_rata_sensor": {
            "temperature_c": 449.89,
            "pressure_torr": 759.99,
            "gas_flow_sccm": 119.90,
            "etch_rate_nm_min": 95.17,
            "voltage_v": 4.98,
            "current_ma": 20.04
        }
    },
    "2": {
        "cluster_id": 2,
        "cluster_name": "Cluster 2 - CMP",
        "proses_dominan": "CMP",
        "persentase_proses_dominan": 100.0,
        "jumlah_wafer": 1029,
        "insight": "Chemical Mechanical Polishing planarization cycle with steady slurry flow.",
        "recommended_action": "Verify polishing pad conditioning and slurry distribution uniformity.",
        "rata_rata_sensor": {
            "temperature_c": 449.80,
            "pressure_torr": 759.60,
            "gas_flow_sccm": 120.37,
            "etch_rate_nm_min": 94.72,
            "voltage_v": 5.00,
            "current_ma": 20.05
        }
    },
    "3": {
        "cluster_id": 3,
        "cluster_name": "Cluster 3 - Deposition",
        "proses_dominan": "Deposition",
        "persentase_proses_dominan": 100.0,
        "jumlah_wafer": 955,
        "insight": "Plasma chemical vapor deposition thin film growth phase.",
        "recommended_action": "Check precursor mass flow controllers and substrate chuck thermal contact.",
        "rata_rata_sensor": {
            "temperature_c": 450.64,
            "pressure_torr": 758.44,
            "gas_flow_sccm": 119.98,
            "etch_rate_nm_min": 95.01,
            "voltage_v": 4.98,
            "current_ma": 19.92
        }
    },
    "4": {
        "cluster_id": 4,
        "cluster_name": "Cluster 4 - Oxidation",
        "proses_dominan": "Oxidation",
        "persentase_proses_dominan": 100.0,
        "jumlah_wafer": 1027,
        "insight": "Thermal oxidation furnace run forming high-purity SiO2 gate dielectric.",
        "recommended_action": "Maintain current recipe and oxygen carrier gas ratio.",
        "rata_rata_sensor": {
            "temperature_c": 450.14,
            "pressure_torr": 759.58,
            "gas_flow_sccm": 120.13,
            "etch_rate_nm_min": 95.27,
            "voltage_v": 4.99,
            "current_ma": 19.98
        }
    }
}


class ClusteringService:
    """
    Handles feature preprocessing, unsupervised clustering inference,
    and cluster profile assignment using trained Scikit-learn KMeans pipeline.
    """

    def __init__(self):
        self.model_service = model_service

    def get_all_profiles(self) -> Dict[str, Any]:
        """Returns all statistical cluster profiles."""
        loaded_profiles = self.model_service.get_cluster_profiles()
        if loaded_profiles:
            # Merge with rich labels
            enriched = {}
            for k, v in loaded_profiles.items():
                fallback_info = FALLBACK_PROFILES.get(str(k), {})
                enriched[k] = {
                    "cluster_id": int(k),
                    "cluster_name": f"Cluster {k} - {v.get('proses_dominan', 'Process')}",
                    "proses_dominan": v.get("proses_dominan"),
                    "persentase_proses_dominan": v.get("persentase_proses_dominan", 100.0),
                    "jumlah_wafer": v.get("jumlah_wafer", 1000),
                    "rata_rata_sensor": v.get("rata_rata_sensor", {}),
                    "insight": fallback_info.get("insight", "Process pattern group"),
                    "recommended_action": fallback_info.get("recommended_action", "Maintain current recipe"),
                }
            return enriched
        return FALLBACK_PROFILES

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assigns a cluster ID (0-4) to the input feature profile using kmeans_pipeline.pkl.
        Pipeline internally transforms features using ColumnTransformer, StandardScaler, and KMeans.
        """
        clustering_pipeline = self.model_service.get_clustering()

        if clustering_pipeline is None:
            return {
                "status": "pending_model",
                "cluster_id": None,
                "cluster_name": None,
                "message": (
                    "Clustering model ('kmeans_pipeline.pkl') is not yet available in backend/app/models/. "
                    "Please export trained pipeline from unsupervised notebook."
                ),
            }

        try:
            # Ensure all required features are present with appropriate defaults
            clean_features = {
                "temperature_c": float(features.get("temperature_c", 450.0)),
                "pressure_torr": float(features.get("pressure_torr", 760.0)),
                "gas_flow_sccm": float(features.get("gas_flow_sccm", 120.0)),
                "etch_rate_nm_min": float(features.get("etch_rate_nm_min", 95.0)),
                "voltage_v": float(features.get("voltage_v", 5.0)),
                "current_ma": float(features.get("current_ma", 20.0)),
                "process_step": str(features.get("process_step", "Lithography")),
            }

            input_df = pd.DataFrame([clean_features])

            # Predict cluster assignment using full Pipeline
            cluster_val = int(clustering_pipeline.predict(input_df)[0])

            # Retrieve profile info
            all_profiles = self.get_all_profiles()
            profile_info = all_profiles.get(str(cluster_val), FALLBACK_PROFILES.get(str(cluster_val), {}))
            cluster_name = profile_info.get("cluster_name", f"Cluster {cluster_val}")

            return {
                "status": "success",
                "cluster_id": cluster_val,
                "cluster_name": cluster_name,
                "process_step": clean_features["process_step"],
                "profile": profile_info,
                "message": f"Assigned to {cluster_name} with dominant process {profile_info.get('proses_dominan', 'Unknown')}.",
            }

        except Exception as e:
            logger.error(f"Inference error in clustering: {e}", exc_info=True)
            return {
                "status": "error",
                "cluster_id": None,
                "cluster_name": None,
                "message": f"Clustering inference failed: {str(e)}",
            }


clustering_service = ClusteringService()
