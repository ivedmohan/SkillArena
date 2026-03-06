# SkillArena — Engine Blueprint
### TaPTaP Game Engine Hackathon 2026 · League 1: Engine League

> **"Not a quiz app. A game console."**
> The engine stays the same. The game cartridge (JSON + plugin) changes.

---

## 1. Executive Summary

SkillArena is a **plugin-based game engine** that loads any learning game from a JSON configuration file, renders it inside a universal game shell, and handles timer, scoring, combo system, and leaderboard identically — regardless of which game is running.

**Three mandatory games ship with the engine:**

| Game | Type | Mechanic |
|------|------|----------|
| AptitudeBlitz | MCQ | 10 aptitude questions, 15s per question, time-bonus scoring |
| WordBuilder | Word | Tap letter tiles to form valid English words from a pool |
| SudokuBlitz | Grid | Fill a 9×9 puzzle; correct cells score points, wrong cells cost lives |

**Adding a 4th game requires: 1 new folder + 1 JSON file + 1 line in the registry. Zero engine changes.**

---

## 2. Engine Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        SKILLARENA ENGINE                        │
│                                                                 │
│  ┌──────────────┐        ┌──────────────────────────────────┐  │
│  │  Landing     │        │         ENGINE CORE              │  │
│  │  Page        │──────▶ │                                  │  │
│  │              │        │  EngineCore.js  (state machine)  │  │
│  │  • Pick game │        │  ScoreEngine.js (pure math)      │  │
│  │  • Enter name│        │  TimerEngine.js (countdown)      │  │
│  │  • Difficulty│        │  SessionManager.js (state)       │  │
│  └──────────────┘        │  PluginLoader.js (dynamic import)│  │
│                          │  LeaderboardEngine.js (Firebase) │  │
│                          └──────────────┬───────────────────┘  │
│                                         │                       │
│                          ┌──────────────▼───────────────────┐  │
│                          │         useEngineCore            │  │
│                          │         (React Hook)             │  │
│                          │                                  │  │
│                          │  IDLE → LOADING → COUNTDOWN      │  │
│                          │       → PLAYING → GAME_OVER      │  │
│                          │       → RESULTS                  │  │
│                          └──────────────┬───────────────────┘  │
│                                         │                       │
│                          ┌──────────────▼───────────────────┐  │
│                          │           GameShell              │  │
│                          │  ┌────────────────────────────┐  │  │
│                          │  │ [Timer] [Score] [Lives] [🔥]│  │  │
│                          │  └────────────────────────────┘  │  │
│                          │  ┌────────────────────────────┐  │  │
│                          │  │                            │  │  │
│                          │  │   ← PLUGIN RENDERS HERE →  │  │  │
│                          │  │                            │  │  │
│                          │  └────────────────────────────┘  │  │
│                          └──────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────────┐ │
│  │   PLUGIN 1   │   │   PLUGIN 2   │   │     PLUGIN 3       │ │
│  │              │   │              │   │                    │ │
│  │ AptitudeBlitz│   │ WordBuilder  │   │   SudokuBlitz      │ │
│  │ AptitudeGame │   │WordBuilderGam│   │   SudokuGame       │ │
│  │ aptitudeLogic│   │ wordLogic.js │   │   sudokuLogic.js   │ │
│  │ config.json  │   │ config.json  │   │   config.json      │ │
│  └──────────────┘   └──────────────┘   └────────────────────┘ │
│                              ↑                                  │
│                    Drop in any new plugin here                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. How the Plugin System Works

### The Core Principle

The engine is **game-agnostic**. It does not know whether it's running a sudoku puzzle, word game, or MCQ quiz. It only knows:

```
Load config → Load plugin → Manage timer/score/lives → Submit result
```

### Data Flow

```
1. User picks "SudokuBlitz" on landing page
          ↓
2. /game/sudoku → fetch /games/sudoku.json
          ↓
3. useEngineCore hook calls PluginLoader.loadPlugin("sudoku")
          ↓  [dynamic import]
4. SudokuGame.jsx is loaded asynchronously
          ↓
5. 3-second countdown overlay (engine-managed)
          ↓
6. GameShell renders:
   ┌────────────────────────────────┐
   │ ⏱ 4:52  |  Score: 120  |  ❤❤❤ │
   ├────────────────────────────────┤
   │                                │
   │   [ SudokuGame renders here ]  │
   │                                │
   └────────────────────────────────┘
          ↓
7. Player fills a cell → SudokuGame calls:
   • onCorrect(5)  → engine: score += 5 × comboMultiplier, streak++
   • onWrong()     → engine: lives--, combo resets
   • onComplete()  → engine: finalizeSession, navigate to results
          ↓
8. LeaderboardEngine.submitFinalScore() writes to Firestore
          ↓
9. /results shows score + live leaderboard
```

### Plugin Interface Contract

Every game plugin receives exactly **5 props**. This is the entire contract.

