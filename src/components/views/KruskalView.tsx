import type { WaterNode, KruskalResult } from '../../engine/graphEngine';
import PlaybackStrip from './PlaybackStrip';

interface Props {
  nodes: WaterNode[];
  result: KruskalResult;
  stepIndex: number;
  setStepIndex: (i: number) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  speed: number;
  setSpeed: (v: number) => void;
  maxStep: number;
}

export default function KruskalView({
  nodes,
  result,
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
  const acceptedNow = new Set(step?.accepted ?? []);
  const rejectedNow = new Set(step?.rejected ?? []);
  const costNow = step?.cost ?? 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-3.5 py-2.5" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="text-xs font-semibold" style={{ color: '#0F172A' }}>
          Kruskal Minimum Spanning Tree
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: '#64748B' }}>
          Disjoint-Set Union sorted ascending by pipe cost
        </div>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-2 px-3.5 py-3">
        <div className="metric">
          <div className="metric-label">MST Cost</div>
          <div className="metric-value" style={{ color: '#D97706' }}>
            {costNow}
          </div>
          <div className="mono text-[10px]" style={{ color: '#94A3B8' }}>
            final: {result.totalCost}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Pipes</div>
          <div className="metric-value">
            {acceptedNow.size}/{result.targetEdges}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Topology</div>
          <div
            className="metric-value"
            style={{
              fontSize: '12px',
              marginTop: '3px',
              color: result.connected ? '#0D9488' : '#DC2626',
            }}
          >
            {nodes.length === 0
              ? 'Empty'
              : result.connected
                ? 'Connected'
                : `${result.components} Comp.`}
          </div>
        </div>
      </div>

      {!result.connected && nodes.length > 0 && (
        <div
          className="mx-3.5 mb-2.5 px-2.5 py-1.5 rounded-md text-[11px]"
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#DC2626',
          }}
        >
          Disconnected network: spanning forest across {result.components} components (total cost {result.totalCost}).
        </div>
      )}

      {/* Selected MST Pipe Chips */}
      <div className="px-3.5 pb-2.5">
        <div className="section-label">Selected MST Pipes</div>
        <div className="flex flex-wrap gap-1">
          {result.mstPipes
            .filter(p => acceptedNow.has(p.id))
            .map(p => (
              <span key={p.id} className="chip chip-amber">
                {lbl(p.source)}–{lbl(p.target)} ({p.weight})
              </span>
            ))}
          {acceptedNow.size === 0 && (
            <span className="text-[11px]" style={{ color: '#94A3B8' }}>
              Step or run algorithm to select pipes
            </span>
          )}
        </div>
      </div>

      {/* Sorted Edge Decision Table */}
      <div className="flex-1 overflow-y-auto px-3.5 pb-3">
        <div className="section-label">Sorted Edge Decisions</div>
        {result.decisions.length === 0 ? (
          <div className="text-[11px]" style={{ color: '#94A3B8' }}>
            No candidate pipes in graph.
          </div>
        ) : (
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr style={{ color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>
                <th className="text-left py-1 font-medium">#</th>
                <th className="text-left py-1 font-medium">Pipe</th>
                <th className="text-left py-1 font-medium">Weight</th>
                <th className="text-right py-1 font-medium">Decision</th>
              </tr>
            </thead>
            <tbody>
              {result.decisions.map((d, i) => {
                const isAccepted = acceptedNow.has(d.pipe.id);
                const isRejected = rejectedNow.has(d.pipe.id);
                const isEval = step?.kind === 'eval' && step.edge?.id === d.pipe.id;
                return (
                  <tr
                    key={d.pipe.id}
                    title={d.reason}
                    style={{
                      background: isEval ? '#EFF6FF' : 'transparent',
                      borderBottom: '1px solid #F1F5F9',
                    }}
                  >
                    <td className="py-1.5 mono" style={{ color: '#94A3B8' }}>
                      {i + 1}
                    </td>
                    <td className="py-1.5 mono font-medium" style={{ color: '#0F172A' }}>
                      {lbl(d.pipe.source)}–{lbl(d.pipe.target)}
                    </td>
                    <td className="py-1.5 mono" style={{ color: '#475569' }}>
                      {d.pipe.weight}
                    </td>
                    <td className="py-1.5 text-right">
                      {isAccepted ? (
                        <span className="chip chip-amber">Accept</span>
                      ) : isRejected ? (
                        <span className="chip chip-red">Cycle</span>
                      ) : isEval ? (
                        <span className="chip chip-blue">Check</span>
                      ) : (
                        <span className="chip chip-idle">Queued</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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
