const state = {
  treasury: 0,
  citizens: 0,
  target: 100000,
  reason: "Civic Duty",
  asset: "ETH"
};

const TREASURY_ADDRESS = "0xDfC4b31B8d67074C5fa09197C8FE076eeED0E280";
const NETWORK = "Robinhood Chain";

const $ = (id) => document.getElementById(id);

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

function updateTreasury() {
  const pct = Math.min((state.treasury / state.target) * 100, 100);
  $("treasuryAmount").textContent = money(state.treasury);
  $("citizenCount").textContent = state.citizens.toLocaleString();
  $("progressBar").style.width = pct + "%";
  $("auditBar").style.width = pct + "%";
}

function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(
    () => el.classList.remove("show"),
    2600
  );
}

document.querySelectorAll("[data-asset]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-asset]").forEach(b =>
      b.classList.remove("active")
    );

    btn.classList.add("active");
    state.asset = btn.dataset.asset;

    $("receiptAsset").textContent = state.asset;
    $("amount").placeholder =
      state.asset === "ETH" ? "0.10 ETH" : "10 USDG";
  });
});

document.querySelectorAll("[data-reason]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-reason]").forEach(b =>
      b.classList.remove("active")
    );

    btn.classList.add("active");
    state.reason = btn.dataset.reason;
    $("receiptReason").textContent = state.reason.toUpperCase();
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
    toast("The Sheriff requires acknowledgement before proceeding.");
    return;
  }

  const wallet = $("wallet").value.trim();
  const amount = $("amount").value.trim();

  if (!wallet || !amount) {
    toast("Citizen wallet and tax amount are required.");
    return;
  }

  $("receiptWallet").textContent = wallet;
  $("receiptAmount").textContent = amount;
  $("receiptAsset").textContent = state.asset;
  $("receiptReason").textContent = state.reason.toUpperCase();

  toast(`Tax instructions ready. Send ${state.asset} on ${NETWORK}.`);

  $("receipt").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
});

document.querySelectorAll("[data-copy]").forEach(btn => {
  btn.addEventListener("click", async () => {
    const text = $(btn.dataset.copy).textContent.trim();

    try {
      await navigator.clipboard.writeText(text);
      toast("Treasury address copied.");
    } catch {
      toast("Copy failed. Select the address manually.");
    }
  });
});

function getBaseUrl() {
  return window.location.origin + window.location.pathname;
}

$("generateLink").addEventListener("click", () => {
  const name = $("deputyName").value.trim().replace(/^@/, "");

  if (!name) {
    toast("Enter your X handle or nickname first.");
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
    toast("Generate your Deputy link first.");
    return;
  }

  try {
    await navigator.clipboard.writeText(window.__deputyLink);
    toast("Deputy link copied.");
  } catch {
    toast("Copy failed. Copy the link manually.");
  }
});

const params = new URLSearchParams(window.location.search);
const deputy = params.get("deputy");

if (deputy) {
  $("shareMessage").textContent =
    `You arrived through Deputy ${deputy}. The Sheriff knows who sent you.`;
}

updateTreasury();
