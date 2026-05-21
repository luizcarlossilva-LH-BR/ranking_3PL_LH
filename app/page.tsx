"use client";

import { FormEvent, useState } from "react";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data?.message || "Não foi possível validar o acesso.");
        return;
      }

      window.location.href = data.redirectTo;
    } catch {
      setErro("Erro inesperado ao validar o acesso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <div className="tech-corner tech-corner-left" />
      <div className="tech-corner tech-corner-right" />
      <section className="login-card">
        <div className="brand brand-logos">
          <img className="shopee-mark" src="/shopee-icon.svg" alt="Shopee" />
          <img className="bsc-mark" src="/bsc-linehaul.svg" alt="BSC Line Haul" />
        </div>

        <h1>Acesse seu relatório de performance</h1>

        <p className="muted">
          Digite o e-mail cadastrado para visualizar a página individual da sua transportadora.
        </p>

        <form className="form" onSubmit={handleSubmit}>
          <input
            className="input"
            type="email"
            required
            placeholder="email@transportadora.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="button" disabled={loading}>
            {loading ? "Validando..." : "Acessar relatório"}
          </button>

          {erro && <div className="error">{erro}</div>}
        </form>

        <p className="muted" style={{ fontSize: 13, marginTop: 18 }}>
          O acesso é individual e liberado conforme cadastro no Google Sheets.
        </p>
      </section>
    </main>
  );
}
