import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  computeSnapshot,
  initialState,
  setScenario as applyScenario,
  tick as advance,
  type ScenarioId,
  type SimState,
} from "@/lib/flood/engine";

export function useSimulation(intervalMs = 3000) {
  const [state, setState] = useState<SimState>(() => initialState("NORMAL"));
  const [running, setRunning] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => setState((s) => advance(s)), intervalMs);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running, intervalMs]);

  const setScenario = useCallback((id: ScenarioId) => {
    setState((s) => applyScenario(s, id));
  }, []);

  const snapshot = useMemo(() => computeSnapshot(state), [state]);

  return { snapshot, scenario: state.scenario, setScenario, running, setRunning };
}
