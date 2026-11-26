import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Trash2, RotateCcw, Plus, Link2 } from 'lucide-react';
import type { WaterNode, WaterPipe, NodeType } from '../../engine/graphEngine';
import { nextLabel } from '../../engine/graphEngine';

interface Props {
  nodes: WaterNode[];
  pipes: WaterPipe[];
  sourceId: string;
  selectedNodeId: string | null;
  selectedPipeId: string | null;
  onAddNode: (opts?: { label?: string; type?: NodeType; elevation?: number }) => string | null;
  onDeleteNode: (id: string) => void;
  onUpdateNode: (id: string, patch: Partial<WaterNode>) => void;
  onAddPipe: (src: string, tgt: string, weight: number) => string | null;
  onDeletePipe: (id: string) => void;
  onUpdatePipeWeight: (id: string, weight: number) => void;
  onSetSource: (id: string) => void;
  onLoadDefault: () => void;
  onClearCanvas: () => void;
}

export default function EditorView({
  nodes,
  pipes,
  sourceId,
  selectedNodeId,
  selectedPipeId,
  onAddNode,
  onDeleteNode,
  onUpdateNode,
  onAddPipe,
  onDeletePipe,
  onUpdatePipeWeight,
  onSetSource,
  onLoadDefault,
  onClearCanvas,
}: Props) {
  const autoLabel = nextLabel(nodes.map(n => n.label));
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<NodeType>('junction');
  const [newElev, setNewElev] = useState('100');
  const [nodeErr, setNodeErr] = useState<string | null>(null);

  const [pipeSrc, setPipeSrc] = useState('');
  const [pipeTgt, setPipeTgt] = useState('');
  const [pipeWeight, setPipeWeight] = useState('3');
  const [pipeErr, setPipeErr] = useState<string | null>(null);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) ?? null;
  const selectedPipe = pipes.find(p => p.id === selectedPipeId) ?? null;

  const [editNodeLabel, setEditNodeLabel] = useState('');
  const [editPipeWeight, setEditPipeWeight] = useState('');

  useEffect(() => {
    if (selectedNode) setEditNodeLabel(selectedNode.label);
  }, [selectedNode]);

  useEffect(() => {
    if (selectedPipe) setEditPipeWeight(String(selectedPipe.weight));
  }, [selectedPipe]);

  const labelMap = new Map(nodes.map(n => [n.id, n.label]));
  const lbl = (id: string) => labelMap.get(id) ?? id;

  function submitAddNode(e: FormEvent) {
    e.preventDefault();
    const err = onAddNode({
      label: newLabel.trim() || autoLabel,
      type: newType,
      elevation: parseInt(newElev, 10) || 100,
    });
    if (err) {
      setNodeErr(err);
    } else {
      setNodeErr(null);
      setNewLabel('');
    }
  }

  function submitAddPipe(e: FormEvent) {
    e.preventDefault();
    const src = pipeSrc || nodes[0]?.id;
    const tgt = pipeTgt || nodes[1]?.id;
    const w = parseInt(pipeWeight, 10);
    if (!src || !tgt) {
      setPipeErr('Select two nodes.');
      return;
    }
    const err = onAddPipe(src, tgt, w);
    if (err) {
      setPipeErr(err);
    } else {
      setPipeErr(null);
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-3.5 py-2.5 shrink-0" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="text-xs font-semibold" style={{ color: '#0F172A' }}>
          Network Construction
        </div>
        <div className="text-[11px] mt-0.5 mono" style={{ color: '#64748B' }}>
          {nodes.length} nodes · {pipes.length} pipes
        </div>
      </div>

      {/* Selected Node Properties */}
      {selectedNode && (
        <section className="px-3.5 py-3" style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="section-label mb-0">Selected Node</span>
            <span className="chip chip-blue">{selectedNode.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[10px] block mb-1" style={{ color: '#64748B' }}>
                Name
              </label>
              <input
                className="input mono"
                value={editNodeLabel}
                maxLength={8}
                onChange={e => setEditNodeLabel(e.target.value)}
                onBlur={() => {
                  const trimmed = editNodeLabel.trim();
                  if (trimmed) onUpdateNode(selectedNode.id, { label: trimmed });
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const trimmed = editNodeLabel.trim();
                    if (trimmed) onUpdateNode(selectedNode.id, { label: trimmed });
                  }
                }}
              />
            </div>
            <div>
              <label className="text-[10px] block mb-1" style={{ color: '#64748B' }}>
                Type
              </label>
              <select
                className="input"
                value={selectedNode.type}
                onChange={e => onUpdateNode(selectedNode.id, { type: e.target.value as NodeType })}
              >
                <option value="source">Source</option>
                <option value="tank">Tank</option>
                <option value="junction">Junction</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <label className="text-[10px] shrink-0" style={{ color: '#64748B' }}>
              Elevation (m)
            </label>
            <input
              type="number"
              className="input mono"
              value={selectedNode.elevation}
              onChange={e => onUpdateNode(selectedNode.id, { elevation: Number(e.target.value) })}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button
              className="btn flex-1"
              onClick={() => onSetSource(selectedNode.id)}
              disabled={sourceId === selectedNode.id}
            >
              {sourceId === selectedNode.id ? 'Primary Source' : 'Set as Source'}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => onDeleteNode(selectedNode.id)}
              title="Delete Node (Del)"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </section>
      )}

      {/* Selected Pipe Properties */}
      {selectedPipe && (
        <section className="px-3.5 py-3" style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="section-label mb-0">Selected Pipe</span>
            <span className="chip chip-blue">
              {lbl(selectedPipe.source)}–{lbl(selectedPipe.target)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              step={1}
              className="input mono"
              value={editPipeWeight}
              onChange={e => setEditPipeWeight(e.target.value)}
            />
            <button
              className="btn"
              onClick={() => {
                const w = parseInt(editPipeWeight, 10);
                if (w > 0) onUpdatePipeWeight(selectedPipe.id, w);
              }}
            >
              Save
            </button>
            <button
              className="btn btn-danger"
              onClick={() => onDeletePipe(selectedPipe.id)}
              title="Delete Pipe (Del)"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </section>
      )}

      {/* Quick Add Node Form */}
      <section className="px-3.5 py-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="section-label">Add Node</div>
        <form onSubmit={submitAddNode} className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              className="input mono"
              value={newLabel}
              onChange={e => {
                setNewLabel(e.target.value.toUpperCase());
                setNodeErr(null);
              }}
              placeholder={`Name (${autoLabel})`}
              maxLength={8}
            />
            <select
              className="input"
              value={newType}
              onChange={e => setNewType(e.target.value as NodeType)}
            >
              <option value="junction">Junction</option>
              <option value="tank">Tank</option>
              <option value="source">Source</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="input mono"
              value={newElev}
              onChange={e => setNewElev(e.target.value)}
              placeholder="Elev (m)"
            />
            <button type="submit" className="btn btn-primary shrink-0">
              <Plus size={13} />
              <span>Add Node</span>
            </button>
          </div>
          {nodeErr && <div className="text-[11px]" style={{ color: '#DC2626' }}>{nodeErr}</div>}
        </form>
      </section>

      {/* Quick Add Pipe Form */}
      <section className="px-3.5 py-3" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <div className="section-label">Connect Pipe</div>
        <form onSubmit={submitAddPipe} className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              className="input"
              value={pipeSrc}
              onChange={e => {
                setPipeSrc(e.target.value);
                setPipeErr(null);
              }}
            >
              <option value="">From node</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={pipeTgt}
              onChange={e => {
                setPipeTgt(e.target.value);
                setPipeErr(null);
              }}
            >
              <option value="">To node</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              step={1}
              className="input mono"
              value={pipeWeight}
              onChange={e => {
                setPipeWeight(e.target.value);
                setPipeErr(null);
              }}
              placeholder="Weight"
            />
            <button type="submit" className="btn btn-primary shrink-0" disabled={nodes.length < 2}>
              <Link2 size={13} />
              <span>Connect</span>
            </button>
          </div>
          {pipeErr && <div className="text-[11px]" style={{ color: '#DC2626' }}>{pipeErr}</div>}
        </form>
      </section>

      {/* Live Adjacency List */}
      <section className="px-3.5 py-3 flex-1">
        <div className="section-label">Adjacency List</div>
        <div className="flex flex-col gap-1 mono text-[11px]">
          {nodes.map(n => {
            const nbrs = pipes
              .filter(p => p.source === n.id || p.target === n.id)
              .map(p => `${lbl(p.source === n.id ? p.target : p.source)}(${p.weight})`);
            return (
              <div
                key={n.id}
                className="flex items-baseline py-1"
                style={{ borderBottom: '1px solid #F1F5F9' }}
              >
                <span
                  className="font-semibold shrink-0 w-7"
                  style={{ color: n.id === sourceId ? '#2563EB' : '#0F172A' }}
                >
                  {n.label}
                </span>
                <span className="mx-1.5" style={{ color: '#94A3B8' }}>
                  :
                </span>
                <span style={{ color: '#64748B' }}>
                  {nbrs.length ? nbrs.join(', ') : 'isolated'}
                </span>
              </div>
            );
          })}
          {nodes.length === 0 && (
            <div style={{ color: '#94A3B8' }}>Canvas is empty.</div>
          )}
        </div>
      </section>

      {/* Dataset Reset / Clear */}
      <section
        className="px-3.5 py-3 shrink-0"
        style={{ borderTop: '1px solid #E2E8F0', background: '#F8FAFC' }}
      >
        <div className="flex items-center gap-2">
          <button className="btn flex-1" onClick={onLoadDefault}>
            <RotateCcw size={12} />
            <span>Reset Default (A–F)</span>
          </button>
          <button className="btn btn-danger" onClick={onClearCanvas}>
            Clear All
          </button>
        </div>
      </section>
    </div>
  );
}
