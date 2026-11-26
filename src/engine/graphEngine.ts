// ──────────────────────────────────────────────────────────────
// graphEngine.ts  –  Water Distribution Network Algorithms
// BFS · DFS · Kruskal MST with Union-Find (path compress + rank)
// ──────────────────────────────────────────────────────────────

export type NodeType = 'source' | 'tank' | 'junction';

export interface WaterNode {
  id: string;
  label: string;
  type: NodeType;
  x: number;
  y: number;
  z: number;
  elevation: number;
}

export interface WaterPipe {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface AdjEntry {
  nodeId: string;
  weight: number;
  pipeId: string;
}

// ── Adjacency list ─────────────────────────────────────────────
export function buildAdj(
  nodes: WaterNode[],
  pipes: WaterPipe[]
): Map<string, AdjEntry[]> {
  const adj = new Map<string, AdjEntry[]>();
  for (const n of nodes) adj.set(n.id, []);
  for (const p of pipes) {
    adj.get(p.source)?.push({ nodeId: p.target, weight: p.weight, pipeId: p.id });
    adj.get(p.target)?.push({ nodeId: p.source, weight: p.weight, pipeId: p.id });
  }
  return adj;
}

// ── Union-Find ─────────────────────────────────────────────────
export class DSU {
  private parent: Map<string, string> = new Map();
  private rank: Map<string, number> = new Map();

  constructor(ids: string[]) {
    for (const id of ids) {
      this.parent.set(id, id);
      this.rank.set(id, 0);
    }
  }

  find(x: string): string {
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }

  union(a: string, b: string): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    const rka = this.rank.get(ra)!;
    const rkb = this.rank.get(rb)!;
    if (rka < rkb) this.parent.set(ra, rb);
    else if (rka > rkb) this.parent.set(rb, ra);
    else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rka + 1);
    }
    return true;
  }
}

// ── BFS ────────────────────────────────────────────────────────
export interface BFSStep {
  step: number;
  kind: 'init' | 'visit' | 'enqueue' | 'done';
  current: string | null;
  edgeId: string | null;
  queue: string[];
  visited: Set<string>;
  visitedEdges: Set<string>;
  level: Record<string, number>;
  msg: string;
}

export interface BFSResult {
  order: string[];
  reached: number;
  total: number;
  disconnected: string[];
  level: Record<string, number>;
  steps: BFSStep[];
}

export function runBFS(nodes: WaterNode[], pipes: WaterPipe[], srcId: string): BFSResult {
  const ids = nodes.map(n => n.id);
  const labelMap = new Map(nodes.map(n => [n.id, n.label]));
  const lbl = (id: string) => labelMap.get(id) ?? id;
  const adj = buildAdj(nodes, pipes);
  const steps: BFSStep[] = [];
  const visited = new Set<string>();
  const visitedEdges = new Set<string>();
  const queue: string[] = [];
  const order: string[] = [];
  const level: Record<string, number> = {};

  for (const id of ids) level[id] = -1;
  if (!ids.includes(srcId)) {
    return { order: [], reached: 0, total: nodes.length, disconnected: ids, level, steps };
  }

  visited.add(srcId);
  queue.push(srcId);
  level[srcId] = 0;
  steps.push({
    step: 0,
    kind: 'init',
    current: srcId,
    edgeId: null,
    queue: [...queue],
    visited: new Set(visited),
    visitedEdges: new Set(visitedEdges),
    level: { ...level },
    msg: `Initialize BFS at ${lbl(srcId)} (depth 0)`,
  });

  while (queue.length) {
    const cur = queue.shift()!;
    order.push(cur);
    steps.push({
      step: steps.length,
      kind: 'visit',
      current: cur,
      edgeId: null,
      queue: [...queue],
      visited: new Set(visited),
      visitedEdges: new Set(visitedEdges),
      level: { ...level },
      msg: `Visit ${lbl(cur)} (depth ${level[cur]})`,
    });

    const nbrs = [...(adj.get(cur) ?? [])].sort((a, b) =>
      lbl(a.nodeId).localeCompare(lbl(b.nodeId))
    );
    for (const nb of nbrs) {
      if (!visited.has(nb.nodeId)) {
        visited.add(nb.nodeId);
        visitedEdges.add(nb.pipeId);
        queue.push(nb.nodeId);
        level[nb.nodeId] = level[cur] + 1;
        steps.push({
          step: steps.length,
          kind: 'enqueue',
          current: nb.nodeId,
          edgeId: nb.pipeId,
          queue: [...queue],
          visited: new Set(visited),
          visitedEdges: new Set(visitedEdges),
          level: { ...level },
          msg: `Enqueue ${lbl(nb.nodeId)} via ${lbl(cur)}-${lbl(nb.nodeId)} (w=${nb.weight})`,
        });
      }
    }
  }

  const disconnected = ids.filter(id => !visited.has(id));
  steps.push({
    step: steps.length,
    kind: 'done',
    current: null,
    edgeId: null,
    queue: [],
    visited: new Set(visited),
    visitedEdges: new Set(visitedEdges),
    level: { ...level },
    msg: disconnected.length
      ? `Complete: ${order.length}/${nodes.length} reached. Isolated: ${disconnected.map(lbl).join(', ')}`
      : `Complete: all ${nodes.length} nodes reachable`,
  });

  return { order, reached: order.length, total: nodes.length, disconnected, level, steps };
}

