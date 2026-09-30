/**
 * Central API Client Configuration for Wafer Defect Classification & Control System
 * Single source of truth for communication between Frontend and Backend (Flask).
 */
const API_BASE_URL = "http://localhost:5000/api";

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
            return await response.json();
        } catch (error) {
            console.error("Classification API error:", error);
            throw error;
        }
    },

    /**
     * Send feature inputs to Unsupervised Clustering model (KMeans pipeline)
     */
    async predictClustering(features) {
        try {
            const response = await fetch(`${API_BASE_URL}/clustering/predict`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ features: features || {} })
            });
            return await response.json();
        } catch (error) {
            console.error("Clustering API error:", error);
            throw error;
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
