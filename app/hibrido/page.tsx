"use client";

import { FormEvent, useState } from "react";

export default function HibridoLoginPage() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const response = await fetch("/api/hibrido/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf })
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data?.message || "Não foi possível validar o acesso Híbrido.");
        return;
      }

      window.location.href = data.redirectTo;
    } catch {
      setErro("Erro inesperado ao validar o acesso Híbrido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <style>{HIBRIDO_LOGIN_STYLES}</style>
      <div className="tech-corner tech-corner-left" />
      <div className="tech-corner tech-corner-right" />
      <section className="login-card">
        <div className="brand brand-logos">
          <img className="shopee-mark" src="/shopee-icon.png" alt="Shopee" />
          <span className="csr-login-mark">
            <img src="/campeao-login-logo.png" alt="Campeão Sobre Rodas" />
          </span>
        </div>

        <h1>Acesse seu relatório Híbrido</h1>

        <p className="muted">
          Digite o CPF cadastrado para visualizar a página individual da sua operação híbrida.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            placeholder="Digite somente números"
            value={cpf}
            onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
          />

          <button className="button" disabled={loading}>
            {loading ? "Validando..." : "Acessar relatório Híbrido"}
          </button>

          {erro && <div className="error">{erro}</div>}
        </form>

        <p className="muted" style={{ fontSize: 13, marginTop: 18 }}>
          O acesso é individual e liberado conforme cadastro na aba Híbrido do Google Sheets.
        </p>
      </section>
    </main>
  );
}

const HIBRIDO_LOGIN_STYLES = `
  .csr-login-mark {
    width: 170px;
    height: 98px;
    display: grid;
    place-items: center;
    padding: 8px 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, .92);
    border: 1px solid rgba(238, 77, 45, .22);
    box-shadow: 0 12px 26px rgba(180, 61, 24, .14);
  }

  .csr-login-mark img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
`;
