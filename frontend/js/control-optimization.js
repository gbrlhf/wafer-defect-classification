/**
 * Control Optimization Page JavaScript
 * Connects In-situ Semiconductor Process Control UI to Reinforcement Learning (Q-Table)
 * Backend API.
 */
document.addEventListener("DOMContentLoaded", () => {
    // Sliders & Value Labels
    const tempSlider = document.getElementById("temp-slider");
    const tempVal = document.getElementById("temp-val");

    const pressureSlider = document.getElementById("pressure-slider");
    const pressureVal = document.getElementById("pressure-val");

    const flowSlider = document.getElementById("flow-slider");
    const flowVal = document.getElementById("flow-val");

    const rfSlider = document.getElementById("rf-power-slider");
    const rfVal = document.getElementById("rf-power-val");

    const durationSlider = document.getElementById("duration-slider");
    const durationVal = document.getElementById("duration-val");

    // Action Buttons
    const btnStep = document.getElementById("btn-step");
    const btnEpisodes = document.getElementById("btn-episodes");
    const btnReset = document.getElementById("btn-reset");

    // UI Target Display Elements
    const actionCardTitle = document.querySelector(".font-headline-sm.text-headline-sm.text-on-surface");
    const actionRationale = document.querySelector(".font-body-md.text-body-md.text-on-surface-variant.bg-surface-container-lowest\/70");
    const policyTensorText = document.querySelector(".font-label-sm.text-label-sm.text-on-surface-variant.mt-space-md, div.mt-space-md span.font-label-sm");
    const confidenceBadge = document.querySelector(".font-label-lg.text-label-lg.text-primary.font-bold");
    const actionButtons = document.querySelectorAll("#action-grid button");

    // Debounce timer for smooth slider dragging
    let debounceTimer = null;

    function getSensorInputs() {
        return {
            temperature_c: parseFloat(tempSlider ? tempSlider.value : 412),
            pressure_torr: parseFloat(pressureSlider ? (pressureSlider.value / 10).toFixed(1) : 18.4),
            gas_flow_sccm: parseFloat(flowSlider ? flowSlider.value : 105),
            voltage_v: parseFloat(rfSlider ? (rfSlider.value / 180).toFixed(2) : 4.7),
            etch_rate_nm_min: parseFloat(durationSlider ? durationSlider.value : 68) * 1.3
        };
    }

    async function evaluateRLPolicy() {
        const inputs = getSensorInputs();

        try {
            const response = await ApiClient.predictControl(inputs);
            console.log("RL Response from Backend:", response);

            if (response.status === "success") {
                updateUIWithRLRecommendation(response);
            }
        } catch (error) {
            console.error("Failed to query RL control API:", error);
        }
    }

    function updateUIWithRLRecommendation(data) {
        // Update Title
        if (actionCardTitle) {
            actionCardTitle.textContent = data.action_title || `Recommended Action: ${data.action_name}`;
        }

        // Update Rationale
        if (actionRationale) {
            actionRationale.innerHTML = `<strong class="text-on-surface">Agent Rationale:</strong> ${data.rationale}`;
        }

        // Update Policy Tensor
        if (policyTensorText) {
            policyTensorText.textContent = data.policy_tensor || `State #${data.state_index}`;
        }

        // Update Confidence
        if (confidenceBadge) {
            confidenceBadge.textContent = `${data.confidence_percent}%`;
        }

        // Highlight matching button in Action Space Grid
        highlightActionButton(data.action_name);
    }

    function highlightActionButton(actionName) {
        actionButtons.forEach(btn => {
            const btnText = btn.textContent.toLowerCase();
            let matches = false;

            if (actionName === "Turunkan Parameter") {
                matches = btnText.includes("decrease") || btnText.includes("reduce") || btnText.includes("turunkan");
            } else if (actionName === "Pertahankan") {
                matches = btnText.includes("hold") || btnText.includes("steady") || btnText.includes("pertahankan");
            } else if (actionName === "Naikkan Parameter") {
                matches = btnText.includes("increase") || btnText.includes("adjust") || btnText.includes("naikkan");
            }

            if (matches) {
                btn.className = "p-space-md rounded-2xl bg-primary-fixed text-on-primary-fixed ring-2 ring-primary transition-all text-left flex flex-col gap-1 shadow-md scale-[1.02]";
            } else {
                btn.className = "p-space-md rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-all text-left flex flex-col gap-1 active:scale-[0.98]";
            }
        });
    }

    function setupSlider(slider, labelEl, transformFn) {
        if (!slider || !labelEl) return;
        slider.addEventListener("input", (e) => {
            const val = transformFn ? transformFn(e.target.value) : e.target.value;
            labelEl.textContent = val;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                evaluateRLPolicy();
            }, 250);
        });
    }

    setupSlider(tempSlider, tempVal, v => v);
    setupSlider(pressureSlider, pressureVal, v => (v / 10).toFixed(1));
    setupSlider(flowSlider, flowVal, v => v);
    setupSlider(rfSlider, rfVal, v => v);
    setupSlider(durationSlider, durationVal, v => v);

    // Initial evaluation on load
    evaluateRLPolicy();

    // Simulate Process Control (Step)
    if (btnStep) {
        btnStep.addEventListener("click", async () => {
            btnStep.classList.add("scale-95");
            setTimeout(() => btnStep.classList.remove("scale-95"), 150);

            // Fetch recommendation
            await evaluateRLPolicy();

            // Simulate slight adjustment in sensor telemetry towards target
            if (tempSlider && tempVal) {
                let cur = parseFloat(tempSlider.value);
                if (cur > 415) cur -= 2;
                else if (cur < 410) cur += 2;
                tempSlider.value = cur;
                tempVal.textContent = cur;
            }

            if (pressureSlider && pressureVal) {
                let cur = parseFloat(pressureSlider.value);
                if (cur > 160) cur -= 5;
                pressureSlider.value = cur;
                pressureVal.textContent = (cur / 10).toFixed(1);
            }
        });
    }

    // Run 10 Episodes simulation
    if (btnEpisodes) {
        btnEpisodes.addEventListener("click", async () => {
            btnEpisodes.disabled = true;
            for (let i = 0; i < 5; i++) {
                if (btnStep) btnStep.click();
                await new Promise(r => setTimeout(r, 400));
            }
            btnEpisodes.disabled = false;
        });
    }

    // Reset Values
    if (btnReset) {
        btnReset.addEventListener("click", () => {
            if (tempSlider) { tempSlider.value = 412; if (tempVal) tempVal.textContent = "412"; }
            if (pressureSlider) { pressureSlider.value = 184; if (pressureVal) pressureVal.textContent = "18.4"; }
            if (flowSlider) { flowSlider.value = 105; if (flowVal) flowVal.textContent = "105"; }
            if (rfSlider) { rfSlider.value = 850; if (rfVal) rfVal.textContent = "850"; }
            if (durationSlider) { durationSlider.value = 68; if (durationVal) durationVal.textContent = "68"; }
            evaluateRLPolicy();
        });
    }
});
