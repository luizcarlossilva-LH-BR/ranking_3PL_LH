import { redirect } from "next/navigation";
import { getXptBySlug, makeSlug } from "@/lib/sheets";
import { formatNumber, parseNumber } from "@/lib/format";
import { getXptSessionFromCookies } from "@/lib/session";

export default async function XptPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const session = await getXptSessionFromCookies();

  if (!session) {
    redirect("/xpt");
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
            Seu CPF esta vinculado a unidade {session.transportador}.
            Por seguranca, voce nao pode acessar o relatorio de outra unidade XPT.
          </p>
          <form action={`/xpt/${session.slug}`}>
            <button className="button">Abrir minha unidade</button>
          </form>
        </section>
      </main>
    );
  }

  const xpt = await getXptBySlug(slug);

  if (!xpt) {
    return (
      <main className="xpt-shell">
        <style>{XPT_STYLES}</style>
        <section className="xpt-not-found">
          <img src="/bsc-linehaul.png" alt="BSC Line Haul" />
          <h1>XPT não encontrado</h1>
          <p>Não localizamos esta unidade na aba XPT da planilha.</p>
        </section>
      </main>
    );
  }

  const message = getRankingMessage(xpt.ranking);

  return (
    <main className="xpt-shell">
      <style>{XPT_STYLES}</style>

      <section className="xpt-hero">
        <div className="xpt-container xpt-hero-grid">
          <div>
            <img className="xpt-logo" src="/bsc-linehaul.png" alt="BSC Line Haul" />
            <p className="xpt-eyebrow">Campeão Sobre Rodas 2025</p>
            <h1>{xpt.xpt}</h1>
            <p className="xpt-subtitle">
              Relatório de performance XPT com os indicadores de Leakage, Loss, BWT e Resultado.
            </p>
          </div>

          <div className="xpt-rank">
            <span>Classificação</span>
            <strong>{normalizeRankingLabel(xpt.ranking)}</strong>
          </div>
        </div>
      </section>

      <section className="xpt-container xpt-kpis">
        <Kpi label="Leakage" value={formatRawValue(xpt.leakage)} />
        <Kpi label="Loss" value={formatRawValue(xpt.loss)} />
        <Kpi label="BWT" value={formatNumber(parseNumber(xpt.bwt), 1)} />
        <Kpi label="Resultado" value={formatRawValue(xpt.resultado)} />
      </section>

      <section className="xpt-container xpt-message">
        <div className="xpt-message-badge">{message.badge}</div>
        <div>
          <h2>{message.title}</h2>
          {message.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="xpt-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function normalizeRankingLabel(value: string) {
  const normalized = normalizeRanking(value);

  if (normalized === "top1") return "Top 1";
  if (normalized === "top2") return "Top 2";
  if (normalized === "top3") return "Top 3";
  if (normalized === "certificado") return "Certificado";
  if (normalized === "convidado") return "Convidado";

  return value || "Não informado";
}

function normalizeRanking(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function formatRawValue(value: string) {
  return value || "N/I";
}

function getRankingMessage(ranking: string) {
  const normalized = normalizeRanking(ranking);

  if (normalized === "top1") {
    return {
      badge: "1",
      title: "1º Lugar — Campeão Sobre Rodas 2025",
      paragraphs: [
        "Parabéns pela conquista do 1º lugar no Campeão Sobre Rodas 2025!",
        "Este resultado representou excelência operacional, comprometimento e dedicação ao longo de toda a jornada. Que essa conquista seja motivo de orgulho para toda a equipe e inspiração para continuarem elevando o nível da operação.",
        "Vocês fizeram história nesta edição!"
      ]
    };
  }

  if (normalized === "top2") {
    return {
      badge: "2",
      title: "2º Lugar — Campeão Sobre Rodas 2025",
      paragraphs: [
        "Parabéns pela conquista do 2º lugar no Campeão Sobre Rodas 2025!",
        "O desempenho e a dedicação demonstrados ao longo do período foram fundamentais para alcançar este grande resultado. Estar entre os melhores já foi motivo de muito orgulho.",
        "Que este reconhecimento motive a equipe a continuar evoluindo ainda mais rumo ao topo!"
      ]
    };
  }

  if (normalized === "top3") {
    return {
      badge: "3",
      title: "3º Lugar — Campeão Sobre Rodas 2025",
      paragraphs: [
        "Parabéns pela conquista do 3º lugar no Campeão Sobre Rodas 2025!",
        "Este reconhecimento refletiu todo o esforço, comprometimento e evolução da operação ao longo do ano. Cada resultado alcançado foi fruto do trabalho e dedicação da equipe.",
        "Continuem nessa trajetória de crescimento. O próximo troféu pode estar ainda mais perto!"
      ]
    };
  }

  if (normalized === "certificado") {
    return {
      badge: "C",
      title: "Certificado de Reconhecimento",
      paragraphs: [
        "Parabéns pelo desempenho e dedicação demonstrados ao longo desta jornada!",
        "Os resultados alcançados refletiram o comprometimento da equipe e a busca constante pela evolução operacional. Este certificado representou o reconhecimento pelo esforço e pela parceria ao longo do ano.",
        "Continuem buscando excelência e superando desafios. Quem sabe no próximo ano o troféu venha para vocês!"
      ]
    };
  }

  return {
    badge: "★",
    title: "Mensagem para Convidados",
    paragraphs: [
      "Parabéns pelos resultados alcançados ao longo desta jornada!",
      "A participação no Campeão Sobre Rodas 2025 já demonstrou o empenho e a evolução da operação. Sabemos que ainda existem oportunidades de crescimento, e temos certeza de que, com dedicação e melhoria contínua, grandes conquistas podem estar mais próximas no próximo ciclo.",
      "Que este evento seja também um incentivo para alcançarem resultados ainda maiores!"
    ]
  };
}

const XPT_STYLES = `
  .xpt-shell {
    min-height: 100vh;
    background:
      linear-gradient(135deg, rgba(238, 77, 45, .08), transparent 30%),
      linear-gradient(315deg, rgba(255, 122, 0, .14), transparent 28%),
      #fff7f0;
    color: #2d241f;
  }

  .xpt-container {
    width: min(1040px, calc(100% - 32px));
    margin: 0 auto;
  }

  .xpt-hero {
    padding: 40px 0;
    color: white;
    background: linear-gradient(135deg, #e7351d 0%, #ee4d2d 52%, #ff8a00 100%);
  }

  .xpt-hero-grid {
    display: grid;
    grid-template-columns: 1fr 240px;
    gap: 28px;
    align-items: center;
  }

  .xpt-logo {
    width: 138px;
    height: auto;
    margin-bottom: 14px;
  }

  .xpt-eyebrow {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
    opacity: .86;
  }

  .xpt-hero h1 {
    margin: 0;
    font-size: 42px;
    line-height: 1.05;
    letter-spacing: 0;
  }

  .xpt-subtitle {
    max-width: 720px;
    margin: 12px 0 0;
    color: rgba(255, 255, 255, .9);
    line-height: 1.5;
  }

  .xpt-rank {
    min-height: 148px;
    display: grid;
    align-content: center;
    gap: 8px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, .38);
    border-radius: 8px;
    background: rgba(255, 255, 255, .16);
    text-align: center;
  }

  .xpt-rank span {
    color: rgba(255, 255, 255, .86);
    font-weight: 800;
  }

  .xpt-rank strong {
    color: white;
    font-size: 34px;
    line-height: 1.1;
  }

  .xpt-kpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    padding: 24px 0;
  }

  .xpt-kpi,
  .xpt-message,
  .xpt-not-found {
    border: 1px solid #f3b68e;
    border-radius: 8px;
    background: rgba(255, 255, 255, .94);
    box-shadow: 0 12px 34px rgba(180, 61, 24, .08);
  }

  .xpt-kpi {
    padding: 18px;
  }

  .xpt-kpi span {
    display: block;
    margin-bottom: 8px;
    color: #765f53;
    font-size: 13px;
    font-weight: 800;
  }

  .xpt-kpi strong {
    color: #2d241f;
    font-size: 26px;
  }

  .xpt-message {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 22px;
    align-items: start;
    padding: 28px;
  }

  .xpt-message-badge {
    width: 76px;
    height: 76px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: white;
    background: linear-gradient(135deg, #e7351d, #ff8a00);
    font-size: 32px;
    font-weight: 900;
  }

  .xpt-message h2 {
    margin: 0 0 12px;
    font-size: 28px;
  }

  .xpt-message p {
    margin: 0;
    color: #4e3f37;
    line-height: 1.65;
  }

  .xpt-message p + p {
    margin-top: 10px;
  }

  .xpt-not-found {
    width: min(520px, calc(100% - 32px));
    margin: 80px auto;
    padding: 32px;
    text-align: center;
  }

  .xpt-not-found img {
    width: 140px;
    height: auto;
  }

  @media (max-width: 820px) {
    .xpt-hero-grid,
    .xpt-kpis,
    .xpt-message {
      grid-template-columns: 1fr;
    }

    .xpt-hero h1 {
      font-size: 32px;
    }

    .xpt-message {
      padding: 22px;
    }
  }
`;
