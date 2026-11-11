# 0002 – Design = Vektor-Hintergrund + Slots, Rendering mit pdf-lib

Ein Design besteht aus einer Hintergrundgrafik ohne variable Texte (PDF oder SVG) und einer Slot-Liste in Millimetern. `pdf-lib` bettet den Hintergrund als Vektorseite je Etikett auf dem Bogenraster ein und zeichnet die Texte mit eingebetteter freier Schrift. Der Renderer liegt in `shared/render` und läuft im Browser (Vorschau) und auf dem Server (Druck-PDF), sodass beide identisch sind.

## Considered Options
- SVG mit Platzhaltern + Chromium-Druck: flexiblerer Textfluss, aber schwerer Container und unsichere Maßtreue.
- AcroForm-PDF füllen und flach rechnen: designerfreundlich, aber kaum Kontrolle über Auto-Fit und Schrift.
