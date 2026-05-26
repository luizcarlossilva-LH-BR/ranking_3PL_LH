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
        setErro(data?.message || "Nao foi possivel validar o acesso Hibrido.");
        return;
      }

      window.location.href = data.redirectTo;
    } catch {
      setErro("Erro inesperado ao validar o acesso Hibrido.");
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
            <img src="/campeao-sobre-rodas-logo.png" alt="Campeao Sobre Rodas" />
          </span>
        </div>

        <h1>Acesse seu relatorio Hibrido</h1>

        <p className="muted">
          Digite o CPF cadastrado para visualizar a pagina individual da sua operacao hibrida.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            required
            placeholder="Digite somente numeros"
            value={cpf}
            onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
          />

          <button className="button" disabled={loading}>
            {loading ? "Validando..." : "Acessar relatorio Hibrido"}
          </button>

          {erro && <div className="error">{erro}</div>}
        </form>

        <p className="muted" style={{ fontSize: 13, marginTop: 18 }}>
          O acesso e individual e liberado conforme cadastro na aba Hibrido do Google Sheets.
        </p>
      </section>
    </main>
  );
}

const HIBRIDO_LOGIN_STYLES = `
  .csr-login-mark {
    width: 148px;
    height: 80px;
    display: grid;
    place-items: center;
    padding: 10px 12px;
    border-radius: 8px;
    background: linear-gradient(135deg, #e7351d 0%, #ee4d2d 52%, #ff8a00 100%);
    box-shadow: 0 12px 26px rgba(180, 61, 24, .14);
  }

  .csr-login-mark img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }
`;
