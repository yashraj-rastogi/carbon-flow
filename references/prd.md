📄 Product Requirements Document (PRD)

Project Name: Carbon-Flow
Version: MVP v1.0 (Hackathon — Simplified Monolith)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK CHANGE NOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NFR section previously specified Celery/RabbitMQ for async queues and
networknt/json-schema-validator (Java) for schema enforcement. Both have
been replaced by Next.js-native equivalents. See architecture.md for full details.

1. Problem Statement

Current carbon tracking applications fail because of the "Value-Action Gap." Users
possess the intent to reduce their carbon footprint but abandon the platforms due to
high friction of manual data entry and generic, unengaging feedback loops.

2. Target Audience

Eco-conscious individuals: People struggling to maintain long-term sustainability habits.

Tech-savvy users: Individuals who appreciate automated, zero-touch tracking and modern interfaces.

Data-driven optimizers: Users motivated by visual progress, gamified self-improvement,
and real-time metrics.

3. Core Objectives & MVP Scope

Zero-Friction Ingestion: Eliminate manual data entry entirely. Users track their footprint
using multimodal AI (vision via document uploads and audio via voice memos).
  ✅ BUILT: /api/extract handles image/PDF/audio ingestion via Gemini API.

Hyper-Localized Insights: Apply geographically specific emission factors (eGRID for the US)
to ensure absolute data accuracy rather than generic global averages.
  ✅ BUILT: lib/egrid.ts maps US state codes to eGRID subregion intensity factors.

Behavioral Decarbonization: Use a Markov Decision Process (MDP) to calculate a dynamic
"Habit Strength" score (S ∈ [0, 10]), visually rewarding or penalising users to build
psychological retention.
  ✅ BUILT: lib/mdp.ts implements the full MDP transition matrix, reward function,
     and auto-omission decay logic. Dashboard switches between Oasis (S ≥ 5) and
     Industrial (S < 5) themes in real time.

MVP Deferred Items (not in Attempt 1):
  ⏳ Action Grid (Screen 4): Micro-habit library with per-action MDP reward preview.
  ⏳ Telemetry Panel (Screen 5): Live API latency and token consumption metrics overlay.
  ⏳ OAuth Login: Google/GitHub OAuth — currently replaced by username-based mock JWT.
  ⏳ Zip code/Region prompt on signup: eGRID state is inferred from the bill content by Gemini.

4. Success Metrics (KPIs)

Ingestion Success Rate: >95% of uploaded receipts and bills parsed successfully.
  → Achieved via Gemini 2.5 Flash → Pro cascade on confidenceScore < 0.7.

API Latency: Non-blocking upload response; Gemini extraction completes within ~3–8 seconds.
  → Upload is awaited server-side in the serverless function (acceptable for MVP scope).
  → Background async not needed as serverless invocations are inherently isolated.

User Engagement: DAU interacting with upload or voice logging at least once per session.

5. Non-Functional Requirements (NFRs)

Performance: File uploads are processed within a single async serverless function invocation.
  Images are preprocessed by sharp before API calls to reduce token consumption.
  ✅ IMPLEMENTED

Security: All API endpoints guarded by mock Base64-encoded JWT token verification (auth.ts).
  JSON schema enforcement performed by Gemini API's native responseSchema parameter,
  eliminating the need for a separate Java validation layer.
  ✅ IMPLEMENTED

Scalability: Next.js serverless Route Handlers scale horizontally on Vercel/Cloud Run
  without any persistent process management. MongoDB Atlas handles connection pooling.
  ✅ ARCHITECTURE READY
  ⚠️ Note: If traffic spikes require decoupled async processing in the future, a
     message queue (e.g., Cloud Tasks, BullMQ) can be added as a future enhancement
     without restructuring the monolith.

Accessibility: WCAG-compliant contrast ratios enforced across both Oasis and Industrial
  themes. prefers-reduced-motion media query supported in globals.css.
  ✅ IMPLEMENTED