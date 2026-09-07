import { createFileRoute } from "@tanstack/react-router";
import {
  computeSnapshot,
  initialState,
  planRoute,
  tick,
  type ScenarioId,
  type SimState,
} from "@/lib/flood/engine";
import { MODEL_INFO } from "@/lib/flood/model";

/**
 * Public REST API for the flood system (all data SIMULATED).
 *
 *  GET  /api/public/flood/prediction?scenario=HEAVY_RAIN
 *  GET  /api/public/flood/risk-map
 *  GET  /api/public/flood/capacity
 *  GET  /api/public/flood/water-management
 *  GET  /api/public/flood/alerts
 *  GET  /api/public/flood/emergency
 *  GET  /api/public/flood/safe-route?from=N1&to=N5
 *  POST /api/public/flood/simulate   { "scenario": "ALL_STORAGE_FULL", "steps": 6 }
 */

const VALID: ScenarioId[] = [
  "NORMAL",
  "HEAVY_RAIN",
  "EXTREME_RAIN",
  "TANK_FULL",
  "ALL_STORAGE_FULL",
  "FLOOD_RESPONSE",
  "RECOVERY",
];

function build(scenario: string | null, steps = 8): SimState {
  const sc = (VALID as string[]).includes(scenario ?? "") ? (scenario as ScenarioId) : "NORMAL";
  let s = initialState(sc);
  for (let i = 0; i < steps; i++) s = tick(s);
  return s;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify({ simulated: true, model: MODEL_INFO, data }, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });

export const Route = createFileRoute("/api/public/flood/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const url = new URL(request.url);
        const snap = computeSnapshot(build(url.searchParams.get("scenario")));
        const path = (params._splat ?? "").replace(/^\/+|\/+$/g, "");

        switch (path) {
          case "prediction":
            return json({
              scenario: snap.scenario,
              rainfall_mmhr: snap.rainfall_mmhr,
              predicted_rainfall_mmhr: snap.predicted_rainfall_mmhr,
              water_level_m: snap.water_level_m,
              predicted_water_level_m: snap.predicted_water_level_m,
              overall: snap.overall,
              zones: snap.zones.map((z) => ({ id: z.id, name: z.name, ...z.prediction })),
              forecast: snap.forecast,
            });
          case "risk-map":
            return json({ zones: snap.zones, roads: snap.roads, facilities: snap.facilities, assets: snap.assets });
          case "capacity":
            return json({ capacity: snap.capacity, facilities: snap.facilities });
          case "water-management":
            return json({ capacity: snap.capacity, diversion: snap.diversion, facilities: snap.facilities });
          case "alerts":
            return json({ alerts: snap.alerts });
          case "emergency":
            return json({ emergency_mode: snap.diversion.emergency, assets: snap.assets, actions: snap.diversion.actions });
          case "safe-route":
            return json(planRoute(snap, url.searchParams.get("from") ?? "N1", url.searchParams.get("to") ?? "N5"));
          case "":
          case "snapshot":
            return json(snap);
          default:
            return json({ error: `Unknown endpoint '${path}'` }, 404);
        }
      },
      POST: async ({ params, request }) => {
        const path = (params._splat ?? "").replace(/^\/+|\/+$/g, "");
        if (path !== "simulate") return json({ error: "Unknown endpoint" }, 404);
        const body = (await request.json().catch(() => ({}))) as { scenario?: string; steps?: number };
        const steps = Math.min(Math.max(body.steps ?? 8, 1), 60);
        return json(computeSnapshot(build(body.scenario ?? "NORMAL", steps)));
      },
    },
  },
});
