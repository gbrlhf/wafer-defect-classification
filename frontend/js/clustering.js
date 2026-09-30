/**
 * Wafer Defect Clustering Controller
 * Unsupervised Learning with K-Means Pipeline & PostgreSQL Persistence.
 * Integrates:
 * - Single Wafer Metrology Input & Recipe Presets
 * - Asynchronous Flask API Fetch (POST /api/clustering/predict)
 * - Loading & Error States (Try Again)
 * - Real 2D PCA Projections & SVG Visualization
 * - Cluster Profiles & Sensor Characteristics (K=5)
 * - PostgreSQL Prediction History Table (GET /api/clustering/history)
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing Wafer Clustering Controller with PostgreSQL & K-Means Pipeline...");

    // Form & Input Elements
    const clusterForm = document.getElementById("wafer-cluster-form");
    const runBtn = document.getElementById("run-clustering-btn");
    const runIcon = document.getElementById("run-icon");
    const runBtnLabel = document.getElementById("run-btn-label");
    const loadingCard = document.getElementById("clustering-loading");
    const errorCard = document.getElementById("clustering-error");
    const errorMessageText = document.getElementById("error-message-text");
    const tryAgainBtn = document.getElementById("try-again-btn");
    const resultCard = document.getElementById("clustering-result");

    const inputStep = document.getElementById("input-process-step");
    const inputTemp = document.getElementById("input-temp");
    const inputPressure = document.getElementById("input-pressure");
    const inputGas = document.getElementById("input-gas");
    const inputEtch = document.getElementById("input-etch");
    const inputVoltage = document.getElementById("input-voltage");
    const inputCurrent = document.getElementById("input-current");

    // Result Card Elements
    const resultClusterBadge = document.getElementById("result-cluster-badge");
    const resultDbRecord = document.getElementById("result-db-record");
    const resultClusterName = document.getElementById("result-cluster-name");
    const resultDistance = document.getElementById("result-distance");
    const resultProcess = document.getElementById("result-process");

    // Summary Metric Elements
    const summaryTotalWafers = document.getElementById("summary-total-wafers");
    const summaryNClusters = document.getElementById("summary-n-clusters");
    const summarySilhouette = document.getElementById("summary-silhouette");
    const summaryLastAnalysis = document.getElementById("summary-last-analysis");

    // History Table Elements
    const historyTbody = document.getElementById("history-tbody");
    const refreshHistoryBtn = document.getElementById("refresh-history-btn");

    // Scatter Plot SVG & Toolbar Controls
    const scatterSvg = document.getElementById("scatter-svg");
    const zoomInBtn = document.getElementById("zoom-in-btn");
    const zoomOutBtn = document.getElementById("zoom-out-btn");
    const resetViewBtn = document.getElementById("reset-view-btn");

    let currentZoom = 1.0;
    let clusterVisibility = { "0": true, "1": true, "2": true, "3": true, "4": true };

    // Authoritative Sensor Means from cluster_profiles.json for Presets
    const clusterPresets = {
        "0": { step: "Lithography", temp: 449.98, pressure: 760.87, gas: 120.14, etch: 95.49, voltage: 4.998, current: 19.94 },
        "1": { step: "Etching", temp: 449.89, pressure: 759.99, gas: 119.90, etch: 95.17, voltage: 4.984, current: 20.04 },
        "2": { step: "CMP", temp: 449.80, pressure: 759.60, gas: 120.37, etch: 94.72, voltage: 5.003, current: 20.05 },
        "3": { step: "Deposition", temp: 450.64, pressure: 758.44, gas: 119.98, etch: 95.01, voltage: 4.983, current: 19.92 },
        "4": { step: "Oxidation", temp: 450.14, pressure: 759.58, gas: 120.13, etch: 95.27, voltage: 4.994, current: 19.98 }
    };

    /**
     * 1. Preset Buttons Handler
     */
    document.querySelectorAll(".preset-btn[data-preset]").forEach(btn => {
        btn.addEventListener("click", () => {
            const pId = btn.getAttribute("data-preset");
            const p = clusterPresets[pId];
            if (!p) return;

            inputStep.value = p.step;
            inputTemp.value = p.temp.toFixed(2);
            inputPressure.value = p.pressure.toFixed(2);
            inputGas.value = p.gas.toFixed(2);
            inputEtch.value = p.etch.toFixed(2);
            inputVoltage.value = p.voltage.toFixed(3);
            inputCurrent.value = p.current.toFixed(2);

            // Highlight preset button briefly
            btn.classList.add("ring-2", "ring-primary");
            setTimeout(() => btn.classList.remove("ring-2", "ring-primary"), 1000);
        });
    });

    const resetFormBtn = document.getElementById("btn-reset-form");
    if (resetFormBtn) {
        resetFormBtn.addEventListener("click", () => {
            const p = clusterPresets["1"];
            inputStep.value = p.step;
            inputTemp.value = p.temp.toFixed(2);
            inputPressure.value = p.pressure.toFixed(2);
            inputGas.value = p.gas.toFixed(2);
            inputEtch.value = p.etch.toFixed(2);
            inputVoltage.value = p.voltage.toFixed(3);
            inputCurrent.value = p.current.toFixed(2);
            if (resultCard) resultCard.classList.add("hidden");
            if (errorCard) errorCard.classList.add("hidden");
        });
    }

    /**
     * 2. Execute Clustering Inference (POST /api/clustering/predict)
     */
    async function executeClustering(e) {
        if (e && e.preventDefault) e.preventDefault();

        // Feature Extraction & Basic Client Validation
        const features = {
            temperature_c: parseFloat(inputTemp.value),
            pressure_torr: parseFloat(inputPressure.value),
            gas_flow_sccm: parseFloat(inputGas.value),
            etch_rate_nm_min: parseFloat(inputEtch.value),
            voltage_v: parseFloat(inputVoltage.value),
            current_ma: parseFloat(inputCurrent.value),
            process_step: inputStep.value
        };

        for (const [key, val] of Object.entries(features)) {
            if (key !== "process_step" && (isNaN(val) || val === null)) {
                showErrorState(`Field '${key}' must be a valid number.`);
                return;
            }
        }

        // Set Loading State
        setLoadingState(true);

        try {
            const result = await ApiClient.predictClustering(features);

            if (result.status === "error") {
                showErrorState(result.message || "Clustering prediction failed.");
                return;
            }

            // Success Handling
            showSuccessResult(result);
            loadHistory(); // Refresh history from PostgreSQL
        } catch (err) {
            console.error("Clustering request failed:", err);
            showErrorState("Unable to process the wafer data. Please verify Flask backend is running on port 5000.");
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(isLoading) {
        if (isLoading) {
            if (runBtn) runBtn.disabled = true;
            if (runIcon) {
                runIcon.textContent = "progress_activity";
                runIcon.classList.add("animate-spin");
            }
            if (runBtnLabel) runBtnLabel.textContent = "Analyzing wafer data...";
            if (loadingCard) loadingCard.classList.remove("hidden");
            if (errorCard) errorCard.classList.add("hidden");
            if (resultCard) resultCard.classList.add("hidden");
        } else {
            if (runBtn) runBtn.disabled = false;
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
     * 3. Display Success Results in DOM
     */
    function showSuccessResult(result) {
        if (errorCard) errorCard.classList.add("hidden");
        if (resultCard) {
            resultCard.classList.remove("hidden");
            if (resultClusterBadge) resultClusterBadge.textContent = `Cluster ${result.cluster_id}`;
            if (resultClusterName) resultClusterName.textContent = result.cluster_name;
            if (resultDistance) resultDistance.textContent = result.distance_to_centroid;
            if (resultProcess) resultProcess.textContent = result.process_step;
            if (resultDbRecord) resultDbRecord.textContent = result.db_record_id ? `Saved #${result.db_record_id}` : "Saved to DB";
        }

        // Update Last Analysis in summary
        if (summaryLastAnalysis) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            summaryLastAnalysis.textContent = timeStr;
        }

        // Highlight matching cluster card
        highlightClusterCard(result.cluster_id);

        // Update Dynamic Evaluated Wafer Marker on SVG
        if (result.point_coordinates) {
            updateWaferMarker(result.point_coordinates, result.cluster_id, result.cluster_name, result.distance_to_centroid);
        }
    }

    /**
     * 4. Highlight the Assigned Cluster Card
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
        }, 5000);
    }

    /**
     * 5. Dynamic Marker on SVG Scatter Plot
     */
    function updateWaferMarker(coords, clusterId, clusterName, distance) {
        if (!scatterSvg) return;

        let marker = document.getElementById("active-wafer-marker");
        if (!marker) {
            marker = document.createElementNS("http://www.w3.org/2000/svg", "g");
            marker.id = "active-wafer-marker";
            marker.innerHTML = `
                <circle id="marker-pulse" r="20" fill="#7C3AED" fill-opacity="0.25" class="animate-ping" />
                <circle id="marker-core" r="8" fill="#630ED4" stroke="#FFFFFF" stroke-width="2.5" />
                <rect id="marker-box" x="-60" y="-34" width="120" height="22" rx="11" fill="#1D1C18" fill-opacity="0.88" />
                <text id="marker-label" font-family="Plus Jakarta Sans" font-size="10" font-weight="700" fill="#FFFFFF" y="-20" text-anchor="middle">Evaluated Wafer</text>
            `;
            scatterSvg.appendChild(marker);
        }

        const posX = coords.svg_x || 480;
        const posY = coords.svg_y || 260;
        marker.setAttribute("transform", `translate(${posX}, ${posY})`);

        const label = marker.querySelector("#marker-label");
        if (label) {
            label.textContent = `Wafer -> C${clusterId} (d=${distance})`;
        }
    }

    /**
     * 6. Fetch & Render Recent Clustering Runs from PostgreSQL (GET /api/clustering/history)
     */
    async function loadHistory() {
        if (!historyTbody) return;
        try {
            const data = await ApiClient.getClusteringHistory(8);
            if (data && data.status === "success" && data.history && data.history.length > 0) {
                historyTbody.innerHTML = data.history.map(row => `
                    <tr class="hover:bg-surface-container-low transition-colors">
                        <td class="py-2.5 px-4 font-mono text-[12px] text-on-surface-variant">${row.created_at || "Just now"}</td>
                        <td class="py-2.5 px-4 font-semibold text-on-surface">${row.process_step || "-"}</td>
                        <td class="py-2.5 px-4 font-semibold text-primary">${row.cluster || "-"}</td>
                        <td class="py-2.5 px-4 font-mono text-[12px]">${row.distance_to_centroid != null ? row.distance_to_centroid : "-"}</td>
                        <td class="py-2.5 px-4">
                            <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                Recorded (#${row.id})
                            </span>
                        </td>
                    </tr>
                `).join("");
            } else {
                historyTbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="py-4 text-center text-on-surface-variant text-[13px]">
                            No clustering runs recorded yet. Click 'Run Clustering' to record an inference.
                        </td>
                    </tr>
                `;
            }
        } catch (err) {
            console.warn("Could not load history from PostgreSQL:", err);
            historyTbody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-4 text-center text-error text-[13px]">
                        Failed to connect to PostgreSQL history. Check backend status.
                    </td>
                </tr>
            `;
        }
    }

    if (refreshHistoryBtn) {
        refreshHistoryBtn.addEventListener("click", loadHistory);
    }

    /**
     * 7. Interactive Legend Chips (Toggle Cluster Dots Visibility in SVG)
     */
    document.querySelectorAll(".legend-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            const cId = chip.getAttribute("data-cluster");
            if (cId === null) return;

            clusterVisibility[cId] = !clusterVisibility[cId];
            const dotsGroup = document.getElementById(`cluster-${cId}-dots`);
            const centroidEl = document.getElementById(`centroid-${cId}`);

            if (dotsGroup) {
                dotsGroup.style.display = clusterVisibility[cId] ? "inline" : "none";
            }
            if (centroidEl) {
                centroidEl.style.display = clusterVisibility[cId] ? "inline" : "none";
            }

            if (clusterVisibility[cId]) {
                chip.classList.remove("opacity-40", "line-through");
            } else {
                chip.classList.add("opacity-40", "line-through");
            }
        });
    });

    /**
     * 8. SVG Zoom & Pan Controls
     */
    if (zoomInBtn) {
        zoomInBtn.addEventListener("click", () => {
            currentZoom = Math.min(1.8, currentZoom + 0.15);
            if (scatterSvg) scatterSvg.style.transform = `scale(${currentZoom})`;
        });
    }
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener("click", () => {
            currentZoom = Math.max(0.7, currentZoom - 0.15);
            if (scatterSvg) scatterSvg.style.transform = `scale(${currentZoom})`;
        });
    }
    if (resetViewBtn) {
        resetViewBtn.addEventListener("click", () => {
            currentZoom = 1.0;
            if (scatterSvg) scatterSvg.style.transform = `scale(1.0)`;
        });
    }

    // Connect form submission
    if (clusterForm) {
        clusterForm.addEventListener("submit", executeClustering);
    }

    // Initial Data Ingestion
    loadHistory();
});
