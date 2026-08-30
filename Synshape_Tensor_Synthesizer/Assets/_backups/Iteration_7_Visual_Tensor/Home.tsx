/**
 * Signal Cartography implementation reminder: an instrument-console perimeter frames a full spatial stage.
 * Lime means valid/actionable, cyan maps structure, and coral exposes mathematical incompatibility.
 */
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import "@/continuity.css";
import "@/observability.css";
import {
  Box,
  BookMarked,
  Braces,
  CircleAlert,
  CircleCheck,
  Cpu,
  Download,
  Expand,
  FileDown,
  FileCode2,
  FileUp,
  GitFork,
  Info,
  LockKeyhole,
  Minimize2,
  MousePointer2,
  Network,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Save,
  Activity,
  Search,
  StepBack,
  StepForward,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  WandSparkles,
  Waves,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import AboutPanel from "@/components/AboutPanel";
import BrandIntro from "@/components/BrandIntro";
import GraphCanvas from "@/components/GraphCanvas";
import WebGLField from "@/components/WebGLField";
import { Button } from "@/components/ui/button";
import {
  downloadBytes,
  downloadOnnx,
  downloadOnnxJsArtifacts,
  executeOnnxInMemory,
  validateOnnxInBrowser,
} from "@/lib/onnx";
import { rehydrateOnnx } from "@/lib/onnxImport";
import { loadWasmMathModule, mathModules, MathModule } from "@/lib/mathModules";
import {
  createPreset,
  loadPresetLibrary,
  SynshapePreset,
  writePresetLibrary,
} from "@/lib/presets";
import {
  decryptedPresetLibrary,
  encryptedPresetLibrary,
  encryptedSynshapePackage,
  telemetrySessionLabel,
} from "@/lib/security";
import { operatorDocs } from "@/lib/operatorDocs";
import {
  createDemoGraph,
  createEdge,
  deriveTensorFromStroke,
  DrawMode,
  formatShape,
  GraphState,
  InteractionTool,
  labelForMode,
  makeGraphIndex,
  summarizeTelemetry,
  TelemetrySample,
  TensorEdge,
  TensorNode,
  wouldCreateCycle,
} from "@/lib/tensor";

const canvasBackdrop = "/tensor-storage/tensor-field-atlas_6c6cbccc.jpg";
const projectionTexture =
  "/tensor-storage/tensor-projection-surface_e47d3b6e.jpg";
const telemetryTexture = "/tensor-storage/telemetry-wavefield_49d54ca4.jpg";
const ragTexture = "/tensor-storage/rag-node-microcell_188bfdc6.jpg";
const logoTexture = "/tensor-storage/synshape-tensor-knot_0673d93c.png";

const drawModes: {
  value: DrawMode;
  label: string;
  hint: string;
  icon: typeof Waves;
}[] = [
  { value: "line", label: "1D line", hint: "[batch, length]", icon: Waves },
  {
    value: "surface",
    label: "2D surface",
    hint: "[batch, height, width]",
    icon: Braces,
  },
  {
    value: "volume",
    label: "3D volume",
    hint: "[batch, depth, h, w]",
    icon: Box,
  },
  {
    value: "nd",
    label: "nD projection",
    hint: "[batch, â€¦custom]",
    icon: Sparkles,
  },
  { value: "rag", label: "micro-RAG", hint: "[1, latent]", icon: Network },
];

const tools: {
  value: InteractionTool;
  label: string;
  icon: typeof MousePointer2;
}[] = [
  { value: "draw", label: "Draw", icon: Plus },
  { value: "select", label: "Select", icon: MousePointer2 },
  { value: "connect", label: "Route", icon: GitFork },
];

const operatorPalette = [
  { op: "Relu", note: "1 â†’ 1 activation", icon: Zap },
  { op: "Conv", note: "kernel route", icon: Braces },
] as const;

function parseDimensions(value: string) {
  const dimensions = value
    .split(/[Ã—x,\s]+/i)
    .filter(Boolean)
    .map(dimension => Number(dimension));
  return dimensions.length &&
    dimensions.every(
      dimension =>
        Number.isInteger(dimension) && dimension > 0 && dimension <= 4096
    )
    ? dimensions
    : null;
}

function downloadPreset(graph: GraphState) {
  const preset = JSON.stringify(
    {
      version: "0.1.0",
      createdAt: new Date().toISOString(),
      graph,
    },
    null,
    2
  );
  downloadBytes(
    new TextEncoder().encode(preset),
    "tensor-synthesis.preset.json",
    "application/json"
  );
}

export default function Home() {
  const [graph, setGraph] = useState<GraphState>(() => createDemoGraph());
  const [tool, setTool] = useState<InteractionTool>("draw");
  const [drawMode, setDrawMode] = useState<DrawMode>("surface");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    "surface-input"
  );
  const [liveSample, setLiveSample] = useState<TelemetrySample>({
    x: 0,
    y: 0,
    pressure: 0.5,
    velocity: 0,
    time: 0,
  });
  const [showIntro, setShowIntro] = useState(
    () => !new URLSearchParams(window.location.search).has("workspace")
  );
  const [showAbout, setShowAbout] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ndFormula, setNdFormula] = useState("2 Ã— 24 Ã— 32 Ã— 16 Ã— 64");
  const [browserValidation, setBrowserValidation] = useState<
    "idle" | "running" | "valid" | "invalid"
  >("idle");
  const [streaming, setStreaming] = useState(false);
  const [executionStatus, setExecutionStatus] = useState("IDLE");
  const [executionDetail, setExecutionDetail] = useState(
    "Arm a telemetry stream or execute one in-memory pass."
  );
  const [mathStatus, setMathStatus] = useState("Select a local math module.");
  const [wasmModule, setWasmModule] = useState<MathModule | null>(null);
  const [protectionStatus, setProtectionStatus] = useState(
    "No secret is stored in the browser."
  );
  const [presets, setPresets] = useState<SynshapePreset[]>(() =>
    loadPresetLibrary()
  );
  const [traceFrames, setTraceFrames] = useState<
    { id: string; label: string; shape: number[]; values: number[] }[]
  >([]);
  const [traceCursor, setTraceCursor] = useState(0);
  const [selectedEdge, setSelectedEdge] = useState<TensorEdge | null>(null);
  const [streamHistory, setStreamHistory] = useState<
    { time: number; value: number; provider: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCursor, setSearchCursor] = useState(0);
  const [showGuide, setShowGuide] = useState(
    () => window.localStorage.getItem("synshape.first-graph.seen") !== "true"
  );
  const initializerInputRef = useRef<HTMLInputElement>(null);
  const onnxInputRef = useRef<HTMLInputElement>(null);
  const wasmInputRef = useRef<HTMLInputElement>(null);
  const presetLibraryInputRef = useRef<HTMLInputElement>(null);
  const executionBusyRef = useRef(false);
  const executionFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 3500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const syncFullscreen = () =>
      setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    setSearchCursor(0);
  }, [searchQuery]);

  const graphIndex = useMemo(() => makeGraphIndex(graph), [graph]);
  const selectedNode = selectedNodeId
    ? (graphIndex.nodes.get(selectedNodeId) ?? null)
    : null;
  const invalidEdges = graph.edges.filter(edge => !edge.valid);
  const validEdges = graph.edges.filter(edge => edge.valid);
  const hasExportableGraph =
    graph.nodes.length > 0 && invalidEdges.length === 0;
  const liveTelemetry = useMemo(
    () => summarizeTelemetry([liveSample]),
    [liveSample]
  );
  const timelinePath = useMemo(() => {
    if (streamHistory.length < 2) return "";
    const values = streamHistory.map(sample => sample.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return streamHistory
      .map(
        (sample, index) =>
          `${index ? "L" : "M"}${(index / (streamHistory.length - 1)) * 100} ${38 - ((sample.value - min) / range) * 30}`
      )
      .join(" ");
  }, [streamHistory]);
  const selectedOperatorDoc = selectedEdge
    ? operatorDocs[selectedEdge.op]
    : null;
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query)
      return [] as {
        id: string;
        type: "NODE" | "OP" | "INIT";
        label: string;
        detail: string;
        nodeId?: string;
        edgeId?: string;
      }[];
    const nodes = graph.nodes.flatMap(node => {
      const haystack =
        `${node.label} ${node.id} ${node.kind} ${node.sourceMode} ${node.shape.join(" x ")}`.toLowerCase();
      return haystack.includes(query)
        ? [
            {
              id: `node-${node.id}`,
              type: "NODE" as const,
              label: node.label,
              detail: `${node.kind} Â· ${formatShape(node.shape)}`,
              nodeId: node.id,
            },
          ]
        : [];
    });
    const operators = graph.edges.flatMap(edge => {
      const source = graphIndex.nodes.get(edge.from)?.label ?? edge.from;
      const target = graphIndex.nodes.get(edge.to)?.label ?? edge.to;
      return `${edge.op} ${source} ${target}`.toLowerCase().includes(query)
        ? [
            {
              id: `edge-${edge.id}`,
              type: "OP" as const,
              label: edge.op.toUpperCase(),
              detail: `${source} â†’ ${target}`,
              edgeId: edge.id,
            },
          ]
        : [];
    });
    const initializers = graph.initializers.flatMap(initializer => {
      const linked = graph.nodes.find(node =>
        initializer.name.startsWith(`${node.id}__`)
      );
      return `${initializer.name} ${initializer.shape.join(" x ")}`
        .toLowerCase()
        .includes(query)
        ? [
            {
              id: `init-${initializer.id}`,
              type: "INIT" as const,
              label: initializer.name,
              detail: `Float32 Â· ${formatShape(initializer.shape)}`,
              nodeId: linked?.id,
            },
          ]
        : [];
    });
    return [...nodes, ...operators, ...initializers].slice(0, 12);
  }, [graph, graphIndex.nodes, searchQuery]);
  const activeSearchResult =
    searchResults[
      Math.min(searchCursor, Math.max(0, searchResults.length - 1))
    ] ?? null;
  const activeSearchNodeId =
    activeSearchResult && "nodeId" in activeSearchResult
      ? (activeSearchResult.nodeId ?? null)
      : null;
  const activeSearchEdgeId =
    activeSearchResult && "edgeId" in activeSearchResult
      ? (activeSearchResult.edgeId ?? null)
      : null;

  const addNode = (samples: TelemetrySample[]) => {
    const position = {
      x:
        samples.reduce((total, sample) => total + sample.x, 0) / samples.length,
      y:
        samples.reduce((total, sample) => total + sample.y, 0) / samples.length,
    };
    const formulaShape = drawMode === "nd" ? parseDimensions(ndFormula) : null;
    const descriptor = {
      ...deriveTensorFromStroke(drawMode, samples),
      ...(formulaShape ? { shape: formulaShape } : {}),
    };
    const node: TensorNode = {
      ...descriptor,
      id: crypto.randomUUID(),
      label: labelForMode(drawMode, graph.nodes.length + 1),
      position,
    };
    setGraph(previous => ({ ...previous, nodes: [...previous.nodes, node] }));
    setSelectedNodeId(node.id);
    toast.success(`${node.label} resolved`, {
      description: `${formatShape(node.shape)} from ${node.telemetry.sampleCount} pointer samples.`,
    });
  };

  const connect = (sourceId: string, targetId: string) => {
    if (wouldCreateCycle(graph, sourceId, targetId)) {
      toast.error("Cycle blocked", {
        description: "The browser graph remains a directed acyclic graph.",
      });
      return;
    }
    const source = graphIndex.nodes.get(sourceId);
    const target = graphIndex.nodes.get(targetId);
    if (!source || !target) return;
    const edge = createEdge(source, target, graph);
    setGraph(previous => ({ ...previous, edges: [...previous.edges, edge] }));
    setSelectedEdge(edge);
    setSelectedNodeId(targetId);
    if (edge.valid)
      toast.success(`${edge.op} inferred`, {
        description: `${formatShape(edge.outputShape ?? [])} output shape.`,
      });
    else toast.error("Connection conflict", { description: edge.reason });
  };

  const moveNode = (nodeId: string, position: { x: number; y: number }) => {
    setGraph(previous => ({
      ...previous,
      nodes: previous.nodes.map(node =>
        node.id === nodeId ? { ...node, position } : node
      ),
    }));
  };

  const deleteSelected = () => {
    if (!selectedNodeId) return;
    setGraph(previous => ({
      nodes: previous.nodes.filter(node => node.id !== selectedNodeId),
      edges: previous.edges.filter(
        edge => edge.from !== selectedNodeId && edge.to !== selectedNodeId
      ),
      initializers: previous.initializers,
    }));
    setSelectedNodeId(null);
    toast.message("Node removed from graph");
  };

  const exportGraph = () => {
    try {
      downloadOnnx(graph);
      toast.success("ONNX binary serialized", {
        description:
          "A raw local .onnx download was generated without a network request.",
      });
    } catch (error) {
      toast.error("Export blocked", {
        description:
          error instanceof Error
            ? error.message
            : "Unexpected serializer error.",
      });
    }
  };

  const toggleFullscreen = async () => {
    const workspace = document.querySelector<HTMLElement>(".spatial-stage");
    if (!workspace) return;
    if (document.fullscreenElement) await document.exitFullscreen();
    else await workspace.requestFullscreen();
  };

  const updateNdFormula = (formula: string) => {
    setNdFormula(formula);
    const shape = parseDimensions(formula);
    if (!shape || !selectedNode || selectedNode.sourceMode !== "nd") return;
    setGraph(previous => ({
      ...previous,
      nodes: previous.nodes.map(node =>
        node.id === selectedNode.id ? { ...node, shape } : node
      ),
    }));
  };

  const exportInitializers = () => {
    downloadBytes(
      new TextEncoder().encode(
        JSON.stringify(
          {
            format: "synshape.initializers/v1",
            initializers: graph.initializers,
          },
          null,
          2
        )
      ),
      "synshape-initializers.json",
      "application/json"
    );
    toast.success("Initializer package exported", {
      description: `${graph.initializers.length} Float32 tensors remain local until downloaded.`,
    });
  };

  const importInitializers = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const candidates: unknown[] = Array.isArray(parsed)
        ? parsed
        : parsed.initializers;
      if (!Array.isArray(candidates))
        throw new Error("Expected an initializer array.");
      const initializers = candidates.map(item => {
        if (!item || typeof item !== "object")
          throw new Error("Initializer payload must be an object.");
        const candidate = item as {
          id?: unknown;
          name?: unknown;
          shape?: unknown;
          values?: unknown;
        };
        if (!Array.isArray(candidate.shape) || !Array.isArray(candidate.values))
          throw new Error("Initializer requires shape and values arrays.");
        return {
          id:
            typeof candidate.id === "string"
              ? candidate.id
              : crypto.randomUUID(),
          name: String(candidate.name),
          shape: candidate.shape.map(Number),
          values: candidate.values.map(Number),
        };
      });
      initializers.forEach(initializer => {
        const expected = initializer.shape.reduce(
          (total, dimension) => total * dimension,
          1
        );
        if (
          !initializer.name ||
          !initializer.shape.length ||
          expected !== initializer.values.length ||
          initializer.values.some(value => !Number.isFinite(value))
        ) {
          throw new Error(
            `Initializer ${initializer.name || "unnamed"} has an invalid Float32 payload.`
          );
        }
      });
      setGraph(previous => ({ ...previous, initializers }));
      toast.success("Initializers imported", {
        description: `${initializers.length} named tensor constants are ready for ONNX export.`,
      });
    } catch (error) {
      toast.error("Initializer import rejected", {
        description:
          error instanceof Error ? error.message : "Invalid JSON file.",
      });
    } finally {
      event.target.value = "";
    }
  };

  const verifyInBrowser = async () => {
    setBrowserValidation("running");
    try {
      const result = await validateOnnxInBrowser(graph);
      setBrowserValidation("valid");
      toast.success("Runtime load validated", {
        description: `ONNX Runtime Web accepted the local model through ${result.provider} in ${result.durationMs.toFixed(0)} ms.`,
      });
    } catch (error) {
      setBrowserValidation("invalid");
      toast.error("Runtime validation failed", {
        description:
          error instanceof Error
            ? error.message
            : "Unknown local runtime error.",
      });
    }
  };

  const runInMemory = async (
    sample: TelemetrySample = liveSample,
    trace = false
  ) => {
    if (executionBusyRef.current || !hasExportableGraph) return;
    executionBusyRef.current = true;
    setExecutionStatus("RUNNING");
    try {
      const tensor = new Float32Array([
        sample.x,
        sample.y,
        sample.pressure,
        sample.velocity,
      ]);
      const result = await executeOnnxInMemory(graph, tensor, trace);
      setExecutionStatus(result.provider);
      const firstOutput = Object.entries(result.outputs)[0];
      setExecutionDetail(
        `${result.provider} accepted the in-memory ArrayBuffer in ${result.durationMs.toFixed(0)} ms${firstOutput ? ` Â· ${firstOutput[0]} [${firstOutput[1].map(value => value.toFixed(3)).join(", ")}]` : ""}`
      );
      if (trace) {
        const frames = Object.entries(result.outputs).map(([id, values]) => ({
          id,
          label: graphIndex.nodes.get(id)?.label ?? id,
          shape: graphIndex.nodes.get(id)?.shape ?? [values.length],
          values,
        }));
        setTraceFrames(frames);
        setTraceCursor(0);
      }
      if (
        streaming &&
        !trace &&
        firstOutput &&
        Number.isFinite(firstOutput[1][0])
      ) {
        setStreamHistory(previous => [
          ...previous.slice(-47),
          {
            time: performance.now(),
            value: firstOutput[1][0],
            provider: result.provider,
          },
        ]);
      }
    } catch (error) {
      setExecutionStatus("BLOCKED");
      setExecutionDetail(
        error instanceof Error
          ? error.message
          : "Local execution could not be started."
      );
    } finally {
      executionBusyRef.current = false;
    }
  };

  const handleTelemetry = (sample: TelemetrySample) => {
    setLiveSample(sample);
    if (!streaming || executionFrameRef.current !== null) return;
    executionFrameRef.current = requestAnimationFrame(() => {
      executionFrameRef.current = null;
      void runInMemory(sample);
    });
  };

  const importOnnx = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = rehydrateOnnx(new Uint8Array(await file.arrayBuffer()));
      setGraph(imported.graph);
      setSelectedNodeId(imported.graph.nodes[0]?.id ?? null);
      toast.success("ONNX graph rehydrated", {
        description: `${imported.graph.nodes.length} nodes Â· ${imported.graph.edges.length} routes${imported.unsupported.length ? ` Â· unsupported: ${imported.unsupported.join(", ")}` : ""}`,
      });
    } catch (error) {
      toast.error("ONNX import rejected", {
        description:
          error instanceof Error ? error.message : "Unsupported model bytes.",
      });
    } finally {
      event.target.value = "";
    }
  };

  const addOperator = (op: "Relu" | "Conv") => {
    const source = selectedNode ?? graph.nodes[graph.nodes.length - 1];
    if (!source) {
      toast.error("Select a source tensor first");
      return;
    }
    const node: TensorNode = {
      ...source,
      id: crypto.randomUUID(),
      label: `${op.toUpperCase()}-${String(graph.nodes.length + 1).padStart(2, "0")}`,
      position: {
        x: Math.min(0.84, source.position.x + 0.22),
        y: Math.min(0.82, source.position.y + 0.1),
      },
      stroke: [],
      telemetry: { ...source.telemetry },
    };
    const edge = {
      id: crypto.randomUUID(),
      from: source.id,
      to: node.id,
      op,
      valid: true,
      outputShape: source.shape,
    } as const;
    setGraph(previous => ({
      ...previous,
      nodes: [...previous.nodes, node],
      edges: [...previous.edges, edge],
    }));
    setSelectedNodeId(node.id);
    setSelectedEdge(edge);
    toast.success(`${op} operator placed`, {
      description: "Standard ONNX operator added to the portable graph.",
    });
  };

  const runMathModule = (id: MathModule["id"]) => {
    const module = [...mathModules, ...(wasmModule ? [wasmModule] : [])].find(
      item => item.id === id
    );
    if (!module) return;
    const output = module.run(
      new Float32Array([
        liveSample.x,
        liveSample.y,
        liveSample.pressure,
        liveSample.velocity,
      ])
    );
    setMathStatus(
      `${module.label}: [${Array.from(output)
        .map(value => value.toFixed(4))
        .join(", ")}] Â· local sidecar only`
    );
  };

  const importWasmModule = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const module = await loadWasmMathModule(
        await file.arrayBuffer(),
        file.name.replace(/\.wasm$/i, "")
      );
      setWasmModule(module);
      toast.success("Custom WASM module attached", {
        description: "It executes locally as a declared Synshape sidecar.",
      });
    } catch (error) {
      toast.error("WASM module rejected", {
        description:
          error instanceof Error
            ? error.message
            : "Invalid browser WASM module.",
      });
    } finally {
      event.target.value = "";
    }
  };

  const exportEncryptedPackage = async () => {
    const passphrase = window.prompt(
      "Create a passphrase (12+ characters). The passphrase is not stored."
    );
    if (!passphrase) return;
    try {
      const packageText = await encryptedSynshapePackage(graph, passphrase);
      const label = await telemetrySessionLabel(
        new Float32Array([
          liveSample.x,
          liveSample.y,
          liveSample.pressure,
          liveSample.velocity,
        ])
      );
      downloadBytes(
        new TextEncoder().encode(packageText),
        `synshape-${label}.encrypted.json`,
        "application/json"
      );
      setProtectionStatus(
        `AES-GCM package exported Â· session label ${label}. Passphrase was never retained.`
      );
      toast.success("Encrypted local package exported", {
        description:
          "Standards-based encryption protects the download at rest, not code from the user running it.",
      });
    } catch (error) {
      toast.error("Protected export blocked", {
        description:
          error instanceof Error ? error.message : "Encryption failed.",
      });
    }
  };

  const exportPresetLibrary = async () => {
    if (!presets.length) {
      toast.message("Save a named preset before exporting the library.");
      return;
    }
    const passphrase = window.prompt(
      "Library passphrase (12+ characters). It is not stored."
    );
    if (!passphrase) return;
    try {
      const packageText = await encryptedPresetLibrary(presets, passphrase);
      downloadBytes(
        new TextEncoder().encode(packageText),
        "synshape-preset-library.encrypted.json",
        "application/json"
      );
      toast.success("Encrypted library exported", {
        description: `${presets.length} presets are protected at rest with your passphrase.`,
      });
    } catch (error) {
      toast.error("Library export blocked", {
        description:
          error instanceof Error ? error.message : "Encryption failed.",
      });
    }
  };

  const importPresetLibrary = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const passphrase = window.prompt("Library passphrase");
    if (!passphrase) {
      event.target.value = "";
      return;
    }
    try {
      const imported = await decryptedPresetLibrary(
        await file.text(),
        passphrase
      );
      setPresets(imported);
      writePresetLibrary(imported);
      toast.success("Encrypted library imported", {
        description: `${imported.length} presets are now local to this browser.`,
      });
    } catch (error) {
      toast.error("Library import rejected", {
        description:
          error instanceof Error
            ? error.message
            : "Could not decrypt this library.",
      });
    } finally {
      event.target.value = "";
    }
  };

  const focusSearchResult = (
    result: { nodeId?: string; edgeId?: string } | null
  ) => {
    if (!result) return;
    if (result.edgeId) {
      const edge = graph.edges.find(item => item.id === result.edgeId) ?? null;
      setSelectedEdge(edge);
      setSelectedNodeId(null);
      return;
    }
    if (result.nodeId) {
      setSelectedNodeId(result.nodeId);
      setSelectedEdge(null);
    }
  };

  const handleSearchKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchCursor(current =>
        Math.min(Math.max(0, searchResults.length - 1), current + 1)
      );
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSearchCursor(current => Math.max(0, current - 1));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      focusSearchResult(activeSearchResult);
    }
    if (event.key === "Escape") {
      setSearchQuery("");
      setSearchCursor(0);
    }
  };

  const finishGuide = (draw = false) => {
    window.localStorage.setItem("synshape.first-graph.seen", "true");
    setShowGuide(false);
    if (draw) {
      setDrawMode("surface");
      setTool("draw");
    }
  };

  const saveNamedPreset = () => {
    const name = window.prompt("Preset name", `Graph ${presets.length + 1}`);
    if (name === null) return;
    const preset = createPreset(name, graph);
    const next = [preset, ...presets];
    setPresets(next);
    writePresetLibrary(next);
    toast.success("Preset stored locally", {
      description: `${preset.name} remains in this browser only.`,
    });
  };

  const loadNamedPreset = (preset: SynshapePreset) => {
    setGraph(preset.graph);
    setSelectedNodeId(preset.graph.nodes[0]?.id ?? null);
    toast.success("Preset loaded", { description: preset.name });
  };
  const deleteNamedPreset = (id: string) => {
    const next = presets.filter(preset => preset.id !== id);
    setPresets(next);
    writePresetLibrary(next);
  };
  const exportAnnotatedModel = () => {
    try {
      downloadOnnxJsArtifacts(graph);
      toast.success("Model and annotation sidecar exported", {
        description:
          "The .onnx stays portable; comments are kept in a separate manifest.",
      });
    } catch (error) {
      toast.error("Annotated export blocked", {
        description:
          error instanceof Error
            ? error.message
            : "Unexpected serializer error.",
      });
    }
  };

  return (
    <main className="synth-app">
      {showIntro && <BrandIntro onComplete={() => setShowIntro(false)} />}
      {showAbout && <AboutPanel onClose={() => setShowAbout(false)} />}
      <input
        ref={initializerInputRef}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={importInitializers}
      />
      <input
        ref={onnxInputRef}
        className="visually-hidden"
        type="file"
        accept=".onnx,application/octet-stream"
        onChange={importOnnx}
      />
      <input
        ref={wasmInputRef}
        className="visually-hidden"
        type="file"
        accept=".wasm,application/wasm"
        onChange={importWasmModule}
      />
      <input
        ref={presetLibraryInputRef}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={importPresetLibrary}
      />
      <div
        className="workspace-backdrop"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(5,14,19,.92), rgba(5,14,19,.68)), url(${canvasBackdrop})`,
        }}
      />
      <header className="topbar">
        <div className="brand-lockup">
          <img className="brand-mark" src={logoTexture} alt="" />
          <div>
            <p className="eyebrow">TENSOR SYNTHESIZER / GESTURE-NATIVE</p>
            <h1>Synshape</h1>
          </div>
        </div>
        <div className="topbar-readouts">
          <span className="readout">
            <span className="status-dot" /> MEMORY DAG
          </span>
          <span className="readout mono">
            {graph.nodes.length} NODES / {validEdges.length} OPS
          </span>
          <span
            className={`readout validator ${invalidEdges.length ? "invalid" : "valid"}`}
          >
            {invalidEdges.length ? (
              <CircleAlert size={13} />
            ) : (
              <CircleCheck size={13} />
            )}
            {invalidEdges.length
              ? `${invalidEdges.length} CONFLICT${invalidEdges.length > 1 ? "S" : ""}`
              : "GRAPH VALID"}
          </span>
        </div>
        <div className="topbar-actions">
          <Button
            variant="outline"
            className="icon-button"
            onClick={() => setShowAbout(true)}
            aria-label="About Synshape"
          >
            <Info size={16} />
          </Button>
          <Button
            variant="outline"
            className="icon-button"
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen canvas"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Expand size={16} />}
          </Button>
          <Button
            variant="outline"
            className="instrument-button import-onnx"
            onClick={() => onnxInputRef.current?.click()}
          >
            <FileUp size={15} /> Import ONNX
          </Button>
          <Button
            variant="outline"
            className="instrument-button"
            onClick={saveNamedPreset}
          >
            <Save size={15} /> Save preset
          </Button>
          <Button
            variant="outline"
            className="instrument-button onnxjs-export"
            onClick={exportAnnotatedModel}
          >
            <FileCode2 size={15} /> ONNX + notes
          </Button>
          <Button
            className="export-button"
            disabled={!hasExportableGraph}
            onClick={exportGraph}
          >
            <Download size={16} /> Export ONNX
          </Button>
        </div>
      </header>

      <aside className="left-rail" aria-label="Tensor drawing controls">
        <section className="rail-section">
          <p className="rail-label">01 / SYNTHESIZE</p>
          <div className="shape-stack">
            {drawModes.map(mode => {
              const Icon = mode.icon;
              return (
                <button
                  key={mode.value}
                  className={`shape-control ${drawMode === mode.value ? "active" : ""}`}
                  onClick={() => {
                    setDrawMode(mode.value);
                    setTool("draw");
                  }}
                >
                  <Icon size={15} />
                  <span>
                    <strong>{mode.label}</strong>
                    <small>{mode.hint}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rail-section interaction-section">
          <p className="rail-label">02 / INTERACT</p>
          <div className="tool-row">
            {tools.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  className={`tool-button ${tool === item.value ? "active" : ""}`}
                  onClick={() => setTool(item.value)}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          <p className="tool-instruction">
            {tool === "draw" &&
              `Draw on the field to resolve a ${drawMode === "rag" ? "micro-RAG" : drawMode} tensor.`}
            {tool === "select" &&
              "Drag a node to reposition its nD projection."}
            {tool === "connect" &&
              "Drag from one node toward another to infer an operator."}
          </p>
          {drawMode === "nd" && (
            <label className="nd-editor">
              <span>
                <SlidersHorizontal size={12} /> nD FORMULA
              </span>
              <input
                value={ndFormula}
                onChange={event => updateNdFormula(event.target.value)}
                placeholder="2 Ã— 24 Ã— 32 Ã— 16"
              />
              <small>
                {parseDimensions(ndFormula)
                  ? `[${parseDimensions(ndFormula)!.join(", ")}]`
                  : "Use positive integer dimensions"}
              </small>
            </label>
          )}
        </section>

        <section className="rail-section palette-section">
          <p className="rail-label">03 / OPERATORS</p>
          <div className="operator-stack">
            {operatorPalette.map(({ op, note, icon: Icon }) => (
              <button
                key={op}
                className="operator-control"
                onClick={() => addOperator(op)}
              >
                <Icon size={14} />
                <span>
                  <strong>{op}</strong>
                  <small>{note}</small>
                </span>
                <Plus size={12} />
              </button>
            ))}
          </div>
        </section>

        <section className="rail-section rail-actions">
          <button
            className="quiet-action"
            onClick={() => {
              setGraph(createDemoGraph());
              setSelectedNodeId("surface-input");
              setSelectedEdge(null);
              toast.message("Reference graph restored");
            }}
          >
            <RotateCcw size={14} /> Reset demo
          </button>
          <button
            className="quiet-action danger"
            onClick={() => {
              setGraph({ nodes: [], edges: [], initializers: [] });
              setSelectedNodeId(null);
              setSelectedEdge(null);
            }}
          >
            <Trash2 size={14} /> Clear graph
          </button>
        </section>
      </aside>

      <section className="spatial-stage" aria-label="Tensor spatial field">
        <WebGLField />
        <div className="reticle reticle-a" aria-hidden="true" />
        <div className="reticle reticle-b" aria-hidden="true" />
        <div className={`graph-search ${searchQuery ? "open" : ""}`}>
          <div className="graph-search-input">
            <Search size={14} />
            <input
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Find node, operator, shapeâ€¦"
              aria-label="Search graph"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear graph search"
              >
                Ã—
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="graph-search-results">
              {searchResults.length ? (
                searchResults.map((result, index) => (
                  <button
                    key={result.id}
                    className={index === searchCursor ? "active" : ""}
                    onMouseEnter={() => setSearchCursor(index)}
                    onClick={() => focusSearchResult(result)}
                  >
                    <span>{result.type}</span>
                    <b>{result.label}</b>
                    <small>{result.detail}</small>
                  </button>
                ))
              ) : (
                <p>NO GRAPH OBJECTS MATCH</p>
              )}
            </div>
          )}
        </div>
        <GraphCanvas
          nodes={graph.nodes}
          edges={graph.edges}
          selectedNodeId={selectedNodeId}
          tool={tool}
          drawMode={drawMode}
          onStrokeComplete={addNode}
          onSelect={id => {
            setSelectedNodeId(id);
            if (id) setSelectedEdge(null);
          }}
          onConnect={connect}
          onMoveNode={moveNode}
          onTelemetry={handleTelemetry}
          onEdgeSelect={setSelectedEdge}
          highlightedNodeId={activeSearchNodeId}
          highlightedEdgeId={activeSearchEdgeId}
        />
        {selectedEdge && selectedOperatorDoc && (
          <aside
            className={`operator-doc-card ${selectedEdge.valid ? "" : "conflict"}`}
          >
            <div>
              <span>{selectedOperatorDoc.class}</span>
              <button
                onClick={() => setSelectedEdge(null)}
                aria-label="Close operator documentation"
              >
                Ã—
              </button>
            </div>
            <h3>{selectedOperatorDoc.title}</h3>
            <p>{selectedOperatorDoc.behavior}</p>
            <small>RULE / {selectedOperatorDoc.rule}</small>
          </aside>
        )}
        {showGuide && (
          <div className="first-graph-guide">
            <div className="guide-kicker">CALIBRATION / FIRST GRAPH</div>
            <h2>
              INPUT PIPELINE
              <br />
              UNRESOLVED
            </h2>
            <ol>
              <li>
                <b>01</b>
                <span>SELECT / SURFACE</span>
              </li>
              <li>
                <b>02</b>
                <span>DRAW / POINTER FIELD</span>
              </li>
              <li>
                <b>03</b>
                <span>ROUTE / VALIDATE OP</span>
              </li>
            </ol>
            <div className="guide-actions">
              <button onClick={() => finishGuide(true)}>
                <WandSparkles size={14} /> Arm draw
              </button>
              <button onClick={() => finishGuide()}>Dismiss</button>
            </div>
          </div>
        )}
        {!showGuide && (
          <div className="stage-hint">
            <span className="stage-index">
              {tool === "connect"
                ? "ROUTE MODE"
                : `${drawMode.toUpperCase()} MODE`}
            </span>
            <p>
              {tool === "connect"
                ? "Draw a hypothesis across two tensor ports."
                : "Pointer telemetry resolves dimensions when the stroke ends."}
            </p>
          </div>
        )}
        <button
          className="stage-fullscreen"
          onClick={toggleFullscreen}
          title="Toggle fullscreen"
        >
          {isFullscreen ? <Minimize2 size={15} /> : <Expand size={15} />}
          <span>{isFullscreen ? "Exit focus" : "Focus field"}</span>
        </button>
        <div className="stage-axis x-axis" aria-hidden="true">
          <span>X / SPATIAL</span>
        </div>
        <div className="stage-axis y-axis" aria-hidden="true">
          <span>Y / PRESSURE</span>
        </div>
      </section>

      <aside className="right-inspector" aria-label="Graph inspector">
        <section className="inspector-header">
          <p className="rail-label">03 / INSPECT</p>
          <h2>{selectedNode ? selectedNode.label : "NO SELECTION"}</h2>
          <span
            className={`node-kind ${selectedNode?.kind === "rag" ? "rag" : ""}`}
          >
            {selectedNode?.kind === "rag" ? "MICRO-RAG" : "FLOAT TENSOR"}
          </span>
        </section>

        {selectedNode ? (
          <>
            <section
              className="shape-inspector"
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(11,27,34,.98), rgba(11,27,34,.50)), url(${selectedNode.kind === "rag" ? ragTexture : projectionTexture})`,
              }}
            >
              <p>DECLARED SHAPE</p>
              <strong>{formatShape(selectedNode.shape)}</strong>
              <div className="dimension-rail">
                {selectedNode.shape.map((dimension, index) => (
                  <span
                    key={`${dimension}-${index}`}
                    style={{
                      height: `${Math.max(22, Math.min(54, dimension / 3))}px`,
                    }}
                  >
                    <i />
                    {dimension}
                  </span>
                ))}
              </div>
              <div className="shape-facts">
                <span>
                  RANK <b>{selectedNode.shape.length}</b>
                </span>
                <span>
                  TYPE <b>F32</b>
                </span>
              </div>
            </section>

            <section className="telemetry-card">
              <div className="section-title">
                <span>STROKE TELEMETRY</span>
                <span className="live-word">LIVE</span>
              </div>
              <div className="telemetry-grid">
                <div>
                  <small>SAMPLES</small>
                  <strong>{selectedNode.telemetry.sampleCount}</strong>
                </div>
                <div>
                  <small>PRESSURE</small>
                  <strong>{selectedNode.telemetry.pressure.toFixed(2)}</strong>
                </div>
                <div>
                  <small>VELOCITY</small>
                  <strong>{selectedNode.telemetry.velocity.toFixed(2)}</strong>
                </div>
                <div>
                  <small>PATH</small>
                  <strong>
                    {selectedNode.telemetry.pathLength.toFixed(2)}
                  </strong>
                </div>
              </div>
            </section>
            <button className="delete-node" onClick={deleteSelected}>
              <Trash2 size={14} /> Remove selected node
            </button>
          </>
        ) : (
          <div className="empty-inspector">
            <Box size={24} />
            <p>Draw a shape to inspect its declared tensor geometry.</p>
          </div>
        )}

        <section className="validator-panel">
          <div className="section-title">
            <span>LIVE SHAPE VALIDATOR</span>
            <span className="mono">{graph.edges.length} ROUTES</span>
          </div>
          <div className="validation-list">
            {!graph.edges.length && (
              <p className="empty-validation">No routes to validate.</p>
            )}
            {graph.edges.map(edge => {
              const source = graphIndex.nodes.get(edge.from);
              const target = graphIndex.nodes.get(edge.to);
              return (
                <div
                  key={edge.id}
                  className={`validation-item ${edge.valid ? "ok" : "bad"}`}
                >
                  {edge.valid ? (
                    <CircleCheck size={14} />
                  ) : (
                    <CircleAlert size={14} />
                  )}
                  <div>
                    <strong>
                      {source?.label} <em>â†’</em> {target?.label}
                    </strong>
                    <span>
                      {edge.valid
                        ? `${edge.op} Â· ${formatShape(edge.outputShape ?? [])}`
                        : edge.reason}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="runtime-panel">
          <div className="section-title">
            <span>LOCAL RUNTIME CHECK</span>
            <span className={`runtime-status ${browserValidation}`}>
              {browserValidation === "valid"
                ? "ACCEPTED"
                : browserValidation === "invalid"
                  ? "REJECTED"
                  : browserValidation === "running"
                    ? "CHECKING"
                    : "WASM"}
            </span>
          </div>
          <p>Loads the raw export in ONNX Runtime Web. No model is uploaded.</p>
          <button
            className="runtime-button"
            disabled={!hasExportableGraph || browserValidation === "running"}
            onClick={verifyInBrowser}
          >
            <Cpu size={14} />{" "}
            {browserValidation === "running"
              ? "Checking modelâ€¦"
              : "Validate locally"}
          </button>
        </section>
        <section className="execution-panel">
          <div className="section-title">
            <span>IN-MEMORY EXECUTION</span>
            <span
              className={`execution-status ${executionStatus.toLowerCase()}`}
            >
              {executionStatus}
            </span>
          </div>
          <p>{executionDetail}</p>
          <div className="execution-actions">
            <button
              disabled={!hasExportableGraph || executionStatus === "RUNNING"}
              onClick={() => void runInMemory()}
            >
              <Play size={13} /> Execute buffer
            </button>
            <button
              className={streaming ? "armed" : ""}
              disabled={!hasExportableGraph}
              onClick={() => setStreaming(value => !value)}
            >
              <Radio size={13} />{" "}
              {streaming ? "Live stream armed" : "Arm live stream"}
            </button>
          </div>
        </section>
        <section className="trace-panel">
          <div className="section-title">
            <span>EXECUTION TRACE</span>
            <span className="mono">
              {traceFrames.length
                ? `${traceCursor + 1}/${traceFrames.length}`
                : "IDLE"}
            </span>
          </div>
          <p>
            {traceFrames.length
              ? `${traceFrames[traceCursor].label} Â· ${formatShape(traceFrames[traceCursor].shape)}`
              : "Expose each resolved tensor as a local model output."}
          </p>
          {traceFrames.length > 0 && (
            <>
              <code>
                {traceFrames[traceCursor].values
                  .map(value => value.toFixed(4))
                  .join(" Â· ")}
              </code>
              <input
                aria-label="Trace frame"
                type="range"
                min="0"
                max={Math.max(0, traceFrames.length - 1)}
                value={traceCursor}
                onChange={event => setTraceCursor(Number(event.target.value))}
              />
            </>
          )}
          <button
            className="trace-run"
            disabled={!hasExportableGraph || executionStatus === "RUNNING"}
            onClick={() => void runInMemory(liveSample, true)}
          >
            <StepForward size={13} />{" "}
            {traceFrames.length ? "Refresh frames" : "Capture trace"}
          </button>
        </section>
        <section className="timeline-panel">
          <div className="section-title">
            <span>STREAM TIMELINE</span>
            <span className="mono">
              {streamHistory.length
                ? `${streamHistory.length} SAMPLES`
                : "IDLE"}
            </span>
          </div>
          <div className="timeline-chart">
            {streamHistory.length > 1 ? (
              <svg viewBox="0 0 100 44" preserveAspectRatio="none">
                <path
                  className="timeline-grid"
                  d="M0 12H100M0 25H100M0 38H100"
                />
                <path className="timeline-path" d={timelinePath} />
              </svg>
            ) : (
              <p>
                <Activity size={13} /> Arm live stream and draw to observe local
                output drift.
              </p>
            )}
          </div>
          {streamHistory.length > 0 && (
            <small>
              {streamHistory[streamHistory.length - 1].provider} Â· last scalar{" "}
              {streamHistory[streamHistory.length - 1].value.toFixed(5)}
            </small>
          )}
        </section>
        <section className="preset-panel">
          <div className="section-title">
            <span>PRESET LIBRARY</span>
            <span className="mono">{presets.length} LOCAL</span>
          </div>
          {!presets.length && <p>No named graphs stored in this browser.</p>}
          <div className="preset-list">
            {presets.slice(0, 4).map(preset => (
              <div key={preset.id}>
                <button onClick={() => loadNamedPreset(preset)}>
                  <BookMarked size={12} />
                  <span>
                    <b>{preset.name}</b>
                    <small>
                      {new Date(preset.savedAt).toLocaleDateString()}
                    </small>
                  </span>
                </button>
                <button
                  className="preset-delete"
                  onClick={() => deleteNamedPreset(preset.id)}
                  aria-label={`Delete ${preset.name}`}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="library-actions">
            <button onClick={() => void exportPresetLibrary()}>
              <LockKeyhole size={12} /> Export library
            </button>
            <button onClick={() => presetLibraryInputRef.current?.click()}>
              <FileUp size={12} /> Import library
            </button>
          </div>
        </section>
        <section className="math-panel">
          <div className="section-title">
            <span>MICHA MATH MODULES</span>
            <span className="mono">SIDECAR</span>
          </div>
          <div className="math-buttons">
            {[...mathModules, ...(wasmModule ? [wasmModule] : [])].map(
              module => (
                <button
                  key={module.id}
                  onClick={() => runMathModule(module.id)}
                >
                  <WandSparkles size={12} />
                  <span>
                    <b>{module.label}</b>
                    <small>{module.detail}</small>
                  </span>
                </button>
              )
            )}
          </div>
          <p>{mathStatus}</p>
          <button
            className="wasm-import"
            onClick={() => wasmInputRef.current?.click()}
          >
            <FileUp size={12} /> Attach WASM transform
          </button>
        </section>
        <section className="protection-panel">
          <div className="section-title">
            <span>LOCAL PACKAGE PROTECTION</span>
            <span className="mono">AES-GCM</span>
          </div>
          <p>{protectionStatus}</p>
          <button
            className="protect-button"
            onClick={() => void exportEncryptedPackage()}
          >
            <Download size={13} /> Export encrypted package
          </button>
          <small>
            Privacy at rest only. A browser cannot hide executable code or
            decrypted data from the user controlling it.
          </small>
        </section>
        <section className="initializer-panel">
          <div className="section-title">
            <span>INITIALIZERS</span>
            <span className="mono">{graph.initializers.length} TENSORS</span>
          </div>
          <p>
            {graph.initializers.length
              ? graph.initializers
                  .map(
                    initializer =>
                      `${initializer.name} ${formatShape(initializer.shape)}`
                  )
                  .join(" Â· ")
              : "No constants attached."}
          </p>
          <div className="initializer-actions">
            <button onClick={() => initializerInputRef.current?.click()}>
              <FileUp size={13} /> Import
            </button>
            <button onClick={exportInitializers}>
              <FileDown size={13} /> Export
            </button>
          </div>
        </section>
      </aside>

      <footer
        className="telemetry-strip"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(7,18,23,.92), rgba(7,18,23,.72)), url(${telemetryTexture})`,
        }}
      >
        <div className="telemetry-title">
          <span className="pulse-dot" /> POINTER SENSORIK
        </div>
        <div className="sensor-readout">
          <small>X</small>
          <strong>{liveSample.x.toFixed(3)}</strong>
        </div>
        <div className="sensor-readout">
          <small>Y</small>
          <strong>{liveSample.y.toFixed(3)}</strong>
        </div>
        <div className="sensor-readout">
          <small>PRESSURE</small>
          <strong>{liveTelemetry.pressure.toFixed(2)}</strong>
        </div>
        <div className="sensor-readout">
          <small>VELOCITY</small>
          <strong>{liveTelemetry.velocity.toFixed(2)}</strong>
        </div>
        <p>
          Pointer / touch / pen samples remain browser-local. No server path.
        </p>
      </footer>
    </main>
  );
}
