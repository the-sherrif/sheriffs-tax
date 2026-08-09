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

const TREASURY_ADDRESS =
  "0xDfC4b31B8d67074C5fa09197C8FE076eeED0E280";

const USDG_ADDRESS =
  "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";

const RPC_URL =
  "https://rpc.mainnet.chain.robinhood.com";

const NETWORK = "Robinhood Chain";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

const VAULT_TARGET = 100000;

let vaultClosed = false;
let snapshotTaken = false;

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

function updateTreasury() {
  const pct = Math.min(
    (state.treasury / state.target) * 100,
    100
  );

  $("treasuryAmount").textContent = money(state.treasury);
  $("citizenCount").textContent =
    state.citizens.toLocaleString();

  $("progressBar").style.width = pct + "%";
  $("auditBar").style.width = pct + "%";

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
      state.ethPrice ? money(state.ethPrice) : "—";
  }

  if ($("lastUpdated")) {
    $("lastUpdated").textContent =
      "UPDATED " +
      new Date().toLocaleTimeString();
  }
}

function toast(message) {
  const el = $("toast");

  if (!el) return;

  el.textContent = message;
  el.classList.add("show");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(
    () => el.classList.remove("show"),
    2600
  );
}

function updateVault() {
  const amount = state.treasury;
  const pct = Math.min((amount / VAULT_TARGET) * 100, 100);
  const remaining = Math.max(VAULT_TARGET - amount, 0);

  $("vaultAmount").textContent = money(amount);
  $("vaultRemaining").textContent = money(remaining);
  $("vaultPercent").textContent = Math.floor(pct) + "%";

  if (vaultClosed) {
    $("vaultStatus").innerHTML = "<i></i> VAULT SEALED";
    $("vaultLock").textContent = "SEALED";
    $("vaultMessage").textContent =
      "The $100,000 target has been reached. The Sheriff has taken the snapshot.";

    $("snapshotBanner").classList.add("show");
    $("lateNotice").classList.add("show");

    $("vaultLeft").style.transform = "translateX(0)";
    $("vaultRight").style.transform = "translateX(0)";

    return;
  }

  $("snapshotBanner").classList.remove("show");
  $("lateNotice").classList.remove("show");

  if (pct >= 95) {
    $("vaultStatus").innerHTML = "<i></i> FINAL CALL";
    $("vaultLock").textContent = "FINAL";
    $("vaultMessage").textContent =
      "The Vault is almost closed. Every qualified deposit counts.";

  } else if (pct >= 75) {
    $("vaultStatus").innerHTML = "<i></i> VAULT CLOSING";
    $("vaultLock").textContent = "CLOSING";
    $("vaultMessage").textContent =
      "The Sheriff is getting nervous. The Vault is closing.";

  } else {
    $("vaultStatus").innerHTML = "<i></i> VAULT OPEN";
    $("vaultLock").textContent = "OPEN";
    $("vaultMessage").textContent =
      "The Sheriff is accepting taxes. The Vault remains open.";
  }

  const doorAmount = pct * 0.45;

  $("vaultLeft").style.transform =
    `translateX(${doorAmount}%)`;

  $("vaultRight").style.transform =
    `translateX(-${doorAmount}%)`;
}

/* -------------------------
   PAYMENT FORM
------------------------- */

document.querySelectorAll("[data-asset]").forEach(btn => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("[data-asset]")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    state.asset = btn.dataset.asset;

    if ($("receiptAsset")) {
      $("receiptAsset").textContent = state.asset;
    }

    $("amount").placeholder =
      state.asset === "ETH"
        ? "0.10 ETH"
        : "10 USDG";
  });
});

document.querySelectorAll("[data-reason]").forEach(btn => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll("[data-reason]")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    state.reason = btn.dataset.reason;

    $("receiptReason").textContent =
      state.reason.toUpperCase();
  });
});

$("wallet").addEventListener("input", e => {
  $("receiptWallet").textContent =
    e.target.value.trim() || "NOT PROVIDED";
});

$("amount").addEventListener("input", e => {
  $("receiptAmount").textContent =
    e.target.value.trim() || "NOT PROVIDED";
});

