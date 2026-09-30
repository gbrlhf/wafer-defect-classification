/**
 * Control Optimization Page JavaScript
 * Connects In-situ Semiconductor Process Control UI to Reinforcement Learning (Q-Table)
 * Backend API.
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing Control Optimization RL controller...");

    // Helper to safely find elements by tag and text content
    function findElementByText(tag, textSnippet) {
        return Array.from(document.querySelectorAll(tag)).find(el => 
            el.textContent && el.textContent.includes(textSnippet)
        );
    }

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

    // UI Target Display Elements (Safe Selection)
    // 1. Recommendation Card Title (h3 with "Recommended Action")
    const actionCardTitle = findElementByText("h3", "Recommended Action") || document.querySelector("h3.font-headline-sm");
    
    // 2. Rationale element (p containing "Agent Rationale")
    const actionRationale = findElementByText("p", "Agent Rationale") || document.querySelector(".bg-gradient-to-br p");
    
    // 3. Policy Output Tensor element (span containing "Policy Output Tensor")
    const policyTensorText = findElementByText("span", "Policy Output Tensor") || findElementByText("span", "Policy Output");
    
    // 4. Confidence Badge (span containing percentage inside recommendation card)
    let confidenceBadge = null;
    const confLabel = findElementByText("span", "Confidence Level");
    if (confLabel && confLabel.parentElement) {
        confidenceBadge = confLabel.parentElement.querySelector("span:last-child");
    }

    // 5. Execute Action Button
    const btnExecute = findElementByText("button", "Execute Action");

    // 6. Action Space Grid buttons
    const actionButtons = document.querySelectorAll("#action-grid button");

    // 7. Middle Metrics Cards (Markov Dynamics)
    const metricCards = document.querySelectorAll(".grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 > div");
    const stateMetricValue = metricCards.length > 0 ? metricCards[0].querySelector(".font-title-md") : null;
    const rewardMetricValue = metricCards.length > 2 ? metricCards[2].querySelector(".font-title-md") : null;
    const statusMetricValue = metricCards.length > 3 ? metricCards[3].querySelector(".font-title-md") : null;

    // 8. Preset Dropdowns
    const presetSelects = document.querySelectorAll("select");
    const statePresetSelect = presetSelects.length > 0 ? presetSelects[0] : null;

    // Debounce timer for smooth slider dragging
    let debounceTimer = null;
    let isEvaluating = false;

    function getSensorInputs() {
        return {
            temperature_c: parseFloat(tempSlider ? tempSlider.value : 412),
            pressure_torr: parseFloat(pressureSlider ? (parseFloat(pressureSlider.value) / 10).toFixed(1) : 18.4),
            gas_flow_sccm: parseFloat(flowSlider ? flowSlider.value : 105),
            voltage_v: parseFloat(rfSlider ? (parseFloat(rfSlider.value) / 180).toFixed(2) : 4.7),
            etch_rate_nm_min: parseFloat(durationSlider ? durationSlider.value : 68) * 1.3
        };
    }

    async function evaluateRLPolicy() {
        if (isEvaluating) return;
        isEvaluating = true;

        const inputs = getSensorInputs();
        console.log("Evaluating RL Policy with inputs:", inputs);

        try {
            const response = await ApiClient.predictControl(inputs);
            console.log("RL Response from Backend:", response);

            if (response && response.status === "success") {
                updateUIWithRLRecommendation(response);
            }
        } catch (error) {
            console.error("Failed to query RL control API:", error);
        } finally {
            isEvaluating = false;
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

        // Update Middle Section (Markov Dynamics)
        if (stateMetricValue) {
            if (data.action_name === "Pertahankan") {
                stateMetricValue.textContent = `State #${data.state_index} (Nominal)`;
            } else {
                stateMetricValue.textContent = `State #${data.state_index} (Drift)`;
            }
        }

        if (rewardMetricValue && data.q_values) {
            const bestQ = Math.max(...Object.values(data.q_values));
            rewardMetricValue.textContent = `+${bestQ.toFixed(2)} Q-val`;
        }

        if (statusMetricValue) {
            statusMetricValue.textContent = data.action_name === "Pertahankan" 
                ? "Optimal Yield: 99.4%" 
                : "Correction Active";
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
            }, 180);
        });
    }

    // Connect Sliders
    setupSlider(tempSlider, tempVal, v => v);
    setupSlider(pressureSlider, pressureVal, v => (parseFloat(v) / 10).toFixed(1));
    setupSlider(flowSlider, flowVal, v => v);
    setupSlider(rfSlider, rfVal, v => v);
    setupSlider(durationSlider, durationVal, v => v);

    // Initial evaluation on load
    evaluateRLPolicy();

    // Action function to simulate convergence toward optimal target
    function stepSimulation() {
        if (tempSlider && tempVal) {
            let cur = parseFloat(tempSlider.value);
            if (cur > 420) cur = Math.max(420, cur - 3);
            else if (cur < 420) cur = Math.min(420, cur + 3);
            tempSlider.value = cur;
            tempVal.textContent = cur;
        }

        if (pressureSlider && pressureVal) {
            let cur = parseFloat(pressureSlider.value);
            // Target nominal is 15.0 mTorr (slider 150)
            if (cur > 150) cur = Math.max(150, cur - 8);
            else if (cur < 150) cur = Math.min(150, cur + 8);
            pressureSlider.value = cur;
            pressureVal.textContent = (cur / 10).toFixed(1);
        }

        if (flowSlider && flowVal) {
            let cur = parseFloat(flowSlider.value);
            if (cur > 120) cur = Math.max(120, cur - 5);
            else if (cur < 120) cur = Math.min(120, cur + 5);
            flowSlider.value = cur;
            flowVal.textContent = cur;
        }

        evaluateRLPolicy();
    }

    // Simulate Process Control (Step)
    if (btnStep) {
        btnStep.addEventListener("click", () => {
            btnStep.classList.add("scale-95");
            setTimeout(() => btnStep.classList.remove("scale-95"), 150);
            stepSimulation();
        });
    }

    // Execute Action Button (inside recommendation card)
    if (btnExecute) {
        btnExecute.addEventListener("click", () => {
            btnExecute.classList.add("scale-95");
            setTimeout(() => btnExecute.classList.remove("scale-95"), 150);
            stepSimulation();
        });
    }

    // Run 10 Episodes simulation
    if (btnEpisodes) {
        btnEpisodes.addEventListener("click", async () => {
            btnEpisodes.disabled = true;
            btnEpisodes.classList.add("opacity-70");
            for (let i = 0; i < 6; i++) {
                stepSimulation();
                await new Promise(r => setTimeout(r, 350));
            }
            btnEpisodes.classList.remove("opacity-70");
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

    // Connect Initial State Formulation Preset Selector
    if (statePresetSelect) {
        statePresetSelect.addEventListener("change", (e) => {
            const selected = e.target.value;
            if (selected.includes("Thermal Drift")) {
                if (tempSlider) { tempSlider.value = 435; if (tempVal) tempVal.textContent = "435"; }
                if (pressureSlider) { pressureSlider.value = 195; if (pressureVal) pressureVal.textContent = "19.5"; }
            } else if (selected.includes("Pressure Surge")) {
                if (pressureSlider) { pressureSlider.value = 240; if (pressureVal) pressureVal.textContent = "24.0"; }
            } else if (selected.includes("Nominal Center")) {
                if (tempSlider) { tempSlider.value = 420; if (tempVal) tempVal.textContent = "420"; }
                if (pressureSlider) { pressureSlider.value = 150; if (pressureVal) pressureVal.textContent = "15.0"; }
                if (flowSlider) { flowSlider.value = 120; if (flowVal) flowVal.textContent = "120"; }
            } else if (selected.includes("Radial")) {
                if (tempSlider) { tempSlider.value = 398; if (tempVal) tempVal.textContent = "398"; }
                if (flowSlider) { flowSlider.value = 90; if (flowVal) flowVal.textContent = "90"; }
            }
            evaluateRLPolicy();
        });
    }

    // Connect manual clicks on action grid buttons
    actionButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const text = btn.textContent.toLowerCase();
            if (text.includes("increase temp") && tempSlider) {
                tempSlider.value = Math.min(440, parseFloat(tempSlider.value) + 5);
                if (tempVal) tempVal.textContent = tempSlider.value;
            } else if (text.includes("decrease temp") && tempSlider) {
                tempSlider.value = Math.max(390, parseFloat(tempSlider.value) - 5);
                if (tempVal) tempVal.textContent = tempSlider.value;
            } else if (text.includes("increase pressure") && pressureSlider) {
                pressureSlider.value = Math.min(250, parseFloat(pressureSlider.value) + 20);
                if (pressureVal) pressureVal.textContent = (parseFloat(pressureSlider.value) / 10).toFixed(1);
            } else if (text.includes("reduce pressure") && pressureSlider) {
                pressureSlider.value = Math.max(100, parseFloat(pressureSlider.value) - 20);
                if (pressureVal) pressureVal.textContent = (parseFloat(pressureSlider.value) / 10).toFixed(1);
            } else if (text.includes("adjust gas") && flowSlider) {
                flowSlider.value = Math.min(150, parseFloat(flowSlider.value) + 10);
                if (flowVal) flowVal.textContent = flowSlider.value;
            }
            evaluateRLPolicy();
        });
    });
});
