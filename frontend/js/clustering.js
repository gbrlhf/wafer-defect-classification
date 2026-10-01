/**
 * Wafer Defect Clustering Controller
 * Unsupervised Learning with K-Means Pipeline (k=5) & Automated Baseline Parameters.
 * 
 * Flow:
 * User selects Process Step -> Backend retrieves baseline parameters -> K-Means pipeline predicts
 * -> Result persisted to PostgreSQL -> Frontend displays assigned cluster, interpretation & PCA marker.
 * 
 * NO manual sensor numeric inputs.
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing Automated Baseline Wafer Clustering Controller...");

    // UI Form & Control Elements
    const clusterForm = document.getElementById("wafer-cluster-form");
    const inputStep = document.getElementById("input-process-step");
    const runBtn = document.getElementById("run-clustering-btn");
    const runIcon = document.getElementById("run-icon");
    const runBtnLabel = document.getElementById("run-btn-label");
    const resetFormBtn = document.getElementById("btn-reset-form");

    // Loading & Error Elements
    const loadingCard = document.getElementById("clustering-loading");
    const errorCard = document.getElementById("clustering-error");
    const errorMessageText = document.getElementById("error-message-text");
    const tryAgainBtn = document.getElementById("try-again-btn");

    // Result Card Elements (Separated Cluster ID & Cluster Interpretation)
    const resultCard = document.getElementById("clustering-result");
    const resultClusterBadge = document.getElementById("result-cluster-badge");
    const resultClusterIdText = document.getElementById("result-cluster-id-text");
    const resultClusterInterpretation = document.getElementById("result-cluster-interpretation");
    const resultDbRecord = document.getElementById("result-db-record");
    const resultDistance = document.getElementById("result-distance");
    const resultProcess = document.getElementById("result-process");

    // Summary Metric Elements
    const summaryClustersCount = document.getElementById("summary-clusters-count");
    const summarySilhouette = document.getElementById("summary-silhouette");
    const summaryLastAnalysis = document.getElementById("summary-last-analysis");

    // Interactive SVG Scatter Plot
    const scatterSvg = document.getElementById("scatter-svg");

    const PRESET_STEP_MAP = {
        "0": "Lithography",
        "1": "Etching",
        "2": "CMP",
        "3": "Deposition",
        "4": "Oxidation"
    };

    /**
     * 1. Synchronize Preset Buttons Visual State
     */
    function syncPresetButtons(activeStep) {
        document.querySelectorAll(".preset-btn[data-preset]").forEach(btn => {
            const pId = btn.getAttribute("data-preset");
            const btnStep = PRESET_STEP_MAP[pId];

            if (btnStep === activeStep) {
                btn.classList.add("bg-primary-container", "text-on-primary-container", "font-bold", "shadow-sm");
                btn.classList.remove("bg-surface-container-low", "text-primary");
            } else {
                btn.classList.remove("bg-primary-container", "text-on-primary-container", "font-bold", "shadow-sm");
                btn.classList.add("bg-surface-container-low", "text-primary");
            }
        });
    }

    /**
     * 2. Process Step Dropdown Change Handler
     */
    if (inputStep) {
        inputStep.addEventListener("change", () => {
            const selectedStep = inputStep.value;
            syncPresetButtons(selectedStep);
            if (resultCard) resultCard.classList.add("hidden");
            if (errorCard) errorCard.classList.add("hidden");
        });
    }

    /**
     * 3. Preset Buttons Handler (Direct Selection only - does NOT auto-run)
     */
    document.querySelectorAll(".preset-btn[data-preset]").forEach(btn => {
        btn.addEventListener("click", () => {
            const pId = btn.getAttribute("data-preset");
            const targetStep = PRESET_STEP_MAP[pId];
            if (targetStep && inputStep) {
                inputStep.value = targetStep;
                syncPresetButtons(targetStep);
                if (resultCard) resultCard.classList.add("hidden");
                if (errorCard) errorCard.classList.add("hidden");
            }
        });
    });

    /**
     * 4. Reset Button Handler
     */
    if (resetFormBtn) {
        resetFormBtn.addEventListener("click", () => {
            if (inputStep) {
                inputStep.value = "Lithography";
                syncPresetButtons("Lithography");
            }

            if (resultCard) resultCard.classList.add("hidden");
            if (errorCard) errorCard.classList.add("hidden");

            // Remove active wafer marker on PCA plot
            const activeMarker = document.getElementById("active-wafer-marker");
            if (activeMarker) activeMarker.remove();

            // Un-highlight all cluster cards
            document.querySelectorAll(".cluster-card").forEach(c => {
                c.classList.remove("ring-2", "ring-primary", "scale-[1.03]", "shadow-lg");
            });

            console.log("[Reset] Reset clustering selection to default (Lithography).");
        });
    }

    /**
     * 5. Execute Clustering Inference (POST /api/clustering/predict)
     */
    async function executeClustering(e) {
        if (e && e.preventDefault) e.preventDefault();

        const activeStep = inputStep ? inputStep.value : "Lithography";
        if (!activeStep) {
            showErrorState("Please select a valid Process Step.");
            return;
        }

        // Set Loading State
        setLoadingState(true);

        try {
            const payload = { process_step: activeStep };
            const result = await ApiClient.predictClustering(payload);

            if (!result.success || result.status === "error") {
                showErrorState(result.message || "Clustering prediction failed.");
                return;
            }

            // Success Handling
            showSuccessResult(result);
        } catch (err) {
            console.error("Clustering request failed:", err);
            showErrorState("Unable to process the wafer data. Please verify Flask backend is running on port 5000.");
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            if (runBtn) {
                runBtn.disabled = true;
                runBtn.classList.add("opacity-60", "cursor-not-allowed");
            }
            if (runIcon) {
                runIcon.textContent = "progress_activity";
                runIcon.classList.add("animate-spin");
            }
            if (runBtnLabel) runBtnLabel.textContent = "Analyzing wafer profile...";
            if (loadingCard) loadingCard.classList.remove("hidden");
            if (errorCard) errorCard.classList.add("hidden");
            if (resultCard) resultCard.classList.add("hidden");
        } else {
            if (runBtn) {
                runBtn.disabled = false;
                runBtn.classList.remove("opacity-60", "cursor-not-allowed");
            }
            if (runIcon) {
                runIcon.textContent = "play_circle";
                runIcon.classList.remove("animate-spin");
            }
            if (runBtnLabel) runBtnLabel.textContent = "Run Clustering";
            if (loadingCard) loadingCard.classList.add("hidden");
        }
    }

    function showErrorState(msg) {
        if (errorCard) {
            errorCard.classList.remove("hidden");
            if (errorMessageText) errorMessageText.textContent = msg;
        }
        if (resultCard) resultCard.classList.add("hidden");
    }

    if (tryAgainBtn) {
        tryAgainBtn.addEventListener("click", () => {
            if (errorCard) errorCard.classList.add("hidden");
            executeClustering();
        });
    }

    /**
     * 6. Render Success Result Card (Separated Cluster ID and Interpretation)
     */
    function showSuccessResult(result) {
        if (errorCard) errorCard.classList.add("hidden");
        if (resultCard) {
            resultCard.classList.remove("hidden");
            
            // Cluster ID
            const clusterIdLabel = `Cluster ${result.cluster_id}`;
            if (resultClusterBadge) resultClusterBadge.textContent = clusterIdLabel;
            if (resultClusterIdText) resultClusterIdText.textContent = clusterIdLabel;
            
            // Cluster Interpretation (distinct from Cluster ID)
            const interpretationText = result.cluster_interpretation || 
                (result.profile && result.profile.proses_dominan 
                    ? `${result.profile.proses_dominan} Process Regimen` 
                    : `${result.process_step} Process Regimen`);
            if (resultClusterInterpretation) resultClusterInterpretation.textContent = interpretationText;
            
            // Numerical outputs from model
            if (resultDistance) resultDistance.textContent = result.distance_to_centroid;
            if (resultProcess) resultProcess.textContent = result.process_step;
            if (resultDbRecord) resultDbRecord.textContent = result.db_record_id ? `Saved #${result.db_record_id}` : "Saved to DB";
        }

        // Update Last Analysis in summary card
        if (summaryLastAnalysis) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            summaryLastAnalysis.textContent = timeStr;
        }

        // Highlight matching cluster card in Dataset Cluster Distribution
        highlightClusterCard(result.cluster_id);

        // Update Dynamic Evaluated Wafer Marker on SVG PCA Plot
        if (result.point_coordinates) {
            updateWaferMarker(result.point_coordinates, result.cluster_id, result.cluster_name, result.distance_to_centroid);
        }
    }

    /**
     * 7. Highlight the Assigned Cluster Card in Distribution Section
     */
    function highlightClusterCard(clusterId) {
        const cards = document.querySelectorAll(".cluster-card");
        cards.forEach(card => {
            const cId = card.getAttribute("data-cluster-id");
            if (cId === String(clusterId)) {
                card.classList.add("ring-2", "ring-primary", "scale-[1.03]", "shadow-lg");
            } else {
                card.classList.remove("ring-2", "ring-primary", "scale-[1.03]", "shadow-lg");
            }
        });

        setTimeout(() => {
            cards.forEach(c => c.classList.remove("ring-2", "ring-primary", "scale-[1.03]", "shadow-lg"));
        }, 6000);
    }

    /**
     * 8. Dynamic Marker on SVG Scatter Plot
     */
    function updateWaferMarker(coords, clusterId, clusterName, distance) {
        if (!scatterSvg) return;

        let marker = document.getElementById("active-wafer-marker");
        if (!marker) {
            marker = document.createElementNS("http://www.w3.org/2000/svg", "g");
            marker.id = "active-wafer-marker";
            marker.innerHTML = `
                <circle id="marker-pulse" cx="${coords.svg_x}" cy="${coords.svg_y}" r="16" fill="rgba(124, 58, 237, 0.25)" class="animate-ping" />
                <circle id="marker-outer" cx="${coords.svg_x}" cy="${coords.svg_y}" r="8" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2.5" shadow="0 0 10px rgba(0,0,0,0.5)" />
                <circle id="marker-inner" cx="${coords.svg_x}" cy="${coords.svg_y}" r="3" fill="#FFFFFF" />
            `;
            scatterSvg.appendChild(marker);
        } else {
            const pulse = marker.querySelector("#marker-pulse");
            const outer = marker.querySelector("#marker-outer");
            const inner = marker.querySelector("#marker-inner");
            if (pulse) { pulse.setAttribute("cx", coords.svg_x); pulse.setAttribute("cy", coords.svg_y); }
            if (outer) { outer.setAttribute("cx", coords.svg_x); outer.setAttribute("cy", coords.svg_y); }
            if (inner) { inner.setAttribute("cx", coords.svg_x); inner.setAttribute("cy", coords.svg_y); }
        }

        console.log(`[PCA Marker] Placed active wafer marker at SVG (${coords.svg_x}, ${coords.svg_y}) [PC1=${coords.pc1}, PC2=${coords.pc2}].`);
    }

    /**
     * 9. Summary & Cluster Profiles Loader
     */
    async function initMetricsAndProfiles() {
        try {
            const [metrics, profilesData] = await Promise.all([
                ApiClient.getClusterMetrics(),
                ApiClient.getClusterProfiles()
            ]);

            if (metrics) {
                if (summaryClustersCount) summaryClustersCount.textContent = metrics.n_clusters || 5;
                if (summarySilhouette) summarySilhouette.textContent = (metrics.silhouette_score || 0.812).toFixed(3);
            }
        } catch (err) {
            console.warn("Could not load initial metrics/profiles:", err);
        }
    }

    // Connect Submit Listener
    if (clusterForm) {
        clusterForm.addEventListener("submit", executeClustering);
    }

    // Initialize UI
    const initialStep = inputStep ? inputStep.value : "Lithography";
    syncPresetButtons(initialStep);
    initMetricsAndProfiles();
});
