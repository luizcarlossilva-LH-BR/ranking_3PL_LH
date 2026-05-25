# Ranking 3PL Shopee

Portal com QR Code único para representantes de transportadoras acessarem o relatório individual por CPF.

## Fluxo

1. O QR Code aponta para a home do projeto.
2. O representante digita o CPF.
3. O sistema consulta a aba `acessos` do Google Sheets.
4. Se o CPF estiver ativo, cria uma sessão segura.
5. O usuário acessa apenas a página da própria transportadora.

## Abas esperadas no Google Sheets

### Aba `acessos`

| cpf | nome_representante | transportador | slug | status |
|---|---|---|---|---|
| 12345678900 | João | CORDENONSI | cordenonsi | ATIVO |

### Aba `ranking`

| transportador | slug | rank | rank_pond | pontuacao | eta_destino | no_show | trips | meses_ativos | peso_trips | rank_safety | pontuacao_safety | rank_peak_season | pontuacao_peak_season |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|

Também são aceitos nomes próximos, como `pontuação`, `Rank Pond`, `Pontuação Ponderada`, `n_viagens`, `Meses Ativos`.
Para as lâminas adicionais, também são aceitos nomes próximos como `safety_rank`, `safety_score`, `peak_season_rank` e `peak_season_score`.

Critérios das lâminas adicionais:

- `Safety`: performance 2025 no pilar Safety para transportadoras com mais de 4 meses ativos. Em caso de empate, usar o número de viagens como critério de desempate.
- `Peak Season`: performance no indicador de No Show nas semanas 46 a 51 de 2025.

### Aba `mensal`

| transportador | slug | mes | pontos | eta_destino | no_show | trips |
|---|---|---|---:|---:|---:|---:|

### Aba `XPT`

Usada pela página pública `/xpt/[slug]`, indicada para QR Codes específicos por unidade XPT.

| 3PL | Ranking | Leakage | Loss | BWT | Resultado |
|---|---|---:|---:|---:|---:|
| XPT_SP_Ourinhos_02 | Convidado | 0,00 | 0.02650% | 21,2 | 100,00% |

O `slug` da URL é gerado a partir do nome da coluna `3PL`.
Exemplo: `XPT_SP_Ourinhos_02` vira `/xpt/xpt-sp-ourinhos-02`.

Classificações aceitas para a mensagem padrão:

- `Top 1`
- `Top 2`
- `Top 3`
- `Certificado`
- `Convidado`

## Variáveis de ambiente

Copie `.env.example` para `.env.local` no desenvolvimento local.

No Vercel, configure em:

Settings > Environment Variables

```env
GOOGLE_SHEET_ID=1KsDWF-AvlswlvidWQnA_e21GP_j8sKaeK3orT4_KL08
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
APP_SECRET=...
```

## Permissão do Google Sheets

Compartilhe a planilha com o e-mail da Service Account como leitor.

Exemplo:

```text
seu-service-account@seu-projeto.iam.gserviceaccount.com
```

## Rodar local

```bash
npm install
npm run dev
```

Abra:

```text
http://localhost:3000
```

## Deploy

### Vercel

1. Suba este projeto no GitHub.
2. Importe o repositório na Vercel.
3. Configure as variáveis de ambiente.
4. Faça o deploy.

### Netlify

Também funciona, mas para Next.js a Vercel tende a ser mais simples.

## Segurança

A URL `/relatorio/[slug]` só abre se o CPF logado estiver vinculado ao mesmo `slug`.
Se o usuário tentar alterar a URL manualmente, o sistema bloqueia o acesso.
