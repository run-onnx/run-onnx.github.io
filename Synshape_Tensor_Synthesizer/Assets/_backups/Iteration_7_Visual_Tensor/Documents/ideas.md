# Tensor Synthesizer — Design Direction

## Three visual approaches

| Theme Name              | Very Brief Intro                                                                                                                                                                                                | Probability |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Chromatic Field Lab** | A warm, editorial laboratory surface in parchment, graphite, and spectral primaries. It treats tensors as physical research artefacts rather than generic dashboard cards.                                      | 0.07        |
| **Signal Cartography**  | A nocturnal scientific instrument aesthetic built around a deep graphite spatial field, incisive grid lines, and a single electric lime signal. It makes topology, dimension, and validity legible at a glance. | 0.04        |
| **Kinetic Blueprint**   | A bright technical blueprint with blueprint blue, printed annotations, and open drafting-space composition. The interface feels like a meticulous analogue-to-digital design bench.                             | 0.09        |

## Chosen approach — Signal Cartography

### Design Movement

**Scientific instrument design meets Swiss information graphics.** The product should feel like an observability console for high-dimensional matter: precise, spatial, quiet, and intensely legible rather than conventionally futuristic.

### Core Principles

1. **Topology before chrome:** The workspace always dominates; utility surfaces reveal supporting state without obscuring the graph.
2. **Signal is semantic:** Acid lime denotes valid, live, and actionable states; coral denotes invalidity; ice blue denotes structural data and projection.
3. **Layered spatiality:** Fine dot-fields, horizon lines, and translucent inspection planes establish depth without resorting to decorative gradients.
4. **Evidence in every control:** Telemetry, tensor shapes, operator inference, and graph health must always be visible as compact factual labels.

### Color Philosophy

The near-black graphite field keeps the canvas optically calm and makes drawn tensor geometry the source of visual energy. **Signal lime (`#C8FF5A`)** is the ownable brand color: it signals a connection that is both mathematically valid and ready for export. Icy cyan maps neutral geometry and coral signals incompatibility; these exceptions stay scarce so validation remains immediate.

### Layout Paradigm

Use an **instrument-console perimeter**: a narrow vertical left rail for graph controls, a full-bleed central spatial stage, and a floating right-hand inspector that can collapse on smaller screens. The canvas is never placed inside a centered card. Dense controls inhabit edges; thought and movement inhabit the center.

### Signature Elements

- A **polar coordinate reticle** that follows the active tensor node and hints at nD projection.
- **Dimension rails**: tiny stacked bars beside a node that encode each rank dimension as a visually measurable glyph.
- An **electrocardiogram edge**: active connections use a short animated pulse travelling along a path, but only while the graph is changing.

### Interaction Philosophy

Interactions behave like operating laboratory equipment: deliberate pointer-down creates matter, a short drag between ports creates a hypothesis, and real-time validation resolves the hypothesis instantly. Keyboard actions are crisp and animation-free; spatial actions have short inertial feedback. Touch input uses the same pointer event pipeline as pen input and preserves pressure data when supplied by hardware.

### Animation

Connection and selection transitions use transform/opacity under 220 ms with a sharp `cubic-bezier(0.23, 1, 0.32, 1)` exit. Valid edges receive a single 900 ms travelling pulse after creation, then become still. The live telemetry bar changes at request-animation-frame cadence, while React state uses throttled updates to avoid making drawing feel coupled to component rendering. All nonessential motion disables under `prefers-reduced-motion`.

### Typography System

**Space Grotesk** handles display labels and node titles with firm geometric weight; **IBM Plex Mono** carries shapes, tensor types, telemetry, and all numeric information. Page labels use uppercase tracked mono at 10–11 px; module headings use Space Grotesk at 14–16 px; tensor titles use 700 weight but never exceed 18 px.

### Brand Essence

**Tensor Synthesizer turns embodied input into inspectable, exportable neural computation for engineers who think spatially.**

Personality: **precise, kinetic, lucid**.

### Brand Voice

Headlines should be terse and operational; CTAs should name the concrete operation; microcopy should report an observed state, not sell a promise.

> “Draw a surface. Resolve its rank.”

> “Graph valid — serialize model.”

### Wordmark & Logo

The logo is an asymmetric **four-axis tensor knot**: three narrow orthogonal planes folded around a high-contrast lime core. It is symbol-only in the interface, paired with a letterspaced Space Grotesk wordmark when needed. The favicon uses the same knot at an unmistakable 20 px scale.

### Signature Brand Color

**Tensor Lime — `#C8FF5A`**

## Prototype architecture decisions

The application keeps a **canonical immutable graph state** in memory. Nodes hold a synthetic tensor descriptor, drawing telemetry summary, projection position, and typed role (`tensor` or `rag`). Edges hold source, target, inferred operator, and a compatibility result. A local `Map` provides O(1) node and edge lookup; adjacency sets provide incremental cycle detection before accepting a connection.

Pointer telemetry is recorded in a ref during drawing, rendered by a 2D canvas at animation-frame cadence, and reduced at stroke completion to tensor rank and dimensions. In the prototype, the drawing mode maps deliberate geometry as follows: line → `[batch, length]`; surface → `[batch, height, width]`; volume → `[batch, depth, height, width]`; nD → `[batch, ...customDims]`. Pressure controls the batch proxy and average velocity controls a quantized latent/depth proxy. This is intentionally deterministic and inspectable.

Operator inference prioritizes exact shape match (`Add`), valid 2D/1D matrix contraction (`MatMul`), vector-to-higher-rank expansion (`Concat`), and otherwise records an explicit invalid transform. Shape validation runs as edge data changes, permitting broadcasting for `Add` and canonical inner-dimension matching for `MatMul`.

The exporter writes raw protobuf wire format without a protobuf runtime. It emits an ONNX `ModelProto` with an `opset_import`, `GraphProto`, `NodeProto` edges, typed input `ValueInfoProto` descriptors, and an output descriptor. Unsupported graph constructs are represented visibly rather than silently coerced. The browser creates a `Blob` and prompts an immediate local download; no graph or telemetry leaves the browser.

## Style Decisions

- **Synshape is the official product identity** for the rebranded instrument. “Tensor Synthesizer” remains the descriptive category phrase, not a competing visible product name.
- The four-axis tensor knot pairs with a letterspaced **Space Grotesk** wordmark in all branded surfaces. IBM Plex Mono remains limited to measured machine state.
- Valid graph routes use an unmistakable **double-line signal**: a quiet cyan structural conduit plus a short travelling Tensor-Lime pulse.
- Der First-Graph-Einstieg ist eine **in-field calibration plane** am Rand der räumlichen Fläche: ein operatives Readout, kein zentriertes Marketing-Modal.
- **Tensor Lime** bleibt ausschließlich Signal für gültige, aktive oder explizit ausführbare Zustände; neutrale Aufmerksamkeit entsteht über Cyan, Kontrast und Typografie.
- Das Zentrum trägt sichtbar die **Synshape Cartography**: polare Cyan-Rasterung, Reticle und die doppellinige valide Route erscheinen als wiedererkennbare Messgeometrie, nicht als dekorative Kartenhintergrund.
- Header und Perimeter behandeln Synshape als primäre Instrumentenidentität. Neutrale Bedienelemente sind Cyan/Graphit-Readouts; nur echte Ausführung und Validität erhalten Tensor Lime.