$("payButton").addEventListener("click", () => {
  if (!$("ack").checked) {
    toast(
      "The Sheriff requires acknowledgement before proceeding."
    );
    return;
  }

  const wallet = $("wallet").value.trim();
  const amount = $("amount").value.trim();

  if (!wallet || !amount) {
    toast(
      "Citizen wallet and tax amount are required."
    );
    return;
  }

  $("receiptWallet").textContent = wallet;
  $("receiptAmount").textContent = amount;

  if ($("receiptAsset")) {
    $("receiptAsset").textContent = state.asset;
  }

  $("receiptReason").textContent =
    state.reason.toUpperCase();

  toast(
    `Tax instructions ready. Send ${state.asset} on ${NETWORK}.`
  );

  $("receipt").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
});

/* -------------------------
   COPY BUTTON
------------------------- */

document.querySelectorAll("[data-copy]").forEach(btn => {
  btn.addEventListener("click", async () => {
    const text =
      $(btn.dataset.copy).textContent.trim();

    try {
      await navigator.clipboard.writeText(text);
      toast("Treasury address copied.");
    } catch {
      toast(
        "Copy failed. Select the address manually."
      );
    }
  });
});

/* -------------------------
   ROBINHOOD CHAIN
------------------------- */

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
    throw new Error("Robinhood RPC request failed");
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message);
  }

  return data.result;
}

async function getETHBalance() {
  const hex = await rpc("eth_getBalance", [
    TREASURY_ADDRESS,
    "latest"
  ]);

  return Number(
    BigInt(hex)
  ) / 1e18;
}

async function getUSDGBalance() {
  const data =
    "0x70a08231" +
    TREASURY_ADDRESS
      .slice(2)
      .toLowerCase()
      .padStart(64, "0");

  const hex = await rpc("eth_call", [
    {
      to: USDG_ADDRESS,
      data
    },
    "latest"
  ]);

  /*
    USDG is represented as a standard ERC-20.
    Read the token's decimals dynamically rather
    than hard-coding the assumption.
  */

  const decimalsData =
    await rpc("eth_call", [
      {
        to: USDG_ADDRESS,
        data: "0x313ce567"
      },
      "latest"
    ]);

  const decimals =
    Number(BigInt(decimalsData));

  return Number(BigInt(hex)) /
    Math.pow(10, decimals);
}

/* -------------------------
   COINGECKO
------------------------- */

async function getETHPrice() {
  const response =
    await fetch(COINGECKO_URL);

  if (!response.ok) {
    throw new Error(
      "CoinGecko price request failed"
    );
  }

  const data = await response.json();

  return Number(data.ethereum.usd);
}

/* -------------------------
   TREASURY UPDATE
------------------------- */

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

    state.ethBalance = ethBalance;
    state.usdgBalance = usdgBalance;
    state.ethPrice = ethPrice;

    state.treasury =
      (ethBalance * ethPrice) +
      usdgBalance;

    updateTreasury();

    console.log(
      "Sheriff Treasury:",
      {
        ethBalance,
        usdgBalance,
        ethPrice,
        treasuryUSD: state.treasury
      }
    );

  } catch (error) {
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

/*
  Refresh every 30 seconds.
  This keeps RPC and CoinGecko traffic
  deliberately light.
*/

refreshTreasury();

setInterval(
  refreshTreasury,
  30000
);

/* -------------------------
   DEPUTY SYSTEM
------------------------- */

function getBaseUrl() {
  return (
    window.location.origin +
    window.location.pathname
  );
}

$("generateLink").addEventListener("click", () => {
  const name =
    $("deputyName")
      .value
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

  $("generatedLink").textContent = link;

  $("shareMessage").textContent =
    `You're now Deputy ${name}. Send the link to an outlaw.`;

  window.__deputyLink = link;

  toast("Deputy link generated.");
});

$("copyLink").addEventListener("click", async () => {
  if (!window.__deputyLink) {
    toast(
      "Generate your Deputy link first."
    );
    return;
  }

  try {
    await navigator.clipboard.writeText(
      window.__deputyLink
    );

    toast("Deputy link copied.");

  } catch {
    toast(
      "Copy failed. Copy the link manually."
    );
  }
});

const params =
  new URLSearchParams(
    window.location.search
  );

const deputy =
  params.get("deputy");

if (deputy) {
  $("shareMessage").textContent =
    `You arrived through Deputy ${deputy}. The Sheriff knows who sent you.`;
}

updateTreasury();
