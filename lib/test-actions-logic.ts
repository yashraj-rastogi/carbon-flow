import { connectToDatabase } from './db';
import { Action, CarbonLog, User } from './models';
import { updateHabitState } from './mdp';

async function runActionTests() {
  console.log('--- Starting Action & Habit Logic Verification ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    await connectToDatabase();
    console.log('Connected to MongoDB.');

    // 1. Clean and Seed Actions collection
    console.log('Clearing Action collection for test...');
    await Action.deleteMany({});
    
    const SEED_TEST_ACTIONS = [
      {
        name: "Test Thermostat -2°",
        category: "gas",
        impactKg: -1.2,
        icon: "Flame",
        description: "Test description"
      },
      {
        name: "Test Shortened Shower",
        category: "water",
        impactKg: -0.4,
        icon: "Droplet",
        description: "Test description"
      }
    ];

    console.log('Seeding Action collection...');
    await Action.insertMany(SEED_TEST_ACTIONS);
    
    const actions = await Action.find({});
    assert(actions.length === 2, `Action collection should contain 2 actions (got ${actions.length})`);
    
    const gasAction = actions.find(a => a.category === 'gas');
    assert(gasAction !== undefined, 'Gas action should be seeded successfully');
    assert(gasAction?.name === 'Test Thermostat -2°', `Gas action name should be 'Test Thermostat -2°' (got ${gasAction?.name})`);
    assert(gasAction?.impactKg === -1.2, `Gas action impact should be -1.2 kg (got ${gasAction?.impactKg})`);

    // 2. Create a mock user
    let user = await User.findOne({ username: 'action_test_user' });
    if (!user) {
      user = new User({
        username: 'action_test_user',
        email: 'action_test@example.com',
        password: 'testpassword'
      });
      await user.save();
    }
    const userId = user._id.toString();

    // 3. Simulate logging a completed action
    console.log('Simulating completing an action...');
    const completedAction = actions[0];
    
    const log = new CarbonLog({
      userId,
      type: completedAction.category,
      fileName: 'Manual Action',
      rawText: completedAction.description,
      billDetails: {
        utilityCompany: 'Self-Logged Micro-habit',
        billingPeriod: new Date().toLocaleDateString(),
        consumption: 1,
        units: 'action',
        state: 'US'
      },
      co2EmissionsKg: completedAction.impactKg,
    });
    await log.save();

    assert(log._id !== undefined, 'CarbonLog should be saved successfully');
    assert(log.co2EmissionsKg === -1.2, `Saved CO2 emissions should be -1.2 kg (got ${log.co2EmissionsKg})`);

    // 4. Update Habit State via MDP
    const mdpResult = await updateHabitState(userId, 'log', completedAction.impactKg);
    assert(mdpResult.currentStrength >= 5, `Habit strength should update (previous: ${mdpResult.previousStrength}, current: ${mdpResult.currentStrength})`);
    assert(mdpResult.reward > 10.0, `Reward should have a negative carbon emission bonus (got ${mdpResult.reward})`);

    // Clean up test data
    console.log('Cleaning up test user and logs...');
    await CarbonLog.deleteMany({ userId });
    await User.deleteOne({ _id: userId });

    console.log(`\n--- Verification Finished. Passed: ${passed}, Failed: ${failed} ---`);
  } catch (error) {
    console.error('Test execution failed with error:', error);
  } finally {
    process.exit(0);
  }
}

runActionTests();
