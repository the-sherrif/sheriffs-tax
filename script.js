const REF_KEY = "sheriffs_tax_referrer";
const DEPUTY_KEY = "sheriffs_tax_deputy_id";
const COPY_KEY = "sheriffs_tax_referral_copies";

const SHERIFF_TREASURY =
  "0xDfC4b31B8d67074C5fa09197C8FE076eeED0E280";

const ROBINHOOD_CHAIN_ID = "0x1237";

const ROBINHOOD_CHAIN = {
  chainId: ROBINHOOD_CHAIN_ID,
  chainName: "Robinhood Chain",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: [
    "https://rpc.mainnet.chain.robinhood.com"
  ],
  blockExplorerUrls: [
    "https://robinhoodchain.blockscout.com"
  ]
};

const USDG = {
  address: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  decimals: 6
};

const $ = (id) => document.getElementById(id);


/* =========================
   DEPUTY SYSTEM
========================= */

function makeDeputyId() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let id = "D";

  for (let i = 0; i < 7; i++) {
    id += chars[
      Math.floor(Math.random() * chars.length)
    ];
  }

  return id;
}


function getOrCreateDeputyId() {
  let id = localStorage.getItem(DEPUTY_KEY);

  if (!id) {
    id = makeDeputyId();
    localStorage.setItem(DEPUTY_KEY, id);
  }

  return id;
}


function getReferrer() {
  const incoming =
    new URLSearchParams(window.location.search)
      .get("ref");

  if (incoming && incoming.length <= 120) {
    localStorage.setItem(REF_KEY, incoming);
    return incoming;
  }

  return localStorage.getItem(REF_KEY) || "";
}


function getDeputyLink() {
  return `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(
    getOrCreateDeputyId()
  )}`;
}


function renderDeputy() {
  const id = getOrCreateDeputyId();
  const referrer = getReferrer();

  if ($("deputyId")) {
    $("deputyId").textContent = id;
  }

  if ($("refBox")) {
    $("refBox").textContent = getDeputyLink();
  }

  if ($("copyCount")) {
    $("copyCount").textContent =
      localStorage.getItem(COPY_KEY) || "0";
  }

  if ($("refNotice") && $("refNoticeText")) {
    if (referrer && referrer !== id) {
      $("refNotice").hidden = false;

      $("refNoticeText").textContent =
        `YOU WERE DEPUTIZED BY ${referrer}. YOUR TAX WILL CARRY THAT DEPUTY CREDIT.`;
    } else {
      $("refNotice").hidden = true;
    }
  }
}


async function copyDeputyLink() {
  const button = $("copyRef");
  const link = getDeputyLink();

  try {
    await navigator.clipboard.writeText(link);

    const count =
      Number(localStorage.getItem(COPY_KEY) || 0) + 1;

    localStorage.setItem(
      COPY_KEY,
      String(count)
    );

    if ($("copyCount")) {
      $("copyCount").textContent = count;
    }

    if (button) {
      button.textContent =
        "COPIED — FIND AN OUTLAW";
    }

    setTimeout(() => {
      if (button) {
        button.textContent =
          "COPY DEPUTY LINK";
      }
    }, 2200);

  } catch {
    if (button) {
      button.textContent = link;
    }
  }
}


function shareDeputyLink() {
  const link = getDeputyLink();

  if (navigator.share) {
    navigator.share({
      title: "The Sheriff's Tax",
      text:
        "The Sheriff is collecting taxes. I just got deputized. Your turn.",
      url: link
    }).catch(() => {});
  } else {
    copyDeputyLink();
  }
}


function bindDeputyButtons() {
  $("copyRef")?.addEventListener(
    "click",
    copyDeputyLink
  );

  $("shareRef")?.addEventListener(
    "click",
    shareDeputyLink
  );
}


/* =========================
   PAYMENT SYSTEM
========================= */

function paymentStatus(message, type = "") {
  const box = $("taxStatus");

  if (!box) return;

  box.textContent = message;
  box.className =
    `tax-status ${type}`;

  box.hidden = false;
}


function getEthereum() {
  if (!window.ethereum) {
    throw new Error("NO_WALLET");
  }

  return window.ethereum;
}


async function ensureRobinhoodChain() {
  const ethereum = getEthereum();

  const current =
    await ethereum.request({
      method: "eth_chainId"
    });

  if (current === ROBINHOOD_CHAIN_ID) {
    return;
  }

  try {
    await ethereum.request({
      method:
        "wallet_switchEthereumChain",

      params: [
        {
          chainId:
            ROBINHOOD_CHAIN_ID
        }
      ]
    });

  } catch (error) {

    if (error.code !== 4902) {
      throw error;
    }

    await ethereum.request({
      method:
        "wallet_addEthereumChain",

      params: [
        ROBINHOOD_CHAIN
      ]
    });
  }
}


