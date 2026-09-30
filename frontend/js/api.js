/**
 * Central API Client Configuration for Wafer Defect Classification System
 * Single source of truth for backend communication.
 */
const API_BASE_URL = "http://localhost:8001/api";

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
     * Fetch model evaluation metrics and artifact statuses
     */
    async getModelMetrics() {
        try {
            const response = await fetch(`${API_BASE_URL}/model/metrics`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch model metrics:", error);
            throw error;
        }
    },

    /**
     * Send feature inputs to Supervised Classification model
     */
    async predictClassification(features) {
        const response = await fetch(`${API_BASE_URL}/classification/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ features: features || {} })
        });
        return await response.json();
    },

    /**
     * Send feature inputs to Unsupervised Clustering model
     */
    async predictClustering(features) {
        const response = await fetch(`${API_BASE_URL}/clustering/predict`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ features: features || {} })
        });
        return await response.json();
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
            text.textContent = "API: Online (8001)";
        } else {
            dot.className = "status-dot offline";
            text.textContent = "API: Offline";
        }
    }
};

// Automatically initiate health check when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    ApiClient.updateNavbarStatus();
    // Re-check periodically every 30 seconds
    setInterval(() => ApiClient.updateNavbarStatus(), 30000);
});
