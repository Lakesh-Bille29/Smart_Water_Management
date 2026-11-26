import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { WaterNode, WaterPipe, NodeType, BFSResult, DFSResult, KruskalResult } from './engine/graphEngine';
import {
  DEFAULT_NODES,
  DEFAULT_PIPES,
  nextLabel,
  runBFS,
  runDFS,
  runKruskal,
} from './engine/graphEngine';
import TopBar from './components/TopBar';
import LeftToolbar from './components/LeftToolbar';
import Network3DScene from './components/Network3DScene';
import InspectorPanel from './components/InspectorPanel';
import InlinePipeModal from './components/InlinePipeModal';

export type ActiveTab = 'EDIT' | 'BFS' | 'DFS' | 'MST';
export type EditorMode = 'select' | 'addNode' | 'connect' | 'delete';

let pipeCounter = 100;
function newPipeId() {
  return `p${pipeCounter++}`;
}

function cloneNodes(ns: WaterNode[]): WaterNode[] {
  return ns.map(n => ({ ...n }));
}

function clonePipes(ps: WaterPipe[]): WaterPipe[] {
  return ps.map(p => ({ ...p }));
}

export default function App() {
  /* ── Graph State ──────────────────────────────────────── */
  const [nodes, setNodes] = useState<WaterNode[]>(() => cloneNodes(DEFAULT_NODES));
  const [pipes, setPipes] = useState<WaterPipe[]>(() => clonePipes(DEFAULT_PIPES));
  const [sourceId, setSourceId] = useState<string>('A');

  /* ── Navigation & Tool State ──────────────────────────── */
  const [activeTab, setActiveTab] = useState<ActiveTab>('MST');
  const [editorMode, setEditorMode] = useState<EditorMode>('select');
  const [drawerOpen, setDrawerOpen] = useState(true);

  /* ── Selection & Connect-Pipe State ───────────────────── */
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedPipeId, setSelectedPipeId] = useState<string | null>(null);
  const [connectFirst, setConnectFirst] = useState<string | null>(null);
  const [pendingPipePair, setPendingPipePair] = useState<[string, string] | null>(null);

  /* ── Playback State ───────────────────────────────────── */
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Camera Reset Trigger ─────────────────────────────── */
  const [cameraResetTick, setCameraResetTick] = useState(0);

  /* ── BFS & DFS Start Nodes ────────────────────────────── */
  const [bfsSource, setBfsSource] = useState<string>('A');
  const [dfsSource, setDfsSource] = useState<string>('A');

  /* ── Live Algorithm Execution ─────────────────────────── */
  const bfsResult: BFSResult = useMemo(
    () => runBFS(nodes, pipes, bfsSource),
    [nodes, pipes, bfsSource]
  );
  const dfsResult: DFSResult = useMemo(
    () => runDFS(nodes, pipes, dfsSource),
    [nodes, pipes, dfsSource]
  );
  const kruskalResult: KruskalResult = useMemo(
    () => runKruskal(nodes, pipes),
    [nodes, pipes]
  );

  /* ── Reset playback whenever graph or active algorithm changes ── */
  const graphSignature = useMemo(
    () =>
      nodes.map(n => `${n.id}:${n.label}:${n.type}`).join(',') +
      '|' +
      pipes.map(p => `${p.id}:${p.weight}`).join(','),
    [nodes, pipes]
  );

  useEffect(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, [activeTab, graphSignature, bfsSource, dfsSource]);

  const maxStep = useMemo(() => {
    if (activeTab === 'BFS') return Math.max(0, bfsResult.steps.length - 1);
    if (activeTab === 'DFS') return Math.max(0, dfsResult.steps.length - 1);
    if (activeTab === 'MST') return Math.max(0, kruskalResult.steps.length - 1);
    return 0;
  }, [activeTab, bfsResult.steps.length, dfsResult.steps.length, kruskalResult.steps.length]);

  useEffect(() => {
    if (playTimerRef.current) clearInterval(playTimerRef.current);
    if (isPlaying && maxStep > 0) {
      playTimerRef.current = setInterval(() => {
        setStepIndex(prev => {
          if (prev >= maxStep) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, Math.round(900 / speed));
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, speed, maxStep]);

  /* ── Graph CRUD Handlers ──────────────────────────────── */
  const handleAddNode = useCallback(
    (opts?: { x?: number; z?: number; label?: string; type?: NodeType; elevation?: number }): string | null => {
      const existingLabels = nodes.map(n => n.label.toUpperCase());
      const proposed = (opts?.label?.trim() || nextLabel(nodes.map(n => n.id))).toUpperCase();
      if (!proposed) return 'Node name cannot be empty.';
      if (existingLabels.includes(proposed) || nodes.some(n => n.id === proposed)) {
        return `Node "${proposed}" already exists.`;
      }

      const newNode: WaterNode = {
        id: proposed,
        label: proposed,
        type: opts?.type ?? 'junction',
        x: opts?.x ?? Math.round((Math.random() * 10 - 5) * 10) / 10,
        y: 0,
        z: opts?.z ?? Math.round((Math.random() * 7 - 3.5) * 10) / 10,
        elevation: opts?.elevation ?? 100,
      };

      setNodes(prev => {
        const next = [...prev, newNode];
        if (prev.length === 0) {
          setSourceId(newNode.id);
          setBfsSource(newNode.id);
          setDfsSource(newNode.id);
        }
        return next;
      });
      setSelectedNodeId(newNode.id);
      setSelectedPipeId(null);
      return null;
    },
    [nodes]
  );

  const handleDeleteNode = useCallback(
    (id: string) => {
      const remaining = nodes.filter(n => n.id !== id);
      const fallbackId = remaining[0]?.id ?? '';
      setNodes(remaining);
      setPipes(prev => prev.filter(p => p.source !== id && p.target !== id));
      if (sourceId === id) setSourceId(fallbackId);
      if (bfsSource === id) setBfsSource(fallbackId);
      if (dfsSource === id) setDfsSource(fallbackId);
      if (selectedNodeId === id) setSelectedNodeId(null);
      if (connectFirst === id) setConnectFirst(null);
      setPendingPipePair(null);
    },
    [nodes, sourceId, bfsSource, dfsSource, selectedNodeId, connectFirst]
  );

  const handleUpdateNode = useCallback((id: string, patch: Partial<WaterNode>) => {
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const handleAddPipe = useCallback(
    (src: string, tgt: string, weight: number): string | null => {
      if (src === tgt) return 'Self-loops are not allowed.';
      if (!Number.isFinite(weight) || weight <= 0) return 'Weight must be a positive integer.';
      const dup = pipes.find(
        p =>
          (p.source === src && p.target === tgt) ||
          (p.source === tgt && p.target === src)
      );
      if (dup) return 'A pipe already exists between these nodes.';
      const created: WaterPipe = { id: newPipeId(), source: src, target: tgt, weight };
      setPipes(prev => [...prev, created]);
      setSelectedPipeId(created.id);
      setSelectedNodeId(null);
      return null;
    },
    [pipes]
  );

  const handleDeletePipe = useCallback(
    (id: string) => {
      setPipes(prev => prev.filter(p => p.id !== id));
      if (selectedPipeId === id) setSelectedPipeId(null);
    },
    [selectedPipeId]
  );

  const handleUpdatePipeWeight = useCallback((id: string, weight: number) => {
    if (!Number.isFinite(weight) || weight <= 0) return;
    setPipes(prev => prev.map(p => (p.id === id ? { ...p, weight } : p)));
  }, []);

  const handleLoadDefault = useCallback(() => {
    setNodes(cloneNodes(DEFAULT_NODES));
    setPipes(clonePipes(DEFAULT_PIPES));
    setSourceId('A');
    setBfsSource('A');
    setDfsSource('A');
    setSelectedNodeId(null);
    setSelectedPipeId(null);
    setConnectFirst(null);
    setPendingPipePair(null);
    setStepIndex(0);
    setIsPlaying(false);
  }, []);

  const handleClearCanvas = useCallback(() => {
    setNodes([]);
    setPipes([]);
    setSourceId('');
    setBfsSource('');
    setDfsSource('');
    setSelectedNodeId(null);
    setSelectedPipeId(null);
    setConnectFirst(null);
    setPendingPipePair(null);
    setStepIndex(0);
    setIsPlaying(false);
  }, []);

  /* ── Keyboard Shortcuts (Delete / V / N / P / Esc) ────── */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) handleDeleteNode(selectedNodeId);
        else if (selectedPipeId) handleDeletePipe(selectedPipeId);
      } else if (e.key === 'Escape') {
        setEditorMode('select');
        setConnectFirst(null);
        setPendingPipePair(null);
      } else if (e.key.toLowerCase() === 'v') {
        setEditorMode('select');
      } else if (e.key.toLowerCase() === 'n') {
        setEditorMode('addNode');
      } else if (e.key.toLowerCase() === 'p') {
        setEditorMode('connect');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedNodeId, selectedPipeId, handleDeleteNode, handleDeletePipe]);

  /* ── 3D Canvas Interaction Handlers ───────────────────── */
  const handleNodeClick = useCallback(
    (id: string) => {
      if (editorMode === 'delete') {
        handleDeleteNode(id);
        return;
      }
      if (editorMode === 'connect') {
        if (!connectFirst) {
          setConnectFirst(id);
          setSelectedNodeId(id);
        } else if (connectFirst !== id) {
          setPendingPipePair([connectFirst, id]);
          setConnectFirst(null);
        } else {
          setConnectFirst(null);
        }
        return;
      }
      setSelectedNodeId(prev => (prev === id ? null : id));
      setSelectedPipeId(null);
      if (activeTab !== 'EDIT') {
        setActiveTab('EDIT');
        setDrawerOpen(true);
      }
    },
    [editorMode, connectFirst, activeTab, handleDeleteNode]
  );

  const handlePipeClick = useCallback(
    (id: string) => {
      if (editorMode === 'delete') {
        handleDeletePipe(id);
        return;
      }
      if (editorMode === 'connect') return;
      setSelectedPipeId(prev => (prev === id ? null : id));
      setSelectedNodeId(null);
      if (activeTab !== 'EDIT') {
        setActiveTab('EDIT');
        setDrawerOpen(true);
      }
    },
    [editorMode, activeTab, handleDeletePipe]
  );

  const handleGroundClick = useCallback(
    (x: number, z: number) => {
      if (editorMode === 'addNode') {
        handleAddNode({ x, z });
      }
    },
    [editorMode, handleAddNode]
  );

  /* ── Export JSON Report ───────────────────────────────── */
  const handleExport = useCallback(() => {
    const labelOf = new Map(nodes.map(n => [n.id, n.label]));
    const adj: Record<string, Array<{ to: string; weight: number; pipeId: string }>> = {};
    for (const n of nodes) adj[n.label] = [];
    for (const p of pipes) {
      adj[labelOf.get(p.source) ?? p.source]?.push({
        to: labelOf.get(p.target) ?? p.target,
        weight: p.weight,
        pipeId: p.id,
      });
      adj[labelOf.get(p.target) ?? p.target]?.push({
        to: labelOf.get(p.source) ?? p.source,
        weight: p.weight,
        pipeId: p.id,
      });
    }
    const payload = {
      generatedAt: new Date().toISOString(),
      nodes: nodes.map(n => ({ id: n.id, label: n.label, type: n.type, elevation: n.elevation })),
      adjacencyList: adj,
      bfs: {
        source: labelOf.get(bfsSource) ?? bfsSource,
        order: bfsResult.order.map(id => labelOf.get(id) ?? id),
        reachable: `${bfsResult.reached}/${bfsResult.total}`,
        disconnected: bfsResult.disconnected.map(id => labelOf.get(id) ?? id),
      },
      dfs: {
        source: labelOf.get(dfsSource) ?? dfsSource,
        order: dfsResult.order.map(id => labelOf.get(id) ?? id),
        visited: `${dfsResult.visited}/${dfsResult.total}`,
        unvisited: dfsResult.unvisited.map(id => labelOf.get(id) ?? id),
      },
      kruskalMST: {
        mstPipes: kruskalResult.mstPipes.map(
          p => `${labelOf.get(p.source) ?? p.source}-${labelOf.get(p.target) ?? p.target} (${p.weight})`
        ),
        totalCost: kruskalResult.totalCost,
        connected: kruskalResult.connected,
        components: kruskalResult.components,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hydronet-report.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, pipes, bfsSource, dfsSource, bfsResult, dfsResult, kruskalResult]);

  const changeMode = (m: EditorMode) => {
    setEditorMode(m);
    setConnectFirst(null);
    setPendingPipePair(null);
  };

  const pendingSrcLabel = pendingPipePair
    ? nodes.find(n => n.id === pendingPipePair[0])?.label ?? pendingPipePair[0]
    : '';
  const pendingTgtLabel = pendingPipePair
    ? nodes.find(n => n.id === pendingPipePair[1])?.label ?? pendingPipePair[1]
    : '';

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#F4F6F8' }}>
      <TopBar
        activeTab={activeTab}
        setActiveTab={tab => {
          setActiveTab(tab);
          setIsPlaying(false);
        }}
        isPlaying={isPlaying}
        onTogglePlay={() => {
          if (stepIndex >= maxStep) setStepIndex(0);
          setIsPlaying(p => !p);
        }}
        onStepForward={() => {
          setIsPlaying(false);
          setStepIndex(i => Math.min(maxStep, i + 1));
        }}
        onResetPlayback={() => {
          setIsPlaying(false);
          setStepIndex(0);
        }}
        canStep={maxStep > 0}
        stepIndex={stepIndex}
        maxStep={maxStep}
        drawerOpen={drawerOpen}
        setDrawerOpen={setDrawerOpen}
        onExport={handleExport}
      />

      <main className="flex-1 relative overflow-hidden">
        <LeftToolbar
          editorMode={editorMode}
          setEditorMode={changeMode}
          hasSelection={Boolean(selectedNodeId || selectedPipeId)}
          onDeleteSelected={() => {
            if (selectedNodeId) handleDeleteNode(selectedNodeId);
            else if (selectedPipeId) handleDeletePipe(selectedPipeId);
          }}
          onResetCamera={() => setCameraResetTick(t => t + 1)}
          onLoadDefault={handleLoadDefault}
        />

        {pendingPipePair && (
          <InlinePipeModal
            sourceLabel={pendingSrcLabel}
            targetLabel={pendingTgtLabel}
            onConfirm={weight => {
              const err = handleAddPipe(pendingPipePair[0], pendingPipePair[1], weight);
              if (!err) setPendingPipePair(null);
              return err;
            }}
            onCancel={() => setPendingPipePair(null)}
          />
        )}

        <Network3DScene
          nodes={nodes}
          pipes={pipes}
          sourceId={sourceId}
          editorMode={editorMode}
          selectedNodeId={selectedNodeId}
          selectedPipeId={selectedPipeId}
          connectFirst={connectFirst}
          activeTab={activeTab}
          bfsResult={bfsResult}
          dfsResult={dfsResult}
          kruskalResult={kruskalResult}
          stepIndex={stepIndex}
          cameraResetTick={cameraResetTick}
          onNodeClick={handleNodeClick}
          onPipeClick={handlePipeClick}
          onGroundClick={handleGroundClick}
        />

        <InspectorPanel
          open={drawerOpen}
          activeTab={activeTab}
          nodes={nodes}
          pipes={pipes}
          sourceId={sourceId}
          bfsSource={bfsSource}
          dfsSource={dfsSource}
          setBfsSource={setBfsSource}
          setDfsSource={setDfsSource}
          selectedNodeId={selectedNodeId}
          selectedPipeId={selectedPipeId}
          bfsResult={bfsResult}
          dfsResult={dfsResult}
          kruskalResult={kruskalResult}
          stepIndex={stepIndex}
          setStepIndex={setStepIndex}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          speed={speed}
          setSpeed={setSpeed}
          maxStep={maxStep}
          onAddNode={opts => handleAddNode(opts)}
          onDeleteNode={handleDeleteNode}
          onUpdateNode={handleUpdateNode}
          onAddPipe={handleAddPipe}
          onDeletePipe={handleDeletePipe}
          onUpdatePipeWeight={handleUpdatePipeWeight}
          onSetSource={setSourceId}
          onLoadDefault={handleLoadDefault}
          onClearCanvas={handleClearCanvas}
        />
      </main>

      <footer
        className="shrink-0 text-center px-4 py-1.5"
        style={{
          fontSize: '11px',
          color: '#64748B',
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
        }}
      >
        Prototype optimizes graph connectivity and edge weights only; hydraulic pressure, flow rate, water demand, and pipe capacity are not simulated.
      </footer>
    </div>
  );
}
