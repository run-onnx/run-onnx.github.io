# Tensor — Interactive ONNX Studio

**Tensor** ist ein lokales, browserbasiertes Lern- und Gestaltungsstudio für ONNX-Tensoren. Es übersetzt Datentypen, Formen, Werte, Operationen und Metadaten in einen nachvollziehbaren Arbeitsfluss. Der Anspruch ist nicht, ein ausgewachsenes Trainingssystem zu ersetzen, sondern mathematische Struktur so zugänglich zu machen, dass neugierige Menschen — auch ohne Machine-Learning-Vorkenntnisse — kleine ONNX-Objekte verstehen und erzeugen können.

| Bereich          | Was Tensor anbietet                                                                    |
| ---------------- | -------------------------------------------------------------------------------------- |
| Material         | `float32`, `int32` und `bool` als verständliche „Stoffe“                               |
| Form             | Skalar, Vektor, Matrix und mehrdimensionale Shape-Eingabe                              |
| Werte            | Reproduzierbares Signal oder direkte Werte; für Matrizen als editierbares Heatmap-Grid |
| Impuls           | ONNX-kompatible Operationen wie `Relu`, `Tanh`, `Sigmoid`, `Neg` und `Not`             |
| Codex            | Lokale `.txt`, `.json` und `.svg`-Fragmente als ONNX-Metadaten                         |
| Flow Lens        | Suchbare ONNX-Routen, physische Leinen, lokale Lernkarten und Szenen                   |
| Lokaler Speicher | Mini-Modelle kategorisieren, laden, entfernen und mit Compose verbinden                |

## Schnellstart

Installiere die JavaScript-Abhängigkeiten und starte das Studio im Entwicklungsmodus.

```bash
pnpm install
pnpm dev
```

Öffne anschließend die ausgegebene lokale Adresse. Ein sinnvolles erstes Experiment ist: **Float → 4 × 4 → Tanh → eigene Werte → Matrix-Grid → ONNX exportieren**. Über „Erstes Modell“ führt Tensor durch dieselbe Idee in drei kleinen Schritten.

## Lokaler Datenfluss

Tensor verwendet keine eigene Datenbank. ONNX-Dateien werden im Browser gelesen, Werte und Codex-Inhalte werden im Browser verarbeitet, und Mini-Modelle liegen im `localStorage` des jeweiligen Browsers. Das bedeutet: Ein Löschen der Browserdaten löscht auch den lokalen Beispielspeicher. ONNX-Dateien und SVG-Lernkarten werden als Downloads auf dem Gerät gespeichert.

## Mini-Modelle und Compose

Gespeicherte Mini-Modelle besitzen eine Kategorie: **Entwürfe**, **Lernen**, **Experimente** oder **Sammlung**. Die Kategorie dient der Orientierung und wird lokal mit dem Modell abgelegt. Die Compose-Funktion verbindet den aktuellen Tensor mit einem in der Szene gewählten zweiten Strang. Sie ist bewusst einfach und erklärt statt zu verschleiern:

1. Beide Modelle müssen denselben Datentyp und dieselbe Shape haben.
2. Direkte numerische Werte werden positionweise gemittelt; bei Boolean-Werten gilt ein logisches „oder“.
3. Codex-Fragmente werden zusammengeführt und Dubletten vermieden.
4. Die resultierende Struktur bleibt sofort editierbar und kann exportiert werden.

## Entwickeln und prüfen

| Befehl                                          | Zweck                |
| ----------------------------------------------- | -------------------- |
| `pnpm check`                                    | TypeScript-Prüfung   |
| `pnpm vitest run client/src/pages/Home.test.ts` | ONNX-Round-Trip-Test |
| `pnpm build`                                    | Produktions-Build    |

## Dokumentation

| Datei                                                                            | Inhalt                                                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [`tensor.txt`](./tensor.txt)                                                     | Produktverständnis, Nutzen, Zielgruppen und Vergleich                     |
| [`docs/Technische_Betriebsanleitung.md`](./docs/Technische_Betriebsanleitung.md) | Technische Betriebsanleitung; die PDF-Ausgabe liegt daneben               |
| [`dokuDisA.txt`](./dokuDisA.txt)                                                 | Sicherheits- und Disassemblierungsdokumentation für eine Veröffentlichung |
| [`wasm-core/README.md`](./wasm-core/README.md)                                   | Lokale Rust- und Zig-Startvorlagen für einen späteren Rechenkern          |

## WebAssembly: realistischer Schutz

Ein WebAssembly-Modul kann im Browser sinnvoll sein für **deterministische Wert-Compose-Logik, Shape-Prüfung, kleine Parser, Hashing ohne Geheimnisse und rechenintensive Visualisierungshelfer**. Es ist jedoch kein Tresor: Jedes im Browser laufende Modul muss an das Gerät ausgeliefert werden. Keine Zugangsdaten, Signaturschlüssel, serverseitigen Berechtigungsregeln oder exklusiven Geschäftsgeheimnisse gehören in JavaScript oder WASM. Weitere Details enthält `dokuDisA.txt`.

## Quellen

1. [MDN — WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly)
2. [wasm-bindgen Guide](https://rustwasm.github.io/docs/wasm-bindgen/)
3. [Zig Language Reference — WebAssembly](https://ziglang.org/documentation/master/)
4. [Netron](https://netron.app/)
5. [ONNX Runtime Web](https://onnxruntime.ai/docs/tutorials/web/)
6. [Teachable Machine](https://teachablemachine.withgoogle.com/)
