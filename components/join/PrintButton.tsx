"use client";

export default function PrintButton() {
  return (
    <div className="print:hidden flex justify-center mt-6">
      <button
        type="button"
        onClick={() => window.print()}
        className="btn btn-primary text-sm"
      >
        Drucken / Als PDF speichern
      </button>
    </div>
  );
}
