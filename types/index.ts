/**
 * Central type definitions for Carbon-Flow.
 * All shared interfaces and types are defined here to eliminate `any` usage
 * and provide a single source of truth across the application.
 * @module types
 */

// ─── User & Auth ────────────────────────────────────────────

/** Authenticated user profile stored in localStorage and returned from /api/auth. */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
}

/** Decoded JWT payload used by server-side auth helpers. */
export interface AuthUser {
  userId: string;
  username: string;
}

/** Response body from POST /api/auth. */
export interface AuthResponse {
  token: string;
  user: UserProfile;
  error?: string;
}

// ─── Carbon Log ─────────────────────────────────────────────

/** Bill details embedded inside a CarbonLog document. */
export interface BillDetails {
  utilityCompany?: string;
  billingPeriod?: string;
  amountDue?: number;
  consumption?: number;
  units?: string;
  zipCode?: string;
  state?: string;
}

/** Utility type category for carbon logs. */
export type UtilityType = 'electricity' | 'gas' | 'water' | 'voice_log' | 'receipt' | 'conservation';

/** A single carbon log entry from MongoDB. */
export interface CarbonLogEntry {
  _id: string;
  userId: string;
  type: UtilityType;
  fileName?: string;
  rawText?: string;
  billDetails: BillDetails;
  co2EmissionsKg: number;
  eGRIDSubregion?: string;
  eGRIDFactor?: number;
  createdAt: string;
}

// ─── Habit State (MDP) ─────────────────────────────────────

/** Type of MDP action the user can perform. */
export type MdpAction = 'log' | 'omission';

/** A single entry in the habit state history array. */
export interface HabitHistoryEntry {
  date: string;
  habitStrength: number;
  action: MdpAction;
  reward: number;
}

/** The user's current habit state document from MongoDB. */
export interface HabitStateData {
  habitStrength: number;
  lastLoggedAt?: string;
  history: HabitHistoryEntry[];
}

/** Result of an MDP state transition. */
export interface MdpTransitionResult {
  previousStrength: number;
  currentStrength: number;
  reward: number;
  history: HabitHistoryEntry[];
}

// ─── Dashboard Metrics ──────────────────────────────────────

/** Emission totals broken down by utility category. */
export interface CategoryEmissions {
  electricity: number;
  gas: number;
  water: number;
  voice_log: number;
  receipt: number;
}

/** Aggregated dashboard metrics returned from /api/history. */
export interface DashboardMetrics {
  totalEmissions: number;
  categoryEmissions: CategoryEmissions;
  logCount: number;
}

// ─── API Responses ──────────────────────────────────────────

/** Response from GET /api/history. */
export interface HistoryResponse {
  success: boolean;
  logs: CarbonLogEntry[];
  habitState: HabitStateData;
  metrics: DashboardMetrics;
  error?: string;
}

/** Response from POST /api/extract. */
export interface ExtractResponse {
  success: boolean;
  dataType: 'bill' | 'voice_log';
  data: Record<string, unknown>;
  co2EmissionsKg: number;
  eGRIDSubregion?: string;
  mdp: MdpTransitionResult;
  modelUsed: string;
  tokenUsage: TokenUsage;
  error?: string;
}

/** Response from POST /api/actions. */
export interface ActionLogResponse {
  success: boolean;
  message: string;
  carbonDeltaKg: number;
  mdp: MdpTransitionResult;
  error?: string;
}

// ─── Telemetry ──────────────────────────────────────────────

/** Token usage metadata from a Gemini API call. */
export interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

/** Client-side telemetry data persisted in localStorage. */
export interface TelemetryData {
  lastLatencyMs: number | null;
  totalPromptTokens: number;
  totalOutputTokens: number;
  flashCallsCount: number;
  proCallsCount: number;
  totalRequestsCount: number;
}

// ─── Action Grid ────────────────────────────────────────────

/** A curated micro-habit action item from the database. */
export interface ActionItem {
  _id: string;
  name: string;
  category: string;
  impactKg: number;
  icon: string;
  description: string;
}

/** Response from GET /api/actions. */
export interface ActionsListResponse {
  success: boolean;
  actions: ActionItem[];
  error?: string;
}

// ─── Emission Calculation ───────────────────────────────────

/** eGRID emission factor for a specific state/subregion. */
export interface EmissionFactor {
  subregion: string;
  factorKgPerKwh: number;
}

/** Result from the calculateEmissions function. */
export interface EmissionResult {
  co2EmissionsKg: number;
  subregion?: string;
  factor: number;
}
