import { Play, Pause, SkipBack, SkipForward, RotateCcw, FastForward } from 'lucide-react';

interface Props {
  stepIndex: number;
  setStepIndex: (i: number) => void;
  maxStep: number;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  speed: number;
  setSpeed: (v: number) => void;
  currentMsg?: string;
}

const SPEEDS = [0.5, 1, 2, 4];

export default function PlaybackStrip({
  stepIndex,
  setStepIndex,
  maxStep,
  isPlaying,
  setIsPlaying,
  speed,
  setSpeed,
  currentMsg,
}: Props) {
  return (
    <div
      className="shrink-0 p-3"
      style={{
        background: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
      }}
    >
      {/* Controls & Speed */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1">
          <button
            className="btn btn-ghost px-1.5 py-1"
            onClick={() => {
              setStepIndex(0);
              setIsPlaying(false);
            }}
            title="Reset to step 0"
          >
            <RotateCcw size={13} />
          </button>
          <button
            className="btn btn-ghost px-1.5 py-1"
            onClick={() => setStepIndex(Math.max(0, stepIndex - 1))}
            disabled={stepIndex <= 0}
            title="Step back"
          >
            <SkipBack size={13} />
          </button>
          <button
            className={`btn px-2.5 py-1 ${isPlaying ? 'btn-active' : 'btn-primary'}`}
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={maxStep === 0}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            <span>{isPlaying ? 'Pause' : 'Run'}</span>
          </button>
          <button
            className="btn btn-ghost px-1.5 py-1"
            onClick={() => setStepIndex(Math.min(maxStep, stepIndex + 1))}
            disabled={stepIndex >= maxStep}
            title="Step forward"
          >
            <SkipForward size={13} />
          </button>
          <button
            className="btn btn-ghost px-1.5 py-1"
            onClick={() => {
              setStepIndex(maxStep);
              setIsPlaying(false);
            }}
            disabled={stepIndex >= maxStep}
            title="Jump to final step"
          >
            <FastForward size={13} />
          </button>
        </div>

        <div
          className="flex items-center rounded border p-0.5"
          style={{ background: '#FFFFFF', borderColor: '#E2E8F0' }}
        >
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className="mono px-1.5 py-0.5 rounded text-[10px] cursor-pointer border-0"
              style={{
                background: speed === s ? '#EFF6FF' : 'transparent',
                color: speed === s ? '#2563EB' : '#64748B',
                fontWeight: speed === s ? 600 : 400,
              }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Scrub slider */}
      <input
        type="range"
        min={0}
        max={maxStep}
        value={stepIndex}
        onChange={e => {
          setStepIndex(Number(e.target.value));
          setIsPlaying(false);
        }}
        style={{ width: '100%', accentColor: '#2563EB', cursor: 'pointer' }}
      />

      {/* Live step message */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="mono text-[10px] shrink-0" style={{ color: '#64748B' }}>
          Step {stepIndex}/{maxStep}
        </span>
        {currentMsg && (
          <span
            className="mono text-[10px] truncate"
            style={{ color: '#0F172A' }}
            title={currentMsg}
          >
            {currentMsg}
          </span>
        )}
      </div>
    </div>
  );
}
