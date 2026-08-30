/**
 * Signal Cartography implementation reminder: tensor facts are compact, explicit,
 * and validity is a scarce lime signal. Browser-only graph state never leaves memory.
 */
export type DrawMode = "line" | "surface" | "volume" | "nd" | "rag";
export type InteractionTool = "draw" | "select" | "connect";
export type TensorKind = "tensor" | "rag";
export type Operator =
  "Add" | "MatMul" | "Concat" | "Relu" | "Conv" | "Invalid";

export interface TelemetrySample {
  x: number;
  y: number;
  pressure: number;
  velocity: number;
  time: number;
}

export interface TensorNode {
  id: string;
  label: string;
  kind: TensorKind;
  sourceMode: DrawMode;
  shape: number[];
  position: { x: number; y: number };
  stroke: TelemetrySample[];
  telemetry: TelemetrySummary;
}

export interface TensorEdge {
  id: string;
  from: string;
  to: string;
  op: Operator;
  valid: boolean;
  reason?: string;
  outputShape?: number[];
}

export interface TensorInitializer {
  id: string;
  name: string;
  shape: number[];
  values: number[];
}

export interface GraphState {
  nodes: TensorNode[];
  edges: TensorEdge[];
  initializers: TensorInitializer[];
}

export interface TelemetrySummary {
  sampleCount: number;
  pressure: number;
  velocity: number;
  pathLength: number;
  duration: number;
}

export interface GraphIndex {
  nodes: Map<string, TensorNode>;
  incoming: Map<string, TensorEdge[]>;
  outgoing: Map<string, TensorEdge[]>;
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

const sameShape = (left: number[], right: number[]) =>
  left.length === right.length &&
  left.every((dimension, index) => dimension === right[index]);

const quantizeDimension = (value: number) => {
  const snapped = Math.round(clamp(value, 8, 256) / 8) * 8;
  return clamp(snapped, 8, 256);
};

export function makeGraphIndex(graph: GraphState): GraphIndex {
  const nodes = new Map<string, TensorNode>();
  const incoming = new Map<string, TensorEdge[]>();
  const outgoing = new Map<string, TensorEdge[]>();

  graph.nodes.forEach(node => {
    nodes.set(node.id, node);
    incoming.set(node.id, []);
    outgoing.set(node.id, []);
  });

  graph.edges.forEach(edge => {
    incoming.get(edge.to)?.push(edge);
    outgoing.get(edge.from)?.push(edge);
  });

  return { nodes, incoming, outgoing };
}

export function summarizeTelemetry(
  samples: TelemetrySample[]
): TelemetrySummary {
  if (!samples.length) {
    return {
      sampleCount: 0,
      pressure: 0,
      velocity: 0,
      pathLength: 0,
      duration: 0,
    };
  }

  let pathLength = 0;
  let velocity = 0;
  let pressure = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    pressure += sample.pressure;
    velocity += sample.velocity;
    if (index > 0) {
      const previous = samples[index - 1];
      pathLength += Math.hypot(sample.x - previous.x, sample.y - previous.y);
    }
  }

  return {
    sampleCount: samples.length,
    pressure: pressure / samples.length,
    velocity: velocity / samples.length,
    pathLength,
    duration: Math.max(0, samples.at(-1)!.time - samples[0].time),
  };
}

