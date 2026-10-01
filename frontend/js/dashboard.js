document.addEventListener("DOMContentLoaded", () => {

    console.log("WaferDefect AI Home loaded");

    const exploreButton = document.querySelector(
        'a[href="#modules"]'
    );

    if (exploreButton) {

        exploreButton.addEventListener("click", (event) => {

            event.preventDefault();

            const modules = document.querySelector("#modules");

            if (modules) {

                modules.scrollIntoView({
                    behavior: "smooth"
                });

            }

        });

    }

    const optimizationButton = document.querySelector(
        'a[href="control-optimization.html"]'
    );

    if (optimizationButton) {

        optimizationButton.addEventListener("click", () => {

            console.log(
                "Opening Control Optimization..."
            );

        });

    }

});