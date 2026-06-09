export interface EmissionFactor {
  subregion: string;
  factorKgPerKwh: number; // kg CO2 per kWh
}

// eGRID 2024 mapping for selected states
export const EGRID_MAPPING: Record<string, EmissionFactor> = {
  CA: { subregion: 'CAMX', factorKgPerKwh: 0.24 },
  NY: { subregion: 'NYCW/NYUP', factorKgPerKwh: 0.28 },
  TX: { subregion: 'ERCT', factorKgPerKwh: 0.37 },
  WA: { subregion: 'NWPP', factorKgPerKwh: 0.14 },
  FL: { subregion: 'FRCC', factorKgPerKwh: 0.36 },
  IL: { subregion: 'RFCW', factorKgPerKwh: 0.37 },
  MA: { subregion: 'NEWE', factorKgPerKwh: 0.23 },
  CO: { subregion: 'RMPA', factorKgPerKwh: 0.51 },
  GA: { subregion: 'SRSO', factorKgPerKwh: 0.33 },
  MI: { subregion: 'RFCM', factorKgPerKwh: 0.45 },
  PA: { subregion: 'RFCE', factorKgPerKwh: 0.31 },
};

export const DEFAULT_ELECTRICITY_FACTOR: EmissionFactor = {
  subregion: 'US_AVERAGE',
  factorKgPerKwh: 0.39,
};

// Natural Gas: kg CO2 per therm (1 therm = 29.3 kWh equivalent)
export const GAS_FACTOR_KG_PER_THERM = 5.3;

// Water: kg CO2 per gallon (energy used for treatment & pumping)
export const WATER_FACTOR_KG_PER_GALLON = 0.003;

/**
 * Calculates emission based on utility type, consumption, and state.
 */
export function calculateEmissions(type: string, consumption: number, state?: string): {
  co2EmissionsKg: number;
  subregion?: string;
  factor: number;
} {
  const normalizedState = state ? state.toUpperCase().trim() : 'DEFAULT';

  switch (type.toLowerCase()) {
    case 'electricity': {
      const egrid = EGRID_MAPPING[normalizedState] || DEFAULT_ELECTRICITY_FACTOR;
      return {
        co2EmissionsKg: parseFloat((consumption * egrid.factorKgPerKwh).toFixed(2)),
        subregion: egrid.subregion,
        factor: egrid.factorKgPerKwh,
      };
    }
    case 'gas':
      return {
        co2EmissionsKg: parseFloat((consumption * GAS_FACTOR_KG_PER_THERM).toFixed(2)),
        factor: GAS_FACTOR_KG_PER_THERM,
      };
    case 'water':
      return {
        co2EmissionsKg: parseFloat((consumption * WATER_FACTOR_KG_PER_GALLON).toFixed(2)),
        factor: WATER_FACTOR_KG_PER_GALLON,
      };
    default:
      return {
        co2EmissionsKg: 0,
        factor: 0,
      };
  }
}
