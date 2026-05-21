import { google } from "googleapis";
import { parseNumber } from "./format";

type RawRow = Record<string, string>;

export type AccessRecord = {
  email: string;
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

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

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

function makeSlug(value: string) {
  return normalizeKey(value)
    .replace(/_/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isActive(value: string) {
  const normalized = normalizeKey(value);
  return ["ativo", "sim", "yes", "y", "true", "1", "liberado"].includes(normalized);
}

export async function findAccessByEmail(email: string): Promise<AccessRecord | null> {
  const values = await getSheetValues("acessos");
  const rows = rowsToObjects(values);

  const found = rows.find((row) => {
    const rowEmail = pick(row, ["email", "e_mail"]).toLowerCase();
    const status = pick(row, ["status", "liberado", "ativo"], "ATIVO");
    return rowEmail === email.toLowerCase() && isActive(status);
  });

  if (!found) return null;

  const transportador = pick(found, ["transportador", "3pl", "transportadora"]);
  const slug = pick(found, ["slug"], makeSlug(transportador));

  return {
    email,
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
    const rowSlug = pick(row, ["slug"], makeSlug(transportador));
    return rowSlug === slug;
  });

  if (!found) return null;

  const transportador = pick(found, ["transportador", "3pl", "transportadora"]);
  const rowSlug = pick(found, ["slug"], makeSlug(transportador));

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
    pesoTrips: pick(found, ["peso_trips", "peso_trip", "peso_volume"])
  };
}

export async function getMonthlyBySlug(slug: string): Promise<MonthlyRecord[]> {
  const values = await getSheetValues("mensal");
  const rows = rowsToObjects(values);

  return rows
    .map((row) => {
      const transportador = pick(row, ["transportador", "3pl", "transportadora"]);
      const rowSlug = pick(row, ["slug"], makeSlug(transportador));

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
    .filter((row) => row.slug === slug)
    .sort((a, b) => String(a.mes).localeCompare(String(b.mes)));
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
