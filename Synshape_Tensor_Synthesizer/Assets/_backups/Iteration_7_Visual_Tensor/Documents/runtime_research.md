# Synshape runtime research — verified constraints

## In-memory execution

ONNX Runtime Web documents WebNN as a browser standard for accelerating neural networks through available on-device hardware, including GPU, CPU, and purpose-built accelerators such as NPUs. The documented configuration imports `onnxruntime-web/all` and uses the `webnn` execution provider explicitly; the provider options include preferred `deviceType` (`cpu`, `gpu`, `npu`) and `powerPreference`. Its documentation also describes MLTensor I/O binding, pre-allocated MLTensors, and keeping tensor data on WebNN MLTensors. This supports an authentic direct-buffer execution path, but WebNN is still behind an enablement flag in the stated browser availability guidance and must have a robust fallback.

## Custom mathematical operators

The official ONNX Runtime custom-operator path is native: the documentation describes C++ functions/structures, `Ort::CustomOpDomain`, `SessionOptions`, and custom-operator shared libraries that export `RegisterCustomOps`. It is not a browser-native JavaScript extension API for `onnxruntime-web`. Therefore the product must not represent browser-hosted Kahan, Feynman, or Born modules as exported standard ONNX custom operators that ONNX Runtime Web will execute.

The responsible browser design is a separate **Synshape math-module layer**. Each module is declared by an explicit visual contract, receives typed `Float32Array` input, performs transparent deterministic JavaScript or user-supplied browser-safe WASM computation, and returns a typed output. This layer can participate in the live editor and execution trace. Standard `Add`, `MatMul`, `Relu`, and `Conv` remain exportable ONNX nodes; math modules are exported as a clearly labeled Synshape sidecar manifest rather than as falsely portable ONNX operations.

## Sources

1. ONNX Runtime — Using WebNN: https://onnxruntime.ai/docs/tutorials/web/ep-webnn.html
2. ONNX Runtime — Custom operators: https://onnxruntime.ai/docs/reference/operators/add-custom-op.html

## Protection boundary

The W3C Web Cryptography API provides standard browser interfaces for hashing, key generation/derivation, encryption/decryption, signature operations, and `CryptoKey` management. It is an appropriate foundation for encrypting a user-selected local export or a session-private package with an explicitly supplied passphrase, and for deriving a non-secret session label from telemetry plus cryptographically strong browser randomness.

However, this cannot make a graph, micro-RAG asset, seed, or decryption routine that is delivered to the same browser permanently opaque to the person controlling that browser. OWASP explicitly warns that sensitive information hard-coded in client-side JavaScript can leak through the frontend. The correct product promise is therefore **local privacy and deliberate encrypted interchange**, not “stealth” or irreversible anti-reverse-engineering.

The product should use a transparent three-part protection model:

| Control                        | What it does                                                                                                              | What it does not do                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Memory hygiene**             | Avoids persistence by default; zeroes best-effort working buffers after use.                                              | Does not stop browser developer tools, process inspection, or copied values.                |
| **Optional encrypted package** | Encrypts a locally exported Synshape package with standards-based Web Crypto and a user-supplied secret.                  | Does not secure a model if the recipient has the decryption secret and can execute the app. |
| **Telemetry fingerprint**      | Produces a non-security label from gesture data mixed with `crypto.getRandomValues`; it is useful for session provenance. | It must never be claimed as entropy suitable for keys or as “Kyber” protection.             |

3. W3C — Web Cryptography Level 2: https://www.w3.org/TR/webcrypto-2/
4. OWASP — Review Web Page Content for Information Leakage: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/05-Review_Web_Page_Content_for_Information_Leakage
