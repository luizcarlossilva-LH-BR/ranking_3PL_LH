import { google } from "googleapis";
import { parseNumber } from "./format";

type RawRow = Record<string, string>;

export type AccessRecord = {
  cpf: string;
  transportador: string;
  slug: string;
  status: string;
};

export type RankingRecord = {
  transportador: string;
  slug: string;
  rank: string;
  rankPond: string;
  pontuacao: string;
  etaDestino: string;
  noShow: string;
  trips: string;
  mesesAtivos: string;
  pesoTrips: string;
  rankSafety: string;
  pontuacaoSafety: string;
  rankPeakSeason: string;
  pontuacaoPeakSeason: string;
};

export type MonthlyRecord = {
  transportador: string;
  slug: string;
  mes: string;
  pontos: string;
  etaDestino: string;
  noShow: string;
  trips: string;
};

export type XptRecord = {
  xpt: string;
  slug: string;
  ranking: string;
  leakage: string;
  loss: string;
  bwt: string;
  resultado: string;
};

export type HibridoRecord = {
  hibrido: string;
  slug: string;
  ranking: string;
  resultado: string;
};

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const MONTH_ORDER: Record<string, number> = {
  jan: 1,
  janeiro: 1,
  feb: 2,
  fev: 2,
  fevereiro: 2,
  mar: 3,
  marco: 3,
  março: 3,
  apr: 4,
  abr: 4,
  abril: 4,
  may: 5,
  mai: 5,
  maio: 5,
  jun: 6,
  junho: 6,
  jul: 7,
  julho: 7,
  aug: 8,
  ago: 8,
  agosto: 8,
  sep: 9,
  set: 9,
  setembro: 9,
  oct: 10,
  out: 10,
  outubro: 10,
  nov: 11,
  novembro: 11,
  dec: 12,
  dez: 12,
  dezembro: 12
};

function assertEnv() {
  if (!SHEET_ID) throw new Error("GOOGLE_SHEET_ID não configurado.");
  if (!process.env.GOOGLE_CLIENT_EMAIL) throw new Error("GOOGLE_CLIENT_EMAIL não configurado.");
  if (!process.env.GOOGLE_PRIVATE_KEY) throw new Error("GOOGLE_PRIVATE_KEY não configurado.");
}

function getAuth() {
  assertEnv();

  const privateKey = process.env.GOOGLE_PRIVATE_KEY!
    .replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email: process.env.GOOGLE_CLIENT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });
}

