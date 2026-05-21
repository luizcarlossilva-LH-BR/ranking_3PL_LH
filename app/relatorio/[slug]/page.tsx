import { redirect } from "next/navigation";
import { getMonthlyBySlug, getNetworkAverage, getRankingBySlug } from "@/lib/sheets";
import { getSessionFromCookies } from "@/lib/session";
import { formatNumber, formatPct, getStatusClass, parseNumber } from "@/lib/format";
import PrintButton from "./print-button";
import LogoutButton from "./logout-button";

const TARGET_ETA_DESTINO = 95;
const TARGET_NO_SHOW = 98.5;

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
          <div className="brand"><span className="logo-dot" /><span>Shopee · Ranking 3PL</span></div>
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
          <div className="brand"><span className="logo-dot" /><span>Shopee · Ranking 3PL</span></div>
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
  const diferencaRank = rank - rankPond;

  const diagnosticoVolume = buildVolumeText(rank, rankPond, pesoTrips);
  const diagnosticoIndicadores = buildIndicatorText(etaDestino, noShow);
  const recomendacoes = buildRecommendations(etaDestino, noShow, pontuacao, mensal);

  return (
    <>
      <header className="topbar">
        <div className="container topbar-inner">
          <div className="brand">
            <span className="logo-dot" />
            <span>Shopee · Ranking 3PL</span>
          </div>

          <div className="actions">
            <PrintButton />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main>
        <section className="report-hero">
          <div className="container hero-grid">
            <div>
              <p style={{ margin: "0 0 8px", opacity: .88 }}>Relatório individual da transportadora</p>
              <h1>{ranking.transportador}</h1>
              <p style={{ maxWidth: 780, opacity: .92 }}>
                Este relatório apresenta a composição da posição no ranking, considerando performance geral,
                ETA Destino, No Show e o impacto do volume de trips no Rank Ponderado.
              </p>
            </div>

            <div className="rank-badge">
              <div>Rank Ponderado</div>
              <div className="rank-number">#{formatNumber(rankPond, 0)}</div>
              <div style={{ opacity: .88 }}>Rank simples: #{formatNumber(rank, 0)}</div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container kpi-grid">
            <Kpi label="Pontuação" value={formatNumber(pontuacao, 2)} />
            <Kpi label="Média da Rede" value={formatNumber(mediaRede, 2)} />
            <Kpi label="ETA Destino" value={formatPct(etaDestino)} status={etaDestino >= TARGET_ETA_DESTINO ? "good" : "bad"} />
            <Kpi label="No Show" value={formatPct(noShow)} status={noShow >= TARGET_NO_SHOW ? "good" : "bad"} />
            <Kpi label="Trips" value={formatNumber(trips, 0)} />
            <Kpi label="Meses ativos" value={formatNumber(mesesAtivos, 0)} />
            <Kpi label="Peso Trips" value={formatNumber(pesoTrips, 2)} />
            <Kpi label="Diferença Rank" value={diferencaRank === 0 ? "0" : `${diferencaRank > 0 ? "+" : ""}${formatNumber(diferencaRank, 0)}`} />
          </div>
        </section>

        <section className="section">
          <div className="container grid-2">
            <div className="card">
              <h2>Composição da pontuação</h2>
              <p>
                A pontuação final considera três componentes: <strong>Pontos / Performance Geral</strong>,
                com peso de <strong>60%</strong>; <strong>ETA Destino</strong>, com peso de <strong>20%</strong>
                e target de <strong>95%</strong>; e <strong>No Show</strong>, com peso de <strong>20%</strong>
                e target de <strong>98,5%</strong>.
              </p>

              <div className="callout">
                Mesmo com boa pontuação geral, a transportadora pode perder posição se ETA Destino ou No Show
                ficarem abaixo dos targets definidos.
              </div>
            </div>

            <div className="card">
              <h2>Impacto do volume de trips</h2>
              <p>{diagnosticoVolume}</p>
              <div className="callout">
                O Rank simples observa a qualidade média. O Rank Ponderado considera também a representatividade
                operacional pelo volume de trips.
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container grid-2">
            <div className="card">
              <h2>Diagnóstico executivo</h2>
              <p>{diagnosticoIndicadores}</p>
            </div>

            <div className="card">
              <h2>Recomendações consultivas</h2>
              <ul>
                {recomendacoes.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container card">
            <h2>Evolução mensal</h2>
            <p className="muted">
              A tabela abaixo mostra a evolução dos principais indicadores usados para explicar a posição da transportadora.
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
                  {mensal.map((item) => (
                    <tr key={`${item.mes}-${item.transportador}`}>
                      <td>{item.mes}</td>
                      <td className={getStatusClass(parseNumber(item.pontos), 70, 85)}>{formatNumber(parseNumber(item.pontos), 2)}</td>
                      <td className={parseNumber(item.etaDestino) >= TARGET_ETA_DESTINO ? "good" : "bad"}>{formatPct(parseNumber(item.etaDestino))}</td>
                      <td className={parseNumber(item.noShow) >= TARGET_NO_SHOW ? "good" : "bad"}>{formatPct(parseNumber(item.noShow))}</td>
                      <td>{formatNumber(parseNumber(item.trips), 0)}</td>
                    </tr>
                  ))}

                  {mensal.length === 0 && (
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

function buildVolumeText(rank: number, rankPond: number, pesoTrips: number) {
  if (!rank || !rankPond) {
    return "Não foi possível calcular a diferença entre Rank simples e Rank Ponderado, pois um dos campos está sem informação.";
  }

  if (rankPond < rank) {
    return `A transportadora ganhou relevância no Rank Ponderado: saiu da posição #${rank} no Rank simples para #${rankPond} no Rank Ponderado. Isso indica que o volume de trips contribuiu positivamente para a posição final. Peso Trips considerado: ${formatNumber(pesoTrips, 2)}.`;
  }

  if (rankPond > rank) {
    return `A transportadora perdeu posições no Rank Ponderado: saiu da posição #${rank} no Rank simples para #${rankPond} no Rank Ponderado. Isso indica que, apesar da qualidade média, o volume de trips reduziu a representatividade na composição final. Peso Trips considerado: ${formatNumber(pesoTrips, 2)}.`;
  }

  return `A transportadora manteve a mesma posição no Rank simples e no Rank Ponderado. Isso indica equilíbrio entre performance média e representatividade operacional pelo volume de trips. Peso Trips considerado: ${formatNumber(pesoTrips, 2)}.`;
}

function buildIndicatorText(etaDestino: number, noShow: number) {
  const etaOk = etaDestino >= TARGET_ETA_DESTINO;
  const noShowOk = noShow >= TARGET_NO_SHOW;

  if (etaOk && noShowOk) {
    return "A transportadora apresentou aderência positiva frente aos targets de ETA Destino e No Show, contribuindo para sustentação da pontuação final e da posição no ranking.";
  }

  if (!etaOk && !noShowOk) {
    return "A transportadora ficou abaixo dos targets de ETA Destino e No Show. Como cada indicador possui peso de 20%, a recuperação desses dois componentes pode gerar ganho direto na pontuação final.";
  }

  if (!etaOk) {
    return "O principal ponto de atenção está no ETA Destino, que ficou abaixo do target de 95%. Como esse indicador representa 20% da pontuação final, sua recuperação tende a melhorar a posição no ranking.";
  }

  return "O principal ponto de atenção está no No Show, que ficou abaixo do target de 98,5%. Como esse indicador representa 20% da pontuação final, sua recuperação tende a melhorar a posição no ranking.";
}

function buildRecommendations(
  etaDestino: number,
  noShow: number,
  pontuacao: number,
  mensal: Array<{ pontos: string }>
) {
  const items: string[] = [];

  if (etaDestino < TARGET_ETA_DESTINO) {
    items.push("Reforçar plano de ação para ETA Destino, com foco em rotas recorrentes de atraso, disciplina de parada e aderência ao horário previsto de chegada.");
  }

  if (noShow < TARGET_NO_SHOW) {
    items.push("Atuar na prevenção de No Show, reforçando confirmação antecipada de veículo, motorista e disponibilidade operacional junto à programação.");
  }

  if (pontuacao < 70) {
    items.push("Priorizar recuperação da performance geral, pois esse componente tem o maior peso no cálculo da pontuação final: 60%.");
  } else {
    items.push("Manter estabilidade da performance geral, pois esse componente representa 60% da pontuação final.");
  }

  if (mensal.length >= 2) {
    const first = parseNumber(mensal[0].pontos);
    const last = parseNumber(mensal[mensal.length - 1].pontos);

    if (last < first) {
      items.push("Acompanhar a tendência mensal, pois há sinal de queda entre o início e o fim do período analisado.");
    } else {
      items.push("Preservar a evolução mensal e transformar boas práticas em rotina operacional.");
    }
  }

  return items;
}
