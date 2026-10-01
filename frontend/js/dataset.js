/**
 * Dataset Explorer JavaScript
 */
document.addEventListener("DOMContentLoaded", async () => {
    const dsNameEl = document.getElementById("ds-name");
    const dsSourceEl = document.getElementById("ds-source");
    const dsSamplesEl = document.getElementById("ds-samples");
    const dsFeaturesEl = document.getElementById("ds-features");
    const dsStatusBadgeEl = document.getElementById("ds-status-badge");
    const dsDescriptionEl = document.getElementById("ds-description");

    try {
        const info = await ApiClient.getDatasetInfo();
        if (!info) return;

        if (dsNameEl) dsNameEl.textContent = info.dataset_name || "Semiconductor Wafer Defect Dataset";
        if (dsSourceEl) dsSourceEl.textContent = info.source || "Kaggle";
        if (dsSamplesEl) dsSamplesEl.textContent = info.total_samples !== null ? info.total_samples.toLocaleString() : "TBD (Post-EDA)";
        if (dsFeaturesEl) dsFeaturesEl.textContent = info.total_features !== null ? info.total_features : "TBD (Post-EDA)";
        if (dsDescriptionEl) dsDescriptionEl.textContent = info.description || "";

        if (dsStatusBadgeEl) {
            if (info.status === "pending_eda") {
                dsStatusBadgeEl.innerHTML = `<span class="badge badge-custom badge-custom-amber"><i class="bi bi-clock-history me-1"></i> Pending Google Colab EDA</span>`;
            } else {
                dsStatusBadgeEl.innerHTML = `<span class="badge badge-custom badge-custom-green"><i class="bi bi-check-circle-fill me-1"></i> Synchronized</span>`;
            }
        }
    } catch (e) {
        console.warn("Error fetching dataset metadata:", e);
    }
});
