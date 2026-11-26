import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  Download,
} from 'lucide-react';
import type { ActiveTab } from '../App';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStepForward: () => void;
  onResetPlayback: () => void;
  canStep: boolean;
  stepIndex: number;
  maxStep: number;
  drawerOpen: boolean;
  setDrawerOpen: (v: boolean) => void;
  onExport: () => void;
}

const TABS: { id: ActiveTab; label: string }[] = [
  { id: 'EDIT', label: 'Editor' },
  { id: 'BFS', label: 'BFS' },
  { id: 'DFS', label: 'DFS' },
  { id: 'MST', label: 'Kruskal MST' },
];

export default function TopBar({
  activeTab,
  setActiveTab,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onResetPlayback,
  canStep,
  stepIndex,
  maxStep,
  drawerOpen,
  setDrawerOpen,
  onExport,
}: Props) {
  const isAlgoTab = activeTab !== 'EDIT';

  return (
    <header
      className="shrink-0 flex items-center justify-between px-4 select-none"
      style={{
        height: '52px',
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        zIndex: 20,
      }}
    >
      {/* Left: App Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        >
          <rect width="24" height="24" rx="5" fill="#EFF6FF" stroke="#BFDBFE" />
          <circle cx="12" cy="7.5" r="2.5" fill="#2563EB" />
          <circle cx="7" cy="16.5" r="2.2" fill="#0D9488" />
          <circle cx="17" cy="16.5" r="2.2" fill="#D97706" />
          <path d="M12 10V13M12 13L8.5 15.2M12 13L15.5 15.2" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div className="flex items-baseline gap-2 truncate">
          <span
            className="font-semibold tracking-tight"
            style={{ fontSize: '14px', color: '#0F172A' }}
          >
            HydroNet
          </span>
          <span
            className="hidden sm:inline"
            style={{ fontSize: '12px', color: '#64748B' }}
          >
            Water Distribution Optimizer
          </span>
        </div>
      </div>

      {/* Center: Algorithm Selector Tabs */}
      <nav
        className="flex items-center h-full gap-1"
        aria-label="Workspace modes"
      >
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`algo-tab ${activeTab === t.id ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Right: Run / Step / Reset + Export + Inspector Toggle */}
      <div className="flex items-center gap-1.5">
        {isAlgoTab ? (
          <>
            <span
              className="mono hidden md:inline mr-1"
              style={{ fontSize: '11px', color: '#64748B' }}
            >
              {stepIndex}/{maxStep}
            </span>
            <button
              onClick={onTogglePlay}
              disabled={!canStep}
              className={`btn ${isPlaying ? 'btn-active' : 'btn-primary'}`}
              title={isPlaying ? 'Pause simulation' : 'Run simulation'}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'Pause' : 'Run'}</span>
            </button>
            <button
              onClick={onStepForward}
              disabled={!canStep || stepIndex >= maxStep}
              className="btn"
              title="Step forward"
              style={{ opacity: !canStep || stepIndex >= maxStep ? 0.45 : 1 }}
            >
              <SkipForward size={13} />
              <span>Step</span>
            </button>
            <button
              onClick={onResetPlayback}
              disabled={stepIndex === 0 && !isPlaying}
              className="btn"
              title="Reset playback"
              style={{ opacity: stepIndex === 0 && !isPlaying ? 0.45 : 1 }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </>
        ) : (
          <span
            className="hidden md:inline px-2 py-1 rounded text-xs"
            style={{ color: '#64748B', background: '#F8FAFC', border: '1px solid #E2E8F0' }}
          >
            Edit Mode
          </span>
        )}

        <div style={{ width: '1px', height: '20px', background: '#E2E8F0', margin: '0 4px' }} />

        <button
          onClick={onExport}
          className="btn btn-ghost"
          title="Export network report (JSON)"
        >
          <Download size={13} />
          <span className="hidden lg:inline">Export</span>
        </button>

        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="btn btn-ghost"
          title={drawerOpen ? 'Hide Inspector' : 'Show Inspector'}
        >
          {drawerOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
        </button>
      </div>
    </header>
  );
}
