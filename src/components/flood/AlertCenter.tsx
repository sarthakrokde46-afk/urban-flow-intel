import type { AlertItem, Snapshot } from "@/lib/flood/engine";
import { Panel } from "./primitives";

const tone: Record<AlertItem["level"], { color: string; icon: string }> = {
  CRITICAL: { color: "var(--risk-critical)", icon: "🔴" },
  WARNING: { color: "var(--risk-high)", icon: "🟠" },
  STORAGE: { color: "var(--risk-moderate)", icon: "⚠" },
  EMERGENCY: { color: "var(--risk-critical)", icon: "🚨" },
  RESOLVED: { color: "var(--risk-low)", icon: "🟢" },
};

export function AlertCenter({ snap }: { snap: Snapshot }) {
  return (
    <Panel title="Alert Center" right={<span className="num text-[11px] text-muted-foreground">{snap.alerts.length} active</span>} bodyClassName="space-y-2">
      {snap.alerts.map((a) => {
        const t = tone[a.level];
        return (
          <div
            key={a.id}
            className="rounded-lg border px-3 py-2.5"
            style={{ borderColor: `color-mix(in oklch, ${t.color} 50%, transparent)`, backgroundColor: `color-mix(in oklch, ${t.color} 10%, transparent)` }}
          >
            <div className="flex items-center gap-2">
              <span>{t.icon}</span>
              <span className="num text-[10px] font-semibold tracking-widest" style={{ color: t.color }}>{a.level}</span>
            </div>
            <div className="mt-1 text-sm font-medium">{a.title}</div>
            <p className="text-xs text-muted-foreground">{a.body}</p>
          </div>
        );
      })}
    </Panel>
  );
}
