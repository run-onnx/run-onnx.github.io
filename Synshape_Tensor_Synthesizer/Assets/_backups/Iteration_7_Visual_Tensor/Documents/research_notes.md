# Verified research notes — Tensor Synthesizer brand and positioning

## Existing category anchors

The ONNX project groups its ecosystem into model construction, deployment, optimization, and visualization. In the visualization category it explicitly lists **Netron**, **VisualDL**, and **Zetane Viewer** as ways to better understand a model through its computational graph. This establishes visual graph inspection as a familiar user expectation rather than a new category.

Netron describes itself as a **viewer** for neural network, deep learning, and machine learning models, supporting ONNX plus many other model formats and providing a browser version. The verified description supports a clear distinction: Netron is a post-hoc inspection product, whereas this application is a browser-native **pre-compiler** for authoring a tensor graph directly from embodied/spatial interaction.

## Positioning implication

The product should not claim there are no visual ONNX tools. Its supportable unique claim is narrower and stronger: it is a **gesture-native, local-first tensor authoring instrument** that resolves pointer telemetry into typed shape descriptors, exposes operation compatibility before model serialization, and emits ONNX without an application backend. This moves the language from a potentially unverifiable category-superlative to a specific product mechanism and benefit.

## Sources consulted

1. ONNX Supported Tools — https://onnx.ai/supported-tools.html
2. Netron repository and product description — https://github.com/lutzroeder/Netron

## Local verification and initializer roadmap

ONNX Runtime Web officially supports import through `onnxruntime-web`; its documentation also specifies WebGPU and experimental WebNN import paths. The compatibility table lists WebAssembly as broadly available across the named browser platforms and calls WebGPU preferable to WebGL for performance, while WebNN remains experimental and more constrained. This supports an implementation that performs model-load validation locally with a WebAssembly-first fallback and opportunistically selects WebGPU where the browser exposes it.

The ONNX documentation states that ONNX is based on protobuf, is strongly typed, and requires shapes and types for graph inputs and outputs. Its model-construction guidance treats graph inputs, nodes, graph, and model as named constituents; it also documents model serialization via protobuf. Initializer support in this product should therefore serialize `TensorProto` messages onto the repeated `GraphProto.initializer` field and let the UI import/export explicit named constants, rather than model them as an opaque product-only concept.

3. ONNX Runtime Web — https://onnxruntime.ai/docs/get-started/with-javascript/web.html
4. ONNX with Python — https://onnx.ai/onnx/intro/python.html

## Naming-screen result

The digital collision exploration suggests rejecting **Tensora** because active AI/software results surfaced, rejecting **Tensorium** because multiple AI/consulting and infrastructure results surfaced, and avoiding **Tensym** because it is strongly associated with the IEEE TENSYMP symposium. The recommended direction is **Synshape** (synthesis + shape). Search results did not show a direct AI-software product collision for this spelling. This result is a marketing-screen observation only; it must not be represented as trademark, corporate-name, or domain availability clearance.