// ── DFS ────────────────────────────────────────────────────────
export interface DFSStep {
  step: number;
  kind: 'init' | 'explore' | 'backtrack' | 'done';
  current: string | null;
  edgeId: string | null;
  branch: string[];
  visited: Set<string>;
  visitedEdges: Set<string>;
  depth: Record<string, number>;
  msg: string;
}

export interface DFSResult {
  order: string[];
  visited: number;
  total: number;
  unvisited: string[];
  depth: Record<string, number>;
  steps: DFSStep[];
}

export function runDFS(nodes: WaterNode[], pipes: WaterPipe[], srcId: string): DFSResult {
  const ids = nodes.map(n => n.id);
  const labelMap = new Map(nodes.map(n => [n.id, n.label]));
  const lbl = (id: string) => labelMap.get(id) ?? id;
  const adj = buildAdj(nodes, pipes);
  const steps: DFSStep[] = [];
  const visitedSet = new Set<string>();
  const visitedEdges = new Set<string>();
  const order: string[] = [];
  const depth: Record<string, number> = {};
  for (const id of ids) depth[id] = 0;

  if (!ids.includes(srcId)) {
    return { order: [], visited: 0, total: nodes.length, unvisited: ids, depth, steps };
  }

  steps.push({
    step: 0,
    kind: 'init',
    current: srcId,
    edgeId: null,
    branch: [srcId],
    visited: new Set(visitedSet),
    visitedEdges: new Set(visitedEdges),
    depth: { ...depth },
    msg: `Initialize DFS at ${lbl(srcId)}`,
  });

  function dfs(
    u: string,
    edgeId: string | null,
    d: number,
    parent: string | null,
    branch: string[]
  ) {
    visitedSet.add(u);
    if (edgeId) visitedEdges.add(edgeId);
    order.push(u);
    depth[u] = d;
    steps.push({
      step: steps.length,
      kind: 'explore',
      current: u,
      edgeId,
      branch: [...branch, u],
      visited: new Set(visitedSet),
      visitedEdges: new Set(visitedEdges),
      depth: { ...depth },
      msg: `Explore ${lbl(u)} (depth ${d})${parent ? ` from ${lbl(parent)}` : ''}`,
    });

    // Descend by descending weight, tie-break alphabetical (reproduces A->B->D->F->E->C)
    const nbrs = [...(adj.get(u) ?? [])].sort(
      (a, b) => b.weight - a.weight || lbl(a.nodeId).localeCompare(lbl(b.nodeId))
    );
    for (const nb of nbrs) {
      if (!visitedSet.has(nb.nodeId)) {
        dfs(nb.nodeId, nb.pipeId, d + 1, u, [...branch, u]);
      }
    }
    if (parent !== null) {
      steps.push({
        step: steps.length,
        kind: 'backtrack',
        current: parent,
        edgeId,
        branch,
        visited: new Set(visitedSet),
        visitedEdges: new Set(visitedEdges),
        depth: { ...depth },
        msg: `Backtrack from ${lbl(u)} to ${lbl(parent)}`,
      });
    }
  }

  dfs(srcId, null, 0, null, []);

  const unvisited = ids.filter(id => !visitedSet.has(id));
  steps.push({
    step: steps.length,
    kind: 'done',
    current: null,
    edgeId: null,
    branch: [],
    visited: new Set(visitedSet),
    visitedEdges: new Set(visitedEdges),
    depth: { ...depth },
    msg: unvisited.length
      ? `Complete: unvisited nodes ${unvisited.map(lbl).join(', ')}`
      : `Complete: all ${nodes.length} nodes visited`,
  });

  return { order, visited: order.length, total: nodes.length, unvisited, depth, steps };
}

// ── Kruskal MST ────────────────────────────────────────────────
export interface EdgeDecision {
  pipe: WaterPipe;
  accepted: boolean;
  reason: string;
}

export interface KruskalStep {
  step: number;
  kind: 'init' | 'eval' | 'accept' | 'reject' | 'done';
  edge: WaterPipe | null;
  accepted: string[];
  rejected: string[];
  cost: number;
  msg: string;
}

export interface KruskalResult {
  mstPipes: WaterPipe[];
  decisions: EdgeDecision[];
  totalCost: number;
  connected: boolean;
  components: number;
  targetEdges: number;
  steps: KruskalStep[];
}

