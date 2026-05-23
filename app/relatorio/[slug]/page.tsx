import { redirect } from "next/navigation";
import { getMonthlyBySlug, getNetworkAverage, getRankingBySlug, makeSlug, MonthlyRecord } from "@/lib/sheets";
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

  if (makeSlug(session.slug) !== makeSlug(slug)) {
    return (
      <main className="login-shell">
        <section className="login-card">
          <div className="brand brand-logos">
            <img className="shopee-mark" src="/shopee-icon.png" alt="Shopee" />
            <img className="bsc-mark compact" src="/bsc-linehaul.png" alt="BSC Line Haul" />
          </div>
          <h1>Acesso bloqueado</h1>
          <p className="muted">
            Seu CPF está vinculado à transportadora {session.transportador}.
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
  const diagnosticoOperacional = buildOperationalDiagnosis(pontuacao, etaDestino, noShow, analiseMensal.tendenciaStatus);
  const recomendacoes = buildRecommendations(etaDestino, noShow, pontuacao, mensalTratado);
  const conclusaoGerencial = buildManagementConclusion(ranking.transportador, pontuacao, mediaRede, analiseMensal.tendenciaStatus);

  return (
    <>
      <style>{REPORT_STYLES}</style>

      <header className="manager-topbar">
        <div className="manager-container manager-topbar-inner">
          <div className="manager-brand">
            <img src="/shopee-icon.png" alt="Shopee" />
            <img src="/bsc-linehaul.png" alt="BSC Line Haul" />
          </div>

          <div className="actions">
            <PrintButton />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="manager-page">
        <section className="manager-hero">
          <div className="manager-container manager-hero-grid">
            <div>
              <div className="manager-eyebrow">Relatório gerencial 2025</div>
              <h1>{ranking.transportador}</h1>
              <p>
                Visão executiva de performance, qualidade operacional, impacto de volume e evolução mensal para suporte
                à tomada de decisão.
              </p>
            </div>

            <div className="manager-rank-card">
              <span>Ranking</span>
              <strong>#{formatNumber(rankPond, 0)}</strong>
            </div>
          </div>
        </section>

        <section className="manager-section manager-container">
          <div className="manager-criteria">
            <div className="manager-criteria-logo">
              <img src="/bsc-linehaul.png" alt="BSC Line Haul" />
            </div>

            <div>
              <h2>Critérios e cálculo da premiação</h2>
              <p>
                Para participar do ranking oficial, a transportadora precisa ter mais de 3 meses ativos no período
                analisado. Um mês é considerado ativo quando possui mais de 12 viagens realizadas.
              </p>
              <p>
                A pontuação base é composta por três indicadores principais: média da pontuação BSC nos meses ativos,
                com peso de <strong>60%</strong>; ETA Destino, com peso de <strong>20%</strong>; e No Show, também com
                peso de <strong>20%</strong>. Após o cálculo da pontuação base, é aplicado o múltiplo de share.
              </p>
            </div>
          </div>
        </section>

        <section className="manager-section manager-kpis manager-container">
          <Kpi label="Ranking" value={`#${formatNumber(rankPond, 0)}`} />
          <Kpi label="Pontuação" value={formatNumber(pontuacao, 2)} />
          <Kpi label="Peso Trips" value={`${formatNumber(pesoTrips, 2)}x`} />
          <Kpi label="ETA Destino" value={formatPct(etaDestino)} status={getEtaStatus(etaDestino)} />
          <Kpi label="No Show" value={formatPct(noShow)} status={getNoShowStatus(noShow)} />
          <Kpi label="Meses Ativos" value={`${formatNumber(mesesAtivos, 0)}/12`} />
        </section>

        <section className="manager-section manager-container manager-grid">
          <ArticleCard title="Resumo executivo">
            <p>
              A <strong>{ranking.transportador}</strong> fechou a performance 2025 na posição{" "}
              <strong>#{formatNumber(rankPond, 0)}</strong> do Ranking, com Pontuação de{" "}
              <strong>{formatNumber(pontuacao, 2)} pts.</strong> {buildAverageComparison(pontuacao, mediaRede)}
            </p>
          </ArticleCard>

          <ArticleCard title="Diagnóstico operacional">
            <p>{diagnosticoOperacional}</p>
          </ArticleCard>
        </section>

        <section className="manager-section manager-container manager-grid">
          <ArticleCard title="Impacto do volume no ranking">
            <p>{diagnosticoVolume}</p>
          </ArticleCard>

          <ArticleCard title="Indicadores de qualidade">
            <ul className="manager-list">
              {diagnosticoIndicadores.map((item) => (
                <li key={item.label}>
                  <strong>{item.label}:</strong> {item.value} — {item.level}. {item.text}
                </li>
              ))}
            </ul>
          </ArticleCard>
        </section>

        <section className="manager-section manager-container">
          <ArticleCard title="Recomendações">
            <ul className="manager-list">
              {recomendacoes.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </ArticleCard>
        </section>

        <section className="manager-section manager-container">
          <ArticleCard title="Tabela mensal com cores por faixa de desempenho">
            <MonthlyMatrix mensal={mensalTratado} />

            {mensalTratado.length > 0 && (
              <div className="manager-monthly-note">
                <p className={analiseMensal.tendenciaStatus}>{analiseMensal.tendenciaTexto}</p>
                <p>
                  Melhor mês: <strong>{analiseMensal.melhorMes?.mes}</strong>{" "}
                  ({formatNumber(analiseMensal.melhorMes?.pontosNum || 0, 1)} pts.) | Pior mês:{" "}
                  <strong>{analiseMensal.piorMes?.mes}</strong> ({formatNumber(analiseMensal.piorMes?.pontosNum || 0, 1)} pts.) |
                  Desempenho recente: <strong>{formatNumber(analiseMensal.desempenhoRecente, 1)} pts.</strong>
                </p>
              </div>
            )}
          </ArticleCard>
        </section>

        <section className="manager-section manager-container">
          <div className="manager-conclusion">
            <h2>Conclusão gerencial</h2>
            <p>{conclusaoGerencial}</p>
          </div>
        </section>

        <footer className="manager-footer">
          Shopee Brasil · Excelência Operacional · Line Haul
        </footer>
      </main>
    </>
  );
}

function Kpi({ label, value, status }: { label: string; value: string; status?: "good" | "warn" | "bad" }) {
  return (
    <div className="manager-kpi">
      <div className="manager-kpi-label">{label}</div>
      <div className={`manager-kpi-value ${status || ""}`}>{value}</div>
    </div>
  );
}

function ArticleCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="manager-card">
      <h2>{title}</h2>
      {children}
    </article>
  );
}

