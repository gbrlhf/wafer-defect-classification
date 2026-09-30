/**
 * Classification Page JavaScript
 */
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("classification-form");
    const btnPredict = document.getElementById("btn-predict");
    const spinner = document.getElementById("predict-spinner");
    const btnText = document.getElementById("predict-btn-text");
    const resultContainer = document.getElementById("classification-result");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Gather feature inputs from form
        const featureElements = form.querySelectorAll("[data-feature-key]");
        const features = {};

        featureElements.forEach(el => {
            const key = el.getAttribute("data-feature-key");
            const val = el.value.trim();
            if (val !== "") {
                const num = parseFloat(val);
                features[key] = isNaN(num) ? val : num;
            }
        });

        // Toggle loading state
        btnPredict.disabled = true;
        if (spinner) spinner.classList.remove("d-none");
        if (btnText) btnText.textContent = "Running Inference...";

        try {
            const response = await ApiClient.predictClassification(features);
            renderResult(response);
        } catch (error) {
            console.error("Classification error:", error);
            renderError("Failed to communicate with ML backend API. Ensure FastAPI is running on port 8001.");
        } finally {
            btnPredict.disabled = false;
            if (spinner) spinner.classList.add("d-none");
            if (btnText) btnText.textContent = "Predict Defect";
        }
    });

    function renderResult(data) {
        if (!resultContainer) return;
        resultContainer.classList.remove("d-none");

        if (data.status === "pending_model") {
            resultContainer.innerHTML = `
                <div class="alert alert-warning border-0 p-4" role="alert">
                    <div class="d-flex align-items-center gap-3 mb-2">
                        <i class="bi bi-exclamation-triangle-fill fs-3 text-warning"></i>
                        <h5 class="mb-0 fw-bold">Model Belum Di-deploy</h5>
                    </div>
                    <p class="mb-2 text-light">${data.message}</p>
                    <hr class="border-secondary opacity-25">
                    <p class="mb-0 small text-light opacity-75">
                        <i class="bi bi-info-circle me-1"></i>
                        Selesaikan proses pelatihan supervised learning pada <strong>Google Colab</strong>, 
                        ekspor file <code>classifier.joblib</code>, dan simpan pada direktori <code>backend/app/models/</code>.
                    </p>
                </div>
            `;
            return;
        }

        if (data.status === "success") {
            const confidencePercent = data.confidence ? Math.round(data.confidence * 100) : null;
            resultContainer.innerHTML = `
                <div class="card card-custom p-4 border-primary">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <span class="badge badge-custom badge-custom-blue mb-2">Supervised Classification</span>
                            <h4 class="mb-0 text-white">Hasil Prediksi Defect</h4>
                        </div>
                        <span class="badge badge-custom badge-custom-green fs-6">
                            <i class="bi bi-check-circle-fill me-1"></i> Inferred
                        </span>
                    </div>

                    <div class="p-3 my-3 rounded-3" style="background-color: rgba(15, 23, 42, 0.7); border: 1px solid var(--border-color);">
                        <div class="small text-secondary mb-1">Klasifikasi Defect Terdeteksi:</div>
                        <div class="fs-2 fw-bold text-info">${data.prediction || 'Unknown'}</div>
                    </div>

                    ${confidencePercent !== null ? `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between text-secondary small mb-1">
                            <span>Confidence Level / Probabilitas:</span>
                            <span class="text-white fw-bold">${confidencePercent}%</span>
                        </div>
                        <div class="progress" style="height: 10px; background-color: var(--bg-dark);">
                            <div class="progress-bar bg-primary" role="progressbar" style="width: ${confidencePercent}%;" aria-valuenow="${confidencePercent}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>` : ''}

                    <p class="text-secondary small mb-0">
                        <i class="bi bi-shield-check text-success me-1"></i> Model inference dieksekusi oleh Scikit-learn backend.
                    </p>
                </div>
            `;
            return;
        }

        // Generic error
        renderError(data.message || "An unexpected error occurred during prediction.");
    }

    function renderError(message) {
        if (!resultContainer) return;
        resultContainer.classList.remove("d-none");
        resultContainer.innerHTML = `
            <div class="alert alert-danger border-0 p-3" role="alert">
                <i class="bi bi-x-circle-fill me-2"></i> ${message}
            </div>
        `;
    }
});
