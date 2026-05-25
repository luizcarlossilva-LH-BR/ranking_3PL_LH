import { getAllXpt } from "@/lib/sheets";

export default async function XptIndexPage() {
  const records = await getAllXpt();

  return (
    <main className="xpt-index-shell">
      <style>{XPT_INDEX_STYLES}</style>

      <section className="xpt-index-hero">
        <div className="xpt-index-container xpt-index-hero-grid">
          <div>
            <img className="xpt-index-logo" src="/bsc-linehaul.png" alt="BSC Line Haul" />
            <p className="xpt-index-eyebrow">Campeao Sobre Rodas 2025</p>
            <h1>Performance XPT</h1>
            <p>
              Selecione a unidade para abrir o relatorio individual. Para QR Code, utilize o link direto
              de cada XPT.
            </p>
          </div>

          <div className="xpt-index-count">
            <span>Unidades XPT</span>
            <strong>{records.length}</strong>
          </div>
        </div>
      </section>

      <section className="xpt-index-container xpt-index-list">
        {records.map((record) => (
          <a className="xpt-index-card" href={`/xpt/${record.slug}`} key={record.slug}>
            <span className="xpt-index-rank">{normalizeRankingLabel(record.ranking)}</span>
            <h2>{record.xpt}</h2>
            <dl>
              <div>
                <dt>Resultado</dt>
                <dd>{record.resultado || "N/I"}</dd>
              </div>
              <div>
                <dt>BWT</dt>
                <dd>{record.bwt || "N/I"}</dd>
              </div>
            </dl>
          </a>
        ))}

        {!records.length && (
          <div className="xpt-index-empty">
            <h2>Nenhuma unidade XPT encontrada</h2>
            <p>Confira se a aba XPT existe na planilha e se possui dados preenchidos.</p>
          </div>
        )}
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

const XPT_INDEX_STYLES = `
  .xpt-index-shell {
    min-height: 100vh;
    background:
      linear-gradient(135deg, rgba(238, 77, 45, .08), transparent 30%),
      linear-gradient(315deg, rgba(255, 122, 0, .14), transparent 28%),
      #fff7f0;
    color: #2d241f;
  }

  .xpt-index-container {
    width: min(1120px, calc(100% - 32px));
    margin: 0 auto;
  }

  .xpt-index-hero {
    padding: 34px 0;
    color: white;
    background: linear-gradient(135deg, #e7351d 0%, #ee4d2d 52%, #ff8a00 100%);
  }

  .xpt-index-hero-grid {
    display: grid;
    grid-template-columns: 1fr 180px;
    gap: 24px;
    align-items: center;
  }

  .xpt-index-logo {
    width: 124px;
    height: auto;
    margin-bottom: 12px;
  }

  .xpt-index-eyebrow {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
    opacity: .86;
  }

  .xpt-index-hero h1 {
    margin: 0;
    font-size: 40px;
    line-height: 1.05;
    letter-spacing: 0;
  }

  .xpt-index-hero p {
    max-width: 700px;
    margin: 12px 0 0;
    color: rgba(255, 255, 255, .9);
    line-height: 1.5;
  }

  .xpt-index-count {
    min-height: 132px;
    display: grid;
    align-content: center;
    gap: 8px;
    padding: 18px;
    border: 1px solid rgba(255, 255, 255, .38);
    border-radius: 8px;
    background: rgba(255, 255, 255, .16);
    text-align: center;
  }

  .xpt-index-count span {
    color: rgba(255, 255, 255, .86);
    font-weight: 800;
  }

  .xpt-index-count strong {
    color: white;
    font-size: 42px;
    line-height: 1;
  }

  .xpt-index-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    padding: 24px 0 36px;
  }

  .xpt-index-card,
  .xpt-index-empty {
    border: 1px solid #f3b68e;
    border-radius: 8px;
    background: rgba(255, 255, 255, .94);
    box-shadow: 0 12px 34px rgba(180, 61, 24, .08);
  }

  .xpt-index-card {
    min-height: 178px;
    display: grid;
    gap: 14px;
    padding: 18px;
    color: inherit;
    text-decoration: none;
    transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
  }

  .xpt-index-card:hover {
    transform: translateY(-2px);
    border-color: #ee4d2d;
    box-shadow: 0 16px 42px rgba(180, 61, 24, .14);
  }

  .xpt-index-rank {
    width: max-content;
    max-width: 100%;
    padding: 6px 10px;
    border-radius: 999px;
    background: #fff0e5;
    color: #c73922;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .xpt-index-card h2 {
    margin: 0;
    font-size: 20px;
    line-height: 1.2;
    letter-spacing: 0;
  }

  .xpt-index-card dl {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin: 0;
  }

  .xpt-index-card div {
    padding-top: 12px;
    border-top: 1px solid #f6d4bf;
  }

  .xpt-index-card dt {
    margin: 0 0 4px;
    color: #765f53;
    font-size: 12px;
    font-weight: 800;
  }

  .xpt-index-card dd {
    margin: 0;
    color: #2d241f;
    font-size: 18px;
    font-weight: 900;
  }

  .xpt-index-empty {
    grid-column: 1 / -1;
    padding: 28px;
    text-align: center;
  }

  .xpt-index-empty h2 {
    margin: 0 0 8px;
  }

  .xpt-index-empty p {
    margin: 0;
    color: #765f53;
  }

  @media (max-width: 900px) {
    .xpt-index-list {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 680px) {
    .xpt-index-hero-grid,
    .xpt-index-list {
      grid-template-columns: 1fr;
    }

    .xpt-index-hero h1 {
      font-size: 32px;
    }

    .xpt-index-count {
      min-height: auto;
    }
  }
`;