export function runKruskal(nodes: WaterNode[], pipes: WaterPipe[]): KruskalResult {
  const ids = nodes.map(n => n.id);
  const labelMap = new Map(nodes.map(n => [n.id, n.label]));
  const lbl = (id: string) => labelMap.get(id) ?? id;
  const dsu = new DSU(ids);
  const sorted = [...pipes].sort((a, b) =>
    a.weight !== b.weight ? a.weight - b.weight : a.id.localeCompare(b.id)
  );
  const steps: KruskalStep[] = [];
  const decisions: EdgeDecision[] = [];
  const mstPipes: WaterPipe[] = [];
  const accepted: string[] = [];
  const rejected: string[] = [];
  let cost = 0;
  const target = Math.max(0, nodes.length - 1);

  steps.push({
    step: 0,
    kind: 'init',
    edge: null,
    accepted: [],
    rejected: [],
    cost: 0,
    msg: `${sorted.length} pipes sorted ascending. Target: ${target} edges.`,
  });

  for (const p of sorted) {
    const ru = dsu.find(p.source);
    const rv = dsu.find(p.target);
    steps.push({
      step: steps.length,
      kind: 'eval',
      edge: p,
      accepted: [...accepted],
      rejected: [...rejected],
      cost,
      msg: `Check ${lbl(p.source)}-${lbl(p.target)} (w=${p.weight})`,
    });

    if (ru !== rv) {
      dsu.union(p.source, p.target);
      mstPipes.push(p);
      accepted.push(p.id);
      cost += p.weight;
      decisions.push({
        pipe: p,
        accepted: true,
        reason: `Merges ${lbl(ru)} and ${lbl(rv)}`,
      });
      steps.push({
        step: steps.length,
        kind: 'accept',
        edge: p,
        accepted: [...accepted],
        rejected: [...rejected],
        cost,
        msg: `Accept ${lbl(p.source)}-${lbl(p.target)} (cost = ${cost})`,
      });

      if (mstPipes.length === target) {
        for (const rem of sorted.filter(x => !accepted.includes(x.id) && !rejected.includes(x.id))) {
          rejected.push(rem.id);
          decisions.push({
            pipe: rem,
            accepted: false,
            reason: 'Spanning tree complete',
          });
        }
        break;
      }
    } else {
      rejected.push(p.id);
      decisions.push({
        pipe: p,
        accepted: false,
        reason: `Forms cycle in component ${lbl(ru)}`,
      });
      steps.push({
        step: steps.length,
        kind: 'reject',
        edge: p,
        accepted: [...accepted],
        rejected: [...rejected],
        cost,
        msg: `Reject ${lbl(p.source)}-${lbl(p.target)} (cycle)`,
      });
    }
  }

  const roots = new Set(ids.map(id => dsu.find(id)));
  const connected = roots.size === 1 && nodes.length > 0;
  steps.push({
    step: steps.length,
    kind: 'done',
    edge: null,
    accepted: [...accepted],
    rejected: [...rejected],
    cost,
    msg: connected
      ? `MST complete: ${mstPipes.length} pipes, total cost ${cost}`
      : `Spanning forest: ${roots.size} components, cost ${cost}`,
  });

  return {
    mstPipes,
    decisions,
    totalCost: cost,
    connected,
    components: roots.size,
    targetEdges: target,
    steps,
  };
}

// ── Default 6-node sample dataset ─────────────────────────────
export const DEFAULT_NODES: WaterNode[] = [
  { id: 'A', label: 'A', type: 'source',   x: -6.0, y: 0, z:  0.0, elevation: 150 },
  { id: 'B', label: 'B', type: 'junction', x: -2.2, y: 0, z: -3.8, elevation: 110 },
  { id: 'C', label: 'C', type: 'junction', x: -2.2, y: 0, z:  3.8, elevation: 105 },
  { id: 'D', label: 'D', type: 'junction', x:  2.4, y: 0, z: -3.0, elevation: 85  },
  { id: 'E', label: 'E', type: 'junction', x:  2.4, y: 0, z:  3.0, elevation: 80  },
  { id: 'F', label: 'F', type: 'tank',     x:  6.4, y: 0, z:  0.0, elevation: 60  },
];

export const DEFAULT_PIPES: WaterPipe[] = [
  { id: 'p1', source: 'A', target: 'B', weight: 4 },
  { id: 'p2', source: 'A', target: 'C', weight: 3 },
  { id: 'p3', source: 'B', target: 'C', weight: 2 },
  { id: 'p4', source: 'B', target: 'D', weight: 5 },
  { id: 'p5', source: 'C', target: 'D', weight: 3 },
  { id: 'p6', source: 'C', target: 'E', weight: 6 },
  { id: 'p7', source: 'D', target: 'E', weight: 2 },
  { id: 'p8', source: 'D', target: 'F', weight: 4 },
  { id: 'p9', source: 'E', target: 'F', weight: 3 },
];

// ── Auto-label helper ──────────────────────────────────────────
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function nextLabel(existing: string[]): string {
  for (const ch of ALPHA) if (!existing.includes(ch)) return ch;
  let i = 1;
  while (true) {
    const lbl = `N${i}`;
    if (!existing.includes(lbl)) return lbl;
    i++;
  }
}
