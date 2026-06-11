<div align="center">

# 🌿 Carbon-Flow

### Autonomous Sustainability Gamification Platform

**Zero-Friction · AI-Powered · Behaviorally Intelligent**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5_Flash%2FPro-orange?logo=google)](https://ai.google.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)](https://www.mongodb.com/atlas)
[![Framer Motion](https://img.shields.io/badge/Framer-Motion-purple?logo=framer)](https://www.framer.com/motion)

</div>

---

## 🧠 The Problem

> **"The Value-Action Gap"** — Knowing you should act on climate, but not doing it.

Existing carbon tracking applications fail because:
- **Manual data entry is friction.** Nobody wants to type in their electricity bill numbers.
- **Generic feedback is meaningless.** A global average emission factor tells you nothing actionable.
- **No psychological hook.** There is no consequence for abandoning the platform.

Carbon-Flow solves all three.

---

## ✨ What is Carbon-Flow?

Carbon-Flow is a **serverless sustainability platform** that:

1. **Eliminates manual data entry** — Upload a photo of your utility bill, or record a voice note. Gemini's multimodal AI extracts everything.
2. **Delivers hyper-local insights** — Applies EPA eGRID 2024 emission intensity factors, specific to your US state, instead of global averages.
3. **Creates behavioral retention** — A **Markov Decision Process (MDP)** engine drives a living Habit Strength score (`S ∈ [0, 10]`) that visually transforms the entire UI — rewarding consistency, punishing neglect.

The dashboard itself is the feedback loop. It is not a chart. It is a **living entity** that changes its visual identity based on your behavior.

---

## 🎮 The Dual-Theme UI Engine

The core innovation of Carbon-Flow is the dynamic theme system driven by your real-time Habit Strength score.

| Habit Strength `S ≥ 5` | Habit Strength `S < 5` |
|---|---|
| **🌿 Oasis State** | **🏭 Industrial Waste State** |
| Vibrant emerald/cyan neon | Desaturated amber/red decay palette |
| Floating bioluminescent orb | Glitching, rusted reactor core |
| Rising particle spores | Rising smoke and ash plumes |
| Orbital ring animations | CRT scanline overlays + glitch text |
| `Flora System Stable` indicator | `WARNING: Habit Deficit` alarm |

The transition between states is instant and driven by live MDP state data from MongoDB.

---

## 🛠️ Architecture

Carbon-Flow is a **Serverless Next.js Monolith** — a single deployable application containing the entire product.

```
[ React 19 Frontend (Tailwind v4 / Framer Motion) ]
          │ (fetch + localStorage session token)
          ▼
┌─────────────────────────────────────────────────────┐
│         Next.js 16 App Router — Route Handlers      │
│  POST /api/auth      — Mock JWT auth                │
│  POST /api/extract   — AI multimodal ingestion      │
│  GET  /api/history   — MDP decay + log retrieval    │
│  GET  /api/actions   — Micro-habit library          │
│  POST /api/actions   — One-tap habit logging        │
└─────────────────────────────────────────────────────┘
          │                         │
  [ AI Processing ]         [ Business Logic ]
  - sharp (preprocessing)   - egrid.ts (EPA factors)
  - lib/gemini.ts (cascade) - mdp.ts (Habit MDP)
  - JSON responseSchema     - models.ts (Mongoose)
          │                         │
          └──────────┬──────────────┘
                     ▼
              [ MongoDB Atlas ]
              - users
              - carbonlogs
              - habitstates
              - actions
```

### Project Structure

```
carbon-flow/
├── app/                           # Next.js App Router
│   ├── api/                       # Route handlers
│   │   ├── auth/route.ts          # Authentication (register/login)
│   │   ├── extract/route.ts       # AI multimodal extraction
│   │   ├── actions/route.ts       # Micro-habit library & logging
│   │   └── history/route.ts       # Carbon logs & MDP processing
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Main dashboard (composition only)
│   └── globals.css                # Global styles + a11y utilities
├── components/
│   ├── ui/                        # Reusable primitives
│   │   ├── Odometer.tsx           # Animated number display
│   │   └── ErrorBoundary.tsx      # Error recovery component
│   └── features/                  # Domain-specific components
│       ├── AuthScreen.tsx         # Login/register form
│       ├── ActionGrid.tsx         # Micro-habit action cards
│       ├── HabitOasis.tsx         # Oasis theme visualization
│       ├── IndustrialWaste.tsx    # Industrial theme visualization
│       ├── HistoryTable.tsx       # Carbon log history table
│       ├── MetricsDashboard.tsx   # KPI metrics cards
│       ├── SectorBreakdown.tsx    # Emission breakdown by sector
│       ├── TelemetryPanel.tsx     # AI telemetry display
│       ├── UploadModal.tsx        # File upload/voice recording modal
│       └── upload/                # Upload sub-components
│           ├── FileDropZone.tsx   # Drag-and-drop zone
│           └── VoiceRecorder.tsx  # Voice recording controls
├── hooks/                         # Custom React hooks
│   ├── useAuth.ts                 # Authentication state
│   ├── useDashboardData.ts       # Dashboard data fetching
│   ├── useFileUpload.ts          # File upload state management
│   └── useTelemetry.ts           # AI telemetry tracking
├── lib/                           # Server-side utilities
│   ├── api-utils.ts              # Standardized API responses & auth
│   ├── auth.ts                   # Mock JWT token helpers
│   ├── db.ts                     # MongoDB connection (singleton)
│   ├── egrid.ts                  # EPA eGRID emission factors
│   ├── gemini.ts                 # Gemini AI cascade helper
│   ├── mdp.ts                    # Markov Decision Process engine
│   ├── models.ts                 # Mongoose schema definitions
│   └── preprocess.ts             # Image preprocessing pipeline
├── types/                         # Central TypeScript interfaces
│   └── index.ts                  # All shared types (~190 lines)
├── constants/                     # Magic numbers & configuration
│   ├── index.ts                  # MDP params, thresholds, limits
│   ├── schemas.ts                # Gemini API response schemas
│   └── seed-actions.ts           # Default micro-habit actions
├── __tests__/                     # Jest test suites
│   ├── lib/                      # Unit tests for business logic
│   ├── api/                      # API route integration tests
│   └── components/               # Component rendering tests
├── eslint.config.mjs             # ESLint strict configuration
├── jest.config.ts                # Jest + coverage configuration
├── tsconfig.json                 # Strict TypeScript settings
└── .prettierrc                   # Code formatting rules
```

> **Design decision:** The original draft specified Python/FastAPI, Java/Spring Boot, Celery/RabbitMQ, and Redis as separate services. All were collapsed into a single Next.js monolith to maximize deployment velocity and hackathon score multiplier value.


---

## 🤖 The AI Pipeline — Gemini Token Economics

Every file upload goes through a **confidence-gated cascade**:

```
Upload (Image / PDF / Audio / Voice)
         │
         ▼
  [sharp preprocessing]
  - Grayscale + contrast boost
  - Resize to 1200px max-width
  - JPEG compress at 80% quality
         │
         ▼
  [gemini-2.5-flash] + JSON responseSchema
         │
    confidenceScore ≥ 0.7?
    ┌────────────────────────┐
    │ YES → proceed          │ NO → cascade to gemini-2.5-pro
    └────────────────────────┘
         │
         ▼
  [egrid.ts] → State → eGRID subregion → kg CO₂ / kWh
         │
         ▼
  [mdp.ts] → updateHabitState() → MongoDB
```

**Supported ingestion types:**
- 🖼️ `JPEG / PNG / WEBP` — Electricity, gas, water bills
- 📄 `PDF` — Multi-page utility statements
- 🎙️ `WebM Audio` — Voice notes (e.g. *"I biked to work today, about 5 miles"*)

---

## ⚗️ The MDP Gamification Engine

The Habit Strength score `S ∈ [0, 10]` is governed by a **Markov Decision Process** with the following dynamics:

### State Transition Matrix
| Action | Probability | Outcome |
|---|---|---|
| `log` (upload/tap action) | 90% | `S → min(S + 1, 10)` |
| `log` | 10% | `S → S` (unchanged) |
| `omission` (missed 24h window) | 80% | `S → max(S - 2, 0)` |
| `omission` | 20% | `S → max(S - 1, 0)` |

### Reward Function
```
R(s, a) = 10 + (1.5 × S) − (0.15 × (emissions_kg − 10))
```
- **Base reward:** `+10` for logging
- **Habit bonus:** `+1.5 per habit level` (consistency compounds)
- **Carbon penalty:** `-0.15 per kg above 10kg baseline`
- **Omission penalty:** Fixed `-5.0` for any missed window

Omissions are automatically detected and applied every time `/api/history` is called — no scheduled job needed.

---

## 🌍 eGRID Localized Emission Factors

Carbon-Flow uses the **EPA eGRID 2024** dataset to apply state-specific emission intensity rather than generic global averages:

| State | Subregion | Factor (kg CO₂/kWh) |
|---|---|---|
| CA | CAMX | 0.24 |
| NY | NYCW/NYUP | 0.28 |
| WA | NWPP | 0.14 (cleanest) |
| CO | RMPA | 0.51 (highest) |
| TX | ERCT | 0.37 |
| *Default* | US_AVERAGE | 0.39 |

- **Natural Gas:** 5.3 kg CO₂ / therm
- **Water:** 0.003 kg CO₂ / gallon (treatment & pumping energy)

---

## 📌 Assumptions

These assumptions were made to scope the MVP to a 48-hour build window:

| Assumption | Rationale |
|---|---|
| **US-only emission factors** | EPA eGRID 2024 covers US subregions. International grids were out of scope for Attempt 1. |
| **State extracted from bill, not user profile** | No onboarding zip code prompt yet — the AI reads state from the uploaded document. Falls back to `US_AVERAGE` if not found. |
| **Mock JWT authentication** | Username → Base64 token, no password hashing. Suitable for demo; OAuth (Google/GitHub) is planned for Attempt 3. |
| **Single user session via localStorage** | No multi-device sync. Token is stored client-side; clearing browser storage logs the user out. |
| **10 kg/day CO₂ baseline** | The reward function penalises emissions above 10 kg/day. This is a rough approximation of the US per-capita daily average — not personalised to household size or income. |
| **24-hour omission window** | The MDP decay check uses a fixed 24h gap between logs. Real-world habit science would calibrate this per-user. |
| **Bills are in English** | The Gemini prompt is in English and assumes readable, standard-format utility bills. Handwritten or non-English documents may produce low confidence scores. |
| **Voice notes describe activities, not measurements** | Audio ingestion relies on Gemini inferring a CO₂ estimate from a natural language description (e.g. "I drove 10 miles"). Accuracy depends on the model's commonsense reasoning. |

---

## 🏃 Quick Start

### Prerequisites
- Node.js 18+
- A MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone and Install
```bash
git clone https://github.com/your-username/carbon-flow.git
cd carbon-flow
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the project root:
```env
# MongoDB connection string (local or Atlas)
MONGODB_URI=mongodb://localhost:27017/carbon-flow

# Gemini API key from Google AI Studio
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. First Run
1. Enter any username and click **"Initialize New Profile"** to register.
2. Upload `public/mock_utility_bill.png` (included in the repo) to test the AI pipeline.
3. Observe the CO₂ counter, Habit Strength, and dashboard theme react in real time.

---

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "feat: carbon-flow v2 - action grid + telemetry"
git push origin main
```

### Step 2: Import on Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Under **Environment Variables**, add:

| Key | Value |
|---|---|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Your Gemini API key |

4. Click **Deploy**

> ⚠️ Make sure your MongoDB Atlas cluster has `0.0.0.0/0` in its Network Access IP whitelist so Vercel's serverless functions can connect.

---

## 📁 Project Structure

```
carbon-flow/
├── app/
│   ├── api/
│   │   ├── actions/route.ts    # Micro-habit library + one-tap logging
│   │   ├── auth/route.ts       # Mock JWT authentication
│   │   ├── extract/route.ts    # Gemini AI ingestion pipeline
│   │   └── history/route.ts    # MDP updates + log retrieval
│   ├── components/
│   │   ├── ActionGrid.tsx      # Micro-habit card grid with reward previews
│   │   ├── HabitOasis.tsx      # Oasis theme visual (S ≥ 5)
│   │   ├── IndustrialWaste.tsx # Industrial theme visual (S < 5)
│   │   ├── TelemetryPanel.tsx  # System diagnostics terminal widget
│   │   └── UploadModal.tsx     # Drag-drop + voice recording modal
│   ├── globals.css             # Full design system + theme tokens
│   ├── layout.tsx              # Root layout with Outfit font + SEO
│   └── page.tsx                # Main dashboard + auth screens
├── lib/
│   ├── auth.ts                 # Mock Base64 JWT token helpers
│   ├── db.ts                   # Cached Mongoose singleton
│   ├── egrid.ts                # EPA eGRID 2024 emission factors
│   ├── mdp.ts                  # MDP engine + reward functions
│   ├── models.ts               # Mongoose schemas (User, HabitState, CarbonLog, Action)
│   └── preprocess.ts           # sharp image pipeline
├── references/
│   ├── prd.md                  # Product Requirements Document
│   ├── architecture.md         # System Architecture
│   ├── mvp-screens.md          # Screen-by-screen build status
│   ├── user-flow.md            # User flow diagrams
│   └── roadmap.md              # Development roadmap
└── public/
    └── mock_utility_bill.png   # Sample bill for testing
```

---

## 🧪 Testing

Carbon-Flow has a comprehensive Jest test suite with 11 suites and 104+ tests:

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch

# Lint the codebase
npm run lint
```

### Test Coverage

| Metric | Coverage | Threshold |
|---|---|---|
| Statements | **90%+** | 80% |
| Branches | **71%+** | 70% |
| Lines | **91%+** | 80% |
| Functions | **90%+** | 80% |

### Test Structure

| Suite | Tests | Description |
|---|---|---|
| `lib/egrid.test.ts` | ✅ | eGRID mappings, emission calculations, state lookups |
| `lib/mdp.test.ts` | ✅ | MDP transitions, rewards, boundary conditions |
| `lib/auth.test.ts` | ✅ | Token generation, decoding, invalid tokens |
| `lib/preprocess.test.ts` | ✅ | Image resize, contrast, JPEG compression |
| `api/auth.test.ts` | ✅ | Register, login, validation, sanitization |
| `api/history.test.ts` | ✅ | GET logs, overdue omissions, manual actions |
| `api/actions.test.ts` | ✅ | Action library, auto-seeding, habit logging |
| `api/extract.test.ts` | ✅ | Image + audio extraction, cascade, file validation |
| `components/Odometer.test.tsx` | ✅ | Digit rendering, decimal handling, ARIA |
| `components/TelemetryPanel.test.tsx` | ✅ | Token display, cascade bars, latency |
| `components/ActionGrid.test.tsx` | ✅ | Card rendering, loading state, interactions |

---

## ♿ Accessibility (WCAG AA)

Carbon-Flow implements comprehensive accessibility features:

- **Skip navigation** — "Skip to main content" link for keyboard users
- **Semantic HTML** — Proper `<header>`, `<main>`, `<section>` landmarks with `aria-label`
- **Focus management** — Custom `:focus-visible` outlines on all interactive elements
- **Focus trap** — Modal dialogs trap Tab/Shift+Tab within their bounds
- **Focus restoration** — Focus returns to the triggering element after modal close
- **Screen reader support** — `.sr-only` utility, `aria-live` regions for status updates
- **ARIA roles** — `role="dialog"`, `role="progressbar"`, `role="alert"`, `role="img"` where appropriate
- **Table semantics** — `<th scope="col">`, `<caption>` for screen readers
- **Reduced motion** — `prefers-reduced-motion` media query disables all animations
- **High contrast** — `prefers-contrast: more` media query boosts borders and text
- **Minimum text size** — All text is at least 11px for readability
- **Keyboard navigation** — Escape closes modals, Enter activates drop zones

---

## 🔒 Security

- **Content Security Policy (CSP)** — Restricts script, style, image, and connection sources
- **Strict Transport Security (HSTS)** — Enforces HTTPS with 2-year max-age and preload
- **X-Content-Type-Options** — `nosniff` prevents MIME type sniffing
- **X-Frame-Options** — `DENY` prevents clickjacking
- **X-XSS-Protection** — Browser XSS filter enabled
- **Referrer-Policy** — `strict-origin-when-cross-origin`
- **Permissions-Policy** — Camera/geolocation disabled, microphone restricted to self
- **Input sanitization** — HTML tag stripping and regex validation on user inputs
- **File size validation** — Server-side 8MB limit on uploaded files
- **Cache-Control** — API routes return `no-store` to prevent caching sensitive data


---

## 📊 Screen Overview

| Screen | Status | Description |
|---|---|---|
| **1. Gateway (Auth)** | ✅ Built | Username login/register with mock JWT |
| **2. Core Ecosystem (Dashboard)** | ✅ Built | Dynamic Oasis ↔ Industrial theme engine |
| **3. Data Stream (Ingestion Hub)** | ✅ Built | Drag-drop bills + live voice recording |
| **3b. Ingestion Registry** | ✅ Built | Full emissions history table |
| **4. Action Grid** | ✅ Built | Curated micro-habits with MDP reward previews |
| **5. Telemetry Panel** | ✅ Built | API latency, token economics, cascade ratio |
| **OAuth Login** | ⏳ Attempt 3 | Google/GitHub via next-auth |
| **Region Onboarding** | ⏳ Attempt 3 | Zip code prompt on signup |

---

## 🔑 Key Technology Decisions

| Problem | Decision | Reason |
|---|---|---|
| Multi-service complexity | Next.js Monolith | Faster ship time, single deploy unit |
| Async task queues | Next.js async/await | Serverless functions are inherently isolated |
| Image OCR | Gemini multimodal | State-of-the-art document understanding |
| Schema validation | Gemini `responseSchema` | Eliminates a separate validation service |
| Real-time updates | Polling on success | Avoids WebSocket complexity for MVP scope |
| Image preprocessing | `sharp` | Replaces Python/OpenCV; runs natively in Node.js |

---

## 🌐 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + custom CSS design tokens |
| Animation | Framer Motion 12 |
| AI | Google Gemini 2.5 Flash / Pro (`@google/genai`) |
| Image Processing | `sharp` |
| Database | MongoDB Atlas + Mongoose 9 |
| Icons | Lucide React |
| Font | Outfit (Google Fonts) |

---

<div align="center">

Built for the **PromptWars Hackathon** · Attempt 3 submission

*"The planet cannot wait for perfect UX. But good UX makes people care."*

</div>

