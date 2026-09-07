/**
 * DEMO FLOOD PREDICTION MODEL (simulation, not a trained model).
 *
 * This module is the replaceable AI layer. It exposes a single pure function
 * `predictFlood(features) -> FloodPrediction`, mirroring the signature a real
 * trained regressor/classifier (e.g. gradient boosting on gauge + radar data)
 * would expose. To plug in a real model, keep the same input/output contract
 * and swap the implementation (or call out to an inference endpoint).
 *
 * Outputs are clearly labelled as SIMULATED throughout the UI.
 */

export const MODEL_INFO = {
  name: "UrbanFlood-Demo",
  version: "0.4.0-sim",
  kind: "Deterministic hydrological heuristic (demo)",
  trained: false,
} as const;

export interface FloodFeatures {
  rainfall_intensity_mmhr: number;
  cumulative_rainfall_mm: number;
  water_level_m: number;
  elevation_m: number;
  drainage_capacity_lpm: number;
  drainage_utilisation_pct: number;
  storage_available_pct: number;
  historical_floods: number;
}

export type Severity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface FloodPrediction {
  flood_probability: number; // 0..1
  predicted_water_depth_cm: number;
  time_to_flood_min: number | null;
  flood_severity: Severity;
  model: typeof MODEL_INFO;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function predictFlood(f: FloodFeatures): FloodPrediction {
  // Relative elevation term: lower ground floods first (542m = lowest demo ground).
  const elevationTerm = clamp((556 - f.elevation_m) / 16, 0, 1);

  // Effective runoff pressure vs. drainage that is actually still usable.
  const usableDrainage = f.drainage_capacity_lpm * (1 - f.drainage_utilisation_pct / 100);
  const runoff_lpm = f.rainfall_intensity_mmhr * 620 * (0.55 + 0.45 * elevationTerm);
  const loadRatio = runoff_lpm / Math.max(usableDrainage, 1);

  const storageTerm = clamp(1 - f.storage_available_pct / 100, 0, 1);
  const soakTerm = clamp(f.cumulative_rainfall_mm / 120, 0, 1);
  const gaugeTerm = clamp((f.water_level_m - 1.4) / 2.2, 0, 1);
  const historyTerm = clamp(f.historical_floods / 8, 0, 1);

  const score =
    1.55 * clamp(loadRatio, 0, 2) +
    1.15 * gaugeTerm +
    0.85 * soakTerm +
    0.7 * storageTerm +
    0.55 * elevationTerm +
    0.35 * historyTerm -
    1.9;

  const flood_probability = clamp(1 / (1 + Math.exp(-1.9 * score)), 0.01, 0.99);

  const depthDrive = Math.max(0, loadRatio - 0.55) * 46 + gaugeTerm * 34 + soakTerm * 16;
  const predicted_water_depth_cm = Math.round(clamp(depthDrive * (0.6 + 0.6 * elevationTerm), 0, 145));

  let time_to_flood_min: number | null = null;
  if (flood_probability > 0.35 && predicted_water_depth_cm > 5) {
    const urgency = clamp(loadRatio, 0.2, 2.2);
    time_to_flood_min = Math.round(clamp(180 / urgency - gaugeTerm * 45, 6, 180));
  }

  let flood_severity: Severity = "LOW";
  if (flood_probability >= 0.8 || predicted_water_depth_cm >= 60) flood_severity = "CRITICAL";
  else if (flood_probability >= 0.6 || predicted_water_depth_cm >= 32) flood_severity = "HIGH";
  else if (flood_probability >= 0.35 || predicted_water_depth_cm >= 12) flood_severity = "MODERATE";

  return {
    flood_probability,
    predicted_water_depth_cm,
    time_to_flood_min,
    flood_severity,
    model: MODEL_INFO,
  };
}

/** Forecast horizon used by the analytics timeline (minutes ahead). */
export const HORIZONS = [0, 30, 60, 90, 120, 180];
