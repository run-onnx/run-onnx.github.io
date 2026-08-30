// Synshape operating manual — native professional report.
// The adjacent report-theme.typ owns global typography, page geometry, and running headers.
#import "report-theme.typ": report-accent, report-theme
#import "@preview/glossarium:0.5.10": *

#show: report-theme.with(
  title: "Synshape",
  author: "Manus AI",
  rhythm: "report",
  running-header: true,
)

// ---------- Title page ----------
#page(margin: (top: 28%, x: 2.2cm), numbering: none, header: none)[
  #set par(first-line-indent: 0em)
  #align(center)[
    #text(size: 27pt, weight: "bold", fill: report-accent)[Synshape]
    #v(0.45em)
    #text(size: 14pt, fill: luma(80))[Vollständige Betriebsanleitung]
    #v(1.8em)
    #line(length: 42%, stroke: 0.55pt + report-accent)
    #v(1.8em)
    #text(size: 10pt, fill: luma(95))[Browser-native Tensor-Authoring, lokale Ausführung und ONNX-Interchange]
    #v(3.2em)
    #text(size: 10pt)[
      Stand: Version 0.6 \
      Redaktion: Manus AI \
      Datum: #datetime.today().display("[day].[month].[year]")
    ]
  ]
]

// ---------- Table of contents ----------
#page(numbering: none, header: none)[
  #outline(title: [Inhalt], indent: 1.35em)
]

// ---------- Main body ----------
#counter(page).update(1)

= Willkommen bei Synshape

Synshape ist ein lokales Arbeitsinstrument für Menschen, die Tensoren und ONNX-Graphen nicht zuerst programmieren, sondern räumlich entwerfen möchten. Sie zeichnen mit Maus, Touch oder Stift in das zentrale Feld. Aus Ihrer Geste erzeugt Synshape sichtbare Tensor-Knoten. Mit Routen verbinden Sie diese Knoten zu einem gerichteten Rechengraphen, prüfen Formbedingungen und exportieren den resultierenden Graphen als ONNX-Datei.

Für die normalen Abläufe brauchen Sie weder einen Account noch einen Server noch eine lokale Python-Installation. Der Graph, die Geste, die Suche, die Presets und die Browserausführung bleiben auf Ihrem Gerät. Diese Anleitung beginnt bewusst mit dem einfachen Arbeitsablauf; die erweiterten Funktionen folgen später.

#block(fill: luma(242), inset: 12pt, radius: 4pt)[
  *Merksatz.* Zeichnen Sie zuerst zwei oder drei Tensoren. Verbinden Sie sie anschließend. Erst wenn der Status *GRAPH VALID* anzeigt, ist Export oder Ausführung der sinnvolle nächste Schritt.
]

== Die Oberfläche auf einen Blick

#table(
  columns: (1.45fr, 3fr),
  stroke: 0.4pt + luma(190),
  inset: 7pt,
  table.header([*Bereich*], [*Aufgabe*]),
  [Linke Rail], [Wählen Sie Zeichenmodus, Auswahlwerkzeug, Routenmodus und Standardoperatoren.],
  [Räumliches Feld], [Zeichnen Sie Tensoren, arrangieren Sie Knoten, verbinden Sie Routen und nutzen Sie die Graphsuche.],
  [Rechte Rail], [Prüfen Sie Form, Telemetrie, Validierung, Ausführung, Trace, Zeitlinie und Presets.],
  [Kopfzeile], [Importieren, speichern, exportieren, öffnen Sie About oder schalten Sie das Feld in Vollbild.],
  [Fußzeile], [Sehen Sie die letzten Pointerwerte für X, Y, Druck und Geschwindigkeit.],
)

== Grundbegriffe ohne Formelballast

Ein *Tensor* ist in Synshape ein Datencontainer mit einer Form. Die Form `[1, 24, 32]` bedeutet vereinfacht: eine Gruppe mit 24 mal 32 Werten. Ein *Knoten* ist die sichtbare Karte eines Tensors. Eine *Route* ist die Verbindung zwischen zwei Knoten. Eine *Operation* beschreibt, welche Rechenregel auf einer Route gilt, etwa MatMul oder Relu.

Der gesamte Graph ist gerichtet und zyklusfrei. Daten dürfen deshalb vorwärts laufen, aber eine Verbindung darf nicht zu ihrem eigenen Ursprung zurückführen. Diese Regel hält den Graphen verständlich und erleichtert den ONNX-Export.

= Der erste Graph in drei Minuten

