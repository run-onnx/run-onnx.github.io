/**
 * Synshape Tensor Synthesizer
 * 
 * @copyright Copyright (c) 2026 Michael Barlozewski. All rights reserved.
 * @contact   g.dev/avx
 * 
 * PROPRIETARY & CONFIDENTIAL
 * Unauthorized copying, modification, or distribution of this software 
 * via any medium is strictly prohibited.
 */

import { describe, expect, it } from "vitest";
import { buildOnnx, inspectOnnx } from "./Home";

describe("Tensor ONNX round trip", () => {
  it("liest lokal erzeugte Werte, Graph-Operatoren und Codex-Metadaten wieder ein", () => {
    const model = buildOnnx({
      dtype: "float32",
      dims: [2, 2],
      op: "Tanh",
      amplitude: 0.8,
      seed: 81,
      realValues: [0.25, -0.5, 1.25, 0],
      codex: [
        {
          id: "knowledge",
          name: "kern.txt",
          type: "TEXT",
          content: "Materialisierte Mathematik",
          size: 26,
        },
      ],
    });
    const imported = inspectOnnx(model, "roundtrip.onnx");

    expect(imported.supported).toBe(true);
    expect(imported.tensor?.dims).toEqual([2, 2]);
    expect(imported.tensor?.values).toEqual([0.25, -0.5, 1.25, 0]);
    expect(imported.nodeOps.map(entry => entry.op)).toContain("Tanh");
    expect(imported.metadata).toContainEqual({
      key: "tensor.codex.0.name",
      value: "kern.txt",
    });
  });
});
