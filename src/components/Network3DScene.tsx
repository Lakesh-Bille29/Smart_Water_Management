import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import type {
  WaterNode,
  WaterPipe,
  BFSResult,
  DFSResult,
  KruskalResult,
} from '../engine/graphEngine';
import type { ActiveTab, EditorMode } from '../App';

// ── Daylight Studio Color Palette ───────────────────────────────
const PALETTE = {
  bg:        '#F4F6F8',
  blue:      '#2563EB',
  teal:      '#0D9488',
  amber:     '#D97706',
  red:       '#DC2626',
  steelIdle: '#CBD5E1',
  nodeBase:  '#E2E8F0',
  nodeBody:  '#64748B',
  nodeTank:  '#475569',
  nodeSrc:   '#2563EB',
  capMuted:  '#94A3B8',
};

const PIPE_ATTACH_Y = 0.24;

// ── Faint Architectural Dot Grid ────────────────────────────────
function ArchitecturalDotGrid() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const coords = useMemo(() => {
    const list: [number, number][] = [];
    const extent = 18;
    for (let x = -extent; x <= extent; x += 1) {
      for (let z = -extent; z <= extent; z += 1) {
        list.push([x, z]);
      }
    }
    return list;
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    coords.forEach(([x, z], idx) => {
      dummy.position.set(x, 0.002, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(idx, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [coords]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, coords.length]}>
      <cylinderGeometry args={[0.028, 0.028, 0.002, 10]} />
      <meshBasicMaterial color={PALETTE.steelIdle} transparent opacity={0.65} />
    </instancedMesh>
  );
}

// ── Matte Ground Floor Receiving Soft Contact Shadows ───────────
function StudioFloor({
  editorMode,
  onGroundClick,
}: {
  editorMode: EditorMode;
  onGroundClick: (x: number, z: number) => void;
}) {
  return (
    <group>
      {/* Base matte studio floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        onPointerDown={(e) => {
          if (editorMode !== 'addNode') return;
          e.stopPropagation();
          onGroundClick(
            Math.round(e.point.x * 10) / 10,
            Math.round(e.point.z * 10) / 10
          );
        }}
      >
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial
          color={PALETTE.bg}
          roughness={0.96}
          metalness={0.0}
        />
      </mesh>
      <ArchitecturalDotGrid />
    </group>
  );
}

// ── Distinct 3D Architectural Node Silhouettes ──────────────────
function NodeModel({
  node,
  isPrimarySource,
  isVisited,
  isActiveCurrent,
  isDisconnected,
  isSelected,
  isConnectFirst,
  onClick,
}: {
  node: WaterNode;
  isPrimarySource: boolean;
  isVisited: boolean;
  isActiveCurrent: boolean;
  isDisconnected: boolean;
  isSelected: boolean;
  isConnectFirst: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const targetHex = useMemo(() => {
    if (isConnectFirst || isSelected || isActiveCurrent) return PALETTE.blue;
    if (isDisconnected) return PALETTE.red;
    if (isVisited) return PALETTE.teal;
    if (node.type === 'source' || isPrimarySource) return PALETTE.nodeSrc;
    if (node.type === 'tank') return PALETTE.nodeTank;
    return PALETTE.nodeBody;
  }, [
    isConnectFirst,
    isSelected,
    isActiveCurrent,
    isDisconnected,
    isVisited,
    node.type,
    isPrimarySource,
  ]);

  const targetColorObj = useMemo(() => new THREE.Color(targetHex), [targetHex]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      const targetScale = hovered || isSelected ? 1.07 : 1.0;
      const s = THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, Math.min(1, delta * 12));
      groupRef.current.scale.set(s, s, s);
    }
    if (bodyMatRef.current) {
      bodyMatRef.current.color.lerp(targetColorObj, Math.min(1, delta * 10));
    }
  });

  const labelBorder = isSelected || isConnectFirst
    ? PALETTE.blue
    : isDisconnected
      ? PALETTE.red
      : isVisited
        ? PALETTE.teal
        : '#CBD5E1';

  const labelY =
    node.type === 'source' ? 1.72 : node.type === 'tank' ? 1.25 : 0.92;

  return (
    <group position={[node.x, node.y, node.z]}>
      <group
        ref={groupRef}
        onPointerDown={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Subtle circular architectural base pad */}
        <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.5, 0.54, 0.06, 32]} />
          <meshStandardMaterial color={PALETTE.nodeBase} roughness={0.75} metalness={0.05} />
        </mesh>

        {/* Source: elevated cylindrical water tower with subtle cap ring */}
        {node.type === 'source' && (
          <group>
            {/* Support pedestal */}
            <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.16, 0.24, 0.64, 24]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.68} metalness={0.08} />
            </mesh>
            {/* Elevated reservoir drum */}
            <mesh position={[0, 0.96, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.42, 0.42, 0.58, 32]} />
              <meshStandardMaterial
                ref={bodyMatRef}
                color={targetHex}
                roughness={0.65}
                metalness={0.08}
              />
            </mesh>
            {/* Subtle architectural cap ring */}
            <mesh position={[0, 1.27, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.46, 0.46, 0.06, 32]} />
              <meshStandardMaterial color="#E2E8F0" roughness={0.65} metalness={0.08} />
            </mesh>
            <mesh position={[0, 1.32, 0]} castShadow>
              <cylinderGeometry args={[0.16, 0.22, 0.06, 24]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.65} metalness={0.08} />
            </mesh>
          </group>
        )}

        {/* Tank: rounded storage tank with domed top */}
        {node.type === 'tank' && (
          <group>
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.44, 0.46, 0.08, 32]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.7} metalness={0.08} />
            </mesh>
            <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.4, 0.4, 0.56, 32]} />
              <meshStandardMaterial
                ref={bodyMatRef}
                color={targetHex}
                roughness={0.65}
                metalness={0.08}
              />
            </mesh>
            <mesh position={[0, 0.7, 0]} castShadow>
              <sphereGeometry args={[0.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#E2E8F0" roughness={0.65} metalness={0.08} />
            </mesh>
          </group>
        )}

        {/* Junction: compact chamfered valve cylinder */}
        {node.type === 'junction' && (
          <group>
            {/* Lower flange */}
            <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.35, 0.38, 0.08, 28]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.68} metalness={0.08} />
            </mesh>
            {/* Valve body */}
            <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.28, 0.31, 0.34, 28]} />
              <meshStandardMaterial
                ref={bodyMatRef}
                color={targetHex}
                roughness={0.65}
                metalness={0.08}
              />
            </mesh>
            {/* Chamfered top cap */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.28, 0.08, 28]} />
              <meshStandardMaterial color="#E2E8F0" roughness={0.65} metalness={0.08} />
            </mesh>
          </group>
        )}

        {/* Crisp selection or hover ring on floor */}
        {(isSelected || isConnectFirst || hovered) && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
            <ringGeometry args={[0.62, 0.69, 40]} />
            <meshBasicMaterial
              color={isSelected || isConnectFirst ? PALETTE.blue : '#94A3B8'}
              transparent
              opacity={isSelected || isConnectFirst ? 0.9 : 0.6}
            />
          </mesh>
        )}
      </group>

      {/* Crisp minimal HTML pill badge above node */}
      <Html
        position={[0, labelY, 0]}
        center
        zIndexRange={[5, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: '#FFFFFF',
            border: `1px solid ${labelBorder}`,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
            borderRadius: '999px',
            padding: '2px 8px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 600,
            color: '#0F172A',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {(isPrimarySource || node.type === 'source') && (
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: PALETTE.blue,
              }}
            />
          )}
          <span>{node.label}</span>
          {hovered && (
            <span style={{ color: '#64748B', fontWeight: 400, fontSize: '10px' }}>
              {node.type}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}

// ── Pipe Model with Rounded Connector Joints & Flow Pulses ──────
function PipeModel({
  pipe,
  src,
  tgt,
  state,
  isSelected,
  onClick,
}: {
  pipe: WaterPipe;
  src: WaterNode;
  tgt: WaterNode;
  state: 'idle' | 'visited' | 'mst' | 'evaluating' | 'rejected';
  isSelected: boolean;
  onClick: () => void;
}) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const jointARef = useRef<THREE.MeshStandardMaterial>(null);
  const jointBRef = useRef<THREE.MeshStandardMaterial>(null);
  const pulse1Ref = useRef<THREE.Mesh>(null);
  const pulse2Ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const startVec = useMemo(
    () => new THREE.Vector3(src.x, src.y + PIPE_ATTACH_Y, src.z),
    [src.x, src.y, src.z]
  );
  const endVec = useMemo(
    () => new THREE.Vector3(tgt.x, tgt.y + PIPE_ATTACH_Y, tgt.z),
    [tgt.x, tgt.y, tgt.z]
  );

  const { length, mid, quat } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(endVec, startVec);
    const len = dir.length();
    const m = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
    const q = new THREE.Quaternion();
    if (len > 0.001) {
      q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    }
    return { length: len, mid: m, quat: q };
  }, [startVec, endVec]);

  const targetHex = useMemo(() => {
    if (isSelected || hovered) return PALETTE.blue;
    if (state === 'mst') return PALETTE.amber;
    if (state === 'visited') return PALETTE.teal;
    if (state === 'evaluating') return PALETTE.blue;
    if (state === 'rejected') return '#E2E8F0';
    return PALETTE.steelIdle;
  }, [isSelected, hovered, state]);

  const targetColorObj = useMemo(() => new THREE.Color(targetHex), [targetHex]);
  const showFlow = state === 'mst' || state === 'visited' || state === 'evaluating';
  const pulseColor = state === 'mst' ? PALETTE.amber : state === 'evaluating' ? PALETTE.blue : PALETTE.teal;

  useFrame(({ clock }, delta) => {
    const step = Math.min(1, delta * 10);
    if (matRef.current) matRef.current.color.lerp(targetColorObj, step);
    if (jointARef.current) jointARef.current.color.lerp(targetColorObj, step);
    if (jointBRef.current) jointBRef.current.color.lerp(targetColorObj, step);

    if (showFlow) {
      const elapsed = clock.getElapsedTime() * 0.45;
      if (pulse1Ref.current) {
        const t1 = elapsed % 1;
        pulse1Ref.current.position.lerpVectors(startVec, endVec, t1);
      }
      if (pulse2Ref.current) {
        const t2 = (elapsed + 0.5) % 1;
        pulse2Ref.current.position.lerpVectors(startVec, endVec, t2);
      }
    }
  });

  const radius =
    state === 'mst' || state === 'visited' || state === 'evaluating' || isSelected
      ? 0.075
      : state === 'rejected'
        ? 0.036
        : 0.052;
  const opacity = state === 'rejected' ? 0.45 : 1.0;

  return (
    <group>
      {/* Main smooth pipe cylinder */}
      <mesh
        position={mid}
        quaternion={quat}
        castShadow
        receiveShadow
        onPointerDown={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        <cylinderGeometry args={[radius, radius, length, 16]} />
        <meshStandardMaterial
          ref={matRef}
          color={targetHex}
          roughness={0.65}
          metalness={0.08}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Rounded connector joints at both ends */}
      <mesh position={startVec} castShadow>
        <sphereGeometry args={[radius * 1.45, 16, 16]} />
        <meshStandardMaterial
          ref={jointARef}
          color={targetHex}
          roughness={0.65}
          metalness={0.08}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <mesh position={endVec} castShadow>
        <sphereGeometry args={[radius * 1.45, 16, 16]} />
        <meshStandardMaterial
          ref={jointBRef}
          color={targetHex}
          roughness={0.65}
          metalness={0.08}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Clean directional water-flow pulses along active pipes */}
      {showFlow && (
        <>
          <mesh ref={pulse1Ref} position={startVec}>
            <sphereGeometry args={[0.115, 14, 14]} />
            <meshStandardMaterial
              color={pulseColor}
              roughness={0.45}
              metalness={0.1}
            />
          </mesh>
          <mesh ref={pulse2Ref} position={mid}>
            <sphereGeometry args={[0.095, 14, 14]} />
            <meshStandardMaterial
              color="#FFFFFF"
              roughness={0.4}
              metalness={0.05}
            />
          </mesh>
        </>
      )}

      {/* Minimal crisp weight pill badge at midpoint */}
      <Html
        position={[mid.x, mid.y + 0.24, mid.z]}
        center
        zIndexRange={[4, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${
              isSelected || hovered
                ? PALETTE.blue
                : state === 'mst'
                  ? '#FDE68A'
                  : state === 'visited'
                    ? '#99F6E4'
                    : '#CBD5E1'
            }`,
            color:
              isSelected || hovered
                ? PALETTE.blue
                : state === 'mst'
                  ? PALETTE.amber
                  : state === 'visited'
                    ? PALETTE.teal
                    : state === 'rejected'
                      ? '#94A3B8'
                      : '#0F172A',
            borderRadius: '999px',
            padding: '1px 6px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            fontWeight: 600,
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.06)',
            opacity: state === 'rejected' ? 0.65 : 1,
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {pipe.weight}
        </div>
      </Html>
    </group>
  );
}

// ── Smooth Camera Controller ────────────────────────────────────
function CameraController({ resetTick }: { resetTick: number }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (resetTick === 0) return;
    camera.position.set(0, 10.5, 16.5);
    camera.lookAt(0, 0, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctrl = controls as any;
    if (ctrl) {
      ctrl.target?.set(0, 0, 0);
      ctrl.update?.();
    }
  }, [resetTick, camera, controls]);
  return null;
}

// ── Scene Props & Content ───────────────────────────────────────
interface SceneProps {
  nodes: WaterNode[];
  pipes: WaterPipe[];
  sourceId: string;
  editorMode: EditorMode;
  selectedNodeId: string | null;
  selectedPipeId: string | null;
  connectFirst: string | null;
  activeTab: ActiveTab;
  bfsResult: BFSResult;
  dfsResult: DFSResult;
  kruskalResult: KruskalResult;
  stepIndex: number;
  cameraResetTick: number;
  onNodeClick: (id: string) => void;
  onPipeClick: (id: string) => void;
  onGroundClick: (x: number, z: number) => void;
}

function SceneContent({
  nodes,
  pipes,
  sourceId,
  editorMode,
  selectedNodeId,
  selectedPipeId,
  connectFirst,
  activeTab,
  bfsResult,
  dfsResult,
  kruskalResult,
  stepIndex,
  cameraResetTick,
  onNodeClick,
  onPipeClick,
  onGroundClick,
}: SceneProps) {
  const nodeMap = useMemo(() => {
    const m = new Map<string, WaterNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const bfsStep = bfsResult.steps[Math.min(stepIndex, Math.max(0, bfsResult.steps.length - 1))];
  const dfsStep = dfsResult.steps[Math.min(stepIndex, Math.max(0, dfsResult.steps.length - 1))];
  const mstStep = kruskalResult.steps[Math.min(stepIndex, Math.max(0, kruskalResult.steps.length - 1))];

  const visitedNodes = useMemo((): Set<string> => {
    if (activeTab === 'BFS' && bfsStep) return bfsStep.visited;
    if (activeTab === 'DFS' && dfsStep) return dfsStep.visited;
    return new Set();
  }, [activeTab, bfsStep, dfsStep]);

  const activeCurrentNode = useMemo((): string | null => {
    if (activeTab === 'BFS' && bfsStep) return bfsStep.current;
    if (activeTab === 'DFS' && dfsStep) return dfsStep.current;
    return null;
  }, [activeTab, bfsStep, dfsStep]);

  const disconnectedNodes = useMemo((): Set<string> => {
    if (activeTab === 'BFS' && bfsStep?.kind === 'done') return new Set(bfsResult.disconnected);
    if (activeTab === 'DFS' && dfsStep?.kind === 'done') return new Set(dfsResult.unvisited);
    return new Set();
  }, [activeTab, bfsStep, dfsStep, bfsResult.disconnected, dfsResult.unvisited]);

  const mstAccepted = useMemo(() => new Set(mstStep?.accepted ?? []), [mstStep]);
  const mstRejected = useMemo(() => new Set(mstStep?.rejected ?? []), [mstStep]);

  return (
    <>
      <color attach="background" args={[PALETTE.bg]} />
      <fog attach="fog" args={[PALETTE.bg, 32, 72]} />

      {/* Studio Lighting & Soft Shadows */}
      <hemisphereLight args={['#FFFFFF', '#E2E8F0', 0.85]} />
      <directionalLight
        position={[12, 20, 14]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-12, 10, -10]} intensity={0.35} color="#EFF6FF" />

      <StudioFloor editorMode={editorMode} onGroundClick={onGroundClick} />

      {/* Pipes */}
      {pipes.map(p => {
        const src = nodeMap.get(p.source);
        const tgt = nodeMap.get(p.target);
        if (!src || !tgt) return null;

        let pipeState: 'idle' | 'visited' | 'mst' | 'evaluating' | 'rejected' = 'idle';
        if (activeTab === 'MST') {
          if (mstAccepted.has(p.id)) pipeState = 'mst';
          else if (mstStep?.kind === 'eval' && mstStep.edge?.id === p.id) pipeState = 'evaluating';
          else if (mstRejected.has(p.id)) pipeState = 'rejected';
        } else if (activeTab === 'BFS' && bfsStep) {
          if (bfsStep.edgeId === p.id) pipeState = 'evaluating';
          else if (bfsStep.visitedEdges.has(p.id)) pipeState = 'visited';
        } else if (activeTab === 'DFS' && dfsStep) {
          if (dfsStep.edgeId === p.id) pipeState = 'evaluating';
          else if (dfsStep.visitedEdges.has(p.id)) pipeState = 'visited';
        }

        return (
          <PipeModel
            key={p.id}
            pipe={p}
            src={src}
            tgt={tgt}
            state={pipeState}
            isSelected={selectedPipeId === p.id}
            onClick={() => onPipeClick(p.id)}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map(n => (
        <NodeModel
          key={n.id}
          node={n}
          isPrimarySource={n.id === sourceId}
          isVisited={visitedNodes.has(n.id)}
          isActiveCurrent={activeCurrentNode === n.id}
          isDisconnected={disconnectedNodes.has(n.id)}
          isSelected={selectedNodeId === n.id}
          isConnectFirst={connectFirst === n.id}
          onClick={() => onNodeClick(n.id)}
        />
      ))}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minPolarAngle={0.12}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={5}
        maxDistance={42}
      />
      <CameraController resetTick={cameraResetTick} />
    </>
  );
}

export default function Network3DScene(props: SceneProps) {
  const modeHint =
    props.editorMode === 'addNode'
      ? 'Click anywhere on the studio floor to place a new node'
      : props.editorMode === 'connect'
        ? props.connectFirst
          ? `Select a destination node to connect from ${
              props.nodes.find(n => n.id === props.connectFirst)?.label ?? props.connectFirst
            }`
          : 'Select the first node to begin a pipe connection'
        : props.editorMode === 'delete'
          ? 'Click any node or pipe to delete it'
          : null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        cursor: props.editorMode === 'addNode' ? 'crosshair' : 'default',
      }}
    >
      <Canvas
        camera={{ position: [0, 10.5, 16.5], fov: 46 }}
        shadows="soft"
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
      >
        <SceneContent {...props} />
      </Canvas>

      {/* Subtle mode prompt banner at bottom center */}
      {modeHint && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-xs font-medium pointer-events-none"
          style={{
            background: '#FFFFFF',
            border: `1px solid ${props.editorMode === 'delete' ? '#FECACA' : '#CBD5E1'}`,
            color: props.editorMode === 'delete' ? '#DC2626' : '#0F172A',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
            zIndex: 12,
          }}
        >
          {modeHint}
        </div>
      )}

      {/* Subtle compact legend at bottom left */}
      <div
        className="absolute bottom-4 left-3.5 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg pointer-events-none"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
          fontSize: '11px',
          color: '#64748B',
          zIndex: 12,
        }}
      >
        <LegendDot color="#2563EB" label="Source / Selected" />
        <LegendDot color="#0D9488" label="Visited" />
        <LegendDot color="#D97706" label="MST Pipe" />
        <LegendDot color="#CBD5E1" label="Idle" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: color,
          display: 'inline-block',
        }}
      />
      <span>{label}</span>
    </span>
  );
}
