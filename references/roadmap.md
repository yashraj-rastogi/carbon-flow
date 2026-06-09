🗺️ Development Roadmap

Project Name: Carbon-Flow
Version: MVP v1.0 (Hackathon — Simplified Monolith)
Constraint: 14-Day Hackathon Cycle.

Strategic Note: Due to the PromptWars Score Multiplier decay, a highly functional core
submitted early is worth more than a perfect project submitted on Day 14. We collapsed
the original 5-phase multi-service build into a 3-phase monolith approach to ship Attempt 1
as rapidly as possible without sacrificing core correctness.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK CHANGE NOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Original roadmap planned separate agent-driven phases for:
  - Phase 1: Python AI Engineer Agent (FastAPI + OpenCV + Celery)
  - Phase 2: Java Backend Architect Agent (Spring Boot 3 + MDP Java classes)
  - Phase 3: Frontend UI/UX Agent (React 19 standalone)
  - Phase 4: Integration & deployment of 3 separate services
  - Phase 5: Polish

Agreed simplification: Single Next.js Monolith — all phases collapsed and accelerated.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1: Foundation & Core Ingestion ✅ COMPLETE (Days 1–2)

Goal: Scaffold the Next.js monolith, connect MongoDB, and prove the multimodal
Gemini extraction pipeline works end-to-end.

Tasks Completed:
  ✅ Initialised Next.js 16 project (TypeScript, Tailwind CSS v4, App Router).
  ✅ Installed dependencies: @google/genai, mongoose, sharp, framer-motion, lucide-react.
  ✅ Created lib/db.ts — cached Mongoose connection singleton.
  ✅ Created lib/models.ts — User, HabitState, CarbonLog Mongoose schemas.
  ✅ Created lib/preprocess.ts — sharp image pipeline (grayscale, contrast, resize).
  ✅ Created lib/auth.ts — mock Base64 JWT token generation and validation.
  ✅ Created lib/egrid.ts — eGRID state-to-emission-factor mapping + calculateEmissions().
  ✅ Created lib/mdp.ts — Full MDP implementation: transitionHabit(), calculateReward(),
     updateHabitState(), processOmissionsIfOverdue().
  ✅ Created /api/auth route — registration, login, HabitState initialisation.
  ✅ Created /api/extract route — full Gemini cascade pipeline with eGRID + MDP integration.
  ✅ Created /api/history route — log retrieval, metrics, auto-omission processing.
  ✅ Verified: npm run build succeeds with zero TypeScript errors.

Phase 2: Frontend Dashboard & Theme Engine ✅ COMPLETE (Days 2–3)

Goal: Build the dynamic "Pixar-meets-cyberpunk" dashboard with full Oasis/Industrial
theme switching driven by the live MDP Habit Strength score.

Tasks Completed:
  ✅ Created app/globals.css — full design system: Oasis/Industrial CSS custom properties,
     cyberpunk grid backgrounds, glassmorphism panels, neon pulse keyframes, glitch text
     keyframes, CRT scanline overlay, float animations, prefers-reduced-motion support.
  ✅ Created app/layout.tsx — Outfit Google Font, SEO metadata.
  ✅ Created app/components/HabitOasis.tsx — animated neon oasis with floating orb,
     rotating orbital rings, and rising bioluminescent particles (Framer Motion).
  ✅ Created app/components/IndustrialWaste.tsx — glitching industrial reactor with
     smoke/ash particles, CRT overlays, and warning indicators (Framer Motion).
  ✅ Created app/components/UploadModal.tsx — dual-tab modal: drag-and-drop file upload
     + MediaRecorder live voice memo with animated waveform visualiser.
  ✅ Created app/page.tsx — full dashboard: auth screen, habit core display, command
     actions, metric cards, sector emission bars, ingestion registry log table, simulate
     omission button, status message terminal.

Phase 3: Attempt 1 Submission ✅ READY (Day 3)

Goal: Deploy to production and lock in the early-submission score multiplier.

Remaining Before Submission:
  → Add your GEMINI_API_KEY and MONGODB_URI to .env.local.
  → Connect to MongoDB Atlas (free M0 tier) or a local MongoDB instance.
  → Run npm run dev to verify locally at http://localhost:3000.
  → Deploy to Vercel / Firebase App Hosting / Google Cloud Run.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 4: Attempt 2 — Action Grid & Telemetry (Days 4–8)

Goal: Add Screen 4 (Action Grid) and Screen 5 (Telemetry Panel) to maximise
feature completeness score for Attempt 2.

Planned Tasks:
  ⏳ Build /api/actions route + micro-habit seed data.
  ⏳ Build app/components/ActionGrid.tsx — tactile card grid with per-habit MDP rewards.
  ⏳ Build app/components/TelemetryPanel.tsx — terminal-style latency/token overlay.
  ⏳ Add rolling odometer animation to CO₂ counter.
  ⏳ Add right sidebar "Recent Transactions" panel to dashboard.
  ⏳ Implement token consumption tracking (track Flash vs Pro cascade usage per session).

Phase 5: Attempt 3 — Polish & Bonus Criteria (Days 9–14)

Goal: Maximise UX and meet all bonus scoring criteria.

Planned Tasks:
  ⏳ OAuth login (Google/GitHub via next-auth).
  ⏳ Zip code / region onboarding prompt on first signup.
  ⏳ Mobile responsiveness audit and fixes.
  ⏳ WCAG contrast ratio final audit pass.
  ⏳ Build-in-Public narrative: add public telemetry endpoint for hackathon judges.
  ⏳ Submit Attempt 3 to overwrite score.