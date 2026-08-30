/**
 * Signal Cartography implementation reminder: serialize the model as transparent
 * protobuf wire bytes — no network, no runtime protobuf dependency, no hidden work.
 */
import {
  GraphState,
  makeGraphIndex,
  TensorEdge,
  TensorInitializer,
  TensorNode,
} from "./tensor";

const textEncoder = new TextEncoder();

function concat(chunks: Uint8Array[]): Uint8Array {
  const length = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  chunks.forEach(chunk => {
    output.set(chunk, offset);
    offset += chunk.length;
  });
  return output;
}

function varint(value: number): Uint8Array {
  const bytes: number[] = [];
  let current = Math.max(0, Math.floor(value));
  while (current > 127) {
    bytes.push((current & 127) | 128);
    current = Math.floor(current / 128);
  }
  bytes.push(current);
  return Uint8Array.from(bytes);
}

function fieldVarint(field: number, value: number): Uint8Array {
  return concat([varint(field << 3), varint(value)]);
}

function fieldBytes(field: number, bytes: Uint8Array): Uint8Array {
  return concat([varint((field << 3) | 2), varint(bytes.length), bytes]);
}

function fieldString(field: number, value: string): Uint8Array {
  return fieldBytes(field, textEncoder.encode(value));
}

function message(parts: Uint8Array[]): Uint8Array {
  return concat(parts);
}

function packedFloat32(values: number[]): Uint8Array {
  const output = new Uint8Array(values.length * 4);
  const view = new DataView(output.buffer);
  values.forEach((value, index) => view.setFloat32(index * 4, value, true));
  return output;
}

// TensorShapeProto.Dimension: dim_value = 1
function shapeDimension(value: number): Uint8Array {
  return message([fieldVarint(1, value)]);
}

// TensorShapeProto: dim = 1 repeated
function tensorShape(shape: number[]): Uint8Array {
  return message(
    shape.map(dimension => fieldBytes(1, shapeDimension(dimension)))
  );
}

// TypeProto.Tensor: elem_type = 1 (FLOAT), shape = 2
function tensorType(shape: number[]): Uint8Array {
  const tensor = message([
    fieldVarint(1, 1),
    fieldBytes(2, tensorShape(shape)),
  ]);
  return message([fieldBytes(1, tensor)]);
}

// ValueInfoProto: name = 1, type = 2
function valueInfo(name: string, shape: number[]): Uint8Array {
  return message([fieldString(1, name), fieldBytes(2, tensorType(shape))]);
}

// TensorProto: dims = 1 repeated int64, data_type = 2, float_data = 4 packed, name = 8
function tensorInitializer(initializer: TensorInitializer): Uint8Array {
  const expectedLength = initializer.shape.reduce(
    (total, dimension) => total * dimension,
    1
  );
  if (expectedLength !== initializer.values.length) {
    throw new Error(
      `Initializer ${initializer.name} expects ${expectedLength} Float32 values but received ${initializer.values.length}.`
    );
  }
  return message([
    ...initializer.shape.map(dimension => fieldVarint(1, dimension)),
    fieldVarint(2, 1),
    fieldBytes(4, packedFloat32(initializer.values)),
    fieldString(8, initializer.name),
  ]);
}

// AttributeProto: name = 1, i = 3, type = 20 (INT = 2)
function integerAttribute(name: string, value: number): Uint8Array {
  return message([
    fieldString(1, name),
    fieldVarint(3, value),
    fieldVarint(20, 2),
  ]);
}

// NodeProto: input = 1, output = 2, name = 3, op_type = 4, attribute = 5
function operationNode(
  edge: TensorEdge,
  sourceValue: string,
  basisValue: string
): Uint8Array {
  const attributes =
    edge.op === "Concat"
      ? [
          fieldBytes(
            5,
            integerAttribute(
              "axis",
              Math.max(0, (edge.outputShape?.length ?? 1) - 1)
            )
          ),
        ]
      : [];
  const inputs =
    edge.op === "Relu"
      ? [fieldString(1, sourceValue)]
      : [fieldString(1, sourceValue), fieldString(1, basisValue)];
  return message([
    ...inputs,
    fieldString(2, edge.to),
    fieldString(3, `op_${edge.id.slice(0, 8)}`),
    fieldString(4, edge.op),
    ...attributes,
  ]);
}

