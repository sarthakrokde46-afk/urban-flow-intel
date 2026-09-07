import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import { CITY_CENTER, CRITICAL_ASSETS, RIVER, TUNNEL } from "@/lib/flood/city";
import type { Snapshot } from "@/lib/flood/engine";
import { riskColor } from "./primitives";

export default function FloodMap({ snap, onSelectFacility }: { snap: Snapshot; onSelectFacility: (id: string) => void }) {
  const el = useRef<HTMLDivElement | null>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<import("leaflet").LayerGroup | null>(null);
  const snapRef = useRef(snap);
  snapRef.current = snap;

  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !el.current || map.current) return;
      const m = L.map(el.current, { center: CITY_CENTER, zoom: 14, zoomControl: true, attributionControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors · simulated overlays",
      }).addTo(m);
      layer.current = L.layerGroup().addTo(m);
      map.current = m;
      draw(L);
    })();
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (!map.current) return;
      const L = (await import("leaflet")).default;
      draw(L);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap]);

  function draw(L: typeof import("leaflet")) {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    const s = snapRef.current;

    // Risk zones
    for (const z of s.zones) {
      const c = riskColor[z.prediction.flood_severity];
      L.polygon(z.polygon, { color: c, weight: 2, fillColor: c, fillOpacity: 0.18 })
        .bindPopup(
          `<b>${z.name}</b><br/>Risk: ${z.prediction.flood_severity}<br/>Probability: ${Math.round(z.prediction.flood_probability * 100)}%<br/>Depth: ${z.prediction.predicted_water_depth_cm} cm<br/>ETA: ${z.prediction.time_to_flood_min ?? "—"} min`,
        )
        .addTo(g);
    }

    // River
    L.polyline(RIVER, { color: "var(--water)", weight: 6, opacity: 0.7 }).bindTooltip("River — discharge corridor").addTo(g);

    // Underground diversion tunnel (animated dashes)
    L.polyline(TUNNEL, { color: "var(--tunnel)", weight: 5, opacity: 0.95, dashArray: "10 12", className: "flow-line" })
      .bindTooltip("Underground diversion tunnel")
      .addTo(g);

    // Roads
    for (const r of s.roads) {
      L.polyline(r.path, {
        color: r.flooded ? "var(--risk-critical)" : r.emergency_route ? "var(--risk-low)" : "var(--muted-foreground)",
        weight: r.flooded ? 6 : 4,
        opacity: r.flooded ? 0.95 : 0.7,
        dashArray: r.emergency_route ? "2 6" : undefined,
      })
        .bindTooltip(`${r.name} — ${r.flooded ? `FLOODED ~${r.depth_cm} cm` : "passable"}${r.emergency_route ? " · emergency route" : ""}`)
        .addTo(g);
    }

    // Facilities
    for (const f of s.facilities) {
      const color =
        f.status === "FULL" ? "var(--risk-critical)" : f.status === "NEAR FULL" ? "var(--risk-moderate)" : "var(--risk-low)";
      const icon = L.divIcon({
        className: "",
        html: `<div style="display:flex;flex-direction:column;align-items:center">
          <div style="width:26px;height:26px;border-radius:7px;border:2px solid ${color};background:oklch(0.23 0.03 252);color:${color};display:grid;place-items:center;font:600 10px/1 'IBM Plex Mono',monospace">${f.kind === "pump" ? "PMP" : f.kind === "drain" ? "DRN" : Math.round(f.level_pct)}</div>
        </div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      L.marker(f.position, { icon })
        .bindTooltip(`${f.name} · ${Math.round(f.level_pct)}% full · ${f.status}`)
        .on("click", () => onSelectFacility(f.id))
        .addTo(g);
    }

    // Critical infrastructure
    for (const a of CRITICAL_ASSETS) {
      const asset = s.assets.find((x) => x.id === a.id)!;
      const c = riskColor[asset.risk];
      L.circleMarker(a.position, { radius: 7, color: c, weight: 2, fillColor: "var(--card)", fillOpacity: 1 })
        .bindTooltip(`${a.name} (${a.type}) — risk ${asset.risk}, ~${asset.depth_cm} cm`)
        .addTo(g);
    }

    // Active diversion flow arrows: worst zone -> allocated destination
    if (!s.diversion.emergency) {
      const origin = s.zones[0]!.polygon[0]!;
      for (const alloc of s.diversion.allocations) {
        const dest = s.facilities.find((f) => f.id === alloc.facility);
        if (!dest) continue;
        L.polyline([origin, dest.position], {
          color: "var(--primary)",
          weight: 3,
          opacity: 0.9,
          dashArray: "8 10",
          className: "flow-line",
        })
          .bindTooltip(`Diverting ${alloc.rate_lpm.toLocaleString()} L/min → ${dest.name}`)
          .addTo(g);
      }
    }
  }

  return <div ref={el} className="h-[540px] w-full" />;
}