== 1. Tensor zeichnen

Wählen Sie links `2D surface`. Klicken und ziehen Sie im freien Bereich des mittleren Felds. Am Ende der Geste erscheint ein neuer Tensor-Knoten. Seine Form wird aus Ihrer räumlichen Bewegung und der erfassten Telemetrie abgeleitet.

== 2. Zweiten Tensor erzeugen

Zeichnen Sie an einer anderen Stelle erneut. Sie brauchen zunächst keine perfekte Form. Der Arbeitsablauf lebt davon, dass Sie räumlich experimentieren und die Form im Inspektor lesen können.

== 3. Route prüfen

Wählen Sie `Route`. Ziehen Sie vom kleinen Port an der rechten Kante eines Knotens zu einem anderen Knoten. Synshape leitet eine passende Operation ab oder zeigt einen Konflikt. Gültige Routen verwenden Tensor Lime; Konflikte erscheinen in Koralle.

== 4. Ergebnis sichern

Wenn in der Kopfzeile `GRAPH VALID` steht, können Sie `Save preset` wählen oder direkt `Export ONNX` nutzen.

= Tensoren zeichnen und formen

== Zeichenmodi

*1D line* erzeugt eine Vektor-artige Form wie `[batch, length]`. Verwenden Sie diesen Modus für kompakte Signale, Reihen oder Gewichtungen.

*2D surface* erzeugt eine Flächenform wie `[batch, height, width]`. Für den Einstieg ist dies der vielseitigste Modus.

*3D volume* ergänzt eine Tiefenabschätzung und erzeugt beispielsweise `[batch, depth, height, width]`.

*nD projection* ist für konkrete, selbst gewählte Formen. Schreiben Sie positive ganze Dimensionen mit `x` getrennt, etwa `2 x 24 x 32 x 16 x 64`. Nach dem Anwenden übernimmt der ausgewählte Knoten die neue Form.

*micro-RAG* erzeugt einen Kontextknoten. Er wird als `MICRO-RAG / CONTEXT` markiert und lässt sich wie jeder andere Knoten verbinden.

== Was Synshape aus der Geste verwendet

Synshape berücksichtigt X/Y-Position, Druck, Geschwindigkeit, Weglänge, Dauer und Anzahl der Proben. Diese Werte sind ein Entwurfsinput, kein persönliches Profil. Sie dienen dazu, eine Geste in eine Tensorform zu übersetzen und können im rechten Inspektor abgelesen werden.

= Knoten, Routen und Operatoren

== Knoten auswählen und anordnen

Wählen Sie `Select`. Ein Klick auf einen Knoten aktiviert ihn im Inspektor. Ziehen Sie einen Knoten, um seine sichtbare Position zu verändern. Die Anordnung dient der Lesbarkeit; sie ändert nicht die mathematische Reihenfolge des Graphen.

`Remove selected node` löscht den aktiven Knoten und die zugehörigen Routen. `Clear graph` leert den aktuellen Graphen. `Reset demo` stellt den integrierten Referenzgraphen wieder her.

== Routentypen

#table(
  columns: (1.1fr, 2.25fr, 2.25fr),
  stroke: 0.4pt + luma(190),
  inset: 6pt,
  table.header([*Operator*], [*Einfache Regel*], [*Praktische Bedeutung*]),
  [Add], [Formen müssen identisch oder broadcast-kompatibel sein.], [Addiert Werte elementweise.],
  [MatMul], [Die innere linke Dimension muss zur äußeren rechten Dimension passen.], [Führt eine Matrixkontraktion aus.],
  [Concat], [Ränge und nicht zusammengeführte Achsen müssen passen.], [Hängt Werte an der letzten Achse zusammen.],
  [Relu], [Eine Float32-Eingabe; die Form bleibt erhalten.], [Setzt negative Werte auf null.],
  [Conv], [Eingabe- und Kernel-Layout müssen tatsächlich kompatibel sein.], [Erfasst eine Faltungsroute als Standard-ONNX-Operation.],
)

Wählen Sie im Select-Modus das Label einer Route aus. Synshape öffnet direkt im Feld eine Operator-Karte mit Regel, Verhalten und Klassifikation. So erhalten Sie die Erklärung dort, wo die Verbindung sichtbar ist.

= Große Graphen finden statt durchsuchen

Die Suchleiste liegt oben rechts im räumlichen Feld. Sie sucht lokal und ohne Upload nach Knotennamen, Knoten-IDs, Formen, Knotenart, Zeichenquelle, Operatornamen, Operator-Endpunkten sowie Initialisierern.

