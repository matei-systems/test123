# Optimierungs-Backlog

Themen, die während der Entwicklung aufgefallen sind, aber bewusst
zurückgestellt wurden, um die Kernfunktionen der Plattform nicht zu
unterbrechen. Kein akuter Handlungsbedarf – werden nach Abschluss der
Kernfunktionen (marktreifes Produkt) gemeinsam priorisiert und
schrittweise abgearbeitet.

Kritische Fehler (Datenverlust, Sicherheitslücken, kaputte Kernfunktionen)
werden davon unabhängig immer sofort behoben, unabhängig von dieser Liste.

---

## Aus P11 (Premium-Kartendesign)

1. **Punktekarten-Design.** Zeigen im Banner bisher nur einen schlichten
   Fortschrittsbalken. Stempelkarten haben durch die individuellen Icons
   eine deutlich hochwertigere Optik – Punktekarten könnten von einer
   ähnlich markenspezifischen Visualisierung profitieren (z. B. ein
   dynamisches Ziffern-/Ring-Design statt eines reinen Balkens).

2. **Eigenes Stempel-Icon hochladen.** Hat noch keine Kreis-Vorschau oder
   Zuschnitt-Hilfe vor dem Speichern, anders als beim Logo-Upload
   (`ImageUpload.tsx` kind="logo" vs. kind="icon").

3. **Bannerbild-Fokuspunkt.** Aktuell nur vertikal einstellbar
   (`bannerFocalY`). Für die meisten Fotos ausreichend, könnte bei
   Hochformat-Motiven aber eine horizontale Fokus-Steuerung nötig werden.

4. **Storage-Housekeeping.** Jede Stempel-/Design-Änderung lädt ein neues,
   versioniertes Hero-Bild in den `card-assets`-Bucket hoch
   (`lib/wallet-updates.ts::renderAndUploadHero`), alte Versionen werden
   nie gelöscht. Vor Produktivbetrieb sollte eine Retention-/Cleanup-Routine
   ergänzt werden (z. B. Cron-Job, der Objekte älter als N Tage löscht,
   sobald ein neueres existiert).

5. **Apple-Icon-Zuschnitt.** `icon.png` nutzt aktuell denselben
   "Contain"-Zuschnitt wie das große Logo (`lib/card-render.ts::
   renderContainedImage`). Für die sehr kleine Icon-Fläche (29/58/87px)
   könnte ein "Cover"-Zuschnitt das Firmenlogo besser ausfüllen.

6. **Wallet-Vorschau im Wizard.** Der Programm-Wizard zeigt aktuell nur die
   Web-Karten-Optik live an (`components/programs/ProgramWizard.tsx`).
   Das tatsächliche Apple-/Google-Pass-Layout (andere Feldanordnung, andere
   Ränder) weicht leicht davon ab – eine zusätzliche Wallet-Pass-Vorschau
   würde Erwartungen vor dem Zertifikats-Setup realistischer machen.

7. **Skalierungshinweis Hero-Rendering.** Jede Stempelvergabe rendert und
   lädt ein komplettes PNG neu hoch (fire-and-forget, blockiert die
   Stempel-Vergabe selbst nicht). Für den aktuellen Umfang unproblematisch;
   bei sehr hoher Frequenz (viele gleichzeitige Stempelvorgänge) später
   ggf. drosseln/queuen statt pro Stempel sofort zu rendern.

---

*Neue Einträge bitte oben oder als neuer Abschnitt mit Phasen-Bezug
ergänzen, damit der Kontext nachvollziehbar bleibt.*
