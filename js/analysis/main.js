import { CONFIG } from "./config.js";
import { loadFaceModels, detectFace } from "./faceAnalyzer.js";
import { startWebcam } from "./webcam.js";
import { renderOverlay, syncCanvasToVideo } from "./overlayRenderer.js";
import { setDramaticText, setNotice } from "./ui.js";
import {
  onFaceStateChange,
  showBootMessage,
  showMessage,
  startAmbientChatter,
  stopAmbientChatter
} from "./messages.js";
import { startPulseScheduler, stopPulseScheduler } from "./pulse.js";
import { showOutro } from "./outro.js";
import { OUTRO_SLIDES } from "./outroSlides.js";
import { showDataDisposal } from "./dataDisposal.js";
import { createPosterPhase } from "./poster/posterPhase.js";
import { POSTER_TEMPLATES } from "./poster/templates.js";

const video = document.getElementById("webcam");
const canvas = document.getElementById("overlay");
const mirror = document.getElementById("mirror");
const captureCountdownEl = document.getElementById("captureCountdown");
const captureCountdownValueEl = document.getElementById("captureCountdownValue");

const POSTER_TIMING = {
  analysisDurationMs: Number(CONFIG.poster?.analysisDurationMs) || 30_000,
  captureCountdownSeconds: Number(CONFIG.poster?.captureCountdownSeconds) || 5
};

let latestFaceData = null;
let previousFaceData = null;
let analyzing = false;
let lastAnalysisTimestamp = 0;
let hadFace = false;
let analysisFrameId = null;
let phase = "analysis";
let posterTransitionStarted = false;

let analysisSubphase = "observe";
let observationStartedAt = null;
let countdownStartedAt = null;
let lastCountdownDisplay = null;
let phaseSchedulerId = null;
let posterAttemptCount = 0;
const MAX_POSTER_ATTEMPTS = 2;

const PANEL_IDS = {
  state: "dramaticState",
  age: "dramaticAge",
  gender: "dramaticGender",
  emotion: "dramaticEmotion"
};

const posterTemplates = CONFIG.poster.templateIds
  ? POSTER_TEMPLATES.filter((t) => CONFIG.poster.templateIds.includes(t.id))
  : POSTER_TEMPLATES;

const posterPhase = createPosterPhase({
  stageEl: document.getElementById("posterStage"),
  canvasEl: document.getElementById("posterCanvas"),
  gridEl: document.getElementById("posterGrid"),
  titleEl: document.getElementById("posterTitle"),
  counterEl: document.getElementById("posterCounter"),
  hintEl: document.getElementById("posterHint"),
  nextBtn: document.getElementById("posterNext"),
  prevBtn: document.getElementById("posterPrev"),
  continueBtn: document.getElementById("posterContinue"),
  templates: posterTemplates,
  onContinue: beginOutroPhase
});

function setAtmosphere(mode) {
  document.body.classList.remove(
    "atmosphere--boot",
    "atmosphere--scanning",
    "atmosphere--locked",
    "atmosphere--alert"
  );
  if (mode) {
    document.body.classList.add(`atmosphere--${mode}`);
  }
}

function setLivePanels(faceData) {
  if (!faceData) {
    setDramaticText(PANEL_IDS.state, "STATUS: SCANNING FOR SUBJECT", "searching");
    setDramaticText(PANEL_IDS.age, "AGE: --", "age");
    setDramaticText(PANEL_IDS.gender, "GENDER: --", "gender");
    setDramaticText(PANEL_IDS.emotion, "EMOTION: --", "searching");
    setAtmosphere("scanning");
    mirror?.classList.remove("mirror--locked");
    return;
  }

  setDramaticText(PANEL_IDS.state, "STATUS: SUBJECT LOCKED", "alert");
  setDramaticText(PANEL_IDS.age, `AGE: ${Math.round(faceData.age)} YEARS`, "age");
  setDramaticText(
    PANEL_IDS.gender,
    `GENDER: ${faceData.gender.toUpperCase()} ${Math.round(
      faceData.genderProbability * 100
    )}%`,
    "gender"
  );
  setDramaticText(
    PANEL_IDS.emotion,
    `EMOTION: ${faceData.emotion.toUpperCase()} ${Math.round(
      faceData.emotionConfidence * 100
    )}%`,
    "alert"
  );
  setAtmosphere("locked");
  mirror?.classList.add("mirror--locked");
}

