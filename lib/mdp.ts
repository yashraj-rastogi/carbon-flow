import { HabitState } from './models';
import type { MdpTransitionResult } from '@/types';
import { connectToDatabase } from './db';
import {
  MDP_MAX_STRENGTH,
  MDP_INITIAL_STRENGTH,
  MDP_OMISSION_PENALTY,
  MDP_BASE_REWARD,
  MDP_HABIT_BONUS_MULTIPLIER,
  MDP_CARBON_PENALTY_RATE,
  MDP_CARBON_BASELINE_KG,
  MDP_MAX_HISTORY_LENGTH,
  MDP_LOG_SUCCESS_PROB,
  MDP_OMISSION_MAJOR_PROB,
  OMISSION_WINDOW_HOURS,
} from '@/constants';

/**
 * Transitions the Habit Strength state using Markov Decision Process dynamics.
 *
 * State Space: S ∈ [0, {@link MDP_MAX_STRENGTH}]
 *
 * Transition probabilities:
 * - **log**: 90% → S+1, 10% → S (unchanged)
 * - **omission**: 80% → S-2, 20% → S-1
 * 
 * Bellman Equation Formulation:
 * V(s) = R(s, a) + γ * Σ P(s'|s,a) * V(s')
 *
 * State Transitions (Habit Strength S):
 * 
 *     [Omission]                [Consistent Logging]
 *     <--------                     -------->
 * (S=0) --- (S=1) --- ... --- (S=5 Oasis) --- ... --- (S=10 Max)
 *           |                     |
 *      Industrial            Sustainability
 *        Waste                  Oasis
 *
 * @module lib/mdp
 *
 * @param currentStrength - Current habit strength level.
 * @param action - The MDP action performed ('log' or 'omission').
 * @returns The next strength value and the probability of the chosen transition.
 */
export function transitionHabit(
  currentStrength: number,
  action: 'log' | 'omission'
): { nextStrength: number; probability: number } {
  const rand = Math.random();

  if (action === 'log') {
    if (rand < MDP_LOG_SUCCESS_PROB) {
      return { nextStrength: Math.min(currentStrength + 1, MDP_MAX_STRENGTH), probability: MDP_LOG_SUCCESS_PROB };
    }
    return { nextStrength: currentStrength, probability: 1 - MDP_LOG_SUCCESS_PROB };
  }

  // omission
  if (rand < MDP_OMISSION_MAJOR_PROB) {
    return { nextStrength: Math.max(currentStrength - 2, 0), probability: MDP_OMISSION_MAJOR_PROB };
  }
  return { nextStrength: Math.max(currentStrength - 1, 0), probability: 1 - MDP_OMISSION_MAJOR_PROB };
}

/**
 * Calculates the reward for an MDP state transition.
 *
 * Formula: R(s, a) = Base + (γ × HabitStrength) − (β × (emissions − baseline))
 *
 * @param state - Current habit strength at time of action.
 * @param action - The MDP action ('log' or 'omission').
 * @param emissionsKg - CO₂ emissions associated with this log (default 0).
 * @returns The calculated reward value.
 */
export function calculateReward(
  state: number,
  action: 'log' | 'omission',
  emissionsKg: number = 0
): number {
  if (action === 'omission') {
    return MDP_OMISSION_PENALTY;
  }

  const habitBonus = MDP_HABIT_BONUS_MULTIPLIER * state;
  const carbonImpact = -MDP_CARBON_PENALTY_RATE * (emissionsKg - MDP_CARBON_BASELINE_KG);

  return parseFloat((MDP_BASE_REWARD + habitBonus + carbonImpact).toFixed(2));
}

/**
 * Updates a user's Habit State in MongoDB by performing an MDP transition.
 *
 * Creates the habit state document if it doesn't exist (default strength = {@link MDP_INITIAL_STRENGTH}).
 * Caps the history array at {@link MDP_MAX_HISTORY_LENGTH} entries.
 *
 * @param userId - The MongoDB user ID.
 * @param action - The MDP action ('log' or 'omission').
 * @param emissionsKg - CO₂ emissions for reward calculation (default 0).
 * @returns The transition result with previous/current strength, reward, and history.
 */
export async function updateHabitState(
  userId: string,
  action: 'log' | 'omission',
  emissionsKg: number = 0
): Promise<MdpTransitionResult> {
  await connectToDatabase();

  // @ts-ignore - mongoose type bug
  let habitState = await HabitState.findOne({ userId });

  if (!habitState) {
    habitState = new HabitState({
      userId,
      habitStrength: MDP_INITIAL_STRENGTH,
      lastLoggedAt: new Date(),
      history: [],
    });
  }

  const currentStrength = habitState.habitStrength;
  const { nextStrength } = transitionHabit(currentStrength, action);
  const reward = calculateReward(currentStrength, action, emissionsKg);

  habitState.habitStrength = nextStrength;
  habitState.lastLoggedAt = new Date();
  habitState.history.push({
    date: new Date(),
    habitStrength: nextStrength,
    action,
    reward,
  });

  // Keep history capped for performance
  if (habitState.history.length > MDP_MAX_HISTORY_LENGTH) {
    habitState.history.shift();
  }

  await habitState.save();

  return {
    previousStrength: currentStrength,
    currentStrength: nextStrength,
    reward,
    history: habitState.history,
  };
}

/**
 * Checks if the user has missed any logging windows and applies omission penalties.
 *
 * Each missed {@link OMISSION_WINDOW_HOURS}-hour window triggers an omission transition.
 * Multiple consecutive windows are applied sequentially.
 *
 * @param userId - The MongoDB user ID.
 * @returns Omission update result, or null if no omissions were needed.
 */
export async function processOmissionsIfOverdue(
  userId: string
): Promise<{ appliedOmissionsCount: number; currentStrength: number } | null> {
  await connectToDatabase();
  // @ts-ignore - mongoose type bug
  const habitState = await HabitState.findOne({ userId });
  if (!habitState) return null;

  const hoursSinceLastLog =
    (Date.now() - new Date(habitState.lastLoggedAt).getTime()) / (1000 * 60 * 60);
  const omissionsToApply = Math.floor(hoursSinceLastLog / OMISSION_WINDOW_HOURS);

  if (omissionsToApply > 0) {
    let currentStrength = habitState.habitStrength;

    for (let i = 0; i < omissionsToApply; i++) {
      const { nextStrength } = transitionHabit(currentStrength, 'omission');
      const reward = calculateReward(currentStrength, 'omission');

      currentStrength = nextStrength;

      habitState.history.push({
        date: new Date(
          new Date(habitState.lastLoggedAt).getTime() + (i + 1) * OMISSION_WINDOW_HOURS * 60 * 60 * 1000
        ),
        habitStrength: nextStrength,
        action: 'omission',
        reward,
      });
    }

    habitState.habitStrength = currentStrength;
    habitState.lastLoggedAt = new Date(
      new Date(habitState.lastLoggedAt).getTime() + omissionsToApply * OMISSION_WINDOW_HOURS * 60 * 60 * 1000
    );
    await habitState.save();

    return { appliedOmissionsCount: omissionsToApply, currentStrength };
  }

  return null;
}
