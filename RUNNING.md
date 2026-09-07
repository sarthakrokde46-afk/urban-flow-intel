# AquaSentinel — Urban Flood Prediction & Capacity-Aware Mitigation

A working prototype flood command centre: AI nowcasting (0–3 h), risk map, drainage/storage
capacity monitoring, capacity-aware diversion decisions, emergency mitigation mode,
flood-safe routing, alerts and analytics.

> **All data is simulated demo data.** The prediction module is a clearly labelled demo
> hydrological model, not a trained model, and must not be used operationally.

## Run locally (VS Code)

```bash
bun install       # or: npm install
bun run dev       # or: npm run dev
```

Open http://localhost:8080

## Stack note

This project runs on the platform's fixed stack: **React + TypeScript (TanStack Start)** with
server-side REST endpoints, Leaflet + OpenStreetMap for maps and Recharts for charts.
A separate Python/FastAPI service is not supported here, so the prediction model and all
backend logic are implemented as isolated, swappable modules with the same contract a
Python service would expose.

## Modules

```
src/lib/flood/model.ts     AI layer  -> predictFlood(features) -> {probability, depth, eta, severity}
src/lib/flood/engine.ts    simulation, capacity analysis, diversion decision, alerts, routing
src/lib/flood/city.ts      demo geodata: zones, river, tunnel, tanks, drains, pumps, roads, assets
src/hooks/useSimulation.ts live 3-second data loop
src/components/flood/*     dashboard, map, charts, alerts, water management, underground view
src/routes/api/public/flood/$.ts   REST API
```

## REST API

| Method | Endpoint |
| --- | --- |
| GET | `/api/public/flood/prediction?scenario=HEAVY_RAIN` |
| GET | `/api/public/flood/risk-map` |
| GET | `/api/public/flood/capacity` |
| GET | `/api/public/flood/water-management` |
| GET | `/api/public/flood/alerts` |
| GET | `/api/public/flood/emergency` |
| GET | `/api/public/flood/safe-route?from=N1&to=N5` |
| POST | `/api/public/flood/simulate` body `{"scenario":"ALL_STORAGE_FULL","steps":10}` |

## Replacing the demo model with a real one

Keep the `FloodFeatures -> FloodPrediction` contract in `src/lib/flood/model.ts`.
Either implement the new logic there, or make `predictFlood` call your inference
service; nothing else in the app needs to change.

## Demo script for judges

Use the Simulation Mode buttons in order:
NORMAL → HEAVY RAIN → EXTREME RAIN → TANK FILLING → ALL STORAGE FULL → FLOOD RESPONSE → RECOVERY.
At **ALL STORAGE FULL** the system stops diverting to full tanks and switches to
Emergency Mitigation Mode with drainage, pumping, road-closure and protection actions.
