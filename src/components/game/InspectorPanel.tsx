"use client";

/* DOM readout for the Optics Inspector. Values come straight from the 10 Hz HUD snapshot built by
 * the solver bridge, so TC-G13 can compare these strings with the tracer's HitEvent vectors. */
import { Panel } from "@/components/ui";
import { inspectorConfig } from "@/config/inspectorConfig";
import { formatNumber, formatVector } from "@/engine/core/inspector";
import { createStore } from "@/lib/store/createStore";
import { useStore } from "@/hooks/useStore";
import type { InspectorSnapshot } from "@/types/inspector";

export interface InspectorPanelProps {
  inspector: InspectorSnapshot;
  stats: { fps: number; frameMs: number };
}

const frameHistory = createStore<number[]>(
  Array.from({ length: inspectorConfig.graph.samples }, () => 0),
);

/** Called by the game HUD poll; the graph subscribes like any other small external store. */
export function recordFrame(frameMs: number): void {
  frameHistory.set((previous) => [...previous.slice(1), frameMs]);
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 font-mono text-xs">
      <dt className="text-mist">{label}</dt>
      <dd className="text-right text-beam-core">{value}</dd>
    </div>
  );
}

export function InspectorPanel({ inspector, stats }: InspectorPanelProps) {
  const { samples, width, height, maxMs, strokeWidth } = inspectorConfig.graph;
  const history = useStore(frameHistory);

  if (!inspector.inspector) return null;
  const hit = inspector.hit;
  const points = history.map((ms, index) => {
    const x = (index / (samples - 1)) * width;
    const y = height - Math.min(1, ms / maxMs) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <Panel
      title="Optics Inspector"
      eyebrow={inspector.normalsOnly ? "normals only" : "d · n · r"}
      className="pointer-events-none absolute right-4 top-4 z-10 w-80"
    >
      {hit ? (
        <dl className="space-y-1">
          <Row label="hit" value={`${hit.objectId} · ${hit.type} · bounce ${hit.bounce}`} />
          <Row label="point" value={formatVector(hit.point)} />
          <Row label="d" value={formatVector(hit.incident)} />
          <Row label="n" value={formatVector(hit.normal)} />
          <Row label="d·n" value={formatNumber(hit.dot)} />
          <Row label="r" value={formatVector(hit.reflected)} />
          <Row label="i / r angle" value={`${formatNumber(hit.incidenceDeg)}° / ${formatNumber(hit.reflectionDeg)}°`} />
        </dl>
      ) : (
        <p className="text-xs text-mist">Select a component to inspect a beam hit.</p>
      )}
      <dl className="mt-3 space-y-1 border-t border-navy-line pt-2">
        <Row label="segments / hits" value={`${inspector.segmentCount} / ${inspector.eventCount}`} />
        <Row label="max bounce" value={String(inspector.maxBounce)} />
        <Row label="solve" value={`${inspector.solveMs.toFixed(inspectorConfig.decimals)} ms`} />
        <Row label="fps / frame" value={`${Math.round(stats.fps)} / ${stats.frameMs.toFixed(inspectorConfig.text.frameDecimals)} ms`} />
      </dl>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full" role="img" aria-label="Frame-time graph">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-cyan-beam" />
      </svg>
      <p className="mt-1 font-mono text-xs text-mist">frame time · {maxMs} ms ceiling</p>
    </Panel>
  );
}
