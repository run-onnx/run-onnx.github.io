/**

 * Synshape Tensor Synthesizer

 * 

 * @copyright Copyright (c) 2026 Michael Barlozewski. All rights reserved.

 * @contact   g.dev/avx

 * 

 * PROPRIETARß & CONFIDENTIAL

 * Unauthorized copying, modification, or distribution of this software 

 * via any medium is strictly prohibited.

 */



import { useLanguage } from "../i18n";

import { HelpModal } from "../components/HelpModal";

import { useEffect, useMemo, useRef, useState } from "react";

import {

  Activity,

  ArrowLeft,

  ArrowRight,

  AudioLines,

  Box,

  Braces,

  Check,

  ChevronDown,

  ChevronUp,

  Download,

  FileUp,

  FolderOpen,

  Gauge,

  Hash,

  Layers,

  MousePointer2,

  MoveRight,

  Network,

  Plus,

  RotateCcw,

  Save,

  ShieldCheck,

  Smartphone,

  Sparkles,

  Trash2,

  Volume2,

  VolumeX,

  X,

} from "lucide-react";



type DType = "float32" | "int32" | "bool";

type TensorOp =

  "Identity" | "Abs" | "Relu" | "Neg" | "Sigmoid" | "Tanh" | "Softplus" | "Not";

type CodexItem = {

  id: string;

  name: string;

  type: string;

  content: string;

  size: number;

};

type MiniCategory = "Entwürfe" | "Lernen" | "Experimente" | "Sammlung";

type MiniModel = {

  id: string;

  name: string;

  createdAt: number;

  category: MiniCategory;

  dtype: DType;

  shapeText: string;

  operation: TensorOp;

  amplitude: number;

  seed: number;

  valueMode: "signal" | "direct";

  valueText: string;

  codex: CodexItem[];

};

type ProtoField = { wire: number; value?: number; bytes?: Uint8Array };

type ImportedTensor = {

  name: string;

  dims: number[];

  dataType: number;

  values: number[] | null;

};

type ImportedModel = {

  fileName: string;

  bytes: number;

  irVersion: number;

  producer: string;

  graphName: string;

  opset: string;

  nodeOps: Array<{

    name: string;

    op: string;

    inputs: string[];

    outputs: string[];

  }>;

  metadata: Array<{ key: string; value: string }>;

  tensor: ImportedTensor | null;

  output: { name: string; dims: number[]; dataType: number } | null;

  supported: boolean;

};



const HERO_ASSET = "/tensor-storage/tensor-hero-plasma_c34791a2.jpg";

const MARK_ASSET = "/tensor-storage/tensor-mark_63462173.png";

const CODEX_ASSET = "/tensor-storage/tensor-codex-hypercube_f674e3f4.jpg";

const MAX_ELEMENTS = 16_384;

const MAX_CODEX_BßTES = 250 * 1024;

const MAX_MATRIX_CELLS = 256;

const MINI_MODEL_STORAGE_KEß = "tensor-mini-models-v1";

const MINI_CATEGORIES: MiniCategory[] = [

  "Entwürfe",

  "Lernen",

  "Experimente",

  "Sammlung",

];



const MODULES = [

  { label: "Material", eyebrow: "01 / DType", icon: Layers },

  { label: "Form", eyebrow: "02 / Shape", icon: Hash },

  { label: "Impulse", eyebrow: "03 / Ops", icon: Gauge },

  { label: "Codex", eyebrow: "04 / Metadata", icon: Braces },

  { label: "Flusslinse", eyebrow: "05 / Flow Lens", icon: Network },

];



const MATERIALS: Array<{

  id: DType;

  label: string;

  meta: string;

  description: string;

}> = [

  {

    id: "float32",

    label: "Float",

    meta: "Plasma / Flux",

    description: "Weiche, kontinuierliche Energie für lernende Strukturen.",

  },

  {

    id: "int32",

    label: "Integer",

    meta: "Voxel / Cores",

    description: "Kristalline, gezählte Einheiten mit klarer Kante.",

  },

  {

    id: "bool",

    label: "Boolean",

    meta: "Trigger / Pulse",

    description: "Ein präziser Wechsel zwischen an und aus.",

  },

];



const SHAPE_PRESETS = [

  { label: "0D", value: "", note: "Skalar" },

  { label: "1D", value: "128", note: "Stream" },

  { label: "2D", value: "16 × 16", note: "Grid" },

  { label: "3D", value: "6 × 6 × 6", note: "Field" },

];



const OPERATION_DETAILS: Record<

  TensorOp,

  { description: string; family: "all" | "numeric" | "float" | "bool" }

> = {

  Identity: { description: "Original bewahren", family: "all" },

  Abs: { description: "Vorzeichen falten", family: "numeric" },

  Relu: { description: "Negative Werte ruhen lassen", family: "float" },

  Neg: { description: "Richtung umkehren", family: "numeric" },

  Sigmoid: { description: "In einen weichen Bereich ziehen", family: "float" },

  Tanh: { description: "Energie zentrieren", family: "float" },

  Softplus: { description: "Sanft positiv werden", family: "float" },

  Not: { description: "Trigger umdrehen", family: "bool" },

};



const FIRST_MODEL_STEPS = [

  {

    title: "Eine Matrix fühlen",

    copy: "Beginne mit einem kleinen 4×4-Feld. Die Form wird sofort in der Vorschau spürbar.",

    action: "4×4 aufbauen",

  },

  {

    title: "Ein Muster schreiben",

    copy: "Gib deiner Matrix ein klares Muster. Jede Zelle zählt, jede Farbe antwortet.",

    action: "Muster einsetzen",

  },

  {

    title: "Eine Idee einfalten",

    copy: "Lege eine kurze Notiz in den Codex. Sie reist im Modell mit.",

    action: "Idee einbetten",

  },

];



function parseShape(raw: string): number[] | null {

  const compact = raw.trim();

  if (!compact) return [];

  const parts = compact.split(/[×x,\s]+/).filter(Boolean);

  if (!parts.length || parts.length > 6) return null;

  const values = parts.map(part => Number(part));

  if (

    values.some(value => !Number.isInteger(value) || value < 1 || value > 2048)

  )

    return null;

  const volume = values.reduce((product, value) => product * value, 1);

  return volume <= MAX_ELEMENTS ? values : null;

}



function allowedOperations(dtype: DType): TensorOp[] {

  if (dtype === "bool") return ["Identity", "Not"];

  if (dtype === "int32") return ["Identity", "Abs", "Neg"];

  return ["Identity", "Abs", "Relu", "Neg", "Sigmoid", "Tanh", "Softplus"];

}



function datatypeInfo(dtype: DType) {

  return dtype === "float32"

    ? { onnx: 1, bytes: 4, label: "float32", tone: "Eisblau" }

    : dtype === "int32"

      ? { onnx: 6, bytes: 4, label: "int32", tone: "Graphit" }

      : { onnx: 9, bytes: 1, label: "bool", tone: "Mineral Teal" };

}



function volumeOf(dims: number[]) {

  return dims.length ? dims.reduce((product, value) => product * value, 1) : 1;

}



function typeLabel(rank: number) {

  if (rank === 0) return "Scalar";

  if (rank === 1) return "Vector";

  if (rank === 2) return "Matrix";

  return `${rank}D Tensor`;

}



function uid() {

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

}



function readMiniModels(): MiniModel[] {

  try {

    const stored = window.localStorage.getItem(MINI_MODEL_STORAGE_KEß);

    const models = stored ? JSON.parse(stored) : [];

    return Array.isArray(models)

      ? models

          .filter(

            (entry): entry is MiniModel =>

              entry &&

              typeof entry.id === "string" &&

              typeof entry.name === "string" &&

              typeof entry.shapeText === "string"

          )

          .map(entry => ({

            ...entry,

            category: MINI_CATEGORIES.includes(entry.category)

              ? entry.category

              : "Entwürfe",

          }))

      : [];

  } catch {

    return [];

  }

}



function xmlEscape(value: string) {

  return value.replace(

    /[&<>"']/g,

    character =>

      ({

        "&": "&amp;",

        "<": "&lt;",

        ">": "&gt;",

        '"': "&quot;",

        "'": "&apos;",

      })[character] ?? character

  );

}



function downloadLocalFile(content: BlobPart, type: string, filename: string) {

  const url = URL.createObjectURL(new Blob([content], { type }));

  const anchor = document.createElement("a");

  anchor.href = url;

  anchor.download = filename;

  document.body.appendChild(anchor);

  anchor.click();

  anchor.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 0);

}



function byteLength(value: string) {

  return new TextEncoder().encode(value).byteLength;

}



function parseTensorValues(raw: string, dtype: DType) {

  const clean = raw.trim().replace(/[\[\]]/g, "");

  if (!clean)

    return { values: [] as number[], error: "Noch keine Werte eingegeben." };

  const tokens = clean.split(/[,;\s]+/).filter(Boolean);

  const values: number[] = [];

  for (const token of tokens) {

    if (dtype === "bool") {

      if (/^(true|1)$/i.test(token)) values.push(1);

      else if (/^(false|0)$/i.test(token)) values.push(0);

      else return { values, error: `„${token}“ ist kein Boolean.` };

      continue;

    }

    const value = Number(token.replace(",", "."));

    if (!Number.isFinite(value))

      return { values, error: `„${token}“ ist keine Zahl.` };

    if (dtype === "int32" && !Number.isInteger(value))

      return { values, error: `„${token}“ ist keine ganze Zahl.` };

    values.push(value);

  }

  return { values, error: "" };

}



function gridTokens(raw: string, dtype: DType, count: number) {

  const tokens = raw

    .trim()

    .replace(/[\[\]]/g, "")

    .split(/[,;\s]+/)

    .filter(Boolean);

  const fallback = dtype === "bool" ? "0" : "0";

  return Array.from({ length: count }, (_, index) => tokens[index] ?? fallback);

}



function normalizedGridText(tokens: string[]) {

  return tokens.map(token => token.trim() || "0").join(", ");

}



function heatmapColor(token: string, dtype: DType, maximum: number) {

  if (dtype === "bool")

    return /^(true|1)$/i.test(token.trim())

      ? "rgba(11,124,120,.50)"

      : "rgba(105,122,114,.10)";

  const value = Number(token.replace(",", "."));

  if (!Number.isFinite(value)) return "rgba(164,72,52,.18)";

  const strength = Math.min(1, Math.abs(value) / Math.max(maximum, 0.0001));

  return value >= 0

    ? `rgba(11,124,120,${0.08 + strength * 0.51})`

    : `rgba(195,104,67,${0.08 + strength * 0.45})`;

}



function numberVarint(value: number) {

  const bytes: number[] = [];

  let remaining = Math.max(0, Math.floor(value));

  while (remaining > 127) {

    bytes.push((remaining & 127) | 128);

    remaining = Math.floor(remaining / 128);

  }

  bytes.push(remaining);

  return new Uint8Array(bytes);

}



function joinBytes(parts: Uint8Array[]) {

  const size = parts.reduce((sum, part) => sum + part.length, 0);

  const result = new Uint8Array(size);

  let offset = 0;

  for (const part of parts) {

    result.set(part, offset);

    offset += part.length;

  }

  return result;

}



function fieldVarint(field: number, value: number) {

  return joinBytes([numberVarint(field << 3), numberVarint(value)]);

}



function fieldBytes(field: number, value: Uint8Array) {

  return joinBytes([

    numberVarint((field << 3) | 2),

    numberVarint(value.length),

    value,

  ]);

}



function fieldString(field: number, value: string) {

  return fieldBytes(field, new TextEncoder().encode(value));

}



function decodeVarint(data: Uint8Array, start: number) {

  let value = 0;

  let multiplier = 1;

  let offset = start;

  while (offset < data.length) {

    const byte = data[offset++];

    value += (byte & 0x7f) * multiplier;

    if (!(byte & 0x80)) return { value, offset };

    multiplier *= 128;

    if (multiplier > Number.MAX_SAFE_INTEGER)

      throw new Error("Die ONNX-Datei enthält eine zu große Zahl.");

  }

  throw new Error("Die ONNX-Datei endet mitten in einer Zahl.");

}



