import { Pause, Play } from "lucide-react";
import { SCENARIOS, type ScenarioId } from "@/lib/flood/engine";
import { cn } from "@/lib/utils";

export function SimControls({
  scenario,
  setScenario,
  running,
  setRunning,
}: {
  scenario: ScenarioId;
  setScenario: (id: ScenarioId) => void;
  running: boolean;
  setRunning: (v: boolean) => void;
}) {
  const active = SCENARIOS.find((s) => s.id === scenario)!;
  return (
    <div className="panel-surface flex flex-wrap items-center gap-2 px-3 py-2.5">
      <span className="label-caps mr-1">Simulation mode</span>
      {SCENARIOS.map((s) => (
        <button
          key={s.id}
          onClick={() => setScenario(s.id)}
          className={cn(
            "num rounded-md border px-2.5 py-1.5 text-[11px] font-semibold tracking-wide transition-colors",
            scenario === s.id
              ? "border-primary bg-primary/20 text-primary"
              : "border-border bg-card/60 text-muted-foreground hover:border-primary/50 hover:text-foreground",
          )}
        >
          {s.label.toUpperCase()}
        </button>
      ))}
      <button
        onClick={() => setRunning(!running)}
        className="ml-auto flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:border-primary/60"
      >
        {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
        {running ? "PAUSE LIVE FEED" : "RESUME LIVE FEED"}
      </button>
      <span className="w-full text-[11px] text-muted-foreground">{active.note} · data refreshes every 3 s</span>
    </div>
  );
}
