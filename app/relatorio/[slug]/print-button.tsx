"use client";

export default function PrintButton() {
  return (
    <button className="button secondary" onClick={() => window.print()}>
      Baixar / imprimir PDF
    </button>
  );
}