function orderedValidEdges(graph: GraphState): TensorEdge[] {
  const index = makeGraphIndex(graph);
  const valid = graph.edges.filter(edge => edge.valid);
  const incoming = new Map<string, TensorEdge>();
  valid.forEach(edge => incoming.set(edge.to, edge));
  const ordered: TensorEdge[] = [];
  const visited = new Set<string>();

  const visit = (nodeId: string) => {
    const edge = incoming.get(nodeId);
    if (!edge || visited.has(edge.id)) return;
    visit(edge.from);
    visited.add(edge.id);
    ordered.push(edge);
  };

  index.nodes.forEach((_, nodeId) => visit(nodeId));
  return ordered;
}

function resolvedShape(
  node: TensorNode,
  incoming: Map<string, TensorEdge>
): number[] {
  return incoming.get(node.id)?.outputShape ?? node.shape;
}

/**
 * Produces a valid ONNX ModelProto with Float tensor inputs and inferred operation nodes.
 * A target node acts as the operation's browser-visible operand basis; its resolved value
 * becomes the output of the incoming operation, allowing a subsequent connection to form a DAG.
 */
export function buildOnnxModel(
  graph: GraphState,
  options: { trace?: boolean } = {}
): Uint8Array {
  const invalid = graph.edges.find(edge => !edge.valid);
  if (invalid)
    throw new Error(
      `Cannot export while an invalid connection exists: ${invalid.reason ?? "shape conflict"}`
    );

  const index = makeGraphIndex(graph);
  const edges = orderedValidEdges(graph);
  const incoming = new Map<string, TensorEdge>();
  edges.forEach(edge => incoming.set(edge.to, edge));
  const nodes = edges.map(edge => {
    const sourceName = edge.from;
    const targetBasis = `${edge.to}__basis`;
    return fieldBytes(1, operationNode(edge, sourceName, targetBasis));
  });

  const initializerNames = new Set(
    graph.initializers.map(initializer => initializer.name)
  );
  const inputs = graph.nodes.flatMap(node => {
    const sourceEdge = incoming.get(node.id);
    const isDerived = Boolean(sourceEdge);
    const needsBasis = Boolean(sourceEdge && sourceEdge.op !== "Relu");
    const name = isDerived ? `${node.id}__basis` : node.id;
    if (!isDerived) return [fieldBytes(11, valueInfo(name, node.shape))];
    if (!needsBasis || initializerNames.has(name)) return [];
    return [fieldBytes(11, valueInfo(name, node.shape))];
  });

  const terminalNodes = graph.nodes.filter(
    node => !index.outgoing.get(node.id)?.some(edge => edge.valid)
  );
  const traceNodes = options.trace
    ? graph.nodes
    : terminalNodes.length
      ? terminalNodes
      : graph.nodes;
  const outputs = traceNodes.map(node =>
    fieldBytes(12, valueInfo(node.id, resolvedShape(node, incoming)))
  );

  // GraphProto: node = 1, name = 2, input = 11, output = 12
  const graphProto = message([
    ...nodes,
    fieldString(2, "tensor_synthesizer_graph"),
    ...graph.initializers.map(initializer =>
      fieldBytes(5, tensorInitializer(initializer))
    ),
    ...inputs,
    ...outputs,
  ]);

  // OperatorSetIdProto: version = 2. Empty domain selects the standard ai.onnx domain.
  const opsetImport = message([fieldVarint(2, 18)]);
  // ModelProto: ir_version = 1, producer_name = 2, producer_version = 3, graph = 7, opset_import = 8
  return message([
    fieldVarint(1, 10),
    fieldString(2, "TensorSynthesizer"),
    fieldString(3, "0.1.0-browser"),
    fieldBytes(7, graphProto),
    fieldBytes(8, opsetImport),
  ]);
}

