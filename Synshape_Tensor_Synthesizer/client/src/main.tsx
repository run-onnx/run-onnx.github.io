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

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { LanguageProvider } from "./i18n";

document.addEventListener('contextmenu', e => e.preventDefault(), { capture: true });
document.addEventListener('dragstart', e => e.preventDefault(), { capture: true });


createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
