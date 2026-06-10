/**
 * @jest-environment node
 */
import { calculateEmissions, EGRID_MAPPING, DEFAULT_ELECTRICITY_FACTOR, GAS_FACTOR_KG_PER_THERM, WATER_FACTOR_KG_PER_GALLON } from '@/lib/egrid';

describe('eGRID Emission Calculations', () => {
  describe('Electricity emissions', () => {
    it('calculates CA electricity using CAMX subregion (0.24 kg/kWh)', () => {
      const result = calculateEmissions('electricity', 100, 'CA');
      expect(result.co2EmissionsKg).toBe(24);
      expect(result.subregion).toBe('CAMX');
      expect(result.factor).toBe(0.24);
    });

    it('calculates TX electricity using ERCT subregion (0.37 kg/kWh)', () => {
      const result = calculateEmissions('electricity', 200, 'TX');
      expect(result.co2EmissionsKg).toBe(74);
      expect(result.subregion).toBe('ERCT');
    });

    it('calculates WA electricity using NWPP subregion (0.14 kg/kWh — cleanest)', () => {
      const result = calculateEmissions('electricity', 500, 'WA');
      expect(result.co2EmissionsKg).toBe(70);
      expect(result.subregion).toBe('NWPP');
    });

    it('calculates CO electricity using RMPA subregion (0.51 kg/kWh — highest)', () => {
      const result = calculateEmissions('electricity', 100, 'CO');
      expect(result.co2EmissionsKg).toBe(51);
      expect(result.subregion).toBe('RMPA');
    });

    it('falls back to US_AVERAGE for unknown state codes', () => {
      const result = calculateEmissions('electricity', 100, 'XX');
      expect(result.co2EmissionsKg).toBe(39);
      expect(result.subregion).toBe('US_AVERAGE');
      expect(result.factor).toBe(DEFAULT_ELECTRICITY_FACTOR.factorKgPerKwh);
    });

    it('falls back to US_AVERAGE when no state is provided', () => {
      const result = calculateEmissions('electricity', 100);
      expect(result.co2EmissionsKg).toBe(39);
      expect(result.subregion).toBe('US_AVERAGE');
    });

    it('handles case-insensitive state codes', () => {
      const result = calculateEmissions('electricity', 100, 'ca');
      expect(result.co2EmissionsKg).toBe(24);
      expect(result.subregion).toBe('CAMX');
    });

    it('handles state codes with whitespace', () => {
      const result = calculateEmissions('electricity', 100, ' NY ');
      expect(result.co2EmissionsKg).toBe(28);
    });

    it('returns 0 for 0 consumption', () => {
      const result = calculateEmissions('electricity', 0, 'CA');
      expect(result.co2EmissionsKg).toBe(0);
    });
  });

  describe('Gas emissions', () => {
    it('calculates gas emissions at 5.3 kg CO₂ per therm', () => {
      const result = calculateEmissions('gas', 10);
      expect(result.co2EmissionsKg).toBe(53);
      expect(result.factor).toBe(GAS_FACTOR_KG_PER_THERM);
    });

    it('returns 0 for 0 consumption', () => {
      const result = calculateEmissions('gas', 0);
      expect(result.co2EmissionsKg).toBe(0);
    });

    it('ignores state parameter for gas', () => {
      const result = calculateEmissions('gas', 10, 'CA');
      expect(result.co2EmissionsKg).toBe(53);
      expect(result.subregion).toBeUndefined();
    });
  });

  describe('Water emissions', () => {
    it('calculates water emissions at 0.003 kg CO₂ per gallon', () => {
      const result = calculateEmissions('water', 1000);
      expect(result.co2EmissionsKg).toBe(3);
      expect(result.factor).toBe(WATER_FACTOR_KG_PER_GALLON);
    });

    it('returns 0 for 0 consumption', () => {
      const result = calculateEmissions('water', 0);
      expect(result.co2EmissionsKg).toBe(0);
    });
  });

  describe('Unknown utility types', () => {
    it('returns 0 emissions for unknown type', () => {
      const result = calculateEmissions('unknown', 100);
      expect(result.co2EmissionsKg).toBe(0);
      expect(result.factor).toBe(0);
    });

    it('handles case-insensitive type matching', () => {
      const result = calculateEmissions('ELECTRICITY', 100, 'CA');
      expect(result.co2EmissionsKg).toBe(24);
    });
  });

  describe('eGRID mapping coverage', () => {
    it('covers all 11 mapped US states', () => {
      const states = Object.keys(EGRID_MAPPING);
      expect(states).toHaveLength(11);
      expect(states).toEqual(expect.arrayContaining(['CA', 'NY', 'TX', 'WA', 'FL', 'IL', 'MA', 'CO', 'GA', 'MI', 'PA']));
    });

    it('all mapped factors are positive numbers', () => {
      for (const [, factor] of Object.entries(EGRID_MAPPING)) {
        expect(factor.factorKgPerKwh).toBeGreaterThan(0);
        expect(factor.subregion).toBeTruthy();
      }
    });
  });
});
