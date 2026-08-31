<div align="center">
  <img src="./tensor-storage/tensor-mark_63462173.png" alt="Synshape Tensor Synthesizer Logo" width="120" height="120" style="border-radius: 20px; margin-bottom: 20px;" />
  <h1><a href="https://run-onnx.github.io">Synshape Tensor Synthesizer</a></h1>
  <p><strong>A Bionic, Zero-Backend ONNX Studio for Extreme Edge-Performance.</strong></p>
  <p><i>Created by <a href="https://micha1a.github.io">Michael Barlozewski</a></i></p>
</div>

---

## ⚡ Overview

The **Synshape Tensor Synthesizer** is a hyper-optimized, locally executing studio designed to construct, visualize, and export ONNX (Open Neural Network Exchange) tensor structures with zero latency. 

Built on a strict **"Bare-Metal O(1)"** philosophy, it completely bypasses traditional bloated backend architectures, running entirely in your browser via highly optimized **WebAssembly (WASM)**.

## 🚀 Why Synshape? (The Unfair Advantage)

While tools like *Google's Teachable Machine* or standard Python Jupyter environments rely on heavy cloud infrastructure, hidden API calls, or bloated runtime environments, Synshape takes a radically different approach:

- **100% Zero-Backend & Privacy First:** Absolutely no data is sent to external servers. Your tensors, models, and intellectual property never leave your machine.
- **The "Bionic" Interface (Zero Latency):** Normal UIs use dumb sliders and generic buttons. Synshape is *bionic* because it creates a direct biological interface between you and the tensor mathematics. It reads the physical friction, acceleration, and momentum of your fingers on the touchpad (ideomotorics) and feeds these analog, biological vectors—in real-time and without any latency—straight into the computational matrix of the neural network.
- **Codex Metadata Injection:** Embed your proprietary knowledge, JSON structures, or custom SVG data directly into the exported ONNX model's metadata—acting as a portable, intelligent payload.
- **Instant Edge-Deployment:** The exported models are lightweight, perfectly structured, and ready to be deployed on any edge device globally without further translation.


## 🔬 Core Features & Ecosystem

- **Heatmap-Lab / Matrix-Grid:** Visual inspection and direct live editing of tensor values via a synchronized 2D grid.
- **Compose Operation:** Advanced algorithmic merging of two compatible tensor models. Performs position-wise numerical averaging, logical OR for Booleans, and flawlessly merges metadata fragments.
- **Flow Lens:** Visual representation of data routes and graph logic. Displays inputs, operations, and outputs as readable, organic "mineral seams" between nodes.
- **Codex Metadata Storage:** A proprietary knowledge layer for enriching ONNX models. Merges text, JSON, and SVG fragments, visualizing data as "glass plate" voxel layers.
- **Mini-Models Persistence:** Local, categorized storage of model drafts and experiments directly in your browser's persistent `localStorage`.


## 🥊 Synshape vs. The Market

| Tool / Ecosystem | Primary Purpose | How Synshape is Different |
|------------------|-----------------|---------------------------|
| **Netron** | Static model architecture inspection and viewing. | Netron is a static viewer. Synshape is an **interactive design studio** where you actively shape and export the tensors. |
| **ONNX Runtime Web** | Model inference and JavaScript execution library. | Pure execution library. Synshape is the visual design environment built to construct the models you execute. |
| **Teachable Machine** | Simplified, no-code model training for beginners. | Abstracts the architecture entirely. Synshape exposes the low-level ONNX structure for raw control and understanding. |
| **Python ML Packages** | Heavy-scale development (PyTorch, TensorFlow). | Bloated, server/cloud-dependent. Synshape uses a **zero-backend**, 100% local approach without heavy dependencies or Cloud GPUs. |

## 🛠️ Technical Architecture

- **Frontend:** React 19, Vite 8, Tailwind CSS v4, Lucide Icons.
- **Execution Core:** Raw WebAssembly (WASM) for deterministic O(1) performance.

