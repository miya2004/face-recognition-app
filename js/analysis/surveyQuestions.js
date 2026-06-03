export const SURVEY_QUESTIONS = [
  {
    id: "awareness",
    text: "Were you aware that systems can gather this much information about you from your face?",
    type: "yesno",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" }
    ]
  },
  {
    id: "recommend",
    text: "Would you recommend this installation to your friends?",
    type: "scale",
    minLabel: "Not really",
    maxLabel: "Very much",
    defaultValue: 50
  },
  {
    id: "felt-response",
    text: "How did this experience make you feel overall?",
    type: "scale",
    minLabel: "Calm & unaffected",
    maxLabel: "Exposed & unsettled",
    defaultValue: 50
  },
  {
    id: "surprised",
    text: "How surprised were you by how much could be learned about you?",
    type: "scale",
    minLabel: "Not surprised",
    maxLabel: "Very surprised",
    defaultValue: 50
  },
  {
    id: "careful",
    text: "Would you be more careful about where you show your face from now on?",
    type: "yesno",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" }
    ]
  }
];