```javascript
// Any game that implements these 5 props works with the engine automatically.
{
  config:     object,           // the game's config.json data (meta + config sections)
  onCorrect:  (points) => void, // player got something right — pass raw points
  onWrong:    ()       => void, // player got something wrong — engine removes 1 life
  onComplete: ()       => void, // game finished — engine navigates to results
  isActive:   boolean,          // false when game is over — plugin MUST freeze UI
}
```

**Critical design choice:** The plugin calls `onCorrect(rawPoints)`. The engine then applies the combo multiplier on top. This separation means:
- The plugin controls its own timing logic and base scoring
- The engine controls the global scoring meta-game (combos, lives, streaks)
- They are decoupled — changing the combo formula in the engine updates ALL games at once

---

## 4. Engine State Machine

Managed by `engine/EngineCore.js` — pure JavaScript, zero React dependency.

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
  START ──▶ [IDLE] ──▶ [LOADING] ──▶ [COUNTDOWN] ──▶ [PLAYING]
                                                        │   │
                               plugin callbacks fire ◀──┘   │
                                                            │
                         timer=0 or lives=0 ────────────────┘
                                │
                         [GAME_OVER] ──▶ auto-submit score
                                │              │
                         [RESULTS]   ◀─────────┘
                                │
                         navigate to /results
```

**State transitions are pure functions** — given the current state, return the next state. No side effects. Fully testable.

```javascript
// engine/EngineCore.js — example pure handler
export function handleWrong(state) {
  const session = applyWrong(state.session);   // loses 1 life, resets combo
  const gameState = isGameOver(session)
    ? ENGINE_STATE.GAME_OVER
    : state.gameState;
  return { ...state, session, gameState };     // new state, no mutation
}
```

---

## 5. Scoring System

All scoring logic lives in `engine/ScoreEngine.js` — pure functions, no React, independently testable.

### Formula

```
Final Points = round( rawPoints × comboMultiplier )

rawPoints     = basePoints + timeBonus
  basePoints  → defined per question/cell in the game's config.json
  timeBonus   → answered in ≤5s: +5pts | ≤10s: +2pts | >10s: +0pts

comboMultiplier (consecutive correct streak):
  0–2  correct → 1.0× (no bonus)
  3–4  correct → 1.5×
  5–9  correct → 2.0×
  10+  correct → 3.0×

Wrong answer: lives -= 1, streak resets to 0, multiplier resets to 1.0×
Game Over:    when lives = 0 OR main timer reaches 0
```

### Why this matters
The combo system is **game-type agnostic**. Whether you're solving a Sudoku cell, submitting a word, or answering an MCQ — the same multiplier applies. A player on a 10-streak earns 3× points in any game. This creates a consistent meta-game across all game types.

---

## 6. JSON Configuration Structure

### Universal meta block (required for ALL games)

```json
{
  "meta": {
    "gameId":      "your-game-id",   // unique slug, matches plugin folder
    "gameType":    "mcq",            // grid | word | mcq | logic
    "title":       "My Game",        // displayed in header and results
    "description": "Short tagline",
    "difficulty":  "medium",         // easy | medium | hard
    "timeLimit":   120,              // seconds for main game timer
    "lives":       3,                // starting lives
    "version":     "1.0"
  },
  "config": { }                      // game-specific payload (engine never reads this)
}
```

### The critical design decision

The engine only reads `meta`. The `config` payload is passed directly to the plugin. This means:
- A new game type can store ANY data structure inside `config`
- The engine never needs to be updated to support it
- Schema validation is the plugin's responsibility

### Per-game config examples

#### MCQ Game (AptitudeBlitz)
```json
"config": {
  "questions": [
    {
      "id": "q1",
      "question": "If 20% of a number is 80, what is the number?",
      "options": ["300", "400", "500", "600"],
      "answer": "400",
      "topic": "Percentages",
      "points": 10,
      "explanation": "20% of x = 80 → x = 400"
    }
  ]
}
```

#### Word Game (WordBuilder)
```json
"config": {
  "rounds": [
    {
      "id": "r1",
      "letters": ["P","L","A","N","E","T","S","O","R","A","T"],
      "minWordLength": 3,
      "pointsPerLetter": 5,
      "bonusWords": ["PLANET", "PATROL"],
      "bonusMultiplier": 2
    }
  ]
}
```

#### Grid Game (SudokuBlitz)
```json
"config": {
  "puzzles": [
    {
      "id": "p1",
      "difficulty": "easy",
      "pointsPerCell": 5,
      "grid":     [[5,3,0,0,7,0,0,0,0], ...],
      "solution": [[5,3,4,6,7,8,9,1,2], ...]
    }
  ]
}
```

---

## 7. Reusability Design Plan

### How to add a new game (under 30 minutes)

This is the proof of the engine's reusability. Judges can test this.

```
Step 1  mkdir plugins/logic-gates

Step 2  Create config.json
        {
          "meta": { "gameId": "logic-gates", "gameType": "logic", ... },
          "config": { "puzzles": [...] }
        }

Step 3  Create logicGatesLogic.js
        — Pure functions: isCorrect(), calcPoints()
        — No React, no engine imports

