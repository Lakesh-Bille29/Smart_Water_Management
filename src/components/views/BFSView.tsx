import type { WaterNode, BFSResult } from '../../engine/graphEngine';
import PlaybackStrip from './PlaybackStrip';

interface Props {
  nodes: WaterNode[];
  result: BFSResult;
  source: string;
  setSource: (id: string) => void;
  stepIndex: number;
  setStepIndex: (i: number) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  speed: number;
  setSpeed: (v: number) => void;
  maxStep: number;
}

export default function BFSView({
  nodes,
  result,
  source,
  setSource,
  stepIndex,
  setStepIndex,
  isPlaying,
  setIsPlaying,
  speed,
  setSpeed,
  maxStep,
}: Props) {
  const labelMap = new Map(nodes.map(n => [n.id, n.label]));
  const lbl = (id: string) => labelMap.get(id) ?? id;

  const step = result.steps[Math.min(stepIndex, Math.max(0, result.steps.length - 1))];
  const visitedNow = step?.visited ?? new Set<string>();
  const queueNow = step?.queue ?? [];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="text-xs font-semibold" style={{ color: '#0F172A' }}>
          BFS Source Connectivity
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: '#64748B' }}>
          Level-order breadth-first reachability analysis
        </div>
      </div>

      {/* Start Node Selector */}
      <div className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <label className="section-label block" htmlFor="bfs-source-select">
          Start Node
        </label>
        <select
          id="bfs-source-select"
          className="input"
          value={source}
          onChange={e => setSource(e.target.value)}
          disabled={nodes.length === 0}
        >
          {nodes.length === 0 && <option value="">No nodes available</option>}
          {nodes.map(n => (
            <option key={n.id} value={n.id}>
              {n.label} ({n.type})
            </option>
          ))}
        </select>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-2 px-3.5 py-3">
        <div className="metric">
          <div className="metric-label">Reachable</div>
          <div
            className="metric-value"
            style={{
              color:
                result.total > 0 && result.reached === result.total
                  ? '#0D9488'
                  : '#DC2626',
            }}
          >
            {result.reached}/{result.total}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Start Node</div>
          <div className="metric-value" style={{ color: '#2563EB' }}>
            {source ? lbl(source) : '—'}
          </div>
        </div>
      </div>

      {/* Traversal Order */}
      <div className="px-3.5 pb-2.5">
        <div className="section-label">BFS Order</div>
        <div className="flex flex-wrap gap-1">
          {result.order.map((id, i) => (
            <span
              key={id}
              className={`chip ${visitedNow.has(id) ? 'chip-teal' : 'chip-idle'}`}
            >
              {i > 0 && <span className="mr-1 opacity-50">-</span>}
              {lbl(id)}
            </span>
          ))}
          {result.order.length === 0 && (
            <span className="text-[11px]" style={{ color: '#94A3B8' }}>
              —
            </span>
          )}
        </div>
      </div>

      {/* Live FIFO Queue */}
      <div className="px-3.5 pb-2.5">
        <div className="section-label">Active Queue (FIFO)</div>
        <div
          className="flex flex-wrap items-center gap-1 min-h-[28px] p-1.5 rounded-md"
          style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
        >
          {queueNow.length === 0 ? (
            <span className="text-[11px] px-1" style={{ color: '#94A3B8' }}>
              Queue empty
            </span>
          ) : (
            queueNow.map(id => (
              <span key={id} className="chip chip-blue">
                {lbl(id)}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Disconnected Nodes Callout */}
      {result.disconnected.length > 0 && (
        <div
          className="mx-3.5 mb-2.5 px-2.5 py-1.5 rounded-md text-[11px]"
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
          }}
        >
          Unreachable: {result.disconnected.map(lbl).join(', ')}
        </div>
      )}

      {/* Step Trace Log */}
      <div className="flex-1 overflow-y-auto px-3.5 pb-3">
        <div className="section-label">Step Trace</div>
        <div className="flex flex-col">
          {result.steps.slice(0, stepIndex + 1).map((s, i) => (
            <div
              key={i}
              className={`log-entry ${i === stepIndex ? 'active' : ''}`}
            >
              <span style={{ color: '#94A3B8', marginRight: '6px' }}>{s.step}.</span>
              {s.msg}
            </div>
          ))}
        </div>
      </div>

      <PlaybackStrip
        stepIndex={stepIndex}
        setStepIndex={setStepIndex}
        maxStep={maxStep}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        speed={speed}
        setSpeed={setSpeed}
        currentMsg={step?.msg}
      />
    </div>
  );
}
