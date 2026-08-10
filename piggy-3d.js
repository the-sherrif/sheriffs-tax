(() => {
  const root = document.getElementById("piggy-3d-canvas");
  if (!root) return;

  root.innerHTML = `
    <div class="piggy-scene" aria-label="Sheriff's transparent piggy bank">
      <div class="piggy-glow"></div>

      <div class="piggy-coin-cloud" id="piggyCoinCloud"></div>

      <div class="piggy-bank" id="piggyBank">

        <div class="piggy-ear piggy-ear-left"></div>
        <div class="piggy-ear piggy-ear-right"></div>

        <div class="piggy-body">

          <div class="piggy-highlight"></div>

          <div class="piggy-eye piggy-eye-left"></div>
          <div class="piggy-eye piggy-eye-right"></div>

          <div class="piggy-snout">
            <span></span>
            <span></span>
          </div>

          <div class="piggy-slot"></div>

          <div class="piggy-belly" id="piggyBelly"></div>

        </div>

        <div class="piggy-leg piggy-leg-1"></div>
        <div class="piggy-leg piggy-leg-2"></div>
        <div class="piggy-leg piggy-leg-3"></div>
        <div class="piggy-leg piggy-leg-4"></div>

        <div class="piggy-tail"></div>

      </div>

      <div class="piggy-shadow"></div>

      <div class="piggy-caption">
        FEED THE SHERIFF
      </div>

    </div>
  `;

  const bank = document.getElementById("piggyBank");
  const belly = document.getElementById("piggyBelly");
  const cloud = document.getElementById("piggyCoinCloud");

  /*
   * Create the coins inside/around the pig.
   */

  for (let i = 0; i < 28; i++) {

    const coin = document.createElement("span");

    coin.className = "piggy-coin";

    coin.style.setProperty(
      "--x",
      `${Math.random() * 90 - 45}px`
    );

    coin.style.setProperty(
      "--y",
      `${Math.random() * 55 + 10}px`
    );

    coin.style.setProperty(
      "--r",
      `${Math.random() * 360}deg`
    );

    coin.style.setProperty(
      "--d",
      `${Math.random() * 1.8}s`
    );

    cloud.appendChild(coin);
  }


  /*
   * Called by script.js whenever the
   * live Treasury amount changes.
   */

  window.updatePiggyVisual = (
    treasury,
    isClosed
  ) => {

    const pct =
      Math.max(
        0,
        Math.min(
          Number(treasury) || 0,
          100000
        )
      ) / 100000;


    /*
     * Fill the pig based on Treasury progress.
     */

    if (bank) {

      bank.style.setProperty(
        "--fill",
        pct
      );

      bank.classList.toggle(
        "is-full",
        Boolean(isClosed) || pct >= 1
      );
    }


    /*
     * Raise the visible "money" level.
     */

    if (belly) {

      belly.style.height =
        `${Math.max(4, pct * 92)}%`;
    }


    /*
     * Show more coins as the Treasury grows.
     */

    if (cloud) {

      const visibleCoins =
        Math.min(
          28,
          Math.floor(pct * 28)
        );


      [...cloud.children]
        .forEach((coin, index) => {

          coin.classList.toggle(
            "is-visible",
            index < visibleCoins
          );

        });
    }

  };


  /*
   * Start empty.
   * script.js will immediately update
   * this with the real Treasury.
   */

  window.updatePiggyVisual(
    0,
    false
  );

})();
