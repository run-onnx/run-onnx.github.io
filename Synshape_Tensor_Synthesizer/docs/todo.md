# Tensor — Erweiterungsplan

- [x] Den bestehenden ONNX-Encoder und die aktuelle Bedienlogik auf sichere Erweiterungspunkte prüfen.
- [x] Ein robustes, lokales ONNX-Protobuf-Leseformat für Modellheader, Graph, Tensoren, Operatoren und Metadaten festlegen.
- [x] Einen verständlichen Import-Inspektor mit Modellübersicht, Shape, Datentyp, Operatoren und Codex-Metadaten gestalten.
- [x] Zusätzliche Operatoren mit datentypabhängiger Verfügbarkeit und ONNX-Serialisierung ergänzen.
- [x] Eingabefelder für echte Tensorwerte, einschließlich Syntaxprüfung und Exportverwendung, integrieren.
- [x] Build, Import- und Exportpfad auf Desktop und Mobilgerät prüfen; die Erweiterung visuell sichern.

Der automatisierte Round-Trip-Test erzeugt ein Modell mit direkten Floatwerten, dem Operator `Tanh` und Codex-Metadaten. Anschließend liest der lokale Inspektor dasselbe Binärmodell wieder ein und bestätigt Shape, Werte, Graph-Operator und Metadaten. Die Oberfläche wurde zusätzlich auf Desktop und Mobilgerät geprüft.

## Nächste Erweiterung: Graph und Matrix-Grid

- [x] Gerätesensoren, Berechtigungsmodell und verfügbare Browser-Fallbacks für den visuellen Graphen prüfen.
- [x] Eine ONNX-Graphansicht mit ruhigen, physisch wirkenden Verbindungslinien und nachvollziehbaren Node-Labels gestalten.
- [x] Eine optional aktivierbare Bewegungssteuerung mit ausdrücklicher Nutzerfreigabe und Desktop-Fallback implementieren.
- [x] Ein editierbares 2D-Grid für Matrix-Shapes entwickeln und mit der direkten Werteingabe synchronisieren.
- [x] Graph, Grid-Bearbeitung und Export auf Desktop und Mobilgerät testen.
- [ ] Die explizite Sensorfreigabe zusätzlich auf einem realen Mobilgerät mit Beschleunigungs- und Orientierungssensor prüfen.

## Nächste Erweiterung: Route, Heatmap und erster Einstieg

- [x] Die Leinen-Sichtbarkeit und das Clipping der Graphansicht auf Desktop und im Hochkantmodus reproduzieren und korrigieren.
- [x] Importierte ONNX-Nodes als filterbare, verständliche Graphroute mit Trefferfokus darstellen.
- [x] Matrixzellen um eine dezente, datentypgerechte Heatmap ergänzen.
- [x] Einen geführten „Erstes Modell“-Modus mit drei Mini-Experimenten in den Studiofluss integrieren.
- [x] Alle neuen Pfade auf Desktop und Mobilgerät visuell prüfen sowie Build und Round-Trip-Test ausführen.

## Nächste Erweiterung: Lernkarten, Szene und Speicher

- [x] Den vorhandenen Graphfluss, Exportmechanismus und die lokalen Browserdaten auf sichere Erweiterungspunkte prüfen.
- [x] Ein klares Datenmodell für Lernkarten, Szenentensoren und lokal gespeicherte Mini-Modelle festlegen.
- [x] Einen Download für Graphrouten als kompakte Lernkarten implementieren.
- [x] Eine Mehr-Tensor-Szene mit verständlichen Verbindungen und aktiver Auswahl ergänzen.
- [x] Einen lokalen Beispielspeicher mit Speichern, Laden und Entfernen von Mini-Modellen integrieren.
- [x] Download, lokale Speicherung und responsive Szenenansicht testen.

## Kategorien, Compose und Dokumentationspaket

- [x] Den aktuellen Speicherdatensatz und Szenenfluss auf geeignete Felder für Kategorien und zwei aktiv verbundene Modelle prüfen.
- [x] Kategorien, Compose-Ablauf und Dokumentationsstruktur ohne Fachsprache festlegen.
- [x] Gespeicherte Mini-Modelle kategorisieren, filtern und die Kategorie lokal mitführen.
- [x] Eine leicht erklärbare Compose-Operation für zwei kompatible Szenenmodelle umsetzen.
- [x] Die erweiterte README, `tensor.txt` und eine technische Betriebsanleitung als PDF erstellen.
- [x] Eine transparente WASM-Schutzstrategie, lokale Rust-/Zig-Startvorlagen und `dokuDisA.txt` erstellen.
- [x] Anwendung, Dokumente, PDF und Build prüfen sowie den Projektstand sichern.

Hinweis: Die Rust- und Zig-Startvorlagen sind absichtlich nicht Teil des aktuellen Frontend-Builds. Die Toolchains waren in dieser Sandbox nicht installiert; die ausführbaren `build.sh`-Dateien sind für die lokale Kompilierung durch den Projektbesitzer vorbereitet.
