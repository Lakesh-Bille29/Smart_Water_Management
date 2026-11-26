import type { ReactNode } from 'react';
import {
  MousePointer2,
  PlusCircle,
  GitCommitHorizontal,
  Trash2,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import type { EditorMode } from '../App';

interface Props {
  editorMode: EditorMode;
  setEditorMode: (m: EditorMode) => void;
  hasSelection: boolean;
  onDeleteSelected: () => void;
  onResetCamera: () => void;
  onLoadDefault: () => void;
}

export default function LeftToolbar({
  editorMode,
  setEditorMode,
  hasSelection,
  onDeleteSelected,
  onResetCamera,
  onLoadDefault,
}: Props) {
  return (
    <div
      className="absolute left-3.5 top-3.5 flex flex-col gap-1.5 select-none"
      style={{ zIndex: 15 }}
    >
      {/* Primary interactive editing tools */}
      <div
        className="flex flex-col gap-1 p-1.5 rounded-lg"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
        }}
      >
        <ToolButton
          active={editorMode === 'select'}
          onClick={() => setEditorMode('select')}
          label="Select"
          shortcut="V"
          icon={<MousePointer2 size={15} />}
        />
        <ToolButton
          active={editorMode === 'addNode'}
          onClick={() => setEditorMode('addNode')}
          label="Add Node"
          shortcut="N"
          icon={<PlusCircle size={15} />}
        />
        <ToolButton
          active={editorMode === 'connect'}
          onClick={() => setEditorMode('connect')}
          label="Connect Pipe"
          shortcut="P"
          icon={<GitCommitHorizontal size={15} />}
        />

        <div style={{ height: '1px', background: '#E2E8F0', margin: '2px 0' }} />

        <ToolButton
          active={editorMode === 'delete'}
          danger={hasSelection || editorMode === 'delete'}
          onClick={() => {
            if (hasSelection) {
              onDeleteSelected();
            } else {
              setEditorMode(editorMode === 'delete' ? 'select' : 'delete');
            }
          }}
          label={hasSelection ? 'Delete Selected' : 'Delete Tool'}
          shortcut="Del"
          icon={<Trash2 size={15} />}
        />
      </div>

      {/* Viewport helpers */}
      <div
        className="flex flex-col gap-1 p-1.5 rounded-lg"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
        }}
      >
        <ToolButton
          active={false}
          onClick={onResetCamera}
          label="Reset Camera"
          icon={<Maximize2 size={14} />}
        />
        <ToolButton
          active={false}
          onClick={onLoadDefault}
          label="Reset Default (A–F)"
          icon={<RotateCcw size={14} />}
        />
      </div>
    </div>
  );
}

function ToolButton({
  active,
  danger,
  onClick,
  label,
  shortcut,
  icon,
}: {
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  label: string;
  shortcut?: string;
  icon: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer"
      style={{
        fontSize: '12px',
        fontWeight: active ? 600 : 500,
        border: '1px solid transparent',
        background: active
          ? danger
            ? '#FEF2F2'
            : '#EFF6FF'
          : 'transparent',
        borderColor: active
          ? danger
            ? '#FECACA'
            : '#BFDBFE'
          : 'transparent',
        color: danger
          ? '#DC2626'
          : active
            ? '#2563EB'
            : '#475569',
      }}
    >
      <span className="shrink-0">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
