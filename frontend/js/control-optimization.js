/**
 * Control Optimization - Q-Learning Process Control Agent
 * Connects Fab Chamber Controls to Backend Q-Learning REST API.
 */

document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing Control Optimization Q-Learning Controller...");

    // UI Sliders
    const pressureSlider = document.getElementById("pressure-slider");
    const pressureVal = document.getElementById("pressure-val");

    const flowSlider = document.getElementById("flow-slider");
    const flowVal = document.getElementById("flow-val");

    const powerSlider = document.getElementById("power-slider");
    const powerVal = document.getElementById("power-val");

    const tempSlider = document.getElementById("temp-slider");
    const tempVal = document.getElementById("temp-val");

    const timeSlider = document.getElementById("time-slider");
    const timeVal = document.getElementById("time-val");

    const rateSlider = document.getElementById("rate-slider");
    const rateVal = document.getElementById("rate-val");

    // Action Buttons
    const btnSimulate = document.getElementById("btn-recommend");
    const btnEpisodes = document.getElementById("btn-episodes");
    const btnReset = document.getElementById("btn-reset");

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

    // Action Cards (0 to 5)
    const actionCards = Array.from({ length: 6 }, (_, i) => document.getElementById(`card-action-${i}`));

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
        const p = parseFloat(pressureSlider.value);
        const f = parseFloat(flowSlider.value);
        const pow = parseFloat(powerSlider.value);
        const t = parseFloat(tempSlider.value);
        const dur = parseFloat(timeSlider.value);
        const rate = parseFloat(rateSlider.value);

        return {
            chamber_pressure: p,
            gas_flow_rate: f,
            rf_power: pow,
            wafer_temp: t,
            etch_duration: dur,
            etch_rate: rate,

            // Aliases for backend compatibility
            pressure_torr: p,
            gas_flow_sccm: f,
            rf_power_w: pow,
            temperature_c: t,
            duration_s: dur,
            etch_rate_nm_min: rate
        };
    }

    function updateSliderLabels() {
        if (pressureVal) pressureVal.textContent = `${parseFloat(pressureSlider.value).toFixed(1)} mTorr`;
        if (flowVal) flowVal.textContent = `${flowSlider.value} sccm`;
        if (powerVal) powerVal.textContent = `${powerSlider.value} W`;
        if (tempVal) tempVal.textContent = `${tempSlider.value} °C`;
        if (timeVal) timeVal.textContent = `${timeSlider.value} s`;
        if (rateVal) rateVal.textContent = `${parseFloat(rateSlider.value).toFixed(2)} nm/min`;
    }

    function updateCardHighlights(actionId, inputs) {
        const temp = inputs.wafer_temp || 200;
        const press = inputs.chamber_pressure || 15;
        const flow = inputs.gas_flow_rate || 120;

        actionCards.forEach((card, idx) => {
            if (!card) return;
            let isHighlight = false;

            if (actionId === 0) {
                // Turunkan Parameter
                if (idx === 0 && temp >= 200) isHighlight = true; // Decrease Temp
                if (idx === 3 && press >= 20) isHighlight = true; // Reduce Pressure
            } else if (actionId === 1) {
                // Pertahankan
                if (idx === 1) isHighlight = true; // Hold Steady
            } else if (actionId === 2) {
                // Naikkan Parameter
                if (idx === 2 && temp < 200) isHighlight = true; // Increase Temp
                if (idx === 4 && press < 15) isHighlight = true; // Increase Pressure
                if (idx === 5 && (flow < 110 || flow > 130)) isHighlight = true; // Adjust Gas Flow
                if (!isHighlight && idx === 2) isHighlight = true; // Default fallback for Naikkan
            }

            if (isHighlight) {
                card.className = "action-card p-4 rounded-2xl border-2 border-[#7c3aed] bg-[#f3e8ff] transition-all cursor-pointer shadow-sm";
            } else {
                card.className = "action-card p-4 rounded-2xl border-2 border-[#f1eee8] bg-[#fef9f2] hover:border-[#7c3aed] transition-all cursor-pointer";
            }
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

        // Unhighlight Action Cards
        actionCards.forEach((card) => {
            if (card) {
                card.className = "action-card p-4 rounded-2xl border-2 border-[#f1eee8] bg-[#fef9f2] hover:border-[#7c3aed] transition-all cursor-pointer";
            }
        });

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
            const response = await fetch("http://localhost:5000/api/control-optimization/simulate-step", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sensor_inputs: inputs })
            });

            if (!response.ok) {
                throw new Error(`Backend connection failed (HTTP ${response.status})`);
            }

            const data = await response.json();

            if (data.status === "success") {
                const reward = data.reward != null ? data.reward : 0.0;
                const nextFeatures = data.next_state ? data.next_state.features : {};
                const selectedAction = data.selected_action ? data.selected_action.action_name : "Pertahankan";
                const actionId = data.selected_action ? data.selected_action.action_id : 1;

                if (stepRewardVal) {
                    stepRewardVal.textContent = reward >= 0 ? `+${reward.toFixed(2)}` : `${reward.toFixed(2)}`;
                    stepRewardVal.className = reward >= 0 ? "text-base font-extrabold text-emerald-600" : "text-base font-extrabold text-rose-600";
                }

                if (nextTempVal) {
                    const nextTemp = nextFeatures.temperature_c != null ? nextFeatures.temperature_c : inputs.wafer_temp;
                    nextTempVal.textContent = `${nextTemp.toFixed(1)} °C`;
                    nextTempVal.className = "text-base font-extrabold text-[#7c3aed]";
                }

                if (stepEvalText) {
                    const evalMsg = data.evaluation || "Action menghasilkan reward berdasarkan reward function.";
                    stepEvalText.textContent = `[${selectedAction}] - ${evalMsg}`;
                    stepEvalText.className = "text-xs text-[#4a4455] bg-[#f8f4ee] p-3 rounded-xl border border-[#e2dcd2]";
                }

                // Highlight Action Cards dynamically based on selected action and features
                updateCardHighlights(actionId, inputs);

                // If output environment updated etch rate
                if (nextFeatures.etch_rate_nm_min != null && rateSlider) {
                    rateSlider.value = nextFeatures.etch_rate_nm_min;
                    updateSliderLabels();
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
            const response = await fetch("http://localhost:5000/api/control-optimization/simulate-episodes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sensor_inputs: inputs, num_episodes: 10 })
            });

            if (!response.ok) {
                throw new Error(`Backend connection failed (HTTP ${response.status})`);
            }

            const data = await response.json();

            if (data.status === "success" && (data.episode_rewards || data.episodes)) {
                const rewards = data.episode_rewards || (data.episodes ? data.episodes.map(e => e.reward) : []);
                const numEp = data.num_episodes || rewards.length;
                const finalReward = data.final_reward != null ? data.final_reward : (rewards.length > 0 ? rewards[rewards.length - 1] : 0.0);
                const avgReward = data.average_reward != null ? data.average_reward : (rewards.length > 0 ? (rewards.reduce((a, b) => a + b, 0) / rewards.length) : 0.0);

                // Update Chart dataset cleanly with 10 actual episode data points
                if (rewardChart) {
                    rewardChart.data.labels = rewards.map((_, i) => `Ep ${i + 1}`);
                    rewardChart.data.datasets[0].data = rewards;
                    rewardChart.update();
                }

                // Update Summary Panel
                if (epCountVal) epCountVal.textContent = numEp;
                if (finalRewardVal) {
                    finalRewardVal.textContent = finalReward >= 0 ? `+${finalReward.toFixed(2)}` : `${finalReward.toFixed(2)}`;
                    finalRewardVal.className = finalReward >= 0 ? "text-lg font-extrabold text-emerald-600" : "text-lg font-extrabold text-rose-600";
                }
                if (avgRewardVal) {
                    avgRewardVal.textContent = avgReward >= 0 ? `+${avgReward.toFixed(2)}` : `${avgReward.toFixed(2)}`;
                    avgRewardVal.className = avgReward >= 0 ? "text-lg font-extrabold text-[#7c3aed]" : "text-lg font-extrabold text-rose-600";
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

    function resetRecipe() {
        hideError();

        // Reset Sliders to Default Nominal Values
        if (pressureSlider) pressureSlider.value = 15.0;
        if (flowSlider) flowSlider.value = 120;
        if (powerSlider) powerSlider.value = 850;
        if (tempSlider) tempSlider.value = 200;
        if (timeSlider) timeSlider.value = 60;
        if (rateSlider) rateSlider.value = 1.20;

        // Reset UI to Fresh Idle State
        initFreshState();
    }

    // Slider Event Listeners (Only Update Display Values, Do NOT Trigger API or Plot Data)
    [pressureSlider, flowSlider, powerSlider, tempSlider, timeSlider, rateSlider].forEach(slider => {
        if (slider) {
            slider.addEventListener("input", updateSliderLabels);
        }
    });

    // Attach Event Listeners to Buttons
    if (btnSimulate) btnSimulate.addEventListener("click", simulateSingleStep);
    if (btnEpisodes) btnEpisodes.addEventListener("click", runTenEpisodes);
    if (btnReset) btnReset.addEventListener("click", resetRecipe);

    // Initial Fresh Load State (No automatic API trigger)
    initFreshState();
});
