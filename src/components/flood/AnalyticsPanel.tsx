import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Snapshot } from "@/lib/flood/engine";
import { Panel } from "./primitives";

const axis = { stroke: "var(--muted-foreground)", fontSize: 10 };
const tooltipStyle = {
  contentStyle: {
    background: "var(--panel)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--foreground)",
  },
  labelStyle: { color: "var(--muted-foreground)" },
};

export function AnalyticsPanel({ snap }: { snap: Snapshot }) {
  const forecast = snap.forecast.map((f) => ({ ...f, label: f.horizon_min === 0 ? "Now" : `+${f.horizon_min}m` }));
  const capacity = snap.facilities
    .filter((f) => f.kind !== "pump")
    .map((f) => ({ name: f.name.replace("Storage ", "").replace("Trunk ", ""), used: Math.round(f.level_pct), free: Math.round(f.available_pct) }));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Rainfall & Water Level (live)" bodyClassName="h-[240px] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={snap.history}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="t" {...axis} minTickGap={40} />
            <YAxis {...axis} />
            <Tooltip {...tooltipStyle} />
            <Area type="monotone" dataKey="rainfall" name="Rainfall mm/hr" stroke="var(--water)" fill="color-mix(in oklch, var(--water) 25%, transparent)" strokeWidth={2} />
            <Area type="monotone" dataKey="water_level" name="Water level m" stroke="var(--risk-moderate)" fill="color-mix(in oklch, var(--risk-moderate) 18%, transparent)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Forecast Timeline — Now → +180 min" bodyClassName="h-[240px] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={forecast}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="label" {...axis} />
            <YAxis {...axis} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="probability" name="Flood probability %" stroke="var(--risk-critical)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="depth" name="Predicted depth cm" stroke="var(--risk-high)" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="rainfall" name="Rainfall mm/hr" stroke="var(--water)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Storage & Drainage Capacity" bodyClassName="h-[240px] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={capacity}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="name" {...axis} />
            <YAxis {...axis} domain={[0, 100]} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="used" name="Used %" stackId="a" fill="var(--risk-high)" radius={[0, 0, 4, 4]} />
            <Bar dataKey="free" name="Available %" stackId="a" fill="var(--risk-low)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Flood Probability & Depth (live)" bodyClassName="h-[240px] p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={snap.history}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
            <XAxis dataKey="t" {...axis} minTickGap={40} />
            <YAxis {...axis} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey="probability" name="Probability %" stroke="var(--risk-critical)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="depth" name="Depth cm" stroke="var(--risk-high)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="storage_used" name="Storage used %" stroke="var(--tunnel)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>
    </div>
  );
}
