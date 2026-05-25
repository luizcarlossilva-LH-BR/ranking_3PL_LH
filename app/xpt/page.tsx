"use client";

import { FormEvent, useState } from "react";

export default function XptLoginPage() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro("");

    try {
      const response = await fetch("/api/xpt/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf })
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data?.message || "Nao foi possivel validar o acesso XPT.");
        return;
      }

      window.location.href = data.redirectTo;
    } catch {
      setErro("Erro inesperado ao validar o acesso XPT.");
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
          <img className="shopee-mark" src="/shopee-icon.png" alt="Shopee" />
          <img className="bsc-mark" src="/bsc-linehaul.png" alt="BSC Line Haul" />
        </div>

        <h1>Acesse seu relatorio XPT</h1>

        <p className="muted">
          Digite o CPF cadastrado para visualizar a pagina individual da sua unidade XPT.
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
            {loading ? "Validando..." : "Acessar relatorio XPT"}
          </button>

          {erro && <div className="error">{erro}</div>}
        </form>

        <p className="muted" style={{ fontSize: 13, marginTop: 18 }}>
          O acesso e individual e liberado conforme cadastro na aba XPT do Google Sheets.
        </p>
      </section>
    </main>
  );
}
