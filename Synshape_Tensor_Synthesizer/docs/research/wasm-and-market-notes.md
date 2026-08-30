# Recherchegrundlage: Tensor, WebAssembly und Vergleichswerkzeuge

## Verifizierte technische Grundlagen

WebAssembly ist ein binäres Ausführungsformat für performante Codeanteile im Browser und arbeitet bewusst neben JavaScript, nicht an dessen Stelle. Dadurch eignet es sich für deterministische Rechenkerne, Parser, Serialisierer und kleine Algorithmen. Es ist jedoch ausgelieferter Client-Code: Ein Browser muss das Modul herunterladen und ausführen können. Daraus folgt für Tensor: WebAssembly kann Analyse und beiläufiges Kopieren erschweren, aber weder Geheimnisse noch eine unüberwindbare Barriere gegen Reverse Engineering liefern.

Die offizielle `wasm-bindgen`-Dokumentation beschreibt die Rust-Brücke als Werkzeug für Interaktion zwischen WebAssembly und JavaScript mit Strings, Objekten, Funktionen und generierten TypeScript-Bindungen. Das ist für einen späteren Rust-Kern sinnvoll. Die Zig-Referenz dokumentiert WebAssembly-Targets einschließlich freistehender und WASI-orientierter Varianten, sodass Zig für einen kleinen, ohne Runtime-Abhängigkeit kompilierten Kern geeignet ist.

## Vergleichswerkzeuge

Netron positioniert sich als Viewer für neuronale und maschinelle Lernmodelle. ONNX Runtime Web positioniert sich als JavaScript-Bibliothek zur Ausführung von ONNX-Modellen im Browser. Teachable Machine fokussiert auf zugängliches, codefreies Erstellen einfacher Modelle im Browser.

Tensor positioniert sich dagegen als **lokales Lern- und Gestaltungsstudio für Tensorform, Werte, Codex-Metadaten und lesbare ONNX-Routen**. Es soll nicht als vollständige Trainingsumgebung oder universeller Modellinspektor auftreten, sondern als verständliche Brücke zwischen mathematischem Material und exportierbarer Struktur.

## Quellen

1. MDN, „WebAssembly“: https://developer.mozilla.org/en-US/docs/WebAssembly
2. wasm-bindgen Guide, „Introduction“: https://rustwasm.github.io/docs/wasm-bindgen/
3. Zig Language Reference, „WebAssembly“: https://ziglang.org/documentation/master/
4. Netron: https://netron.app/
5. ONNX Runtime Web: https://onnxruntime.ai/docs/tutorials/web/
6. Teachable Machine: https://teachablemachine.withgoogle.com/