function decodeProto(data: Uint8Array) {

  const fields = new Map<number, ProtoField[]>();

  let offset = 0;

  const push = (field: number, value: ProtoField) =>

    fields.set(field, [...(fields.get(field) ?? []), value]);

  while (offset < data.length) {

    const tag = decodeVarint(data, offset);

    offset = tag.offset;

    const field = Math.floor(tag.value / 8);

    const wire = tag.value & 7;

    if (!field)

      throw new Error("Die ONNX-Datei enthält ein ungültiges Feld.");

    if (wire === 0) {

      const parsed = decodeVarint(data, offset);

      offset = parsed.offset;

      push(field, { wire, value: parsed.value });

    } else if (wire === 1 || wire === 5) {

      const length = wire === 1 ? 8 : 4;

      if (offset + length > data.length)

        throw new Error("Die ONNX-Datei ist unvollständig.");

      push(field, { wire, bytes: data.slice(offset, offset + length) });

      offset += length;

    } else if (wire === 2) {

      const length = decodeVarint(data, offset);

      offset = length.offset;

      if (offset + length.value > data.length)

        throw new Error("Die ONNX-Datei ist unvollständig.");

      push(field, { wire, bytes: data.slice(offset, offset + length.value) });

      offset += length.value;

    } else {

      throw new Error(

        "Diese ONNX-Datei verwendet ein nicht unterstütztes Binärfeld."

      );

    }

  }

  return fields;

}



function fieldBytesAt(message: Map<number, ProtoField[]>, field: number) {

  return (message.get(field) ?? [])

    .map(entry => entry.bytes)

    .filter((value): value is Uint8Array => Boolean(value));

}



function fieldStringAt(message: Map<number, ProtoField[]>, field: number) {

  const first = fieldBytesAt(message, field)[0];

  return first ? new TextDecoder().decode(first) : "";

}



function fieldStringsAt(message: Map<number, ProtoField[]>, field: number) {

  return fieldBytesAt(message, field).map(entry =>

    new TextDecoder().decode(entry)

  );

}



function fieldVarintAt(

  message: Map<number, ProtoField[]>,

  field: number,

  fallback = 0

) {

  return (

    (message.get(field) ?? []).find(entry => entry.wire === 0)?.value ??

    fallback

  );

}



function packedVarints(fields: ProtoField[]) {

  const values: number[] = [];

  for (const field of fields) {

    if (field.wire === 0 && typeof field.value === "number")

      values.push(field.value);

    if (field.wire === 2 && field.bytes) {

      let offset = 0;

      while (offset < field.bytes.length) {

        const parsed = decodeVarint(field.bytes, offset);

        values.push(parsed.value);

        offset = parsed.offset;

      }

    }

  }

  return values;

}



function datatypeName(code: number) {

  const names: Record<number, string> = {

    1: "float32",

    2: "uint8",

    3: "int8",

    4: "uint16",

    5: "int16",

    6: "int32",

    7: "int64",

    9: "bool",

    10: "float16",

    11: "float64",

    12: "uint32",

    13: "uint64",

    16: "bfloat16",

  };

  return names[code] ?? `Typ ${code}`;

}



function supportedDType(code: number): DType | null {

  if (code === 1) return "float32";

  if (code === 6) return "int32";

  if (code === 9) return "bool";

  return null;

}



function readTensorValues(raw: Uint8Array, dtype: number) {

  const supported = supportedDType(dtype);

  if (!supported) return null;

  const width = supported === "bool" ? 1 : 4;

  if (raw.length % width) return null;

  const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);

  const values: number[] = [];

  for (let offset = 0; offset < raw.length; offset += width) {

    values.push(

      supported === "float32"

        ? view.getFloat32(offset, true)

        : supported === "int32"

          ? view.getInt32(offset, true)

          : raw[offset]

            ? 1

            : 0

    );

  }

  return values;

}



function readTensorShape(data: Uint8Array) {

  const message = decodeProto(data);

  return fieldBytesAt(message, 1).map(dimension =>

    fieldVarintAt(decodeProto(dimension), 1)

  );

}



function inspectTensor(data: Uint8Array): ImportedTensor {

  const message = decodeProto(data);

  const dims = packedVarints(message.get(1) ?? []);

  const dataType = fieldVarintAt(message, 2);

  const raw = fieldBytesAt(message, 9)[0];

  return {

    name: fieldStringAt(message, 8) || "tensor",

    dims,

    dataType,

    values: raw ? readTensorValues(raw, dataType) : null,

  };

}



function inspectValueInfo(data: Uint8Array) {

  const message = decodeProto(data);

  const tensorType = fieldBytesAt(

    decodeProto(fieldBytesAt(message, 2)[0] ?? new Uint8Array()),

    1

  )[0];

  if (!tensorType)

    return { name: fieldStringAt(message, 1), dims: [], dataType: 0 };

  const tensor = decodeProto(tensorType);

  return {

    name: fieldStringAt(message, 1),

    dataType: fieldVarintAt(tensor, 1),

    dims: readTensorShape(fieldBytesAt(tensor, 2)[0] ?? new Uint8Array()),

  };

}



export function inspectOnnx(data: Uint8Array, fileName: string): ImportedModel {

  const model = decodeProto(data);

  const graphData = fieldBytesAt(model, 7)[0];

  if (!graphData)

    throw new Error("Diese Datei enthält keinen lesbaren ONNX-Graphen.");

  const graph = decodeProto(graphData);

  const nodes = fieldBytesAt(graph, 1).map(node => {

    const parsed = decodeProto(node);

    return {

      name: fieldStringAt(parsed, 3) || "ohne Namen",

      op: fieldStringAt(parsed, 4) || "unbekannt",

      inputs: fieldStringsAt(parsed, 1),

      outputs: fieldStringsAt(parsed, 2),

    };

  });

  const tensors = fieldBytesAt(graph, 5).map(inspectTensor);

  const outputData = fieldBytesAt(graph, 12)[0];

  const output = outputData ? inspectValueInfo(outputData) : null;

  const metadata = fieldBytesAt(model, 14)

    .map(entry => {

      const parsed = decodeProto(entry);

      return { key: fieldStringAt(parsed, 1), value: fieldStringAt(parsed, 2) };

    })

    .filter(entry => entry.key);

  const opset =

    fieldBytesAt(model, 8)

      .map(entry => {

        const parsed = decodeProto(entry);

        const domain = fieldStringAt(parsed, 1) || "ai.onnx";

        return `${domain.replace("ai.onnx", "ONNX")} ${fieldVarintAt(parsed, 2)}`;

      })

      .join(" · ") || "nicht angegeben";

  const tensor =

    tensors.find(entry => supportedDType(entry.dataType)) ?? tensors[0] ?? null;

  const targetType = tensor?.dataType ?? output?.dataType ?? 0;

  return {

    fileName,

    bytes: data.byteLength,

    irVersion: fieldVarintAt(model, 1),

    producer: fieldStringAt(model, 2) || "nicht angegeben",

    graphName: fieldStringAt(graph, 2) || "ohne Namen",

    opset,

    nodeOps: nodes,

    metadata,

    tensor,

    output,

    supported: Boolean(supportedDType(targetType)),

  };

}



function stringPair(key: string, value: string) {

  return joinBytes([fieldString(1, key), fieldString(2, value)]);

}



function tensorShape(dims: number[]) {

  return joinBytes(dims.map(value => fieldBytes(1, fieldVarint(1, value))));

}



function valueInfo(name: string, dtype: number, dims: number[]) {

  const tensorType = joinBytes([

    fieldVarint(1, dtype),

    fieldBytes(2, tensorShape(dims)),

  ]);

  return joinBytes([

    fieldString(1, name),

    fieldBytes(2, fieldBytes(1, tensorType)),

  ]);

}



function tensorProto(

  name: string,

  dtype: number,

  dims: number[],

  rawData: Uint8Array

) {

  const packedDims = joinBytes(dims.map(numberVarint));

  return joinBytes([

    ...(packedDims.length ? [fieldBytes(1, packedDims)] : []),

    fieldVarint(2, dtype),

    fieldString(8, name),

    fieldBytes(9, rawData),

  ]);

}



function nodeProto(op: TensorOp) {

  return joinBytes([

    fieldString(1, "tensor"),

    fieldString(2, "output"),

    fieldString(3, `tensor_${op.toLowerCase()}`),

    fieldString(4, op),

  ]);

}



function operatorSet() {

  return fieldVarint(2, 18);

}



function createRawValues(

  dtype: DType,

  count: number,

  amplitude: number,

  seed: number

) {

  const phase = (seed % 997) / 997;

  if (dtype === "float32") {

    const values = new Float32Array(count);

    for (let index = 0; index < count; index += 1)

      values[index] = Math.sin(index * 0.37 + phase * 6.28) * amplitude;

    return new Uint8Array(values.buffer);

  }

  if (dtype === "int32") {

    const values = new Int32Array(count);

    for (let index = 0; index < count; index += 1)

      values[index] = Math.round(

        Math.sin(index * 0.51 + phase * 6.28) * amplitude * 16

      );

    return new Uint8Array(values.buffer);

  }

  const values = new Uint8Array(count);

  for (let index = 0; index < count; index += 1)

    values[index] = (index + seed) % 3 === 0 ? 1 : 0;

  return values;

}



export function buildOnnx(options: {

  dtype: DType;

  dims: number[];

  op: TensorOp;

  amplitude: number;

  seed: number;

  codex: CodexItem[];

  realValues?: number[];

}) {

  const { dtype, dims, op, amplitude, seed, codex, realValues } = options;

  const dataType = datatypeInfo(dtype).onnx;

  const rawValues = realValues

    ? (() => {

        if (dtype === "float32")

          return new Uint8Array(new Float32Array(realValues).buffer);

        if (dtype === "int32")

          return new Uint8Array(new Int32Array(realValues).buffer);

        return new Uint8Array(realValues.map(value => (value ? 1 : 0)));

      })()

    : createRawValues(dtype, volumeOf(dims), amplitude, seed);

  const graph = joinBytes([

    fieldBytes(1, nodeProto(op)),

    fieldString(2, "tensor_studio_graph"),

    fieldBytes(5, tensorProto("tensor", dataType, dims, rawValues)),

    fieldBytes(12, valueInfo("output", dataType, dims)),

  ]);

  const metadata = [

    ["tensor.studio", "Tensor"],

    ["tensor.dtype", dtype],

    ["tensor.shape", dims.length ? dims.join("×") : "scalar"],

    ["tensor.operation", op],

    ["tensor.values.mode", realValues ? "direct" : "signal"],

    ["tensor.codex.count", String(codex.length)],

    ...codex.flatMap((item, index) => [

      [`tensor.codex.${index}.name`, item.name],

      [`tensor.codex.${index}.type`, item.type],

      [`tensor.codex.${index}.payload`, item.content],

    ]),

  ];

  return joinBytes([

    fieldVarint(1, 9),

    fieldString(2, "Tensor Studio"),

    fieldString(3, "1.0"),

    fieldVarint(5, 1),

    fieldBytes(7, graph),

    fieldBytes(8, operatorSet()),

    ...metadata.map(([key, value]) => fieldBytes(14, stringPair(key, value))),

  ]);

}



