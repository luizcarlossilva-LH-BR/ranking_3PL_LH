import { getAllXpt } from "@/lib/sheets";

export default async function XptIndexPage() {
  const records = await getAllXpt();

  return (
    <main className="xpt-index-shell">
      <style>{XPT_INDEX_STYLES}</style>

      <section className="xpt-stage">
        <div className="xpt-shape xpt-shape-a" />
        <div className="xpt-shape xpt-shape-b" />
        <div className="xpt-shape xpt-shape-c" />

        <header className="xpt-index-topbar">
          <img className="xpt-index-logo" src="/bsc-linehaul.png" alt="BSC Line Haul" />
          <div className="xpt-index-brand">
            <span className="xpt-brand-wheel">CSR</span>
            <strong>Campeao<br />Sobre Rodas</strong>
          </div>
        </header>

        <div className="xpt-centerpiece">
          <img className="xpt-shopee-mark" src="/shopee-icon.png" alt="Shopee" />
          <div className="xpt-paper-title">
            <h1>Performance XPT</h1>
          </div>
          <p>Selecione a unidade para abrir o relatorio individual.</p>
        </div>

        <section className="xpt-index-list" aria-label="Unidades XPT">
          {records.map((record, index) => (
            <a
              className={`xpt-index-card tone-${index % 4}`}
              href={`/xpt/${record.slug}`}
              key={record.slug}
            >
              <span className="xpt-card-icon">{getRankingIcon(record.ranking)}</span>
              <span className="xpt-index-rank">{normalizeRankingLabel(record.ranking)}</span>
              <h2>{record.xpt}</h2>
              <span className="xpt-card-result">Resultado {record.resultado || "N/I"}</span>
            </a>
          ))}

          {!records.length && (
            <div className="xpt-index-empty">
              <h2>Nenhuma unidade XPT encontrada</h2>
              <p>Confira se a aba XPT existe na planilha e se possui dados preenchidos.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function normalizeRankingLabel(value: string) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  if (normalized === "top1") return "Top 1";
  if (normalized === "top2") return "Top 2";
  if (normalized === "top3") return "Top 3";
  if (normalized === "certificado") return "Certificado";
  if (normalized === "convidado") return "Convidado";

  return value || "Nao informado";
}

function getRankingIcon(value: string) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  if (normalized === "top1") return "1";
  if (normalized === "top2") return "2";
  if (normalized === "top3") return "3";
  if (normalized === "certificado") return "C";

  return "XPT";
}

const XPT_INDEX_STYLES = `
  .xpt-index-shell {
    min-height: 100vh;
    color: white;
    background: #f24b24;
    overflow-x: hidden;
  }

  .xpt-stage {
    position: relative;
    min-height: 100vh;
    padding: 28px clamp(16px, 4vw, 48px) 70px;
    background:
      radial-gradient(circle at 10% 76%, rgba(174, 47, 35, .34) 0 42px, transparent 43px),
      radial-gradient(circle at 80% 20%, rgba(184, 55, 35, .3) 0 160px, transparent 162px),
      radial-gradient(circle at 96% 45%, rgba(255, 138, 0, .26) 0 220px, transparent 222px),
      linear-gradient(135deg, #f04425 0%, #f65a22 55%, #ff7a17 100%);
  }

  .xpt-stage::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: .18;
    background-image: radial-gradient(rgba(255, 255, 255, .9) 1px, transparent 1px);
    background-size: 11px 11px;
  }

  .xpt-stage::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 42px;
    background:
      radial-gradient(circle, #ffe88d 0 12px, transparent 13px) 0 0 / 43px 22px repeat-x,
      radial-gradient(circle, #f24b24 0 7px, transparent 8px) 0 11px / 43px 22px repeat-x,
      #ffc43d;
  }

  .xpt-shape {
    position: absolute;
    pointer-events: none;
    opacity: .26;
  }

  .xpt-shape-a {
    top: -70px;
    left: -90px;
    width: 330px;
    height: 330px;
    border: 38px solid #ffc107;
    border-radius: 44%;
  }

  .xpt-shape-b {
    right: -120px;
    top: 92px;
    width: 280px;
    height: 160px;
    border-radius: 999px;
    background: rgba(194, 53, 35, .52);
    transform: rotate(42deg);
  }

  .xpt-shape-c {
    left: 18%;
    bottom: 80px;
    width: 290px;
    height: 78px;
    border-radius: 50%;
    background: rgba(194, 53, 35, .38);
    transform: rotate(-9deg);
  }

  .xpt-index-topbar {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: start;
    gap: 18px;
    width: min(1180px, 100%);
    margin: 0 auto 18px;
  }

  .xpt-index-logo {
    width: 118px;
    height: auto;
    filter: drop-shadow(0 10px 18px rgba(140, 42, 24, .24));
  }

  .xpt-index-brand {
    justify-self: end;
    display: flex;
    align-items: center;
    gap: 12px;
    color: white;
    text-align: left;
    text-transform: uppercase;
  }

  .xpt-index-brand strong {
    font-size: 22px;
    line-height: .96;
    letter-spacing: 0;
  }

  .xpt-brand-wheel {
    width: 54px;
    height: 54px;
    display: grid;
    place-items: center;
    border: 4px solid white;
    border-radius: 50%;
    font-weight: 900;
    box-shadow: inset 0 0 0 5px rgba(255, 255, 255, .24);
  }

  .xpt-centerpiece {
    position: relative;
    z-index: 2;
    width: min(660px, 100%);
    margin: 18px auto 30px;
    text-align: center;
  }

  .xpt-shopee-mark {
    width: 74px;
    height: 74px;
    object-fit: contain;
    margin-bottom: 16px;
    filter: drop-shadow(0 0 14px rgba(255, 255, 255, .72));
  }

  .xpt-paper-title {
    position: relative;
    padding: 18px 34px 20px;
    color: #090909;
    background: #fbfbfb;
    box-shadow: 0 8px 0 rgba(0, 0, 0, .05), 0 18px 32px rgba(131, 36, 23, .16);
    clip-path: polygon(2% 10%, 13% 3%, 28% 8%, 43% 2%, 58% 8%, 76% 3%, 97% 9%, 94% 88%, 78% 94%, 62% 89%, 47% 97%, 29% 90%, 12% 96%, 4% 87%);
  }

  .xpt-paper-title h1 {
    margin: 0;
    color: #050505;
    font-size: clamp(44px, 8vw, 92px);
    line-height: .98;
    letter-spacing: 0;
    font-weight: 950;
  }

  .xpt-centerpiece p {
    width: min(520px, 100%);
    margin: 16px auto 0;
    color: rgba(255, 255, 255, .92);
    font-size: 18px;
    font-weight: 800;
    line-height: 1.45;
    text-shadow: 0 2px 14px rgba(116, 28, 18, .25);
  }

  .xpt-index-list {
    position: relative;
    z-index: 2;
    width: min(1160px, 100%);
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    justify-items: center;
    gap: 24px;
  }

  .xpt-index-card,
  .xpt-index-empty {
    box-shadow: 0 18px 32px rgba(124, 34, 20, .18);
  }

  .xpt-index-card {
    position: relative;
    width: clamp(178px, 18vw, 236px);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 8px;
    padding: 28px 22px 22px;
    border-radius: 50%;
    color: white;
    text-decoration: none;
    text-align: center;
    transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
  }

  .tone-0 {
    background: #3f7fe0;
  }

  .tone-1 {
    background: #ffb000;
  }

  .tone-2 {
    background: #27aa9d;
  }

  .tone-3 {
    background: #326fd1;
  }

  .xpt-index-card:hover {
    transform: translateY(-5px) scale(1.02);
    filter: saturate(1.06);
    box-shadow: 0 24px 42px rgba(124, 34, 20, .24);
  }

  .xpt-card-icon {
    position: absolute;
    top: -16px;
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    border-radius: 18px;
    background: linear-gradient(135deg, #fff4b2, #ffcc31);
    color: #f15b23;
    font-size: 18px;
    font-weight: 950;
    box-shadow: 0 12px 18px rgba(104, 31, 19, .22);
  }

  .xpt-index-rank {
    margin-top: 14px;
    color: rgba(255, 255, 255, .88);
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .xpt-index-card h2 {
    margin: 0;
    max-width: 14ch;
    color: white;
    font-size: clamp(17px, 1.7vw, 24px);
    line-height: 1.12;
    letter-spacing: 0;
    overflow-wrap: anywhere;
  }

  .xpt-card-result {
    color: rgba(255, 255, 255, .86);
    font-size: 13px;
    font-weight: 800;
  }

  .xpt-index-empty {
    width: min(560px, 100%);
    padding: 28px;
    border-radius: 8px;
    background: rgba(255, 255, 255, .96);
    color: #2d241f;
    text-align: center;
  }

  .xpt-index-empty h2 {
    margin: 0 0 8px;
  }

  .xpt-index-empty p {
    margin: 0;
    color: #765f53;
  }

  @media (max-width: 760px) {
    .xpt-stage {
      padding: 18px 16px 64px;
    }

    .xpt-index-topbar {
      grid-template-columns: 1fr;
      justify-items: center;
      text-align: center;
    }

    .xpt-index-brand {
      justify-self: center;
    }

    .xpt-index-list {
      grid-template-columns: repeat(auto-fit, minmax(156px, 1fr));
      gap: 18px;
    }

    .xpt-index-card {
      width: min(178px, 100%);
      padding: 26px 18px 18px;
    }
  }
`;
