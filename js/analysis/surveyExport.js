import { CONFIG } from "./config.js";
import { SURVEY_QUESTIONS } from "./surveyQuestions.js";

function formatAnswer(value, question) {
  if (value == null || value === "") {
    return "";
  }

  if (question?.type === "scale") {
    return String(value);
  }

  return String(value);
}

export function buildSurveyPayload(answers) {
  const timestamp = new Date().toISOString();
  const row = { timestamp };

  SURVEY_QUESTIONS.forEach((question) => {
    const key = question.id === "felt-response" ? "felt_response" : question.id;
    row[key] = formatAnswer(answers[question.id], question);
  });

  return row;
}

const CSV_HEADERS = [
  "timestamp",
  "awareness",
  "recommend",
  "felt_response",
  "surprised",
  "careful"
];

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function payloadToCsvRow(payload) {
  return CSV_HEADERS.map((key) => escapeCsvCell(payload[key])).join(",");
}

function downloadSurveyFallback(payload) {
  const header = CSV_HEADERS.join(",");
  const row = payloadToCsvRow(payload);
  const blob = new Blob([`${header}\n${row}\n`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `survey-response-${payload.timestamp.replace(/[:.]/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function submitSurveyAnswers(answers) {
  const submitUrl = CONFIG.survey?.submitUrl ?? "/api/survey";
  const payload = buildSurveyPayload(answers);

  try {
    const response = await fetch(submitUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const detail = await response.text();
      console.warn("Survey save failed:", response.status, detail);
      downloadSurveyFallback(payload);
      return { ok: false, fallback: true };
    }

    const result = await response.json().catch(() => ({}));
    const savedPath = result.path ? `data/${result.path}` : "data/survey-responses.csv";
    console.info(`Survey saved to ${savedPath} (inside face-recognition-app)`);
    return { ok: true, path: savedPath };
  } catch (error) {
    console.warn("Survey save failed:", error);
    console.warn(
      "Start the app with: python3 server.py — then open http://127.0.0.1:5173/index.html"
    );
    downloadSurveyFallback(payload);
    return { ok: false, fallback: true };
  }
}