Step 4  Create LogicGatesGame.jsx
        — Implement the 5-prop interface
        — Call onCorrect(pts) / onWrong() / onComplete()
        — Freeze UI when isActive === false

Step 5  Add ONE line to engine/PluginLoader.js:
        "logic-gates": () => import("../plugins/logic-gates/LogicGatesGame")

Step 6  Copy config.json to public/games/logic-gates.json

DONE.
Timer, scoring, combo, lives, leaderboard, results — all work automatically.
```

### Why this architecture is future-proof

| Concern | How it's handled |
|---------|-----------------|
| New game type | Only the plugin needs writing — engine unchanged |
| Scoring rule change | One edit in `ScoreEngine.js` — applies to all games at once |
| New leaderboard structure | One edit in `firestoreHelpers.js` — all games use it |
| Different timer behaviour | Plugin manages internal timer; engine has global countdown |
| Config format change | Plugins own their `config` section — `meta` contract is stable |
| Mobile vs desktop | GameShell is responsive; each plugin is responsible for its own grid/tile layout |

### Separation of concerns

```
engine/          — WHAT the game does (score, timer, lives)    ← never changes
plugins/         — HOW a specific game plays                   ← one per game
components/      — HOW the game looks (shell, timer bar, etc.) ← shared
lib/             — WHERE data is stored (Firestore ops)        ← one source of truth
public/games/    — WHICH games exist (JSON configs)            ← content layer
```

---

## 8. Firebase / Data Layer

```
Firestore Structure:
─────────────────────────────────────────────────────
/leaderboard/{gameId}/scores/{scoreId}
  playerName: string
  score:      number
  timeTaken:  number      ← tie-breaker (lower = better rank)
  gameId:     string
  difficulty: string
  createdAt:  timestamp

/gameConfigs/{gameId}     ← uploaded via /admin panel
  meta:       object
  config:     object
  uploadedAt: timestamp
─────────────────────────────────────────────────────
```

Real-time leaderboard uses Firestore `onSnapshot` — scores update live during gameplay.

---

## 9. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 16 App Router | Server/client split, file-based routing, API routes |
| Language | JavaScript (JSX) | Rapid development, broad ecosystem |
| Styling | Tailwind CSS | Utility-first, no runtime overhead |
| Animations | Framer Motion | Declarative spring animations, layout animations |
| Database | Firebase Firestore | Real-time subscriptions, no backend server needed |
| Auth | Firebase Anonymous Auth | Frictionless — no sign-up required to play |
| Hosting | Vercel | Zero-config Next.js deployment, edge CDN |

---

## 10. File Map (Key Files Only)

```
engine/
  EngineCore.js       ← State machine: pure functions
  PluginLoader.js     ← Plugin registry: ONE object with dynamic imports
  ScoreEngine.js      ← All scoring math: pure functions
  TimerEngine.js      ← Timer state: pure functions
  SessionManager.js   ← Player session shape
  LeaderboardEngine.js← Score submit and fetch

plugins/
  aptitude-blitz/     ← MCQ game
  word-builder/       ← Word tile game
  sudoku/             ← 9×9 grid game
  [your-game]/        ← Drop new game here

components/
  GameShell.jsx       ← Universal game wrapper (identical for all games)
  Timer.jsx           ← Countdown progress bar
  LifeBar.jsx         ← Heart icons
  ComboIndicator.jsx  ← Streak badge
  ScorePopup.jsx      ← +pts floating animation
  Leaderboard.jsx     ← Real-time score table

public/games/
  aptitude-blitz.json ← Fetched at runtime — 10 MCQ questions
  word-builder.json   ← Fetched at runtime — 3 rounds, letter sets
  sudoku.json         ← Fetched at runtime — 3 puzzles (easy/medium/hard)

app/
  page.jsx            ← Game picker (3 cards + difficulty selector)
  game/[gameId]/      ← Engine shell
  results/            ← Score + leaderboard
  admin/              ← Upload new game JSON configs
  api/submit-score/   ← POST score to Firestore
```

---

## 11. Level 1 Checklist

| Requirement | Status |
|-------------|--------|
| Engine loads games from JSON — zero hardcoded game data | ✅ |
| SudokuBlitz playable end-to-end | ✅ |
| WordBuilder playable end-to-end | ✅ |
| AptitudeBlitz playable end-to-end | ✅ |
| Timer works across all games | ✅ |
| Scoring + combo system works | ✅ |
| Leaderboard visible after game | ✅ |
| Adding a 4th game = only new plugin folder + JSON | ✅ |
| Live demo on Vercel | 🔲 Deploy |
| README complete | ✅ |
| 3-minute demo video | 🔲 Record |

---

## 12. Team

| | |
|-|---|
| **Name** | Vedmohan |
| **Email** | vedmohan0@gmail.com |
| **Hackathon** | TaPTaP Game Engine Hackathon 2026 — League 1 |
| **Deadline** | March 31, 2026 |

---

*SkillArena · TaPTaP Game Engine Hackathon 2026 · games@theblackbucks.com*
