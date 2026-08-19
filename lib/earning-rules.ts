// Wandelt einen Einkaufsbetrag gemäß der Verdienregel eines Programms in die
// Anzahl zu vergebender Stempel/Punkte um. Gemeinsam von scan/actions.ts und
// programs/actions.ts genutzt, damit beide Wege (Kamera-Scan und manuelle
// Vergabe über die Kartenliste) exakt dieselbe Regel anwenden - sonst könnte
// Personal die Mindestbetrag-Schwelle einfach über den anderen Weg umgehen.
// Eigene Datei statt in einer "use server"-Actions-Datei, weil dort JEDE
// exportierte Funktion als Server Action gelten muss (also async sein muss) -
// dieser reine, synchrone Rechenschritt gehört da nicht hin.
export function unitsFromAmount(
  program: { type: "stamp" | "points"; earning_mode: string; min_purchase_amount: number | null; amount_per_point: number | null },
  amount: number
): { units: number; error?: string } {
  if (program.type === "stamp") {
    const min = program.min_purchase_amount ?? 0;
    if (amount < min) return { units: 0, error: `Mindestbetrag für einen Stempel: ${min.toFixed(2)} €.` };
    return { units: 1 };
  }
  const per = program.amount_per_point ?? 0;
  if (per <= 0) return { units: 0, error: "Verdienregel ist nicht korrekt konfiguriert." };
  const units = Math.floor(amount / per);
  if (units <= 0) return { units: 0, error: `Ab ${per.toFixed(2)} € gibt es den ersten Punkt.` };
  return { units };
}
