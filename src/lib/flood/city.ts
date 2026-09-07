// Static demo geography for the prototype city (Riverside District, Pune-like coords).
// All coordinates are synthetic demo data.

export const CITY_CENTER: [number, number] = [18.5204, 73.8567];

export type ZoneId = "A" | "B" | "C" | "D";

export interface ZoneDef {
  id: ZoneId;
  name: string;
  polygon: [number, number][];
  elevation_m: number;
  drainage_capacity_lpm: number;
  historical_floods: number;
  population: number;
}

export const ZONES: ZoneDef[] = [
  {
    id: "A",
    name: "Zone A — Old Market (Low-lying)",
    polygon: [
      [18.5265, 73.8495],
      [18.5265, 73.8585],
      [18.5205, 73.8585],
      [18.5205, 73.8495],
    ],
    elevation_m: 542,
    drainage_capacity_lpm: 22000,
    historical_floods: 7,
    population: 41000,
  },
  {
    id: "B",
    name: "Zone B — Riverfront Residential",
    polygon: [
      [18.5205, 73.8495],
      [18.5205, 73.8585],
      [18.5145, 73.8585],
      [18.5145, 73.8495],
    ],
    elevation_m: 546,
    drainage_capacity_lpm: 28000,
    historical_floods: 4,
    population: 33000,
  },
  {
    id: "C",
    name: "Zone C — Civic & Hospital Belt",
    polygon: [
      [18.5265, 73.8585],
      [18.5265, 73.8675],
      [18.5205, 73.8675],
      [18.5205, 73.8585],
    ],
    elevation_m: 551,
    drainage_capacity_lpm: 31000,
    historical_floods: 2,
    population: 27000,
  },
  {
    id: "D",
    name: "Zone D — Industrial Uplands",
    polygon: [
      [18.5205, 73.8585],
      [18.5205, 73.8675],
      [18.5145, 73.8675],
      [18.5145, 73.8585],
    ],
    elevation_m: 558,
    drainage_capacity_lpm: 35000,
    historical_floods: 1,
    population: 12000,
  },
];

export const RIVER: [number, number][] = [
  [18.5115, 73.8425],
  [18.5128, 73.8505],
  [18.5122, 73.8592],
  [18.5136, 73.8668],
  [18.5131, 73.8742],
];

// Underground diversion tunnel trunk line: flood zone -> tanks -> river outfall
export const TUNNEL: [number, number][] = [
  [18.5238, 73.8522],
  [18.5218, 73.8566],
  [18.5192, 73.8608],
  [18.5165, 73.8644],
  [18.5134, 73.8668],
];

export interface FacilityDef {
  id: string;
  name: string;
  kind: "tank" | "drain" | "pump";
  position: [number, number];
  capacity_kl: number;
  base_level_pct: number;
  max_intake_lpm: number;
  downstream_zone: ZoneId;
}

export const FACILITIES: FacilityDef[] = [
  {
    id: "TANK_A",
    name: "Storage Tank A",
    kind: "tank",
    position: [18.5222, 73.8548],
    capacity_kl: 42000,
    base_level_pct: 38,
    max_intake_lpm: 21000,
    downstream_zone: "B",
  },
  {
    id: "TANK_B",
    name: "Storage Tank B",
    kind: "tank",
    position: [18.5188, 73.8612],
    capacity_kl: 30000,
    base_level_pct: 52,
    max_intake_lpm: 16000,
    downstream_zone: "D",
  },
  {
    id: "TANK_C",
    name: "Storage Tank C",
    kind: "tank",
    position: [18.5251, 73.8637],
    capacity_kl: 18000,
    base_level_pct: 71,
    max_intake_lpm: 12000,
    downstream_zone: "C",
  },
  {
    id: "DRAIN_D",
    name: "Trunk Drain D",
    kind: "drain",
    position: [18.5162, 73.8523],
    capacity_kl: 26000,
    base_level_pct: 44,
    max_intake_lpm: 24000,
    downstream_zone: "B",
  },
  {
    id: "PUMP_R1",
    name: "River Outfall Pump R1",
    kind: "pump",
    position: [18.5138, 73.8664],
    capacity_kl: 100000,
    base_level_pct: 0,
    max_intake_lpm: 19000,
    downstream_zone: "D",
  },
];

