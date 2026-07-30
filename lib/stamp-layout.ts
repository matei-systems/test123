export interface StampGridLayout {
  rows: number;
  cols: number;
  cellSize: number;
}

// Ermittelt automatisch die Zeilen-/Spalten-Aufteilung, die die Stempel
// innerhalb einer festen Fläche (areaW x areaH) maximal groß UND garantiert
// vollständig sichtbar darstellt - unabhängig von der Stempelanzahl (3-30+).
// Probiert einfach jede mögliche Zeilenzahl durch (bei max. 30 Stempeln
// trivial billig) und wählt die, die den größten Zellenraum liefert, ohne
// die Fläche in Breite ODER Höhe zu überschreiten. Wird sowohl von der
// Web-Karte (components/WalletCard.tsx, feste Pixelwerte aus der bekannten
// Kartenbreite) als auch vom Server-Compositing für Apple/Google
// (lib/card-render.ts) verwendet, damit beide exakt dieselbe, saubere
// Anordnung zeigen - der frühere Fehler (feste Regel "über 6 Stempel -> 2
// Reihen" plus reine Breiten-basierte CSS-Prozentgrößen) konnte bei
// bestimmten Kombinationen aus Stempelanzahl und Bannerhöhe dazu führen,
// dass die untere Reihe über den sichtbaren Bereich hinausragt.
export function layoutStampGrid(
  count: number,
  areaW: number,
  areaH: number,
  gap: number,
  maxCellSize = Infinity
): StampGridLayout {
  const n = Math.max(1, count);
  let best: StampGridLayout = { rows: 1, cols: n, cellSize: 0 };
  for (let rows = 1; rows <= n; rows++) {
    const cols = Math.ceil(n / rows);
    const cellW = (areaW - gap * (cols - 1)) / cols;
    const cellH = (areaH - gap * (rows - 1)) / rows;
    const cellSize = Math.min(cellW, cellH, maxCellSize);
    if (cellSize > best.cellSize) {
      best = { rows, cols, cellSize };
    }
  }
  return best;
}