export function deriveTensorFromStroke(
  mode: DrawMode,
  samples: TelemetrySample[]
): Omit<TensorNode, "id" | "label" | "position"> {
  const telemetry = summarizeTelemetry(samples);
  const xs = samples.map(sample => sample.x);
  const ys = samples.map(sample => sample.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(0.035, maxX - minX);
  const height = Math.max(0.035, maxY - minY);
  const batch = clamp(Math.round(telemetry.pressure * 8), 1, 8);
  const length = quantizeDimension(8 + telemetry.pathLength * 160);
  const tensorWidth = quantizeDimension(8 + width * 220);
  const tensorHeight = quantizeDimension(8 + height * 220);
  const depth = quantizeDimension(8 + telemetry.velocity * 80);
  const latent = quantizeDimension(8 + Math.min(1, samples.length / 96) * 120);

  const shape =
    mode === "line"
      ? [batch, length]
      : mode === "surface"
        ? [batch, tensorHeight, tensorWidth]
        : mode === "volume"
          ? [batch, depth, tensorHeight, tensorWidth]
          : mode === "nd"
            ? [batch, tensorHeight, tensorWidth, depth, latent]
            : [1, Math.max(64, latent)];

  return {
    kind: mode === "rag" ? "rag" : "tensor",
    sourceMode: mode,
    shape,
    stroke: samples,
    telemetry,
  };
}

function broadcastShape(left: number[], right: number[]): number[] | null {
  const dimensions: number[] = [];
  const maxRank = Math.max(left.length, right.length);
  for (let offset = 1; offset <= maxRank; offset += 1) {
    const a = left.at(-offset) ?? 1;
    const b = right.at(-offset) ?? 1;
    if (a !== b && a !== 1 && b !== 1) return null;
    dimensions.unshift(Math.max(a, b));
  }
  return dimensions;
}

function matMulShape(left: number[], right: number[]): number[] | null {
  if (!left.length || !right.length) return null;
  if (left.length === 1 && right.length === 1) {
    return left[0] === right[0] ? [] : null;
  }

  if (right.length === 1) {
    return left.length >= 2 && left.at(-1) === right[0]
      ? left.slice(0, -1)
      : null;
  }

  if (left.length === 1) {
    return left[0] === right.at(-2)
      ? [...right.slice(0, -2), right.at(-1)!]
      : null;
  }

  if (left.at(-1) !== right.at(-2)) return null;
  const batch = broadcastShape(left.slice(0, -2), right.slice(0, -2));
  return batch ? [...batch, left.at(-2)!, right.at(-1)!] : null;
}

function concatShape(left: number[], right: number[]): number[] | null {
  if (left.length !== right.length || !left.length) return null;
  const axis = left.length - 1;
  if (
    !left.every(
      (dimension, index) => index === axis || dimension === right[index]
    )
  )
    return null;
  return left.map((dimension, index) =>
    index === axis ? dimension + right[index] : dimension
  );
}

export function inferOperator(
  source: TensorNode,
  target: TensorNode
): Pick<TensorEdge, "op" | "valid" | "reason" | "outputShape"> {
  const additive = broadcastShape(source.shape, target.shape);
  if (sameShape(source.shape, target.shape) && additive) {
    return { op: "Add", valid: true, outputShape: additive };
  }

  const matmul = matMulShape(source.shape, target.shape);
  if (matmul) return { op: "MatMul", valid: true, outputShape: matmul };

  const concatenated = concatShape(source.shape, target.shape);
  if (concatenated)
    return { op: "Concat", valid: true, outputShape: concatenated };

  return {
    op: "Invalid",
    valid: false,
    reason: `No legal broadcast, contraction, or concat: [${source.shape}] → [${target.shape}]`,
  };
}

export function createEdge(
  source: TensorNode,
  target: TensorNode,
  graph: GraphState
): TensorEdge {
  const index = makeGraphIndex(graph);
  const existingIncoming = index.incoming.get(target.id) ?? [];
  const inferred = inferOperator(source, target);
  const hasDuplicate = graph.edges.some(
    edge => edge.from === source.id && edge.to === target.id
  );

  if (hasDuplicate) {
    return {
      id: crypto.randomUUID(),
      from: source.id,
      to: target.id,
      op: "Invalid",
      valid: false,
      reason: "This route already exists.",
    };
  }

  if (existingIncoming.length) {
    return {
      id: crypto.randomUUID(),
      from: source.id,
      to: target.id,
      op: "Invalid",
      valid: false,
      reason: "Target already resolves one upstream operation.",
    };
  }

  return {
    id: crypto.randomUUID(),
    from: source.id,
    to: target.id,
    ...inferred,
  };
}

export function wouldCreateCycle(
  graph: GraphState,
  sourceId: string,
  targetId: string
): boolean {
  if (sourceId === targetId) return true;
  const index = makeGraphIndex(graph);
  const visited = new Set<string>();
  const pending = [targetId];

  while (pending.length) {
    const current = pending.pop()!;
    if (current === sourceId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    index.outgoing.get(current)?.forEach(edge => pending.push(edge.to));
  }
  return false;
}

export function labelForMode(mode: DrawMode, index: number): string {
  const prefix =
    mode === "line"
      ? "LINE"
      : mode === "surface"
        ? "SURF"
        : mode === "volume"
          ? "VOL"
          : mode === "nd"
            ? "ND"
            : "RAG";
  return `${prefix}-${String(index).padStart(2, "0")}`;
}

const miniStroke = (centerX: number, centerY: number): TelemetrySample[] => [
  {
    x: centerX - 0.045,
    y: centerY + 0.018,
    pressure: 0.4,
    velocity: 0.35,
    time: 0,
  },
  {
    x: centerX - 0.018,
    y: centerY - 0.026,
    pressure: 0.6,
    velocity: 0.42,
    time: 40,
  },
  {
    x: centerX + 0.018,
    y: centerY + 0.024,
    pressure: 0.65,
    velocity: 0.52,
    time: 90,
  },
  {
    x: centerX + 0.045,
    y: centerY - 0.01,
    pressure: 0.55,
    velocity: 0.4,
    time: 130,
  },
];

export function createDemoGraph(): GraphState {
  const surface = deriveTensorFromStroke("surface", miniStroke(0.27, 0.42));
  const kernel = deriveTensorFromStroke("line", miniStroke(0.64, 0.42));
  const rag = deriveTensorFromStroke("rag", miniStroke(0.52, 0.74));
  const nodes: TensorNode[] = [
    {
      ...surface,
      id: "surface-input",
      label: "SURF-01",
      shape: [2, 24, 32],
      position: { x: 0.27, y: 0.42 },
    },
    {
      ...kernel,
      id: "kernel-weight",
      label: "LINE-02",
      shape: [32, 64],
      position: { x: 0.65, y: 0.42 },
    },
    {
      ...rag,
      id: "rag-context",
      label: "RAG-03",
      shape: [1, 128],
      position: { x: 0.5, y: 0.74 },
    },
  ];
  const graph: GraphState = { nodes, edges: [], initializers: [] };
  const kernelInitializer: TensorInitializer = {
    id: "kernel-basis-initializer",
    name: "kernel-weight__basis",
    shape: [32, 64],
    values: Array.from({ length: 32 * 64 }, (_, index) =>
      Number((Math.sin(index * 0.173) * 0.08).toFixed(6))
    ),
  };
  return {
    ...graph,
    edges: [createEdge(nodes[0], nodes[1], graph)],
    initializers: [kernelInitializer],
  };
}

export function formatShape(shape: number[]) {
  return `[${shape.join(", ")}]`;
}
