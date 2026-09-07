import type { FacilityStatus, Snapshot } from "@/lib/flood/engine";
import { Meter, Panel, RiskBadge } from "./primitives";

const statusTone: Record<FacilityStatus["status"], string> = {
  AVAILABLE: "var(--risk-low)",
  "NEAR FULL": "var(--risk-moderate)",
  FULL: "var(--risk-critical)",
};

export function CapacityPanel({ snap, onSelect }: { snap: Snapshot; onSelect: (id: string) => void }) {
  return (
    <Panel
      title="Capacity Monitor"
      right={
        <span className="num text-[11px] text-muted-foreground">
          {snap.capacity.available_kl.toLocaleString()} kL free / {snap.capacity.total_kl.toLocaleString()} kL
        </span>
      }
      bodyClassName="space-y-2"
    >
      {snap.facilities.map((f) => (
        <button
          key={f.id}
          onClick={() => onSelect(f.id)}
          className="w-full rounded-lg border border-border bg-card/60 px-3 py-2.5 text-left transition-colors hover:border-primary/60"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">{f.name}</span>
            <span className="num text-[11px] font-semibold" style={{ color: statusTone[f.status] }}>
              {f.status}
            </span>
          </div>
          <div className="num mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Level <b className="text-foreground">{Math.round(f.level_pct)}%</b></span>
            <span>Available <b className="text-foreground">{Math.round(f.available_pct)}%</b> ({f.available_kl.toLocaleString()} kL)</span>
          </div>
          <div className="mt-2">
            <Meter pct={f.level_pct} tone={statusTone[f.status]} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="num">In {f.inflow_lpm.toLocaleString()} · Out {f.outflow_lpm.toLocaleString()} L/min · Gate {f.gate}</span>
            <span className="flex items-center gap-1">Downstream <RiskBadge level={f.downstream_risk} /></span>
          </div>
        </button>
      ))}
    </Panel>
  );
}
