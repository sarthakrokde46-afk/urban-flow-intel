import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
import { AlertCenter } from "@/components/flood/AlertCenter";
import { AnalyticsPanel } from "@/components/flood/AnalyticsPanel";
import { CapacityPanel } from "@/components/flood/CapacityPanel";
import { DiversionPanel } from "@/components/flood/DiversionPanel";
import { EmergencyPanel } from "@/components/flood/EmergencyPanel";
import { NowcastPanel } from "@/components/flood/NowcastPanel";
import { Panel, riskColor } from "@/components/flood/primitives";
import { RoutePlanner } from "@/components/flood/RoutePlanner";
import { SimControls } from "@/components/flood/SimControls";
import { StatusBar } from "@/components/flood/StatusBar";
import { TunnelDiagram } from "@/components/flood/TunnelDiagram";
import { useSimulation } from "@/hooks/useSimulation";
import { cn } from "@/lib/utils";

const FloodMap = lazy(() => import("@/components/flood/FloodMap"));

const TITLE = "AquaSentinel — Urban Flood Prediction & Capacity-Aware Mitigation";
const DESC =
  "Live flood command centre: AI nowcasting 0–3 hours ahead, drainage and storage capacity monitoring, safe water diversion decisions, emergency response and flood-safe routing.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const TABS = ["Command", "Water Management", "Underground", "Response", "Analytics"] as const;

function Dashboard() {
  const { snapshot, scenario, setScenario, running, setRunning } = useSimulation(3000);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Command");
  const [selected, setSelected] = useState<string | null>("TANK_A");

  const select = (id: string) => {
    setSelected(id);
    setTab("Underground");
  };

  return (
    <main className="mx-auto flex max-w-[1600px] flex-col gap-4 p-3 sm:p-5">
      <StatusBar snap={snapshot} running={running} />
      <SimControls scenario={scenario} setScenario={setScenario} running={running} setRunning={setRunning} />

      <nav className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              tab === t ? "border-primary bg-primary/15 text-primary" : "border-border bg-card/50 text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </nav>

      {snapshot.diversion.emergency ? (
        <div
          className="panel-surface px-4 py-3"
          style={{ borderColor: "var(--risk-critical)", backgroundColor: "color-mix(in oklch, var(--risk-critical) 12%, transparent)" }}
        >
          <div className="text-sm font-semibold" style={{ color: "var(--risk-critical)" }}>
            ⚠ STORAGE CAPACITY EXHAUSTED — Emergency Mitigation Mode Activated
          </div>
          <p className="text-xs text-muted-foreground">
            Diversion to full tanks is stopped. Drainage, pumping, road closures and critical-asset protection are now the
            active mitigation path.
          </p>
        </div>
      ) : null}

      {tab === "Command" ? (
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="flex flex-col gap-4">
            <Panel title="Flood Risk Map — Riverside District" right={<MapLegend />} bodyClassName="p-0">
              <Suspense fallback={<div className="grid h-[540px] place-items-center text-xs text-muted-foreground">Loading map…</div>}>
                <FloodMap snap={snapshot} onSelectFacility={select} />
              </Suspense>
            </Panel>
            <NowcastPanel snap={snapshot} />
          </div>
          <div className="flex flex-col gap-4">
            <DiversionPanel snap={snapshot} />
            <AlertCenter snap={snapshot} />
          </div>
        </div>
      ) : null}

      {tab === "Water Management" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <CapacityPanel snap={snapshot} onSelect={select} />
          <div className="flex flex-col gap-4">
            <DiversionPanel snap={snapshot} />
            <AlertCenter snap={snapshot} />
          </div>
        </div>
      ) : null}

      {tab === "Underground" ? (
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <TunnelDiagram snap={snapshot} selected={selected} onSelect={setSelected} />
          <CapacityPanel snap={snapshot} onSelect={setSelected} />
        </div>
      ) : null}

      {tab === "Response" ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <EmergencyPanel snap={snapshot} />
          <div className="flex flex-col gap-4">
            <RoutePlanner snap={snapshot} />
            <AlertCenter snap={snapshot} />
          </div>
        </div>
      ) : null}

      {tab === "Analytics" ? <AnalyticsPanel snap={snapshot} /> : null}

      <footer className="pb-6 text-[11px] text-muted-foreground">
        Prototype for demonstration. All rainfall, gauge, tank and prediction values are simulated demo data produced by a
        clearly-labelled demo model — not real-world forecasts. REST endpoints: <code className="num">/api/public/flood/prediction</code>,{" "}
        <code className="num">/capacity</code>, <code className="num">/water-management</code>, <code className="num">/alerts</code>,{" "}
        <code className="num">/risk-map</code>, <code className="num">/safe-route</code>, <code className="num">POST /simulate</code>.
      </footer>
    </main>
  );
}

function MapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
      {(["LOW", "MODERATE", "HIGH", "CRITICAL"] as const).map((l) => (
        <span key={l} className="flex items-center gap-1">
          <span className="size-2 rounded-full" style={{ backgroundColor: riskColor[l] }} />
          {l}
        </span>
      ))}
    </div>
  );
}