function MonthlyMatrix({ mensal }: { mensal: MonthlyPoint[] }) {
  if (!mensal.length) {
    return <p className="manager-muted">Não há dados mensais cadastrados para esta transportadora.</p>;
  }

  return (
    <div className="manager-table-wrap">
      <table className="manager-monthly-matrix">
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
      <p className="manager-legend">
        Linha 1: Pontuação | Linha 2: ETA Destino % | Linha 3: No Show % · Verde: excelente |
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
    return `Não foi possível calcular o impacto do volume para a ${transportador}, pois um dos campos necessários está sem informação.`;
  }

  if (rankPond < rank) {
    return `O volume de viagens da ${transportador} (${volume}) fortaleceu a posição final no Ranking, encerrando o período em #${formatNumber(rankPond, 0)}. A escala operacional contribuiu positivamente para a leitura final.`;
  }

  if (rankPond > rank) {
    return `O volume de viagens da ${transportador} (${volume}) pressionou a posição final no Ranking, encerrando o período em #${formatNumber(rankPond, 0)}. Há oportunidade de equilibrar representatividade e qualidade operacional.`;
  }

  return `O volume de viagens da ${transportador} (${volume}) manteve a posição final em #${formatNumber(rankPond, 0)}. Volume e qualidade estão alinhados.`;
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
        ? "Indicador dentro da faixa esperada."
        : "Disponibilidade operacional abaixo do target exige confirmação antecipada de frota e motorista."
    }
  ];
}

