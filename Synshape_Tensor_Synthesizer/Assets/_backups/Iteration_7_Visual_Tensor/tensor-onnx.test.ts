import { describe, expect, it } from "vitest";
import { buildOnnxModel } from "./onnx";
import {
  createDemoGraph,
  createEdge,
  TensorNode,
  wouldCreateCycle,
} from "./tensor";

const node = (id: string, shape: number[]): TensorNode => ({
  id,
  label: id,
  kind: "tensor",
  sourceMode: "surface",
  shape,
  position: { x: 0.5, y: 0.5 },
  stroke: [],
  telemetry: {
    sampleCount: 0,
    pressure: 0,
    velocity: 0,
    pathLength: 0,
    duration: 0,
  },
});

describe("tensor graph inference", () => {
  it("infers a MatMul contraction and blocks a back-edge cycle", () => {
    const left = node("left", [2, 24, 32]);
    const right = node("right", [32, 64]);
    const graph = { nodes: [left, right], edges: [] };
    const edge = createEdge(left, right, graph);

    expect(edge).toMatchObject({
      op: "MatMul",
      valid: true,
      outputShape: [2, 24, 64],
    });
    expect(wouldCreateCycle({ ...graph, edges: [edge] }, "right", "left")).toBe(
      true
    );
  });
});

describe("minimal raw ONNX serializer", () => {
  it("emits a non-empty ModelProto containing the inferred operator", () => {
    const bytes = buildOnnxModel(createDemoGraph());
    const decoded = new TextDecoder().decode(bytes);

    expect(bytes.length).toBeGreaterThan(60);
    expect(decoded).toContain("MatMul");
    expect(decoded).toContain("tensor_synthesizer_graph");
    expect(decoded).toContain("TensorSynthesizer");
  });
});
