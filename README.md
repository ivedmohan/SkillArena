
# SkillArena

> TaPTaP Game Engine Hackathon 2026 — *Gamify Learning. Amplify Employability.*

**SkillArena** is a reusable, JSON-configured quiz-battle game engine built on Next.js + Firebase. Students practice aptitude, coding, and domain skills through timed, competitive, rewarding gameplay. TaPTaP admins can swap the entire question set weekly via JSON upload — **zero code changes**.

---

## Features

- **Combo system** — 3-in-a-row = 1.5x, 5-in-a-row = 2x, 10-in-a-row = 3x multiplier
- **Lives system** — 3 lives; wrong answer or timeout costs 1 life
- **Time bonus** — answer in under 5s = +5 pts, under 10s = +2 pts
- **Real-time leaderboard** — Firestore `onSnapshot` for live rank updates
- **Weak area analytics** — post-game chart of topics answered incorrectly
- **Content-agnostic** — swap the JSON, change all questions with zero code
- **Mobile-first** — fully playable on phones
- **Anti-cheat** — server-side answer validation via `/api/validate`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + custom CSS vars |
| Animations | Framer Motion |
| Database | Firebase Firestore (real-time) |
| Auth | Firebase Anonymous Auth |
| File Storage | Firebase Storage |
| Hosting | Vercel |

---

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd skillarena
npm install
```

### 2. Firebase setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Firestore**, **Anonymous Auth**, and **Storage**
3. Copy your config:

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your Firebase credentials.

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Swapping Question Sets

SkillArena is fully content-agnostic. To change the quiz content:

1. Create a JSON file matching the schema below
2. Go to `/admin` and upload it — it's stored in Firebase Storage
3. Done. No code changes.

### JSON Schema

```json
{
  "meta": {
    "title": "Aptitude Week 1",
    "category": "Aptitude",
    "difficulty": "medium",
    "timePerQuestion": 15,
    "totalLives": 3,
    "version": "1.0"
  },
  "questions": [
    {
      "id": "q1",
      "question": "If 20% of a number is 80, what is the number?",
      "options": ["300", "400", "500", "600"],
      "answer": "400",
      "topic": "Percentages",
      "points": 10,
      "explanation": "20% of x = 80 → x = 80/0.2 = 400"
    }
  ]
}
```

**Rules:**
- `answer` must exactly match one value in `options`
- `topic` is used for analytics grouping — always include it
- `explanation` is shown after answer reveal — always include it

---

## Project Structure

```
skillarena/
├── app/
│   ├── page.jsx                  ← Landing page (join/create room)
│   ├── game/[roomId]/page.jsx    ← Core game screen
│   ├── results/page.jsx          ← Post-game score + analytics
│   ├── admin/page.jsx            ← Upload new JSON question sets
│   └── api/
│       ├── generate-room/        ← POST: create secure room ID
│       └── validate/             ← POST: server-side answer validation
├── components/
│   ├── QuestionCard.jsx
│   ├── Timer.jsx
│   ├── Leaderboard.jsx
│   ├── LifeBar.jsx
│   ├── ComboIndicator.jsx
│   └── AnalyticsChart.jsx
├── engine/                       ← Pure game logic (no React)
│   ├── gameEngine.js
│   ├── questionLoader.js
│   └── sessionManager.js
├── hooks/
│   ├── useGameEngine.js
│   ├── useLeaderboard.js
│   └── useTimer.js
├── lib/
│   ├── firebase.js
│   └── firestoreHelpers.js
├── constants/
│   └── gameConfig.js
└── public/questions/
    └── sample.json               ← Default aptitude question set
```

---

## Game Config

All tunable constants are in `constants/gameConfig.js`:

```js
COMBO_THRESHOLDS: { 3: 1.5, 5: 2.0, 10: 3.0 }
TIME_BONUS_TIERS: { 5: 5, 10: 2 }     // seconds: bonus points
DEFAULT_LIVES: 3
DEFAULT_TIME_PER_QUESTION: 15
ANSWER_REVEAL_DURATION: 2000           // ms
COUNTDOWN_BEFORE_START: 3             // seconds
```

---

## Deploy

```bash
# Deploy to Vercel
npx vercel
```

Add all `NEXT_PUBLIC_FIREBASE_*` env vars in the Vercel dashboard.

---

*Built for TaPTaP Game Engine Hackathon 2026 — vedmohan0@gmail.com*
