import type { ReactNode } from "react";
import type { Severity } from "@/lib/flood/model";
import { cn } from "@/lib/utils";

export const riskColor: Record<Severity, string> = {
  LOW: "var(--risk-low)",
  MODERATE: "var(--risk-moderate)",
  HIGH: "var(--risk-high)",
  CRITICAL: "var(--risk-critical)",
};

export const riskDot: Record<Severity, string> = {
  LOW: "🟢",
  MODERATE: "🟡",
  HIGH: "🟠",
  CRITICAL: "🔴",
};

export function Panel({
  title,
  right,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("panel-surface flex flex-col overflow-hidden", className)}>
      <header className="flex items-center justify-between gap-3 border-b border-border bg-panel-header px-4 py-2.5">
        <h2 className="label-caps !text-foreground">{title}</h2>
        {right}
      </header>
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function RiskBadge({ level, className }: { level: Severity; className?: string }) {
  return (
    <span
      className={cn("num inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold", className)}
      style={{ color: riskColor[level], backgroundColor: `color-mix(in oklch, ${riskColor[level]} 18%, transparent)` }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: riskColor[level] }} />
      {level}
    </span>
  );
}

export function Stat({
  label,
  value,
  unit,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  tone?: Severity;
}) {
  return (
    <div className="rounded-lg border border-border bg-card/60 px-3 py-2.5">
      <div className="label-caps">{label}</div>
      <div className="num mt-1 flex items-baseline gap-1 text-2xl font-semibold" style={tone ? { color: riskColor[tone] } : undefined}>
        {value}
        {unit ? <span className="text-xs font-normal text-muted-foreground">{unit}</span> : null}
      </div>
      {sub ? <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function Meter({ pct, tone }: { pct: number; tone: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: tone }} />
    </div>
  );
}

export function DemoTag({ className }: { className?: string }) {
  return (
    <span className={cn("num rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] tracking-wider text-muted-foreground", className)}>
      SIMULATED DEMO DATA
    </span>
  );
}
