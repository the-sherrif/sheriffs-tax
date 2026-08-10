const state = {
  treasury: 0,
  citizens: 0,
  target: 100000,
  reason: "Civic Duty",
  asset: "ETH",
  ethBalance: 0,
  usdgBalance: 0,
  ethPrice: 0
};

const TREASURY_ADDRESS = "0xDfC4b31B8d67074C5fa09197C8FE076eeED0E280";
const USDG_ADDRESS = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";

const RPC_URL = "https://rpc.mainnet.chain.robinhood.com";
const NETWORK = "Robinhood Chain";
const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

const SNAPSHOT_KEY = "sheriffsTaxSnapshot";

let collectionClosed = Boolean(localStorage.getItem(SNAPSHOT_KEY));
let previousTreasury = 0;

const $ = (id) => document.getElementById(id);

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function shortNumber(value, decimals = 4) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: decimals
  });
}

function toast(message) {
  const el = $("toast");

  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    el.classList.remove("show");
  }, 2600);
}


/* =========================================================
   PIGGY BANK
   ========================================================= */

function setPiggyStatus(label, stateText) {
  if ($("piggyStatus")) {
    $("piggyStatus").innerHTML = `<i></i> ${label}`;
  }

  if ($("piggyStatusText")) {
    $("piggyStatusText").textContent = label;
  }

  if ($("piggyState")) {
    $("piggyState").textContent = stateText;
  }
}


function updatePiggy() {
  const pct = Math.min(
    (state.treasury / state.target) * 100,
    100
  );

  if ($("piggyAmount")) {
    $("piggyAmount").textContent = money(state.treasury);
  }

  if ($("piggyPercent")) {
    $("piggyPercent").textContent =
      (pct < 10 ? pct.toFixed(1) : Math.floor(pct)) + "% FULL";
  }

  if ($("piggyProgress")) {
    $("piggyProgress").style.width = pct + "%";
  }

  const notice = $("piggyNotice");
  const closed = $("piggyClosed");
  const late = $("piggyLate");


  /* COLLECTION CLOSED */

  if (collectionClosed) {
    setPiggyStatus(
      "TAX COLLECTION CLOSED",
      "THE PIG IS FULL."
    );

    if (notice) {
      notice.classList.remove("show");
    }

    if (closed) {
      closed.classList.add("show");
    }

    return;
  }


  /* COLLECTION OPEN */

  if (notice) {
    notice.classList.add("show");
  }

  if (closed) {
    closed.classList.remove("show");
  }

  if (late) {
    late.classList.remove("show");
  }


  if (pct >= 95) {
    setPiggyStatus(
      "PIG ALMOST FULL",
      "THE PIG IS ALMOST FULL. ONE MORE DEPOSIT."
    );
  }

  else if (pct >= 75) {
    setPiggyStatus(
      "PIG GETTING FULL",
      "THE PIG IS GETTING FULL. KEEP FEEDING."
    );
  }

  else if (pct >= 50) {
    setPiggyStatus(
      "PIG IS HUNGRY",
      "THE PIG IS HUNGRY. KEEP FEEDING."
    );
  }

  else {
    setPiggyStatus(
      "TAX COLLECTION OPEN",
      "THE PIG IS HUNGRY."
    );
  }

  /*
    Allows the CSS / visual piggy-bank code to react
    to the current Treasury state.
  */

  if (window.updatePiggyVisual) {
    window.updatePiggyVisual(
      state.treasury,
      collectionClosed
    );
  }
}


/* =========================================================
   SNAPSHOT / COLLECTION CLOSE
   ========================================================= */

function closeCollection() {
  if (collectionClosed) return;

  collectionClosed = true;

  const snapshot = {
    treasury: state.treasury,
    target: state.target,
    ethBalance: state.ethBalance,
    usdgBalance: state.usdgBalance,
    takenAt: new Date().toISOString()
  };

  localStorage.setItem(
    SNAPSHOT_KEY,
    JSON.stringify(snapshot)
  );

  updatePiggy();

  toast("THE PIG IS FULL. SNAPSHOT TAKEN.");
}


/* =========================================================
   TREASURY DISPLAY
   ========================================================= */

function updateTreasury() {
  const pct = Math.min(
    (state.treasury / state.target) * 100,
    100
  );

  if ($("treasuryAmount")) {
    $("treasuryAmount").textContent =
      money(state.treasury);
  }

  if ($("citizenCount")) {
    $("citizenCount").textContent =
      state.citizens.toLocaleString();
  }

  if ($("progressBar")) {
    $("progressBar").style.width =
      pct + "%";
  }

  if ($("auditBar")) {
    $("auditBar").style.width =
      pct + "%";
  }

  if ($("ethBalance")) {
    $("ethBalance").textContent =
      shortNumber(state.ethBalance) + " ETH";
  }

  if ($("usdgBalance")) {
    $("usdgBalance").textContent =
      shortNumber(state.usdgBalance, 2) + " USDG";
  }

  if ($("ethPrice")) {
    $("ethPrice").textContent =
      state.ethPrice
        ? money(state.ethPrice)
        : "—";
  }

  if ($("lastUpdated")) {
    $("lastUpdated").textContent =
      "UPDATED " +
      new Date().toLocaleTimeString();
  }

  updatePiggy();
}


