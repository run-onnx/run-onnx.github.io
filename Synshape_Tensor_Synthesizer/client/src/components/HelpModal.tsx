import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'about' | 'guide' | 'privacy' | 'compare'>('about');
  const { lang } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const texts = {
    de: {
      helpTitle: "Synshape Tensor",
      subTitle: "Interactive ONNX Studio",
      tabAbout: "Die Geschichte",
      tabGuide: "Schnellstart Guide",
      tabPrivacy: "Zero-Backend Prinzip",
      tabCompare: "Vergleich / ML-Tools",
      aboutHeading: "Die Geschichte hinter Synshape",
      aboutBio: "Michael Barlozewski",
      aboutText: `Alles begann mit einer echten Herausforderung: ein 14 Jahre alter Laptop und die eiserne Regel, nur extrem effizienten Code mit perfekter Geschwindigkeit zu schreiben. Das bedeutet: Keine Abkürzungen, keine lahmen Hintergrundprogramme, die aufräumen müssen – nur rohe, blitzschnelle Leistung, die direkt mit dem Kern des Computers spricht.\n\nAls der Sprung auf die neueste Browser-Technik anstand, gab es einfach keine passenden Werkzeuge für diesen extremen Programmierstil. Also mussten sie von Grund auf neu gebaut werden.\n\nDas Ergebnis? Ein maßgeschneidertes System, das gigantische KI-Power direkt in deinem Browser entfesselt – blitzschnell, lokal und komplett ohne Verzögerung.\n\nUrsprünglich war das nur als privates Tool gedacht, um Ruckler zu killen und massiv Zeit zu sparen. Aber es wurde etwas viel Größeres daraus.\n\nDie wahre Magie des Synshape Tensor Synthesizers ist, wie er sich anfühlt. Er nimmt unglaublich komplizierte Technik und verwandelt sie in eine Benutzeroberfläche, die so einfach ist, dass ein 12-Jähriger überall auf der Welt sofort damit loslegen und Neues erschaffen kann.\n\nRohe Edge-Power. Maximale Performance. Pure Einfachheit.`,

      guideHeading: "Der 5-Schritte-Arbeitsfluss",
      guideIntro: "Der Weg vom Rohstoff zum exportierbaren ONNX-Modell:",
      guideSteps: [
        { title: "1. Material & Form", desc: "Wähle den Datentyp (float32/Plasma, int32/Voxel, bool/Pulse) und bestimme die Shape." },
        { title: "2. Werte (Heatmap)", desc: "Gib exakte Tensorwerte ein oder nutze das visuelle 2D-Heatmap-Grid." },
        { title: "3. Impuls (Operation)", desc: "Wende eine ONNX-Aktivierung (z. B. Relu, Tanh) an, um den Signalfluss zu steuern." },
        { title: "4. Codex (Metadaten)", desc: "Bette eigenes Wissen (Text, JSON, SVG) direkt in das Modell ein." },
        { title: "5. Flow Lens & Export", desc: "Prüfe die Route in der Flow Lens und exportiere das Ergebnis als .onnx-Datei." }
      ],
              compHeading: "VERGLEICH VON TENSOR STUDIO MIT GÄNGIGEN ML-WERKZEUGEN",
        compCols: ["Werkzeug", "Fokus", "Unterschied zu Tensor"],
        compRows: [
          ["Netron", "Modell-Inspektion", "Tensor baut/erklärt Strukturen aktiv."],
          ["ONNX Runtime Web", "Inferenz/Ausführung", "Tensor fokussiert auf Form und Gestaltung."],
          ["Teachable Machine", "Codefreies Training", "Tensor arbeitet näher an Tensorwerten und Metadaten."]
        ],
        privacyHeading: "100 % Lokal & Client-Side",
      privacyText: `Deine Daten gehören dir. Synshape Tensor Synthesizer arbeitet nach dem Zero-Backend-Prinzip:\n\n• Alle Berechnungen erfolgen isoliert in deinem Browser.\n• Entwürfe & Sammlungen werden ausschließlich im lokalen Browser-Speicher gesichert.\n• Es werden keine Tracking-Skripte, Telemetriedaten oder externe Cloud-GPUs eingebunden.`,

      close: "Verstanden / Schließen"
    },
    en: {
      helpTitle: "Synshape Tensor",
      subTitle: "Interactive ONNX Studio",
      tabAbout: "The Story",
      tabGuide: "Quick Start Guide",
      tabPrivacy: "Zero-Backend Principle",
      tabCompare: "Comparison / ML Tools",
      aboutHeading: "The Story Behind Synshape",
      aboutBio: "Michael Barlozewski",
      aboutText: `It all started with a massive challenge: a 14-year-old laptop and a strict rule to write "bare-metal" code with perfect O(1) speed. That means no shortcuts, no clunky background software to clean up messes—just raw, lightning-fast efficiency that speaks directly to the computer's core.\n\nWhen it was time to jump to the newest browser tech (like WebGPU and WebNN), the right tools for this extreme style of coding simply didn't exist. So, they had to be built from scratch.\n\nThe result? Custom, super-fast .wasm modules and a "bionic" connection. This means the system actually links the physical movements on your touchpad directly to a powerful AI brain running right inside your browser.\n\nOriginally, this was just meant to be a personal tool to crush lag and save a ton of time. But it turned into something much bigger.\n\nThe true magic of the Synshape Tensor Synthesizer is how it feels to use. It takes incredibly complicated tech—like tensors, bionic logic, and heavy hardware acceleration—and turns it into an interface so simple that a 12-year-old anywhere in the world can jump right in and start creating.\n\nRaw Edge-Power. Maximum Performance. Pure Simplicity.`,

      guideHeading: "The 5-Step Workflow",
      guideIntro: "The pipeline from raw material to exportable ONNX artifact:",
      guideSteps: [
        { title: "1. Material & Form", desc: "Choose base data type (float32/Plasma, int32/Voxel, bool/Pulse) and set the tensor shape." },
        { title: "2. Values (Heatmap)", desc: "Enter precise tensor values or use the interactive 2D heatmap grid." },
        { title: "3. Impulse (Operation)", desc: "Apply ONNX activation functions (e.g., Relu, Tanh, Sigmoid) to shape signal flow." },
        { title: "4. Codex (Metadata)", desc: "Embed custom knowledge (Text, JSON, SVG) directly into the model as metadata." },
        { title: "5. Flow Lens & Export", desc: "Audit the graph route in Flow Lens and export your creation as an .onnx file." }
      ],
              compHeading: "COMPARISON OF TENSOR STUDIO WITH COMMON ML TOOLS",
        compCols: ["Tool", "Focus", "Difference to Tensor"],
        compRows: [
          ["Netron", "Model Inspection", "Tensor actively builds/explains structures."],
          ["ONNX Runtime Web", "Inference/Execution", "Tensor focuses on shape and design."],
          ["Teachable Machine", "Code-free Training", "Tensor works closer to tensor values and metadata."]
        ],
        privacyHeading: "100% Local & Client-Side",
      privacyText: `Your data stays yours. Synshape Tensor Synthesizer adheres to a strict Zero-Backend architecture:\n\n• All tensor operations run isolated inside your browser.\n• Drafts and collections are stored exclusively in your local browser storage.\n• No cloud GPUs, no telemetry, and no external tracking scripts.`,

      close: "Understood / Close"
    }
  };

  const t = texts[lang] || texts.en;

  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#FAF9F6] text-[#2C2C2C] w-full max-w-3xl rounded-2xl shadow-2xl border border-[#0B7C78]/20 flex flex-col md:flex-row overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full md:w-1/3 bg-[#F0EFEA] p-6 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img 
                src="/tensor-storage/tensor-mark_63462173.png" 
                alt="Synshape Tensor Logo" 
                className="w-10 h-10 rounded-xl object-cover shadow-md"
                draggable={false} 
                onContextMenu={(e) => e.preventDefault()}
              />
              <div>
                <h2 className="font-bold text-base leading-tight text-[#2C2C2C]">{t.helpTitle}</h2>
                <p className="text-xs text-[#0B7C78] font-mono mt-0.5">{t.subTitle}</p>
              </div>
            </div>

                        <nav className="flex flex-col gap-2">
              <button
                onClick={() => setActiveTab('about')}
                className={`text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'about' ? 'bg-white text-[#0B7C78] shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'}`}
              >
                {t.tabAbout}
              </button>
              <button
                onClick={() => setActiveTab('guide')}
                className={`text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'guide' ? 'bg-white text-[#0B7C78] shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'}`}
              >
                {t.tabGuide}
              </button>
              <button
                onClick={() => setActiveTab('privacy')}
                className={`text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'privacy' ? 'bg-white text-[#0B7C78] shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'}`}
              >
                {t.tabPrivacy}
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className={`text-left px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${activeTab === 'compare' ? 'bg-white text-[#0B7C78] shadow-sm' : 'text-gray-600 hover:bg-gray-200/50'}`}
              >
                {t.tabCompare}
              </button>
            </nav>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-300/60 text-xs text-gray-500 font-mono flex justify-between items-center">
            <span>v1.0.0</span>
            <span>Zero-Backend</span>
          </div>
        </div>

        <div className="w-full md:w-2/3 p-6 md:p-8 overflow-y-auto relative flex flex-col justify-between">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-200/60 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition-colors font-mono"
            title="Close"
          >
            X
          </button>

          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#2C2C2C] mb-1">{t.aboutHeading}</h3>
                <div className="h-1 w-12 bg-[#0B7C78] rounded-full mb-4"></div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-200/80 shadow-sm">
                <img src="/assets/MIchael-Barlozewski-dev.jpg" alt="Michael Barlozewski - Developer of Synshape" className="w-12 h-12 rounded-full object-cover border-2 border-[#0B7C78] shadow-md" draggable={false} onContextMenu={(e) => e.preventDefault()} />
                <div>
                  <h4 className="font-bold text-gray-900">{t.aboutBio}</h4>
                  <a
                    href="https://micha1a.github.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#0B7C78] hover:underline mt-1"
                  >
                    micha1a.github.io ↗
                  </a>
                </div>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {t.aboutText}
              </p>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-[#2C2C2C] mb-1">{t.guideHeading}</h3>
                <p className="text-xs text-gray-500">{t.guideIntro}</p>
              </div>

              <div className="space-y-3">
                {t.guideSteps.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-gray-200/70 text-sm">
                    <h5 className="font-bold text-[#0B7C78] text-xs uppercase tracking-wider mb-0.5">{step.title}</h5>
                    <p className="text-gray-700 text-xs leading-normal">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}


          {activeTab === 'compare' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-xl font-bold text-[#2C2C2C] mb-1">{t.tabCompare}</h3>
                <div className="h-1 w-12 bg-[#0B7C78] rounded-full mb-4"></div>
              </div>
              <div className="w-full">
                <div className="mt-2">
                  <h4 className="text-[11px] font-bold text-[#0B7C78] mb-3 tracking-widest uppercase">{t.compHeading}</h4>
                  <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#FAF9F6] border-b border-gray-200">
                        <tr>
                          {t.compCols.map((col: string, idx: number) => (
                            <th key={idx} className="px-4 py-3 font-semibold text-gray-700">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {t.compRows.map((row: string[], idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-[#0B7C78]">{row[0]}</td>
                            <td className="px-4 py-3 text-gray-600">{row[1]}</td>
                            <td className="px-4 py-3 text-gray-600">{row[2]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold text-[#2C2C2C] mb-1">{t.privacyHeading}</h3>
                <div className="h-1 w-12 bg-[#0B7C78] rounded-full mb-4"></div>
              </div>

              <div className="p-5 rounded-xl bg-white border border-gray-200/80 shadow-sm">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line font-sans">
                  {t.privacyText}
                </p>
              </div>
            </div>
          )}

          <div className="pt-6 mt-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-[#0B7C78] hover:bg-[#086360] text-white text-sm font-medium rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
