/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @jest-environment node
 */
import { transitionHabit, calculateReward, updateHabitState, processOmissionsIfOverdue } from '@/lib/mdp';
import { HabitState } from '@/lib/models';
import {
  MDP_MAX_STRENGTH,
  MDP_OMISSION_PENALTY,
  MDP_CARBON_BASELINE_KG,
  MDP_LOG_SUCCESS_PROB,
  MDP_OMISSION_MAJOR_PROB,
} from '@/constants';

jest.mock('@/lib/db', () => ({
  connectToDatabase: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/models', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const mockHabitState = jest.fn().mockImplementation((data) => ({
    ...data,
    save: mockSave,
  }));
  (mockHabitState as any).findOne = jest.fn();
  return {
    HabitState: mockHabitState,
  };
});

describe('MDP Habit Strength Transitions', () => {
  describe('transitionHabit — log action', () => {
    it('increases strength by 1 when random < 0.9', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = transitionHabit(5, 'log');
      expect(result.nextStrength).toBe(6);
      expect(result.probability).toBe(MDP_LOG_SUCCESS_PROB);
      jest.restoreAllMocks();
    });

    it('keeps strength unchanged when random >= 0.9', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.95);
      const result = transitionHabit(5, 'log');
      expect(result.nextStrength).toBe(5);
      expect(result.probability).toBe(1 - MDP_LOG_SUCCESS_PROB);
      jest.restoreAllMocks();
    });

    it('caps strength at MDP_MAX_STRENGTH (10)', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.1);
      const result = transitionHabit(MDP_MAX_STRENGTH, 'log');
      expect(result.nextStrength).toBe(MDP_MAX_STRENGTH);
      jest.restoreAllMocks();
    });

    it('increases from 0 to 1 on successful log', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.1);
      const result = transitionHabit(0, 'log');
      expect(result.nextStrength).toBe(1);
      jest.restoreAllMocks();
    });
  });

  describe('transitionHabit — omission action', () => {
    it('drops strength by 2 when random < 0.8', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = transitionHabit(5, 'omission');
      expect(result.nextStrength).toBe(3);
      expect(result.probability).toBe(MDP_OMISSION_MAJOR_PROB);
      jest.restoreAllMocks();
    });

    it('drops strength by 1 when random >= 0.8', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.85);
      const result = transitionHabit(5, 'omission');
      expect(result.nextStrength).toBe(4);
      expect(result.probability).toBe(1 - MDP_OMISSION_MAJOR_PROB);
      jest.restoreAllMocks();
    });

    it('never drops below 0', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.1);
      const result = transitionHabit(0, 'omission');
      expect(result.nextStrength).toBe(0);
      jest.restoreAllMocks();
    });

    it('drops from 1 to 0 (not negative) on major omission', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.1);
      const result = transitionHabit(1, 'omission');
      expect(result.nextStrength).toBe(0);
      jest.restoreAllMocks();
    });
  });

  describe('transitionHabit — statistical distribution', () => {
    it('log increases strength ~90% of the time over 1000 trials', () => {
      let increases = 0;
      for (let i = 0; i < 1000; i++) {
        const { nextStrength } = transitionHabit(5, 'log');
        if (nextStrength === 6) increases++;
      }
      const percentage = increases / 10;
      expect(percentage).toBeGreaterThan(80);
      expect(percentage).toBeLessThan(98);
    });

    it('omission drops by 2 ~80% of the time over 1000 trials', () => {
      let majorDrops = 0;
      for (let i = 0; i < 1000; i++) {
        const { nextStrength } = transitionHabit(5, 'omission');
        if (nextStrength === 3) majorDrops++;
      }
      const percentage = majorDrops / 10;
      expect(percentage).toBeGreaterThan(70);
      expect(percentage).toBeLessThan(90);
    });
  });
});