export interface CriticalAsset {
  id: string;
  name: string;
  type: "Hospital" | "School" | "Residential" | "Power" | "Road";
  position: [number, number];
  zone: ZoneId;
  vulnerability: number; // 0..1
}

export const CRITICAL_ASSETS: CriticalAsset[] = [
  { id: "HOSP", name: "District General Hospital", type: "Hospital", position: [18.5241, 73.8623], zone: "C", vulnerability: 0.5 },
  { id: "SCH", name: "Municipal High School", type: "School", position: [18.5233, 73.8531], zone: "A", vulnerability: 0.8 },
  { id: "RES", name: "Ganga Residential Colony", type: "Residential", position: [18.5178, 73.8542], zone: "B", vulnerability: 0.75 },
  { id: "PWR", name: "132kV Substation", type: "Power", position: [18.5215, 73.8508], zone: "A", vulnerability: 0.9 },
  { id: "RD", name: "MG Bridge Approach Road", type: "Road", position: [18.5169, 73.8598], zone: "B", vulnerability: 0.65 },
];

export interface RoadSegment {
  id: string;
  name: string;
  zone: ZoneId;
  path: [number, number][];
  emergency_route: boolean;
  flood_threshold_cm: number;
}

export const ROADS: RoadSegment[] = [
  { id: "R1", name: "Market Road", zone: "A", path: [[18.5258, 73.8508], [18.5232, 73.8552], [18.5212, 73.8582]], emergency_route: false, flood_threshold_cm: 18 },
  { id: "R2", name: "Riverside Avenue", zone: "B", path: [[18.5212, 73.8582], [18.5182, 73.8562], [18.5152, 73.8528]], emergency_route: false, flood_threshold_cm: 22 },
  { id: "R3", name: "Civic Link (Emergency)", zone: "C", path: [[18.5212, 73.8582], [18.5238, 73.8614], [18.5252, 73.8658]], emergency_route: true, flood_threshold_cm: 34 },
  { id: "R4", name: "Industrial Bypass (Emergency)", zone: "D", path: [[18.5252, 73.8658], [18.5205, 73.8662], [18.5162, 73.8648]], emergency_route: true, flood_threshold_cm: 42 },
  { id: "R5", name: "Bridge Approach", zone: "B", path: [[18.5152, 73.8528], [18.5158, 73.8596], [18.5162, 73.8648]], emergency_route: false, flood_threshold_cm: 26 },
];

export const ROUTE_NODES = [
  { id: "N1", name: "Old Market Square", position: [18.5258, 73.8508] as [number, number] },
  { id: "N2", name: "Central Junction", position: [18.5212, 73.8582] as [number, number] },
  { id: "N3", name: "Riverside Gate", position: [18.5152, 73.8528] as [number, number] },
  { id: "N4", name: "Civic Centre", position: [18.5252, 73.8658] as [number, number] },
  { id: "N5", name: "River Outfall Depot", position: [18.5162, 73.8648] as [number, number] },
];

// Graph edges reference roads so flooding a road removes/penalises the edge.
export const ROUTE_EDGES: { from: string; to: string; road: string; minutes: number }[] = [
  { from: "N1", to: "N2", road: "R1", minutes: 7 },
  { from: "N2", to: "N3", road: "R2", minutes: 6 },
  { from: "N2", to: "N4", road: "R3", minutes: 8 },
  { from: "N4", to: "N5", road: "R4", minutes: 9 },
  { from: "N3", to: "N5", road: "R5", minutes: 11 },
];