/* =========================================================
   ROBINHOOD CHAIN RPC
   ========================================================= */

async function rpc(method, params = []) {
  const response = await fetch(RPC_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params
    })
  });

  if (!response.ok) {
    throw new Error(
      "Robinhood RPC request failed"
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.result;
}


/* =========================================================
   ETH BALANCE
   ========================================================= */

async function getETHBalance() {
  const hex = await rpc(
    "eth_getBalance",
    [
      TREASURY_ADDRESS,
      "latest"
    ]
  );

  return Number(
    BigInt(hex)
  ) / 1e18;
}


/* =========================================================
   USDG BALANCE
   ========================================================= */

async function getUSDGBalance() {
  const balanceCall =
    "0x70a08231" +
    TREASURY_ADDRESS
      .slice(2)
      .toLowerCase()
      .padStart(64, "0");

  const [
    balanceHex,
    decimalsHex
  ] = await Promise.all([

    rpc(
      "eth_call",
      [
        {
          to: USDG_ADDRESS,
          data: balanceCall
        },
        "latest"
      ]
    ),

    rpc(
      "eth_call",
      [
        {
          to: USDG_ADDRESS,
          data: "0x313ce567"
        },
        "latest"
      ]
    )
  ]);

  const decimals =
    Number(BigInt(decimalsHex));

  return Number(
    BigInt(balanceHex)
  ) / Math.pow(10, decimals);
}


/* =========================================================
   ETH PRICE
   ========================================================= */

async function getETHPrice() {
  const response =
    await fetch(COINGECKO_URL);

  if (!response.ok) {
    throw new Error(
      "ETH price request failed"
    );
  }

  const data =
    await response.json();

  return Number(
    data.ethereum.usd
  );
}


/* =========================================================
   LIVE TREASURY REFRESH
   ========================================================= */

async function refreshTreasury() {
  try {

    const [
      ethBalance,
      usdgBalance,
      ethPrice
    ] = await Promise.all([

      getETHBalance(),

      getUSDGBalance(),

      getETHPrice()

    ]);


    const nextTreasury =
      (ethBalance * ethPrice) +
      usdgBalance;


    const wasClosed =
      collectionClosed;


    state.ethBalance =
      ethBalance;

    state.usdgBalance =
      usdgBalance;

    state.ethPrice =
      ethPrice;

    state.treasury =
      nextTreasury;


    /*
      The exact moment the Treasury reaches
      $100,000, collection closes and the
      snapshot is taken.
    */

    if (
      !wasClosed &&
      nextTreasury >= state.target
    ) {
      closeCollection();
    }


    updateTreasury();


    /*
      If the collection was already closed
      and the balance later increases, flag
      the deposit as late.
    */

    if (
      wasClosed &&
      nextTreasury > previousTreasury &&
      $("piggyLate")
    ) {
      $("piggyLate")
        .classList
        .add("show");
    }


    previousTreasury =
      nextTreasury;

  }

  catch (error) {

    console.error(
      "Treasury update failed:",
      error
    );

    if ($("lastUpdated")) {
      $("lastUpdated").textContent =
        "TREASURY DATA UNAVAILABLE";
    }
  }
}


/* =========================================================
   PAYMENT ASSET
   ========================================================= */

document
  .querySelectorAll("[data-asset]")
  .forEach((btn) => {

    btn.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            "[data-asset]"
          )
          .forEach((button) => {
            button.classList.remove(
              "active"
            );
          });

        btn.classList.add("active");

        state.asset =
          btn.dataset.asset;


        if ($("receiptAsset")) {
          $("receiptAsset")
            .textContent =
            state.asset;
        }


        if ($("amount")) {

          $("amount").placeholder =
            state.asset === "ETH"
              ? "0.10 ETH"
              : "10 USDG";
        }
      }
    );
  });


/* =========================================================
   PAYMENT REASON
   ========================================================= */

document
  .querySelectorAll("[data-reason]")
  .forEach((btn) => {

    btn.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            "[data-reason]"
          )
          .forEach((button) => {
            button.classList.remove(
              "active"
            );
          });

        btn.classList.add("active");

        state.reason =
          btn.dataset.reason;


        if ($("receiptReason")) {

          $("receiptReason")
            .textContent =
            state.reason.toUpperCase();
        }
      }
    );
  });