describe('MDP Reward Function', () => {
  describe('calculateReward — omission', () => {
    it('returns fixed penalty for omission regardless of state', () => {
      expect(calculateReward(0, 'omission')).toBe(MDP_OMISSION_PENALTY);
      expect(calculateReward(5, 'omission')).toBe(MDP_OMISSION_PENALTY);
      expect(calculateReward(10, 'omission')).toBe(MDP_OMISSION_PENALTY);
    });

    it('ignores emissions parameter for omission', () => {
      expect(calculateReward(5, 'omission', 100)).toBe(MDP_OMISSION_PENALTY);
    });
  });

  describe('calculateReward — log', () => {
    it('calculates correctly at S=5 with 0 emissions', () => {
      // Base(10) + Habit(1.5*5) - Carbon(0.15*(0-10)) = 10 + 7.5 + 1.5 = 19
      const reward = calculateReward(5, 'log', 0);
      expect(reward).toBe(19.0);
    });

    it('calculates correctly at S=5 with high emissions (50 kg)', () => {
      // Base(10) + Habit(1.5*5) - Carbon(0.15*(50-10)) = 10 + 7.5 - 6 = 11.5
      const reward = calculateReward(5, 'log', 50);
      expect(reward).toBe(11.5);
    });

    it('calculates correctly at S=0 with 0 emissions', () => {
      // Base(10) + Habit(0) - Carbon(0.15*(0-10)) = 10 + 0 + 1.5 = 11.5
      const reward = calculateReward(0, 'log', 0);
      expect(reward).toBe(11.5);
    });

    it('calculates correctly at S=10 with 0 emissions (max reward)', () => {
      // Base(10) + Habit(1.5*10) - Carbon(0.15*(0-10)) = 10 + 15 + 1.5 = 26.5
      const reward = calculateReward(10, 'log', 0);
      expect(reward).toBe(26.5);
    });

    it('calculates correctly at baseline emissions (10 kg)', () => {
      // Base(10) + Habit(1.5*5) - Carbon(0.15*(10-10)) = 10 + 7.5 + 0 = 17.5
      const reward = calculateReward(5, 'log', MDP_CARBON_BASELINE_KG);
      expect(reward).toBe(17.5);
    });

    it('rewards negative emissions (carbon savings) with bonus', () => {
      // Base(10) + Habit(1.5*5) - Carbon(0.15*(-5-10)) = 10 + 7.5 + 2.25 = 19.75
      const reward = calculateReward(5, 'log', -5);
      expect(reward).toBe(19.75);
    });

    it('defaults emissions to 0 when not provided', () => {
      const reward = calculateReward(5, 'log');
      expect(reward).toBe(19.0);
    });
  });

  describe('updateHabitState', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('updates strength and adds to history for existing habitState', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockState = {
        userId: 'user123',
        habitStrength: 5,
        lastLoggedAt: new Date(),
        history: [],
        save: mockSave,
      };
      (HabitState.findOne as jest.Mock).mockResolvedValue(mockState);
      jest.spyOn(Math, 'random').mockReturnValue(0.5); // log success S+1

      const result = await updateHabitState('user123', 'log', 0);
      expect(result.previousStrength).toBe(5);
      expect(result.currentStrength).toBe(6);
      expect(result.reward).toBe(19.0);
      expect(mockState.history).toHaveLength(1);
      expect(mockSave).toHaveBeenCalled();
    });

    it('creates new habitState with initial strength if none exists', async () => {
      (HabitState.findOne as jest.Mock).mockResolvedValue(null);
      jest.spyOn(Math, 'random').mockReturnValue(0.5); // log success

      const result = await updateHabitState('user123', 'log', 0);
      expect(result.previousStrength).toBe(5); // MDP_INITIAL_STRENGTH is 5
      expect(result.currentStrength).toBe(6);
      expect(HabitState).toHaveBeenCalled();
    });

    it('caps history length at MDP_MAX_HISTORY_LENGTH (100)', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const fakeHistory = Array(100).fill({ date: new Date(), habitStrength: 5, action: 'log', reward: 10 });
      const mockState = {
        userId: 'user123',
        habitStrength: 5,
        lastLoggedAt: new Date(),
        history: [...fakeHistory],
        save: mockSave,
      };
      (HabitState.findOne as jest.Mock).mockResolvedValue(mockState);
      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = await updateHabitState('user123', 'log', 0);
      expect(result.history).toHaveLength(100); // capped at 100
      expect(mockState.history.length).toBe(100);
    });
  });

  describe('processOmissionsIfOverdue', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns null if user has no habit state', async () => {
      (HabitState.findOne as jest.Mock).mockResolvedValue(null);
      const result = await processOmissionsIfOverdue('user123');
      expect(result).toBeNull();
    });

    it('returns null if less than OMISSION_WINDOW_HOURS have passed since last log', async () => {
      const mockState = {
        userId: 'user123',
        lastLoggedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      };
      (HabitState.findOne as jest.Mock).mockResolvedValue(mockState);

      const result = await processOmissionsIfOverdue('user123');
      expect(result).toBeNull();
    });

    it('applies omissions if overdue by one window', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const lastLogged = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const mockState = {
        userId: 'user123',
        habitStrength: 5,
        lastLoggedAt: lastLogged,
        history: [],
        save: mockSave,
      };
      (HabitState.findOne as jest.Mock).mockResolvedValue(mockState);
      jest.spyOn(Math, 'random').mockReturnValue(0.9); // minor omission S-1

      const result = await processOmissionsIfOverdue('user123');
      expect(result).not.toBeNull();
      expect(result?.appliedOmissionsCount).toBe(1);
      expect(result?.currentStrength).toBe(4);
      expect(mockSave).toHaveBeenCalled();
    });

    it('applies multiple omissions sequentially if overdue by multiple windows', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const lastLogged = new Date(Date.now() - 50 * 60 * 60 * 1000); // 50 hours ago -> 2 windows
      const mockState = {
        userId: 'user123',
        habitStrength: 5,
        lastLoggedAt: lastLogged,
        history: [],
        save: mockSave,
      };
      (HabitState.findOne as jest.Mock).mockResolvedValue(mockState);
      jest.spyOn(Math, 'random').mockReturnValue(0.9); // minor omission S-1, S-1 -> S-2 total

      const result = await processOmissionsIfOverdue('user123');
      expect(result?.appliedOmissionsCount).toBe(2);
      expect(result?.currentStrength).toBe(3);
      expect(mockSave).toHaveBeenCalled();
    });
  });
});