export function downloadBytes(
  bytes: Uint8Array,
  filename: string,
  type: string
) {
  const blob = new Blob([bytes], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadOnnx(graph: GraphState) {
  downloadBytes(
    buildOnnxModel(graph),
    "tensor-synthesis.onnx",
    "application/octet-stream"
  );
}

/** Emits the standard ONNX binary plus an intentionally separate comment manifest for onnx.js-oriented workflows. */
export function downloadOnnxJsArtifacts(graph: GraphState) {
  downloadBytes(
    buildOnnxModel(graph),
    "synshape-model.onnx",
    "application/octet-stream"
  );
  const index = makeGraphIndex(graph);
  const manifest = {
    format: "synshape.onnxjs-sidecar/v1",
    model: "synshape-model.onnx",
    note: "The .onnx file is a standard ModelProto. This sidecar preserves Synshape UI annotations; it is not part of the ONNX binary.",
    nodes: graph.nodes.map(node => ({
      id: node.id,
      label: node.label,
      shape: node.shape,
      source: node.sourceMode,
      position: node.position,
    })),
    routes: graph.edges.map(edge => ({
      from: edge.from,
      to: edge.to,
      operator: edge.op,
      valid: edge.valid,
      shape: edge.outputShape,
      sourceLabel: index.nodes.get(edge.from)?.label,
      targetLabel: index.nodes.get(edge.to)?.label,
    })),
    initializers: graph.initializers.map(({ name, shape }) => ({
      name,
      shape,
      type: "float32",
    })),
  };
  downloadBytes(
    new TextEncoder().encode(JSON.stringify(manifest, null, 2)),
    "synshape-model.onnx.js-manifest.json",
    "application/json"
  );
}

export interface BrowserValidationResult {
  provider: "WASM";
  durationMs: number;
}

export interface InMemoryExecutionResult {
  provider: "WEBNN" | "WASM";
  durationMs: number;
  outputs: Record<string, number[]>;
}

/** Loads generated bytes into ONNX Runtime Web. No model inference or graph data leaves the browser. */
export async function validateOnnxInBrowser(
  graph: GraphState
): Promise<BrowserValidationResult> {
  const startedAt = performance.now();
  const bytes = buildOnnxModel(graph);
  const ort = await import("onnxruntime-web");
  const session = await ort.InferenceSession.create(bytes, {
    executionProviders: ["wasm"],
  });
  await session.release();
  return { provider: "WASM", durationMs: performance.now() - startedAt };
}

function executionInputs(graph: GraphState, telemetry: Float32Array) {
  const incoming = new Map(
    graph.edges.filter(edge => edge.valid).map(edge => [edge.to, edge])
  );
  const initializerNames = new Set(
    graph.initializers.map(initializer => initializer.name)
  );
  return graph.nodes.flatMap(node => {
    const edge = incoming.get(node.id);
    const derived = Boolean(edge);
    const basis = Boolean(edge && edge.op !== "Relu");
    const name = derived ? `${node.id}__basis` : node.id;
    if ((derived && !basis) || initializerNames.has(name)) return [];
    const size = node.shape.reduce((total, dimension) => total * dimension, 1);
    const live =
      /telemetry|stream/i.test(node.id) || /telemetry|stream/i.test(node.label);
    const data = live
      ? new Float32Array(
          Array.from(
            { length: size },
            (_, index) => telemetry[index % telemetry.length] ?? 0
          )
        )
      : new Float32Array(size);
    return [{ name, shape: node.shape, data }];
  });
}

/** Executes a generated model directly from memory. WebNN is opportunistic; WASM is the local compatibility fallback. */
export async function executeOnnxInMemory(
  graph: GraphState,
  telemetry: Float32Array,
  trace = false
): Promise<InMemoryExecutionResult> {
  const bytes = buildOnnxModel(graph, { trace });
  const startedAt = performance.now();
  let runtime: typeof import("onnxruntime-web");
  let provider: "WEBNN" | "WASM" = "WASM";
  let session: import("onnxruntime-web").InferenceSession;
  try {
    if (!("ml" in navigator)) throw new Error("WebNN is unavailable.");
    runtime = await import("onnxruntime-web/all");
    session = await runtime.InferenceSession.create(bytes, {
      executionProviders: [
        {
          name: "webnn",
          deviceType: "npu",
          powerPreference: "high-performance",
        },
      ],
    });
    provider = "WEBNN";
  } catch {
    runtime = await import("onnxruntime-web");
    session = await runtime.InferenceSession.create(bytes, {
      executionProviders: ["wasm"],
    });
  }
  const feeds: Record<string, import("onnxruntime-web").Tensor> = {};
  executionInputs(graph, telemetry).forEach(input => {
    feeds[input.name] = new runtime.Tensor("float32", input.data, input.shape);
  });
  const results = await session.run(feeds);
  const outputs: Record<string, number[]> = {};
  Object.entries(results).forEach(([name, tensor]) => {
    outputs[name] = Array.from((tensor.data as Float32Array).slice(0, 8));
  });
  await session.release();
  return { provider, durationMs: performance.now() - startedAt, outputs };
}
