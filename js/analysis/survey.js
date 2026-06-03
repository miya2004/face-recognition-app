function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function createYesNoOptions(question, onSelect) {
  const fragment = document.createDocumentFragment();

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "survey__option survey__option--yesno";
    button.textContent = option.label;
    button.dataset.value = String(option.value);
    button.addEventListener("click", () => onSelect(option.value, button));
    fragment.appendChild(button);
  });

  return fragment;
}

function createScaleControl(question, onSubmit) {
  const wrap = document.createElement("div");
  wrap.className = "survey__scale";

  let value = clamp(Number(question.defaultValue ?? 50), 0, 100);
  let hasInteracted = false;
  let dragging = false;

  const valueEl = document.createElement("p");
  valueEl.className = "survey__scale-value";
  valueEl.setAttribute("aria-live", "polite");
  valueEl.classList.add("survey__scale-value--hidden");
  valueEl.textContent = `${value}%`;

  const track = document.createElement("div");
  track.className = "survey__scale-track";
  track.setAttribute("role", "slider");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", "100");
  track.setAttribute("aria-valuenow", String(value));
  track.setAttribute("aria-label", question.text);

  const fill = document.createElement("div");
  fill.className = "survey__scale-fill";

  const thumb = document.createElement("div");
  thumb.className = "survey__scale-thumb";

  track.append(fill, thumb);

  const labels = document.createElement("div");
  labels.className = "survey__scale-labels";

  const minLabel = document.createElement("span");
  minLabel.className = "survey__scale-label survey__scale-label--min";
  minLabel.textContent = question.minLabel || "Low";

  const maxLabel = document.createElement("span");
  maxLabel.className = "survey__scale-label survey__scale-label--max";
  maxLabel.textContent = question.maxLabel || "High";

  labels.append(minLabel, maxLabel);

  const continueBtn = document.createElement("button");
  continueBtn.type = "button";
  continueBtn.className = "survey__option survey__scale-continue";
  continueBtn.textContent = "Continue";
  continueBtn.disabled = true;

  function paintScale() {
    valueEl.textContent = `${value}%`;
    fill.style.width = `${value}%`;
    thumb.style.left = `${value}%`;
    track.setAttribute("aria-valuenow", String(value));
  }

  function setValue(nextValue, interacted = true) {
    value = clamp(Math.round(nextValue), 0, 100);
    if (interacted) {
      hasInteracted = true;
      continueBtn.disabled = false;
    }
    paintScale();
  }

  function valueFromClientX(clientX) {
    const rect = track.getBoundingClientRect();
    if (!rect.width) {
      return value;
    }
    return ((clientX - rect.left) / rect.width) * 100;
  }

  function onPointerDown(event) {
    if (dragging) {
      return;
    }
    dragging = true;
    track.setPointerCapture(event.pointerId);
    setValue(valueFromClientX(event.clientX));
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (!dragging) {
      return;
    }
    setValue(valueFromClientX(event.clientX));
    event.preventDefault();
  }

  function onPointerUp(event) {
    if (!dragging) {
      return;
    }
    dragging = false;
    track.releasePointerCapture(event.pointerId);
    event.preventDefault();
  }

  track.addEventListener("pointerdown", onPointerDown);
  track.addEventListener("pointermove", onPointerMove);
  track.addEventListener("pointerup", onPointerUp);
  track.addEventListener("pointercancel", onPointerUp);

  thumb.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
    onPointerDown(event);
  });

  continueBtn.addEventListener("click", () => {
    if (!hasInteracted || continueBtn.disabled) {
      return;
    }
    onSubmit(value);
  });

  paintScale();
  wrap.append(valueEl, track, labels, continueBtn);
  return wrap;
}

export function showSurvey(questions) {
  return new Promise((resolve) => {
    if (!questions?.length) {
      resolve({});
      return;
    }

    document.body.classList.add("survey-active");

    const root = document.createElement("section");
    root.className = "survey";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-live", "polite");

    root.innerHTML = `
      <div class="survey__depth" aria-hidden="true"></div>
      <div class="survey__content">
        <p class="survey__label">Quick reflection</p>
        <p class="survey__progress" id="surveyProgress"></p>
        <h2 class="survey__question" id="surveyQuestion"></h2>
        <div class="survey__options" id="surveyOptions" role="group"></div>
      </div>
    `;

    const progressEl = root.querySelector("#surveyProgress");
    const questionEl = root.querySelector("#surveyQuestion");
    const optionsEl = root.querySelector("#surveyOptions");

    document.body.appendChild(root);
    root.classList.add("survey--visible");

    const answers = {};
    let index = 0;
    let finished = false;
    let advancing = false;

    function finish() {
      if (finished) {
        return;
      }
      finished = true;
      document.body.classList.remove("survey-active");
      root.classList.add("survey--leaving");

      const cleanup = () => {
        root.remove();
        resolve(answers);
      };

      root.addEventListener("transitionend", cleanup, { once: true });
      window.setTimeout(cleanup, 700);
    }

    async function advanceAfterAnswer() {
      await wait(280);

      index += 1;
      advancing = false;

      if (index >= questions.length) {
        finish();
        return;
      }

      renderQuestion();
    }

    async function selectYesNoAnswer(question, answerValue, buttonEl) {
      if (finished || advancing) {
        return;
      }

      advancing = true;
      answers[question.id] = answerValue;

      optionsEl.querySelectorAll(".survey__option").forEach((btn) => {
        btn.disabled = true;
        btn.classList.remove("survey__option--selected");
      });
      buttonEl.classList.add("survey__option--selected");

      await advanceAfterAnswer();
    }

    async function selectScaleAnswer(question, percentage) {
      if (finished || advancing) {
        return;
      }

      advancing = true;
      answers[question.id] = percentage;

      optionsEl.querySelectorAll("button").forEach((btn) => {
        btn.disabled = true;
      });

      await advanceAfterAnswer();
    }

    function renderQuestion() {
      const question = questions[index];
      if (!question) {
        finish();
        return;
      }

      progressEl.textContent = `Question ${index + 1} of ${questions.length}`;
      questionEl.textContent = question.text;
      questionEl.tabIndex = -1;
      optionsEl.replaceChildren();

      if (question.type === "scale") {
        optionsEl.appendChild(
          createScaleControl(question, (percentage) =>
            selectScaleAnswer(question, percentage)
          )
        );
      } else {
        optionsEl.appendChild(
          createYesNoOptions(question, (value, button) =>
            selectYesNoAnswer(question, value, button)
          )
        );
      }

      root.classList.remove("survey--advance");
      void root.offsetWidth;
      root.classList.add("survey--advance");
      questionEl.focus({ preventScroll: true });
    }

    renderQuestion();
  });
}
