/**
 * Application-wide constants for Carbon-Flow.
 * Replaces magic numbers and hardcoded values throughout the codebase.
 * @module constants
 */

// ─── MDP (Markov Decision Process) ─────────────────────────

/** Maximum possible habit strength value. */
export const MDP_MAX_STRENGTH = 10;

/** Initial habit strength for new users (starts at midpoint). */
export const MDP_INITIAL_STRENGTH = 5;

/** Fixed reward penalty for an omission event. */
export const MDP_OMISSION_PENALTY = -5.0;

/** Base reward for any logging action. */
export const MDP_BASE_REWARD = 10.0;

/** Per-level habit bonus multiplier added to reward. */
export const MDP_HABIT_BONUS_MULTIPLIER = 1.5;

/** Rate at which carbon emissions above baseline penalise the reward. */
export const MDP_CARBON_PENALTY_RATE = 0.15;

/** Daily CO₂ baseline (kg) — emissions above this incur a penalty. */
export const MDP_CARBON_BASELINE_KG = 10;

/** Maximum number of history entries kept per user (for performance). */
export const MDP_MAX_HISTORY_LENGTH = 100;

// ─── MDP Transition Probabilities ───────────────────────────

/** Probability that a 'log' action increases strength by 1. */
export const MDP_LOG_SUCCESS_PROB = 0.9;

/** Probability that an 'omission' drops strength by 2 (vs 1). */
export const MDP_OMISSION_MAJOR_PROB = 0.8;

// ─── Time Windows ───────────────────────────────────────────

/** Hours between expected logging events before omission is triggered. */
export const OMISSION_WINDOW_HOURS = 24;

// ─── File Upload ────────────────────────────────────────────

/** Maximum allowed file size for uploads (8 MB). */
export const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

/** Accepted MIME types for bill uploads. */
export const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

/** Accepted file type string for file input elements. */
export const ACCEPTED_FILE_INPUT = 'image/jpeg,image/png,image/webp,application/pdf';

// ─── Image Preprocessing ───────────────────────────────────

/** Maximum pixel width for preprocessed bill images. */
export const IMAGE_MAX_WIDTH = 1200;

/** JPEG compression quality (0–100). */
export const IMAGE_JPEG_QUALITY = 80;

/** Default contrast multiplier for bill image enhancement. */
export const IMAGE_CONTRAST_MULTIPLIER = 1.2;

// ─── AI Model ───────────────────────────────────────────────

/** Minimum confidence score to accept Flash model result (below this, cascade to Pro). */
export const CONFIDENCE_THRESHOLD = 0.7;

/** Primary (cheaper/faster) Gemini model. */
export const GEMINI_MODEL_FLASH = 'gemini-2.5-flash';

/** Fallback (more capable) Gemini model. */
export const GEMINI_MODEL_PRO = 'gemini-2.5-pro';

/** Estimated kg CO₂ per API server invocation (for telemetry). */
export const CO2_PER_API_CALL_KG = 0.00015;

// ─── Auth / Validation ─────────────────────────────────────

/** Maximum allowed username length. */
export const MAX_USERNAME_LENGTH = 50;

/** Minimum allowed username length. */
export const MIN_USERNAME_LENGTH = 1;

// ─── UI Thresholds ──────────────────────────────────────────

/** Habit strength threshold: at or above this → Oasis theme, below → Industrial. */
export const OASIS_THRESHOLD = 5;

// ─── localStorage Keys ─────────────────────────────────────

export const STORAGE_KEY_TOKEN = 'cf_token';
export const STORAGE_KEY_USER = 'cf_user';
export const STORAGE_KEY_TELEMETRY = 'cf_telemetry';
