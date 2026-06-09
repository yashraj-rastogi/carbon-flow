🏗️ System Architecture Document

Project Name: Carbon-Flow
Version: MVP v1.0 (Hackathon — Simplified Monolith)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TECH STACK CHANGE NOTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Original draft specified a Full-Stack Ironclad Architecture:
  - Python / FastAPI (AI ingestion layer)
  - Java / Spring Boot 3 (business logic layer)
  - Celery / RabbitMQ (async task queues)
  - Redis (in-memory caching / WebSockets)
  - React 19 (standalone frontend)

Agreed simplification (see implementation_plan.md):
  → Consolidated into a single Next.js 16 Monolith.
  → Python/Java/Celery/RabbitMQ/Redis layers ELIMINATED.
  → All logic handled via Next.js API Route Handlers (serverless functions).
  → Hosted as a single service (Vercel / Firebase App Hosting / Cloud Run).

1. Architectural Paradigm

Carbon-Flow uses a Serverless Monolith architecture built on Next.js 16 (App Router).
All frontend, backend API logic, AI ingestion, carbon math, and gamification are
co-located in a single deployable Next.js application.

2. High-Level Diagram

[ Next.js Frontend (React / Tailwind CSS / Framer Motion) ]
       | (Client-side fetch + localStorage session token)
       v
+---------------------------------------------------+
|        Next.js API Route Handlers (Serverless)    |
|  /api/auth     — Mock JWT token creation/login    |
|  /api/extract  — Multimodal AI ingestion pipeline |
|  /api/history  — MDP updates + log retrieval      |
+---------------------------------------------------+
       |                           |
[ AI Processing Layer ]     [ Business Logic Layer ]
- sharp (image preprocessing)  - egrid.ts (eGRID emission math)
- @google/genai (Gemini API)   - mdp.ts (MDP Habit Strength)
- JSON responseSchema output   - models.ts (Mongoose schemas)
       |                           |
       +----------+----------------+
                  |
         [ MongoDB (Atlas) ]
         - User documents
         - CarbonLog documents
         - HabitState documents


3. Component Details

3.1 Frontend Layer (BUILT ✅)

Tech Stack: Next.js 16, TypeScript, Tailwind CSS v4, Framer Motion, Lucide React.

Responsibility: Render the dynamic "Pixar-meets-cyberpunk" UI. Manages client-side
session state via localStorage. Polls /api/history on mount and after each upload to
refresh the dashboard state without WebSockets.

Key Files: app/page.tsx, app/components/HabitOasis.tsx, app/components/IndustrialWaste.tsx,
           app/components/UploadModal.tsx

3.2 AI Ingestion Layer (BUILT ✅)

Tech Stack: @google/genai SDK, sharp (replaces OpenCV/Pillow).

Responsibility: Accept multipart/form-data uploads (images, PDFs, audio). Preprocess
images using sharp (grayscale, contrast boost, resize to 1200px max-width). Query
Gemini API with structured JSON responseSchema. Apply a Token Economics Cascade:
  - Standard: gemini-2.5-flash
  - Fallback: gemini-2.5-pro (if confidenceScore < 0.7)

Key File: app/api/extract/route.ts, lib/preprocess.ts

3.3 Business Logic Layer (BUILT ✅)

Tech Stack: TypeScript (no Java; runs directly inside Next.js serverless functions).

Responsibility:
  - eGRID Emission Math: Maps US state codes to emission intensity factors (kg CO2/kWh)
    and calculates total carbon equivalent for electricity, gas, and water.
  - MDP Gamification Engine: Implements the Markov Decision Process for Habit Strength
    (S ∈ [0, 10]). Applies probabilistic state transitions on 'log' or 'omission' actions.
    Rewards tracking consistency and penalises neglect. Auto-detects and applies missed
    daily tracking windows (overdue omissions) on each /api/history GET call.
  - Mock JWT Auth: Base64-encoded token creation and validation (auth.ts).

Key Files: lib/egrid.ts, lib/mdp.ts, lib/auth.ts

3.4 Data & Persistence Layer (BUILT ✅)

Tech Stack: MongoDB (Atlas free tier), Mongoose ODM.

Responsibility: NoSQL document storage for User, CarbonLog, and HabitState records.
Connection pooling is handled via a cached Mongoose singleton (lib/db.ts) to prevent
socket leaks across serverless cold starts.

Key Files: lib/db.ts, lib/models.ts

3.5 Removed Components (vs. Original Draft)

  ❌ Python / FastAPI layer → replaced by Next.js API Routes
  ❌ Java / Spring Boot 3 → replaced by TypeScript business logic in serverless functions
  ❌ Celery / RabbitMQ → replaced by Next.js native async/await (non-blocking by default)
  ❌ Redis caching → replaced by client-side polling after upload completion
  ❌ networknt/json-schema-validator (Java) → replaced by Gemini responseSchema enforcement
     + TypeScript compile-time type safety
  ❌ WebSockets → replaced by fetch polling on upload success callback