/**
 * Flood simulation + decision engine.
 * Pure functions over a serialisable state object, so the same code runs in the
 * browser (live dashboard) and on the server (REST endpoints).
 * ALL DATA IS SIMULATED DEMO DATA.
 */
import {
  CRITICAL_ASSETS,
  FACILITIES,
  ROADS,
  ROUTE_EDGES,
  ROUTE_NODES,
  ZONES,
  type ZoneId,
} from "./city";
import { HORIZONS, predictFlood, type FloodPrediction, type Severity } from "./model";

export type ScenarioId =
  | "NORMAL"
  | "HEAVY_RAIN"
  | "EXTREME_RAIN"
  | "TANK_FULL"
  | "ALL_STORAGE_FULL"
  | "FLOOD_RESPONSE"
  | "RECOVERY";

export const SCENARIOS: { id: ScenarioId; label: string; note: string }[] = [
  { id: "NORMAL", label: "Normal Rain", note: "Baseline monitoring, low risk" },
  { id: "HEAVY_RAIN", label: "Heavy Rain", note: "Risk rises, diversion recommended" },
  { id: "EXTREME_RAIN", label: "Extreme Rain", note: "Critical nowcast across low zones" },
  { id: "TANK_FULL", label: "Tank Filling", note: "Storage headroom shrinking" },
  { id: "ALL_STORAGE_FULL", label: "All Storage Full", note: "Emergency mitigation mode" },
  { id: "FLOOD_RESPONSE", label: "Flood Response", note: "Pumps max, routes protected" },
  { id: "RECOVERY", label: "Recovery", note: "Levels receding to normal" },
];

interface ScenarioTarget {
  rain: number; // mm/hr target
  gauge: number; // river/water level target (m)
  fill: Record<string, number>; // target level pct per facility
  pumpBoost: number;
}

const T: Record<ScenarioId, ScenarioTarget> = {
  NORMAL: { rain: 6, gauge: 1.3, fill: { TANK_A: 34, TANK_B: 46, TANK_C: 58, DRAIN_D: 40 }, pumpBoost: 0.3 },
  HEAVY_RAIN: { rain: 42, gauge: 2.1, fill: { TANK_A: 62, TANK_B: 70, TANK_C: 82, DRAIN_D: 61 }, pumpBoost: 0.6 },
  EXTREME_RAIN: { rain: 88, gauge: 2.9, fill: { TANK_A: 80, TANK_B: 88, TANK_C: 96, DRAIN_D: 74 }, pumpBoost: 0.85 },
  TANK_FULL: { rain: 66, gauge: 2.7, fill: { TANK_A: 91, TANK_B: 96, TANK_C: 100, DRAIN_D: 78 }, pumpBoost: 0.9 },
  ALL_STORAGE_FULL: { rain: 96, gauge: 3.4, fill: { TANK_A: 100, TANK_B: 100, TANK_C: 100, DRAIN_D: 97 }, pumpBoost: 1 },
  FLOOD_RESPONSE: { rain: 58, gauge: 3.1, fill: { TANK_A: 98, TANK_B: 99, TANK_C: 100, DRAIN_D: 88 }, pumpBoost: 1 },
  RECOVERY: { rain: 11, gauge: 1.7, fill: { TANK_A: 52, TANK_B: 58, TANK_C: 66, DRAIN_D: 44 }, pumpBoost: 0.45 },
};

export interface SimState {
  scenario: ScenarioId;
  tick: number;
  updatedAt: number;
  rainfall_mmhr: number;
  cumulative_rainfall_mm: number;
  water_level_m: number;
  levels: Record<string, number>; // facility id -> level pct
  history: {
    t: string;
    rainfall: number;
    water_level: number;
    depth: number;
    probability: number;
    storage_used: number;
  }[];
}

const approach = (cur: number, target: number, rate: number) => cur + (target - cur) * rate;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

export function initialState(scenario: ScenarioId = "NORMAL"): SimState {
  const t = T[scenario];
  const levels: Record<string, number> = {};
  for (const f of FACILITIES) levels[f.id] = t.fill[f.id] ?? f.base_level_pct;
  const s: SimState = {
    scenario,
    tick: 0,
    updatedAt: Date.now(),
    rainfall_mmhr: t.rain,
    cumulative_rainfall_mm: t.rain * 1.6,
    water_level_m: t.gauge,
    levels,
    history: [],
  };
  return pushHistory(s);
}