function parseUnits(value, decimals) {
  const clean =
    String(value).trim();

  if (
    !/^\d+(\.\d+)?$/.test(clean) ||
    Number(clean) <= 0
  ) {
    throw new Error(
      "ENTER A VALID TAX AMOUNT."
    );
  }

  const [
    whole,
    fraction = ""
  ] = clean.split(".");

  if (fraction.length > decimals) {
    throw new Error(
      `MAXIMUM ${decimals} DECIMAL PLACES.`
    );
  }

  const padded =
    fraction.padEnd(
      decimals,
      "0"
    );

  return (
    BigInt(whole) *
      (10n ** BigInt(decimals))
    +
    BigInt(padded || "0")
  );
}


async function getAccount() {
  const ethereum =
    getEthereum();

  let accounts =
    await ethereum.request({
      method: "eth_accounts"
    });

  if (!accounts.length) {
    accounts =
      await ethereum.request({
        method:
          "eth_requestAccounts"
      });
  }

  if (!accounts.length) {
    throw new Error(
      "CONNECT YOUR WALLET FIRST."
    );
  }

  return accounts[0];
}


async function connectTaxWallet() {

  try {

    await ensureRobinhoodChain();

    const account =
      await getAccount();

    if ($("walletAddress")) {
      $("walletAddress").textContent =
        `${account.slice(0, 6)}...${account.slice(-4)}`;
    }

    if ($("connectTax")) {
      $("connectTax").textContent =
        "WALLET CONNECTED";
    }

    paymentStatus(
      "WALLET CONNECTED. SELECT YOUR TAX.",
      "success"
    );

  } catch (error) {

    paymentStatus(
      error.message === "NO_WALLET"
        ? "NO EVM WALLET DETECTED. OPEN THIS SITE IN YOUR WALLET BROWSER."
        : error.message ||
          "WALLET CONNECTION FAILED.",
      "error"
    );
  }
}


function showTaxSuccess(tx, asset) {

  paymentStatus(
    `TAX SENT IN ${asset}. THE SHERIFF HAS YOUR RECEIPT.`,
    "success"
  );

  if ($("taxTx")) {

    $("taxTx").innerHTML =
      `<a href="https://robinhoodchain.blockscout.com/tx/${tx}" target="_blank" rel="noopener">VIEW TRANSACTION →</a>`;
  }

  const referrer =
    localStorage.getItem(
      REF_KEY
    );

  if ($("taxRef")) {

    $("taxRef").textContent =
      referrer
        ? `DEPUTY CREDIT: ${referrer}`
        : "NO DEPUTY REFERRER DETECTED";
  }
}


async function payETH() {

  try {

    await ensureRobinhoodChain();

    const from =
      await getAccount();

    const value =
      `0x${parseUnits(
        $("taxAmount").value,
        18
      ).toString(16)}`;

    paymentStatus(
      "CONFIRM THE ETH TAX IN YOUR WALLET. THE SHERIFF IS WAITING.",
      "pending"
    );

    const tx =
      await getEthereum().request({

        method:
          "eth_sendTransaction",

        params: [
          {
            from,
            to:
              SHERIFF_TREASURY,
            value
          }
        ]
      });

    showTaxSuccess(
      tx,
      "ETH"
    );

  } catch (error) {

    paymentStatus(
      error.message ||
        "ETH PAYMENT FAILED OR WAS REJECTED.",
      "error"
    );
  }
}


async function payUSDG() {

  try {

    await ensureRobinhoodChain();

    const from =
      await getAccount();

    const value =
      parseUnits(
        $("taxAmount").value,
        USDG.decimals
      );

    const data =
      "0xa9059cbb" +
      SHERIFF_TREASURY
        .slice(2)
        .padStart(64, "0") +
      value
        .toString(16)
        .padStart(64, "0");

    paymentStatus(
      "CONFIRM THE USDG TAX IN YOUR WALLET. THE SHERIFF IS WAITING.",
      "pending"
    );

    const tx =
      await getEthereum().request({

        method:
          "eth_sendTransaction",

        params: [
          {
            from,
            to:
              USDG.address,
            data
          }
        ]
      });

    showTaxSuccess(
      tx,
      "USDG"
    );

  } catch (error) {

    paymentStatus(
      error.message ||
        "USDG PAYMENT FAILED OR WAS REJECTED.",
      "error"
    );
  }
}


function bindPaymentButtons() {

  $("connectTax")?.addEventListener(
    "click",
    connectTaxWallet
  );

  $("payEth")?.addEventListener(
    "click",
    payETH
  );

  $("payUsdg")?.addEventListener(
    "click",
    payUSDG
  );
}


/* =========================
   INITIALIZE
========================= */

renderDeputy();
bindDeputyButtons();
bindPaymentButtons();
