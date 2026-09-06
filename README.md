# SmartBite AI

A mobile-first web app that scans food/grocery photos, generates AI workouts, and tracks
nutrition, savings, and fitness progress over time.

- **Frontend**: React 19 + Vite + Tailwind CSS v4 (`client/`)
- **Backend**: Node.js + Express (`server/`)
- **Database**: SQLite via `better-sqlite3` (`server/data/smartbite.sqlite`, auto-created)
- **AI**: Anthropic API (`@anthropic-ai/sdk`) for image analysis and workout generation

## App structure

Four bottom-nav tabs:

1. **Dashboard** — capture a photo of a meal, groceries, or a receipt. The backend
   (`POST /api/scan`) sends it to Claude along with your note and gym mode, and returns
   ingredients, calorie/macro totals, a nutrition score, and Tesco vs Aldi price comparisons.
2. **Workouts** — toggle Gym Mode / Home Mode, pick a style (Weight Lifting, Cardio / Running,
   Full Body Toning), and generate a 4-step routine (`POST /api/workout`). Mark a workout
   complete to log it to SQLite.
3. **Progress** — an interactive SVG line chart plotting Nutrition Score (purple), Money Saved
   (green), and Workouts Completed (blue) over the last 14 days, plus a hydration tracker.
4. **Settings** — dietary preferences, calorie/budget goals, and account/plan status.

## Getting started

```bash
npm run install:all        # installs server + client dependencies
cp server/.env.example server/.env
# then edit server/.env and set ANTHROPIC_API_KEY

npm run dev                # runs the Express API (5000) and Vite dev server (5173) together
```

Open http://localhost:5173 — the Vite dev server proxies `/api/*` requests to the Express
server on port 5000.

### Production build

```bash
npm run build               # builds client/dist
npm start                   # serves the API and the built client from a single Express process
```

## Environment variables (`server/.env`)

| Variable            | Description                                              |
| -------------------- | --------------------------------------------------------- |
| `PORT`               | Express server port (default `5000`)                     |
| `ANTHROPIC_API_KEY`  | Required for `/api/scan` and `/api/workout` to function   |
| `ANTHROPIC_MODEL`    | Optional model override (defaults to a Claude Sonnet 4.5) |

Without `ANTHROPIC_API_KEY` set, the app still runs — the scan and workout routes return a
`503` explaining that AI features are unconfigured, while navigation, settings, hydration
tracking, and the progress chart continue to work against SQLite.

## API overview

| Route                          | Method | Purpose                                   |
| ------------------------------- | ------ | ------------------------------------------ |
| `/api/scan`                     | POST   | Analyze a food/receipt photo               |
| `/api/workout`                  | POST   | Generate a workout routine                 |
| `/api/workout/complete`         | POST   | Log a completed workout                    |
| `/api/workout/history`          | GET    | Recent completed workouts                  |
| `/api/progress/series`          | GET    | Daily nutrition/savings/workout series     |
| `/api/progress/hydration`       | POST   | Log a hydration click                      |
| `/api/progress/hydration/today` | GET    | Today's hydration count                    |
| `/api/progress/budget`          | GET/POST | Grocery savings entries                  |
| `/api/settings`                 | GET/PUT  | Account profile & dietary preferences    |
