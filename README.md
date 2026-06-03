# Night of the Nerds — Face Experience

Interactive face filter and analysis experience.

## Flow

1. `index.html` — landing and onboarding
2. `frapp.html` — makeup filters
3. `analysis.html` — face analysis and poster scenarios
4. Survey — quick reflection (saved to CSV)
5. Outro and data disposal

## Run locally

Camera access requires a local server. Use the project server so **survey answers are saved to CSV** (open in Excel):

```bash
cd face-recognition-app
python3 server.py
```

Then open [http://127.0.0.1:5173/index.html](http://127.0.0.1:5173/index.html)

Responses are appended to `data/survey-responses.csv` — one row per visitor.

> **Note:** `python3 -m http.server` only serves files; it does **not** record survey answers.

## Survey CSV columns

| Column | Question |
|--------|----------|
| `timestamp` | When the survey was submitted (UTC) |
| `awareness` | Were you aware systems can gather this much from your face? (yes/no) |
| `recommend` | Recommend to friends (0–100) |
| `felt_response` | How the experience felt overall (0–100) |
| `surprised` | How surprised by how much could be learned (0–100) |
| `careful` | More careful about where you show your face (yes/no) |

## Structure

```
├── index.html          Landing page
├── frapp.html          Makeup filters
├── analysis.html       Face analysis experience
├── server.py           Local server + survey CSV logging
├── data/
│   └── survey-responses.csv   (created on first submission)
├── css/
│   └── analysis.css
├── js/
│   └── analysis/       Analysis modules
└── assets/             Poster templates and images
```
