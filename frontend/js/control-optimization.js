document.addEventListener("DOMContentLoaded", () => {

    /* =========================
       TEMPERATURE SLIDER
    ========================= */

    const tempSlider = document.getElementById("temp-slider");
    const tempVal = document.getElementById("temp-val");

    if (tempSlider && tempVal) {

        tempSlider.addEventListener("input", (event) => {

            tempVal.textContent = event.target.value;

        });

    }


    /* =========================
       PRESSURE SLIDER
    ========================= */

    const pressureSlider = document.getElementById("pressure-slider");
    const pressureVal = document.getElementById("pressure-val");

    if (pressureSlider && pressureVal) {

        pressureSlider.addEventListener("input", (event) => {

            pressureVal.textContent =
                (event.target.value / 10).toFixed(1);

        });

    }


    /* =========================
       GAS FLOW SLIDER
    ========================= */

    const flowSlider = document.getElementById("flow-slider");
    const flowVal = document.getElementById("flow-val");

    if (flowSlider && flowVal) {

        flowSlider.addEventListener("input", (event) => {

            flowVal.textContent = event.target.value;

        });

    }


    /* =========================
       RF POWER SLIDER
    ========================= */

    const rfSlider = document.getElementById("rf-power-slider");
    const rfVal = document.getElementById("rf-power-val");

    if (rfSlider && rfVal) {

        rfSlider.addEventListener("input", (event) => {

            rfVal.textContent = event.target.value;

        });

    }


    /* =========================
       ETCH DURATION SLIDER
    ========================= */

    const durationSlider =
        document.getElementById("duration-slider");

    const durationVal =
        document.getElementById("duration-val");

    if (durationSlider && durationVal) {

        durationSlider.addEventListener("input", (event) => {

            durationVal.textContent = event.target.value;

        });

    }


    /* =========================
       SIMULATE PROCESS CONTROL
    ========================= */

    const btnStep = document.getElementById("btn-step");

    if (btnStep) {

        btnStep.addEventListener("click", () => {

            /* Temperature */

            if (tempSlider) {

                tempSlider.value = 417;

                if (tempVal) {
                    tempVal.textContent = "417";
                }

            }


            /* Pressure */

            if (pressureSlider) {

                pressureSlider.value = 164;

                if (pressureVal) {
                    pressureVal.textContent = "16.4";
                }

            }


            /* RF Power */

            if (rfSlider) {

                rfSlider.value = 890;

                if (rfVal) {
                    rfVal.textContent = "890";
                }

            }


            /* Etch Duration */

            if (durationSlider) {

                durationSlider.value = 65;

                if (durationVal) {
                    durationVal.textContent = "65";
                }

            }


            /* Button animation */

            btnStep.classList.add("scale-95");

            setTimeout(() => {

                btnStep.classList.remove("scale-95");

            }, 150);

        });

    }


    /* =========================
       RESET VALUES
    ========================= */

    const btnReset = document.getElementById("btn-reset");

    if (btnReset) {

        btnReset.addEventListener("click", () => {

            /* Temperature */

            if (tempSlider) {

                tempSlider.value = 412;

                if (tempVal) {
                    tempVal.textContent = "412";
                }

            }


            /* Pressure */

            if (pressureSlider) {

                pressureSlider.value = 184;

                if (pressureVal) {
                    pressureVal.textContent = "18.4";
                }

            }


            /* Gas Flow */

            if (flowSlider) {

                flowSlider.value = 105;

                if (flowVal) {
                    flowVal.textContent = "105";
                }

            }


            /* RF Power */

            if (rfSlider) {

                rfSlider.value = 850;

                if (rfVal) {
                    rfVal.textContent = "850";
                }

            }


            /* Etch Duration */

            if (durationSlider) {

                durationSlider.value = 68;

                if (durationVal) {
                    durationVal.textContent = "68";
                }

            }

        });

    }

});