function stopPhaseScheduler() {
  if (phaseSchedulerId) {
    window.clearInterval(phaseSchedulerId);
    phaseSchedulerId = null;
  }
}

function startPhaseScheduler() {
  stopPhaseScheduler();

  phaseSchedulerId = window.setInterval(() => {
    if (phase !== "analysis" || posterTransitionStarted) {
      return;
    }

    if (analysisSubphase === "observe") {
      if (
        observationStartedAt &&
        Date.now() - observationStartedAt >= POSTER_TIMING.analysisDurationMs
      ) {
        startCaptureCountdown();
      }
      return;
    }

    if (analysisSubphase === "countdown") {
      tickCaptureCountdown();
    }
  }, 200);
}

function hideCaptureCountdown() {
  captureCountdownEl?.classList.add("capture-countdown--hidden");
  captureCountdownEl?.setAttribute("aria-hidden", "true");
  mirror?.classList.remove("mirror--countdown");
}

function showCaptureCountdown(value) {
  if (!captureCountdownEl || !captureCountdownValueEl) {
    return;
  }

  captureCountdownValueEl.textContent = String(value);
  captureCountdownEl.classList.remove("capture-countdown--hidden");
  captureCountdownEl.setAttribute("aria-hidden", "false");
  mirror?.classList.add("mirror--countdown");

  if (value !== lastCountdownDisplay) {
    captureCountdownEl.classList.remove("capture-countdown--pulse");
    void captureCountdownEl.offsetWidth;
    captureCountdownEl.classList.add("capture-countdown--pulse");
    lastCountdownDisplay = value;
  }
}

function startCaptureCountdown() {
  if (analysisSubphase !== "observe" || posterTransitionStarted) {
    return;
  }

  analysisSubphase = "countdown";
  countdownStartedAt = Date.now();
  lastCountdownDisplay = null;
  setNotice("");
  showCaptureCountdown(POSTER_TIMING.captureCountdownSeconds);
}

function tickCaptureCountdown() {
  if (analysisSubphase !== "countdown" || !countdownStartedAt || posterTransitionStarted) {
    return;
  }

  const elapsed = Date.now() - countdownStartedAt;
  const secondsElapsed = Math.floor(elapsed / 1000);
  const remaining = POSTER_TIMING.captureCountdownSeconds - secondsElapsed;

  if (remaining <= 0) {
    hideCaptureCountdown();
    beginPosterPhase();
    return;
  }

  showCaptureCountdown(remaining);
}

function onFaceDataUpdate(data) {
  onFaceStateChange(previousFaceData, data);
  previousFaceData = data ? { ...data } : null;
  latestFaceData = data;
  setLivePanels(data);

  if (data && !hadFace) {
    setAtmosphere("alert");
    window.setTimeout(() => setAtmosphere("locked"), 700);
  }

  hadFace = Boolean(data);
}

function stopAnalysisLoop() {
  if (analysisFrameId) {
    cancelAnimationFrame(analysisFrameId);
    analysisFrameId = null;
  }
  stopPhaseScheduler();
}

async function retryCapturePhase(reason) {
  posterAttemptCount += 1;

  if (posterAttemptCount >= MAX_POSTER_ATTEMPTS) {
    setNotice("Proceeding without capture…");
    showMessage("Continuing experience", 2200);
    await beginOutroPhase();
    return;
  }

  phase = "analysis";
  posterTransitionStarted = false;
  analysisSubphase = "observe";
  observationStartedAt = Date.now();
  countdownStartedAt = null;
  lastCountdownDisplay = null;
  hideCaptureCountdown();
  setNotice(reason);
  showMessage("Look at the screen", 2200);
  startPhaseScheduler();
  requestAnimationFrame(analysisTick);
  startPulseScheduler();
  startAmbientChatter(() => Boolean(latestFaceData));
}

