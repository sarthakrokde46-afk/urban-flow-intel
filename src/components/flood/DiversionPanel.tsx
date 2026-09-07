import { AlertTriangle, ArrowRight, ShieldCheck } from "lucide-react";
import type { Snapshot } from "@/lib/flood/engine";
import { Panel, RiskBadge } from "./primitives";

export function DiversionPanel({ snap }: { snap: Snapshot }) {
  const d = snap.diversion;
  const tone = d.emergency ? "var(--risk-critical)" : "var(--risk-low)";
  return (
    <Panel
      title="Capacity-Aware Diversion Decision"
      right={<span className="num text-[11px] text-muted-foreground">Incoming {d.incoming_lpm.toLocaleString()} L/min</span>}
      bodyClassName="space-y-3"
    >
      <div
        className="rounded-lg border px-3 py-3"
        style={{ borderColor: tone, backgroundColor: `color-mix(in oklch, ${tone} 12%, transparent)` }}
      >
        <div className="flex items-start gap-2">
          {d.emergency ? <AlertTriangle className="mt-0.5 size-4 shrink-0" style={{ color: tone }} /> : <ShieldCheck className="mt-0.5 size-4 shrink-0" style={{ color: tone }} />}
          <div>
            <div className="text-sm font-semibold" style={{ color: tone }}>
              {d.emergency ? "⚠ " : ""}
              {d.headline}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{d.detail}</p>
          </div>
        </div>
      </div>

      {!d.emergency && d.allocations.length > 0 ? (
        <div className="space-y-1.5">
          {d.allocations.map((a) => (
            <div key={a.facility} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs">
              <span className="flex items-center gap-2 font-medium">
                <ArrowRight className="size-3.5 text-primary" />
                {a.name}
              </span>
              <span className="num flex items-center gap-3 text-muted-foreground">
                <span>{a.rate_lpm.toLocaleString()} L/min</span>
                <span>headroom {a.available_pct}%</span>
                <RiskBadge level={a.downstream_risk} />
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <ol className="space-y-1.5">
        {d.actions.map((a, i) => (
          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
            <span className="num text-[10px] text-primary">{String(i + 1).padStart(2, "0")}</span>
            <span>{a}</span>
          </li>
        ))}
      </ol>

      <div className="num rounded-md border border-dashed border-border px-3 py-2 text-[11px] text-muted-foreground">
        Decision chain: predict flood → compute incoming volume → check every destination’s real headroom → exclude FULL
        tanks → verify downstream risk → allocate safest capacity → escalate to emergency mode when exhausted.
      </div>
    </Panel>
  );
}
