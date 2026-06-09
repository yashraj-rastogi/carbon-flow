🔄 User Flows

Project Name: Carbon-Flow
Version: MVP v1.0 (Hackathon — Simplified Monolith)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK CHANGE NOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Original flows referenced:
  - FastAPI Celery queues (async task broker)
  - Java Spring Boot (business logic receiver)
  - Redis WebSocket push (real-time UI updates)

All replaced with:
  - Next.js /api/extract Route Handler (processes inline, async/await)
  - TypeScript egrid.ts + mdp.ts (business logic in serverless function)
  - Client-side polling / onUploadSuccess callback (real-time UI updates)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Flow 1: The "Zero-Touch" Tracking Loop (✅ BUILT)

This flow details how a user logs their physical world data into the system without
manual form entry.

Trigger: User opens the Upload Modal (via "Upload Bill/Memo" button) and either:
  (a) Drags and drops a utility bill (JPEG, PNG, PDF), or
  (b) Records a voice memo using the in-browser MediaRecorder.

Frontend Action (UploadModal.tsx):
  - Validates file type and size (max 8MB).
  - Sends a multipart/form-data POST to /api/extract with a Bearer token header.
  - Renders a loading state ("AI Ingesting...") while awaiting the response.

API Processing (/api/extract route handler):
  1. Validates the mock JWT token via auth.ts.
  2. If image: preprocesses via lib/preprocess.ts (sharp — grayscale, contrast boost,
     resize to 1200px max-width) to optimise token consumption.
  3. Converts the file buffer to base64 and sends to Gemini API:
     - Standard route: gemini-2.5-flash with JSON responseSchema enforcement.
     - Cascade: if confidenceScore < 0.7, re-sends to gemini-2.5-pro.
  4. Receives structured JSON (utilityCompany, consumption, units, state, billType, etc.).
  5. Calls lib/egrid.ts → calculateEmissions() with extracted state code and consumption.
  6. Saves CarbonLog document to MongoDB.
  7. Calls lib/mdp.ts → updateHabitState() to apply an 'log' action to the MDP.
  8. Returns JSON response with co2EmissionsKg, eGRIDSubregion, and MDP reward result.

Resolution (app/page.tsx):
  - onUploadSuccess() callback fires, displaying a terminal-style status message.
  - fetchHistory() re-polls /api/history, refreshing logs, metrics, and habit strength.
  - If habitStrength crosses 5, the dashboard transitions from Industrial → Oasis theme
    (or vice versa) via Framer Motion + CSS custom property switching.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Flow 2: The Habit Strength Loop (✅ BUILT)

This flow details how the MDP engine builds psychological retention.

Trigger A — Active Log:
  User submits a bill or voice memo (see Flow 1).
  → updateHabitState(userId, 'log', emissionsKg) is called.
  → MDP transition: 90% chance S increases by 1, 10% chance stays.
  → Reward = baseReward (10) + habitBonus (1.5 × S) − carbonPenalty (0.15 × emissions).
  → HabitState.history appended; habitStrength persisted to MongoDB.

Trigger B — Dashboard Load (Overdue Omission Check):
  Every time the user loads the dashboard (/api/history GET):
  → processOmissionsIfOverdue(userId) checks hours since lastLoggedAt.
  → For every full 24-hour window missed: applies an 'omission' MDP transition.
  → Omission transition: 80% chance S decreases by 2, 20% chance decreases by 1.
  → Omission reward: fixed penalty of −5 points.
  → Visual effect: if habitStrength drops below 5, the Oasis transitions to the
     Industrial Waste theme (glitch text, red glow, smoke particles).

Trigger C — Manual Test (Simulate Omission button):
  User clicks "Simulate Omission" on the dashboard.
  → POST /api/history with { action: 'omission' }.
  → Instantly triggers one omission MDP transition for testing/demo purposes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Flow 3: Authentication Flow (✅ BUILT — Mock)

Trigger: User visits the app for the first time (no localStorage token found).

Action:
  - Auth screen renders with username input.
  - User enters a username and clicks "Authorize Credentials" (login) or
    "Initialize New Profile" (register).
  - POST /api/auth with { username, action: 'login' | 'register' }.
  - Server finds or creates the user in MongoDB, initialises HabitState at S=5.
  - Returns a base64-encoded mock JWT containing { userId, username }.
  - Token and user are saved to localStorage; dashboard loads.

Note: OAuth (Google/GitHub) and email/password login are deferred to Attempt 2.
Note: On logout, localStorage is cleared and the user is returned to the auth screen.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Flow 4: Action Grid Loop (⏳ DEFERRED — not in Attempt 1)

Original plan: User taps daily micro-habits (e.g., "Washed laundry in cold water")
from a curated library to earn MDP reward points without uploading a document.

Reason deferred: Requires building Screen 4 (Action Grid component), a micro-habit
database/seed file, and an /api/actions route handler. Planned for Attempt 2.