import { describe, expect, it } from "vitest";
import { mathModules } from "./mathModules";
import { buildOnnxModel } from "./onnx";
import { rehydrateOnnx } from "./onnxImport";
import { createPreset } from "./presets";
import { decryptedPresetLibrary, encryptedPresetLibrary } from "./security";
import { operatorDocs } from "./operatorDocs";
import { createDemoGraph } from "./tensor";

describe("ONNX rehydration boundary", () => {
  it("reconstructs a Synshape-exported portable graph and its initializer", () => {
    const source = createDemoGraph();
    const hydrated = rehydrateOnnx(buildOnnxModel(source));

    expect(hydrated.graph.nodes.length).toBeGreaterThan(1);
    expect(hydrated.graph.edges.some(edge => edge.op === "MatMul")).toBe(true);
    expect(hydrated.graph.initializers[0]).toMatchObject({
      name: "kernel-weight__basis",
      shape: [32, 64],
    });
  });
});

describe("Synshape math modules", () => {
  it("keeps Kahan, Feynman, and Born module outputs local and typed", () => {
    const input = new Float32Array([0.2, -0.4, 0.6, 0.8]);
    const outputs = mathModules.map(module => module.run(input));

    expect(outputs.every(output => output instanceof Float32Array)).toBe(true);
    expect(outputs[0][0]).toBeCloseTo(1.2, 5);
    expect(
      Array.from(outputs[2]).reduce((total, value) => total + value, 0)
    ).toBeCloseTo(1, 5);
  });
});

describe("trace and preset continuity", () => {
  it("exposes intermediate value names when a trace model is requested", () => {
    const bytes = buildOnnxModel(createDemoGraph(), { trace: true });
    const wireText = new TextDecoder().decode(bytes);

    expect(wireText).toContain("surface-input");
    expect(wireText).toContain("kernel-weight");
  });

  it("creates a browser-local named preset snapshot", () => {
    const graph = createDemoGraph();
    const preset = createPreset("Continuity pass", graph);

    expect(preset.name).toBe("Continuity pass");
    expect(preset.graph).toBe(graph);
    expect(preset.id).toBeTruthy();
  });

  it("round-trips a named preset library through the encrypted interchange envelope", async () => {
    const preset = createPreset("Secure exchange", createDemoGraph());
    const envelope = await encryptedPresetLibrary(
      [preset],
      "a local passphrase 2026"
    );
    const restored = await decryptedPresetLibrary(
      envelope,
      "a local passphrase 2026"
    );

    expect(restored).toHaveLength(1);
    expect(restored[0].name).toBe("Secure exchange");
  });

  it("rejects a preset library when the passphrase is wrong", async () => {
    const envelope = await encryptedPresetLibrary(
      [createPreset("Protected", createDemoGraph())],
      "a local passphrase 2026"
    );

    await expect(
      decryptedPresetLibrary(envelope, "a different local passphrase")
    ).rejects.toThrow();
  });
});

describe("operator documentation contract", () => {
  it("keeps standard routes and conflicts explicitly documented", () => {
    expect(operatorDocs.MatMul.class).toBe("ONNX STANDARD");
    expect(operatorDocs.MatMul.rule).toContain("inner dimension");
    expect(operatorDocs.Invalid.class).toBe("SYNSHAPE SIDECAR");
  });
});
