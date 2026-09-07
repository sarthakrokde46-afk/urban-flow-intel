import { Activity, CloudRain, Droplets, Waves } from "lucide-react";
import type { Snapshot } from "@/lib/flood/engine";
import { DemoTag, RiskBadge } from "./primitives";

export function StatusBar({ snap, running }: { snap: Snapshot; running: boolean }) {
  const items = [
    { icon: CloudRain, label: "Rainfall", value: `${snap.rainfall_mmhr}`, unit: "mm/hr" },
    { icon: Waves, label: "Water level", value: `${snap.water_level_m}`, unit: "m" },
    { icon: Droplets, label: "Storage used", value: `${Math.round(snap.capacity.total_used_pct)}`, unit: "%" },
  ];
  return (
    <header className="panel-surface flex flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-md bg-primary/15 text-primary">
          <Waves className="size-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight sm:text-base">
            AquaSentinel <span className="text-muted-foreground">— Urban Flood Command</span>
          </h1>
          <p className="text-[11px] text-muted-foreground">AI nowcasting · capacity-aware mitigation</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px]">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full rounded-full opacity-75" style={{ backgroundColor: running ? "var(--risk-low)" : "var(--risk-moderate)" }} />
        </span>
        <span className="num text-muted-foreground">
          {running ? "SYSTEM ONLINE" : "SIMULATION PAUSED"} · updated{" "}
          {new Date(snap.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-4">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2">
            <it.icon className="size-4 text-muted-foreground" />
            <div>
              <div className="label-caps">{it.label}</div>
              <div className="num text-sm font-semibold">
                {it.value}
                <span className="ml-1 text-[10px] font-normal text-muted-foreground">{it.unit}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          <div>
            <div className="label-caps">Overall risk</div>
            <RiskBadge level={snap.overall.severity} />
          </div>
        </div>
        <DemoTag />
      </div>
    </header>
  );
}
