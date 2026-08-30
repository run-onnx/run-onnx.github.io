/** Synshape math plane: local deterministic Float32 modules, intentionally outside portable ONNX export. */
export type MathModuleId = "kahan" | "feynman" | "born" | "wasm";
export interface MathModule {
  id: MathModuleId;
  label: string;
  detail: string;
  run: (input: Float32Array) => Float32Array;
}
const kahan = (input: Float32Array) => {
  let sum = 0;
  let compensation = 0;
  for (let index = 0; index < input.length; index += 1) {
    const y = input[index] - compensation;
    const t = sum + y;
    compensation = t - sum - y;
    sum = t;
  }
  return new Float32Array([sum]);
};
const feynman = (input: Float32Array) => {
  const x = input[0] ?? 0;
  const y = input[1] ?? 0;
  const p = input[2] ?? 0;
  const v = input[3] ?? 0;
  return new Float32Array([x * x - y * y, 2 * x * y, p + v, p * v]);
};
const born = (input: Float32Array) => {
  const energy = Array.from(input, value => value * value);
  const total = energy.reduce((sum, value) => sum + value, 0) || 1;
  return new Float32Array(energy.map(value => value / total));
};
export const mathModules: MathModule[] = [
  {
    id: "kahan",
    label: "Kahan Σ",
    detail: "Compensated floating-point sum",
    run: kahan,
  },
  {
    id: "feynman",
    label: "Feynman Δ",
    detail: "Discrete four-component transform",
    run: feynman,
  },
  {
    id: "born",
    label: "Max-Born P",
    detail: "Normalized squared amplitudes",
    run: born,
  },
];

/**
 * WASM adapter contract: the module must export `synshape_transform(x, y, pressure, velocity)`.
 * It returns one scalar Float64/Float32-compatible numeric value and remains a Synshape sidecar,
 * not a portable ONNX custom operator.
 */
export async function loadWasmMathModule(
  bytes: ArrayBuffer,
  label: string
): Promise<MathModule> {
  const instantiated = await WebAssembly.instantiate(bytes, {});
  const candidate = instantiated.instance.exports.synshape_transform;
  if (typeof candidate !== "function")
    throw new Error(
      "WASM module must export synshape_transform(x, y, pressure, velocity)."
    );
  return {
    id: "wasm",
    label: label.slice(0, 18) || "Custom WASM",
    detail: "Imported local WASM scalar transform",
    run: input =>
      new Float32Array([
        Number(
          candidate(input[0] ?? 0, input[1] ?? 0, input[2] ?? 0, input[3] ?? 0)
        ),
      ]),
  };
}
