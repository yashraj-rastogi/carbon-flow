import { calculateEmissions } from './egrid';
import { transitionHabit, calculateReward } from './mdp';

function runTests() {
  console.log('--- Starting Core Logic Verification Tests ---\n');
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

  // 1. eGRID Calculations Tests
  console.log('Verifying eGRID Carbon Calculations...');
  
  // Electricity - CA
  const resCA = calculateEmissions('electricity', 100, 'CA');
  assert(resCA.co2EmissionsKg === 24, `CA Electricity 100 kWh should yield 24 kg CO2 (got ${resCA.co2EmissionsKg})`);
  assert(resCA.subregion === 'CAMX', `CA should use CAMX subregion (got ${resCA.subregion})`);

  // Electricity - Default State
  const resDefault = calculateEmissions('electricity', 100, 'XX');
  assert(resDefault.co2EmissionsKg === 39, `Default Electricity 100 kWh should yield 39 kg CO2 (got ${resDefault.co2EmissionsKg})`);
  assert(resDefault.subregion === 'US_AVERAGE', `Default should use US_AVERAGE subregion (got ${resDefault.subregion})`);

  // Gas
  const resGas = calculateEmissions('gas', 10);
  assert(resGas.co2EmissionsKg === 53, `Gas 10 therms should yield 53 kg CO2 (got ${resGas.co2EmissionsKg})`);

  // Water
  const resWater = calculateEmissions('water', 1000);
  assert(resWater.co2EmissionsKg === 3, `Water 1000 gallons should yield 3 kg CO2 (got ${resWater.co2EmissionsKg})`);

  // 2. MDP Transitions Tests
  console.log('\nVerifying MDP Habit Strength Transitions...');
  
  // Run multiple transitions to test probability bounds
  let logIncreases = 0;
  let logStays = 0;
  for (let i = 0; i < 1000; i++) {
    const { nextStrength } = transitionHabit(5, 'log');
    if (nextStrength === 6) logIncreases++;
    else if (nextStrength === 5) logStays++;
  }
  const logIncreasePercent = logIncreases / 10;
  assert(logIncreasePercent > 80 && logIncreasePercent < 98, `Log increases S from 5 to 6 in ~90% of cases (got ${logIncreasePercent}%)`);

  let omissionDropsBy2 = 0;
  let omissionDropsBy1 = 0;
  for (let i = 0; i < 1000; i++) {
    const { nextStrength } = transitionHabit(5, 'omission');
    if (nextStrength === 3) omissionDropsBy2++;
    else if (nextStrength === 4) omissionDropsBy1++;
  }
  const omissionDropPercent = omissionDropsBy2 / 10;
  assert(omissionDropPercent > 70 && omissionDropPercent < 90, `Omission drops S from 5 by 2 in ~80% of cases (got ${omissionDropPercent}%)`);

  // Max and min boundaries
  const maxBoundary = transitionHabit(10, 'log');
  assert(maxBoundary.nextStrength === 10, `S should be capped at 10 (got ${maxBoundary.nextStrength})`);

  const minBoundary = transitionHabit(0, 'omission');
  assert(minBoundary.nextStrength === 0, `S should not drop below 0 (got ${minBoundary.nextStrength})`);

  // 3. MDP Reward Function Tests
  console.log('\nVerifying MDP Reward Function...');
  
  // Omission penalty
  const rewardOmission = calculateReward(5, 'omission');
  assert(rewardOmission === -5, `Omission reward should be a fixed -5 penalty (got ${rewardOmission})`);

  // Log reward with 0 emissions (high points)
  const rewardLogLowEmission = calculateReward(5, 'log', 0);
  // Base (10) + Habit (1.5 * 5) - Carbon (0.15 * (0 - 10)) = 10 + 7.5 + 1.5 = 19
  assert(rewardLogLowEmission === 19.0, `Log reward at S=5 with 0 emissions should be 19.0 (got ${rewardLogLowEmission})`);

  // Log reward with high emissions (penalty)
  const rewardLogHighEmission = calculateReward(5, 'log', 50);
  // Base (10) + Habit (1.5 * 5) - Carbon (0.15 * (50 - 10)) = 10 + 7.5 - 6 = 11.5
  assert(rewardLogHighEmission === 11.5, `Log reward at S=5 with 50 emissions should be 11.5 (got ${rewardLogHighEmission})`);

  console.log(`\n--- Verification Finished. Passed: ${passed}, Failed: ${failed} ---`);
}

runTests();
