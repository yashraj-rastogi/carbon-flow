import { HabitState } from './models';
import { connectToDatabase } from './db';

/**
 * Transitions the Habit Strength state using the Markov Decision Process (MDP) dynamics.
 * 
 * State Space: S in [0, 10]
 * Actions: 'log' or 'omission'
 * 
 * Transition Dynamics:
 * - On 'log':
 *   - 90% chance: S_{t+1} = min(S_t + 1, 10)
 *   - 10% chance: S_{t+1} = S_t
 * - On 'omission':
 *   - 80% chance: S_{t+1} = max(S_t - 2, 0)
 *   - 20% chance: S_{t+1} = max(S_t - 1, 0)
 */
export function transitionHabit(currentStrength: number, action: 'log' | 'omission'): {
  nextStrength: number;
  probability: number;
} {
  const rand = Math.random();

  if (action === 'log') {
    if (rand < 0.9) {
      return { nextStrength: Math.min(currentStrength + 1, 10), probability: 0.9 };
    } else {
      return { nextStrength: currentStrength, probability: 0.1 };
    }
  } else {
    // omission
    if (rand < 0.8) {
      return { nextStrength: Math.max(currentStrength - 2, 0), probability: 0.8 };
    } else {
      return { nextStrength: Math.max(currentStrength - 1, 0), probability: 0.2 };
    }
  }
}

/**
 * Calculates the reward for the MDP state transition.
 * R(s, a) = Base + (Gamma * HabitStrength) - (Beta * CarbonEmissions)
 */
export function calculateReward(
  state: number,
  action: 'log' | 'omission',
  emissionsKg: number = 0
): number {
  if (action === 'omission') {
    return -5.0; // Fixed penalty for omission
  }

  const baseReward = 10.0;
  const habitBonus = 1.5 * state;
  // Penalize higher emissions (relative to a 10kg daily average baseline)
  const carbonImpact = -0.15 * (emissionsKg - 10);

  return parseFloat((baseReward + habitBonus + carbonImpact).toFixed(2));
}

/**
 * Main function to update a user's Habit State in MongoDB.
 */
export async function updateHabitState(
  userId: string,
  action: 'log' | 'omission',
  emissionsKg: number = 0
) {
  await connectToDatabase();

  let habitState = await HabitState.findOne({ userId });

  if (!habitState) {
    habitState = new HabitState({
      userId,
      habitStrength: 5, // Starts at middle ground
      lastLoggedAt: new Date(),
      history: []
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
    reward
  });

  // Keep history array capped at 100 items for performance
  if (habitState.history.length > 100) {
    habitState.history.shift();
  }

  await habitState.save();

  return {
    previousStrength: currentStrength,
    currentStrength: nextStrength,
    reward,
    history: habitState.history
  };
}

/**
 * Checks if the user missed any logging windows and applies omissions.
 * For this simplified version, if lastLoggedAt was > 24 hours ago, we apply omissions.
 */
export async function processOmissionsIfOverdue(userId: string) {
  await connectToDatabase();
  const habitState = await HabitState.findOne({ userId });
  if (!habitState) return null;

  const hoursSinceLastLog = (Date.now() - new Date(habitState.lastLoggedAt).getTime()) / (1000 * 60 * 60);
  
  // A logging window is 24 hours. We calculate how many full 24hr windows were missed.
  const omissionsToApply = Math.floor(hoursSinceLastLog / 24);

  if (omissionsToApply > 0) {
    let currentStrength = habitState.habitStrength;
    let totalReward = 0;

    for (let i = 0; i < omissionsToApply; i++) {
      const { nextStrength } = transitionHabit(currentStrength, 'omission');
      const reward = calculateReward(currentStrength, 'omission');
      
      currentStrength = nextStrength;
      totalReward += reward;

      habitState.history.push({
        date: new Date(new Date(habitState.lastLoggedAt).getTime() + (i + 1) * 24 * 60 * 60 * 1000),
        habitStrength: nextStrength,
        action: 'omission',
        reward
      });
    }

    habitState.habitStrength = currentStrength;
    // Advance the lastLoggedAt by the applied omission intervals
    habitState.lastLoggedAt = new Date(new Date(habitState.lastLoggedAt).getTime() + omissionsToApply * 24 * 60 * 60 * 1000);
    await habitState.save();

    return {
      appliedOmissionsCount: omissionsToApply,
      currentStrength
    };
  }

  return null;
}