async function beginPosterPhase() {
  if (posterTransitionStarted || phase !== "analysis") {
    return;
  }

  posterTransitionStarted = true;
  phase = "poster";
  hideCaptureCountdown();
  stopPhaseScheduler();

  stopAnalysisLoop();
  stopPulseScheduler();
  stopAmbientChatter();

  setDramaticText(PANEL_IDS.state, "STATUS: CAPTURING IDENTITY", "alert");
  showMessage("Generating misplaced scenarios…", 2800);

  const posterNotice = document.getElementById("posterNotice");
  if (posterNotice) {
    posterNotice.textContent = "Compositing locally — nothing is saved";
  }
  setNotice("Preparing poster scenarios…");

  let faceSnapshot = null;
  try {
    faceSnapshot = await detectFace(video);
  } catch {
    faceSnapshot = latestFaceData;
  }

  if (!faceSnapshot) {
    await retryCapturePhase("No face detected — look at the camera");
    return;
  }

  await new Promise((resolve) => window.setTimeout(resolve, 600));

  const started = await posterPhase.start(video, faceSnapshot);
  if (!started) {
    await retryCapturePhase("Capture failed — look at the camera");
    return;
  }

  posterAttemptCount = 0;
  mirror?.classList.add("mirror--poster-hidden");
}

async function beginOutroPhase() {
  phase = "outro";
  mirror?.classList.add("mirror--poster-hidden");

  await showOutro(OUTRO_SLIDES);
  await showDataDisposal({ video });

  // Brief pause so media tracks and in-flight requests can close cleanly
  // before navigating away (avoids hung single-threaded dev server issues).
  await new Promise((resolve) => window.setTimeout(resolve, 350));

  const landingUrl = new URL("./index.html", window.location.href).href;
  window.location.replace(landingUrl);
}

async function analysisTick(timestamp) {
  if (phase !== "analysis") {
    return;
  }

  syncCanvasToVideo(canvas, video);

  if (!analyzing && timestamp - lastAnalysisTimestamp >= CONFIG.detectionIntervalMs) {
    analyzing = true;
    lastAnalysisTimestamp = timestamp;
    detectFace(video)
      .then(onFaceDataUpdate)
      .catch(() => {
        setDramaticText(PANEL_IDS.state, "STATUS: ANALYSIS ERROR", "alert");
        showMessage("Analysis error — retrying", 2400);
        setAtmosphere("alert");
      })
      .finally(() => {
        analyzing = false;
      });
  }

  renderOverlay(canvas, latestFaceData, CONFIG.draw);
  analysisFrameId = requestAnimationFrame(analysisTick);
}

function resumeAnalysisPhase() {
  phase = "analysis";
  posterTransitionStarted = false;
  posterAttemptCount = 0;
  analysisSubphase = "observe";
  observationStartedAt = Date.now();
  countdownStartedAt = null;
  lastCountdownDisplay = null;
  hadFace = false;
  latestFaceData = null;
  previousFaceData = null;

  hideCaptureCountdown();
  mirror?.classList.remove("mirror--poster-hidden");
  setNotice("Local session only — no data stored");
  setLivePanels(null);
  showMessage("Look at the screen", 2200);

  startPulseScheduler();
  startAmbientChatter(() => Boolean(latestFaceData));
  startPhaseScheduler();
  requestAnimationFrame(analysisTick);
}

async function init() {
  try {
    setAtmosphere("boot");
    setDramaticText(PANEL_IDS.state, "STATUS: BOOTING ANALYSIS ENGINE", "searching");
    showBootMessage("Starting analysis engine…");

    await loadFaceModels(CONFIG.modelUrls);
    setNotice("Local session only — no data stored");

    setDramaticText(PANEL_IDS.state, "STATUS: AWAITING CAMERA PERMISSION", "searching");
    showBootMessage("Requesting camera access…");
    await startWebcam(video, CONFIG.video);

    setDramaticText(PANEL_IDS.state, "STATUS: CAMERA LINK ESTABLISHED", "tracking");
    showMessage("Camera online");
    showMessage("Look at the screen");
    setLivePanels(null);

    observationStartedAt = Date.now();
    analysisSubphase = "observe";

    startPulseScheduler();
    startAmbientChatter(() => Boolean(latestFaceData));
    startPhaseScheduler();

    requestAnimationFrame(analysisTick);
  } catch (error) {
    stopAnalysisLoop();
    stopPulseScheduler();
    stopAmbientChatter();
    setNotice(error?.message || "Unknown initialization error.");
    setDramaticText(PANEL_IDS.state, "STATUS: INITIALIZATION FAILED", "alert");
    showMessage("Could not start — check camera permission", 3200);
    console.error(error);
  }
}

async function bootstrap() {
  mirror?.classList.remove("mirror--hidden");
  mirror?.removeAttribute("aria-hidden");
  await init();
}

bootstrap();