Geben Sie zum Beispiel `MatMul`, `rag`, `32` oder einen Teil eines Knotennamens ein. Die erste Übereinstimmung wird cyan markiert. Mit Pfeil runter und Pfeil hoch bewegen Sie den Trefferzeiger. Enter fokussiert das aktive Ergebnis. Escape leert den Suchtext.

#block(fill: luma(242), inset: 10pt, radius: 4pt)[
  *Tipp.* Suchen Sie nach einer einzelnen Dimension wie `64`, wenn Sie prüfen möchten, welche Teile des Graphen mit dieser Größe arbeiten. Suchen Sie nach `OP`, wenn Sie einen konkreten Operatornamen wie `Relu` oder `MatMul` kennen.
]

= Validierung, Import und Export

== Live Shape Validator

Der Validator rechts zeigt gültige und ungültige Routen. Ein Konflikt verhindert den ONNX-Export bewusst. Prüfen Sie bei einem roten Eintrag die Form der beiden verbundenen Knoten, ändern Sie die Route oder entfernen Sie sie.

== ONNX exportieren

`Export ONNX` erzeugt eine lokale `.onnx`-Datei. Die Datei wird direkt vom Browser heruntergeladen. `ONNX + notes` erzeugt zusätzlich ein Synshape-Manifest. Dieses Sidecar enthält Editor-Informationen wie sichtbare Namen, Positionen und Routen. Es gehört nicht zum ONNX-Standard und ergänzt die portable ONNX-Datei nur für die Weiterarbeit in Synshape-nahen Browserabläufen.

== ONNX wieder einlesen

Mit `Import ONNX` wählen Sie eine lokale ONNX-Datei. Synshape rehydratisiert den unterstützten Teilumfang als Knoten, Routen und Initialisierer. Nicht unterstützte Inhalte werden nicht stillschweigend umgedeutet. Lesen Sie die lokale Meldung, wenn ein Operator außerhalb des unterstützten Teilumfangs liegt.

== Initialisierer

Initialisierer sind feste Float32-Werte, etwa Gewichtsmatrizen. Synshape prüft beim Import, ob Wertanzahl und Form zueinander passen.

#raw("{\n  \"name\": \"kernel-weight__basis\",\n  \"shape\": [32, 64],\n  \"values\": [0.01, -0.03]\n}", block: true, lang: "json")

= Lokale Ausführung, Stream und Trace

== Execute buffer

`Execute buffer` erzeugt den ONNX-Buffer im Speicher und versucht eine lokale Ausführung. Wenn Ihr Browser WebNN anbietet und der Graph kompatibel ist, wird dieser Weg bevorzugt. Andernfalls verwendet Synshape die lokale WebAssembly-Ausführung. Provider, Dauer und eine kleine Ausgabevorschau erscheinen im Inspektor.

Ein sichtbarer Graph ist nicht automatisch ausführbar. Fehlende Eingaben, inkompatible Formen oder eine nicht unterstützte Operator-Konfiguration führen zu einer lokalen Fehlermeldung. Die Fehlermeldung wird nicht an einen Synshape-Server gesendet.

== Live stream und Stream Timeline

Aktivieren Sie `Arm live stream`, wenn die aktuelle Pointer-Telemetrie als Float32-Vektor aus X, Y, Druck und Geschwindigkeit in kompatible Eingänge fließen soll. Bei erfolgreichen lokalen Schritten zeigt die Stream Timeline bis zu 48 letzte Skalare als Cyan-Kurve.

Die Timeline ist ein Arbeitsinstrument zur Beobachtung lokaler Veränderungen. Sie beweist keine Modellqualität und erlaubt keinen Vergleich zwischen unterschiedlichen Geräten oder Ausführungsprovidern.

== Execution Trace

`Capture trace` legt verfügbare Zwischenwerte lokal als temporäre Ausgaben frei. Der Trace-Regler zeigt Knotenname, deklarierte Form und die ersten Werte pro Frame. `Refresh frames` führt die Aufnahme mit der aktuellen Telemetrie erneut durch.

= Presets und geschützter Austausch

`Save preset` speichert den aktuellen Graphen unter einem Namen im Browser. Die Preset Library kann ihn laden oder löschen. Die Speicherung ist lokal zu diesem Browserprofil.

