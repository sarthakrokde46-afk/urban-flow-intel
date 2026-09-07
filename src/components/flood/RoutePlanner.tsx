import { useMemo, useState } from "react";
import { ROUTE_NODES, planRoute, type Snapshot } from "@/lib/flood/engine";
import { Panel } from "./primitives";

export function RoutePlanner({ snap }: { snap: Snapshot }) {
  const [from, setFrom] = useState("N1");
  const [to, setTo] = useState("N5");
  const plan = useMemo(() => planRoute(snap, from, to), [snap, from, to]);

  const statusColor =
    plan.emergency_route_status === "CLEAR"
      ? "var(--risk-low)"
      : plan.emergency_route_status === "PARTIALLY FLOODED"
        ? "var(--risk-moderate)"
        : "var(--risk-critical)";

  return (
    <Panel title="Flood-Safe Route Planning" bodyClassName="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Start", value: from, set: setFrom },
          { label: "Destination", value: to, set: setTo },
        ].map((f) => (
          <label key={f.label} className="block">
            <span className="label-caps">{f.label}</span>
            <select
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-input px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
            >
              {ROUTE_NODES.map((n) => (
                <option key={n.id} value={n.id}>{n.name}</option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="space-y-2 text-xs">
        <RouteRow label="Normal route" plan={plan.normal} color="var(--muted-foreground)" />
        <RouteRow label="Recommended safe route" plan={plan.safe} color="var(--risk-low)" />
        <div className="rounded-md border border-border bg-card/60 px-3 py-2">
          <div className="label-caps">Flooded / unsafe roads</div>
          {plan.blocked_roads.length ? (
            <ul className="num mt-1 space-y-0.5" style={{ color: "var(--risk-critical)" }}>
              {plan.blocked_roads.map((r) => (
                <li key={r.id}>{r.name} — ~{r.depth_cm} cm predicted</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-muted-foreground">None predicted flooded.</p>
          )}
        </div>
        <div className="flex items-center justify-between rounded-md border border-border bg-card/60 px-3 py-2">
          <span className="label-caps">Emergency route status</span>
          <span className="num font-semibold" style={{ color: statusColor }}>{plan.emergency_route_status}</span>
        </div>
        <p className="text-muted-foreground">{plan.note} Routes recalculate automatically each data cycle.</p>
      </div>
    </Panel>
  );
}

function RouteRow({ label, plan, color }: { label: string; plan: { nodes: string[]; minutes: number } | null; color: string }) {
  return (
    <div className="rounded-md border border-border bg-card/60 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="label-caps">{label}</span>
        <span className="num font-semibold" style={{ color }}>{plan ? `${plan.minutes} min` : "unavailable"}</span>
      </div>
      <p className="mt-1 text-muted-foreground">{plan ? plan.nodes.join("  →  ") : "No passable corridor found."}</p>
    </div>
  );
}
