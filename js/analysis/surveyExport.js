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
      console.warn("Survey save failed:", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Survey save failed:", error);
    return false;
  }
}
