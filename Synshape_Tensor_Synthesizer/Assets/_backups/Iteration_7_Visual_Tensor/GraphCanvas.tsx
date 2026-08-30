/**
 * Signal Cartography implementation reminder: topology takes visual precedence.
 * Pointer samples stay in refs and render at animation-frame cadence rather than React-state cadence.
 */
import { useEffect, useRef } from "react";
import {
  DrawMode,
  InteractionTool,
  TelemetrySample,
  TensorEdge,
  TensorNode,
} from "@/lib/tensor";

interface GraphCanvasProps {
  nodes: TensorNode[];
  edges: TensorEdge[];
  selectedNodeId: string | null;
  tool: InteractionTool;
  drawMode: DrawMode;
  onStrokeComplete: (samples: TelemetrySample[]) => void;
  onSelect: (nodeId: string | null) => void;
  onConnect: (sourceId: string, targetId: string) => void;
  onMoveNode: (nodeId: string, position: { x: number; y: number }) => void;
  onTelemetry: (sample: TelemetrySample) => void;
  onEdgeSelect: (edge: TensorEdge | null) => void;
  highlightedNodeId: string | null;
  highlightedEdgeId: string | null;
}

type PointerPosition = { x: number; y: number };

const isRag = (node: TensorNode) => node.kind === "rag";

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

