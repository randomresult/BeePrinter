# BeePrinter (Etikettengenerator)

Plattform, auf der Imker ein fertig gestaltetes Honigetikett auswählen, ihre Pflichtangaben eintragen und gegen Gebühr ein druckfertiges PDF für handelsübliche Etikettenbögen kaufen.

## Language

### Gestaltung

**Design**:
Fertige, nicht veränderbare Gestaltung eines Etiketts (Hintergrundgrafik + Slots + Schriften) für genau ein **Etikettenformat**. Gehört zu genau einer **Themenwelt**.
_Avoid_: Template, Vorlage, Layout

**Themenwelt**:
Kategorie, nach der Designs gruppiert werden (z. B. Standard, Saison, Geschenkedition).
_Avoid_: Kategorie, Thema, Collection

**Slot**:
Fest platzierter Bereich in einem **Design**, der genau ein Feld der **Etikettendaten** (oder das Logo) aufnimmt. Hat Mindest- und Höchstschriftgröße.
_Avoid_: Platzhalter, Textfeld, Formularfeld

**Etikettenformat**:
Größe und Kontur eines einzelnen Etiketts (z. B. 96 × 50,8 mm rechteckig, 40 mm rund, Schlüsselloch).
_Avoid_: Etikettengröße, Label-Typ

**Bogenvorlage**:
Ein konkretes Etikettenpapier (Hersteller + Artikelnummer, z. B. Avery Zweckform L4744REV) mit Seitengröße und Raster, auf dem Etiketten eines **Etikettenformats** sitzen.
_Avoid_: Bogen, Avery-Vorlage, Sheet

**Siegeletikett**:
Etikett, das über den Deckel geklebt wird und das Glas versiegelt. Auf Wabengut-Gläsern in Schlüssellochform (Kreis + Lasche).
_Avoid_: Garantieetikett, Deckelaufkleber (das ist ein flaches Rundetikett auf dem Deckel)

### Kauf

**Etikettendaten**:
Alle Angaben des Imkers für ein Etikett: Pflichtangaben (Honigsorte, Ursprungsland, Füllmenge, MHD, Losnummer, Imkerei-Anschrift) und optionale Angaben (Website/Telefon, Lagerhinweis, Regionalangabe, Anlass-Text, Logo).
_Avoid_: Kundendaten, Formulardaten

**Pflichtangabe**:
Angabe, die nach Honigverordnung/LMIV auf dem Glas stehen muss. Fehlt eine, gibt es weder Vorschau noch Kauf.
_Avoid_: Pflichtfeld

**Vorschau**:
Mit Wasserzeichen versehene Darstellung des späteren **Druck-PDF**. Nicht kaufbar, nicht druckbar gedacht.
_Avoid_: Entwurf, Proof

**Bestellung**:
Kauf genau eines **Druck-PDF** durch einen Gast mit E-Mail-Adresse. Kein Kundenkonto.
_Avoid_: Order, Auftrag, Kauf

**Druck-PDF**:
Flaches A4-PDF mit allen Etiketten einer **Bogenvorlage**, gefüllt mit eingefrorenen **Etikettendaten**. Nach Bezahlung unveränderlich, beliebig oft herunterladbar.
_Avoid_: Download, Etiketten-PDF, Datei

## Relationships

- Ein **Design** gehört zu einer **Themenwelt** und einem **Etikettenformat**; es hat viele **Slots**.
- Eine **Bogenvorlage** trägt Etiketten genau eines **Etikettenformats**; ein Format kann viele Bogenvorlagen haben.
- Eine **Bestellung** = ein **Design** + eine **Bogenvorlage** + eingefrorene **Etikettendaten** → genau ein **Druck-PDF**.
- Neue Charge (andere Losnummer/MHD) = neue **Bestellung**.

## Example dialogue

> **Dev:** Der Imker hat sich im Druck-PDF vertippt, kann er die Losnummer ändern?
> **Thomas:** Nein. Das Druck-PDF ist eingefroren. Er macht eine neue Bestellung; über den Link in der Mail ist das Formular schon ausgefüllt.
> **Dev:** Und wenn er dasselbe Design auf einem anderen Avery-Bogen drucken will?
> **Thomas:** Geht, solange die Bogenvorlage dasselbe Etikettenformat hat. Für 40 mm rund braucht es ein eigenes Design.

## Flagged ambiguities

- „Siegeletikett“ meinte in der Anforderungsmail kleine Rundetiketten (15–30 mm); auf den Fotos ist es die Schlüssellochform. Aufgelöst: **Siegeletikett** = Deckel-Versiegelung (Form egal); kleine Rundetiketten ohne Siegelfunktion sind einfach ein rundes **Etikettenformat**.
- „Vorlage“ wurde für Design, Bogenvorlage und PDF verwendet. Aufgelöst: nur noch **Design** und **Bogenvorlage**.
