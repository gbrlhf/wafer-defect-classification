/**
 * Clustering Page JavaScript
 * Connects frontend UI to Unsupervised KMeans Pipeline in Backend Flask.
 */
document.addEventListener("DOMContentLoaded", () => {
    const runBtn = document.getElementById("run-clustering-btn");
    const runIcon = document.getElementById("run-icon");
    const processSelect = document.getElementById("process-step-select");

    // SVG elements for dynamic cluster highlighting
    const cluster1Dots = document.getElementById("cluster-1-dots");
    const cluster2Dots = document.getElementById("cluster-2-dots");
    const cluster3Dots = document.getElementById("cluster-3-dots");

    // Mapping select values to backend process steps
    const stepMapping = {
        "all": "Etching",
        "litho": "Lithography",
        "etch": "Etching",
        "cmp": "CMP",
        "cvd": "Deposition"
    };

    // Load initial cluster profiles if available
    async function loadProfiles() {
        try {
            const data = await ApiClient.getClusterProfiles();
            console.log("Cluster profiles loaded from backend:", data);
        } catch (e) {
            console.warn("Could not fetch cluster profiles:", e);
        }
    }
    loadProfiles();

    // Run Clustering Inference
    async function executeClustering() {
        if (!runBtn) return;

        // Visual loading state
        runBtn.disabled = true;
        if (runIcon) runIcon.classList.add("animate-spin");

        const selectedVal = processSelect ? processSelect.value : "etch";
        const processStep = stepMapping[selectedVal] || "Etching";

        // Simulated sensor parameters corresponding to the chosen step
        const sensorParams = {
            temperature_c: 449.8 + (Math.random() * 4 - 2),
            pressure_torr: 759.5 + (Math.random() * 6 - 3),
            gas_flow_sccm: 120.0 + (Math.random() * 5 - 2.5),
            etch_rate_nm_min: 95.0 + (Math.random() * 4 - 2),
            voltage_v: 5.0,
            current_ma: 20.0,
            process_step: processStep
        };

        try {
            const response = await ApiClient.predictClustering(sensorParams);
            console.log("Clustering API Response:", response);

            if (response.status === "success") {
                const clusterId = response.cluster_id;
                highlightCluster(clusterId);
                showClusterToast(response.cluster_name, response.process_step, response.profile);
            }
        } catch (error) {
            console.error("Clustering inference error:", error);
        } finally {
            runBtn.disabled = false;
            if (runIcon) runIcon.classList.remove("animate-spin");
        }
    }

    function highlightCluster(clusterId) {
        // Subtle pulse and opacity adjustment on SVG dots
        if (cluster1Dots) cluster1Dots.setAttribute("opacity", clusterId === 0 || clusterId === 1 ? "1.0" : "0.35");
        if (cluster2Dots) cluster2Dots.setAttribute("opacity", clusterId === 2 || clusterId === 3 ? "1.0" : "0.35");
        if (cluster3Dots) cluster3Dots.setAttribute("opacity", clusterId === 4 ? "1.0" : "0.35");

        setTimeout(() => {
            if (cluster1Dots) cluster1Dots.setAttribute("opacity", "0.82");
            if (cluster2Dots) cluster2Dots.setAttribute("opacity", "0.85");
            if (cluster3Dots) cluster3Dots.setAttribute("opacity", "0.82");
        }, 3000);
    }

    function showClusterToast(clusterName, step, profile) {
        let toast = document.getElementById("cluster-toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "cluster-toast";
            toast.className = "fixed bottom-8 right-8 z-50 p-4 rounded-2xl bg-surface-container-lowest shadow-2xl border border-primary-fixed flex items-center gap-3 transition-all duration-300 transform translate-y-12 opacity-0";
            document.body.appendChild(toast);
        }

        toast.innerHTML = `
            <div class="p-2 rounded-xl bg-primary-fixed text-primary">
                <span class="material-symbols-outlined text-[24px]">hub</span>
            </div>
            <div class="flex flex-col">
                <span class="font-label-md text-label-md font-bold text-on-surface">Unsupervised Inference Berhasil</span>
                <span class="font-body-sm text-body-sm text-on-surface-variant">Ditugaskan ke <strong>${clusterName}</strong> (Step: ${step})</span>
            </div>
        `;

        toast.classList.remove("translate-y-12", "opacity-0");
        setTimeout(() => {
            toast.classList.add("translate-y-12", "opacity-0");
        }, 4000);
    }

    if (runBtn) {
        runBtn.addEventListener("click", executeClustering);
    }

    if (processSelect) {
        processSelect.addEventListener("change", executeClustering);
    }
});
