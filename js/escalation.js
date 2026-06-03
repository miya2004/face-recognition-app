const PLAY_MS = 30_000;

const ESCALATION_PROMPTS = [
  {
    title: "location access",
    body:
      "Allow this app to access your approximate location so we can suggest filters popular in your area and show region-aware beauty trends. Location may be shared with partners for ad personalization."
  },
  {
    title: "photo library access",
    body:
      "Allow access to your photos so we can compare your camera look with saved selfies, suggest matching makeup shades, and improve filter recommendations based on your image history."
  },
  {
    title: "contacts access",
    body:
      "Allow access to your contacts to find friends using the same filters, invite them to try looks with you, and personalize shared beauty recommendations."
  },
  {
    title: "microphone access",
    body:
      "Allow microphone access to detect when you speak, sync lip effects in real time, and analyze tone for expression-aware filter adjustments."
  },
  {
    title: "browsing history",
    body:
      "Allow reading recent browsing activity to infer your style preferences, favorite brands, and shopping interests for smarter filter suggestions."
  },
  {
    title: "biometric data",
    body:
      "Allow collection of facial geometry, skin texture maps, and expression patterns to build a persistent beauty profile and improve recognition accuracy over time."
  },
  {
    title: "advertising partners",
    body:
      "Allow sharing anonymized face and usage data with advertising partners so they can deliver personalized product offers inside and outside this experience."
  },
  {
    title: "data retention",
    body:
      "Allow storing your session data indefinitely so future visits can resume your profile, saved looks, and analysis history even after you leave this page."
  }
];

// Each step: how many popups, stagger between them, wait before next step.
// Delays shrink over time so popups arrive faster and faster.
const GRADUAL_STEPS = [
  { count: 1, staggerMs: 0, waitMs: 12_000 },
  { count: 1, staggerMs: 0, waitMs: 10_000 },
  { count: 1, staggerMs: 0, waitMs: 8500 },
  { count: 1, staggerMs: 0, waitMs: 7000 },
  { count: 1, staggerMs: 0, waitMs: 5800 },
  { count: 1, staggerMs: 0, waitMs: 4600 },
  { count: 1, staggerMs: 0, waitMs: 3600 },
  { count: 1, staggerMs: 0, waitMs: 2800 },
  { count: 2, staggerMs: 450, waitMs: 2200 },
  { count: 2, staggerMs: 350, waitMs: 1700 },
  { count: 3, staggerMs: 280, waitMs: 1300 },
  { count: 3, staggerMs: 220, waitMs: 900 }
];

const FINALE_COUNT = 8;
const FINALE_STAGGER_MS = 160;
const FINALE_HOLD_MS = 3500;

let popupSerial = 0;

function randomOffset(index) {
  const spread = Math.min(20 + index * 5, 80);
  return {
    x: (Math.random() - 0.5) * spread * 2,
    y: (Math.random() - 0.5) * spread
  };
}

function buildPopupHtml(prompt) {
  return `
    <div class="permission-popup escalation-popup__card" role="dialog" aria-modal="true">
      <div class="permission-cloud" aria-hidden="true">
        <div class="cloud-swirl"></div>
        <span class="cloud-part one"></span>
        <span class="cloud-part two"></span>
        <span class="cloud-part three"></span>
        <span class="cloud-part four"></span>
        <span class="cloud-face">👀<br>👄</span>
      </div>
      <div class="permission-card terms">
        <p>
          <span class="terms-title">do you want to allow ${prompt.title}?</span>
          ${prompt.body}
        </p>
        <div class="permission-actions">
          <button type="button" class="permission-action escalation-allow">allow</button>
          <button type="button" class="permission-action deny escalation-deny">don't allow</button>
        </div>
      </div>
    </div>
  `;
}

function createPopup(layer, prompt) {
  const index = popupSerial;
  popupSerial += 1;

  const offset = randomOffset(index);
  const popup = document.createElement("div");
  popup.className = "escalation-popup";
  popup.style.setProperty("--offset-x", `${offset.x}px`);
  popup.style.setProperty("--offset-y", `${offset.y}px`);
  popup.style.zIndex = String(20 + index);
  popup.innerHTML = buildPopupHtml(prompt);

  const remove = () => {
    popup.classList.add("escalation-popup--leaving");
    window.setTimeout(() => popup.remove(), 320);
  };

  popup.querySelector(".escalation-allow")?.addEventListener("click", (event) => {
    event.stopPropagation();
    remove();
  });
  popup.querySelector(".escalation-deny")?.addEventListener("click", (event) => {
    event.stopPropagation();
    remove();
  });

  layer.appendChild(popup);
  layer.dataset.intensity = String(index + 1);
  requestAnimationFrame(() => popup.classList.add("escalation-popup--visible"));

  return popup;
}

function pickPrompt(uniqueIndex, allowRepeat) {
  if (!allowRepeat && uniqueIndex < ESCALATION_PROMPTS.length) {
    return ESCALATION_PROMPTS[uniqueIndex];
  }

  return ESCALATION_PROMPTS[Math.floor(Math.random() * ESCALATION_PROMPTS.length)];
}

function spawnGroup(layer, count, staggerMs, uniqueIndex, allowRepeat) {
  for (let i = 0; i < count; i += 1) {
    window.setTimeout(() => {
      const prompt = pickPrompt(uniqueIndex + i, allowRepeat);
      createPopup(layer, prompt);
    }, i * staggerMs);
  }
}

function runFinale(layer, onComplete) {
  layer.classList.add("escalation-layer--overwhelm");
  document.body.classList.add("escalation-finale");

  spawnGroup(layer, FINALE_COUNT, FINALE_STAGGER_MS, 0, true);

  window.setTimeout(() => {
    onComplete?.();
  }, FINALE_HOLD_MS);
}

export function startEscalation({ onComplete } = {}) {
  const layer = document.getElementById("escalationLayer");
  if (!layer) {
    return;
  }

  let stepIndex = 0;
  let uniqueIndex = 0;
  let finished = false;
  let timerId = null;

  const runStep = () => {
    if (finished) {
      return;
    }

    if (stepIndex >= GRADUAL_STEPS.length) {
      finished = true;
      runFinale(layer, onComplete);
      return;
    }

    const step = GRADUAL_STEPS[stepIndex];
    const allowRepeat = stepIndex >= ESCALATION_PROMPTS.length;
    spawnGroup(layer, step.count, step.staggerMs, uniqueIndex, allowRepeat);
    uniqueIndex = Math.min(uniqueIndex + step.count, ESCALATION_PROMPTS.length);

    stepIndex += 1;
    timerId = window.setTimeout(runStep, step.waitMs);
  };

  window.setTimeout(() => {
    layer.classList.add("escalation-layer--active");
    document.body.classList.add("escalation-started");
    runStep();
  }, PLAY_MS);

  return () => {
    finished = true;
    if (timerId) {
      window.clearTimeout(timerId);
    }
  };
}
