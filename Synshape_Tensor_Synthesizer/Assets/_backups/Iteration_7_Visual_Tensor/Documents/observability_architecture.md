# Synshape observability and interchange architecture

## Streaming history

The streaming timeline stores at most 48 local samples. Each sample is the first available scalar output from a successful in-memory run, together with its local `performance.now()` timestamp and execution provider. The bounded ring-style update prevents a pointer stream from creating unbounded React state or browser storage. A compact SVG polyline in the inspector shows the history; it is an observation surface, not persisted telemetry.

## Encrypted preset interchange

The preset library uses an explicit encrypted JSON envelope. A user-supplied passphrase derives an AES-256-GCM key through PBKDF2-SHA-256 using a cryptographically random salt; an independent random IV protects the payload encryption. Import requires the passphrase, verifies the envelope format, and replaces the library only after the decrypted payload passes a narrow graph-state validation. The passphrase is never retained.

## Canvas-native operator documentation

Clicking a route label in selection mode selects the edge and surfaces its operator card directly inside the spatial field. Cards describe the source and output shapes, the local inference rule, and whether the route is standard portable ONNX or a Synshape-only module. The card is a contextual explanation of the object under inspection; it does not replace the graph’s visual language.
