/**
 * Dashboard Home JavaScript
 */
document.addEventListener("DOMContentLoaded", async () => {
    const healthStatusEl = document.getElementById("stat-health-status");
    const classifierStatusEl = document.getElementById("stat-classifier-status");
    const clusteringStatusEl = document.getElementById("stat-clustering-status");
    const datasetStatusEl = document.getElementById("stat-dataset-status");

    try {
        // Fetch health
        const health = await ApiClient.getHealth();
        if (health && health.status === "ok") {
            if (healthStatusEl) {
                healthStatusEl.textContent = "Online";
                healthStatusEl.className = "text-success fw-bold";
            }
        } else {
            if (healthStatusEl) {
                healthStatusEl.textContent = "Offline";
                healthStatusEl.className = "text-danger fw-bold";
            }
        }

        // Fetch model status
        try {
            const metrics = await ApiClient.getModelMetrics();
            if (metrics && metrics.artifacts_status) {
                if (classifierStatusEl) {
                    const isReady = metrics.artifacts_status.classifier_available;
                    classifierStatusEl.textContent = isReady ? "Active" : "Pending Colab Training";
                    classifierStatusEl.className = isReady ? "text-success fw-bold" : "text-warning fw-bold";
                }
                if (clusteringStatusEl) {
                    const isReady = metrics.artifacts_status.clustering_available;
                    clusteringStatusEl.textContent = isReady ? "Active" : "Pending Colab Training";
                    clusteringStatusEl.className = isReady ? "text-success fw-bold" : "text-warning fw-bold";
                }
            }
        } catch (e) {
            console.warn("Model metrics query skipped or failed:", e);
        }

        // Fetch dataset info
        try {
            const dsInfo = await ApiClient.getDatasetInfo();
            if (dsInfo && datasetStatusEl) {
                datasetStatusEl.textContent = dsInfo.status === "pending_eda" ? "Pending EDA Analysis" : "Ready";
                datasetStatusEl.className = dsInfo.status === "pending_eda" ? "text-warning fw-bold" : "text-success fw-bold";
            }
        } catch (e) {
            console.warn("Dataset info query skipped or failed:", e);
        }

    } catch (err) {
        console.error("Dashboard initialization error:", err);
    }
});
