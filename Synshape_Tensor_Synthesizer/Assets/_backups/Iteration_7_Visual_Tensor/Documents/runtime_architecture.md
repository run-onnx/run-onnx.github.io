# Synshape runtime architecture

## Trust and execution boundary

Synshape has two explicitly separate execution planes. The **ONNX plane** accepts only the portable subset implemented by the browser exporter and the importer: typed Float32 values, tensor shapes, initializers, and standard `Add`, `MatMul`, `Relu`, and `Conv` nodes. The **Synshape plane** executes editor-local mathematical modules and live telemetry transforms. A runtime trace makes both planes visible, and sidecar modules are never silently written as apparently portable standard ONNX nodes.

## Import and rehydration

The importer reads an in-memory `.onnx` `ArrayBuffer` using a deliberately narrow protobuf decoder. It supports the wire fields emitted by Synshape and standard GraphProto nodes with the named operator subset. It produces `GraphState`, retains initializers, creates projected canvas positions using a deterministic layered layout, and reports unsupported nodes rather than discarding them. An imported model executes in memory; it is not uploaded.

## Execution loop

The execution adapter first attempts ONNX Runtime Web’s WebNN provider only where `navigator.ml` is exposed. It then tries the generic WebAssembly provider, which is the expected compatibility path. Sessions are created from the generated `Uint8Array` without a disk round trip. A run is attempted only when all required graph inputs can be synthesized: live telemetry input receives `[1, 4]` Float32 data; other inputs use a deterministic zero tensor or matching initializer.

## Sensor stream

Every pointer sample updates a stable `Float32Array([x, y, pressure, velocity])`. When Live Stream is armed, samples are scheduled through `requestAnimationFrame` so pointer bursts do not create unbounded runtime work. The status panel records provider, sample sequence, timing, and inference status. This is a live, typed input stream—not a claim that every arbitrary graph is a valid recurrent model.

## Mathematics and protection

Kahan sum, discrete Feynman matrix, and Max-Born probability are registered **Synshape math modules**. They execute as transparent local Float32 transforms, produce documented arrays, and may be replaced by a browser-safe WASM function through a defined adapter. The protection control implements optional, standards-based AES-GCM package encryption with a user-entered passphrase; its disclosure states that no browser-only mechanism can prevent the user controlling a delivered client from inspecting runnable code or decrypted data.
