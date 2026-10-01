# ScholarMate AI — Frontend

A frontend-only prototype for ScholarMate AI: an AI-powered scholarship
discovery product. Built with plain **HTML, Tailwind-style hand-written CSS,
and vanilla JavaScript** — no frameworks, no build step, no backend.

> This is the frontend only. Every network call is a placeholder `fetch()`
> that currently resolves with mock JSON (see `js/api.js`). Connect it to
> your FastAPI backend by uncommenting the real `fetch()` blocks in that
> file.

## Running it

No build step is required.

- **Quickest:** double-click `index.html` to open it in a browser.
- **Recommended:** serve the folder with a local server so relative paths
  and any future `fetch()` calls behave exactly like production — e.g. the
  VS Code "Live Server" extension, or:
  ```bash
  python3 -m http.server 5500
  ```
  then visit `http://localhost:5500`.

## Project structure

```
scholarmate-frontend/
├── index.html                 # Landing page
├── pages/
│   ├── finder.html             # Scholarship Finder form
│   ├── results.html            # Ranked results + filters
│   ├── details.html            # Single scholarship details
│   ├── assistant.html          # AI chat assistant
│   ├── about.html
│   └── contact.html
├── components/                 # Reference docs for reusable UI pieces
│   ├── navbar.html
│   ├── footer.html
│   └── README.md
├── css/
│   ├── styles.css              # Design tokens + all component styles
│   └── animations.css          # Animation-only utilities
├── js/
│   ├── main.js                  # Navbar/footer injection, ripple, toasts, scroll reveal
│   ├── api.js                   # Mock data + fetch() placeholders for the backend
│   ├── finder.js                # Finder form logic
│   ├── results.js               # Results grid, filters, sorting
│   ├── details.js               # Scholarship details rendering
│   └── assistant.js             # Chat UI logic
├── assets/                      # (empty — drop images/icons here)
└── README.md
```

## Connecting your FastAPI backend

All API calls live in `js/api.js`. Each function already has the real
`fetch()` call written out and commented, matching the endpoints below:

| Function | Endpoint |
|---|---|
| `matchScholarships(profile)` | `POST /match` |
| `getScholarships(filters)` | `GET /scholarships` |
| `getScholarshipById(id)` | `GET /scholarship/:id` |
| `sendChatMessage(message, history)` | `POST /chat` |

To go live: set `API_BASE_URL` at the top of `js/api.js`, uncomment the
`fetch()` block in each function, and delete the mock branch beneath it.
No other file needs to change — every page already calls these functions,
not the mock data directly.

## Design system

- **Palette:** white/paper background with a blue → indigo gradient
  (`--blue-600` to `--indigo-600`) as the primary brand color, amber for
  deadlines, emerald for match scores.
- **Type:** [Sora](https://fonts.google.com/specimen/Sora) for headings,
  [Inter](https://fonts.google.com/specimen/Inter) for body text,
  [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) for
  data — match percentages, amounts, deadlines — so numbers read distinctly
  from prose.
- All tokens (color, radius, shadow, type) are defined once as CSS custom
  properties at the top of `css/styles.css`.

## Accessibility notes

- Visible focus rings on all interactive elements.
- `prefers-reduced-motion` is respected — the animated hero search demo and
  scroll-reveal fall back to a static state.
- Semantic landmarks (`header`, `main`, `footer`, `nav`, `aside`) and
  `aria-live` regions on the chat and toast components.

## Not implemented (by design)

- No backend, no database, no real API calls.
- No authentication, login, or user accounts.
- No React/Vue/Angular — vanilla JS only, per the project brief.
