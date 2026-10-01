/**
 * Classification Page JavaScript
 * Menghubungkan formulir metrology wafer dengan model Supervised Learning (RandomForest) di Backend Flask.
 * Menjamin 4 state visual: Initial (Empty), Loading, Success (Normal/Defect), dan Error.
 * Mencegah panel hasil menjadi kosong tanpa pesan dalam kondisi apa pun.
 */
document.addEventListener("DOMContentLoaded", () => {
    const waferForm = document.getElementById("wafer-form");
    const btnPredict = document.getElementById("btn-predict");
    const btnClear = document.getElementById("btn-clear");
    const btnPresetNormal = document.getElementById("btn-preset-normal");
    const btnPresetDefect = document.getElementById("btn-preset-defect");
    const btnFixNominal = document.getElementById("btn-fix-nominal");
    const btnFixDefect = document.getElementById("btn-fix-defect");
    const stateTabButtons = document.querySelectorAll(".state-tab-btn");

    // 6 Parameter Sensor Metrology
    const inputTemp = document.getElementById("input-temp");
    const inputPressure = document.getElementById("input-pressure");
    const inputGas = document.getElementById("input-gas");
    const inputEtch = document.getElementById("input-etch");
    const inputVoltage = document.getElementById("input-voltage");
    const inputCurrent = document.getElementById("input-current");

    // Feedback elements
    const feedbackElements = {
        "input-temp": document.getElementById("feedback-temp"),
        "input-pressure": document.getElementById("feedback-pressure"),
        "input-gas": document.getElementById("feedback-gas"),
        "input-etch": document.getElementById("feedback-etch"),
        "input-voltage": document.getElementById("feedback-voltage"),
        "input-current": document.getElementById("feedback-current"),
    };

    const errorTitle = document.getElementById("error-title");
    const errorMessage = document.getElementById("error-message");
    const errorHint = document.getElementById("error-hint");
    const errorBadgeSubtitle = document.getElementById("error-badge-subtitle");

    const views = {
        empty: document.getElementById("view-empty"),
        loading: document.getElementById("view-loading"),
        normal: document.getElementById("view-normal"),
        defect: document.getElementById("view-defect"),
        error: document.getElementById("view-error")
    };

    const FIELD_SPECS = {
        "input-temp": { key: "temperature_c", min: 380.0, max: 530.0, unit: "°C", label: "Chamber Temperature" },
        "input-pressure": { key: "pressure_torr", min: 600.0, max: 900.0, unit: "Torr", label: "Base Chamber Pressure" },
        "input-gas": { key: "gas_flow_sccm", min: 70.0, max: 170.0, unit: "sccm", label: "Gas Flow Rate" },
        "input-etch": { key: "etch_rate_nm_min", min: 50.0, max: 150.0, unit: "nm/min", label: "Plasma Etch Rate" },
        "input-voltage": { key: "voltage_v", min: 3.0, max: 7.0, unit: "V", label: "RF Voltage" },
        "input-current": { key: "current_ma", min: 10.0, max: 30.0, unit: "mA", label: "Plasma Current" }
    };

    // Baseline initial metrics for fallback rendering
    const DEFAULT_BASELINE_FEATURES = [
        { feature: "pressure_torr", label: "Base Chamber Pressure", value: 760, unit: "Torr", model_importance_pct: 41.5, z_score: 0.01, deviation: "+0.01σ" },
        { feature: "temperature_c", label: "Chamber Temperature", value: 450, unit: "°C", model_importance_pct: 18.6, z_score: -0.01, deviation: "-0.01σ" },
        { feature: "etch_rate_nm_min", label: "Plasma Etch Rate", value: 95, unit: "nm/min", model_importance_pct: 14.5, z_score: -0.02, deviation: "-0.02σ" },
        { feature: "voltage_v", label: "RF Voltage", value: 5.0, unit: "V", model_importance_pct: 12.1, z_score: 0.02, deviation: "+0.02σ" },
        { feature: "current_ma", label: "Plasma Current", value: 20, unit: "mA", model_importance_pct: 8.0, z_score: 0.01, deviation: "+0.01σ" },
        { feature: "gas_flow_sccm", label: "Gas Flow Rate", value: 120, unit: "sccm", model_importance_pct: 5.3, z_score: -0.01, deviation: "-0.01σ" }
    ];

    function showView(stateName, errorData = null) {
        let targetView = views[stateName];
        if (!targetView) {
            targetView = views.empty || views.error || views.normal;
            stateName = "empty";
        }

        Object.keys(views).forEach(key => {
            if (views[key]) {
                views[key].classList.add("hidden");
                views[key].classList.remove("flex");
            }
        });

        if (targetView) {
            targetView.classList.remove("hidden");
            targetView.classList.add("flex");
        }

        if (stateName === "error" && errorData) {
            if (errorTitle && errorData.title) errorTitle.textContent = errorData.title;
            if (errorMessage && errorData.message) errorMessage.textContent = errorData.message;
            if (errorHint) {
                if (errorData.hint) {
                    errorHint.textContent = errorData.hint;
                    errorHint.classList.remove("hidden");
                } else {
                    errorHint.classList.add("hidden");
                }
            }
            if (errorBadgeSubtitle && errorData.subtitle) {
                errorBadgeSubtitle.textContent = errorData.subtitle;
            }
        }

        stateTabButtons.forEach(btn => {
            const state = btn.getAttribute("data-state");
            if (state === stateName) {
                btn.className = "state-tab-btn flex-1 min-w-[100px] text-center py-2 px-3 rounded-full font-label-md text-label-md bg-secondary text-on-secondary shadow-sm transition-all";
            } else {
                btn.className = "state-tab-btn flex-1 min-w-[100px] text-center py-2 px-3 rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all";
            }
        });
    }

    function clearAllValidation() {
        Object.keys(FIELD_SPECS).forEach(inputId => {
            const inputEl = document.getElementById(inputId);
            if (inputEl) inputEl.classList.remove("is-invalid");
            const fbEl = feedbackElements[inputId];
            if (fbEl) {
                fbEl.textContent = "";
                fbEl.classList.add("hidden");
            }
        });
    }

    Object.keys(FIELD_SPECS).forEach(inputId => {
        const inputEl = document.getElementById(inputId);
        if (inputEl) {
            inputEl.addEventListener("input", () => {
                inputEl.classList.remove("is-invalid");
                const fbEl = feedbackElements[inputId];
                if (fbEl) {
                    fbEl.textContent = "";
                    fbEl.classList.add("hidden");
                }
            });
        }
    });

    function validateFormInputs() {
        clearAllValidation();
        const features = {};
        const errors = [];

        for (const [inputId, spec] of Object.entries(FIELD_SPECS)) {
            const inputEl = document.getElementById(inputId);
            const fbEl = feedbackElements[inputId];
            const rawVal = inputEl ? inputEl.value.trim() : "";

            if (!rawVal) {
                const msg = `Field ${spec.label} wajib diisi.`;
                errors.push({ id: inputId, message: msg, spec });
                if (inputEl) inputEl.classList.add("is-invalid");
                if (fbEl) {
                    fbEl.textContent = `⚠ ${msg}`;
                    fbEl.classList.remove("hidden");
                }
                continue;
            }

            const numVal = parseFloat(rawVal);
            if (isNaN(numVal) || !isFinite(numVal)) {
                const msg = `${spec.label} harus berupa angka numerik valid.`;
                errors.push({ id: inputId, message: msg, spec });
                if (inputEl) inputEl.classList.add("is-invalid");
                if (fbEl) {
                    fbEl.textContent = `⚠ ${msg}`;
                    fbEl.classList.remove("hidden");
                }
                continue;
            }

            if (numVal < spec.min || numVal > spec.max) {
                const msg = `${spec.label} (${numVal} ${spec.unit}) berada di luar batas yang didukung [${spec.min} – ${spec.max} ${spec.unit}].`;
                errors.push({ id: inputId, message: msg, spec, outOfRange: true, val: numVal });
                if (inputEl) inputEl.classList.add("is-invalid");
                if (fbEl) {
                    fbEl.textContent = `⚠ Nilai di luar rentang [${spec.min} – ${spec.max} ${spec.unit}]`;
                    fbEl.classList.remove("hidden");
                }
                continue;
            }

            features[spec.key] = numVal;
        }

        if (errors.length > 0) {
            const firstErr = errors[0];
            showView("error", {
                title: firstErr.outOfRange ? "Input Parameter Out of Supported Range" : "Formulir Tidak Lengkap",
                message: firstErr.message,
                hint: firstErr.spec ? `Supported Range: ${firstErr.spec.min} – ${firstErr.spec.max} ${firstErr.spec.unit}` : "Periksa kembali nilai.",
                subtitle: firstErr.outOfRange ? "Physical Sensor Constraint" : "Validation Error"
            });
            return null;
        }

        return features;
    }

    /**
     * Merender Top Influential Features secara dinamis
     */
    const FIELD_RANGES = {
        "temperature_c": { min: 380.0, max: 530.0 },
        "pressure_torr": { min: 600.0, max: 900.0 },
        "gas_flow_sccm": { min: 70.0, max: 170.0 },
        "etch_rate_nm_min": { min: 50.0, max: 150.0 },
        "voltage_v": { min: 3.0, max: 7.0 },
        "current_ma": { min: 10.0, max: 30.0 }
    };

    /**
     * Merender Top Influential Features secara dinamis dengan animasi gerak bar responsif
     */
    function renderInfluentialFeatures(featuresList, containerId, isDefect) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const dataToRender = (featuresList && Array.isArray(featuresList) && featuresList.length > 0)
            ? featuresList
            : DEFAULT_BASELINE_FEATURES;

        // Vibrant, high-contrast bar colors for all 6 features
        const barColors = isDefect
            ? ["bg-tertiary", "bg-primary", "bg-secondary", "bg-tertiary-container", "bg-primary-container", "bg-secondary-container"]
            : ["bg-primary", "bg-secondary", "bg-tertiary", "bg-primary-container", "bg-secondary-container", "bg-tertiary-container"];

        container.innerHTML = dataToRender.map((item, index) => {
            const barColor = barColors[index % barColors.length];
            const isHighDev = item.z_score !== undefined && Math.abs(item.z_score) >= 1.5;
            const devClass = isHighDev
                ? (isDefect ? "text-tertiary font-bold" : "text-primary font-bold")
                : "text-on-surface-variant";

            const impPct = item.model_importance_pct !== undefined ? item.model_importance_pct : (item.contribution_percent || 0.0);
            const devStr = item.deviation || (item.deviation_sigma !== undefined ? (item.deviation_sigma >= 0 ? `+${item.deviation_sigma}σ` : `${item.deviation_sigma}σ`) : "0.00σ");

            // Calculate dynamic bar width based on parameter input value within its supported min-max range
            const range = FIELD_RANGES[item.feature];
            let normValPct = impPct;
            if (range && item.value !== undefined) {
                const rawVal = parseFloat(item.value);
                if (!isNaN(rawVal)) {
                    normValPct = ((rawVal - range.min) / (range.max - range.min)) * 100.0;
                }
            }
            const targetWidth = Math.min(Math.max(normValPct, 6.0), 100.0).toFixed(1);

            return `
                <div class="p-2.5 rounded-xl bg-surface-container flex flex-col gap-1.5 border border-outline-variant/30 transition-all hover:border-outline-variant">
                    <div class="flex flex-wrap sm:flex-nowrap justify-between items-baseline gap-2">
                        <span class="font-title-sm text-title-sm text-on-surface font-semibold break-words sm:min-w-0" title="${item.label}">${item.label}</span>
                        <span class="font-mono text-[12px] font-semibold text-on-surface bg-surface-container-high px-2 py-0.5 rounded-md border border-outline-variant/40 shrink-0 ml-auto">${item.value} ${item.unit}</span>
                    </div>
                    <div class="flex justify-between items-center text-[11px] pt-0.5">
                        <span class="text-on-surface-variant font-medium">Importance: <strong class="text-on-surface font-bold">${impPct}%</strong></span>
                        <span class="font-mono ${devClass}">Dev: <strong>${devStr}</strong></span>
                    </div>
                    <div class="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden mt-0.5">
                        <div class="feature-bar h-full rounded-full ${barColor} transition-all duration-700" style="width: 0%;" data-target-width="${targetWidth}%"></div>
                    </div>
                </div>
            `;
        }).join("");

        // Trigger smooth 700ms animation fill from 0 to target width
        setTimeout(() => {
            container.querySelectorAll(".feature-bar").forEach(bar => {
                const tw = bar.getAttribute("data-target-width");
                if (tw) bar.style.width = tw;
            });
        }, 50);
    }

    async function executePrediction() {
        const features = validateFormInputs();
        if (!features) return;

        showView("loading");
        if (btnPredict) {
            btnPredict.disabled = true;
            btnPredict.classList.add("opacity-70", "cursor-not-allowed");
        }

        try {
            const result = await ApiClient.predictClassification(features);
            console.log("Supervised Model Result:", result);

            if (result.success && result.status === "success") {
                const isDefect = result.prediction === 1 || result.label === "Defect";
                const targetViewName = isDefect ? "defect" : "normal";
                showView(targetViewName);

                const probTextId = isDefect ? "defect-probability-text" : "normal-probability-text";
                const probBarId = isDefect ? "defect-probability-bar" : "normal-probability-bar";
                const threshTextId = isDefect ? "defect-threshold-text" : "normal-threshold-text";

                const probText = document.getElementById(probTextId);
                const probBar = document.getElementById(probBarId);
                const threshText = document.getElementById(threshTextId);

                const probPct = result.defect_probability_percent !== undefined
                    ? result.defect_probability_percent
                    : (result.defect_probability !== undefined ? Math.round(result.defect_probability * 1000) / 10 : 0.0);

                if (probText) probText.textContent = `${probPct}%`;
                if (probBar) probBar.style.width = `${probPct}%`;
                if (threshText && result.decision_threshold_percent !== undefined) {
                    threshText.textContent = `(Decision Threshold: ${result.decision_threshold_percent}%)`;
                }

                const msgTextId = isDefect ? "defect-message-text" : "normal-message-text";
                const msgText = document.getElementById(msgTextId);
                if (msgText && result.message) {
                    msgText.textContent = result.message;
                }

                const listContainerId = isDefect ? "defect-factors-list" : "normal-factors-list";
                const featureMetrics = result.influential_features || result.feature_contributions;
                renderInfluentialFeatures(featureMetrics, listContainerId, isDefect);

                const badgeId = isDefect ? "defect-factors-badge" : "normal-factors-badge";
                const badgeEl = document.getElementById(badgeId);
                if (badgeEl) {
                    badgeEl.textContent = isDefect ? "Most Deviated Parameters" : "Model Feature Importance";
                }
            } else if (result.status === "pending_model") {
                showView("error", {
                    title: "Model Belum Tersedia di Backend",
                    message: result.message || "Model classifier.joblib belum dimuat di server backend.",
                    hint: "Status: pending_model",
                    subtitle: "Model Service Notice"
                });
            } else {
                showView("error", {
                    title: result.error_code === "INPUT_OUT_OF_RANGE" ? "Input Parameter Out of Supported Range" : "Gagal Memproses Prediksi",
                    message: result.message || "Terjadi kesalahan saat mengevaluasi parameter metrology wafer.",
                    hint: result.supported_range ? `Supported Range: ${result.supported_range.min} – ${result.supported_range.max} ${result.supported_range.unit}` : `Error Code: ${result.error_code || 'INFERENCE_ERROR'}`,
                    subtitle: result.error_code || "Server Error"
                });
            }
        } catch (error) {
            console.error("Supervised inference exception:", error);
            showView("error", {
                title: "Kesalahan Sistem / Jaringan",
                message: "Tidak dapat menyelesaikan permintaan inferensi.",
                hint: error.message || "Network Exception",
                subtitle: "Connection Error"
            });
        } finally {
            if (btnPredict) {
                btnPredict.disabled = false;
                btnPredict.classList.remove("opacity-70", "cursor-not-allowed");
            }
        }
    }

    // Pre-render initial baseline features for both containers so they are NEVER empty
    renderInfluentialFeatures(DEFAULT_BASELINE_FEATURES, "normal-factors-list", false);
    renderInfluentialFeatures(DEFAULT_BASELINE_FEATURES, "defect-factors-list", true);

    stateTabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const state = btn.getAttribute("data-state");
            showView(state);
        });
    });

    if (btnPresetNormal) {
        btnPresetNormal.addEventListener("click", () => {
            clearAllValidation();
            if (inputTemp) inputTemp.value = "450.0";
            if (inputPressure) inputPressure.value = "760.0";
            if (inputGas) inputGas.value = "120.0";
            if (inputEtch) inputEtch.value = "95.0";
            if (inputVoltage) inputVoltage.value = "5.0";
            if (inputCurrent) inputCurrent.value = "20.0";
            executePrediction();
        });
    }

    if (btnPresetDefect) {
        btnPresetDefect.addEventListener("click", () => {
            clearAllValidation();
            if (inputTemp) inputTemp.value = "490.0";
            if (inputPressure) inputPressure.value = "680.0";
            if (inputGas) inputGas.value = "120.0";
            if (inputEtch) inputEtch.value = "135.0";
            if (inputVoltage) inputVoltage.value = "5.2";
            if (inputCurrent) inputCurrent.value = "28.0";
            executePrediction();
        });
    }

    if (btnClear) {
        btnClear.addEventListener("click", () => {
            clearAllValidation();
            if (inputTemp) inputTemp.value = "450.0";
            if (inputPressure) inputPressure.value = "760.0";
            if (inputGas) inputGas.value = "120.0";
            if (inputEtch) inputEtch.value = "95.0";
            if (inputVoltage) inputVoltage.value = "5.0";
            if (inputCurrent) inputCurrent.value = "20.0";
            showView("empty");
        });
    }

    if (btnFixNominal) {
        btnFixNominal.addEventListener("click", () => {
            if (inputEtch) inputEtch.value = "95.0";
            executePrediction();
        });
    }

    if (btnFixDefect) {
        btnFixDefect.addEventListener("click", () => {
            if (inputEtch) inputEtch.value = "135.0";
            executePrediction();
        });
    }

    if (btnPredict) {
        btnPredict.addEventListener("click", executePrediction);
    }

    if (waferForm) {
        waferForm.addEventListener("submit", (e) => {
            e.preventDefault();
            executePrediction();
        });
    }

    showView("empty");
});
