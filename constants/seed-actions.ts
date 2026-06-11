/**
 * Curated micro-habit action seeds for the Action Library.
 *
 * These are inserted into MongoDB on first request when the actions collection
 * is empty. Each action represents a small, repeatable sustainability behaviour
 * that users can log with a single tap.
 * @module constants/seed-actions
 */

/** Shape of a seed action document (before MongoDB assigns `_id`). */
export interface SeedAction {
  name: string;
  category: 'electricity' | 'gas' | 'water' | 'conservation';
  impactKg: number;
  icon: string;
  description: string;
}

/** Default curated micro-habit actions. */
export const SEED_ACTIONS: readonly SeedAction[] = [
  {
    name: 'Set Thermostat -2°',
    category: 'gas',
    impactKg: -1.2,
    icon: 'Flame',
    description:
      'Lower your thermostat by 2 degrees during winter or raise it during summer.',
  },
  {
    name: 'Shortened Shower',
    category: 'water',
    impactKg: -0.4,
    icon: 'Droplet',
    description: 'Reduce shower time by 5 minutes to conserve hot water energy.',
  },
  {
    name: 'Unplug Idle Devices',
    category: 'electricity',
    impactKg: -0.2,
    icon: 'Sparkles',
    description:
      'Disconnect phantom loads (TV, chargers, microwave) when not in use.',
  },
  {
    name: 'Walk or Bike',
    category: 'conservation',
    impactKg: -2.5,
    icon: 'Globe',
    description:
      'Replace a short car trip (under 3 miles) with walking or cycling.',
  },
  {
    name: 'Cold Laundry Cycle',
    category: 'electricity',
    impactKg: -0.8,
    icon: 'Activity',
    description:
      'Wash laundry in cold water instead of warm/hot to save heating energy.',
  },
] as const;
