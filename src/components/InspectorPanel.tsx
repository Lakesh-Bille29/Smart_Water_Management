import type { WaterNode, WaterPipe, NodeType, BFSResult, DFSResult, KruskalResult } from '../engine/graphEngine';
import type { ActiveTab } from '../App';
import KruskalView from './views/KruskalView';
import BFSView from './views/BFSView';
import DFSView from './views/DFSView';
import EditorView from './views/EditorView';

interface Props {
  open: boolean;
  activeTab: ActiveTab;
  nodes: WaterNode[];
  pipes: WaterPipe[];
  sourceId: string;
  bfsSource: string;
  dfsSource: string;
  setBfsSource: (id: string) => void;
  setDfsSource: (id: string) => void;
  selectedNodeId: string | null;
  selectedPipeId: string | null;
  bfsResult: BFSResult;
  dfsResult: DFSResult;
  kruskalResult: KruskalResult;
  stepIndex: number;
  setStepIndex: (i: number) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  speed: number;
  setSpeed: (v: number) => void;
  maxStep: number;
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

export default function InspectorPanel(props: Props) {
  return (
    <aside
      className="absolute top-0 right-0 h-full flex flex-col"
      style={{
        width: '300px',
        background: '#FFFFFF',
        borderLeft: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
        transform: props.open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 15,
      }}
    >
      {props.activeTab === 'MST' && (
        <KruskalView
          nodes={props.nodes}
          result={props.kruskalResult}
          stepIndex={props.stepIndex}
          setStepIndex={props.setStepIndex}
          isPlaying={props.isPlaying}
          setIsPlaying={props.setIsPlaying}
          speed={props.speed}
          setSpeed={props.setSpeed}
          maxStep={props.maxStep}
        />
      )}
      {props.activeTab === 'BFS' && (
        <BFSView
          nodes={props.nodes}
          result={props.bfsResult}
          source={props.bfsSource}
          setSource={props.setBfsSource}
          stepIndex={props.stepIndex}
          setStepIndex={props.setStepIndex}
          isPlaying={props.isPlaying}
          setIsPlaying={props.setIsPlaying}
          speed={props.speed}
          setSpeed={props.setSpeed}
          maxStep={props.maxStep}
        />
      )}
      {props.activeTab === 'DFS' && (
        <DFSView
          nodes={props.nodes}
          result={props.dfsResult}
          source={props.dfsSource}
          setSource={props.setDfsSource}
          stepIndex={props.stepIndex}
          setStepIndex={props.setStepIndex}
          isPlaying={props.isPlaying}
          setIsPlaying={props.setIsPlaying}
          speed={props.speed}
          setSpeed={props.setSpeed}
          maxStep={props.maxStep}
        />
      )}
      {props.activeTab === 'EDIT' && (
        <EditorView
          nodes={props.nodes}
          pipes={props.pipes}
          sourceId={props.sourceId}
          selectedNodeId={props.selectedNodeId}
          selectedPipeId={props.selectedPipeId}
          onAddNode={props.onAddNode}
          onDeleteNode={props.onDeleteNode}
          onUpdateNode={props.onUpdateNode}
          onAddPipe={props.onAddPipe}
          onDeletePipe={props.onDeletePipe}
          onUpdatePipeWeight={props.onUpdatePipeWeight}
          onSetSource={props.onSetSource}
          onLoadDefault={props.onLoadDefault}
          onClearCanvas={props.onClearCanvas}
        />
      )}
    </aside>
  );
}
