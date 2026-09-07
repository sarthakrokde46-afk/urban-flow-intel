import type { Snapshot } from "@/lib/flood/engine";
import { MODEL_INFO } from "@/lib/flood/model";
import { Meter, Panel, RiskBadge, Stat, riskColor } from "./primitives";

export function NowcastPanel({ snap }: { snap: Snapshot }) {
  const lead = snap.zones[0]!;
  return (
    <Panel
      title="Flood Nowcasting (0–3 h)"
      right={<span className="num text-[10px] text-muted-foreground">{MODEL_INFO.name} v{MODEL_INFO.version}</span>}
      bodyClassName="space-y-4"
    >
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat label="Rainfall intensity" value={snap.rainfall_mmhr} unit="mm/hr" sub={`+30 min: ${snap.predicted_rainfall_mmhr} mm/hr`} />
        <Stat label="Water level" value={snap.water_level_m} unit="m" sub={`+30 min: ${snap.predicted_water_level_m} m`} />
        <Stat label="Flood probability" value={`${Math.round(lead.prediction.flood_probability * 100)}`} unit="%" tone={lead.prediction.flood_severity} sub={lead.name.split("—")[0].trim()} />
        <Stat label="Expected depth" value={lead.prediction.predicted_water_depth_cm} unit="cm" tone={lead.prediction.flood_severity} sub={lead.prediction.time_to_flood_min ? `Time to flood ~${lead.prediction.time_to_flood_min} min` : "No flooding expected"} />
      </div>

      <div className="space-y-2">
        {snap.zones.map((z) => (
          <div key={z.id} className="rounded-lg border border-border bg-card/60 px-3 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{z.name}</span>
              <RiskBadge level={z.prediction.flood_severity} />
            </div>
            <div className="num mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground sm:grid-cols-4">
              <span>Prob <b className="text-foreground">{Math.round(z.prediction.flood_probability * 100)}%</b></span>
              <span>Depth <b className="text-foreground">{z.prediction.predicted_water_depth_cm} cm</b></span>
              <span>ETA <b className="text-foreground">{z.prediction.time_to_flood_min ? `${z.prediction.time_to_flood_min} min` : "—"}</b></span>
              <span>Elev <b className="text-foreground">{z.elevation_m} m</b></span>
            </div>
            <div className="mt-2">
              <Meter pct={z.prediction.flood_probability * 100} tone={riskColor[z.prediction.flood_severity]} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Predictions come from a clearly-labelled demo hydrological model ({MODEL_INFO.kind}); it is not trained on real
        observations and must not be used operationally. The module exposes a fixed input/output contract so a trained
        model can replace it.
      </p>
    </Panel>
  );
}
