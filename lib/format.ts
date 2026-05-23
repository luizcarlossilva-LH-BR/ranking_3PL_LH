export function parseNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === "number") return value;

  const raw = String(value)
    .trim()
    .replace(/\s/g, "")
    .replace(/%/g, "");

  if (!raw) return 0;

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");
  let normalized = raw;

  if (lastComma >= 0 && lastDot >= 0) {
    normalized = lastComma > lastDot
      ? raw.replace(/\./g, "").replace(",", ".")
      : raw.replace(/,/g, "");
  } else if (lastComma >= 0) {
    const digitsAfterComma = raw.length - lastComma - 1;
    normalized = digitsAfterComma === 3
      ? raw.replace(/,/g, "")
      : raw.replace(",", ".");
  } else if (lastDot >= 0) {
    const digitsAfterDot = raw.length - lastDot - 1;
    normalized = digitsAfterDot === 3
      ? raw.replace(/\./g, "")
      : raw;
  }

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
