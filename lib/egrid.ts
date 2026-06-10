/**
 * EPA eGRID 2024 emission factors for US electricity generation.
 * Maps US state codes to their subregion and CO₂ intensity factor.
 * @module egrid
 */

/** Emission factor for a specific eGRID subregion. */
export interface EmissionFactor {
  /** EPA eGRID subregion identifier (e.g., 'CAMX', 'ERCT'). */
  subregion: string;
  /** CO₂ emission intensity in kg CO₂ per kWh of electricity consumed. */
  factorKgPerKwh: number;
}

/**
 * eGRID 2024 state-to-subregion mapping for selected US states.
 *
 * Source: EPA eGRID 2024 — https://www.epa.gov/egrid
 * Values represent the annual average CO₂ output emission rate (kg/kWh)
 * for the subregion serving each state's primary load.
 */
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

/** Default US average electricity emission factor when state is unknown. */
export const DEFAULT_ELECTRICITY_FACTOR: EmissionFactor = {
  subregion: 'US_AVERAGE',
  factorKgPerKwh: 0.39,
};

/** Natural gas emission factor: kg CO₂ per therm (1 therm ≈ 29.3 kWh). */
export const GAS_FACTOR_KG_PER_THERM = 5.3;

/** Water treatment emission factor: kg CO₂ per gallon (pumping & treatment energy). */
export const WATER_FACTOR_KG_PER_GALLON = 0.003;

/**
 * Calculates carbon emissions for a given utility consumption.
 *
 * Supports three utility types:
 * - **electricity**: Uses state-specific eGRID factors (or US average fallback)
 * - **gas**: Uses fixed therm-to-CO₂ conversion
 * - **water**: Uses fixed gallon-to-CO₂ conversion (treatment energy)
 *
 * @param type - Utility type: 'electricity', 'gas', or 'water'.
 * @param consumption - Numeric consumption amount in native units (kWh/therms/gallons).
 * @param state - Optional two-letter US state code for localized electricity factors.
 * @returns Calculated emissions in kg CO₂, the eGRID subregion (if applicable), and the factor used.
 */
export function calculateEmissions(
  type: string,
  consumption: number,
  state?: string
): {
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