function pushHistory(s: SimState): SimState {
  const snap = computeSnapshot(s);
  const label = new Date(s.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const worst = snap.zones[0]!;
  const history = [
    ...s.history,
    {
      t: label,
      rainfall: r1(s.rainfall_mmhr),
      water_level: r1(s.water_level_m),
      depth: worst.prediction.predicted_water_depth_cm,
      probability: Math.round(worst.prediction.flood_probability * 100),
      storage_used: Math.round(snap.capacity.total_used_pct),
    },
  ].slice(-40);
  return { ...s, history };
}

export function tick(s: SimState): SimState {
  const t = T[s.scenario];
  const jitter = (a: number) => (Math.sin(s.tick * 1.7 + a) + Math.cos(s.tick * 0.9 + a * 2)) * 0.5;

  const rainfall_mmhr = clamp(approach(s.rainfall_mmhr, t.rain, 0.28) + jitter(1) * 2.4, 0, 140);
  const water_level_m = clamp(approach(s.water_level_m, t.gauge, 0.22) + jitter(2) * 0.04, 0.4, 5);
  const levels: Record<string, number> = {};
  for (const f of FACILITIES) {
    const target = t.fill[f.id] ?? f.base_level_pct;
    levels[f.id] = clamp(approach(s.levels[f.id] ?? f.base_level_pct, target, 0.2) + jitter(3) * 0.4, 0, 100);
  }

  const next: SimState = {
    ...s,
    tick: s.tick + 1,
    updatedAt: Date.now(),
    rainfall_mmhr,
    water_level_m,
    levels,
    cumulative_rainfall_mm: clamp(
      s.scenario === "RECOVERY" || s.scenario === "NORMAL"
        ? s.cumulative_rainfall_mm * 0.94
        : s.cumulative_rainfall_mm + rainfall_mmhr / 12,
      0,
      420,
    ),
  };
  return pushHistory(next);
}

export function setScenario(s: SimState, scenario: ScenarioId): SimState {
  return pushHistory({ ...s, scenario, updatedAt: Date.now() });
}

/* ---------------- capacity ---------------- */

export interface FacilityStatus {
  id: string;
  name: string;
  kind: "tank" | "drain" | "pump";
  position: [number, number];
  level_pct: number;
  capacity_kl: number;
  available_pct: number;
  available_kl: number;
  status: "AVAILABLE" | "NEAR FULL" | "FULL";
  inflow_lpm: number;
  outflow_lpm: number;
  gate: "OPEN" | "THROTTLED" | "CLOSED";
  pump: "RUNNING" | "STANDBY" | "MAX";
  downstream_zone: ZoneId;
  downstream_risk: Severity;
}

/* ---------------- snapshot ---------------- */

export interface ZoneStatus {
  id: ZoneId;
  name: string;
  polygon: [number, number][];
  elevation_m: number;
  population: number;
  drainage_capacity_lpm: number;
  drainage_utilisation_pct: number;
  prediction: FloodPrediction;
}

export interface DiversionPlan {
  emergency: boolean;
  incoming_lpm: number;
  allocations: { facility: string; name: string; rate_lpm: number; available_pct: number; downstream_risk: Severity }[];
  unmanaged_lpm: number;
  headline: string;
  detail: string;
  actions: string[];
}

export interface AlertItem {
  id: string;
  level: "CRITICAL" | "WARNING" | "STORAGE" | "EMERGENCY" | "RESOLVED";
  title: string;
  body: string;
}

export interface Snapshot {
  scenario: ScenarioId;
  updatedAt: number;
  simulated: true;
  rainfall_mmhr: number;
  predicted_rainfall_mmhr: number;
  cumulative_rainfall_mm: number;
  water_level_m: number;
  predicted_water_level_m: number;
  zones: ZoneStatus[];
  overall: { severity: Severity; probability: number };
  facilities: FacilityStatus[];
  capacity: { total_kl: number; available_kl: number; total_used_pct: number; all_full: boolean };
  diversion: DiversionPlan;
  alerts: AlertItem[];
  assets: {
    id: string; name: string; type: string; zone: ZoneId; risk: Severity;
    depth_cm: number; eta_min: number | null; action: string;
  }[];
  roads: { id: string; name: string; path: [number, number][]; emergency_route: boolean; flooded: boolean; depth_cm: number }[];
  forecast: { horizon_min: number; rainfall: number; water_level: number; depth: number; probability: number }[];
  history: SimState["history"];
}

const sevRank: Record<Severity, number> = { LOW: 0, MODERATE: 1, HIGH: 2, CRITICAL: 3 };

export function computeSnapshot(s: SimState): Snapshot {
  const totalCap = FACILITIES.filter((f) => f.kind !== "pump").reduce((a, f) => a + f.capacity_kl, 0);
  const availKl = FACILITIES.filter((f) => f.kind !== "pump").reduce(
    (a, f) => a + f.capacity_kl * (1 - (s.levels[f.id] ?? 0) / 100),
    0,
  );
  const storageAvailablePct = (availKl / totalCap) * 100;

  const zones: ZoneStatus[] = ZONES.map((z) => {
    const drainUtil = clamp((s.levels["DRAIN_D"] ?? 40) * (z.elevation_m < 548 ? 1.05 : 0.85), 0, 100);
    return {
      id: z.id,
      name: z.name,
      polygon: z.polygon,
      elevation_m: z.elevation_m,
      population: z.population,
      drainage_capacity_lpm: z.drainage_capacity_lpm,
      drainage_utilisation_pct: drainUtil,
      prediction: predictFlood({
        rainfall_intensity_mmhr: s.rainfall_mmhr,
        cumulative_rainfall_mm: s.cumulative_rainfall_mm,
        water_level_m: s.water_level_m,
        elevation_m: z.elevation_m,
        drainage_capacity_lpm: z.drainage_capacity_lpm,
        drainage_utilisation_pct: drainUtil,
        storage_available_pct: storageAvailablePct,
        historical_floods: z.historical_floods,
      }),
    };
  }).sort((a, b) => b.prediction.flood_probability - a.prediction.flood_probability);

  const worst = zones[0]!;

  const facilities: FacilityStatus[] = FACILITIES.map((f) => {
    const level = s.levels[f.id] ?? f.base_level_pct;
    const available_pct = f.kind === "pump" ? 100 : Math.max(0, 100 - level);
    const status: FacilityStatus["status"] =
      f.kind === "pump" ? "AVAILABLE" : available_pct <= 0.5 ? "FULL" : available_pct < 12 ? "NEAR FULL" : "AVAILABLE";
    const dz = zones.find((z) => z.id === f.downstream_zone)!;
    const load = clamp(s.rainfall_mmhr / 100, 0, 1);
    return {
      id: f.id,
      name: f.name,
      kind: f.kind,
      position: f.position,
      level_pct: level,
      capacity_kl: f.capacity_kl,
      available_pct,
      available_kl: Math.round(f.capacity_kl * (available_pct / 100)),
      status,
      inflow_lpm: status === "FULL" ? 0 : Math.round(f.max_intake_lpm * load * 0.9),
      outflow_lpm: Math.round(f.max_intake_lpm * (f.kind === "pump" ? T[s.scenario].pumpBoost : load * 0.45)),
      gate: status === "FULL" ? "CLOSED" : status === "NEAR FULL" ? "THROTTLED" : "OPEN",
      pump: T[s.scenario].pumpBoost >= 0.9 ? "MAX" : T[s.scenario].pumpBoost >= 0.5 ? "RUNNING" : "STANDBY",
      downstream_zone: f.downstream_zone,
      downstream_risk: dz.prediction.flood_severity,
    };
  });

  const diversion = planDiversion(s, zones, facilities);
  const roads = ROADS.map((r) => {
    const z = zones.find((zz) => zz.id === r.zone)!;
    const depth = Math.round(z.prediction.predicted_water_depth_cm * (r.emergency_route ? 0.55 : 0.9));
    return {
      id: r.id,
      name: r.name,
      path: r.path,
      emergency_route: r.emergency_route,
      depth_cm: depth,
      flooded: depth >= r.flood_threshold_cm,
    };
  });

  const assets = CRITICAL_ASSETS.map((a) => {
    const z = zones.find((zz) => zz.id === a.zone)!;
    const depth = Math.round(z.prediction.predicted_water_depth_cm * (0.6 + a.vulnerability * 0.6));
    const p = z.prediction.flood_probability * (0.7 + a.vulnerability * 0.4);
    const risk: Severity = p >= 0.75 || depth >= 55 ? "CRITICAL" : p >= 0.55 || depth >= 30 ? "HIGH" : p >= 0.3 || depth >= 12 ? "MODERATE" : "LOW";
    const action =
      risk === "CRITICAL"
        ? a.type === "Hospital"
          ? "Deploy barriers, stage ambulances on high ground, switch to backup power"
          : a.type === "Power"
            ? "Pre-emptive isolation of feeder, deploy sandbag ring"
            : a.type === "Road"
              ? "Close road and divert traffic to emergency route"
              : "Evacuate ground floors, open relief shelter"
        : risk === "HIGH"
          ? "Stage pumps and barriers, alert facility manager"
          : risk === "MODERATE"
            ? "Monitor, pre-position sandbags"
            : "Routine monitoring";
    return {
      id: a.id, name: a.name, type: a.type, zone: a.zone, risk,
      depth_cm: depth, eta_min: z.prediction.time_to_flood_min, action,
    };
  }).sort((x, y) => sevRank[y.risk] - sevRank[x.risk]);

  const forecast = HORIZONS.map((h) => {
    const t = T[s.scenario];
    const k = clamp(h / 180, 0, 1);
    const rainfall = r1(s.rainfall_mmhr + (t.rain - s.rainfall_mmhr) * k + (s.scenario === "RECOVERY" ? -k * 6 : k * 4));
    const water_level = r1(s.water_level_m + (t.gauge - s.water_level_m) * k + (s.scenario === "RECOVERY" ? -k * 0.3 : k * 0.25));
    const p = predictFlood({
      rainfall_intensity_mmhr: Math.max(rainfall, 0),
      cumulative_rainfall_mm: s.cumulative_rainfall_mm + rainfall * (h / 60),
      water_level_m: water_level,
      elevation_m: ZONES.find((z) => z.id === worst.id)!.elevation_m,
      drainage_capacity_lpm: worst.drainage_capacity_lpm,
      drainage_utilisation_pct: worst.drainage_utilisation_pct,
      storage_available_pct: Math.max(0, storageAvailablePct - k * 18),
      historical_floods: 7,
    });
    return {
      horizon_min: h,
      rainfall: Math.max(0, rainfall),
      water_level,
      depth: p.predicted_water_depth_cm,
      probability: Math.round(p.flood_probability * 100),
    };
  });

  const snapshot: Snapshot = {
    scenario: s.scenario,
    updatedAt: s.updatedAt,
    simulated: true,
    rainfall_mmhr: r1(s.rainfall_mmhr),
    predicted_rainfall_mmhr: forecast[1]!.rainfall,
    cumulative_rainfall_mm: r1(s.cumulative_rainfall_mm),
    water_level_m: r1(s.water_level_m),
    predicted_water_level_m: forecast[1]!.water_level,
    zones,
    overall: { severity: worst.prediction.flood_severity, probability: Math.round(worst.prediction.flood_probability * 100) },
    facilities,
    capacity: {
      total_kl: totalCap,
      available_kl: Math.round(availKl),
      total_used_pct: 100 - storageAvailablePct,
      all_full: facilities.filter((f) => f.kind !== "pump").every((f) => f.status === "FULL"),
    },
    diversion,
    alerts: buildAlerts(zones, facilities, diversion),
    assets,
    roads,
    forecast,
    history: s.history,
  };
  return snapshot;
}

/* ---------------- capacity-aware diversion ---------------- */

function planDiversion(s: SimState, zones: ZoneStatus[], facilities: FacilityStatus[]): DiversionPlan {
  const worst = zones[0]!;
  const incoming = Math.round(
    Math.max(0, s.rainfall_mmhr * 620 - worst.drainage_capacity_lpm * (1 - worst.drainage_utilisation_pct / 100) * 0.6),
  );

  const storage = facilities.filter((f) => f.kind !== "pump");
  const allFull = storage.every((f) => f.status === "FULL");

  // Rank by: real available capacity first, then LOW downstream risk.
  const candidates = storage
    .filter((f) => f.status !== "FULL" && f.available_pct > 1)
    .filter((f) => sevRank[f.downstream_risk] < 3)
    .sort((a, b) => sevRank[a.downstream_risk] - sevRank[b.downstream_risk] || b.available_kl - a.available_kl);

  const allocations: DiversionPlan["allocations"] = [];
  let remaining = incoming;
  for (const c of candidates) {
    if (remaining <= 0) break;
    const rate = Math.min(remaining, Math.round(c.available_kl * 1000 * 0.0006), 22000);
    if (rate < 500) continue;
    allocations.push({
      facility: c.id,
      name: c.name,
      rate_lpm: rate,
      available_pct: Math.round(c.available_pct),
      downstream_risk: c.downstream_risk,
    });
    remaining -= rate;
  }

  const pumps = facilities.filter((f) => f.kind === "pump");
  const pumpCapacity = pumps.reduce((a, p) => a + p.outflow_lpm, 0);
  const pumped = Math.min(remaining, pumpCapacity);
  if (pumped > 500) {
    allocations.push({
      facility: pumps[0]!.id,
      name: `${pumps[0]!.name} → controlled river discharge`,
      rate_lpm: pumped,
      available_pct: 100,
      downstream_risk: "LOW",
    });
    remaining -= pumped;
  }

  const emergency = allFull || (remaining > 0 && allocations.length === 0);

  if (emergency) {
    return {
      emergency: true,
      incoming_lpm: incoming,
      allocations: [],
      unmanaged_lpm: Math.max(0, remaining),
      headline: "STORAGE CAPACITY EXHAUSTED — Emergency Mitigation Mode",
      detail:
        "No destination has safe available capacity. All diversion gates to full tanks are CLOSED. The system will not send water to a full tank.",
      actions: [
        "Stop all diversion to full tanks (gates closed & locked)",
        `Maximise remaining safe drainage — ${Math.round(pumpCapacity).toLocaleString()} L/min via river outfall`,
        "Run all pumps at maximum sustainable duty, rotate to avoid failure",
        `Close predicted-dangerous roads in ${worst.name}`,
        "Deploy barriers around hospital, substation and residential colony",
        "Keep emergency routes (Civic Link, Industrial Bypass) clear",
        "Alert municipal authority, NDRF and traffic police",
        "Issue citizen warning: avoid low-lying areas, move to upper floors",
      ],
    };
  }

  const top = allocations[0];
  return {
    emergency: false,
    incoming_lpm: incoming,
    allocations,
    unmanaged_lpm: Math.max(0, remaining),
    headline: top
      ? `Divert excess water toward ${top.name}`
      : "No diversion required — drainage handling current runoff",
    detail: top
      ? `Available capacity ${top.available_pct}% · Estimated safe diversion ${top.rate_lpm.toLocaleString()} L/min · Downstream risk ${top.downstream_risk}`
      : "Runoff is within drainage capacity. Continuous monitoring active.",
    actions: top
      ? [
          ...allocations.map((a) => `Open gate to ${a.name} at ${a.rate_lpm.toLocaleString()} L/min (headroom ${a.available_pct}%)`),
          remaining > 500 ? `Residual ${Math.round(remaining).toLocaleString()} L/min unmanaged — stage mobile pumps` : "All predicted runoff allocated to safe capacity",
          "Continue downstream risk checks every cycle",
        ]
      : ["Maintain drainage inspection", "Keep tanks at operating level for headroom"],
  };
}

/* ---------------- alerts ---------------- */

function buildAlerts(zones: ZoneStatus[], facilities: FacilityStatus[], plan: DiversionPlan): AlertItem[] {
  const out: AlertItem[] = [];
  if (plan.emergency) {
    out.push({
      id: "emg",
      level: "EMERGENCY",
      title: "Emergency Mitigation Mode activated",
      body: "All nearby storage capacity exhausted. Diversion halted; drainage, pumping and protection actions in force.",
    });
  }
  for (const z of zones) {
    const p = z.prediction;
    if (p.flood_severity === "CRITICAL" || p.flood_severity === "HIGH") {
      out.push({
        id: `zone-${z.id}`,
        level: p.flood_severity === "CRITICAL" ? "CRITICAL" : "WARNING",
        title: `Flooding predicted in ${z.name.split("—")[0].trim()}`,
        body: `Probability ${Math.round(p.flood_probability * 100)}% · depth ~${p.predicted_water_depth_cm} cm${p.time_to_flood_min ? ` · in ~${p.time_to_flood_min} min` : ""}.`,
      });
    }
  }
  for (const f of facilities) {
    if (f.kind === "pump") continue;
    if (f.status === "FULL") {
      out.push({ id: `full-${f.id}`, level: "STORAGE", title: `${f.name} has reached 100% capacity`, body: "Intake gate closed. Excluded from diversion options." });
    } else if (f.status === "NEAR FULL") {
      out.push({ id: `near-${f.id}`, level: "WARNING", title: `${f.name} approaching critical level`, body: `Only ${Math.round(f.available_pct)}% headroom (${f.available_kl.toLocaleString()} kL) remaining.` });
    }
  }
  if (out.length === 0) {
    out.push({ id: "ok", level: "RESOLVED", title: "Water levels below critical threshold", body: "Normal monitoring. All destinations have safe headroom." });
  }
  return out;
}

/* ---------------- flood-safe routing ---------------- */

export interface RoutePlan {
  from: string;
  to: string;
  normal: { nodes: string[]; minutes: number; roads: string[] } | null;
  safe: { nodes: string[]; minutes: number; roads: string[] } | null;
  blocked_roads: { id: string; name: string; depth_cm: number }[];
  emergency_route_status: "CLEAR" | "PARTIALLY FLOODED" | "BLOCKED";
  note: string;
}

export function planRoute(snap: Snapshot, fromId: string, toId: string): RoutePlan {
  const flooded = new Set(snap.roads.filter((r) => r.flooded).map((r) => r.id));
  const nodeName = (id: string) => ROUTE_NODES.find((n) => n.id === id)?.name ?? id;

  const search = (avoidFlooded: boolean) => {
    const dist: Record<string, number> = {};
    const prev: Record<string, { node: string; road: string }> = {};
    ROUTE_NODES.forEach((n) => (dist[n.id] = Infinity));
    dist[fromId] = 0;
    const pending = new Set(ROUTE_NODES.map((n) => n.id));
    while (pending.size) {
      let cur = "";
      let best = Infinity;
      for (const n of pending) if (dist[n]! < best) { best = dist[n]!; cur = n; }
      if (!cur) break;
      pending.delete(cur);
      for (const e of ROUTE_EDGES) {
        const pair = e.from === cur ? e.to : e.to === cur ? e.from : null;
        if (!pair || !pending.has(pair)) continue;
        if (avoidFlooded && flooded.has(e.road)) continue;
        const road = snap.roads.find((r) => r.id === e.road)!;
        const cost = e.minutes + (avoidFlooded ? 0 : flooded.has(e.road) ? 0 : 0) + road.depth_cm * 0.05;
        if (dist[cur]! + cost < dist[pair]!) {
          dist[pair] = dist[cur]! + cost;
          prev[pair] = { node: cur, road: e.road };
        }
      }
    }
    if (!isFinite(dist[toId]!)) return null;
    const nodes: string[] = [toId];
    const roads: string[] = [];
    let cur = toId;
    while (cur !== fromId && prev[cur]) {
      roads.unshift(prev[cur]!.road);
      cur = prev[cur]!.node;
      nodes.unshift(cur);
    }
    return { nodes: nodes.map(nodeName), minutes: Math.round(dist[toId]!), roads };
  };

  const normal = search(false);
  const safe = search(true);
  const emergencyRoads = snap.roads.filter((r) => r.emergency_route);
  const blockedEmergency = emergencyRoads.filter((r) => r.flooded).length;

  return {
    from: nodeName(fromId),
    to: nodeName(toId),
    normal,
    safe,
    blocked_roads: snap.roads.filter((r) => r.flooded).map((r) => ({ id: r.id, name: r.name, depth_cm: r.depth_cm })),
    emergency_route_status:
      blockedEmergency === 0 ? "CLEAR" : blockedEmergency < emergencyRoads.length ? "PARTIALLY FLOODED" : "BLOCKED",
    note: safe
      ? normal && safe.minutes > normal.minutes
        ? "Safe route avoids predicted flooded roads and is longer than the normal route."
        : "Normal route is currently passable."
      : "No flood-safe route available — all corridors predicted flooded. Use air/boat assets.",
  };
}

export { ROUTE_NODES };
