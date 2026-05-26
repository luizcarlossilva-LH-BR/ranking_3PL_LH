import { redirect } from "next/navigation";
import { getHibridoBySlug, makeSlug } from "@/lib/sheets";
import { getHibridoSessionFromCookies } from "@/lib/session";

export default async function HibridoPage(
  props: { params: Promise<{ slug: string }> }
) {
  const { slug } = await props.params;
  const session = await getHibridoSessionFromCookies();

  if (!session) {
    redirect("/hibrido");
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
            Seu CPF esta vinculado a operacao {session.transportador}.
            Por seguranca, voce nao pode acessar o relatorio de outra operacao Hibrida.
          </p>
          <form action={`/hibrido/${session.slug}`}>
            <button className="button">Abrir minha operacao</button>
          </form>
        </section>
      </main>
    );
  }

  const hibrido = await getHibridoBySlug(slug);

  if (!hibrido) {
    return (
      <main className="hibrido-shell">
        <style>{HIBRIDO_STYLES}</style>
        <section className="hibrido-not-found">
          <span className="hibrido-not-found-logo">
            <img src="/campeao-sobre-rodas-logo.png" alt="Campeao Sobre Rodas" />
          </span>
          <h1>Hibrido nao encontrado</h1>
          <p>Nao localizamos esta operacao na aba Hibrido da planilha.</p>
        </section>
      </main>
    );
  }

  const message = getHibridoMessage(hibrido.ranking);

  return (
    <main className="hibrido-shell">
      <style>{HIBRIDO_STYLES}</style>

      <section className="hibrido-hero">
        <div className="hibrido-container hibrido-hero-grid">
          <div>
            <img className="hibrido-logo" src="/campeao-sobre-rodas-logo.png" alt="Campeao Sobre Rodas" />
            <p className="hibrido-eyebrow">Performance 2025</p>
            <h1>{hibrido.hibrido}</h1>
            <p className="hibrido-subtitle">
              Reconhecimento da operacao hibrida no Campeao Sobre Rodas 2025.
            </p>
          </div>

          <div className="hibrido-rank">
            <span>Classificacao</span>
            <strong>{normalizeRankingLabel(hibrido.ranking)}</strong>
            {hibrido.resultado && <small>Resultado {hibrido.resultado}</small>}
          </div>
        </div>
      </section>

      <section className="hibrido-container hibrido-message">
        <div className="hibrido-message-badge">{message.badge}</div>
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

function normalizeRankingLabel(value: string) {
  const normalized = normalizeRanking(value);

  if (normalized === "top1" || normalized === "1" || normalized === "1lugar") return "1o Lugar";
  if (normalized === "top2" || normalized === "2" || normalized === "2lugar") return "2o Lugar";
  if (normalized === "top3" || normalized === "3" || normalized === "3lugar") return "3o Lugar";
  if (normalized === "top4" || normalized === "4" || normalized === "4lugar") return "4o Lugar";

  return value || "Nao informado";
}

function normalizeRanking(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getHibridoMessage(ranking: string) {
  const normalized = normalizeRanking(ranking);

  if (normalized === "top1" || normalized === "1" || normalized === "1lugar") {
    return {
      badge: "1",
      title: "1o Lugar - Campeao Sobre Rodas 2025",
      paragraphs: [
        "Parabens por essa grande conquista no Campeao Sobre Rodas 2025!",
        "Alcancar o 1o lugar foi resultado de muito empenho, dedicacao e trabalho em equipe ao longo de todo o ano. Cada desafio enfrentado e cada entrega realizada com excelencia fizeram parte dessa vitoria tao especial.",
        "Que esse reconhecimento seja motivo de orgulho para todos e tambem um incentivo para continuarem buscando resultados cada vez melhores.",
        "Voces mostraram a forca do time e fizeram historia nesta edicao!"
      ]
    };
  }

  if (normalized === "top2" || normalized === "2" || normalized === "2lugar") {
    return {
      badge: "2",
      title: "2o Lugar - Campeao Sobre Rodas 2025",
      paragraphs: [
        "Parabens pela conquista do 2o lugar no Campeao Sobre Rodas 2025!",
        "Esse resultado refletiu todo o empenho, comprometimento e dedicacao demonstrados pela equipe ao longo do ano.",
        "Estar entre os melhores foi motivo de muito orgulho e mostrou a forca e a excelencia do trabalho realizado por todos.",
        "Que este reconhecimento seja mais um incentivo para continuarem evoluindo, conquistando novos resultados e seguindo cada vez mais fortes rumo ao topo!"
      ]
    };
  }

  if (normalized === "top3" || normalized === "3" || normalized === "3lugar") {
    return {
      badge: "3",
      title: "3o Lugar - Campeao Sobre Rodas 2025",
      paragraphs: [
        "Parabens pela conquista do 3o lugar no Campeao Sobre Rodas 2025!",
        "Esse resultado refletiu todo o empenho, comprometimento e dedicacao demonstrados pela equipe ao longo do ano.",
        "Estar entre os melhores foi motivo de muito orgulho e mostrou a forca e a excelencia do trabalho realizado por todos.",
        "Que este reconhecimento seja mais um incentivo para continuarem evoluindo, conquistando novos resultados e seguindo cada vez mais fortes rumo ao topo!"
      ]
    };
  }

  if (normalized === "top4" || normalized === "4" || normalized === "4lugar") {
    return {
      badge: "4",
      title: "4o Lugar - Campeao Sobre Rodas 2025",
      paragraphs: [
        "Parabens pelos resultados conquistados ao longo de 2025!",
        "Sabemos que ainda existem oportunidades de crescimento, e temos certeza de que, com dedicacao e melhoria continua, grandes conquistas podem estar mais proximas no proximo ciclo.",
        "Que esta experiencia sirva como motivacao para continuarem crescendo, superando desafios e alcancando resultados ainda mais expressivos!"
      ]
    };
  }

  return {
    badge: "H",
    title: "Reconhecimento Campeao Sobre Rodas 2025",
    paragraphs: [
      "Parabens pelos resultados conquistados ao longo de 2025!",
      "A participacao no Campeao Sobre Rodas demonstrou empenho, parceria e evolucao operacional ao longo do ciclo.",
      "Que este reconhecimento seja um incentivo para a equipe continuar buscando melhoria continua e resultados ainda mais consistentes."
    ]
  };
}

const HIBRIDO_STYLES = `
  .hibrido-shell {
    min-height: 100vh;
    background:
      linear-gradient(135deg, rgba(238, 77, 45, .08), transparent 30%),
      linear-gradient(315deg, rgba(255, 122, 0, .14), transparent 28%),
      #fff7f0;
    color: #2d241f;
  }

  .hibrido-container {
    width: min(1040px, calc(100% - 32px));
    margin: 0 auto;
  }

  .hibrido-hero {
    padding: 40px 0;
    color: white;
    background: linear-gradient(135deg, #e7351d 0%, #ee4d2d 52%, #ff8a00 100%);
  }

  .hibrido-hero-grid {
    display: grid;
    grid-template-columns: 1fr 240px;
    gap: 28px;
    align-items: center;
  }

  .hibrido-logo {
    width: 210px;
    height: auto;
    margin-bottom: 16px;
    display: block;
    filter: drop-shadow(0 10px 18px rgba(116, 28, 18, .22));
  }

  .hibrido-eyebrow {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
    opacity: .86;
  }

  .hibrido-hero h1 {
    margin: 0;
    font-size: 42px;
    line-height: 1.05;
    letter-spacing: 0;
  }

  .hibrido-subtitle {
    max-width: 720px;
    margin: 12px 0 0;
    color: rgba(255, 255, 255, .9);
    line-height: 1.5;
  }

  .hibrido-rank {
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

  .hibrido-rank span,
  .hibrido-rank small {
    color: rgba(255, 255, 255, .86);
    font-weight: 800;
  }

  .hibrido-rank strong {
    color: white;
    font-size: 34px;
    line-height: 1.1;
  }

  .hibrido-message,
  .hibrido-not-found {
    border: 1px solid #f3b68e;
    border-radius: 8px;
    background: rgba(255, 255, 255, .94);
    box-shadow: 0 12px 34px rgba(180, 61, 24, .08);
  }

  .hibrido-message {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: 22px;
    align-items: start;
    padding: 28px;
    margin-top: 24px;
  }

  .hibrido-message-badge {
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

  .hibrido-message h2 {
    margin: 0 0 12px;
    font-size: 28px;
  }

  .hibrido-message p {
    margin: 0;
    color: #4e3f37;
    line-height: 1.65;
  }

  .hibrido-message p + p {
    margin-top: 10px;
  }

  .hibrido-not-found {
    width: min(520px, calc(100% - 32px));
    margin: 80px auto;
    padding: 32px;
    text-align: center;
  }

  .hibrido-not-found-logo {
    width: 190px;
    height: 104px;
    display: grid;
    place-items: center;
    margin: 0 auto 12px;
    padding: 12px;
    border-radius: 8px;
    background: linear-gradient(135deg, #e7351d 0%, #ee4d2d 52%, #ff8a00 100%);
  }

  .hibrido-not-found-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  @media (max-width: 820px) {
    .hibrido-hero-grid,
    .hibrido-message {
      grid-template-columns: 1fr;
    }

    .hibrido-hero h1 {
      font-size: 32px;
    }

    .hibrido-message {
      padding: 22px;
    }
  }
`;
