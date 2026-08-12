const REF_KEY = "sheriffs_tax_referrer";
const DEPUTY_KEY = "sheriffs_tax_deputy_id";
const COPY_KEY = "sheriffs_tax_referral_copies";

const $ = (id) => document.getElementById(id);

function makeDeputyId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "D";
  for (let i = 0; i < 7; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
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
  const params = new URLSearchParams(window.location.search);
  const incoming = params.get("ref");

  if (incoming && incoming.length <= 120) {
    localStorage.setItem(REF_KEY, incoming);
    return incoming;
  }

  return localStorage.getItem(REF_KEY);
}

function getDeputyLink() {
  return `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(getOrCreateDeputyId())}`;
}

function renderDeputy() {
  const id = getOrCreateDeputyId();
  const referrer = getReferrer();
  const linkBox = $("refBox");
  const deputyId = $("deputyId");
  const notice = $("refNotice");
  const noticeText = $("refNoticeText");
  const copyCount = $("copyCount");

  if (deputyId) deputyId.textContent = id;
  if (linkBox) linkBox.textContent = getDeputyLink();

  if (copyCount) {
    copyCount.textContent = localStorage.getItem(COPY_KEY) || "0";
  }

  if (notice && noticeText) {
    if (referrer && referrer !== id) {
      notice.hidden = false;
      noticeText.textContent =
        `YOU WERE DEPUTIZED BY ${referrer}. YOUR REFERRAL WILL BE RECOGNIZED WHEN THE LIVE PAYMENT SYSTEM IS CONNECTED.`;
    } else {
      notice.hidden = true;
    }
  }
}

async function copyDeputyLink() {
  const button = $("copyRef");
  const link = getDeputyLink();

  try {
    await navigator.clipboard.writeText(link);

    const count = Number(localStorage.getItem(COPY_KEY) || 0) + 1;
    localStorage.setItem(COPY_KEY, String(count));

    if ($("copyCount")) $("copyCount").textContent = count;
    if (button) button.textContent = "COPIED — FIND AN OUTLAW";

    setTimeout(() => {
      if (button) button.textContent = "COPY DEPUTY LINK";
    }, 2200);
  } catch {
    if (button) button.textContent = link;
  }
}

function shareDeputyLink() {
  const link = getDeputyLink();

  if (navigator.share) {
    navigator.share({
      title: "The Sheriff's Tax",
      text: "The Sheriff is collecting taxes. I just got deputized. Your turn.",
      url: link
    }).catch(() => {});
  } else {
    copyDeputyLink();
  }
}

function bindDeputyButtons() {
  $("copyRef")?.addEventListener("click", copyDeputyLink);
  $("shareRef")?.addEventListener("click", shareDeputyLink);
}

renderDeputy();
bindDeputyButtons();
