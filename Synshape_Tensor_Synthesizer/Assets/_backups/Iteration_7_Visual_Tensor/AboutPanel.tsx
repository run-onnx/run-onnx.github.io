/** Synshape brand contract: factual, compact provenance; never obscures the spatial workspace. */
import { ExternalLink, X } from "lucide-react";

interface AboutPanelProps {
  onClose: () => void;
}

export default function AboutPanel({ onClose }: AboutPanelProps) {
  return (
    <div className="about-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="about-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <button
          className="about-close"
          onClick={onClose}
          aria-label="Close about panel"
        >
          <X size={18} />
        </button>
        <p className="eyebrow">ABOUT / SYNSHAPE 0.6</p>
        <h2 id="about-title">
          Spatial input,
          <br />
          local execution.
        </h2>
        <p>
          Synshape is a browser-native tensor authoring and execution
          instrument. It turns pointer telemetry into typed shapes, validates
          graph routes, rehydrates a supported ONNX subset, and runs generated
          models from memory through WebNN when available or a local WASM
          fallback.
        </p>
        <div className="about-rule" />
        <p className="about-spec">
          NO APPLICATION BACKEND
          <br />
          NO TELEMETRY EGRESS
          <br />
          RAW ONNX + ANNOTATION SIDECAR
          <br />
          LOCAL PRESETS + ENCRYPTED LIBRARY EXCHANGE
          <br />
          EXECUTION TRACE + STREAM TIMELINE
          <br />
          WASM MATH MODULES / EXPLICITLY NON-PORTABLE
          <br />
          CANVAS-NATIVE OPERATOR NOTES
          <br />
          LOCAL GRAPH SEARCH + VISUAL FOCUS
        </p>
        <p
          style={{
            marginTop: 14,
            padding: "9px 0 0 10px",
            borderLeft: "2px solid rgba(255,131,136,.7)",
            color: "#bd8c90",
            font: '400 9px/1.5 "IBM Plex Mono", monospace',
          }}
        >
          Encrypted packages protect a downloaded file at rest. A browser cannot
          conceal executable code or decrypted data from the person controlling
          that browser.
        </p>
        <a
          className="about-credit"
          href="https://g.dev/avx"
          target="_blank"
          rel="noreferrer"
        >
          Micha <span>|</span> g.dev/avx <ExternalLink size={13} />
        </a>
      </section>
    </div>
  );
}
