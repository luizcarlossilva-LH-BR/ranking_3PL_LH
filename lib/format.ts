export function parseNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === "number") return value;

  const raw = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(/%/g, "");

  if (!raw) return 0;

  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw.replace(/,/g, "");

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNumber(value: number, decimals = 2) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value || 0);
}

export function formatPct(value: number, decimals = 1) {
  return `${formatNumber(value, decimals)}%`;
}

export function getStatusClass(value: number, minWarn: number, minGood: number) {
  if (value >= minGood) return "good";
  if (value >= minWarn) return "warn";
  return "bad";
}
