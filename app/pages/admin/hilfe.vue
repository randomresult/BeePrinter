<script setup lang="ts">
import { BEISPIELDATEN, PLATZHALTER } from '#shared/etikettendaten'
import { SCHRIFTEN } from '#shared/render/schriften'

definePageMeta({ layout: 'admin', middleware: 'admin' })
useHead({ title: 'Hilfe – BeePrinter Verwaltung' })

const inhalt = [
  { id: 'begriffe', titel: 'Begriffe' },
  { id: 'designs', titel: 'Tab Designs' },
  { id: 'editor', titel: 'Design bearbeiten' },
  { id: 'platzhalter', titel: 'Platzhalter' },
  { id: 'boegen', titel: 'Tab Etikettenbögen' },
  { id: 'themenwelten', titel: 'Tab Themenwelten' },
  { id: 'bestellungen', titel: 'Tab Bestellungen' },
  { id: 'shop', titel: 'Der Shop aus Sicht des Imkers' },
  { id: 'fragen', titel: 'Häufige Fragen' },
]

const platzhalter = Object.entries(PLATZHALTER).map(([key, p]) => ({ key, ...p, beispiel: p.wert(BEISPIELDATEN) }))
</script>

<template>
  <div class="grid lg:grid-cols-[14rem_minmax(0,1fr)] gap-10 items-start">
    <nav class="lg:sticky lg:top-6 flaeche p-4" aria-label="Inhalt">
      <p class="font-bold mb-2">Inhalt</p>
      <ul class="grid gap-1 text-[0.95rem]">
        <li v-for="i in inhalt" :key="i.id"><a :href="`#${i.id}`" class="hover:underline">{{ i.titel }}</a></li>
      </ul>
    </nav>

    <article class="hilfe max-w-[48rem]">
      <h1 class="text-4xl">Hilfe zur Verwaltung</h1>
      <p class="mt-3 text-lg text-[var(--color-tinte-weich)]">
        Hier pflegst du Designs, Etikettenbögen und Themenwelten und siehst alle Bestellungen. Imker sehen davon nichts – sie nutzen nur den Shop.
      </p>

      <!-- Begriffe -->
      <section id="begriffe">
        <h2>Begriffe</h2>
        <dl>
          <dt>Design</dt>
          <dd>Eine fertige Gestaltung: Hintergrundgrafik, Textfelder (Slots) und Schriften. Ein Design passt immer zu genau einem Etikettenformat und gehört zu einer Themenwelt.</dd>
          <dt>Slot</dt>
          <dd>Ein fester Platz im Design, an dem ein Text oder das Logo des Imkers steht, z. B. die Honigsorte oben in der Mitte.</dd>
          <dt>Etikettenformat</dt>
          <dd>Größe und Form eines einzelnen Etiketts, z. B. 96 × 50,8 mm rechteckig.</dd>
          <dt>Etikettenbogen</dt>
          <dd>Ein konkretes Etikettenpapier, z. B. Avery Zweckform L4744REV: wie viele Etiketten in welchem Raster auf einer A4-Seite sitzen.</dd>
          <dt>Themenwelt</dt>
          <dd>Gruppe, nach der der Shop die Designs sortiert, z. B. Standard, Saison, Geschenkeditionen.</dd>
          <dt>Druck-PDF</dt>
          <dd>Das gekaufte PDF: ein ganzer Bogen mit identischen Etiketten. Es wird beim Kauf erzeugt und danach nie mehr verändert – auch nicht, wenn du das Design später bearbeitest.</dd>
        </dl>
      </section>

      <!-- Designs -->
      <section id="designs">
        <h2>Tab Designs</h2>
        <p>Die Startseite der Verwaltung. Die Tabelle zeigt alle Designs, sortiert nach Themenwelt und Reihenfolge.</p>
        <ul>
          <li><strong>Name</strong> – Klick öffnet das Design zum Bearbeiten.</li>
          <li><strong>Status</strong> – <em>Veröffentlicht</em> heißt: im Shop sichtbar und kaufbar. <em>Entwurf</em> ist nur hier sichtbar. „ohne Hintergrund“ bedeutet, dass noch keine Grafik hochgeladen ist.</li>
          <li><strong>Verkauft</strong> – Anzahl bezahlter Bestellungen mit diesem Design.</li>
        </ul>
        <h3>Neues Design anlegen</h3>
        <ol>
          <li>Name eintragen. Das Kürzel für die Web-Adresse entsteht automatisch (aus „Osterhonig“ wird <code>osterhonig</code>); du kannst es ändern. Erlaubt sind nur Kleinbuchstaben, Ziffern und Bindestrich.</li>
          <li>Themenwelt und Etikettenformat wählen. <strong>Das Format lässt sich später nicht mehr ändern</strong> – für eine andere Größe legst du ein neues Design an.</li>
          <li>„Anlegen“ öffnet sofort den Editor. Das Design ist zunächst ein Entwurf ohne Slots.</li>
        </ol>
      </section>

      <!-- Editor -->
      <section id="editor">
        <h2>Design bearbeiten</h2>
        <p>Links die Arbeitsfläche mit der Vorschau, rechts die Eigenschaften. Die Vorschau zeigt das Etikett mit Beispieldaten (Imkerei Muster, Blütenhonig …) und aktualisiert sich nach jeder Änderung.</p>

        <h3>Arbeitsfläche</h3>
        <ul>
          <li><strong>Blau gestrichelt</strong> umrandet sind alle Slots, <strong>gelb</strong> die ausgewählten, <strong>rot</strong> einer, in den der Beispieltext selbst in kleinster Schriftgröße nicht passt.</li>
          <li><strong>Verschieben:</strong> Slot anklicken und ziehen. Positionen rasten auf 0,5 mm ein. Sind mehrere Slots gewählt, wandern sie gemeinsam.</li>
          <li><strong>Mehrere wählen:</strong> mit gedrückter <strong>Umschalt-</strong> oder <strong>⌘-Taste</strong> klicken (nochmal klicken wählt wieder ab) – auch in der Slot-Liste. Oder auf freier Fläche einen <strong>Rahmen aufziehen</strong>: alles, was er berührt, wird gewählt. <strong>⌘A</strong> wählt alle Slots.</li>
          <li><strong>Größe ändern:</strong> am kleinen gelben Quadrat unten rechts ziehen (nur wenn genau ein Slot gewählt ist).</li>
          <li><strong>Pfeiltasten</strong> verschieben die gewählten Slots um 0,5 mm, mit gedrückter <strong>Umschalttaste</strong> um 2 mm.</li>
          <li><strong>Entf</strong> oder <strong>Rücktaste</strong> löscht die gewählten Slots, <strong>⌘D</strong> dupliziert sie, <strong>⌘Z</strong> macht den letzten Schritt rückgängig, <strong>⌘S</strong> speichert (alles nicht, während du in einem Eingabefeld tippst).</li>
          <li>Klick auf eine freie Stelle oder <strong>Esc</strong> hebt die Auswahl auf.</li>
          <li>Die grau gestrichelte Linie um das Etikett ist nur die Schnittkante zur Orientierung; sie wird nicht gedruckt.</li>
        </ul>

        <h3>Werkzeugleiste: Ausrichten und Verteilen</h3>
        <p>Über der Arbeitsfläche steht, wie viele Slots gewählt sind, daneben die Werkzeuge (Maus drüber zeigt den Namen):</p>
        <ul>
          <li><strong>Linksbündig, waagerecht zentrieren, rechtsbündig, oben, senkrecht zentrieren, unten:</strong> Bei mehreren Slots ist der Bezug der Rahmen um die ganze Auswahl – „linksbündig“ schiebt also alle an die Kante des am weitesten links liegenden Slots. Bei <strong>einem</strong> Slot ist der Bezug das Etikett: so zentrierst du z. B. die Honigsorte exakt auf dem Etikett.</li>
          <li><strong>Waagerecht / senkrecht verteilen</strong> (ab 3 Slots): gleiche Abstände zwischen den Slots. Die beiden äußeren bleiben stehen. Slots, die nebeneinander in einer Zeile liegen, wandern beim senkrechten Verteilen gemeinsam.</li>
          <li><strong>Rückgängig, Duplizieren, Löschen</strong> wirken auf die ganze Auswahl. Der Logo-Slot wird beim Duplizieren übersprungen, weil es nur einen geben darf.</li>
        </ul>

        <h3>Slots</h3>
        <p>Unter der Arbeitsfläche stehen alle Slots als Liste – praktisch, wenn einer schwer anzuklicken ist.</p>
        <ul>
          <li><strong>Text-Slot</strong> legt ein neues Textfeld an (Start: Honigsorte).</li>
          <li><strong>Logo-Slot</strong> legt den Platz für das Logo des Imkers an. Pro Design gibt es höchstens einen. Nur bei Designs mit Logo-Slot sieht der Imker den Upload-Knopf.</li>
        </ul>

        <h3>Eigenschaften eines Text-Slots</h3>
        <dl>
          <dt>Text</dt>
          <dd>
            Was im Slot steht. Platzhalter in geschweiften Klammern werden durch die Angaben des Imkers ersetzt, z. B. <code>Mindestens haltbar bis: {mhd}</code>.
            Die Knöpfe darunter fügen einen Platzhalter am Ende ein. Text ohne Platzhalter ist <strong>fester Text</strong> und steht auf jedem Etikett gleich.
            Enthält ein Slot nur optionale Platzhalter und der Imker lässt sie leer, entfällt der Slot ganz – es bleibt keine leere Zeile mit „Los:“ o. Ä. stehen.
          </dd>
          <dt>Schrift</dt>
          <dd>Eine der freien Schriften: {{ Object.values(SCHRIFTEN).map(s => s.name).join(', ') }}.</dd>
          <dt>Größte und kleinste Schrift</dt>
          <dd>
            Der Text wird so groß wie möglich gesetzt, höchstens in der größten Schriftgröße. Ist er zu lang, schrumpft er schrittweise bis zur kleinsten.
            Passt er dann immer noch nicht, wird das Feld beim Imker rot markiert und er kann nicht kaufen. Unter 4 pt wird Text auf dem Etikett schwer lesbar.
          </dd>
          <dt>Ausrichtung</dt>
          <dd>Links, Mitte oder rechts innerhalb des Slots. Senkrecht wird immer mittig gesetzt.</dd>
          <dt>Drehung</dt>
          <dd>„90° nach oben“ liest von unten nach oben, „90° nach unten“ von oben nach unten – gedacht für schmale, hohe Slots, etwa auf der Lasche eines Siegeletiketts. Der Text läuft dann entlang der Höhe des Slots.</dd>
          <dt>In Großbuchstaben setzen</dt>
          <dd>Setzt den eingesetzten Text in Versalien, z. B. „WALDHONIG“, egal wie der Imker ihn eintippt.</dd>
          <dt>x, y, Breite, Höhe</dt>
          <dd>Position und Größe in Millimetern, gemessen von der oberen linken Ecke des Etiketts. Gut für exakte Werte aus der Grafikvorlage.</dd>
        </dl>
        <p><strong>Duplizieren</strong> kopiert den Slot und setzt die Kopie direkt darunter – praktisch für Adresszeilen. <strong>Löschen</strong> entfernt ihn.</p>

        <h3>Bereich „Design“</h3>
        <dl>
          <dt>Name, Beschreibung</dt>
          <dd>So erscheint das Design im Shop. Die Beschreibung steht unter dem Musteretikett.</dd>
          <dt>Kürzel</dt>
          <dd>Teil der Web-Adresse (<code>/design/kuerzel</code>). Nach der Veröffentlichung besser nicht mehr ändern, sonst funktionieren alte Links in Kundenmails („Nochmal mit neuen Daten“) nicht mehr.</dd>
          <dt>Themenwelt, Reihenfolge</dt>
          <dd>Bestimmen, in welcher Gruppe und an welcher Stelle das Design im Shop steht (kleine Zahl = weiter vorn).</dd>
          <dt>Preis</dt>
          <dd>Preis in Euro für ein Druck-PDF. Gilt für neue Bestellungen; bereits bezahlte bleiben beim alten Preis.</dd>
          <dt>Im Shop veröffentlicht</dt>
          <dd>Macht das Design sichtbar und kaufbar. Ausschalten nimmt es sofort aus dem Shop; gekaufte PDFs bleiben für die Kunden abrufbar.</dd>
          <dt>Hintergrund-PDF</dt>
          <dd>
            Die Grafik des Designs. Anforderungen: <strong>genau eine Seite</strong>, Seitengröße wie das Etikettenformat (±1 mm), <strong>keine Formularfelder</strong>, am besten Vektorgrafik in reinem Schwarz und <strong>ohne</strong> die Texte, die der Imker eingibt.
            Feste Texte wie „Lagerung:“ können in der Grafik stehen oder als fester Text-Slot angelegt werden. Ein neuer Upload ersetzt den alten Hintergrund.
          </dd>
        </dl>

        <h3>Speichern und veröffentlichen</h3>
        <ul>
          <li>Änderungen werden erst mit <strong>Speichern</strong> (oben rechts) übernommen. Oben steht „Ungespeicherte Änderungen“, solange etwas offen ist. Verlässt du die Seite über einen Link der Verwaltung, fragt sie vorher nach.</li>
          <li>Ein Design lässt sich nur veröffentlichen, wenn <strong>alle Pflichtangaben einen Slot haben</strong> (Honigsorte, Ursprungsland, Füllmenge, MHD, Losnummer, Imkerei, Straße, PLZ, Ort) und ein <strong>Hintergrund</strong> hochgeladen ist. Was fehlt, steht in Rot unter der Arbeitsfläche.</li>
          <li>„Im Shop ansehen“ öffnet das veröffentlichte Design so, wie Imker es sehen.</li>
        </ul>
      </section>

      <!-- Platzhalter -->
      <section id="platzhalter">
        <h2>Platzhalter</h2>
        <p>Diese Platzhalter kannst du in Text-Slots verwenden. Pflichtangaben muss der Imker immer ausfüllen; optionale Felder zeigt der Shop nur an, wenn das Design sie verwendet.</p>
        <div class="flaeche overflow-x-auto mt-4">
          <table class="tabelle">
            <thead><tr><th>Platzhalter</th><th>Bedeutung</th><th>Beispiel auf dem Etikett</th><th>Pflicht</th></tr></thead>
            <tbody>
              <tr v-for="p in platzhalter" :key="p.key">
                <td><code>{{ '{' + p.key + '}' }}</code></td>
                <td>{{ p.label }}</td>
                <td>{{ p.beispiel }}</td>
                <td>{{ p.optional ? 'optional' : 'ja' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Bögen -->
      <section id="boegen">
        <h2>Tab Etikettenbögen</h2>
        <p>Alle Etikettenpapiere, auf die gedruckt werden kann. Jeder Bogen gehört zu einem Etikettenformat; jedes Design dieses Formats lässt sich auf allen aktiven Bögen des Formats drucken. Gibt es mehrere, wählt der Imker beim Kauf aus.</p>
        <ul>
          <li><strong>Testbogen</strong> öffnet ein kostenloses PDF, das nur die Umrisse der Etiketten zeigt. Auf Normalpapier drucken, auf einen echten Etikettenbogen legen und gegen das Licht halten: Sitzen die Linien auf den Stanzkanten, stimmen die Maße.</li>
          <li><strong>Bearbeiten</strong> lädt den Bogen ins Formular darunter.</li>
        </ul>
        <h3>Neuen Bogen anlegen</h3>
        <ol>
          <li>Unter <strong>„Aus Liste übernehmen“</strong> einen bekannten Avery-Bogen wählen und auf <strong>Übernehmen</strong> klicken. Alle Maße werden eingetragen. Gibt es das passende Etikettenformat noch nicht, wird es automatisch angelegt.</li>
          <li>Der gelbe Hinweis „nicht nachgemessen“ bedeutet: Die Werte stammen aus Herstellerangaben bzw. sind geschätzt. Vor dem Verkauf einen Testbogen drucken und prüfen.</li>
          <li>Steht dein Bogen nicht in der Liste, trägst du die Maße selbst ein (siehe unten).</li>
          <li><strong>Speichern</strong>. Passt das Raster nicht auf die Seite, erscheint eine Fehlermeldung mit der Zahl der überstehenden Millimeter.</li>
        </ol>
        <h3>Die Felder</h3>
        <dl>
          <dt>Hersteller, Artikelnummer, Bezeichnung</dt>
          <dd>So sieht der Imker den Bogen im Shop, in der Mail und auf der Bestellseite. Die Artikelnummer sollte genau der Nummer auf der Packung entsprechen.</dd>
          <dt>Etikettenformat</dt>
          <dd>Größe eines einzelnen Etiketts. Bestimmt, welche Designs auf diesen Bogen passen.</dd>
          <dt>Seite Breite / Höhe</dt>
          <dd>Papiergröße, für A4 210 × 297 mm.</dd>
          <dt>Spalten, Zeilen</dt>
          <dd>Anzahl Etiketten nebeneinander und untereinander. 2 × 5 ergibt 10 Etiketten je Bogen.</dd>
          <dt>Rand oben, Rand links</dt>
          <dd>Abstand von der Papierkante bis zur oberen linken Ecke des ersten Etiketts.</dd>
          <dt>Abstand waagerecht / senkrecht</dt>
          <dd>Die <strong>Lücke zwischen</strong> zwei Etiketten, nicht das Rastermaß. Liegen die Etiketten direkt aneinander, ist der Abstand 0.</dd>
          <dt>Aktiv</dt>
          <dd>Nur aktive Bögen sind im Shop wählbar. Deaktivieren statt löschen: alte Bestellungen verweisen weiter auf den Bogen.</dd>
        </dl>
        <p class="hinweis">Änderungen an den Maßen wirken nur auf <strong>neue</strong> Käufe. Bereits gekaufte PDFs bleiben unverändert.</p>
      </section>

      <!-- Themenwelten -->
      <section id="themenwelten">
        <h2>Tab Themenwelten</h2>
        <p>Die Gruppen, unter denen der Shop die Designs zeigt, z. B. Standard, Saison, Geschenkeditionen.</p>
        <ul>
          <li>Jede Zeile lässt sich direkt ändern und mit dem <strong>Speichern</strong>-Knopf in derselben Zeile sichern.</li>
          <li><strong>Reihenfolge:</strong> kleine Zahl = weiter oben im Shop.</li>
          <li><strong>Kürzel:</strong> interner Name aus Kleinbuchstaben, Ziffern und Bindestrich; muss eindeutig sein.</li>
          <li>Neue Themenwelt über das Formular unten anlegen. Sie erscheint im Shop, sobald ein veröffentlichtes Design zu ihr gehört.</li>
          <li>Löschen ist nicht vorgesehen – eine Themenwelt ohne veröffentlichte Designs ist im Shop einfach unsichtbar.</li>
        </ul>
      </section>

      <!-- Bestellungen -->
      <section id="bestellungen">
        <h2>Tab Bestellungen</h2>
        <p>Alle Bestellungen, die neuesten oben (die letzten 500). Oben rechts steht die Summe aller bezahlten Bestellungen.</p>
        <ul>
          <li><strong>Offen</strong> – der Imker hat auf „Kaufen“ geklickt, die Zahlung aber (noch) nicht abgeschlossen, z. B. weil er bei Stripe abgebrochen hat. Das PDF ist nicht abrufbar.</li>
          <li><strong>Bezahlt</strong> – Stripe hat die Zahlung bestätigt, der Imker hat die Mail mit dem Download-Link bekommen.</li>
          <li><strong>Ansehen</strong> öffnet die Bestellseite des Kunden mit Download-Knopf. Den Link dieser Seite kannst du weitergeben, wenn ein Kunde seine Mail nicht findet.</li>
        </ul>
        <p>Rechnungen und Zahlungsdetails findest du im Stripe-Dashboard.</p>
      </section>

      <!-- Shop -->
      <section id="shop">
        <h2>Der Shop aus Sicht des Imkers</h2>
        <h3>Startseite</h3>
        <p>Alle veröffentlichten Designs, gruppiert nach Themenwelt. Jedes Musteretikett zeigt die Beispieldaten mit dem Schriftzug „VORSCHAU“ und liegt auf einer anderen Papierfarbe.</p>
        <h3>Designseite</h3>
        <ol>
          <li><strong>Der Honig:</strong> Sorte aus der Liste nach Honigverordnung oder „Andere Sorte …“ mit freiem Text, Füllmenge (30–500 g), Ursprungsland (vorbelegt: Deutschland), optional Regionalangabe.</li>
          <li><strong>Diese Charge:</strong> Mindesthaltbarkeitsdatum (muss in der Zukunft und höchstens 3 Jahre voraus liegen) und Losnummer.</li>
          <li><strong>Deine Imkerei:</strong> Name, Straße, PLZ, Ort, optional Website/Telefon, Lagerhinweis, persönlicher Text und Logo – je nachdem, was das Design vorsieht. Die Anschrift merkt sich der Browser des Imkers für den nächsten Besuch.</li>
          <li><strong>Logo:</strong> PNG, JPG oder SVG bis 8 MB. Es wird automatisch in reines Schwarz umgewandelt; helle Bereiche werden durchsichtig.</li>
          <li><strong>Vorschau:</strong> zeigt das Etikett nach jeder Eingabe mit Wasserzeichen. Die farbigen Kreise darunter wechseln nur die Papierfarbe der Vorschau – gedruckt wird immer Schwarz, die Farbe kommt vom Etikettenpapier.</li>
          <li><strong>Kaufen:</strong> E-Mail-Adresse, Häkchen „Vorschau geprüft“ und Häkchen zum Widerrufsrecht bei digitalen Inhalten. Fehlen Angaben oder ist ein Text zu lang, sind die Felder rot markiert und der Kauf startet nicht. Danach geht es zu Stripe (PayPal, Karte, Apple Pay, Google Pay).</li>
        </ol>
        <h3>Nach dem Kauf</h3>
        <ul>
          <li>Die <strong>Bestellseite</strong> bietet „PDF herunterladen“ und „Im Browser öffnen“, Druckhinweise und den Testbogen. Sie ist über den Link in der Mail jederzeit wieder erreichbar.</li>
          <li><strong>„Mit meinen Angaben neu anlegen“</strong> öffnet das Design mit allen Angaben der alten Bestellung – nur Losnummer und MHD sind leer, weil sie sich pro Charge ändern.</li>
          <li>Kommt der Imker von Stripe zurück, bevor die Zahlung bestätigt ist, steht dort „Zahlung wird bestätigt …“; die Seite aktualisiert sich von selbst.</li>
        </ul>
      </section>

      <!-- Fragen -->
      <section id="fragen">
        <h2>Häufige Fragen</h2>
        <dl>
          <dt>Ein Kunde hat sich vertippt. Kann ich sein PDF ändern?</dt>
          <dd>Nein, gekaufte PDFs sind bewusst unveränderlich. Der Kunde legt über „Mit meinen Angaben neu anlegen“ eine neue Bestellung an. Ob du ihm den Betrag erstattest, entscheidest du im Stripe-Dashboard.</dd>
          <dt>Die Etiketten sitzen beim Druck versetzt.</dt>
          <dd>Zuerst prüfen, ob im Druckdialog „Tatsächliche Größe“ bzw. 100 % gewählt war. Zeigt auch der Testbogen eine Verschiebung, die Ränder des Bogens im Tab Etikettenbögen anpassen. Das wirkt nur auf neue Käufe.</dd>
          <dt>Die Mail ist nicht angekommen.</dt>
          <dd>Im Tab Bestellungen die Bestellung suchen, auf „Ansehen“ klicken und den Link der Seite an den Kunden schicken.</dd>
          <dt>Ich will ein Design überarbeiten, ohne dass Kunden die Zwischenstände sehen.</dt>
          <dd>Änderungen werden erst beim Speichern sichtbar. Für größere Umbauten das Design vorübergehend auf Entwurf stellen oder ein neues Design anlegen und das alte danach ausblenden.</dd>
          <dt>Ein Slot ist in der Vorschau rot.</dt>
          <dd>Der Beispieltext passt selbst in der kleinsten Schriftgröße nicht hinein. Slot breiter machen oder die kleinste Schriftgröße senken. Bedenke: Echte Namen und Straßen sind oft länger als die Beispieldaten.</dd>
        </dl>
      </section>
    </article>
  </div>
</template>

<style scoped>
.hilfe section { margin-top: 3rem; scroll-margin-top: 1.5rem; }
.hilfe h2 { font-size: 1.85rem; margin-bottom: .75rem; }
.hilfe h3 { font-size: 1.25rem; margin: 1.75rem 0 .5rem; }
.hilfe p { margin-top: .6rem; }
.hilfe ul, .hilfe ol { margin-top: .6rem; padding-left: 1.3rem; display: grid; gap: .45rem; }
.hilfe ul { list-style: disc; }
.hilfe ol { list-style: decimal; }
.hilfe dl { margin-top: .75rem; display: grid; gap: .2rem; }
.hilfe dt { font-weight: 700; margin-top: .8rem; }
.hilfe dd { color: var(--color-tinte-weich); }
.hilfe code { font-size: .9em; background: var(--color-blatt); border: 1px solid var(--color-linie); border-radius: 4px; padding: 0 .3em; }
.hilfe .hinweis { margin-top: 1rem; padding: .7rem 1rem; border-left: 4px solid var(--color-honig); background: var(--color-blatt); }
</style>
