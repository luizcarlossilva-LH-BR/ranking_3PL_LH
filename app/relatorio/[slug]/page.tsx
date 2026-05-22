import { redirect } from "next/navigation";
import { getMonthlyBySlug, getNetworkAverage, getRankingBySlug, MonthlyRecord } from "@/lib/sheets";
import { getSessionFromCookies } from "@/lib/session";
import { formatNumber, formatPct, getStatusClass, parseNumber } from "@/lib/format";
import PrintButton from "./print-button";
import LogoutButton from "./logout-button";

const TARGET_ETA_DESTINO = 95;
const WARN_ETA_DESTINO = 93;
const TARGET_NO_SHOW = 98;
const WARN_NO_SHOW = 96;
const MONTH_LABELS = ["Jan", "Fev.", "Mar", "Abr.", "Mai", "Jun.", "Jul", "Ago.", "Set", "Out", "Nov.", "Dez"];

type MonthlyPoint = MonthlyRecord & {
  pontosNum: number;
  etaDestinoNum: number;
  noShowNum: number;
  tripsNum: number;
};

export default async function RelatorioPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const session = await getSessionFromCookies();

  if (!session) {
    redirect("/");
  }

  if (session.slug !== slug) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <div className="brand brand-logos">
            <img className="shopee-mark" src="/shopee-icon.png" alt="Shopee" />
            <img className="bsc-mark compact" src="/bsc-linehaul.png" alt="BSC Line Haul" />
          </div>
          <h1>Acesso bloqueado</h1>
          <p className="muted">
            Seu e-mail está vinculado à transportadora {session.transportador}.
            Por segurança, você não pode acessar o relatório de outra transportadora.
          </p>
          <form action="/">
            <button className="button">Voltar</button>
          </form>
        </section>
      </main>
    );
  }

  const [ranking, mensal, mediaRede] = await Promise.all([
    getRankingBySlug(slug),
    getMonthlyBySlug(slug),
    getNetworkAverage()
  ]);

  if (!ranking) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <div className="brand brand-logos">
            <img className="shopee-mark" src="/shopee-icon.png" alt="Shopee" />
            <img className="bsc-mark compact" src="/bsc-linehaul.png" alt="BSC Line Haul" />
          </div>
          <h1>Relatório não encontrado</h1>
          <p className="muted">
            O acesso foi validado, mas a transportadora não foi localizada na aba ranking.
          </p>
        </section>
      </main>
    );
  }

  const rank = parseNumber(ranking.rank);
  const rankPond = parseNumber(ranking.rankPond);
  const pontuacao = parseNumber(ranking.pontuacao);
  const etaDestino = parseNumber(ranking.etaDestino);
  const noShow = parseNumber(ranking.noShow);
  const trips = parseNumber(ranking.trips);
  const mesesAtivos = parseNumber(ranking.mesesAtivos);
  const pesoTrips = parseNumber(ranking.pesoTrips);
  const mensalTratado = mensal.map(toMonthlyPoint);
  const analiseMensal = buildMonthlyAnalysis(mensalTratado);
  const diagnosticoVolume = buildVolumeText(ranking.transportador, rank, rankPond, trips, pesoTrips);
  const diagnosticoIndicadores = buildIndicatorItems(etaDestino, noShow);
  const recomendacoes = buildRecommendations(etaDestino, noShow, pontuacao, mensalTratado);

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand brand-logos">
            <img className="shopee-mark" src="/shopee-icon.png" alt="Shopee" />
            <img className="bsc-mark compact" src="/bsc-linehaul.png" alt="BSC Line Haul" />
          </div>

          <div className="actions">
            <PrintButton />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main>
        <section className="report-hero">
          <div className="container hero-panel compact-hero">
            <img className="hero-bsc" src="/bsc-linehaul.png" alt="BSC Line Haul" />
            <div className="hero-copy">
              <p>Relatório individual da transportadora</p>
              <h1>{ranking.transportador}</h1>
              <span>
                Leitura executiva do ranking, conectando posição, volume de viagens, indicadores de qualidade
                e evolução mensal para orientar o próximo ciclo operacional.
              </span>
            </div>
            <div className="rank-badge">
              <div>Rank Ponderado</div>
              <div className="rank-number">#{formatNumber(rankPond, 0)}</div>
              <div>Rank simples: #{formatNumber(rank, 0)}</div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container kpi-grid">
            <Kpi label="Rank Ponderado" value={`#${formatNumber(rankPond, 0)}`} />
            <Kpi label="Peso Trips" value={`${formatNumber(pesoTrips, 2)}x`} />
            <Kpi label="Pontuação Ponderada" value={formatNumber(pontuacao, 2)} />
            <Kpi label="ETA Destino" value={formatPct(etaDestino)} status={getEtaStatus(etaDestino)} />
            <Kpi label="No Show" value={formatPct(noShow)} status={getNoShowStatus(noShow)} />
            <Kpi label="Meses Ativos" value={`${formatNumber(mesesAtivos, 0)}/12`} />
          </div>
        </section>

        <section className="section">
          <div className="container grid-2">
            <div className="card">
              <h2>Visão geral do desempenho</h2>
              <p>
                A <strong>{ranking.transportador}</strong> fechou a performance 2025 na posição{" "}
                <strong>#{formatNumber(rankPond, 0)}</strong> do Ranking, com Pontuação de{" "}
                <strong>{formatNumber(pontuacao, 2)} pts.</strong> {buildAverageComparison(pontuacao, mediaRede)}
              </p>
            </div>

            <div className="card">
              <h2>Impacto do volume de viagens no ranking</h2>
              <p>{diagnosticoVolume}</p>
              <div className="callout">
                O Rank simples mede qualidade média. O Rank Ponderado adiciona representatividade operacional pelo
                volume de viagens, destacando transportadoras que combinam escala e consistência.
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container grid-2">
            <div className="card">
              <h2>Indicadores de qualidade</h2>
              <ul className="quality-list">
                {diagnosticoIndicadores.map((item) => (
                  <li key={item.label}>
                    <strong>{item.label}:</strong> {item.value} — {item.level}. {item.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h2>Recomendações para o próximo ciclo</h2>
              <ul>
                {recomendacoes.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container card">
            <h2>Evolução mensal — Pontuação / ETA / No Show</h2>
            <MonthlyMatrix mensal={mensalTratado} />

            {mensalTratado.length > 0 && (
              <div className="monthly-summary">
                <p className={analiseMensal.tendenciaStatus}>
                  {analiseMensal.tendenciaTexto}
                </p>
                <p>
                  Melhor mês: <strong>{analiseMensal.melhorMes?.mes}</strong>{" "}
                  ({formatNumber(analiseMensal.melhorMes?.pontosNum || 0, 1)} pts.) | Pior mês:{" "}
                  <strong>{analiseMensal.piorMes?.mes}</strong> ({formatNumber(analiseMensal.piorMes?.pontosNum || 0, 1)} pts.) |
                  Desempenho recente: <strong>{formatNumber(analiseMensal.desempenhoRecente, 1)} pts.</strong>
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="section">
          <div className="container detailed-table">
            <h2>Base mensal detalhada</h2>
            <p className="muted">
              Tabela de apoio para auditoria dos principais indicadores usados na análise executiva.
            </p>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Pontos</th>
                    <th>ETA Destino</th>
                    <th>No Show</th>
                    <th>Trips</th>
                  </tr>
                </thead>
                <tbody>
                  {mensalTratado.map((item) => (
                    <tr key={`${item.mes}-${item.transportador}`}>
                      <td>{item.mes}</td>
                      <td className={getStatusClass(item.pontosNum, 70, 85)}>{formatNumber(item.pontosNum, 2)}</td>
                      <td className={getEtaStatus(item.etaDestinoNum)}>{formatPct(item.etaDestinoNum)}</td>
                      <td className={getNoShowStatus(item.noShowNum)}>{formatPct(item.noShowNum)}</td>
                      <td>{formatNumber(item.tripsNum, 0)}</td>
                    </tr>
                  ))}

                  {mensalTratado.length === 0 && (
                    <tr>
                      <td colSpan={5}>Não há dados mensais cadastrados para esta transportadora.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="container">
            Shopee Brasil · Excelência Operacional · Line Haul
          </div>
        </footer>
      </main>
    </>
  );
}

function Kpi({ label, value, status }: { label: string; value: string; status?: "good" | "warn" | "bad" }) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-value ${status || ""}`}>{value}</div>
    </div>
  );
}

function MonthlyMatrix({ mensal }: { mensal: MonthlyPoint[] }) {
  if (!mensal.length) {
    return <p className="muted">Não há dados mensais cadastrados para esta transportadora.</p>;
  }

  return (
    <div className="monthly-matrix-wrap">
      <table className="monthly-matrix">
        <thead>
          <tr>
            <th>Indicador</th>
            {mensal.map((item, index) => (
              <th key={`${item.mes}-${index}`}>{formatMonthLabel(item.mes, index)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Pontuação</th>
            {mensal.map((item, index) => (
              <td key={`pontos-${item.mes}-${index}`} className={getStatusClass(item.pontosNum, 70, 85)}>
                {formatNumber(item.pontosNum, 1)}
              </td>
            ))}
          </tr>
          <tr>
            <th>ETA Destino %</th>
            {mensal.map((item, index) => (
              <td key={`eta-${item.mes}-${index}`} className={getEtaStatus(item.etaDestinoNum)}>
                {formatNumber(item.etaDestinoNum, 1)}
              </td>
            ))}
          </tr>
          <tr>
            <th>No Show %</th>
            {mensal.map((item, index) => (
              <td key={`noshow-${item.mes}-${index}`} className={getNoShowStatus(item.noShowNum)}>
                {formatNumber(item.noShowNum, 1)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="matrix-legend">
        Linha 1: Pontuação | Linha 2: ETA Destino % | Linha 3: No Show % &nbsp; Verde: excelente |
        Amarelo: atenção | Vermelho: crítico
      </p>
    </div>
  );
}

function toMonthlyPoint(item: MonthlyRecord): MonthlyPoint {
  return {
    ...item,
    pontosNum: parseNumber(item.pontos),
    etaDestinoNum: parseNumber(item.etaDestino),
    noShowNum: parseNumber(item.noShow),
    tripsNum: parseNumber(item.trips)
  };
}

function buildAverageComparison(pontuacao: number, mediaRede: number) {
  if (!mediaRede) return "";

  const diff = pontuacao - mediaRede;
  const direction = diff >= 0 ? "acima" : "abaixo";

  return `${formatNumber(Math.abs(diff), 2)} pts. ${direction} da média geral que foi de ${formatNumber(mediaRede, 2)} pts.`;
}

function buildVolumeText(transportador: string, rank: number, rankPond: number, trips: number, pesoTrips: number) {
  const volume = `${formatNumber(trips, 0)} viagens, fator ${formatNumber(pesoTrips, 2)}x`;

  if (!rank || !rankPond) {
    return `Não foi possível calcular a diferença entre Rank simples e Rank Ponderado para a ${transportador}, pois um dos campos está sem informação.`;
  }

  if (rankPond < rank) {
    return `O volume de viagens da ${transportador} (${volume}) melhorou sua posição: saiu de #${formatNumber(rank, 0)} no Rank Simples para #${formatNumber(rankPond, 0)} no Rank Ponderado. A escala operacional fortaleceu a leitura final do ranking.`;
  }

  if (rankPond > rank) {
    return `O volume de viagens da ${transportador} (${volume}) reduziu sua posição: saiu de #${formatNumber(rank, 0)} no Rank Simples para #${formatNumber(rankPond, 0)} no Rank Ponderado. Há oportunidade de equilibrar representatividade e qualidade operacional.`;
  }

  return `O volume de viagens da ${transportador} (${volume}) não alterou sua posição: Rank Simples e Rank Ponderado coincidem na posição #${formatNumber(rank, 0)}. Volume e qualidade estão alinhados.`;
}

function buildIndicatorItems(etaDestino: number, noShow: number) {
  return [
    {
      label: "ETA Destino",
      value: formatPct(etaDestino),
      level: describeEta(etaDestino),
      text: etaDestino >= TARGET_ETA_DESTINO
        ? "Pontualidade nas entregas é um diferencial competitivo."
        : "Pontualidade nas entregas deve ser tratada como prioridade operacional."
    },
    {
      label: "No Show",
      value: formatPct(noShow),
      level: describeNoShow(noShow),
      text: noShow >= TARGET_NO_SHOW
        ? "Excelente disponibilidade operacional."
        : "Disponibilidade operacional abaixo do target exige confirmação antecipada de frota e motorista."
    }
  ];
}

function buildMonthlyAnalysis(mensal: MonthlyPoint[]) {
  const valid = mensal.filter((item) => item.pontosNum > 0);
  const mediaMensal = valid.length
    ? valid.reduce((sum, item) => sum + item.pontosNum, 0) / valid.length
    : 0;
  const melhorMes = valid.reduce<MonthlyPoint | null>((best, item) => (
    !best || item.pontosNum > best.pontosNum ? item : best
  ), null);
  const piorMes = valid.reduce<MonthlyPoint | null>((worst, item) => (
    !worst || item.pontosNum < worst.pontosNum ? item : worst
  ), null);
  const first = valid[0]?.pontosNum || 0;
  const last = valid[valid.length - 1]?.pontosNum || 0;
  const recent = valid.slice(-3);
  const desempenhoRecente = recent.length
    ? recent.reduce((sum, item) => sum + item.pontosNum, 0) / recent.length
    : last;
  const diff = last - first;

  if (valid.length < 2) {
    return {
      mediaMensal,
      melhorMes,
      piorMes,
      desempenhoRecente,
      tendenciaStatus: "warn" as const,
      tendenciaTexto: "Histórico mensal insuficiente para leitura de tendência. Acompanhar novos meses para confirmar estabilidade."
    };
  }

  if (diff <= -10) {
    return {
      mediaMensal,
      melhorMes,
      piorMes,
      desempenhoRecente,
      tendenciaStatus: "bad" as const,
      tendenciaTexto: "Tendência de queda progressiva — pontuações recentes inferiores ao início. Requer atenção imediata."
    };
  }

  if (diff < 0) {
    return {
      mediaMensal,
      melhorMes,
      piorMes,
      desempenhoRecente,
      tendenciaStatus: "warn" as const,
      tendenciaTexto: "Tendência de queda moderada — desempenho recente abaixo do início do período. Requer plano de estabilização."
    };
  }

  return {
    mediaMensal,
    melhorMes,
    piorMes,
    desempenhoRecente,
    tendenciaStatus: "good" as const,
    tendenciaTexto: "Tendência estável ou positiva — desempenho recente sustenta a posição atual no ranking."
  };
}

function buildRecommendations(
  etaDestino: number,
  noShow: number,
  pontuacao: number,
  mensal: MonthlyPoint[]
) {
  const items: string[] = [];
  const analysis = buildMonthlyAnalysis(mensal);

  if (analysis.tendenciaStatus === "bad") {
    items.push("Estabilizar a operação — tendência de queda é o maior risco para o próximo ciclo.");
  } else if (analysis.tendenciaStatus === "warn") {
    items.push("Criar rotina semanal de acompanhamento para impedir deterioração gradual da pontuação.");
  }

  if (etaDestino < TARGET_ETA_DESTINO) {
    items.push("Reforçar plano de ação para ETA Destino, com foco em rotas recorrentes de atraso, disciplina de parada e aderência ao horário previsto de chegada.");
  }

  if (noShow < TARGET_NO_SHOW) {
    items.push("Atuar na prevenção de No Show, reforçando confirmação antecipada de veículo, motorista e disponibilidade operacional junto à programação.");
  }

  if (pontuacao < 70) {
    items.push("Priorizar recuperação da performance geral, pois esse componente concentra o maior impacto na leitura final do ranking.");
  }

  if (!items.length) {
    items.push("Preservar a estabilidade operacional e transformar os meses de melhor desempenho em padrão de execução.");
  }

  return items;
}

function formatMonthLabel(value: string, index: number) {
  const numeric = Number(String(value).match(/\d{1,2}/)?.[0]);

  if (numeric >= 1 && numeric <= 12) return MONTH_LABELS[numeric - 1];

  return MONTH_LABELS[index] || value;
}

function getEtaStatus(value: number) {
  if (value >= TARGET_ETA_DESTINO) return "good" as const;
  if (value >= WARN_ETA_DESTINO) return "warn" as const;
  return "bad" as const;
}

function getNoShowStatus(value: number) {
  if (value >= TARGET_NO_SHOW) return "good" as const;
  if (value >= WARN_NO_SHOW) return "warn" as const;
  return "bad" as const;
}

function describeEta(value: number) {
  if (value >= TARGET_ETA_DESTINO) return "nível excelente (acima ou igual a 95%)";
  if (value >= WARN_ETA_DESTINO) return "nível de atenção";
  return "nível crítico";
}

function describeNoShow(value: number) {
  if (value >= TARGET_NO_SHOW) return "excelente disponibilidade operacional";
  if (value >= WARN_NO_SHOW) return "nível de atenção";
  return "nível crítico";
}