`Export library` erstellt ein passwortgeschütztes Paket der gesamten Preset-Bibliothek. Synshape verlangt eine Passphrase mit mindestens zwölf Zeichen. Beim `Import library` muss dieselbe Passphrase eingegeben werden. Ein erfolgreicher Import ersetzt die vorhandene lokale Bibliothek.

Die Library-Hülle verwendet AES-256-GCM und eine passphrasebasierte PBKDF2-SHA-256-Schlüsselableitung mit frischem Salt und IV. Das schützt ein Paket im Ruhezustand oder bei der Übertragung. Es macht entschlüsselte Daten jedoch nicht unsichtbar vor der Person, die sie im eigenen Browser importiert und ausführt.

= Erweiterte lokale Module

Die Mathematikmodule `Kahan Σ`, `Feynman Δ` und `Max-Born P` sind Synshape-Seitenmodule. Sie arbeiten mit der lokalen Telemetrie und werden ausdrücklich nicht als portierbare ONNX-Standardoperatoren ausgegeben.

Sie können zusätzlich ein lokales WebAssembly-Modul laden, wenn es diese Funktion bereitstellt:

#raw(block: true, lang: "text", "synshape_transform(x, y, pressure, velocity)")

Ein solches Modul wird als klar deklarierter Synshape-Seitenpfad ausgeführt. Es wird nicht als allgemeiner ONNX-Custom-Operator exportiert.

= Vollbild, About und Mobilgeräte

`Focus field` und das Vollbildsymbol in der Kopfzeile schalten das räumliche Feld in den Browser-Vollbildmodus. Drücken Sie Escape, um ihn zu verlassen.

Das Info-Symbol öffnet About. Dort stehen die lokale Architektur, die Produktgrenzen, der aktuelle Funktionsumfang und der Credit `Micha | g.dev/avx`.

Auf Mobilgeräten bleiben Zeichenmodi, Suche, Feld und Export verfügbar. Kompakte Nebenflächen werden zugunsten der Zeichenfläche reduziert. Für sehr große Graphen und präzises Routing empfiehlt sich trotzdem ein Desktop oder Tablet.

= Häufige Probleme lösen

== Export ist blockiert

Mindestens eine Route ist ungültig. Lesen Sie den roten Validator-Hinweis, prüfen Sie die verbundenen Formen und korrigieren oder löschen Sie die Route.

== Lokale Ausführung schlägt fehl

Prüfen Sie die Detailmeldung im Ausführungspanel. Häufig fehlen passende Eingaben, der Graph verwendet nicht kompatible Formen oder der Browser unterstützt die gewünschte Beschleunigung nicht. Synshape versucht bei fehlendem WebNN automatisch den lokalen WASM-Fallback.

== Bibliotheksimport wird abgewiesen

Prüfen Sie Passphrase und Dateityp. Eine falsche Passphrase oder eine nicht zu Synshape passende Paketstruktur wird bewusst abgewiesen.

== Die Suche liefert keinen Treffer

Die Suche durchsucht nur den aktiven Graphen. Probieren Sie einen Teilbegriff wie `rag`, `surface`, `MatMul` oder eine einzelne Dimension wie `32`.

= Empfohlener Arbeitsablauf

1. Zeichnen Sie zwei bis drei Tensoren.
2. Verbinden Sie sie und prüfen Sie `GRAPH VALID`.
3. Klicken Sie bei Unsicherheit auf ein Routenlabel und lesen Sie die Operator-Karte.
4. Speichern Sie den Graphen als benanntes Preset.
5. Nutzen Sie Execute buffer, wenn der Graph kompatibel ist.
6. Verwenden Sie Stream Timeline oder Capture trace für lokale Beobachtung.
7. Exportieren Sie ONNX oder ONNX + notes.
8. Exportieren Sie bei Bedarf die Preset-Bibliothek verschlüsselt.

= Technischer Hintergrund und Referenzen

Diese Betriebsanleitung erklärt die Funktionen der Synshape-Anwendung. Für das ONNX-Modellformat und die Browserausführung sind die offiziellen Dokumentationen die verlässlichste weiterführende Quelle.

[1] https://onnx.ai/ \
[2] https://onnxruntime.ai/docs/get-started/with-javascript/web.html \
[3] https://onnxruntime.ai/docs/tutorials/web/ep-webnn.html

#block(fill: luma(242), inset: 12pt, radius: 4pt)[
  *Abschlusscheck.* Bevor Sie eine Datei weitergeben, prüfen Sie den Graphstatus, speichern Sie ein Preset, testen Sie bei Bedarf die lokale Ausführung und wählen Sie anschließend den passenden Exportweg.
]