export default function Home() {

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const { t, lang, setLang } = useLanguage();

  const [activeModule, setActiveModule] = useState(() => {

    const stage = new URLSearchParams(window.location.search).get("stage");

    return stage === "graph"

      ? 4

      : stage === "ops"

        ? 2

        : stage === "codex"

          ? 3

          : 0;

  });

  const [dtype, setDtype] = useState<DType>("float32");

  const [shapeText, setShapeText] = useState(() =>

    new URLSearchParams(window.location.search).get("grid")

      ? "4 × 4"

      : "16 × 16"

  );

  const [operation, setOperation] = useState<TensorOp>("Relu");

  const [amplitude, setAmplitude] = useState(0.8);

  const [seed, setSeed] = useState(81);

  const [valueMode, setValueMode] = useState<"signal" | "direct">(() =>

    new URLSearchParams(window.location.search).get("grid")

      ? "direct"

      : "signal"

  );

  const [valueEditor, setValueEditor] = useState<"text" | "grid">(() =>

    new URLSearchParams(window.location.search).get("grid") ? "grid" : "text"

  );

  const [valueText, setValueText] = useState(() =>

    new URLSearchParams(window.location.search).get("grid") === "heat"

      ? "-1, -0.5, 0, 0.5, -0.5, 0, 0.5, 1, 0, 0.5, 1, 0.5, 0.5, 1, 0.5, 0"

      : new URLSearchParams(window.location.search).get("grid")

        ? Array.from({ length: 16 }, () => "0").join(", ")

        : ""

  );

  const [codex, setCodex] = useState<CodexItem[]>([]);

  const [draftText, setDraftText] = useState("");

  const [codexOpen, setCodexOpen] = useState(false);

  const [dragActive, setDragActive] = useState(false);

  const [crowVisible, setCrowVisible] = useState(false);

  const [audioEnabled, setAudioEnabled] = useState(false);

  const [gpuReady, setGpuReady] = useState(false);

  const [lastExported, setLastExported] = useState(false);

  const [importedModel, setImportedModel] = useState<ImportedModel | null>(

    null

  );

  const [importError, setImportError] = useState("");

  const [inspectorOpen, setInspectorOpen] = useState(false);

  const [graphQuery, setGraphQuery] = useState("");

  const [focusedRouteNode, setFocusedRouteNode] = useState("tensor-input");

  const [primerOpen, setPrimerOpen] = useState(

    () => new URLSearchParams(window.location.search).get("primer") === "1"

  );

  const [primerIndex, setPrimerIndex] = useState(0);

  const [miniModels, setMiniModels] = useState<MiniModel[]>(readMiniModels);

  const [miniModelName, setMiniModelName] = useState("");

  const [miniModelCategory, setMiniModelCategory] =

    useState<MiniCategory>("Entwürfe");

  const [categoryFilter, setCategoryFilter] = useState<MiniCategory | "Alle">(

    "Alle"

  );

  const [activeSceneId, setActiveSceneId] = useState("working-tensor");

  const [composePartnerId, setComposePartnerId] = useState<string | null>(null);

  const [composeNotice, setComposeNotice] = useState("");

  const [shelfOpen, setShelfOpen] = useState(false);

  const [cardExported, setCardExported] = useState(false);

  const [graphMotion, setGraphMotion] = useState<

    "idle" | "active" | "denied" | "unavailable"

  >("idle");

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const gpuCanvasRef = useRef<HTMLCanvasElement>(null);

  const graphCanvasRef = useRef<HTMLCanvasElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const modelInputRef = useRef<HTMLInputElement>(null);

  const touchOrigin = useRef<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);

  const workletLoaded = useRef(false);

  const sharedEpoch = useRef<Int32Array | null>(null);

  const graphForceRef = useRef({ x: 0, y: 0, z: 0, kick: 0 });

  const graphOrientationListener = useRef<

    ((event: DeviceOrientationEvent) => void) | null

  >(null);

  const graphMotionListener = useRef<

    ((event: DeviceMotionEvent) => void) | null

  >(null);



  const dims = useMemo(() => parseShape(shapeText), [shapeText]);

  const directValues = useMemo(

    () => parseTensorValues(valueText, dtype),

    [valueText, dtype]

  );

  const modelValid =

    dims !== null && allowedOperations(dtype).includes(operation);

  const resolvedDims = dims ?? [];

  const rank = resolvedDims.length;

  const volume = volumeOf(resolvedDims);

  const info = datatypeInfo(dtype);

  const allowedOps = allowedOperations(dtype);

  const canUseMatrixGrid = rank === 2 && volume <= MAX_MATRIX_CELLS;

  const matrixRows = canUseMatrixGrid ? resolvedDims[0] : 0;

  const matrixCols = canUseMatrixGrid ? resolvedDims[1] : 0;

  const matrixTokens = useMemo(

    () => (canUseMatrixGrid ? gridTokens(valueText, dtype, volume) : []),

    [canUseMatrixGrid, valueText, dtype, volume]

  );

  const heatMaximum = useMemo(

    () =>

      Math.max(

        1,

        ...matrixTokens.map(token =>

          Math.abs(Number(token.replace(",", ".")) || 0)

        )

      ),

    [matrixTokens]

  );

  const shapeDescription = modelValid

    ? rank

      ? resolvedDims.join(" × ")

      : "1"

    : "Form prüfen";

  const routeNodes = useMemo(() => {

    const input = {

      id: "tensor-input",

      title: "Tensor",

      detail: `${info.label} · ${rank}D`,

      kind: "input" as const,

    };

    const operations = importedModel?.nodeOps.length

      ? importedModel.nodeOps

          .slice(0, 12)

          .map((node, index) => ({

            id: `node-${index}-${node.name}`,

            title: node.op,

            detail: node.name === "ohne Namen" ? "Graph node" : node.name,

            trace: [...node.inputs, ...node.outputs].join(" "),

            kind: "operation" as const,

          }))

      : [

          {

            id: `node-current-${operation}`,

            title: operation,

            detail: "Aktiver Impuls",

            trace: "tensor output",

            kind: "operation" as const,

          },

        ];

    return [

      input,

      ...operations,

      {

        id: "tensor-output",

        title: "Output",

        detail: `${shapeDescription} · ready`,

        kind: "output" as const,

      },

    ];

  }, [importedModel, info.label, rank, operation, shapeDescription]);

  const graphNodes = useMemo(() => {

    if (routeNodes.length <= 5) return routeNodes;

    const focus = Math.max(

      0,

      routeNodes.findIndex(node => node.id === focusedRouteNode)

    );

    const start = Math.min(Math.max(0, focus - 2), routeNodes.length - 5);

    return routeNodes.slice(start, start + 5);

  }, [routeNodes, focusedRouteNode]);

  const matchedRouteIds = useMemo(() => {

    const query = graphQuery.trim().toLocaleLowerCase("de-DE");

    if (!query) return new Set(routeNodes.map(node => node.id));

    return new Set(

      routeNodes

        .filter(node =>

          `${node.title} ${node.detail} ${"trace" in node ? node.trace : ""}`

            .toLocaleLowerCase("de-DE")

            .includes(query)

        )

        .map(node => node.id)

    );

  }, [routeNodes, graphQuery]);

  const currentMiniModel = useMemo<MiniModel>(

    () => ({

      id: "working-tensor",

      name: "Aktueller Tensor",

      createdAt: Date.now(),

      category: "Entwürfe",

      dtype,

      shapeText,

      operation,

      amplitude,

      seed,

      valueMode,

      valueText,

      codex,

    }),

    [dtype, shapeText, operation, amplitude, seed, valueMode, valueText, codex]

  );

  const visibleMiniModels = useMemo(

    () =>

      categoryFilter === "Alle"

        ? miniModels

        : miniModels.filter(model => model.category === categoryFilter),

    [miniModels, categoryFilter]

  );

  const sceneModels = useMemo(

    () => [currentMiniModel, ...visibleMiniModels.slice(0, 4)],

    [currentMiniModel, visibleMiniModels]

  );

  const composePartner = useMemo(

    () => miniModels.find(model => model.id === composePartnerId) ?? null,

    [miniModels, composePartnerId]

  );

  const valueCountMatches =

    valueMode === "signal" ||

    (directValues.values.length === volume && !directValues.error);

  const valid = modelValid && valueCountMatches;



  useEffect(() => {

    if (!allowedOps.includes(operation)) setOperation("Identity");

  }, [allowedOps, operation]);



  useEffect(() => {

    if (typeof SharedArrayBuffer === "undefined" || !crossOriginIsolated)

      return;

    sharedEpoch.current = new Int32Array(

      new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)

    );

  }, []);



  useEffect(() => {

    if (sharedEpoch.current) Atomics.add(sharedEpoch.current, 0, 1);

  }, [dtype, shapeText, operation, amplitude, seed, codex.length]);



  useEffect(() => {

    try {

      window.localStorage.setItem(

        MINI_MODEL_STORAGE_KEß,

        JSON.stringify(miniModels)

      );

    } catch {

    }

  }, [miniModels]);



  useEffect(() => {

    return () => {

      if (graphOrientationListener.current)

        window.removeEventListener(

          "deviceorientation",

          graphOrientationListener.current

        );

      if (graphMotionListener.current)

        window.removeEventListener("devicemotion", graphMotionListener.current);

    };

  }, []);



  useEffect(() => {

    if (activeModule !== 4) return;

    const canvas = graphCanvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    type RopePoint = {

      x: number;

      y: number;

      px: number;

      py: number;

      ax: number;

      ay: number;

    };

    let chains: RopePoint[][] = [];

    let width = 0;

    let height = 0;

    let frame = 0;

    let lastTime = performance.now();

    const reducedMotion = window.matchMedia(

      "(prefers-reduced-motion: reduce)"

    ).matches;

    const anchors = (canvasWidth: number, canvasHeight: number) =>

      graphNodes.map((_, index) => ({

        x:

          canvasWidth *

          (0.14 + (0.72 * index) / Math.max(1, graphNodes.length - 1)),

        y: canvasHeight * (0.5 + (index % 2 ? -0.12 : 0.12)),

      }));

    const rebuild = (canvasWidth: number, canvasHeight: number) => {

      const anchorPoints = anchors(canvasWidth, canvasHeight);

      chains = anchorPoints.slice(0, -1).map((start, chainIndex) => {

        const end = anchorPoints[chainIndex + 1];

        return Array.from({ length: 15 }, (_, pointIndex) => {

          const t = pointIndex / 14;

          const sag = Math.sin(t * Math.PI) * (17 + chainIndex * 2);

          const x = start.x + (end.x - start.x) * t;

          const y = start.y + (end.y - start.y) * t + sag;

          return { x, y, px: x, py: y, ax: x, ay: y };

        });

      });

    };

    const render = (time: number) => {

      const bounds = canvas.getBoundingClientRect();

      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      const nextWidth = Math.max(1, Math.floor(bounds.width));

      const nextHeight = Math.max(1, Math.floor(bounds.height));

      if (nextWidth !== width || nextHeight !== height || !chains.length) {

        width = nextWidth;

        height = nextHeight;

        canvas.width = Math.floor(width * ratio);

        canvas.height = Math.floor(height * ratio);

        rebuild(width, height);

      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      context.clearRect(0, 0, width, height);

      const delta = Math.min(1.6, (time - lastTime) / 16.67);

      lastTime = time;

      const force = graphForceRef.current;

      for (const chain of chains) {

        for (let index = 1; index < chain.length - 1; index += 1) {

          const point = chain[index];

          const velocityX = (point.x - point.px) * 0.968;

          const velocityß = (point.y - point.py) * 0.968;

          point.px = point.x;

          point.py = point.y;

          const ambient = reducedMotion

            ? 0

            : Math.sin(time * 0.0011 + index * 0.68) * 0.03;

          point.x += velocityX + (force.x * 0.28 + force.kick * 0.22) * delta;

          point.y += velocityß + (0.22 + force.y * 0.22 + ambient) * delta;

        }

        const ideal = Math.hypot(

          chain[1].ax - chain[0].ax,

          chain[1].ay - chain[0].ay

        );

        for (let pass = 0; pass < 7; pass += 1) {

          chain[0].x = chain[0].ax;

          chain[0].y = chain[0].ay;

          chain[chain.length - 1].x = chain[chain.length - 1].ax;

          chain[chain.length - 1].y = chain[chain.length - 1].ay;

          for (let index = 0; index < chain.length - 1; index += 1) {

            const first = chain[index];

            const second = chain[index + 1];

            const distance = Math.max(

              0.001,

              Math.hypot(second.x - first.x, second.y - first.y)

            );

            const correction = (distance - ideal) / distance;

            const x = (second.x - first.x) * correction * 0.5;

            const y = (second.y - first.y) * correction * 0.5;

            if (index !== 0) {

              first.x += x;

              first.y += y;

            }

            if (index + 1 !== chain.length - 1) {

              second.x -= x;

              second.y -= y;

            }

          }

        }

        context.beginPath();

        chain.forEach((point, index) =>

          index

            ? context.lineTo(point.x, point.y)

            : context.moveTo(point.x, point.y)

        );

        context.strokeStyle = "rgba(17, 53, 44, .17)";

        context.lineWidth = 6;

        context.lineCap = "round";

        context.lineJoin = "round";

        context.stroke();

        context.beginPath();

        chain.forEach((point, index) =>

          index

            ? context.lineTo(point.x, point.y)

            : context.moveTo(point.x, point.y)

        );

        const rope = context.createLinearGradient(

          chain[0].x,

          chain[0].y,

          chain[chain.length - 1].x,

          chain[chain.length - 1].y

        );

        rope.addColorStop(0, "rgba(11,124,120,.42)");

        rope.addColorStop(0.5, "rgba(41,92,80,.76)");

        rope.addColorStop(1, "rgba(11,124,120,.38)");

        context.strokeStyle = rope;

        context.lineWidth = 3;

        context.stroke();

        context.beginPath();

        chain.forEach((point, index) =>

          index

            ? context.lineTo(point.x - 0.4, point.y - 0.7)

            : context.moveTo(point.x - 0.4, point.y - 0.7)

        );

        context.strokeStyle = "rgba(244,255,251,.67)";

        context.lineWidth = 0.75;

        context.stroke();

        const mid = chain[Math.floor(chain.length / 2)];

        context.beginPath();

        context.arc(mid.x, mid.y, 3.2, 0, Math.PI * 2);

        context.fillStyle = "rgba(247,252,248,.95)";

        context.fill();

        context.beginPath();

        context.arc(mid.x, mid.y, 1.65, 0, Math.PI * 2);

        context.fillStyle = "rgba(11,124,120,.8)";

        context.fill();

      }

      force.kick *= 0.91;

      force.x *= 0.985;

      force.y *= 0.985;

      frame = requestAnimationFrame(render);

    };

    frame = requestAnimationFrame(render);

    return () => cancelAnimationFrame(frame);

  }, [activeModule, graphNodes.length]);



  useEffect(() => {

    const handleKey = (event: KeyboardEvent) => {

      const target = event.target as HTMLElement;

      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      if (event.key === "ArrowLeft")

        setActiveModule(value => Math.max(0, value - 1));

      if (event.key === "ArrowRight")

        setActiveModule(value => Math.min(MODULES.length - 1, value + 1));

    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);

  }, []);



  useEffect(() => {

    const canvas = previewCanvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext("2d");

    if (!context) return;

    let frame = 0;

    const reducedMotion = window.matchMedia(

      "(prefers-reduced-motion: reduce)"

    ).matches;

    const draw = (timestamp: number) => {

      const bounds = canvas.getBoundingClientRect();

      const ratio = Math.min(window.devicePixelRatio || 1, 2);

      if (

        canvas.width !== Math.floor(bounds.width * ratio) ||

        canvas.height !== Math.floor(bounds.height * ratio)

      ) {

        canvas.width = Math.floor(bounds.width * ratio);

        canvas.height = Math.floor(bounds.height * ratio);

      }

      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const { width, height } = bounds;

      context.clearRect(0, 0, width, height);

      const time = reducedMotion ? 0.42 : timestamp / 2100;

      const centerX = width * 0.52;

      const centerß = height * 0.48;

      const scale = Math.min(width, height) * 0.28;

      const tint =

        dtype === "float32"

          ? [63, 170, 191]

          : dtype === "int32"

            ? [49, 52, 50]

            : [11, 124, 120];



      const glow = context.createRadialGradient(

        centerX,

        centerß,

        4,

        centerX,

        centerß,

        scale * 1.55

      );

      glow.addColorStop(0, `rgba(${tint.join(",")}, .20)`);

      glow.addColorStop(0.54, `rgba(${tint.join(",")}, .055)`);

      glow.addColorStop(1, "rgba(255,255,255,0)");

      context.fillStyle = glow;

      context.fillRect(0, 0, width, height);



      if (dtype === "float32") {

        context.lineCap = "round";

        for (let path = 0; path < 20; path += 1) {

          const angle = (Math.PI * 2 * path) / 20 + time * 0.3;

          context.beginPath();

          for (let step = 0; step < 62; step += 1) {

            const p = step / 61;

            const wave = Math.sin(p * 8 + time + path * 0.42) * scale * 0.15;

            const radius = scale * (0.26 + p * 0.98) + wave;

            const x = centerX + Math.cos(angle + p * 1.6) * radius;

            const y = centerß + Math.sin(angle + p * 1.6) * radius * 0.56;

            if (!step) context.moveTo(x, y);

            else context.lineTo(x, y);

          }

          context.strokeStyle = `rgba(50, 151, 177, ${0.08 + (path % 4) * 0.018})`;

          context.lineWidth = path % 4 === 0 ? 1.7 : 0.75;

          context.stroke();

        }

        context.beginPath();

        context.arc(

          centerX,

          centerß,

          scale * 0.52 + Math.sin(time * 2) * 8,

          0,

          Math.PI * 2

        );

        context.fillStyle = "rgba(95, 191, 210, .17)";

        context.fill();

      } else if (dtype === "int32") {

        const cell = scale * 0.17;

        for (let y = -4; y <= 4; y += 1) {

          for (let x = -4; x <= 4; x += 1) {

            const depth = Math.sin(x * 0.7 + y * 0.55 + time * 1.2);

            const px = centerX + (x - y) * cell;

            const py = centerß + (x + y) * cell * 0.48 - depth * 12;

            context.save();

            context.translate(px, py);

            context.rotate(Math.PI / 6);

            context.fillStyle = `rgba(47, 50, 48, ${0.12 + (depth + 1) * 0.07})`;

            context.fillRect(

              -cell * 0.36,

              -cell * 0.36,

              cell * 0.72,

              cell * 0.72

            );

            context.restore();

          }

        }

      } else {

        for (let ring = 0; ring < 4; ring += 1) {

          const radius =

            scale * (0.22 + ring * 0.22) + Math.sin(time * 2 + ring) * 4;

          context.beginPath();

          context.arc(centerX, centerß, radius, 0, Math.PI * 2);

          context.strokeStyle = `rgba(11, 124, 120, ${0.1 + ring * 0.045})`;

          context.lineWidth = 1.5;

          context.stroke();

        }

        for (let index = 0; index < 12; index += 1) {

          const on = (index + seed) % 3 === 0;

          const angle = (Math.PI * 2 * index) / 12 + time * 0.25;

          const x = centerX + Math.cos(angle) * scale * 0.74;

          const y = centerß + Math.sin(angle) * scale * 0.42;

          context.beginPath();

          context.arc(x, y, on ? 8 : 4, 0, Math.PI * 2);

          context.fillStyle = on

            ? "rgba(11, 124, 120, .72)"

            : "rgba(11, 124, 120, .16)";

          context.fill();

        }

      }

      if (!reducedMotion) frame = requestAnimationFrame(draw);

    };

    frame = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frame);

  }, [dtype, seed]);



  useEffect(() => {

    const canvas = gpuCanvasRef.current;

    const gpu = (navigator as Navigator & { gpu?: any }).gpu;

    if (!canvas || !gpu) return;

    let active = true;

    let frame = 0;

    const init = async () => {

      try {

        const adapter = await gpu.requestAdapter();

        const device = await adapter?.requestDevice();

        const context = canvas.getContext("webgpu") as any;

        if (!device || !context || !active) return;

        const format = gpu.getPreferredCanvasFormat();

        context.configure({ device, format, alphaMode: "premultiplied" });

        const shader = device.createShaderModule({

          code: `

            struct Uniforms { time: f32, width: f32, height: f32, pad: f32 }

            @group(0) @binding(0) var<uniform> u: Uniforms;

            @vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {

              var p = array<vec2f, 3>(vec2f(-1., -1.), vec2f(3., -1.), vec2f(-1., 3.));

              return vec4f(p[i], 0., 1.);

            }

            @fragment fn fs(@builtin(position) p: vec4f) -> @location(0) vec4f {

              let uv = p.xy / vec2f(u.width, u.height);

              let d = distance(uv, vec2f(.69, .46));

              let ripple = .5 + .5 * sin(d * 35. - u.time * .001);

              let alpha = smoothstep(.62, .0, d) * (.025 + ripple * .02);

              return vec4f(.09, .48, .47, alpha);

            }`,

        });

        const uniform = device.createBuffer({ size: 16, usage: 0x40 | 0x8 });

        const pipeline = device.createRenderPipeline({

          layout: "auto",

          vertex: { module: shader, entryPoint: "vs" },

          fragment: { module: shader, entryPoint: "fs", targets: [{ format }] },

          primitive: { topology: "triangle-list" },

        });

        const bind = device.createBindGroup({

          layout: pipeline.getBindGroupLayout(0),

          entries: [{ binding: 0, resource: { buffer: uniform } }],

        });

        const render = (time: number) => {

          const bounds = canvas.getBoundingClientRect();

          const ratio = Math.min(devicePixelRatio, 2);

          canvas.width = Math.max(1, Math.floor(bounds.width * ratio));

          canvas.height = Math.max(1, Math.floor(bounds.height * ratio));

          device.queue.writeBuffer(

            uniform,

            0,

            new Float32Array([time, canvas.width, canvas.height, 0])

          );

          const encoder = device.createCommandEncoder();

          const pass = encoder.beginRenderPass({

            colorAttachments: [

              {

                view: context.getCurrentTexture().createView(),

                clearValue: { r: 0, g: 0, b: 0, a: 0 },

                loadOp: "clear",

                storeOp: "store",

              },

            ],

          });

          pass.setPipeline(pipeline);

          pass.setBindGroup(0, bind);

          pass.draw(3);

          pass.end();

          device.queue.submit([encoder.finish()]);

          if (active) frame = requestAnimationFrame(render);

        };

        setGpuReady(true);

        frame = requestAnimationFrame(render);

      } catch {

        setGpuReady(false);

      }

    };

    void init();

    return () => {

      active = false;

      cancelAnimationFrame(frame);

    };

  }, []);



  async function playSnap(frequency = 168, force = false) {

    if (!audioEnabled && !force) return;

    try {

      const AudioCtor =

        window.AudioContext ||

        (window as typeof window & { webkitAudioContext?: typeof AudioContext })

          .webkitAudioContext;

      if (!AudioCtor) return;

      const context = audioContextRef.current ?? new AudioCtor();

      audioContextRef.current = context;

      if (context.state === "suspended") await context.resume();

      

      const oscillator = context.createOscillator();

      const gain = context.createGain();

      oscillator.type = "sine";

      oscillator.frequency.setValueAtTime(frequency, context.currentTime);

      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.8, context.currentTime + 0.1);

      gain.gain.setValueAtTime(0.2, context.currentTime);

      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);

      oscillator.connect(gain).connect(context.destination);

      oscillator.start();

      oscillator.stop(context.currentTime + 0.13);

    } catch {

    }

  }



  function showCrow() {

    setCrowVisible(true);

    void playSnap(92);

    window.setTimeout(() => setCrowVisible(false), 2000);

  }



  function moveModule(direction: number) {

    setActiveModule(current =>

      Math.min(MODULES.length - 1, Math.max(0, current + direction))

    );

    void playSnap(142 + activeModule * 22);

  }



  function addCodexItem(name: string, type: string, content: string) {

    const size = byteLength(content);

    if (!content.trim() || size > MAX_CODEX_BßTES) {

      showCrow();

      return;

    }

    setCodex(items => [...items, { id: uid(), name, type, content, size }]);

    setCodexOpen(true);

    void playSnap(218);

  }



  async function consumeFiles(files: FileList | File[]) {

    for (const file of Array.from(files)) {

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

      const allowed = ["txt", "json", "svg"].includes(extension);

      if (!allowed || file.size > MAX_CODEX_BßTES) {

        showCrow();

        continue;

      }

      const content = await file.text();

      addCodexItem(file.name, extension.toUpperCase(), content);

    }

  }



  async function importOnnx(file?: File) {

    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {

      setImportError(

        "Für den lokalen Inspektor sind Dateien bis 8 MB gedacht."

      );

      showCrow();

      return;

    }

    try {

      const model = inspectOnnx(

        new Uint8Array(await file.arrayBuffer()),

        file.name

      );

      setImportedModel(model);

      setImportError("");

      setInspectorOpen(true);

      const importedDtype = model.tensor

        ? supportedDType(model.tensor.dataType)

        : model.output

          ? supportedDType(model.output.dataType)

          : null;

      if (importedDtype) {

        setDtype(importedDtype);

        const importedDims = model.tensor?.dims ?? model.output?.dims ?? [];

        setShapeText(importedDims.join(" × "));

        const importedOperation = model.nodeOps.find(

          entry => entry.op in OPERATION_DETAILS

        )?.op as TensorOp | undefined;

        setOperation(

          importedOperation &&

            allowedOperations(importedDtype).includes(importedOperation)

            ? importedOperation

            : "Identity"

        );

        const importedValues = model.tensor?.values;

        if (importedValues && importedValues.length <= MAX_ELEMENTS) {

          setValueMode("direct");

          setValueText(

            importedValues

              .map(value =>

                importedDtype === "bool"

                  ? value

                    ? "1"

                    : "0"

                  : Number(value.toFixed(6)).toString()

              )

              .join(", ")

          );

        } else {

          setValueMode("signal");

          setValueText("");

        }

        setActiveModule(2);

      }

      void playSnap(model.supported ? 274 : 112);

    } catch (error) {

      setImportedModel(null);

      setImportError(

        error instanceof Error

          ? error.message

          : "Diese Datei konnte nicht als ONNX-Modell gelesen werden."

      );

      showCrow();

    }

  }



  async function enableGraphMotion() {

    if (!("DeviceOrientationEvent" in window)) {

      setGraphMotion("unavailable");

      return;

    }

    try {

      type PermissionedOrientation = typeof DeviceOrientationEvent & {

        requestPermission?: () => Promise<PermissionState>;

      };

      type PermissionedMotion = typeof DeviceMotionEvent & {

        requestPermission?: () => Promise<PermissionState>;

      };

      const orientationApi = DeviceOrientationEvent as PermissionedOrientation;

      const motionApi = (

        "DeviceMotionEvent" in window ? DeviceMotionEvent : undefined

      ) as PermissionedMotion | undefined;

      const orientationPermission = orientationApi.requestPermission

        ? await orientationApi.requestPermission()

        : "granted";

      const motionPermission = motionApi?.requestPermission

        ? await motionApi.requestPermission()

        : "granted";

      if (

        orientationPermission !== "granted" ||

        motionPermission !== "granted"

      ) {

        setGraphMotion("denied");

        return;

      }

      if (graphOrientationListener.current)

        window.removeEventListener(

          "deviceorientation",

          graphOrientationListener.current

        );

      if (graphMotionListener.current)

        window.removeEventListener("devicemotion", graphMotionListener.current);

      graphOrientationListener.current = event => {

        const gamma = Math.max(-1, Math.min(1, (event.gamma ?? 0) / 45));

        const beta = Math.max(-1, Math.min(1, ((event.beta ?? 0) - 35) / 70));

        graphForceRef.current.x = gamma * 1.25;

        graphForceRef.current.y = beta * 0.72;

        graphForceRef.current.z = beta;

      };

      graphMotionListener.current = event => {

        const acceleration = event.acceleration;

        const impulse = Math.min(

          1.8,

          Math.abs(acceleration?.x ?? 0) +

            Math.abs(acceleration?.y ?? 0) +

            Math.abs(acceleration?.z ?? 0)

        );

        if (impulse > 0.18)

          graphForceRef.current.kick = Math.max(

            graphForceRef.current.kick,

            impulse * 0.5

          );

      };

      window.addEventListener(

        "deviceorientation",

        graphOrientationListener.current,

        { passive: true }

      );

      window.addEventListener("devicemotion", graphMotionListener.current, {

        passive: true,

      });

      setGraphMotion("active");

      void playSnap(264);

    } catch {

      setGraphMotion("denied");

    }

  }



  function guideGraph(event: React.PointerEvent<HTMLDivElement>) {

    const bounds = event.currentTarget.getBoundingClientRect();

    const x = (event.clientX - bounds.left) / bounds.width - 0.5;

    const y = (event.clientY - bounds.top) / bounds.height - 0.5;

    graphForceRef.current.x = Math.max(-1.2, Math.min(1.2, x * 1.75));

    graphForceRef.current.y = Math.max(-1, Math.min(1, y * 1.35));

    graphForceRef.current.kick = Math.max(graphForceRef.current.kick, 0.26);

  }



  function updateMatrixCell(index: number, nextValue: string) {

    const next = [...matrixTokens];

    next[index] = nextValue;

    setValueText(normalizedGridText(next));

  }



  function runFirstModelStep(step: number) {

    setDtype("float32");

    setShapeText("4 × 4");

    if (step === 0) {

      setOperation("Relu");

      setValueMode("signal");

      setActiveModule(1);

    }

    if (step === 1) {

      setOperation("Tanh");

      setValueMode("direct");

      setValueEditor("grid");

      setValueText(

        "-1, -0.5, 0, 0.5, -0.5, 0, 0.5, 1, 0, 0.5, 1, 0.5, 0.5, 1, 0.5, 0"

      );

      setActiveModule(2);

    }

    if (step === 2) {

      setCodex(items =>

        items.some(item => item.name === "meine-erste-idee.txt")

          ? items

          : [

              ...items,

              {

                id: uid(),

                name: "meine-erste-idee.txt",

                type: "TEXT",

                content:

                  "Mein erstes Tensor-Modell verbindet Form, Muster und Idee.",

                size: 57,

              },

            ]

      );

      setCodexOpen(true);

      setActiveModule(3);

    }

    setPrimerIndex(step);

    void playSnap(196 + step * 28);

  }



  function exportRouteCard() {

    const width = 960;

    const cardNodes = routeNodes.slice(0, 12);

    const gap = (width - 120) / Math.max(1, cardNodes.length - 1);

    const nodes = cardNodes

      .map((node, index) => {

        const x = 60 + gap * index;

        const y = 270 + (index % 2 ? -32 : 32);

        const hasNext = index < cardNodes.length - 1;

        const nextX = 60 + gap * Math.min(index + 1, cardNodes.length - 1);

        const nextß = 270 + ((index + 1) % 2 ? -32 : 32);

        const rope = hasNext

          ? `<path d="M ${x + 43} ${y} C ${x + 72} ${y}, ${nextX - 72} ${nextß}, ${nextX - 43} ${nextß}" fill="none" stroke="#0b7c78" stroke-width="4" stroke-linecap="round"/><path d="M ${x + 43} ${y - 1} C ${x + 72} ${y - 1}, ${nextX - 72} ${nextß - 1}, ${nextX - 43} ${nextß - 1}" fill="none" stroke="#eafff7" stroke-opacity=".65" stroke-width="1"/>`

          : "";

        return `${rope}<g transform="translate(${x}, ${y})"><ellipse rx="48" ry="34" fill="url(#stone)" stroke="#0b7c78" stroke-opacity=".62"/><text x="0" y="-6" text-anchor="middle" font-family="monospace" font-size="9" fill="#587068">${xmlEscape(node.kind.toUpperCase())}</text><text x="0" y="11" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="13" fill="#173a30">${xmlEscape(node.title).slice(0, 14)}</text></g>`;

      })

      .join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f9faf5"/><stop offset="1" stop-color="#e2eee8"/></linearGradient><radialGradient id="orb"><stop stop-color="#bdebf2" stop-opacity=".8"/><stop offset="1" stop-color="#0b7c78" stop-opacity="0"/></radialGradient><radialGradient id="stone" cx=".28" cy=".22"><stop stop-color="#ffffff"/><stop offset=".62" stop-color="#dff3ec"/><stop offset="1" stop-color="#9fcfc2"/></radialGradient></defs><rect width="960" height="540" fill="url(#bg)"/><ellipse cx="720" cy="142" rx="220" ry="150" fill="url(#orb)"/><g fill="none" stroke="#0b7c78" stroke-opacity=".22"><ellipse cx="720" cy="142" rx="135" ry="75"/><ellipse cx="720" cy="142" rx="165" ry="100" transform="rotate(28 720 142)"/><ellipse cx="720" cy="142" rx="182" ry="70" transform="rotate(-32 720 142)"/></g><text x="58" y="68" font-family="Arial, sans-serif" font-weight="800" font-size="32" fill="#173a30">tensor · Lernkarte</text><text x="60" y="96" font-family="monospace" font-size="12" letter-spacing="2" fill="#0b7c78">FLOW LENS · ${xmlEscape(info.label.toUpperCase())} · ${xmlEscape(shapeDescription)}</text><text x="60" y="158" font-family="Arial, sans-serif" font-size="20" fill="#27463c">${xmlEscape(operation)} formt den Tensor als eine lesbare Route.</text><g>${nodes}</g><line x1="60" y1="448" x2="900" y2="448" stroke="#0b7c78" stroke-opacity=".24"/><text x="60" y="482" font-family="monospace" font-size="11" fill="#587068">${cardNodes.length} STATIONEN · ${codex.length} CODEX-PROPS · LOKAL ENTWICKELT</text><text x="900" y="482" text-anchor="end" font-family="monospace" font-size="11" fill="#0b7c78">TENSOR STUDIO</text></svg>`;

    downloadLocalFile(

      svg,

      "image/svg+xml",

      `tensor-lernkarte-${operation.toLowerCase()}.svg`

    );

    setCardExported(true);

    void playSnap(284);

    window.setTimeout(() => setCardExported(false), 1500);

  }



  function saveMiniModel() {

    if (!valid) return;

    const name = miniModelName.trim() || `${typeLabel(rank)} · ${operation}`;

    const next: MiniModel = {

      ...currentMiniModel,

      id: uid(),

      name: name.slice(0, 42),

      category: miniModelCategory,

      createdAt: Date.now(),

    };

    setMiniModels(models => [next, ...models].slice(0, 12));

    setMiniModelName("");

    setActiveSceneId(next.id);

    void playSnap(238);

  }



  function loadMiniModel(model: MiniModel) {

    setDtype(model.dtype);

    setShapeText(model.shapeText);

    setOperation(model.operation);

    setAmplitude(model.amplitude);

    setSeed(model.seed);

    setValueMode(model.valueMode);

    setValueText(model.valueText);

    setCodex(model.codex);

    setActiveSceneId(model.id);

    setActiveModule(4);

    void playSnap(266);

  }



  function removeMiniModel(id: string) {

    setMiniModels(models => models.filter(model => model.id !== id));

    if (activeSceneId === id) setActiveSceneId("working-tensor");

    if (composePartnerId === id) setComposePartnerId(null);

    void playSnap(112);

  }



  function updateMiniCategory(id: string, category: MiniCategory) {

    setMiniModels(models =>

      models.map(model => (model.id === id ? { ...model, category } : model))

    );

    void playSnap(164);

  }



  function composeMiniModels() {

    if (!composePartner) {

      setComposeNotice(

        "Wähle zuerst ein gespeichertes Modell als zweiten Strang."

      );

      return;

    }

    if (

      composePartner.dtype !== dtype ||

      composePartner.shapeText !== shapeText

    ) {

      setComposeNotice(

        "Für Compose brauchen beide Modelle dieselbe Form und denselben Materialtyp."

      );

      showCrow();

      return;

    }

    const mergedCodex = [...codex, ...composePartner.codex]

      .filter(

        (item, index, items) =>

          items.findIndex(

            entry => entry.name === item.name && entry.content === item.content

          ) === index

      )

      .slice(0, 8);

    setOperation("Identity");

    setCodex(mergedCodex);

    if (valueMode === "direct" && composePartner.valueMode === "direct") {

      const first = parseTensorValues(valueText, dtype);

      const second = parseTensorValues(composePartner.valueText, dtype);

      if (

        !first.error &&

        !second.error &&

        first.values.length === second.values.length &&

        first.values.length === volume

      ) {

        const mergedValues = first.values.map((value, index) =>

          dtype === "bool"

            ? value || second.values[index]

              ? 1

              : 0

            : dtype === "int32"

              ? Math.round((value + second.values[index]) / 2)

              : Number(((value + second.values[index]) / 2).toFixed(6))

        );

        setValueText(mergedValues.join(", "));

        setValueMode("direct");

      }

    }

    setComposeNotice(

      `Verbunden: Aktueller Tensor + ${composePartner.name}. Die Werte werden bei gleicher direkter Form gemittelt, Codex-Fragmente zusammengeführt.`

    );

    setActiveSceneId("working-tensor");

    graphForceRef.current.kick = 1.2;

    void playSnap(292);

  }



  function exportModel() {

    if (!valid || !dims) return;

    const payload = buildOnnx({

      dtype,

      dims,

      op: operation,

      amplitude,

      seed,

      codex,

      realValues: valueMode === "direct" ? directValues.values : undefined,

    });

    const url = URL.createObjectURL(

      new Blob([payload], { type: "application/octet-stream" })

    );

    const anchor = document.createElement("a");

    anchor.href = url;

    anchor.download = `tensor-${rank}d-${dtype}.onnx`;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);

    setLastExported(true);

    void playSnap(268);

    window.setTimeout(() => setLastExported(false), 1600);

  }



  const active = MODULES[activeModule];



  return (

    <div

      className={`tensor-app material-${dtype}`}

      onTouchStart={event => {

        touchOrigin.current = event.changedTouches[0].clientX;

      }}

      onTouchEnd={event => {

        if (touchOrigin.current === null) return;

        const delta = event.changedTouches[0].clientX - touchOrigin.current;

        if (Math.abs(delta) > 56) moveModule(delta > 0 ? -1 : 1);

        touchOrigin.current = null;

      }}

    >

      <div className="paper-noise" aria-hidden="true" />

      <div

        className="hero-wash"

        style={{ backgroundImage: `url(${HERO_ASSET})` }}

        aria-hidden="true"

      />

      <canvas className="gpu-canvas" ref={gpuCanvasRef} aria-hidden="true" />



      <header className="topbar">

        <div className="brand-lockup" aria-label="Tensor Studio" style={{ alignItems: "flex-start" }}>

          <img className="brand-mark" src={MARK_ASSET} alt="Synshape Tensor Synthesizer Logo - A local interactive AI tool" onClick={() => setIsHelpOpen(true)} style={{ width: "38px", height: "38px", marginTop: "2px", borderRadius: "8px", objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", cursor: "pointer", pointerEvents: "auto" }} draggable={false} onContextMenu={(e) => e.preventDefault()} />

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>

            <div style={{ display: "flex", alignItems: "center" }}>

              <span className="brand-name">Synshape Tensor</span>

              <span className="brand-subtitle">Synthesizer</span>

            </div>

            <a href="https://micha1a.github.io" target="_blank" rel="noopener noreferrer" className="brand-subtitle" style={{ textDecoration: "none", color: "inherit", opacity: 0.5, margin: 0, padding: 0, border: "none" }} onMouseOver={(e) => e.currentTarget.style.opacity = "1"} onMouseOut={(e) => e.currentTarget.style.opacity = "0.5"}>by Michael Barlozewski</a>

          </div>

        </div>

        <div

          className={`model-ready ${valid ? "is-ready" : ""}`}

          aria-live="polite"

        >

          {valid && (

            <>

              <span className="ready-dot" />

              <span>{typeLabel(rank)} bereit</span>

              <span className="rank-chip">{rank}D</span>

            </>

          )}

        </div>

        <div className="top-actions">

          <button

            className="primer-launch"

            onClick={() => {

              setPrimerOpen(true);

              setPrimerIndex(0);

              void playSnap(188);

            }}

            title="Geführtes erstes Modell öffnen"

          >

            <Sparkles size={16} />

            <span>Erstes Modell</span>

          </button>

          <button

            className="import-button"

            onClick={() => modelInputRef.current?.click()}

            title="ONNX-Datei lokal öffnen"

          >

            <FolderOpen size={16} />

            <span>ONNX öffnen</span>

          </button>

          <input

            ref={modelInputRef}

            type="file"

            accept=".onnx,application/octet-stream"

            onChange={event => {

              void importOnnx(event.target.files?.[0]);

              event.target.value = "";

            }}

            hidden

          />

          <button

            className={`sound-toggle ${audioEnabled ? "is-on" : ""}`}

            onClick={() => {

              const next = !audioEnabled;

              setAudioEnabled(next);

              if (next) void playSnap(250, true);

            }}

            aria-label={

              audioEnabled

                ? "Haptischen Ton deaktivieren"

                : "Haptischen Ton aktivieren"

            }

          >

            {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}

            <span>Sound</span>

          </button>

          {valid && (

            <button

              className="export-button"

              onClick={exportModel}

              title={`Tensor als ${rank}D ONNX exportieren`}

            >

              {lastExported ? <Check size={16} /> : <Download size={16} />}

              <span>{lastExported ? "Gespeichert" : `Export ${rank}D`}</span>

            </button>

          )}

        </div>

      </header>



      {importError && (

        <div className="import-message" role="alert">

          <X size={15} />

          <span>{importError}</span>

          <button

            onClick={() => setImportError("")}

            aria-label="Meldung schließen"

          >

            <X size={14} />

          </button>

        </div>

      )}



      <div className="main-grid">

        <aside className="signal-rail" aria-label="Tensor Module">

          <span className="rail-caption">Flow</span>

          <div className="rail-line" />

          {MODULES.map((module, index) => {

            const Icon = module.icon;

            return (

              <button

                key={module.label}

                onClick={() => {

                  setActiveModule(index);

                  void playSnap(150 + index * 20);

                }}

                className={`rail-stop ${index === activeModule ? "is-active" : ""}`}

                aria-current={index === activeModule ? "step" : undefined}

                title={module.label}

              >

                <span className="rail-index">0{index + 1}</span>

                <Icon size={17} strokeWidth={1.7} />

              </button>

            );

          })}

          <div className="rail-bottom">

            <span className={`gpu-status ${gpuReady ? "is-ready" : ""}`} />

            <span>{gpuReady ? "GPU" : "CPU"}</span>

          </div>

        </aside>



        <main className="studio-stage">

          <section className="module-column" aria-labelledby="module-title">

            <div className="module-heading">

              <div>

                <p className="eyebrow">

                  <span>{active.eyebrow}</span>

                  <span className="eyebrow-rule" />

                </p>

                <h1 id="module-title">{active.label}</h1>

              </div>

              <p className="module-count">

                {String(activeModule + 1).padStart(2, "0")} <span>/ 05</span>

              </p>

            </div>



            <div className="module-body">

              {activeModule === 0 && (

                <section

                  className="content-panel"

                  aria-label="Datentyp auswählen"

                >

                  <p className="lead">

                    Aus welchem Stoff soll dein Tensor bestehen?

                  </p>

                  <div className="material-list">

                    {MATERIALS.map(material => (

                      <button

                        key={material.id}

                        className={`material-option ${dtype === material.id ? "is-selected" : ""}`}

                        onClick={() => {

                          setDtype(material.id);

                          void playSnap(

                            material.id === "float32"

                              ? 176

                              : material.id === "int32"

                                ? 132

                                : 224

                          );

                        }}

                      >

                        <span className="material-swatch" />

                        <span className="material-copy">

                          <span className="option-title">{material.label}</span>

                          <span className="option-meta">{material.meta}</span>

                        </span>

                        <span className="option-description">

                          {material.description}

                        </span>

                        <span className="selected-mark">

                          {dtype === material.id && <Check size={15} />}

                        </span>

                      </button>

                    ))}

                  </div>

                  <div className="detail-sentence">

                    <Sparkles size={15} />

                    <span>

                      <strong>{info.label}</strong> ist aktiv. Die Vorschau

                      reagiert unmittelbar auf jedes Material.

                    </span>

                  </div>

                </section>

              )}



              {activeModule === 1 && (

                <section

                  className="content-panel"

                  aria-label="Tensorform definieren"

                >

                  <p className="lead">

                    Form ist Richtung. Trenne Dimensionen mit{" "}

                    <strong>×</strong>.

                  </p>

                  <div className="shape-input-wrap">

                    <label htmlFor="shape-input">Dimensionen</label>

                    <input

                      id="shape-input"

                      value={shapeText}

                      onChange={event => setShapeText(event.target.value)}

                      placeholder="z. B. 16 × 16 × 4"

                      inputMode="numeric"

                    />

                    <span

                      className={`shape-validity ${valid ? "is-valid" : "is-invalid"}`}

                    >

                      {valid ? <Check size={14} /> : <X size={14} />}

                      {valid ? t("valid") : t("maxDims")}

                    </span>

                  </div>

                  <div className="preset-grid">

                    {SHAPE_PRESETS.map(preset => (

                      <button

                        key={preset.label}

                        onClick={() => {

                          setShapeText(preset.value);

                          void playSnap(164);

                        }}

                        className={

                          shapeText === preset.value ? "is-selected" : ""

                        }

                      >

                        <span>{preset.label}</span>

                        <small>{preset.note}</small>

                      </button>

                    ))}

                  </div>

                  <dl className="shape-readout">

                    <div>

                      <dt>{t("shapeLbl")}</dt>

                      <dd>{typeLabel(rank)}</dd>

                    </div>

                    <div>

                      <dt>{t("volumeLbl")}</dt>

                      <dd>

                        {valid ? volume.toLocaleString("de-DE") : "â€”"} Werte

                      </dd>

                    </div>

                    <div>

                      <dt>{t("memoryLbl")}</dt>

                      <dd>

                        {valid

                          ? `${((volume * info.bytes) / 1024).toFixed(volume * info.bytes < 1024 ? 1 : 0)} KB`

                          : "â€”"}

                      </dd>

                    </div>

                  </dl>

                </section>

              )}



              {activeModule === 2 && (

                <section

                  className="content-panel"

                  aria-label="Tensoroperation und Werte wählen"

                >

                  <p className="lead">

                    Ein Impuls, der im exportierten ONNX-Graphen weiterlebt.

                  </p>

                  <div className="operation-list">

                    {(Object.keys(OPERATION_DETAILS) as TensorOp[]).map(op => {

                      const enabled = allowedOps.includes(op);

                      return (

                        <button

                          key={op}

                          disabled={!enabled}

                          className={operation === op ? "is-selected" : ""}

                          onClick={() => {

                            setOperation(op);

                            void playSnap(200);

                          }}

                        >

                          <span>{op}</span>

                          <small>{OPERATION_DETAILS[op].description}</small>

                          {operation === op && <Check size={15} />}

                        </button>

                      );

                    })}

                  </div>

                  <div className="range-block">

                    <div>

                      <label htmlFor="amplitude">Amplitude</label>

                      <output>{amplitude.toFixed(2)}</output>

                    </div>

                    <input

                      id="amplitude"

                      type="range"

                      min="0.1"

                      max="1.6"

                      step="0.05"

                      value={amplitude}

                      onChange={event =>

                        setAmplitude(Number(event.target.value))

                      }

                    />

                  </div>

                  <div className="seed-row">

                    <span>

                      <Hash size={14} /> Seed

                    </span>

                    <input

                      value={seed}

                      onChange={event =>

                        setSeed(

                          Number(event.target.value.replace(/\D/g, "")) || 0

                        )

                      }

                      inputMode="numeric"

                    />

                    <button

                      onClick={() => {

                        const next = Math.floor(Math.random() * 999);

                        setSeed(next);

                        void playSnap(248);

                      }}

                    >

                      Neu würfeln <MoveRight size={14} />

                    </button>

                  </div>

                  <section

                    className="value-workbench"

                    aria-label="Echte Tensorwerte eingeben"

                  >

                    <div className="value-heading">

                      <div>

                        <span className="option-meta">Value Source</span>

                        <strong>Welche Werte sollen hinein?</strong>

                      </div>

                      <span className="value-count">

                        {valueMode === "direct"

                          ? `${directValues.values.length} / ${volume}`

                          : "Signal"}

                      </span>

                    </div>

                    <div

                      className="value-mode-switch"

                      role="group"

                      aria-label="Wertquelle wählen"

                    >

                      <button

                        className={valueMode === "signal" ? "is-selected" : ""}

                        onClick={() => {

                          setValueMode("signal");

                          void playSnap(158);

                        }}

                      >

                        Signal

                      </button>

                      <button

                        className={valueMode === "direct" ? "is-selected" : ""}

                        onClick={() => {

                          setValueMode("direct");

                          setValueEditor("text");

                          void playSnap(218);

                        }}

                      >

                        Eigene Werte

                      </button>

                    </div>

                    {valueMode === "signal" ? (

                      <p className="signal-description">

                        Der Seed erzeugt eine reproduzierbare Folge. Ideal, um

                        Form und Operation spielerisch zu erkunden.

                      </p>

                    ) : (

                      <>

                        {canUseMatrixGrid && (

                          <div

                            className="value-editor-switch"

                            role="group"

                            aria-label="Eingabeform wählen"

                          >

                            <button

                              className={

                                valueEditor === "text" ? "is-selected" : ""

                              }

                              onClick={() => setValueEditor("text")}

                            >

                              Folge

                            </button>

                            <button

                              className={

                                valueEditor === "grid" ? "is-selected" : ""

                              }

                              onClick={() => {

                                setValueEditor("grid");

                                if (!valueText.trim())

                                  setValueText(

                                    Array.from(

                                      { length: volume },

                                      () => "0"

                                    ).join(", ")

                                  );

                                void playSnap(224);

                              }}

                            >

                              Matrix-Grid

                            </button>

                          </div>

                        )}

                        {valueEditor === "grid" && canUseMatrixGrid ? (

                          <div className="matrix-grid-wrap">

                            <div className="matrix-grid-label">

                              <span>

                                {matrixRows} Zeilen × {matrixCols} Spalten

                              </span>

                              <span className="heatmap-key">

                                <i />

                                zart <i />

                                intensiv

                              </span>

                              <button

                                onClick={() => {

                                  setValueText(

                                    Array.from(

                                      { length: volume },

                                      () => "0"

                                    ).join(", ")

                                  );

                                  void playSnap(126);

                                }}

                              >

                                <RotateCcw size={12} />

                                Nullen

                              </button>

                            </div>

                            <div

                              className="matrix-grid"

                              style={{

                                gridTemplateColumns: `repeat(${matrixCols}, minmax(42px, 1fr))`,

                              }}

                            >

                              {matrixTokens.map((token, index) => (

                                <input

                                  key={index}

                                  value={token}

                                  onChange={event =>

                                    updateMatrixCell(index, event.target.value)

                                  }

                                  style={{

                                    backgroundColor: heatmapColor(

                                      token,

                                      dtype,

                                      heatMaximum

                                    ),

                                  }}

                                  inputMode={

                                    dtype === "float32" ? "decimal" : "numeric"

                                  }

                                  aria-label={`Zeile ${Math.floor(index / matrixCols) + 1}, Spalte ${(index % matrixCols) + 1}`}

                                />

                              ))}

                            </div>

                          </div>

                        ) : (

                          <textarea

                            className="value-input"

                            value={valueText}

                            onChange={event => setValueText(event.target.value)}

                            placeholder={

                              dtype === "bool"

                                ? "1, 0, true, false â€¦"

                                : "0.1, -0.2, 0.8, 1.0 â€¦"

                            }

                            aria-label="Tensorwerte, durch Komma oder Leerzeichen getrennt"

                          />

                        )}

                        {!canUseMatrixGrid && rank === 2 && (

                          <p className="grid-note">

                            Für das Grid sind bis zu {MAX_MATRIX_CELLS}{" "}

                            Matrixzellen vorgesehen; deine Folge bleibt dennoch

                            vollständig editierbar.

                          </p>

                        )}

                        <p

                          className={`value-feedback ${valueCountMatches ? "is-valid" : "is-invalid"}`}

                        >

                          {directValues.error ? (

                            directValues.error

                          ) : directValues.values.length === volume ? (

                            <>

                              <Check size={13} />

                              Exakt {volume} Werte â€” bereit.

                            </>

                          ) : (

                            <>

                              <Hash size={13} />

                              Noch{" "}

                              {Math.max(

                                0,

                                volume - directValues.values.length

                              )}{" "}

                              Wert

                              {Math.abs(volume - directValues.values.length) ===

                              1

                                ? ""

                                : "e"}{" "}

                              ergänzen.

                            </>

                          )}

                        </p>

                      </>

                    )}

                  </section>

                </section>

              )}



              {activeModule === 3 && (

                <section

                  className="content-panel codex-panel"

                  aria-label="Wissen als Codex einbetten"

                >

                  <p className="lead">

                    Wissen wird ohne Datenbank direkt als Metadaten in dein

                    Modell gefaltet.

                  </p>

                  <div

                    className={`drop-zone ${dragActive ? "is-dragging" : ""}`}

                    onDragOver={event => {

                      event.preventDefault();

                      setDragActive(true);

                    }}

                    onDragLeave={() => setDragActive(false)}

                    onDrop={event => {

                      event.preventDefault();

                      setDragActive(false);

                      void consumeFiles(event.dataTransfer.files);

                    }}

                    onClick={() => fileInputRef.current?.click()}

                    role="button"

                    tabIndex={0}

                    onKeyDown={event => {

                      if (event.key === "Enter") fileInputRef.current?.click();

                    }}

                  >

                    <FileUp size={19} />

                    <div>

                      <strong>Datei in den Codex legen</strong>

                      <span>.txt, .json oder .svg · bis 250 KB</span>

                    </div>

                    <span className="drop-hint">Drop</span>

                    <input

                      ref={fileInputRef}

                      type="file"

                      accept=".txt,.json,.svg,text/plain,application/json,image/svg+xml"

                      onChange={event => {

                        if (event.target.files)

                          void consumeFiles(event.target.files);

                        event.target.value = "";

                      }}

                      hidden

                    />

                  </div>

                  <div className="manual-inject">

                    <textarea

                      value={draftText}

                      onChange={event => setDraftText(event.target.value)}

                      placeholder="Eine Notiz, JSON oder Vektorfolge einbetten â€¦"

                    />

                    <button

                      onClick={() => {

                        addCodexItem(

                          `notiz-${codex.length + 1}.txt`,

                          "TEXT",

                          draftText

                        );

                        setDraftText("");

                      }}

                      disabled={!draftText.trim()}

                    >

                      <Plus size={15} />

                      Injizieren

                    </button>

                  </div>

                  <button

                    className={`codex-core ${codexOpen ? "is-open" : ""}`}

                    onClick={() => {

                      setCodexOpen(value => !value);

                      void playSnap(codexOpen ? 132 : 238);

                    }}

                    aria-expanded={codexOpen}

                  >

                    <span

                      className="core-visual"

                      style={{ backgroundImage: `url(${CODEX_ASSET})` }}

                    />

                    <span className="core-copy">

                      <span className="option-meta">Codex Kern</span>

                      <strong>

                        {codex.length

                          ? `${codex.length} ${codex.length === 1 ? "Fragment" : "Fragmente"}`

                          : "Noch leer"}

                      </strong>

                      <small>

                        {codexOpen

                          ? "Glass-Plates schließen"

                          : "Glass-Plates entfalten"}

                      </small>

                    </span>

                    <Box size={18} />

                  </button>

                  {codexOpen && (

                    <div className="codex-plates">

                      {codex.length ? (

                        codex.map(item => (

                          <article key={item.id} className="glass-plate">

                            <div>

                              <span>{item.type}</span>

                              <strong>{item.name}</strong>

                              <small>

                                {item.size.toLocaleString("de-DE")} B

                                serialisiert

                              </small>

                            </div>

                            <button

                              onClick={event => {

                                event.stopPropagation();

                                setCodex(items =>

                                  items.filter(entry => entry.id !== item.id)

                                );

                              }}

                              aria-label={`${item.name} entfernen`}

                            >

                              <X size={15} />

                            </button>

                          </article>

                        ))

                      ) : (

                        <p>

                          Deine ersten Fragmente erscheinen hier als gefaltete

                          Glass-Plates.

                        </p>

                      )}

                    </div>

                  )}

                </section>

              )}



              {activeModule === 4 && (

                <section

                  className="content-panel graph-panel"

                  aria-label="Physische ONNX-Flusslinse"

                >

                  <p className="lead">

                    Die Flusslinse zeigt, wie dein Tensor durch einen Impuls

                    wandert â€” als fühlbare Spur statt als Fachchinesisch.

                  </p>

                  <div

                    className="graph-stage"

                    onPointerMove={guideGraph}

                    onPointerDown={guideGraph}

                  >

                    <canvas

                      ref={graphCanvasRef}

                      className="graph-canvas"

                      aria-hidden="true"

                    />

                    {graphNodes.map((node, index) => (

                      <article

                        key={node.id}

                        className={`graph-node graph-node-${node.kind} ${matchedRouteIds.has(node.id) ? "is-match" : "is-dim"} ${focusedRouteNode === node.id ? "is-focused" : ""}`}

                        style={

                          {

                            "--node-x": `${14 + (index / Math.max(1, graphNodes.length - 1)) * 72}%`,

                            "--node-y": `${50 + (index % 2 ? -12 : 12)}%`,

                          } as React.CSSProperties

                        }

                      >

                        <span className="node-cap">

                          <Activity size={11} />

                          {node.kind}

                        </span>

                        <strong>{node.title}</strong>

                        <small>{node.detail}</small>

                      </article>

                    ))}

                    <span className="graph-grain" aria-hidden="true" />

                  </div>

                  <div className="route-search">

                    <label htmlFor="route-search">{t("routeRead")}</label>

                    <input

                      id="route-search"

                      value={graphQuery}

                      onChange={event => setGraphQuery(event.target.value)}

                      placeholder="Station, Impuls oder Name suchen â€¦"

                    />

                    <span>

                      {matchedRouteIds.size} / {routeNodes.length}

                    </span>

                  </div>

                  <div

                    className="graph-route"

                    aria-label="Durchsuchbare Tensor-Spur"

                  >

                    {routeNodes.map((node, index) => (

                      <button

                        key={`route-${node.id}`}

                        className={`${matchedRouteIds.has(node.id) ? "is-match" : "is-dim"} ${focusedRouteNode === node.id ? "is-focused" : ""}`}

                        onClick={() => {

                          setFocusedRouteNode(node.id);

                          graphForceRef.current.kick = 0.65;

                          void playSnap(175);

                        }}

                      >

                        <span>{String(index + 1).padStart(2, "0")}</span>

                        <strong>{node.title}</strong>

                        <small>{node.detail}</small>

                      </button>

                    ))}

                  </div>

                  <div className="route-actions">

                    <div>

                      <span className="option-meta">Lernkarte</span>

                      <strong>

                        Diese Route als lesbare Erinnerung mitnehmen.

                      </strong>

                    </div>

                    <button onClick={exportRouteCard}>

                      {cardExported ? (

                        <Check size={15} />

                      ) : (

                        <Download size={15} />

                      )}

                      <span>

                        {cardExported ? "Gespeichert" : "Karte sichern"}

                      </span>

                    </button>

                  </div>

                  <section

                    className="scene-deck"

                    aria-label="Mehrere Tensoren verbinden"

                  >

                    <div className="scene-heading">

                      <div>

                        <span className="option-meta">{t("sceneDeck")}</span>

                        <strong>

                          Zwei Stränge können eine neue, ruhige Einheit

                          bilden.

                        </strong>

                      </div>

                      <span>{sceneModels.length} / 5</span>

                    </div>

                    <div className="scene-stage">

                      {sceneModels.map((model, index) => (

                        <button

                          key={model.id}

                          className={`scene-orb ${activeSceneId === model.id ? "is-active" : ""} ${composePartnerId === model.id ? "is-partner" : ""}`}

                          style={

                            {

                              "--scene-x": `${10 + index * 21}%`,

                              "--scene-y": `${48 + (index % 2 ? -13 : 13)}%`,

                            } as React.CSSProperties

                          }

                          onClick={() => {

                            setActiveSceneId(model.id);

                            if (model.id !== "working-tensor") {

                              setComposePartnerId(model.id);

                              setComposeNotice(

                                `${model.name} liegt als zweiter Strang bereit.`

                              );

                            } else {

                              setComposePartnerId(null);

                              setComposeNotice("");

                            }

                            void playSnap(184);

                          }}

                        >

                          <span>

                            {model.id === "working-tensor"

                              ? t("now")

                              : `M${index}`}

                          </span>

                          <strong>{model.name}</strong>

                          <small>

                            {model.shapeText || "Scalar"} · {model.operation}

                          </small>

                        </button>

                      ))}

                      <span className="scene-thread" aria-hidden="true" />

                    </div>

                    <div className="compose-strip">

                      <div>

                        <span className="option-meta">Compose</span>

                        <strong>

                          {composePartner

                            ? `Aktueller Tensor + ${composePartner.name}`

                            : "Wähle einen zweiten Strang in der Szene."}

                        </strong>

                      </div>

                      <button

                        onClick={composeMiniModels}

                        disabled={!composePartner}

                      >

                        <Sparkles size={15} />

                        <span>{t("composeBtn")}</span>

                      </button>

                    </div>

                    {composeNotice && (

                      <p className="compose-note">{composeNotice}</p>

                    )}

                    <p className="scene-note">

                      Compose ist absichtlich einfach: Bei gleicher Form und

                      gleichem Material mittelt Tensor direkte Zahlenwerte und

                      faltet Codex-Fragmente zusammen.

                    </p>

                  </section>

                  <section

                    className={`model-shelf ${shelfOpen ? "is-open" : ""}`}

                    aria-label="Lokaler Beispielspeicher"

                  >

                    <button

                      className="shelf-toggle"

                      onClick={() => setShelfOpen(open => !open)}

                      aria-expanded={shelfOpen}

                    >

                      <span className="shelf-orb">

                        <Save size={15} />

                      </span>

                      <span>

                        <span className="option-meta">

                          Lokaler Beispielspeicher

                        </span>

                        <strong>

                          {miniModels.length

                            ? `${miniModels.length} ${miniModels.length === 1 ? "Mini-Modell" : "Mini-Modelle"}`

                            : "Noch keine Mini-Modelle"}

                        </strong>

                        <small>

                          {shelfOpen

                            ? "Speicher schließen"

                            : "Speichern, laden oder aufräumen"}

                        </small>

                      </span>

                      {shelfOpen ? (

                        <ChevronUp size={17} />

                      ) : (

                        <ChevronDown size={17} />

                      )}

                    </button>

                    {shelfOpen && (

                      <div className="shelf-details">

                        <div className="save-model-row">

                          <input

                            value={miniModelName}

                            onChange={event =>

                              setMiniModelName(event.target.value)

                            }

                            maxLength={42}

                            placeholder="Name für dieses Modell â€¦"

                          />

                          <select

                            value={miniModelCategory}

                            onChange={event =>

                              setMiniModelCategory(

                                event.target.value as MiniCategory

                              )

                            }

                            aria-label="Kategorie für neues Mini-Modell"

                          >

                            {MINI_CATEGORIES.map(category => (

                              <option key={category} value={category}>

                                {category}

                              </option>

                            ))}

                          </select>

                          <button onClick={saveMiniModel} disabled={!valid}>

                            <Save size={14} />

                            Merken

                          </button>

                        </div>

                        <div

                          className="category-filter"

                          aria-label="Mini-Modelle nach Kategorie filtern"

                        >

                          <button

                            className={

                              categoryFilter === "Alle" ? "is-active" : ""

                            }

                            onClick={() => setCategoryFilter("Alle")}

                          >

                            Alle

                          </button>

                          {MINI_CATEGORIES.map(category => (

                            <button

                              key={category}

                              className={

                                categoryFilter === category ? "is-active" : ""

                              }

                              onClick={() => setCategoryFilter(category)}

                            >

                              {category}

                            </button>

                          ))}

                        </div>

                        {visibleMiniModels.length ? (

                          <div className="saved-models">

                            {visibleMiniModels.map(model => (

                              <article key={model.id}>

                                <button onClick={() => loadMiniModel(model)}>

                                  <span className="saved-dot" />

                                  <span>

                                    <strong>{model.name}</strong>

                                    <small>

                                      {model.category} ·{" "}

                                      {model.shapeText || "Scalar"} ·{" "}

                                      {model.operation}

                                    </small>

                                  </span>

                                </button>

                                <select

                                  value={model.category}

                                  onChange={event =>

                                    updateMiniCategory(

                                      model.id,

                                      event.target.value as MiniCategory

                                    )

                                  }

                                  aria-label={`${model.name} kategorisieren`}

                                >

                                  {MINI_CATEGORIES.map(category => (

                                    <option key={category} value={category}>

                                      {category}

                                    </option>

                                  ))}

                                </select>

                                <button

                                  className="remove-model"

                                  onClick={() => removeMiniModel(model.id)}

                                  aria-label={`${model.name} entfernen`}

                                >

                                  <Trash2 size={14} />

                                </button>

                              </article>

                            ))}

                          </div>

                        ) : (

                          <p className="shelf-empty">

                            In dieser Kategorie liegen noch keine Mini-Modelle.

                            Speichere ein kleines Modell, um es später wieder

                            hervorzuholen.

                          </p>

                        )}

                      </div>

                    )}

                  </section>

                  <div className="graph-controls">

                    <div>

                      <span className="option-meta">Tactile flow</span>

                      <strong>

                        {graphMotion === "active"

                          ? "Bewegung lenkt die Leinen"

                          : graphMotion === "denied"

                            ? "Maus und Finger übernehmen"

                            : "Bewege Maus oder Finger"}

                      </strong>

                    </div>

                    <button

                      className={`motion-button ${graphMotion === "active" ? "is-active" : ""}`}

                      onClick={() => void enableGraphMotion()}

                      disabled={

                        graphMotion === "active" ||

                        graphMotion === "unavailable"

                      }

                    >

                      {graphMotion === "active" ? (

                        <Check size={15} />

                      ) : graphMotion === "unavailable" ? (

                        <MousePointer2 size={15} />

                      ) : (

                        <Smartphone size={15} />

                      )}

                      <span>

                        {graphMotion === "active"

                          ? "Aktiv"

                          : graphMotion === "unavailable"

                            ? "Touch-Flow"

                            : "Bewegung aktivieren"}

                      </span>

                    </button>

                  </div>

                  <p className="graph-note">

                    Die Sensorfreigabe ist optional und bleibt nur für diesen

                    Moment aktiv. Ohne sie reagiert die Ansicht auf Berührung

                    und Maus.

                  </p>

                </section>

              )}

            </div>



            <nav className="module-nav" aria-label="Modulnavigation">

              <button

                onClick={() => moveModule(-1)}

                disabled={activeModule === 0}

              >

                <ArrowLeft size={17} />

                <span>Zurück</span>

              </button>

              <span className="navigation-hint">

                <AudioLines size={14} />

                Wischen oder Pfeiltasten

              </span>

              <button

                onClick={() => moveModule(1)}

                disabled={activeModule === MODULES.length - 1}

              >

                <span>Weiter</span>

                <ArrowRight size={17} />

              </button>

            </nav>

          </section>



          <aside

            className="preview-column"

            aria-label="Live-Vorschau des Tensors"

          >

            <div className="preview-topline">

              <span className="eyebrow">Live tensor</span>

              <span className="preview-status">

                <i /> {gpuReady ? "WebGPU layer" : "Canvas layer"}

              </span>

            </div>

            <div className="tensor-vessel">

              <canvas

                ref={previewCanvasRef}

                className="preview-canvas"

                aria-label={`Visualisierung: ${dtype}, ${shapeDescription}`}

              />

              <div className="vessel-center">

                <span>{rank}D</span>

                <strong>{info.label}</strong>

                <small>{shapeDescription}</small>

              </div>

              <span className="vessel-orbit orbit-one" />

              <span className="vessel-orbit orbit-two" />

            </div>

            <div className="specimen-note">

              <span className="note-line" />

              <p>

                <strong>

                  {dtype === "float32"

                    ? "Plasma Flux"

                    : dtype === "int32"

                      ? "Voxel Cores"

                      : "Trigger Pulse"}

                </strong>{" "}

                · {typeLabel(rank)} · {operation}

              </p>

            </div>

            <div className="metadata-strip">

              <div>

                <span>Schema</span>

                <strong>

                  {info.label} [

                  {modelValid ? (rank ? resolvedDims.join(", ") : "") : "â€¦"}]

                </strong>

              </div>

              <div>

                <span>Werte</span>

                <strong>

                  {valueMode === "direct"

                    ? `${directValues.values.length} direkt`

                    : "Signal"}

                </strong>

              </div>

              <div>

                <span>Codex</span>

                <strong>{codex.length} props</strong>

              </div>

            </div>

            {importedModel && (

              <section

                className={`model-inspector ${inspectorOpen ? "is-open" : ""}`}

                aria-label="Lokaler ONNX-Modellinspektor"

              >

                <button

                  className="inspector-toggle"

                  onClick={() => {

                    setInspectorOpen(value => !value);

                    void playSnap(inspectorOpen ? 132 : 232);

                  }}

                  aria-expanded={inspectorOpen}

                >

                  <span className="inspector-orb">

                    <FolderOpen size={15} />

                  </span>

                  <span>

                    <span className="option-meta">Local ONNX</span>

                    <strong>{importedModel.fileName}</strong>

                    <small>

                      {importedModel.supported

                        ? "Im Studio übernommen"

                        : "Lesbar, aber nicht vollständig editierbar"}

                    </small>

                  </span>

                  {inspectorOpen ? (

                    <ChevronUp size={17} />

                  ) : (

                    <ChevronDown size={17} />

                  )}

                </button>

                {inspectorOpen && (

                  <div className="inspector-details">

                    <dl className="import-facts">

                      <div>

                        <dt>Graph</dt>

                        <dd>{importedModel.graphName}</dd>

                      </div>

                      <div>

                        <dt>Erzeugt von</dt>

                        <dd>{importedModel.producer}</dd>

                      </div>

                      <div>

                        <dt>Kompatibilität</dt>

                        <dd>

                          {importedModel.tensor

                            ? datatypeName(importedModel.tensor.dataType)

                            : importedModel.output

                              ? datatypeName(importedModel.output.dataType)

                              : "unbekannt"}

                        </dd>

                      </div>

                      <div>

                        <dt>Format</dt>

                        <dd>

                          IR {importedModel.irVersion} · {importedModel.opset}

                        </dd>

                      </div>

                    </dl>

                    <div className="inspector-section">

                      <span className="option-meta">Graph pulses</span>

                      <div className="node-chips">

                        {importedModel.nodeOps.length ? (

                          importedModel.nodeOps.map((node, index) => (

                            <span key={`${node.name}-${index}`}>{node.op}</span>

                          ))

                        ) : (

                          <span>{t("noNodes")}</span>

                        )}

                      </div>

                    </div>

                    <div className="inspector-section">

                      <span className="option-meta">Metadata props</span>

                      {importedModel.metadata.length ? (

                        <div className="metadata-list">

                          {importedModel.metadata.slice(0, 6).map(entry => (

                            <div key={entry.key}>

                              <strong>{entry.key}</strong>

                              <span>{entry.value}</span>

                            </div>

                          ))}

                        </div>

                      ) : (

                        <p className="inspector-empty">

                          Dieses Modell trägt keine zusätzlichen Metadaten.

                        </p>

                      )}

                    </div>

                  </div>

                )}

              </section>

            )}

            {valid && (

              <button className="preview-export" onClick={exportModel}>

                <Download size={16} />

                <span>Dieses Objekt als .onnx speichern</span>

                <ArrowRight size={16} />

              </button>

            )}

            {!valid && (

              <div className="validation-callout">

                <ShieldCheck size={16} />

                {modelValid

                  ? t("matchValuesNotice")

                  : t("validExportNotice")}

              </div>

            )}

          </aside>

        </main>

      </div>

      {crowVisible && (

        <div className="crow-intercept" role="alert">

          <svg viewBox="0 0 96 78" aria-hidden="true">

            <path

              d="M13 48 26 38l12-23 15 11 15-3 15 16-13 9 5 15-17-3-16 6-12-12Z"

              fill="#111815"

            />

            <path d="m79 36 15 5-14 8Z" fill="#111815" />

            <circle cx="65" cy="32" r="3" fill="#e8eee9" />

            <circle cx="65" cy="32" r="1.2" fill="#0a0e0c" />

          </svg>

          <span>NO.</span>

        </div>

      )}

      {primerOpen && (

        <div

          className="primer-overlay"

          role="dialog"

          aria-modal="true"

          aria-label={t("firstModel")}

        >

          <section className="primer-card">

            <button

              className="primer-close"

              onClick={() => setPrimerOpen(false)}

              aria-label="Erstes Modell schließen"

            >

              <X size={17} />

            </button>

            <span className="option-meta">

              Erstes Modell · {primerIndex + 1} / 3

            </span>

            <h2>{FIRST_MODEL_STEPS[primerIndex].title}</h2>

            <p>{FIRST_MODEL_STEPS[primerIndex].copy}</p>

            <div className="primer-steps">

              {FIRST_MODEL_STEPS.map((step, index) => (

                <button

                  key={step.title}

                  className={

                    index === primerIndex

                      ? "is-active"

                      : index < primerIndex

                        ? "is-done"

                        : ""

                  }

                  onClick={() => setPrimerIndex(index)}

                >

                  <span>0{index + 1}</span>

                  {step.title}

                </button>

              ))}

            </div>

            <button

              className="primer-action"

              onClick={() => {

                runFirstModelStep(primerIndex);

                if (primerIndex === FIRST_MODEL_STEPS.length - 1)

                  setPrimerOpen(false);

                else setPrimerIndex(index => index + 1);

              }}

            >

              <Sparkles size={16} />

              <span>{FIRST_MODEL_STEPS[primerIndex].action}</span>

              <ArrowRight size={16} />

            </button>

          </section>

        </div>

      )}

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

    </div>

  );

}

