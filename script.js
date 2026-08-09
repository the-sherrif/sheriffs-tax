document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector(link.getAttribute("href"));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  document.querySelectorAll("[data-copy]").forEach(button => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy");

      try {
        await navigator.clipboard.writeText(value);
        const original = button.textContent;
        button.textContent = "COPIED ✓";
        setTimeout(() => {
          button.textContent = original;
        }, 1600);
      } catch {
        window.prompt("Copy this:", value);
      }
    });
  });

  const referralInput = document.querySelector("#referral-name");
  const referralOutput = document.querySelector("#referral-link");
  const referralButton = document.querySelector("#generate-referral");

  if (referralButton && referralInput && referralOutput) {
    referralButton.addEventListener("click", () => {
      const name = referralInput.value.trim();

      if (!name) {
        referralInput.focus();
        return;
      }

      const base = window.location.origin + window.location.pathname;

      const slug = encodeURIComponent(
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );

      const link = `${base}?deputy=${slug}`;

      referralOutput.value = link;
      referralOutput.removeAttribute("hidden");
      referralOutput.focus();
      referralOutput.select();

      try {
        navigator.clipboard.writeText(link);
      } catch (_) {}

      const original = referralButton.textContent;
      referralButton.textContent = "DEPUTY LINK COPIED ✓";

      setTimeout(() => {
        referralButton.textContent = original;
      }, 1800);
    });
  }

  const params = new URLSearchParams(window.location.search);
  const deputy = params.get("deputy");
  const deputyNotice = document.querySelector("#deputy-notice");

  if (deputy && deputyNotice) {
    deputyNotice.textContent =
      `You were deputized by ${deputy.replace(/-/g, " ")}.`;

    deputyNotice.hidden = false;
  }

  const treasury = document.querySelector("[data-treasury]");
  const progress = document.querySelector("[data-progress]");
  const target = 100000;

  if (treasury && progress) {
    const raw = treasury.textContent.replace(/[^0-9.]/g, "");
    const amount = Number(raw) || 0;

    progress.style.width =
      `${Math.min((amount / target) * 100, 100)}%`;
  }
});