export default function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  tool,
  drawMode,
  onStrokeComplete,
  onSelect,
  onConnect,
  onMoveNode,
  onTelemetry,
  onEdgeSelect,
  highlightedNodeId,
  highlightedEdgeId,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimensionsRef = useRef({ width: 1, height: 1, dpr: 1 });
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const selectedRef = useRef(selectedNodeId);
  const highlightedNodeRef = useRef(highlightedNodeId);
  const highlightedEdgeRef = useRef(highlightedEdgeId);
  const pointerRef = useRef<PointerPosition | null>(null);
  const samplesRef = useRef<TelemetrySample[]>([]);
  const connectingSourceRef = useRef<string | null>(null);
  const draggingRef = useRef<string | null>(null);
  const lastEmitRef = useRef(0);

  useEffect(() => void (nodesRef.current = nodes), [nodes]);
  useEffect(() => void (edgesRef.current = edges), [edges]);
  useEffect(
    () => void (selectedRef.current = selectedNodeId),
    [selectedNodeId]
  );
  useEffect(
    () => void (highlightedNodeRef.current = highlightedNodeId),
    [highlightedNodeId]
  );
  useEffect(
    () => void (highlightedEdgeRef.current = highlightedEdgeId),
    [highlightedEdgeId]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dimensionsRef.current = {
        width: bounds.width,
        height: bounds.height,
        dpr,
      };
      canvas.width = Math.floor(bounds.width * dpr);
      canvas.height = Math.floor(bounds.height * dpr);
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;

    const nodeCenter = (node: TensorNode) => ({
      x: node.position.x * dimensionsRef.current.width,
      y: node.position.y * dimensionsRef.current.height,
    });

    const drawPath = (
      samples: TelemetrySample[],
      color: string,
      width: number,
      alpha = 1
    ) => {
      if (samples.length < 2) return;
      context.save();
      context.strokeStyle = color;
      context.lineWidth = width;
      context.globalAlpha = alpha;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      samples.forEach((sample, index) => {
        const x = sample.x * dimensionsRef.current.width;
        const y = sample.y * dimensionsRef.current.height;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
      context.restore();
    };

    const draw = () => {
      const { width, height, dpr } = dimensionsRef.current;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const nodeMap = new Map(nodesRef.current.map(node => [node.id, node]));
      edgesRef.current.forEach(edge => {
        const source = nodeMap.get(edge.from);
        const target = nodeMap.get(edge.to);
        if (!source || !target) return;
        const a = nodeCenter(source);
        const b = nodeCenter(target);
        const valid = edge.valid;
        const highlighted = edge.id === highlightedEdgeRef.current;
        context.save();
        context.strokeStyle = highlighted
          ? "rgba(117, 229, 239, .88)"
          : valid
            ? "rgba(117, 229, 239, .30)"
            : "rgba(255, 105, 110, .92)";
        context.lineWidth = highlighted ? 5.5 : valid ? 3.4 : 2.2;
        if (!valid) context.setLineDash([6, 5]);
        context.beginPath();
        context.moveTo(a.x + 88, a.y);
        context.bezierCurveTo(a.x + 144, a.y, b.x - 144, b.y, b.x - 88, b.y);
        context.stroke();
        if (valid) {
          context.strokeStyle = "rgba(200, 255, 90, .98)";
          context.lineWidth = 1.25;
          context.setLineDash([12, 66]);
          context.lineDashOffset = -(performance.now() / 18) % 78;
          context.beginPath();
          context.moveTo(a.x + 88, a.y);
          context.bezierCurveTo(a.x + 144, a.y, b.x - 144, b.y, b.x - 88, b.y);
          context.stroke();
          context.lineDashOffset = 0;
        }
        context.setLineDash([]);
        const labelX = (a.x + b.x) / 2;
        const labelY = (a.y + b.y) / 2 - 12;
        context.font = "10px 'IBM Plex Mono', monospace";
        const label = valid ? edge.op.toUpperCase() : "CONFLICT";
        const labelWidth = context.measureText(label).width + 14;
        roundedRect(
          context,
          labelX - labelWidth / 2,
          labelY - 9,
          labelWidth,
          18,
          4
        );
        context.fillStyle = highlighted
          ? "rgba(12, 43, 50, .98)"
          : valid
            ? "rgba(13, 25, 29, .94)"
            : "rgba(60, 18, 20, .94)";
        context.fill();
        if (highlighted) {
          context.strokeStyle = "#75e5ef";
          context.lineWidth = 1;
          context.stroke();
        }
        context.fillStyle = valid ? "#c8ff5a" : "#ff8388";
        context.textAlign = "center";
        context.fillText(label, labelX, labelY + 4);
        context.restore();
      });

      if (connectingSourceRef.current && pointerRef.current) {
        const source = nodeMap.get(connectingSourceRef.current);
        if (source) {
          const a = nodeCenter(source);
          const b = {
            x: pointerRef.current.x * width,
            y: pointerRef.current.y * height,
          };
          context.save();
          context.strokeStyle = "rgba(200, 255, 90, .75)";
          context.lineWidth = 1.5;
          context.setLineDash([4, 6]);
          context.beginPath();
          context.moveTo(a.x + 88, a.y);
          context.bezierCurveTo(a.x + 140, a.y, b.x - 80, b.y, b.x, b.y);
          context.stroke();
          context.restore();
        }
      }

      nodesRef.current.forEach(node => {
        const center = nodeCenter(node);
        const selected = node.id === selectedRef.current;
        const highlighted = node.id === highlightedNodeRef.current;
        const width = 176;
        const height = 90;
        const x = center.x - width / 2;
        const y = center.y - height / 2;
        const rag = isRag(node);
        context.save();
        context.shadowColor = highlighted
          ? "rgba(117,229,239,.42)"
          : selected
            ? "rgba(200,255,90,.20)"
            : "rgba(0,0,0,.28)";
        context.shadowBlur = highlighted ? 34 : selected ? 24 : 12;
        roundedRect(context, x, y, width, height, 8);
        context.fillStyle = rag
          ? "rgba(13, 33, 38, .95)"
          : "rgba(9, 22, 28, .96)";
        context.fill();
        context.shadowBlur = 0;
        context.lineWidth = highlighted ? 2.2 : selected ? 1.7 : 1;
        context.strokeStyle = highlighted
          ? "#75e5ef"
          : selected
            ? "#c8ff5a"
            : rag
              ? "rgba(117, 229, 239, .60)"
              : "rgba(153, 201, 210, .36)";
        context.stroke();

        context.fillStyle = rag ? "#75e5ef" : "#c8ff5a";
        context.fillRect(x + 13, y + 14, 3, 21);
        context.fillStyle = "#cfe0e1";
        context.textAlign = "left";
        context.font = "700 12px 'Space Grotesk', sans-serif";
        context.fillText(node.label, x + 25, y + 24);
        context.font = "10px 'IBM Plex Mono', monospace";
        context.fillStyle = "rgba(207, 224, 225, .72)";
        context.fillText(
          rag ? "MICRO-RAG / CONTEXT" : `RANK ${node.shape.length} / FLOAT32`,
          x + 25,
          y + 40
        );
        context.fillStyle = "#f0f5f5";
        context.font = "600 12px 'IBM Plex Mono', monospace";
        context.fillText(`[${node.shape.join(", ")}]`, x + 13, y + 68);

        node.shape.slice(0, 5).forEach((dimension, index) => {
          const barHeight = 4 + Math.min(17, dimension / 14);
          context.fillStyle =
            index % 2 ? "rgba(117,229,239,.74)" : "rgba(200,255,90,.76)";
          context.fillRect(
            x + 128 + index * 7,
            y + 71 - barHeight,
            4,
            barHeight
          );
        });
        context.fillStyle = "#c8ff5a";
        context.beginPath();
        context.arc(x + width + 1, center.y, 4, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "#75e5ef";
        context.beginPath();
        context.arc(x - 1, center.y, 4, 0, Math.PI * 2);
        context.fill();
        context.restore();
      });

      drawPath(samplesRef.current, "#c8ff5a", 2.2, 0.94);
      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, []);

  const pointerPosition = (
    event: React.PointerEvent<HTMLCanvasElement>
  ): PointerPosition => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    };
  };

  const hitNode = (point: PointerPosition) => {
    const paddingX = 0.095;
    const paddingY = 0.075;
    return nodesRef.current.find(
      node =>
        Math.abs(node.position.x - point.x) < paddingX &&
        Math.abs(node.position.y - point.y) < paddingY
    );
  };

  const hitEdge = (point: PointerPosition) => {
    const nodeMap = new Map(nodesRef.current.map(node => [node.id, node]));
    return edgesRef.current.find(edge => {
      const source = nodeMap.get(edge.from);
      const target = nodeMap.get(edge.to);
      if (!source || !target) return false;
      const labelX = (source.position.x + target.position.x) / 2;
      const labelY = (source.position.y + target.position.y) / 2 - 0.02;
      return (
        Math.abs(point.x - labelX) < 0.06 && Math.abs(point.y - labelY) < 0.038
      );
    });
  };

  const makeSample = (
    event: React.PointerEvent<HTMLCanvasElement>
  ): TelemetrySample => {
    const position = pointerPosition(event);
    const previous = samplesRef.current.at(-1);
    const now = performance.now();
    const velocity = previous
      ? Math.hypot(position.x - previous.x, position.y - previous.y) /
        Math.max(0.001, (now - previous.time) / 1000)
      : 0;
    return {
      ...position,
      pressure: event.pressure > 0 ? event.pressure : 0.5,
      velocity,
      time: now,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointerPosition(event);
    pointerRef.current = point;
    const node = hitNode(point);

    if (tool === "connect") {
      if (node) {
        connectingSourceRef.current = node.id;
        onSelect(node.id);
      }
      return;
    }

    if (tool === "select") {
      const edge = hitEdge(point);
      if (edge) {
        onEdgeSelect(edge);
        onSelect(null);
        return;
      }
      onEdgeSelect(null);
      onSelect(node?.id ?? null);
      draggingRef.current = node?.id ?? null;
      return;
    }

    if (node) {
      onSelect(node.id);
      return;
    }

    samplesRef.current = [makeSample(event)];
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointerPosition(event);
    pointerRef.current = point;
    if (draggingRef.current) {
      onMoveNode(draggingRef.current, {
        x: Math.max(0.1, Math.min(0.9, point.x)),
        y: Math.max(0.12, Math.min(0.88, point.y)),
      });
      return;
    }
    if (!samplesRef.current.length) return;
    const sample = makeSample(event);
    samplesRef.current.push(sample);
    if (performance.now() - lastEmitRef.current > 48) {
      lastEmitRef.current = performance.now();
      onTelemetry(sample);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const target = hitNode(pointerPosition(event));
    if (connectingSourceRef.current) {
      const sourceId = connectingSourceRef.current;
      connectingSourceRef.current = null;
      if (target && target.id !== sourceId) onConnect(sourceId, target.id);
      return;
    }
    if (draggingRef.current) {
      draggingRef.current = null;
      return;
    }
    if (samplesRef.current.length > 2) {
      onStrokeComplete(samplesRef.current);
      onTelemetry(samplesRef.current.at(-1)!);
    }
    samplesRef.current = [];
  };

  return (
    <canvas
      ref={canvasRef}
      className={`graph-canvas tool-${tool}`}
      aria-label="Interactive tensor graph canvas"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
