/**
 * Central API Client Configuration for Wafer Defect Classification & Control System
 * Single source of truth for communication between Frontend and Backend (Flask).
 */
// Local (localhost / 127.0.0.1 / file://) -> backend port 5000; otherwise (ngrok, server) -> same-origin "/api" via nginx proxy
const API_BASE_URL = ["localhost", "127.0.0.1", ""].includes(window.location.hostname)
    ? "http://localhost:5000/api"
    : "/api";

const ApiClient = {
    /**
     * Check backend health status
     */
    async getHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.warn("API health check failed:", error);
            return null;
        }
    },

    /**
     * Fetch dataset summary metadata
     */
    async getDatasetInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/dataset/info`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch dataset info:", error);
            throw error;
        }
    },

    /**
     * Fetch model evaluation metrics and artifact statuses across Supervised,
     * Unsupervised, and Reinforcement Learning models
     */
    async getModelStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/model/status`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch model status:", error);
            throw error;
        }
    },

    /**
     * Send feature inputs to Supervised Classification model
     */
    async predictClassification(features) {
        try {
            const response = await fetch(`${API_BASE_URL}/classification/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ features: features || {} })
            });
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                return {
                    success: false,
                    status: "error",
                    http_status: response.status,
                    error_code: "INVALID_JSON_RESPONSE",
                    message: `Server mengembalikan status HTTP ${response.status} dengan format non-JSON.`
                };
            }
            if (!response.ok) {
                return {
                    success: false,
                    status: "error",
                    http_status: response.status,
                    error_code: data.error_code || "HTTP_ERROR",
                    message: data.message || `Server mengembalikan kode status ${response.status}`,
                    field: data.field,
                    supported_range: data.supported_range,
                    details: data
                };
            }
            return data;
        } catch (error) {
            console.error("Classification API network error:", error);
            return {
                success: false,
                status: "error",
                error_code: "NETWORK_ERROR",
                message: "Tidak dapat terhubung ke Backend API (Connection Refused). Pastikan server backend Flask berjalan di port 5000."
            };
        }
    },

    /**
     * Send feature inputs to Unsupervised Clustering model (KMeans pipeline)
     */
    async predictClustering(data) {
        try {
            const payload = data && typeof data === 'object' ? data : { process_step: data };
            const response = await fetch(`${API_BASE_URL}/clustering/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            let resData;
            try {
                resData = await response.json();
            } catch (parseErr) {
                return {
                    success: false,
                    status: "error",
                    http_status: response.status,
                    message: `Server returned status ${response.status} with non-JSON response.`
                };
            }
            if (!response.ok) {
                return {
                    success: false,
                    status: "error",
                    http_status: response.status,
                    error_type: resData.error_type || "HTTP_ERROR",
                    message: resData.message || `Server returned error (${response.status})`,
                    details: resData
                };
            }
            return resData;
        } catch (error) {
            console.error("Clustering API network error:", error);
            return {
                success: false,
                status: "error",
                error_type: "network_error",
                message: "Unable to connect to Flask backend. Please verify backend is running on port 5000."
            };
        }
    },

    /**
     * Fetch 5 statistical cluster profiles from Unsupervised learning
     */
    async getClusterProfiles() {
        try {
            const response = await fetch(`${API_BASE_URL}/clustering/profiles`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Clustering profiles API error:", error);
            throw error;
        }
    },

    /**
     * Send sensor telemetry to Reinforcement Learning Process Controller (Q-Table)
     */
        /**
     * Fetch clustering evaluation metrics (Silhouette, Davies-Bouldin, etc.)
     */
    
    /**
     * Fetch recent clustering runs recorded in PostgreSQL database
     */
    async getClusteringHistory(limit = 10) {
        try {
            const response = await fetch(`${API_BASE_URL}/clustering/history?limit=${limit}`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Clustering history API error:", error);
            throw error;
        }
    },

    /**
     * Fetch prediction history records from PostgreSQL database
     */
    async getPredictions(type = "clustering", limit = 10) {
        try {
            const response = await fetch(`${API_BASE_URL}/predictions?type=${type}&limit=${limit}`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Predictions API error:", error);
            throw error;
        }
    },
async getClusterMetrics() {
        try {
            const response = await fetch(`${API_BASE_URL}/clustering/metrics`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Clustering metrics API error:", error);
            throw error;
        }
    },

async predictControl(sensorInputs) {
        try {
            const response = await fetch(`${API_BASE_URL}/control-optimization/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sensor_inputs: sensorInputs || {} })
            });
            return await response.json();
        } catch (error) {
            console.error("RL Control API error:", error);
            throw error;
        }
    },

    /**
     * Get Reinforcement Learning metadata, action space, and state bounds
     */
    async getControlInfo() {
        try {
            const response = await fetch(`${API_BASE_URL}/control-optimization/info`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("RL Info API error:", error);
            throw error;
        }
    },

    /**
     * Automatically update the status indicator in the navbar
     */
    async updateNavbarStatus() {
        const dot = document.getElementById("api-status-dot");
        const text = document.getElementById("api-status-text");
        if (!dot || !text) return;

        dot.className = "status-dot checking";
        text.textContent = "Checking API...";

        const health = await this.getHealth();
        if (health && health.status === "ok") {
            dot.className = "status-dot online";
            text.textContent = "API: Online (5000)";
        } else {
            dot.className = "status-dot offline";
            text.textContent = "API: Offline";
        }
    }
};

// Automatically initiate health check when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    ApiClient.updateNavbarStatus();
    setInterval(() => ApiClient.updateNavbarStatus(), 30000);
});
