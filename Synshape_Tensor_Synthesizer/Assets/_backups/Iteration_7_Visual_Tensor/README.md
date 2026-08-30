# Synshape

> **Draw a surface. Resolve the graph.**

**Synshape** is a browser-native, gesture-native tensor authoring instrument. It converts pointer, touch, or pen telemetry into typed tensor descriptors, lets users route those descriptors through a directed acyclic graph, exposes shape incompatibilities before export, and serializes a raw ONNX protobuf without an application backend.

The product is positioned as **gesture-native tensor authoring**, rather than as a model viewer. This distinction matters because established tools such as Netron are designed to inspect existing ML models, while the ONNX ecosystem presents visualizers as a way to understand a model’s computational graph. Synshape instead starts before an ONNX artifact exists and treats spatial input as the authoring medium. [1] [2]

## Product model

The canonical graph remains inside browser memory. Nodes are drawn tensor structures or micro-RAG contexts; edges carry an inferred operation and a compatibility result. The visual workspace uses a WebGL field and an animation-frame canvas pipeline, preserving responsive pointer interaction while React maintains the higher-level semantic state.

| Layer                | Responsibility                                                                                                                      | Browser-local behavior                                                           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Sensorik**         | Captures X/Y, pressure, velocity, sample count, path length, and duration.                                                          | Pointer events are summarized to generate shape descriptors.                     |
| **Tensor synthesis** | Resolves line, surface, volume, nD, and micro-RAG input into Float32 tensor shapes.                                                 | Shape generation is deterministic and runs in-memory.                            |
| **Graph router**     | Infers `Add`, `MatMul`, or `Concat` and prevents duplicate paths, ambiguous target inputs, and directed cycles.                     | Compatibility results appear immediately on the canvas.                          |
| **ONNX exporter**    | Emits `ModelProto`, `GraphProto`, `NodeProto`, value information, typed shape information, and optional `TensorProto` initializers. | A raw `.onnx` binary is created in a local `Blob` download.                      |
| **Runtime check**    | Loads the generated model through ONNX Runtime Web with the WebAssembly provider.                                                   | The model is not uploaded; the result only reflects local model-load acceptance. |

The ONNX design is strongly typed and uses protobuf to represent and serialize graph/model objects, which is why Synshape keeps names, shapes, and Float32 tensor declarations explicit throughout its exporter. [3]

## Brand system

The official product identity is **Synshape**. “Tensor Synthesizer” remains the descriptive product category, not a competing visible name. The signature mark is an asymmetric four-axis tensor knot: graphite planes surround a Tensor-Lime core with one cyan structural edge. The product wordmark uses **Space Grotesk**; shapes, operators, telemetry, and coordinates use **IBM Plex Mono**.

| Signal              | Meaning                                               | Color     |
| ------------------- | ----------------------------------------------------- | --------- |
| **Tensor Lime**     | Valid route, resolved action, export-ready state      | `#C8FF5A` |
| **Structural Cyan** | Tensor geometry, neutral topology, micro-RAG identity | `#75E5EF` |
| **Conflict Coral**  | Illegal shape route or rejected state                 | `#FF8388` |
| **Graphite**        | Quiet spatial field and instrument perimeter          | `#061117` |

The generated tensor-knot asset is used at navigation, favicon, and launch scale. Dedicated 16:9 and 9:16 launch imagery lets the brand introduction preserve compositional contrast in landscape and portrait instead of treating mobile as a cropped desktop asset.

## Interaction guide

When the three-and-a-half-second entry sequence completes, select a tensor mode and draw on the center field. A line generates `[batch, length]`; a surface generates `[batch, height, width]`; a volume adds a depth proxy; and nD mode uses an editable dimension formula such as `2 × 24 × 32 × 16 × 64`. In route mode, drag from one node to another. Synshape resolves the candidate operation, marks an illegal shape route in coral, and blocks cycle creation before it changes the DAG.

