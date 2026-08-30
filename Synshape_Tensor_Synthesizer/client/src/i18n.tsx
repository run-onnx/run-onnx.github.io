/**
 * Synshape Tensor Synthesizer
 * 
 * @copyright Copyright (c) 2026 Michael Barlozewski. All rights reserved.
 * @contact   g.dev/avx
 * 
 * PROPRIETARY & CONFIDENTIAL
 * Unauthorized copying, modification, or distribution of this software 
 * via any medium is strictly prohibited.
 */

import React, { createContext, useContext, useState, useEffect } from "react";

type Lang = "de" | "en";

const translations = {
  de: {
    material: "Material",
    shape: "Form",
    operation: "Impuls",
    codex: "Codex",
    reshuffle: "Neu würfeln",
    export: "Dieses Objekt als .onnx speichern",
    privacy: "Privacy: Zero Tracking. 100% Local. Deine Modelle liegen exklusiv in deinem Browser (localStorage) und verlassen niemals dein Gerät.",
    emptyShelf: "In dieser Kategorie liegen noch keine Mini-Modelle. Speichere ein kleines Modell, um es später wieder hervorzuholen.",
    navPrev: "Zurück",
    navNext: "Weiter",
    closeShelf: "Speicher schließen (100% Lokal & Zero Tracking)",
    openShelf: "Speichern, laden oder aufräumen",
    shelfTitle: "Lokaler Beispielspeicher",
    openOnnx: "ONNX öffnen",
    firstModel: "Erstes Modell",
    valid: "Valide",
    maxDims: "max. 6 Dimensionen / 16.384 Werte",
    shapeLbl: "Gestalt",
    volumeLbl: "Volumen",
    memoryLbl: "Speicher",
    valuesLbl: "Werte",
    validExportNotice: "Eine gültige Form lässt den lokalen Export erscheinen.",
    matchValuesNotice: "Die Zahl deiner echten Werte muss zur Form passen.",
    tactileFlow: "Tactile flow",
    active: "Aktiv",
    touchFlow: "Touch-Flow",
    activateMotion: "Bewegung aktivieren",
    motionNote: "Die Sensorfreigabe ist optional und bleibt nur für diesen Moment aktiv. Ohne sie reagiert die Ansicht auf Berührung und Maus.",
    localOnnx: "Local ONNX",
    noNodes: "Keine Nodes gefunden",
    noMeta: "Dieses Modell trägt keine zusätzlichen Metadaten.",
    routeRead: "Spur lesen",
    sceneDeck: "Tensor Szene",
    sceneDeckDesc: "Zwei Stränge können eine neue, ruhige Einheit bilden.",
    now: "JETZT",
    composeBtn: "Verbinden"
  },
  en: {
    material: "Material",
    shape: "Shape",
    operation: "Pulse",
    codex: "Codex",
    reshuffle: "Reshuffle",
    export: "Save this object as .onnx",
    privacy: "Privacy: Zero Tracking. 100% Local. Your models are stored exclusively in your browser (localStorage) and never leave your device.",
    emptyShelf: "No mini-models in this category yet. Save a small model to bring it back later.",
    navPrev: "Back",
    navNext: "Next",
    closeShelf: "Close Storage (100% Local & Zero Tracking)",
    openShelf: "Save, load or clean up",
    shelfTitle: "Local Example Storage",
    openOnnx: "Open ONNX",
    firstModel: "First Model",
    valid: "Valid",
    maxDims: "max. 6 dimensions / 16,384 values",
    shapeLbl: "Shape",
    volumeLbl: "Volume",
    memoryLbl: "Memory",
    valuesLbl: "Values",
    validExportNotice: "A valid shape enables local export.",
    matchValuesNotice: "The number of real values must match the shape.",
    tactileFlow: "Tactile flow",
    active: "Active",
    touchFlow: "Touch Flow",
    activateMotion: "Enable Motion",
    motionNote: "Sensor access is optional and remains active only for this moment. Without it, the view reacts to touch and mouse.",
    localOnnx: "Local ONNX",
    noNodes: "No nodes found",
    noMeta: "This model carries no additional metadata.",
    routeRead: "Read route",
    sceneDeck: "Tensor Scene",
    sceneDeckDesc: "Two threads can form a new, quiet entity.",
    now: "NOW",
    composeBtn: "Compose"
  }
};

type LanguageContextType = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof translations.en) => string;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLangState] = useState<Lang>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("tensor-lang") as Lang;
    if (saved === "en" || saved === "de") {
      setLangState(saved);
    } else {
      const browserLang = navigator.language.toLowerCase();
      setLangState(browserLang.startsWith("de") ? "de" : "en");
    }
    setMounted(true);
  }, []);

  const setLang = (l: Lang) => {
    localStorage.setItem("tensor-lang", l);
    setLangState(l);
  };

  const t = (key: keyof typeof translations.en) => {
    return translations[lang][key] || translations.en[key] || key;
  };

  if (!mounted) return null;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
