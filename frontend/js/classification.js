/**
 * Classification Page JavaScript
 * Menghubungkan formulir metrology wafer dengan model Supervised Learning (RandomForest) di Backend Flask.
 * TIDAK MENGUBAH markup/CSS HTML sama sekali.
 */
document.addEventListener("DOMContentLoaded", () => {
    const waferForm = document.getElementById("wafer-form");
    const btnPredict = document.getElementById("btn-predict");
    const btnClear = document.getElementById("btn-clear");
    const btnPresetNormal = document.getElementById("btn-preset-normal");
    const btnPresetDefect = document.getElementById("btn-preset-defect");
    const stateTabButtons = document.querySelectorAll(".state-tab-btn");

    // Input fields dari wafer-form
    const inputTemp = document.getElementById("input-temp");
    const inputPressure = document.getElementById("input-pressure");
    const inputGas = document.getElementById("input-gas");
    const inputEtch = document.getElementById("input-etch");
    const inputVoltage = document.getElementById("input-voltage");
    const inputCurrent = document.getElementById("input-current");
    const inputStep = document.getElementById("input-step");

    // View containers yang sudah ada di classification.html
    const views = {
        normal: document.getElementById("view-normal"),
        defect: document.getElementById("view-defect"),
        loading: document.getElementById("view-loading"),
        empty: document.getElementById("view-empty"),
        error: document.getElementById("view-error")
    };

    function showView(stateName) {
        Object.keys(views).forEach(key => {
            if (views[key]) {
                views[key].classList.add("hidden");
                views[key].classList.remove("flex");
            }
        });

        if (views[stateName]) {
            views[stateName].classList.remove("hidden");
            views[stateName].classList.add("flex");
        }

        // Sinkronisasi status tab demo tombol
        stateTabButtons.forEach(btn => {
            const state = btn.getAttribute("data-state");
            if (state === stateName) {
                btn.className = "state-tab-btn flex-1 min-w-[100px] text-center py-2 px-3 rounded-full font-label-md text-label-md bg-secondary text-on-secondary shadow-sm transition-all";
            } else {
                btn.className = "state-tab-btn flex-1 min-w-[100px] text-center py-2 px-3 rounded-full font-label-md text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all";
            }
        });
    }

    // Sambungkan tab switcher manual jika user mengklik
    stateTabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const state = btn.getAttribute("data-state");
            showView(state);
        });
    });

    // Preset: Sampel Normal (Nominal baseline run)
    if (btnPresetNormal) {
        btnPresetNormal.addEventListener("click", () => {
            if (inputTemp) inputTemp.value = "450.0";
            if (inputPressure) inputPressure.value = "760.0";
            if (inputGas) inputGas.value = "120.0";
            if (inputEtch) inputEtch.value = "95.0";
            if (inputVoltage) inputVoltage.value = "5.0";
            if (inputCurrent) inputCurrent.value = "20.0";
            if (inputStep) inputStep.value = "DUV";
            showView("normal");
        });
    }

    // Preset: Sampel Defect (Drift / Anomali thermal & pressure)
    if (btnPresetDefect) {
        btnPresetDefect.addEventListener("click", () => {
            if (inputTemp) inputTemp.value = "490.0";
            if (inputPressure) inputPressure.value = "680.0";
            if (inputGas) inputGas.value = "120.0";
            if (inputEtch) inputEtch.value = "135.0";
            if (inputVoltage) inputVoltage.value = "5.2";
            if (inputCurrent) inputCurrent.value = "28.0";
            if (inputStep) inputStep.value = "RIE";
            showView("defect");
        });
    }

    // Tombol Clear
    if (btnClear) {
        btnClear.addEventListener("click", () => {
            if (inputTemp) inputTemp.value = "450.0";
            if (inputPressure) inputPressure.value = "760.0";
            if (inputGas) inputGas.value = "120.0";
            if (inputEtch) inputEtch.value = "95.0";
            if (inputVoltage) inputVoltage.value = "5.0";
            if (inputCurrent) inputCurrent.value = "20.0";
            showView("empty");
        });
    }

    // Eksekusi Prediksi Supervised Model
    async function executePrediction() {
        const features = {
            temperature_c: parseFloat(inputTemp ? inputTemp.value : 450.0) || 450.0,
            pressure_torr: parseFloat(inputPressure ? inputPressure.value : 760.0) || 760.0,
            gas_flow_sccm: parseFloat(inputGas ? inputGas.value : 120.0) || 120.0,
            etch_rate_nm_min: parseFloat(inputEtch ? inputEtch.value : 95.0) || 95.0,
            voltage_v: parseFloat(inputVoltage ? inputVoltage.value : 5.0) || 5.0,
            current_ma: parseFloat(inputCurrent ? inputCurrent.value : 20.0) || 20.0,
            process_step: inputStep ? inputStep.value : "Lithography"
        };

        showView("loading");
        if (btnPredict) btnPredict.disabled = true;

        try {
            const result = await ApiClient.predictClassification(features);
            console.log("Supervised Model Result:", result);

            if (result.status === "success") {
                const isDefect = result.prediction === 1 || result.label === "Defect";
                const targetViewName = isDefect ? "defect" : "normal";
                showView(targetViewName);

                // Update angka confidence aktual dari model di dalam kartu UI
                const activeCard = views[targetViewName];
                if (activeCard) {
                    const confidenceText = activeCard.querySelector("span.font-title-md.font-bold");
                    if (confidenceText && result.confidence_percent !== undefined) {
                        confidenceText.textContent = `${result.confidence_percent}%`;
                    }
                    const progressBar = activeCard.querySelector("div.rounded-full.bg-gradient-to-r");
                    if (progressBar && result.confidence_percent !== undefined) {
                        progressBar.style.width = `${result.confidence_percent}%`;
                    }
                }
            } else if (result.status === "pending_model") {
                showView("empty");
            } else {
                showView("error");
            }
        } catch (error) {
            console.error("Supervised inference error:", error);
            showView("error");
        } finally {
            if (btnPredict) btnPredict.disabled = false;
        }
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
});
