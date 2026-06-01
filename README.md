# Night of the Nerds — Face Experience

Interactive face filter and analysis experience.

## Flow

1. `index.html` — landing and onboarding
2. `frapp.html` — makeup filters
3. `analysis.html` — face analysis and poster scenarios

## Run locally

Camera access requires a local server:

```bash
python3 -m http.server 5173
```

Then open [http://localhost:5173/index.html](http://localhost:5173/index.html)

## Structure

```
├── index.html          Landing page
├── frapp.html          Makeup filters
├── analysis.html       Face analysis experience
├── css/
│   └── analysis.css
├── js/
│   └── analysis/       Analysis modules
└── assets/             Poster templates and images
```
