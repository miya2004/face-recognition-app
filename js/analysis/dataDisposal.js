const DATA_ITEMS = [
  "face mesh",
  "age estimate",
  "gender read",
  "emotion scan",
  "camera frames",
  "filter session",
  "poster composites",
  "session metadata"
];

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function stopCamera(video) {
  const stream = video?.srcObject;
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => track.stop());
  video.srcObject = null;
}

export function showDataDisposal({ video } = {}) {
  return new Promise((resolve) => {
    stopCamera(video);
    document.body.classList.add("data-disposal-active");

    const root = document.createElement("section");
    root.className = "data-disposal";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-live", "polite");

    root.innerHTML = `
      <div class="data-disposal__depth" aria-hidden="true"></div>
      <div class="data-disposal__content">
        <p class="data-disposal__status" id="dataDisposalStatus">Discarding session data…</p>
        <div class="data-disposal__bin" aria-hidden="true">
          <span class="data-disposal__bin-lid"></span>
          <span class="data-disposal__bin-body"></span>
        </div>
        <ul class="data-disposal__list" id="dataDisposalList"></ul>
        <p class="data-disposal__final" id="dataDisposalFinal" hidden>
          All data thrown away.<br />Nothing was stored.
        </p>
        <p class="data-disposal__restart" id="dataDisposalRestart" hidden>
          Starting fresh for the next visitor…
        </p>
      </div>
      <div class="data-disposal__wipe" aria-hidden="true"></div>
    `;

    const listEl = root.querySelector("#dataDisposalList");
    const statusEl = root.querySelector("#dataDisposalStatus");
    const finalEl = root.querySelector("#dataDisposalFinal");
    const restartEl = root.querySelector("#dataDisposalRestart");
    const wipeEl = root.querySelector(".data-disposal__wipe");

    DATA_ITEMS.forEach((label, index) => {
      const item = document.createElement("li");
      item.className = "data-disposal__chip";
      item.style.animationDelay = `${index * 0.08}s`;
      item.innerHTML = `
        <span class="data-disposal__chip-label">${label}</span>
        <span class="data-disposal__chip-delete" aria-hidden="true">✕</span>
      `;
      listEl.appendChild(item);
    });

    document.body.appendChild(root);
    requestAnimationFrame(() => root.classList.add("data-disposal--visible"));

    let finished = false;

    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      document.body.classList.remove("data-disposal-active");
      root.remove();
      resolve();
    };

    async function runSequence() {
      await wait(1000);

      const chips = [...root.querySelectorAll(".data-disposal__chip")];
      for (let i = 0; i < chips.length; i += 1) {
        chips[i].classList.add("data-disposal__chip--discarding");
        await wait(280);
      }

      await wait(800);
      statusEl.textContent = "Session cleared";
      root.classList.add("data-disposal--cleared");
      finalEl.hidden = false;

      await wait(2200);
      restartEl.hidden = false;

      await wait(2400);
      root.classList.add("data-disposal--wipe");
      wipeEl.classList.add("data-disposal__wipe--active");

      await wait(1300);
      finish();
    }

    runSequence().catch(finish);
  });
}
