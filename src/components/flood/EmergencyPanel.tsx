import type { Snapshot } from "@/lib/flood/engine";
import { Panel, RiskBadge } from "./primitives";

export function EmergencyPanel({ snap }: { snap: Snapshot }) {
  return (
    <Panel title="Emergency Response — Critical Areas" bodyClassName="space-y-2">
      {snap.assets.map((a) => (
        <div key={a.id} className="rounded-lg border border-border bg-card/60 px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">
              {a.name} <span className="text-[11px] text-muted-foreground">· {a.type} · Zone {a.zone}</span>
            </span>
            <RiskBadge level={a.risk} />
          </div>
          <div className="num mt-1 flex gap-4 text-xs text-muted-foreground">
            <span>Depth <b className="text-foreground">{a.depth_cm} cm</b></span>
            <span>ETA <b className="text-foreground">{a.eta_min ? `${a.eta_min} min` : "—"}</b></span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">→ {a.action}</p>
        </div>
      ))}
    </Panel>
  );
}
