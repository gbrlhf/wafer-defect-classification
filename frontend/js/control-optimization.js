/**
 * Control Optimization - Q-Learning Process Control Agent
 * Robust Frontend Controller connecting UI to Backend REST API.
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing Control Optimization Q-Learning Controller...");

    // Dynamic API Base URL detection
    const API_BASE = (typeof window.API_BASE_URL !== "undefined")
        ? window.API_BASE_URL
        : (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            ? "http://localhost:5000/api"
            : "/api");

    // UI Sliders (dataset-scale features, same keys as Classification module)
    const tempSlider = document.getElementById("temp-slider");
    const tempVal = document.getElementById("temp-val");

    const pressureSlider = document.getElementById("pressure-slider");
    const pressureVal = document.getElementById("pressure-val");

    const flowSlider = document.getElementById("flow-slider");
    const flowVal = document.getElementById("flow-val");

    const rateSlider = document.getElementById("rate-slider");
    const rateVal = document.getElementById("rate-val");

    const voltageSlider = document.getElementById("voltage-slider");
    const voltageVal = document.getElementById("voltage-val");

    const currentSlider = document.getElementById("current-slider");
    const currentVal = document.getElementById("current-val");

    const SLIDER_FIELDS = [
        { slider: tempSlider, label: tempVal, key: "temperature_c", unit: "°C", decimals: 0 },
        { slider: pressureSlider, label: pressureVal, key: "pressure_torr", unit: "Torr", decimals: 0 },
        { slider: flowSlider, label: flowVal, key: "gas_flow_sccm", unit: "sccm", decimals: 0 },
        { slider: rateSlider, label: rateVal, key: "etch_rate_nm_min", unit: "nm/min", decimals: 0 },
        { slider: voltageSlider, label: voltageVal, key: "voltage_v", unit: "V", decimals: 1 },
        { slider: currentSlider, label: currentVal, key: "current_ma", unit: "mA", decimals: 0 }
    ];

    // Action Buttons
    const btnSimulate = document.getElementById("btn-recommend");
    const btnEpisodes = document.getElementById("btn-episodes");
    const btnReset = document.getElementById("btn-reset");

    // Policy Recommendation Line Elements
    const recActionText = document.getElementById("recommendation-action");
    const recStatusText = document.getElementById("recommendation-status");
    const recNoteText = document.getElementById("recommendation-note");
    const recDirectionText = document.getElementById("recommendation-direction");

    // Direction of each action on the controllable parameters (step sizes come from backend metadata)
    const ACTION_DIRECTIONS = {
        0: "(menurunkan temperature, pressure, gas flow)",
        1: "(parameter tidak diubah)",
        2: "(menaikkan temperature, pressure, gas flow)"
    };

    // Simulation Step Output Display Elements
    const stepRewardVal = document.getElementById("step-reward-val");
    const nextTempVal = document.getElementById("next-temp-val");
    const stepEvalText = document.getElementById("step-eval-text");

    // Episodes Summary Metrics
    const epCountVal = document.getElementById("episodes-count-val");
    const finalRewardVal = document.getElementById("final-reward-val");
    const avgRewardVal = document.getElementById("avg-reward-val");

    // Error Container
    const errorContainer = document.getElementById("error-notification");
    const errorMsgText = document.getElementById("error-message-text");
    const btnCloseError = document.getElementById("btn-close-error");

    // Chart Setup
    let rewardChart = null;
    const canvas = document.getElementById("rewardCanvas");

    function initChart() {
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        rewardChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Q-Learning Reward per Episode',
                    data: [],
                    borderColor: '#7c3aed',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointBackgroundColor: '#7c3aed',
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { color: '#6b6575', font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
                    },
                    y: {
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { color: '#6b6575', font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Reward: ${context.parsed.y.toFixed(2)}`
                        }
                    }
                }
            }
        });
    }

    initChart();

    function showError(msg) {
        if (errorContainer && errorMsgText) {
            errorMsgText.textContent = msg;
            errorContainer.classList.remove("hidden");
        }
    }

    function hideError() {
        if (errorContainer) {
            errorContainer.classList.add("hidden");
        }
    }

    if (btnCloseError) {
        btnCloseError.addEventListener("click", hideError);
    }

    function getSensorInputs() {
        const inputs = {};
        SLIDER_FIELDS.forEach(({ slider, key }) => {
            if (slider) inputs[key] = parseFloat(slider.value);
        });
        return inputs;
    }

    function updateSliderLabels() {
        SLIDER_FIELDS.forEach(({ slider, label, unit, decimals }) => {
            if (slider && label) label.textContent = `${parseFloat(slider.value).toFixed(decimals)} ${unit}`;
        });
    }

    // Set UI to Clean Fresh/Idle Initial State
    function initFreshState() {
        hideError();
        updateSliderLabels();

        // Simulation Step Output Idle State
        if (stepRewardVal) {
            stepRewardVal.textContent = "-";
            stepRewardVal.className = "text-base font-extrabold text-gray-400";
        }
        if (nextTempVal) {
            nextTempVal.textContent = "-";
            nextTempVal.className = "text-base font-extrabold text-gray-400";
        }
        if (stepEvalText) {
            stepEvalText.textContent = "Simulasi belum dijalankan.";
            stepEvalText.className = "text-xs text-[#6b6575] bg-[#f8f4ee] p-3 rounded-xl border border-[#e2dcd2]";
        }

        // Episodes Summary Panel Idle State
        if (epCountVal) epCountVal.textContent = "0";
        if (finalRewardVal) {
            finalRewardVal.textContent = "-";
            finalRewardVal.className = "text-lg font-extrabold text-gray-400";
        }
        if (avgRewardVal) {
            avgRewardVal.textContent = "-";
            avgRewardVal.className = "text-lg font-extrabold text-gray-400";
        }

        // Clear Convergence Chart Data
        if (rewardChart) {
            rewardChart.data.labels = [];
            rewardChart.data.datasets[0].data = [];
            delete rewardChart.options.scales.y.suggestedMin;
            delete rewardChart.options.scales.y.suggestedMax;
            rewardChart.update();
        }
    }

    async function simulateSingleStep() {
        hideError();
        const inputs = getSensorInputs();

        if (btnSimulate) {
            btnSimulate.disabled = true;
            btnSimulate.innerHTML = `<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Simulating...`;
        }

        try {
            const response = await fetch(`${API_BASE}/control-optimization/simulate-step`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sensor_inputs: inputs })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || `Backend connection failed (HTTP ${response.status})`);
            }

            if (data.status === "success") {
                const reward = data.reward;
                const nextFeatures = data.next_state ? data.next_state.features : {};
                const selectedAction = data.selected_action ? data.selected_action.action_name : "-";
                const matchLabel = data.q_table_match_label || "-";

                if (stepRewardVal) {
                    if (reward != null) {
                        stepRewardVal.textContent = reward >= 0 ? `+${reward.toFixed(2)}` : `${reward.toFixed(2)}`;
                        stepRewardVal.className = reward >= 0 ? "text-base font-extrabold text-emerald-600" : "text-base font-extrabold text-rose-600";
                    } else {
                        stepRewardVal.textContent = "-";
                        stepRewardVal.className = "text-base font-extrabold text-gray-400";
                    }
                }

                if (nextTempVal) {
                    const { temperature_c: nextTemp, pressure_torr: nextPress, gas_flow_sccm: nextFlow } = nextFeatures;
                    if (nextTemp != null && nextPress != null && nextFlow != null) {
                        nextTempVal.textContent = `${nextTemp.toFixed(1)} °C · ${nextPress.toFixed(0)} Torr · ${nextFlow.toFixed(1)} sccm`;
                        nextTempVal.className = "text-sm font-extrabold text-[#7c3aed]";
                    } else {
                        nextTempVal.textContent = "-";
                        nextTempVal.className = "text-base font-extrabold text-gray-400";
                    }
                }

                if (stepEvalText) {
                    const evalMsg = data.evaluation || "";
                    stepEvalText.textContent = `[Action: ${selectedAction} · ${matchLabel}] ${evalMsg}`;
                    stepEvalText.className = "text-xs font-semibold text-[#1d1c18] bg-[#f8f4ee] p-3 rounded-xl border border-[#e2dcd2]";
                }
            } else {
                showError(data.message || "Invalid response from Control Optimization API.");
            }
        } catch (err) {
            console.error("Step Simulation Error:", err);
            showError(`Simulation failed: ${err.message}`);
        } finally {
            if (btnSimulate) {
                btnSimulate.disabled = false;
                btnSimulate.innerHTML = `<span class="material-symbols-outlined text-lg">play_arrow</span> Simulate Process Control`;
            }
        }
    }

    async function runTenEpisodes() {
        hideError();
        const inputs = getSensorInputs();

        if (btnEpisodes) {
            btnEpisodes.disabled = true;
            btnEpisodes.innerHTML = `<span class="material-symbols-outlined animate-spin text-lg">progress_activity</span> Evaluating 10 Ep...`;
        }

        try {
            const response = await fetch(`${API_BASE}/control-optimization/simulate-episodes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sensor_inputs: inputs, num_episodes: 10 })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || `Backend connection failed (HTTP ${response.status})`);
            }

            if (data.status === "success" && (data.episode_rewards || data.episodes)) {
                const rewards = data.episode_rewards || (data.episodes ? data.episodes.map(e => e.reward) : []);
                const numEp = data.total_episodes || data.num_episodes || rewards.length;
                const finalReward = data.final_reward;
                const avgReward = data.average_reward;

                // Update Chart dataset cleanly with 10 actual episode data points
                if (rewardChart) {
                    rewardChart.data.labels = rewards.map((_, i) => `Ep ${i + 1}`);
                    rewardChart.data.datasets[0].data = rewards;
                    
                    // Dynamically set Y-axis bounds to prevent 0.01 micro-fluctuations from looking like huge spikes
                    const minR = Math.min(...rewards);
                    const maxR = Math.max(...rewards);
                    if (maxR - minR < 1.0) {
                        rewardChart.options.scales.y.suggestedMin = Math.floor(minR) - 1;
                        rewardChart.options.scales.y.suggestedMax = Math.ceil(maxR) + 1;
                    } else {
                        delete rewardChart.options.scales.y.suggestedMin;
                        delete rewardChart.options.scales.y.suggestedMax;
                    }

                    rewardChart.update();
                }

                // Update Summary Panel
                if (epCountVal) epCountVal.textContent = numEp;
                if (finalRewardVal) {
                    if (finalReward != null) {
                        finalRewardVal.textContent = finalReward >= 0 ? `+${finalReward.toFixed(2)}` : `${finalReward.toFixed(2)}`;
                        finalRewardVal.className = finalReward >= 0 ? "text-lg font-extrabold text-emerald-600" : "text-lg font-extrabold text-rose-600";
                    } else {
                        finalRewardVal.textContent = "-";
                        finalRewardVal.className = "text-lg font-extrabold text-gray-400";
                    }
                }
                if (avgRewardVal) {
                    if (avgReward != null) {
                        avgRewardVal.textContent = avgReward >= 0 ? `+${avgReward.toFixed(2)}` : `${avgReward.toFixed(2)}`;
                        avgRewardVal.className = avgReward >= 0 ? "text-lg font-extrabold text-[#7c3aed]" : "text-lg font-extrabold text-rose-600";
                    } else {
                        avgRewardVal.textContent = "-";
                        avgRewardVal.className = "text-lg font-extrabold text-gray-400";
                    }
                }
            } else {
                showError(data.message || "Invalid response from Control Optimization API.");
            }
        } catch (err) {
            console.error("Run Episodes Error:", err);
            showError(`Simulation failed: ${err.message}`);
        } finally {
            if (btnEpisodes) {
                btnEpisodes.disabled = false;
                btnEpisodes.innerHTML = `<span class="material-symbols-outlined text-lg">view_timeline</span> Run 10 Episodes`;
            }
        }
    }

    function renderRecommendation(data) {
        const ok = data && data.status === "success" && data.action_name;
        if (recActionText) recActionText.textContent = ok ? data.action_name : "-";
        if (recDirectionText) {
            const direction = ok ? (ACTION_DIRECTIONS[data.action_id] || "") : "";
            recDirectionText.textContent = direction;
            recDirectionText.classList.toggle("hidden", !direction);
        }
        if (recStatusText) {
            recStatusText.textContent = ok ? (data.q_table_match_label || "") : "";
            recStatusText.classList.toggle("hidden", !(ok && data.q_table_match_label));
        }
        if (recNoteText) {
            const untrained = ok && data.q_table_match_status === "UNTRAINED";
            const distance = untrained && data.match_distance != null ? `, jarak ${data.match_distance} bin` : "";
            recNoteText.textContent = untrained ? `(state belum terlatih, memakai state terlatih terdekat${distance})` : "";
            recNoteText.classList.toggle("hidden", !untrained);
        }
    }

    // Only the latest request may update the line (older, slower responses are ignored)
    let recRequestSeq = 0;
    async function updateRecommendation() {
        const seq = ++recRequestSeq;
        let data = null;
        try {
            const response = await fetch(`${API_BASE}/control-optimization/recommend`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sensor_inputs: getSensorInputs() })
            });
            data = response.ok ? await response.json() : null;
        } catch (_) {
            data = null;
        }
        if (seq === recRequestSeq) renderRecommendation(data);
    }

    let recDebounceTimer = null;
    function scheduleRecommendation() {
        clearTimeout(recDebounceTimer);
        recDebounceTimer = setTimeout(updateRecommendation, 300);
    }

    function resetRecipe() {
        hideError();

        // Reset Sliders to the default values declared in the HTML
        SLIDER_FIELDS.forEach(({ slider }) => {
            if (slider) slider.value = slider.defaultValue;
        });

        // Reset UI to Fresh Idle State
        initFreshState();

        // Refresh recommendation line for the default inputs
        clearTimeout(recDebounceTimer);
        updateRecommendation();
    }

    // Slider Event Listeners (update display values + debounced recommendation)
    SLIDER_FIELDS.forEach(({ slider }) => {
        if (slider) {
            slider.addEventListener("input", () => {
                updateSliderLabels();
                scheduleRecommendation();
            });
        }
    });

    // Attach Event Listeners to Buttons
    if (btnSimulate) btnSimulate.addEventListener("click", simulateSingleStep);
    if (btnEpisodes) btnEpisodes.addEventListener("click", runTenEpisodes);
    if (btnReset) btnReset.addEventListener("click", resetRecipe);

    // Initial Fresh Load State (only the recommendation line is fetched automatically)
    initFreshState();
    updateRecommendation();
});
