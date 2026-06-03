import { CONFIG } from "../config.js";
import { POSTER_TEMPLATES } from "./templates.js";
import { renderAllPosters } from "./compositor.js";
import { preloadTemplates } from "./imageLoader.js";

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function createPosterPhase(options) {
  const {
    stageEl,
    canvasEl,
    gridEl,
    titleEl,
    counterEl,
    hintEl,
    nextBtn,
    prevBtn,
    continueBtn,
    templates = POSTER_TEMPLATES,
    onContinue
  } = options;

  const flashEl = stageEl?.querySelector(".poster-stage__flash");
  const scenarioHoldMs =
    Number(CONFIG.poster?.flashScenarioMs) ||
    Number(CONFIG.poster?.flashHoldMs) ||
    3000;
  const burstMs = Number(CONFIG.poster?.flashBurstMs) || 680;

  let posters = [];
  let index = 0;
  let visible = false;
  let sequenceAbort = false;

  function paintCurrentPoster() {
    if (!posters.length) {
      return;
    }

    const { template, canvas } = posters[index];
    const displayCtx = canvasEl.getContext("2d", { alpha: false });

    if (!displayCtx) {
      return;
    }

    if (canvasEl.width !== canvas.width || canvasEl.height !== canvas.height) {
      canvasEl.width = canvas.width;
      canvasEl.height = canvas.height;
    }

    displayCtx.drawImage(canvas, 0, 0);

    titleEl.textContent = template.title;
    counterEl.textContent = `${index + 1} / ${posters.length}`;
    updateNavControls();
  }

  function updateNavControls() {
    if (!posters.length) {
      return;
    }

    const inOverview = stageEl?.classList.contains("poster-stage--overview");

    if (prevBtn) {
      prevBtn.disabled = true;
      prevBtn.hidden = inOverview;
    }

    if (nextBtn) {
      nextBtn.disabled = true;
      nextBtn.hidden = inOverview;
    }

    if (hintEl && inOverview) {
      hintEl.textContent = "Your face, misplaced across every context";
    }
  }

  function flashPosterTransition() {
    canvasEl?.classList.remove("poster-stage__canvas--flash-in");
    void canvasEl?.offsetWidth;
    canvasEl?.classList.add("poster-stage__canvas--flash-in");
  }

  function showCurrent() {
    paintCurrentPoster();
    flashPosterTransition();
  }

  function triggerFlash(intense = false) {
    if (!flashEl) {
      return;
    }

    flashEl.classList.remove(
      "poster-stage__flash--active",
      "poster-stage__flash--intense"
    );
    void flashEl.offsetWidth;
    flashEl.classList.add("poster-stage__flash--active");
    if (intense) {
      flashEl.classList.add("poster-stage__flash--intense");
    }

    stageEl?.classList.remove("poster-stage--impact");
    void stageEl?.offsetWidth;
    stageEl?.classList.add("poster-stage--impact");
  }

  function setSequenceMode(active) {
    stageEl?.classList.toggle("poster-stage--sequencing", active);
  }

  function setOverviewMode(active) {
    stageEl?.classList.toggle("poster-stage--overview", active);
    stageEl?.classList.toggle("poster-stage--await-continue", active);
    gridEl?.setAttribute("aria-hidden", active ? "false" : "true");
    updateNavControls();
  }

  function buildPosterGrid() {
    if (!gridEl) {
      return;
    }

    gridEl.innerHTML = "";

    posters.forEach(({ template, canvas }, itemIndex) => {
      const item = document.createElement("figure");
      item.className = "poster-stage__grid-item";
      item.style.setProperty("--grid-index", String(itemIndex));

      const media = document.createElement("div");
      media.className = "poster-stage__grid-media";

      const image = document.createElement("img");
      image.className = "poster-stage__grid-image";
      image.src = canvas.toDataURL("image/png");
      image.width = canvas.width;
      image.height = canvas.height;
      image.alt = template.title;

      const caption = document.createElement("figcaption");
      caption.className = "poster-stage__grid-label";
      caption.textContent = template.title;

      media.appendChild(image);
      item.append(media, caption);
      gridEl.appendChild(item);
    });
  }

  function showOverview() {
    buildPosterGrid();

    if (titleEl) {
      titleEl.textContent = "Everywhere at once";
    }

    if (counterEl) {
      counterEl.textContent = `${posters.length} scenarios`;
    }

    setOverviewMode(true);
    gridEl?.classList.remove("poster-stage__grid--revealed");
    void gridEl?.offsetWidth;
    gridEl?.classList.add("poster-stage__grid--revealed");
  }

  async function playFlashSequence() {
    sequenceAbort = false;
    setSequenceMode(true);
    showStage();

    for (let i = 0; i < posters.length; i += 1) {
      if (sequenceAbort) {
        break;
      }

      index = i;
      triggerFlash(i > 0);
      showCurrent();
      await wait(burstMs);

      if (sequenceAbort) {
        break;
      }

      await wait(scenarioHoldMs);
    }

    stageEl?.classList.remove("poster-stage--impact");
    setSequenceMode(false);
    showOverview();
  }

  function showStage() {
    stageEl.classList.remove("poster-stage--hidden");
    stageEl.removeAttribute("aria-hidden");
    visible = true;
  }

  function hideStage() {
    stageEl.classList.add("poster-stage--hidden");
    stageEl.setAttribute("aria-hidden", "true");
    stageEl.classList.remove("poster-stage--sequencing");
    stageEl.classList.remove("poster-stage--overview");
    stageEl.classList.remove("poster-stage--await-continue");
    gridEl?.classList.remove("poster-stage__grid--revealed");
    gridEl?.setAttribute("aria-hidden", "true");
    visible = false;
  }

  async function continueToOutro() {
    if (!stageEl?.classList.contains("poster-stage--await-continue")) {
      return;
    }
    sequenceAbort = true;
    setOverviewMode(false);
    hideStage();
    await onContinue?.();
  }

  continueBtn?.addEventListener("click", continueToOutro);

  document.addEventListener("keydown", (event) => {
    if (!visible || stageEl?.classList.contains("poster-stage--sequencing")) {
      return;
    }

    if (
      stageEl?.classList.contains("poster-stage--await-continue") &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      continueToOutro();
    }
  });

  return {
    async start(video, faceData) {
      try {
        await preloadTemplates(templates);
      } catch (error) {
        console.error(error);
        return false;
      }

      posters = renderAllPosters(video, faceData, templates);
      if (!posters.length) {
        return false;
      }

      index = 0;
      await playFlashSequence();
      return true;
    }
  };
}
