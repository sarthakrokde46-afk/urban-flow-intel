import type { Snapshot } from "@/lib/flood/engine";
import { Meter, Panel } from "./primitives";

export function TunnelDiagram({
  snap,
  selected,
  onSelect,
}: {
  snap: Snapshot;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const tanks = snap.facilities.filter((f) => f.kind !== "pump");
  const pump = snap.facilities.find((f) => f.kind === "pump")!;
  const sel = snap.facilities.find((f) => f.id === selected) ?? tanks[0];
  const flowing = !snap.diversion.emergency;

  return (
    <Panel title="Underground Diversion System" right={<span className="num text-[11px] text-muted-foreground">Click a tank for detail</span>} bodyClassName="space-y-4">
      <svg viewBox="0 0 720 300" className="w-full rounded-lg border border-border bg-card/50">
        <defs>
          <linearGradient id="grd" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--water)" />
            <stop offset="100%" stopColor="var(--tunnel)" />
          </linearGradient>
        </defs>

        <rect x="20" y="18" width="180" height="46" rx="8" fill="color-mix(in oklch, var(--risk-critical) 18%, transparent)" stroke="var(--risk-critical)" />
        <text x="110" y="40" textAnchor="middle" fill="var(--foreground)" fontSize="13" fontWeight="600">Urban Flood Zone</text>
        <text x="110" y="55" textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">{snap.zones[0].name.split("—")[0].trim()} · {snap.zones[0].prediction.predicted_water_depth_cm} cm</text>

        <path d="M110 64 L110 108" stroke="url(#grd)" strokeWidth="8" className={flowing ? "flow-line" : ""} />

        <rect x="20" y="108" width="660" height="34" rx="17" fill="color-mix(in oklch, var(--tunnel) 22%, transparent)" stroke="var(--tunnel)" />
        <text x="40" y="129" fill="var(--muted-foreground)" fontSize="11">Large underground diversion tunnel</text>
        <path d="M200 125 L660 125" stroke="var(--water)" strokeWidth="6" opacity={flowing ? 0.95 : 0.25} className={flowing ? "flow-line" : ""} />

        {tanks.map((t, i) => {
          const x = 60 + i * 165;
          const full = t.status === "FULL";
          const color = full ? "var(--risk-critical)" : t.status === "NEAR FULL" ? "var(--risk-moderate)" : "var(--risk-low)";
          const h = 66;
          return (
            <g key={t.id} onClick={() => onSelect(t.id)} style={{ cursor: "pointer" }}>
              <path d={`M${x + 55} 142 L${x + 55} 176`} stroke={full ? "var(--risk-critical)" : "var(--water)"} strokeWidth="5" strokeDasharray={full ? "4 6" : undefined} className={!full && flowing ? "flow-line" : ""} />
              <rect x={x} y={176} width="110" height={h} rx="8" fill="var(--card)" stroke={selected === t.id ? "var(--primary)" : color} strokeWidth={selected === t.id ? 2.5 : 1.5} />
              <rect x={x + 1} y={176 + h - (h * t.level_pct) / 100} width="108" height={(h * t.level_pct) / 100} rx="7" fill={color} opacity="0.35" />
              <text x={x + 55} y={200} textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="600">{t.name.replace("Storage ", "").replace("Trunk ", "")}</text>
              <text x={x + 55} y={216} textAnchor="middle" fill={color} fontSize="13" fontFamily="IBM Plex Mono, monospace">{Math.round(t.level_pct)}%</text>
              <text x={x + 55} y={232} textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">GATE {t.gate}</text>
            </g>
          );
        })}

        <path d="M555 142 L640 142 L640 200" stroke="var(--water)" strokeWidth="5" fill="none" className={flowing ? "flow-line" : ""} />
        <rect x="580" y="200" width="120" height="56" rx="8" fill="var(--card)" stroke="var(--risk-low)" />
        <text x="640" y="222" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="600">Outfall Pumps</text>
        <text x="640" y="238" textAnchor="middle" fill="var(--risk-low)" fontSize="11" fontFamily="IBM Plex Mono, monospace">{pump.pump} · {pump.outflow_lpm.toLocaleString()} L/min</text>

        <path d="M20 272 L700 272" stroke="var(--water)" strokeWidth="7" opacity="0.8" />
        <text x="24" y="266" fill="var(--muted-foreground)" fontSize="10">Safe river discharge</text>
      </svg>

      <div className="rounded-lg border border-border bg-card/60 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{sel.name}</h3>
          <span className="num text-[11px] text-muted-foreground">{sel.status}</span>
        </div>
        <div className="mt-2"><Meter pct={sel.level_pct} tone={sel.status === "FULL" ? "var(--risk-critical)" : sel.status === "NEAR FULL" ? "var(--risk-moderate)" : "var(--risk-low)"} /></div>
        <dl className="num mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
          {[
            ["Current level", `${Math.round(sel.level_pct)}%`],
            ["Max capacity", `${sel.capacity_kl.toLocaleString()} kL`],
            ["Available", `${sel.available_kl.toLocaleString()} kL`],
            ["Incoming flow", `${sel.inflow_lpm.toLocaleString()} L/min`],
            ["Outgoing flow", `${sel.outflow_lpm.toLocaleString()} L/min`],
            ["Gate / pump", `${sel.gate} / ${sel.pump}`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="label-caps">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Panel>
  );
}
