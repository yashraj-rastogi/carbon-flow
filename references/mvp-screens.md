🖥️ MVP Screen-by-Screen Flow

Project Name: Carbon-Flow
Version: MVP v1.0 (Hackathon — Simplified Monolith)

Global Aesthetic Rule: "Pixar-meets-cyberpunk" visual language. Vibrant neon highlights,
dark atmospheric backgrounds, glassmorphism (frosted glass panels), and physics-based
Framer Motion animations. The dashboard is a living, reactive entity — its entire visual
identity changes based on the user's real-time Habit Strength score.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BUILD STATUS LEGEND
  ✅ BUILT       — Implemented in Attempt 1
  🔄 PARTIAL     — Partially implemented; some elements deferred
  ⏳ DEFERRED    — Planned for Attempt 2 / 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Screen 1: The Gateway (Auth & Onboarding) ✅ BUILT

Visuals: Sleek dark-mode login card with glowing emerald-green neon borders over a
cyber-grid background. Globe icon pulses as the platform's identity mark.

Key Elements (BUILT):
  ✅ Username-based mock JWT login and registration.
  ✅ Toggle between "Authorize Credentials" (login) and "Initialize New Profile" (register).
  ✅ Error messaging for failed auth.
  ✅ Auto-creates User + HabitState (S=5) in MongoDB on first registration.

Deferred Elements:
  ⏳ OAuth login buttons (Google/GitHub).
  ⏳ Zip code / Region prompt on signup (eGRID state is inferred from bill by Gemini instead).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Screen 2: The Core Ecosystem (Main Dashboard) ✅ BUILT

Visuals: A living, reactive dashboard. The entire visual identity is driven by Habit Strength (S).

  Oasis State (S ≥ 5):
    ✅ Vibrant emerald/cyan neon palette.
    ✅ HabitOasis component: animated floating core globe, rotating orbital rings,
       bioluminescent floating particle spores rising upward.
    ✅ "Flora System Stable" status indicator.

  Industrial State (S < 5):
    ✅ Dark desaturated palette with amber/red warning hues.
    ✅ IndustrialWaste component: glitching "Reactor Decayed" core, rising smoke/ash
       particles, pulsing AlertTriangle warning, CRT scanline overlay.
    ✅ "Warning: Habit Deficit" status indicator + system error code.

Key Elements (BUILT):
  ✅ Central dynamic visual switching between Oasis / Industrial via Framer Motion.
  ✅ Total CO₂ logged (kg) metric card.
  ✅ Habit Level (0–10) metric card with colour-coded value.
  ✅ Log Count metric card.
  ✅ Emissions by Utility Sector breakdown (electricity, gas, water, voice log) with
     animated fill-bars showing percentage of total.
  ✅ Terminal-style status message bar showing MDP reward after each upload.
  ✅ User session management (login/logout, localStorage persistence).
  ✅ Cyber-grid background that switches pattern (emerald/orange) with theme.

Deferred Elements:
  ⏳ Rolling odometer animation for CO₂ counter.
  ⏳ Right sidebar "Recent Transactions" panel (currently shown as full-width table below).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Screen 3: Data Stream (The Ingestion Hub) ✅ BUILT

Visuals: Modal overlay with frosted glass panel (backdrop-blur) sliding in over the dashboard.

Key Elements (BUILT):
  ✅ "Upload Bill/Memo" action button triggers the UploadModal.
  ✅ Drag-and-drop zone with dashed neon borders (accepts JPEG, PNG, WEBP, PDF up to 8MB).
  ✅ File browse button as fallback for non-drag interactions.
  ✅ "Record Voice" microphone button using HTML5 MediaRecorder API.
  ✅ Live audio recording waveform visualiser (animated bar heights while recording).
  ✅ Recording duration timer (MM:SS format).
  ✅ Audio preview player after recording stops.
  ✅ "Process Carbon Entry" submit button with spinner loading state ("AI Ingesting...").
  ✅ Error state messaging for invalid files or server errors.

Deferred Elements:
  ⏳ Async processing queue indicator ("3 items currently parsing via AI...").
     → Currently: one upload at a time; queue UI deferred to Attempt 2.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Screen 3b: Ingestion Registry Log ✅ BUILT

Visuals: Full-width glassmorphism table panel below the dashboard, monospace data display.

Key Elements (BUILT):
  ✅ Tabular display of all carbon logs (Date, Type, Utility Company, Usage, State, CO₂ kg).
  ✅ Colour-coded type badges (electricity=yellow, gas=orange, water=cyan, voice=emerald).
  ✅ Empty state with terminal-style "No active records" message.
  ✅ Shows last 50 logs, sorted newest-first.
  ✅ "Simulate Omission" action button for testing MDP state decay in real time.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Screen 4: The Action Grid (Reduction Library) ⏳ DEFERRED

Visuals: Grid of tactile 3D-looking cards emitting category-specific neon glows on hover.

Planned Elements:
  ⏳ Curated micro-habit library (e.g., "Set Thermostat -2°", "Unplug Desktop").
  ⏳ Dynamic MDP reward preview per card (calculated from current Habit Strength S).
  ⏳ Haptic-style one-tap completion triggering updateHabitState(userId, 'log').
  ⏳ /api/actions Route Handler + actions seed database.

Target: Attempt 2.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Screen 5: Telemetry Panel (Build-in-Public) ⏳ DEFERRED

Visuals: Raw terminal-style overlay with monospace typography and real-time data streams,
contrasting the main glossy UI.

Planned Elements:
  ⏳ Live API latency readouts for /api/extract calls.
  ⏳ Gemini API total token consumption counter (tracked per user session).
  ⏳ The platform's own operational carbon footprint (estimated server energy use).
  ⏳ Token economics log: Flash vs Pro cascade usage ratio.

Target: Attempt 2 / 3.