function buildOperationalDiagnosis(
  pontuacao: number,
  etaDestino: number,
  noShow: number,
  tendenciaStatus: "good" | "warn" | "bad"
) {
  const qualityRisks = [
    etaDestino < TARGET_ETA_DESTINO ? "ETA Destino abaixo do target" : "",
    noShow < TARGET_NO_SHOW ? "No Show abaixo do target" : ""
  ].filter(Boolean);

  if (tendenciaStatus === "bad") {
    return `A operação apresenta risco de deterioração recente e deve priorizar estabilização do desempenho mensal. ${qualityRisks.length ? `Pontos de atenção: ${qualityRisks.join(" e ")}.` : "Os indicadores de qualidade devem ser preservados para evitar perda de posição."}`;
  }

  if (qualityRisks.length) {
    return `A pontuação de ${formatNumber(pontuacao, 2)} pts. é sustentada parcialmente pela base operacional, mas há oportunidade clara de ganho com a recuperação de ${qualityRisks.join(" e ")}.`;
  }

  return `A operação apresenta leitura consistente, com pontuação de ${formatNumber(pontuacao, 2)} pts. e indicadores de qualidade dentro das faixas esperadas. O foco gerencial deve ser manter estabilidade e prevenir oscilações mensais.`;
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

function buildManagementConclusion(
  transportador: string,
  pontuacao: number,
  mediaRede: number,
  tendenciaStatus: "good" | "warn" | "bad"
) {
  const comparison = mediaRede && pontuacao >= mediaRede ? "acima da média geral" : "abaixo da média geral";

  if (tendenciaStatus === "bad") {
    return `A ${transportador} demanda acompanhamento gerencial próximo no próximo ciclo. Apesar da posição atual no ranking, a tendência recente indica risco de perda de competitividade se a operação não for estabilizada.`;
  }

  if (tendenciaStatus === "warn") {
    return `A ${transportador} encerra o período ${comparison}, mas precisa reduzir oscilação operacional para proteger a pontuação e sustentar a posição no ranking.`;
  }

  return `A ${transportador} encerra o período ${comparison}, com leitura operacional favorável. A prioridade gerencial deve ser preservar consistência, manter disciplina nos indicadores críticos e replicar os meses de melhor desempenho.`;
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
  if (value >= TARGET_ETA_DESTINO) return "nível excelente";
  if (value >= WARN_ETA_DESTINO) return "nível de atenção";
  return "nível crítico";
}

function describeNoShow(value: number) {
  if (value >= TARGET_NO_SHOW) return "excelente disponibilidade operacional";
  if (value >= WARN_NO_SHOW) return "nível de atenção";
  return "nível crítico";
}

const REPORT_STYLES = `
  .manager-page {
    min-height: 100vh;
    background:
      linear-gradient(135deg, rgba(238, 77, 45, .08), transparent 28%),
      linear-gradient(315deg, rgba(255, 122, 0, .12), transparent 30%),
      #fff7f0;
    color: #2d241f;
  }

  .manager-container {
    width: min(1120px, calc(100% - 32px));
    margin: 0 auto;
  }

  .manager-topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    background: rgba(255, 247, 240, .94);
    border-bottom: 3px solid #ee4d2d;
    backdrop-filter: blur(12px);
  }

  .manager-topbar-inner {
    min-height: 68px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
  }

  .manager-brand {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .manager-brand img:first-child {
    width: auto;
    height: 52px;
    object-fit: contain;
  }

  .manager-brand img:last-child {
    width: auto;
    height: 52px;
    object-fit: contain;
    mix-blend-mode: multiply;
  }

  .manager-hero {
    padding: 34px 0;
    color: white;
    background: linear-gradient(135deg, #e7351d 0%, #ee4d2d 48%, #ff8a00 100%);
    box-shadow: inset 0 -1px 0 rgba(255, 255, 255, .22);
  }

  .manager-hero-grid {
    display: grid;
    grid-template-columns: 1fr 230px;
    gap: 28px;
    align-items: center;
  }

  .manager-eyebrow {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
    opacity: .86;
  }

  .manager-hero h1 {
    margin: 0;
    font-size: 42px;
    line-height: 1.05;
    letter-spacing: 0;
  }

  .manager-hero p {
    max-width: 740px;
    margin: 12px 0 0;
    color: rgba(255, 255, 255, .88);
    line-height: 1.55;
  }

  .manager-rank-card {
    min-height: 142px;
    display: grid;
    align-content: center;
    gap: 6px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, .38);
    border-radius: 8px;
    background: rgba(255, 255, 255, .15);
    text-align: center;
  }

  .manager-rank-card span,
  .manager-rank-card small {
    color: rgba(255, 255, 255, .86);
    font-weight: 700;
  }

  .manager-rank-card strong {
    color: white;
    font-size: 48px;
    line-height: 1;
  }

  .manager-section {
    padding: 22px 0;
  }

  .manager-criteria {
    display: grid;
    grid-template-columns: 150px 1fr;
    gap: 22px;
    align-items: center;
    padding: 22px;
    border: 1px solid #f3b68e;
    border-left: 6px solid #ee4d2d;
    border-radius: 8px;
    background: rgba(255, 255, 255, .92);
    box-shadow: 0 12px 34px rgba(180, 61, 24, .08);
  }

  .manager-criteria-logo {
    display: grid;
    place-items: center;
    min-height: 118px;
    border-radius: 8px;
    background: #fff0e3;
  }

  .manager-criteria-logo img {
    width: 118px;
    height: auto;
    object-fit: contain;
    mix-blend-mode: multiply;
  }

  .manager-criteria h2 {
    margin: 0 0 10px;
    color: #2d241f;
    font-size: 22px;
    line-height: 1.2;
  }

  .manager-criteria p {
    margin: 0;
    color: #4e3f37;
    line-height: 1.6;
  }

  .manager-criteria p + p {
    margin-top: 10px;
  }

  .manager-kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .manager-kpi,
  .manager-card,
  .manager-conclusion {
    border: 1px solid #f3b68e;
    border-radius: 8px;
    background: rgba(255, 255, 255, .92);
    box-shadow: 0 12px 34px rgba(180, 61, 24, .08);
  }

  .manager-kpi {
    padding: 18px;
  }

  .manager-kpi-label {
    margin-bottom: 8px;
    color: #765f53;
    font-size: 13px;
    font-weight: 700;
  }

  .manager-kpi-value {
    color: #2d241f;
    font-size: 26px;
    font-weight: 900;
    line-height: 1.1;
  }

  .manager-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }

  .manager-card {
    padding: 22px;
  }

  .manager-card h2,
  .manager-conclusion h2 {
    margin: 0 0 12px;
    color: #2d241f;
    font-size: 22px;
    line-height: 1.2;
  }

  .manager-card p,
  .manager-conclusion p {
    margin: 0;
    color: #4e3f37;
    line-height: 1.6;
  }

  .manager-list {
    margin: 0;
    padding-left: 20px;
    color: #4e3f37;
    line-height: 1.6;
  }

  .manager-list li + li {
    margin-top: 10px;
  }

  .manager-table-wrap {
    overflow-x: auto;
    border: 1px solid #f3b68e;
    border-radius: 8px;
    background: rgba(255, 255, 255, .94);
  }

  .manager-table-wrap table {
    width: 100%;
    min-width: 760px;
    border-collapse: collapse;
  }

  .manager-table-wrap th,
  .manager-table-wrap td {
    padding: 13px 14px;
    border-bottom: 1px solid #f5d3bd;
    text-align: left;
    font-size: 14px;
  }

  .manager-table-wrap th {
    background: #fff0e3;
    color: #5f4538;
    font-weight: 900;
  }

  .manager-monthly-matrix th,
  .manager-monthly-matrix td {
    text-align: center;
    white-space: nowrap;
  }

  .manager-monthly-matrix th:first-child {
    text-align: left;
    width: 150px;
  }

  .manager-legend {
    margin: 12px 14px 14px;
    color: #765f53;
    font-size: 13px;
  }

  .manager-monthly-note {
    display: grid;
    gap: 8px;
    margin-top: 14px;
  }

  .manager-monthly-note p {
    margin: 0;
  }

  .manager-conclusion {
    padding: 22px;
    border-left: 6px solid #ee4d2d;
  }

  .manager-footer {
    padding: 32px 16px;
    text-align: center;
    color: #765f53;
  }

  .good { color: #15803d !important; font-weight: 900; }
  .warn { color: #a16207 !important; font-weight: 900; }
  .bad { color: #b91c1c !important; font-weight: 900; }

  @media (max-width: 820px) {
    .manager-topbar-inner {
      align-items: flex-start;
      flex-direction: column;
      padding: 14px 0;
    }

    .manager-hero-grid,
    .manager-grid,
    .manager-kpis,
    .manager-criteria {
      grid-template-columns: 1fr;
    }

    .manager-hero h1 {
      font-size: 32px;
    }

    .manager-brand img:first-child,
    .manager-brand img:last-child {
      height: 46px;
    }

    .manager-criteria-logo {
      min-height: 92px;
      justify-items: start;
      background: transparent;
    }

    .manager-criteria-logo img {
      width: 96px;
    }
  }

  @media print {
    @page {
      size: A4 landscape;
      margin: 7mm;
    }

    .manager-topbar,
    .actions,
    .manager-footer {
      display: none !important;
    }

    html,
    body {
      width: 100%;
      background: white !important;
    }

    .manager-page {
      background: white !important;
      color: #1f1f1f;
      font-size: 11px;
    }

    .manager-container {
      width: 100%;
      max-width: none;
    }

    .manager-hero {
      padding: 12px 0;
      background: linear-gradient(135deg, #e7351d 0%, #ee4d2d 52%, #ff8a00 100%) !important;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .manager-hero-grid {
      grid-template-columns: 1fr 150px;
      gap: 12px;
    }

    .manager-eyebrow {
      margin-bottom: 4px;
      font-size: 9px;
    }

    .manager-hero h1 {
      font-size: 24px;
    }

    .manager-hero p {
      max-width: 680px;
      margin-top: 6px;
      font-size: 10px;
      line-height: 1.35;
    }

    .manager-rank-card {
      min-height: 82px;
      padding: 10px;
    }

    .manager-rank-card strong {
      font-size: 30px;
    }

    .manager-section {
      padding: 6px 0;
    }

    .manager-criteria {
      grid-template-columns: 86px 1fr;
      gap: 10px;
      padding: 10px;
      box-shadow: none;
      page-break-inside: avoid;
    }

    .manager-criteria-logo {
      min-height: 68px;
    }

    .manager-criteria-logo img {
      width: 70px;
    }

    .manager-criteria h2,
    .manager-card h2,
    .manager-conclusion h2 {
      margin-bottom: 6px;
      font-size: 14px;
    }

    .manager-criteria p,
    .manager-card p,
    .manager-conclusion p,
    .manager-list {
      font-size: 10px;
      line-height: 1.32;
    }

    .manager-criteria p + p {
      margin-top: 4px;
    }

    .manager-kpis {
      grid-template-columns: repeat(6, 1fr);
      gap: 6px;
    }

    .manager-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .manager-kpi {
      padding: 8px;
    }

    .manager-kpi-label {
      margin-bottom: 4px;
      font-size: 9px;
    }

    .manager-kpi-value {
      font-size: 15px;
    }

    .manager-card {
      padding: 10px;
      page-break-inside: avoid;
    }

    .manager-list li + li {
      margin-top: 3px;
    }

    .manager-table-wrap table {
      min-width: 0;
    }

    .manager-table-wrap th,
    .manager-table-wrap td {
      padding: 5px 6px;
      font-size: 9px;
    }

    .manager-monthly-matrix th:first-child {
      width: 88px;
    }

    .manager-legend {
      margin: 5px 6px 6px;
      font-size: 9px;
    }

    .manager-monthly-note {
      gap: 2px;
      margin-top: 6px;
      font-size: 10px;
    }

    .manager-conclusion {
      padding: 10px;
      box-shadow: none;
      page-break-inside: avoid;
    }

    .manager-card,
    .manager-kpi,
    .manager-conclusion {
      box-shadow: none;
    }
  }
`;
