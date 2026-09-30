/**
 * Classification Page JavaScript
 * Handles form telemetry submission, demo state tabs, and graceful display of
 * Supervised Classification results.
 */
document.addEventListener("DOMContentLoaded", () => {
    const waferForm = document.getElementById("wafer-form");
    const btnPredict = document.getElementById("btn-predict");
    const btnClear = document.getElementById("btn-clear");
    const btnPresetNormal = document.getElementById("btn-preset-normal");
    const btnPresetDefect = document.getElementById("btn-preset-defect");
    const stateTabButtons = document.querySelectorAll(".state-tab-btn");

    // Input elements
    const inputTemp = document.getElementById("input-temp");
    const inputPressure = document.getElementById("input-pressure");
    const inputGas = document.getElementById("input-gas");
    const inputEtch = document.getElementById("input-etch");
    const inputVoltage = document.getElementById("input-voltage");
    const inputCurrent = document.getElementById("input-current");
    const inputStep = document.getElementById("input-step");

    // Views
    const views = {
        normal: document.getElementById("view-normal"),
        defect: document.getElementById("view-defect"),
        loading: document.getElementById("view-loading"),
        empty: document.getElementById("view-empty"),
        error: document.getElementById("view-error")
    };

    function showView(stateName) {
        Object.keys(views).forEach(k => {
            if (views[k]) {
                views[k].classList.add("hidden");
                views[k].classList.remove("flex");
            }
        });

        if (views[stateName]) {
            views[stateName].classList.remove("hidden");
            views[stateName].classList.add("flex");
        }

        // Update tab button active states
        stateTabButtons.forEach(btn => {
            const state = btn.getAttribute("data-state");
            if (state === stateName) {
                btn.className = "state-tab-btn flex-1 min-w-[100px] text-center py-2 px-3 rounded-full font-label-md text-label-md bg-secondary text-on-secondary shadow-sm transition-all";
            } else {
                btn.className = "state-tab-btn flex-1 min-w-[100px] text-center py-2 px-3 rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all";
            }
        });
    }

    // Connect Tab Buttons
    stateTabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const state = btn.getAttribute("data-state");
            showView(state);
        });
    });

    // Preset Buttons
    if (btnPresetNormal) {
        btnPresetNormal.addEventListener("click", () => {
            if (inputTemp) inputTemp.value = "420.5";
            if (inputPressure) inputPressure.value = "15.2";
            if (inputGas) inputGas.value = "120.0";
            if (inputEtch) inputEtch.value = "310.8";
            if (inputVoltage) inputVoltage.value = "5.0";
            if (inputCurrent) inputCurrent.value = "20.1";
            if (inputStep) inputStep.value = "Lithography";
            showView("normal");
        });
    }

    if (btnPresetDefect) {
        btnPresetDefect.addEventListener("click", () => {
            if (inputTemp) inputTemp.value = "458.2";
            if (inputPressure) inputPressure.value = "22.8";
            if (inputGas) inputGas.value = "142.5";
            if (inputEtch) inputEtch.value = "388.0";
            if (inputVoltage) inputVoltage.value = "7.8";
            if (inputCurrent) inputCurrent.value = "34.5";
            if (inputStep) inputStep.value = "Etching";
            showView("defect");
        });
    }

    if (btnClear) {
        btnClear.addEventListener("click", () => {
            if (inputTemp) inputTemp.value = "400.0";
            if (inputPressure) inputPressure.value = "15.0";
            if (inputGas) inputGas.value = "100.0";
            if (inputEtch) inputEtch.value = "300.0";
            if (inputVoltage) inputVoltage.value = "5.0";
            if (inputCurrent) inputCurrent.value = "20.0";
            showView("empty");
        });
    }

    // Form Submission & API Call
    async function handlePredict() {
        const features = {
            temperature_c: parseFloat(inputTemp ? inputTemp.value : 420.5) || 420.5,
            pressure_torr: parseFloat(inputPressure ? inputPressure.value : 15.2) || 15.2,
            gas_flow_sccm: parseFloat(inputGas ? inputGas.value : 120.0) || 120.0,
            etch_rate_nm_min: parseFloat(inputEtch ? inputEtch.value : 310.8) || 310.8,
            voltage_v: parseFloat(inputVoltage ? inputVoltage.value : 5.0) || 5.0,
            current_ma: parseFloat(inputCurrent ? inputCurrent.value : 20.1) || 20.1,
            process_step: inputStep ? inputStep.value : "Lithography"
        };

        showView("loading");
        if (btnPredict) btnPredict.disabled = true;

        try {
            const result = await ApiClient.predictClassification(features);
            console.log("Classification result from backend:", result);

            if (result.status === "pending_model") {
                // Render informative pending model message in view-empty or custom alert
                showView("empty");
                const emptyView = views.empty;
                if (emptyView) {
                    emptyView.innerHTML = `
                        <div class="max-w-md mx-auto p-6 rounded-3xl bg-surface-container-low border border-primary-fixed flex flex-col items-center gap-3 text-center shadow-sm">
                            <span class="material-symbols-outlined text-[48px] text-primary">model_training</span>
                            <h3 class="font-title-lg text-title-lg text-on-surface">Model Supervised: Siap Diintegrasikan</h3>
                            <p class="font-body-md text-body-md text-on-surface-variant">
                                Backend Flask berhasil merespons request Anda. Model supervised (<code>classifier.joblib</code>) saat ini belum diekspor dari Colab.
                            </p>
                            <div class="w-full p-3 rounded-2xl bg-surface-container text-left text-xs font-mono text-on-surface-variant">
                                <div><strong>Backend Status:</strong> ${result.status}</div>
                                <div><strong>Pesan:</strong> ${result.message}</div>
                            </div>
                            <span class="font-label-sm text-label-sm text-secondary">
                                Gunakan demo tabs (Normal / Defect) di atas untuk melihat preview visualisasi inferensi.
                            </span>
                        </div>
                    `;
                }
            } else if (result.status === "success") {
                if (result.prediction === 1 || result.prediction === "Defect") {
                    showView("defect");
                } else {
                    showView("normal");
                }
            } else {
                showView("error");
            }
        } catch (error) {
            console.error("API call error:", error);
            showView("error");
        } finally {
            if (btnPredict) btnPredict.disabled = false;
        }
    }

    if (btnPredict) {
        btnPredict.addEventListener("click", handlePredict);
    }

    if (waferForm) {
        waferForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handlePredict();
        });
    }
});