async function getSheetValues(tabName: string) {
  const sheets = google.sheets({ version: "v4", auth: getAuth() });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A:ZZ`
  });

  return response.data.values || [];
}

function normalizeKey(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[()/%]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function rowsToObjects(values: any[][]): RawRow[] {
  if (!values.length) return [];

  const headers = values[0].map((header) => normalizeKey(String(header || "")));

  return values.slice(1).map((row) => {
    const obj: RawRow = {};
    headers.forEach((header, index) => {
      if (header) obj[header] = String(row[index] ?? "").trim();
    });
    return obj;
  });
}

function pick(row: RawRow, keys: string[], fallback = "") {
  for (const key of keys) {
    const normalized = normalizeKey(key);
    if (row[normalized] !== undefined && row[normalized] !== "") {
      return row[normalized];
    }
  }

  return fallback;
}

function onlyDigits(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function getCpfCandidates(value: string) {
  const normalized = onlyDigits(value);
  const chunks =
    normalized.length > 11 && normalized.length % 11 === 0
      ? normalized.match(/\d{11}/g) || []
      : [];
  const separated = String(value || "")
    .split(/[;,\n\r|/]+/)
    .map((part) => onlyDigits(part))
    .filter(Boolean);

  return Array.from(new Set([...separated, ...chunks, normalized].filter((item) => item.length === 11)));
}

function rowMatchesCpf(row: RawRow, cpf: string) {
  const normalizedCpf = onlyDigits(cpf);
  const cpfFields = Object.entries(row)
    .filter(([key]) => {
      return (
        key === "cpf" ||
        key === "documento" ||
        key === "doc" ||
        key.startsWith("cpf_") ||
        key.startsWith("documento_") ||
        key.startsWith("doc_")
      );
    })
    .map(([, value]) => value);

  return cpfFields.some((value) => getCpfCandidates(value).includes(normalizedCpf));
}

export function makeSlug(value: string) {
  return normalizeKey(value)
    .replace(/_/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pickSlug(row: RawRow, transportador: string) {
  return makeSlug(pick(row, ["slug"], transportador));
}

function isActive(value: string) {
  const normalized = normalizeKey(value);
  return ["ativo", "sim", "yes", "y", "true", "1", "liberado"].includes(normalized);
}

function getMonthSortValue(value: string) {
  const raw = String(value || "").trim();
  const normalized = normalizeKey(raw);
  const yearMonth = raw.match(/(\d{4})\D+(\d{1,2})/);

  if (yearMonth) {
    return Number(yearMonth[1]) * 100 + Number(yearMonth[2]);
  }

  const monthYear = raw.match(/(\d{1,2})\D+(\d{4})/);

  if (monthYear) {
    return Number(monthYear[2]) * 100 + Number(monthYear[1]);
  }

  const numericMonth = Number(raw.match(/\d{1,2}/)?.[0]);

  if (numericMonth >= 1 && numericMonth <= 12) {
    return numericMonth;
  }

  const monthName = normalized
    .split("_")
    .find((part) => MONTH_ORDER[part] !== undefined);

  return monthName ? MONTH_ORDER[monthName] : Number.MAX_SAFE_INTEGER;
}

export async function findAccessByCpf(cpf: string): Promise<AccessRecord | null> {
  const values = await getSheetValues("acessos");
  const rows = rowsToObjects(values);
  const normalizedCpf = onlyDigits(cpf);

  const found = rows.find((row) => {
    const status = pick(row, ["status", "liberado", "ativo"], "ATIVO");
    return rowMatchesCpf(row, normalizedCpf) && isActive(status);
  });

  if (!found) return null;

  const transportador = pick(found, ["transportador", "3pl", "transportadora"]);
  const slug = pickSlug(found, transportador);

  return {
    cpf: normalizedCpf,
    transportador,
    slug,
    status: pick(found, ["status"], "ATIVO")
  };
}

export async function getRankingBySlug(slug: string): Promise<RankingRecord | null> {
  const values = await getSheetValues("ranking");
  const rows = rowsToObjects(values);

  const found = rows.find((row) => {
    const transportador = pick(row, ["transportador", "3pl", "transportadora"]);
    const rowSlug = pickSlug(row, transportador);
    return rowSlug === makeSlug(slug);
  });

  if (!found) return null;

  const transportador = pick(found, ["transportador", "3pl", "transportadora"]);
  const rowSlug = pickSlug(found, transportador);

  return {
    transportador,
    slug: rowSlug,
    rank: pick(found, ["rank", "rank_simples"]),
    rankPond: pick(found, ["rank_pond", "rank_ponderado", "ranking_ponderado"]),
    pontuacao: pick(found, ["pontuacao", "pontuação", "pontos", "pontuacao_final"]),
    etaDestino: pick(found, ["eta_destino", "eta_d", "med_pts_eta_destino", "porct_eta_dest"]),
    noShow: pick(found, ["no_show", "noshow", "med_pts_show", "porct_no_show"]),
    trips: pick(found, ["trips", "n_viagens", "sum_of_n_viagens", "viagens"]),
    mesesAtivos: pick(found, ["meses_ativos", "meses", "active_months"]),
    pesoTrips: pick(found, ["peso_trips", "peso_trip", "peso_volume"]),
    rankSafety: pick(found, ["rank_safety", "safety_rank", "ranking_safety", "rank_seguranca", "rank_segurança"]),
    pontuacaoSafety: pick(found, ["pontuacao_safety", "pontuação_safety", "safety_score", "score_safety", "pontuacao_seguranca", "pontuação_segurança"]),
    rankPeakSeason: pick(found, ["rank_peak_season", "peak_season_rank", "ranking_peak_season", "rank_peak", "rank_pico"]),
    pontuacaoPeakSeason: pick(found, ["pontuacao_peak_season", "pontuação_peak_season", "peak_season_score", "score_peak_season", "pontuacao_peak", "pontuação_pico"])
  };
}

export async function getMonthlyBySlug(slug: string): Promise<MonthlyRecord[]> {
  const values = await getSheetValues("mensal");
  const rows = rowsToObjects(values);

  return rows
    .map((row) => {
      const transportador = pick(row, ["transportador", "3pl", "transportadora"]);
      const rowSlug = pickSlug(row, transportador);

      return {
        transportador,
        slug: rowSlug,
        mes: pick(row, ["mes", "mês", "month", "year_month", "max_date_year_month"]),
        pontos: pick(row, ["pontos", "pontuacao", "pontuação", "sum_of_pontos"]),
        etaDestino: pick(row, ["eta_destino", "eta_d", "porct_eta_dest", "sum_of_porct_eta_dest"]),
        noShow: pick(row, ["no_show", "noshow", "porct_no_show", "sum_of_porct_no_show"]),
        trips: pick(row, ["trips", "n_viagens", "sum_of_n_viagens", "viagens"])
      };
    })
    .filter((row) => row.slug === makeSlug(slug))
    .sort((a, b) => {
      const diff = getMonthSortValue(a.mes) - getMonthSortValue(b.mes);
      return diff || String(a.mes).localeCompare(String(b.mes));
    });
}

export async function getNetworkAverage() {
  const values = await getSheetValues("ranking");
  const rows = rowsToObjects(values);

  const scores = rows
    .map((row) => parseNumber(pick(row, ["pontuacao", "pontuação", "pontos", "pontuacao_final"])))
    .filter((value) => value > 0);

  if (!scores.length) return 0;

  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function mapXptRecord(row: RawRow): XptRecord {
  const xpt = pick(row, ["3pl", "xpt", "transportador", "transportadora"]);

  return {
    xpt,
    slug: makeSlug(xpt),
    ranking: pick(row, ["ranking", "rank", "classificacao", "classificação"]),
    leakage: pick(row, ["leakage"]),
    loss: pick(row, ["loss"]),
    bwt: pick(row, ["bwt"]),
    resultado: pick(row, ["resultado", "result"])
  };
}

export async function getAllXpt(): Promise<XptRecord[]> {
  const values = await getSheetValues("XPT");
  const rows = rowsToObjects(values);

  return rows
    .map(mapXptRecord)
    .filter((row) => row.xpt)
    .sort((a, b) => a.xpt.localeCompare(b.xpt));
}

export async function getXptBySlug(slug: string): Promise<XptRecord | null> {
  const rows = await getAllXpt();
  return rows.find((row) => row.slug === makeSlug(slug)) || null;
}

export async function findXptAccessByCpf(cpf: string): Promise<AccessRecord | null> {
  const values = await getSheetValues("XPT");
  const rows = rowsToObjects(values);
  const normalizedCpf = onlyDigits(cpf);

  const found = rows.find((row) => {
    const status = pick(row, ["status", "liberado", "ativo"], "ATIVO");
    return rowMatchesCpf(row, normalizedCpf) && isActive(status);
  });

  if (!found) return null;

  const xpt = pick(found, ["3pl", "xpt", "transportador", "transportadora"]);

  return {
    cpf: normalizedCpf,
    transportador: xpt,
    slug: makeSlug(xpt),
    status: pick(found, ["status"], "ATIVO")
  };
}

function mapHibridoRecord(row: RawRow): HibridoRecord {
  const hibrido = pick(row, ["3pl", "hibrido", "híbrido", "transportador", "transportadora"]);

  return {
    hibrido,
    slug: makeSlug(hibrido),
    ranking: pick(row, ["ranking", "rank", "classificacao", "classificação"]),
    resultado: pick(row, ["resultado", "result"])
  };
}

export async function getAllHibridos(): Promise<HibridoRecord[]> {
  const values = await getSheetValues("Hibrido");
  const rows = rowsToObjects(values);

  return rows
    .map(mapHibridoRecord)
    .filter((row) => row.hibrido)
    .sort((a, b) => a.hibrido.localeCompare(b.hibrido));
}

export async function getHibridoBySlug(slug: string): Promise<HibridoRecord | null> {
  const rows = await getAllHibridos();
  return rows.find((row) => row.slug === makeSlug(slug)) || null;
}

export async function findHibridoAccessByCpf(cpf: string): Promise<AccessRecord | null> {
  const values = await getSheetValues("Hibrido");
  const rows = rowsToObjects(values);
  const normalizedCpf = onlyDigits(cpf);

  const found = rows.find((row) => {
    const status = pick(row, ["status", "liberado", "ativo"], "ATIVO");
    return rowMatchesCpf(row, normalizedCpf) && isActive(status);
  });

  if (!found) return null;

  const hibrido = pick(found, ["3pl", "hibrido", "híbrido", "transportador", "transportadora"]);

  return {
    cpf: normalizedCpf,
    transportador: hibrido,
    slug: makeSlug(hibrido),
    status: pick(found, ["status"], "ATIVO")
  };
}