/* =========================================================
   PAYMENT FORM
   ========================================================= */

if ($("wallet")) {

  $("wallet").addEventListener(
    "input",
    (event) => {

      if ($("receiptWallet")) {

        $("receiptWallet")
          .textContent =
          event.target.value.trim() ||
          "NOT PROVIDED";
      }
    }
  );
}


if ($("amount")) {

  $("amount").addEventListener(
    "input",
    (event) => {

      if ($("receiptAmount")) {

        $("receiptAmount")
          .textContent =
          event.target.value.trim() ||
          "NOT PROVIDED";
      }
    }
  );
}


if ($("payButton")) {

  $("payButton").addEventListener(
    "click",
    () => {


      /*
        Once the pig is full, the button
        does NOT generate valid instructions.
      */

      if (collectionClosed) {

        toast(
          "THE PIG IS FULL. NEW DEPOSITS ARE LATE / NOT QUALIFIED."
        );

        return;
      }


      if (
        $("ack") &&
        !$("ack").checked
      ) {

        toast(
          "The Sheriff requires acknowledgement before proceeding."
        );

        return;
      }


      const wallet =
        $("wallet")?.value.trim();

      const amount =
        $("amount")?.value.trim();


      if (!wallet || !amount) {

        toast(
          "Citizen wallet and tax amount are required."
        );

        return;
      }


      if ($("receiptWallet")) {

        $("receiptWallet")
          .textContent =
          wallet;
      }


      if ($("receiptAmount")) {

        $("receiptAmount")
          .textContent =
          amount;
      }


      if ($("receiptAsset")) {

        $("receiptAsset")
          .textContent =
          state.asset;
      }


      if ($("receiptReason")) {

        $("receiptReason")
          .textContent =
          state.reason.toUpperCase();
      }


      toast(
        `Tax instructions ready. Send ${state.asset} on ${NETWORK}.`
      );


      if ($("receipt")) {

        $("receipt")
          .scrollIntoView({
            behavior: "smooth",
            block: "center"
          });
      }

    }
  );
}


/* =========================================================
   COPY TREASURY ADDRESS
   ========================================================= */

document
  .querySelectorAll("[data-copy]")
  .forEach((btn) => {

    btn.addEventListener(
      "click",
      async () => {

        const text =
          $(btn.dataset.copy)
            ?.textContent
            .trim() || "";


        try {

          await navigator
            .clipboard
            .writeText(text);

          toast(
            "Treasury address copied."
          );

        }

        catch {

          toast(
            "Copy failed. Select the address manually."
          );

        }

      }
    );
  });


/* =========================================================
   DEPUTY REFERRAL LINKS
   ========================================================= */

function getBaseUrl() {

  return (
    window.location.origin +
    window.location.pathname
  );
}


if ($("generateLink")) {

  $("generateLink")
    .addEventListener(
      "click",
      () => {

        const name =
          $("deputyName")
            ?.value
            .trim()
            .replace(/^@/, "");


        if (!name) {

          toast(
            "Enter your X handle or nickname first."
          );

          return;
        }


        const link =
          `${getBaseUrl()}?deputy=${encodeURIComponent(name)}`;


        if ($("generatedLink")) {

          $("generatedLink")
            .textContent =
            link;
        }


        if ($("shareMessage")) {

          $("shareMessage")
            .textContent =
            `You're now Deputy ${name}. Send the link to an outlaw.`;
        }


        window.__deputyLink =
          link;


        toast(
          "Deputy link generated."
        );
      }
    );
}


if ($("copyLink")) {

  $("copyLink")
    .addEventListener(
      "click",
      async () => {

        if (!window.__deputyLink) {

          toast(
            "Generate your Deputy link first."
          );

          return;
        }


        try {

          await navigator
            .clipboard
            .writeText(
              window.__deputyLink
            );

          toast(
            "Deputy link copied."
          );

        }

        catch {

          toast(
            "Copy failed. Copy the link manually."
          );

        }

      }
    );
}


/* =========================================================
   DEPUTY ARRIVAL
   ========================================================= */

const deputy =
  new URLSearchParams(
    window.location.search
  ).get("deputy");


if (
  deputy &&
  $("shareMessage")
) {

  $("shareMessage")
    .textContent =
    `You arrived through Deputy ${deputy}. The Sheriff knows who sent you.`;
}


/* =========================================================
   PUBLIC API
   ========================================================= */

window.SheriffsTax = {

  state,

  refreshTreasury,

  closeCollection

};


/* =========================================================
   START
   ========================================================= */

updateTreasury();

refreshTreasury();

setInterval(
  refreshTreasury,
  30000
);