The **Focus field** control, as well as the compact control in the header, requests browser fullscreen for the central spatial stage. The header’s information control opens the product About panel, including the creator credit: [Micha | g.dev/avx](https://g.dev/avx).

Initializer exchange uses a small explicit JSON container:

```json
{
  "format": "synshape.initializers/v1",
  "initializers": [
    {
      "name": "kernel-weight__basis",
      "shape": [32, 64],
      "values": [0.01, -0.03]
    }
  ]
}
```

Every initializer is checked for a positive integer shape and a value count matching the product of its dimensions before it is accepted. On ONNX export, accepted values are emitted as a named Float32 `TensorProto` initializer.

## Local runtime verification

Selecting **Validate locally** serializes the current graph, dynamically loads ONNX Runtime Web, and creates a local inference session with the WebAssembly execution provider. ONNX Runtime Web documents WebAssembly as broadly supported across its browser matrix; it also documents WebGPU and experimental WebNN entry points. Synshape deliberately treats the present check as a **load-validation gate**, not an accuracy or performance benchmark. [4]

## Development

The application is a static React 19 + TypeScript + Tailwind 4 project. It has no product backend, database, or secret-dependent feature.

```bash
pnpm install
pnpm dev
pnpm run check
pnpm exec vitest run client/src/lib/tensor-onnx.test.ts
pnpm run build
```

The existing automated checks cover matrix-contraction inference, directed-cycle protection, and raw ONNX byte construction. The production build also includes the WASM binary required for optional local ONNX Runtime Web model loading.

## Naming research note

The product name was chosen after a preliminary marketing-oriented digital collision screen. It rejected obvious directions such as **Tensora** and **Tensorium** because active AI/software results were discoverable, and avoided **Tensym** due to the IEEE TENSYMP association. **Synshape** is a portmanteau of synthesis and shape, directly naming the product transformation. This is not trademark, corporate-name, or domain clearance; commercial use should be preceded by qualified searches in the jurisdictions and classes that matter to the owner.

## References

[1]: https://onnx.ai/supported-tools.html "ONNX — Supported Tools"
[2]: https://github.com/lutzroeder/Netron "Netron — Visualizer for neural network, deep learning and machine learning models"
[3]: https://onnx.ai/onnx/intro/python.html "ONNX — Model construction and serialization"
[4]: https://onnxruntime.ai/docs/get-started/with-javascript/web.html "ONNX Runtime Web — Get started"

## Runtime escalation — local execution environment

Synshape now has a distinct **runtime plane**. The `Import ONNX` control reads a local `.onnx` file directly as an `ArrayBuffer`, rehydrates the portable subset of its graph onto the spatial field, preserves Float32 initializers, and reports unsupported operators instead of silently converting them. The currently supported rehydration and export operators are `Add`, `MatMul`, `Concat`, `Relu`, and `Conv`.

| Runtime capability   | Behaviour                                                                                                         | Boundary                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Execution buffer** | Builds a raw ONNX `Uint8Array` and creates a session directly from memory.                                        | No export/download is required for the execution path.                                                  |
| **WebNN preference** | When `navigator.ml` is available, tries the WebNN provider with an NPU preference.                                | Browser availability and operator coverage are evolving; failed WebNN setup falls back to WASM. [5]     |
| **WASM fallback**    | Uses ONNX Runtime Web’s WebAssembly execution provider.                                                           | This is the compatibility execution path, not a benchmark claim.                                        |
| **Live stream**      | Maps each pointer sample to `Float32Array([x, y, pressure, velocity])` and schedules one run per animation frame. | A graph must have compatible inputs; streaming does not turn an arbitrary graph into a recurrent model. |
| **Runtime trace**    | Shows provider, elapsed time, first output preview, or a precise local error.                                     | No runtime input or model bytes are sent to a Synshape server.                                          |

### First graph and curated operators

On a new browser session, the field displays a compact **calibration plane**. It specifies the actual sequence: select a tensor gesture, draw on the pointer field, and route to validate an operator. The user can arm drawing immediately or dismiss the plane; the choice is stored only in browser `localStorage`.

The operator palette currently adds portable standard `Relu` and `Conv` routes. These remain standard ONNX graph operations. It does not disguise Synshape-only mathematical modules as standard ONNX operators.

### Micha math modules and custom WASM

**Kahan Σ**, **Feynman Δ**, and **Max-Born P** are intentionally labelled as local Synshape sidecar modules. They consume the four-element live telemetry tensor and return typed Float32 output. Their definitions are transparent: compensated summation, a deterministic four-component transform, and normalized squared amplitudes, respectively.

Users may attach a local WebAssembly module when it exports exactly `synshape_transform(x, y, pressure, velocity)`. The module executes inside the browser as a declared Synshape sidecar. It is not encoded as a portable ONNX custom operator because ONNX Runtime’s documented custom-operator path uses native C++ registration and shared libraries, not a pure browser-side JavaScript/WASM custom-op registration protocol. [6]

### Local package protection

`Export encrypted package` asks for a user-entered passphrase and creates an AES-256-GCM package in the browser using PBKDF2-SHA-256 with a random salt and IV. Synshape never retains the passphrase. A telemetry-and-browser-randomness digest creates a short **session label** for traceability only; telemetry is never treated as key material.

> **Important boundary:** This feature protects a downloaded package at rest. It does not promise to prevent reverse engineering of code or data already delivered to, decrypted by, or executed in a browser controlled by its user. The Web Crypto API provides standardized cryptographic primitives, while OWASP cautions that sensitive material included in client-side JavaScript can be exposed. [7] [8]

[5]: https://onnxruntime.ai/docs/tutorials/web/ep-webnn.html "ONNX Runtime — Using WebNN"
[6]: https://onnxruntime.ai/docs/reference/operators/add-custom-op.html "ONNX Runtime — Custom operators"
[7]: https://www.w3.org/TR/webcrypto-2/ "W3C — Web Cryptography Level 2"
[8]: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/05-Review_Web_Page_Content_for_Information_Leakage "OWASP — Review Web Page Content for Information Leakage"

## Product continuity — trace, presets, and annotated export

### Interactive execution trace

**Capture trace** rebuilds the current model with every graph node exposed as a temporary ONNX model output. The run remains in memory; the inspector then reveals a frame sequence containing the node label, declared shape, and the first eight Float32 values for each available output. The slider moves through those frames without repeating the inference call. **Refresh frames** reruns the model using the current `Float32Array([x, y, pressure, velocity])` telemetry sample.

The trace is intentionally a runtime inspection feature, not a promise that every graph is semantically meaningful. A missing input, incompatible graph, or browser-runtime limitation remains visible as a local runtime error rather than fabricated values.

### Named preset library

**Save preset** now creates a named graph snapshot in browser `localStorage`. A preset contains the complete graph state, including node positions, shapes, routes, initializers, and visual source modes. The inspector’s **Preset Library** loads or deletes those snapshots; no server account, synchronization layer, or telemetry upload is involved.

| Action              | Local result                                                          | Persistence boundary                |
| ------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| **Save preset**     | Prompts for a name and records a complete graph snapshot.             | The current browser profile only.   |
| **Load preset**     | Replaces the active in-memory graph with the selected named snapshot. | No network request.                 |
| **Delete preset**   | Removes the snapshot from the local preset library.                   | Deletion affects this browser only. |
| **Save raw preset** | Existing JSON-download path remains useful for manual backup.         | User-managed file.                  |

### ONNX + notes export

The **ONNX + notes** control downloads two files. `synshape-model.onnx` remains a standard binary `ModelProto` for compatible ONNX consumers. `synshape-model.onnx.js-manifest.json` is a deliberately separate annotation sidecar with node labels, source modes, spatial positions, inferred routes, shapes, and initializer descriptors. This approach keeps editor-specific meaning outside the interoperable ONNX binary while providing a useful handoff for an `onnx.js`-style browser workflow.

> The sidecar is **not** an ONNX standard and should travel alongside the `.onnx` file. Treat it as Synshape UI metadata, not as a required execution input.

## About panel parity

The in-app **About** panel is now synchronized with this README: it identifies Synshape as a browser-native tensor authoring **and execution** instrument, names direct-memory WebNN/WASM execution, local presets, raw ONNX plus annotation sidecar export, and explicitly labelled non-portable WASM math modules. It also carries the same honest encryption boundary: encrypted packages protect a downloaded file at rest, but browser-delivered code or decrypted data cannot be made permanently opaque to the person operating that browser.

## Observability and encrypted preset interchange

### Streaming inference timeline

When **Arm live stream** is active, Synshape samples the locally observed scalar output from successful in-memory inference runs. The inspector retains a bounded history of the latest 48 samples and plots it as a cyan **Stream Timeline**. This keeps observation work bounded during high-frequency pointer movement and avoids persisting gesture telemetry. The displayed provider and most recent scalar make it clear whether WebNN or the WASM fallback produced the visible sample.

The timeline is a local operational readout. It does not claim model accuracy, semantic validity, or reproducibility across browser execution providers. If a run fails, no invented sample is added.

### Encrypted preset-library exchange

The **Preset Library** now supports a whole-library encrypted transfer. **Export library** creates a `synshape-preset-library.encrypted.json` envelope; **Import library** asks for the passphrase, validates the decrypted envelope, and then stores the recovered preset array in the current browser profile.

| Envelope property | Meaning                                                                     |
| ----------------- | --------------------------------------------------------------------------- |
| `format`          | `synshape.encrypted-preset-library/v1` identifies the interchange contract. |
| `algorithm`       | AES-256-GCM encrypts and authenticates the payload.                         |
| `kdf`             | PBKDF2-SHA-256 derives the local key from the passphrase and a random salt. |
| `salt` / `iv`     | Fresh browser-random values accompany each exported package.                |
| `ciphertext`      | Contains the named graph snapshots only after successful decryption.        |

The passphrase is requested transiently and is never saved by Synshape. The package protects stored or transmitted preset content at rest; it does not make a graph permanently unreadable once a recipient imports and decrypts it inside a browser they control.

### Operator notes directly on the field

Set the interaction tool to **Select**, then click an operator label on a graph route. Synshape opens a contextual operator card in the spatial field. For standard ONNX routes, the card names the operation, states the relevant shape rule, and summarizes the local inference behavior. A conflict route identifies the failed contract explicitly. This lets the visual topology remain primary while bringing documentation to the exact object under inspection.

The card distinguishes **ONNX STANDARD** routes from **SYNSHAPE SIDECAR** concepts. In particular, the Micha mathematics modules and an attached custom WASM transform are local Synshape modules; they are never presented as portable ONNX custom operators.

## About panel parity, revision 0.5

The About panel now also names the encrypted library exchange, streaming timeline, and canvas-native operator notes. It remains deliberately compact: its purpose is to state what the application does locally and what it cannot guarantee, while this README remains the complete operating reference.

## Canvas-native graph search

The spatial field now includes a **local graph search** in its upper-right instrumentation band. It searches case-insensitively across node labels, stable node identifiers, declared tensor shapes, node kind/source mode, operator names, operator endpoint labels, and initializer names. Results remain entirely browser-local and are limited to twelve visible matches to keep selection fast in larger graphs.

| Result type | What is matched                                | Focus effect                                                          |
| ----------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| **NODE**    | Label, identifier, shape, kind, or source mode | Selects and cyan-rings the node.                                      |
| **OP**      | Operator type and source/target labels         | Rings the route and opens the contextual operator documentation card. |
| **INIT**    | Initializer name and declared shape            | Selects the node associated with the initializer when available.      |

The first match is preview-highlighted as soon as text is entered. Use **Arrow Down** and **Arrow Up** to traverse the result cursor, **Enter** to focus the active result, and **Escape** to clear the query. Selecting a route in the regular **Select** tool follows the same canvas-native operator-documentation path.

Search is an index over the active in-memory `GraphState`; it does not upload names, tensor shapes, metadata, or preset content. The Canvas highlight changes only rendering state, never the structure or validity of the ONNX graph.

## About panel parity, revision 0.6

The About panel now additionally identifies **local graph search + visual focus** as part of the Synshape instrument. It continues to describe only browser-local behavior and preserves the same explicit boundaries for encrypted exchange and non-portable Synshape sidecars.

## Final documentation set

Synshape ships with a separate, beginner-oriented operating manual in both plain-text and printable form. It is the recommended entry point for people who want to work with the instrument before reading implementation details in this README.

| Artifact                                              | Intended use                                                                     | Primary audience                         |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------- |
| `documentation/manual/synshape-betriebsanleitung.txt` | Searchable, copyable, editor-friendly reference.                                 | Users who want a quick local reference.  |
| `documentation/manual/typst/main.pdf`                 | Professionally typeset, printable operating manual.                              | Users, workshops, and project handovers. |
| `README.md`                                           | Technical product reference, boundaries, architecture, and development workflow. | Maintainers and advanced users.          |

The operating manual covers first graph creation, drawing modes, routing, validator states, search, ONNX import/export, initializers, local execution, streaming, trace, encrypted preset exchange, WASM sidecars, fullscreen use, mobile behavior, troubleshooting, and the privacy/security boundary. It deliberately uses the same vocabulary as the interface so a user can move directly between instruction and control.

## Recommended first-session path

For a low-friction first session, open the manual and follow its three-minute path: draw two `2D surface` tensors, create one route, read the validation state, save a named preset, and export only after the graph is valid. Then use the canvas search to retrieve the route by its operator or the node by a shape dimension. This sequence introduces Synshape as a spatial instrument rather than as a conventional form-based graph editor.

## Final operating boundary

Synshape is a **local-first browser application**. Its graph design, pointer telemetry, trace values, search index, presets, imported model bytes, and execution feed do not require a Synshape application backend. Exported files and imported packages remain under the control of the person who holds them. Therefore, encrypted preset interchange protects a package while it is stored or transferred, but cannot promise to conceal a package after a recipient decrypts it in a browser they control.

The product surface distinguishes portable ONNX artifacts from Synshape-only editor metadata and local sidecars. This distinction is intentional: standard ONNX is kept interoperable, while design-time annotations, visual positions, custom WASM transforms, and the Micha mathematics modules stay explicit rather than being presented as portable standard operators.
