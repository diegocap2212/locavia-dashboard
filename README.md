# Locavia Dashboard

Dashboard de métricas Agile para as equipes de software automotivo da Locavia. Visualiza dados de throughput, lead time, burndown CONE e análises qualitativas por time e quinzena.

**Stack:** Vite + React 19 + TypeScript (strict) + Recharts + TailwindCSS  
**Backend:** Vercel Serverless Functions + Upstash Redis  
**Deploy:** Vercel (CI/CD automático via push na `main`)

---

## Rotas

| Rota | Conteúdo |
|------|----------|
| `/` | Dashboard principal — Locavia (cone geral, KPIs, matriz temporal) |
| `/cone-bf-cem` | Dashboard BF/CEM — compras e customer experience |
| `/sm/gabriela` | Dashboard individual — SM Gabriela (TAOS, GOL, SFMktplace) |
| `/sm/rafael` | Dashboard individual — SM Rafael (OPTIMUS, NIVUS, JETTA) |
| `/sm/ed` | Dashboard individual — SM Ed (SCANIA, PARATI) |
| `/datas-releases` | Datas das releases — início/meta editáveis pela LM (persistidas no Redis) |
| `/api-docs` | Documentação interativa da API (Swagger UI / OpenAPI 3.1), atrás do login |
| `/presentation/:smId` | Deck executivo de apresentação |

---

## Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Preencha VITE_CLOUD_DATA_URL e KV_REST_API_URL/KV_REST_API_TOKEN

# 3. Subir servidor de desenvolvimento
npm run dev
# → http://localhost:5173

# 4. (Opcional) Para testar a API de comments localmente, configure no .env:
# VITE_API_URL="https://locavia-dashboard.vercel.app"
# Isso faz o Vite proxiar /api/* para a URL deployada do Vercel.

# 5. (Opcional) Sincronizar dados do Jira/Salesforce
npm run sync:jira
npm run sync:sfmkt
```

---

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `VITE_CLOUD_DATA_URL` | URL do Google Sheets (gviz/tq) com os dados de issues |
| `KV_REST_API_URL` | Endpoint Upstash Redis (para persistência de análises) |
| `KV_REST_API_TOKEN` | Token Upstash Redis |
| `JIRA_API_TOKEN` | Token Jira Cloud (usado apenas nos scripts de sync) |
| `JIRA_USER_EMAIL` | E-mail do usuário Jira (scripts de sync) |
| `JIRA_BASE_URL` | URL da instância Jira (scripts de sync) |
| `SESSION_SECRET` | Segredo para assinar o cookie de sessão (gate de login). Junto com `DASHBOARD_PASSWORD`, ativa o login. |
| `DASHBOARD_PASSWORD` | Senha de acesso ao painel (vive só no servidor). |
| `ALLOWED_ORIGIN` | Origem permitida no CORS do `/api/comments` (URL do dashboard). |
| `GITHUB_DISPATCH_TOKEN` | PAT GitHub (Actions: Read/Write) para o botão "Atualizar agora" disparar o sync. Só no servidor. |
| `GITHUB_REPO` | Repositório `owner/repo` alvo do `workflow_dispatch`. |
| `GITHUB_WORKFLOW` / `GITHUB_REF` | (Opcionais) workflow (`hourly-sync.yml`) e branch (`main`) do dispatch. |

As variáveis `KV_*` são configuradas automaticamente ao linkar um Vercel KV Store no painel da Vercel.

> **Gate de login:** o painel só exige senha quando `SESSION_SECRET` **e** `DASHBOARD_PASSWORD` estão setadas (produção). Em dev/local, sem essas vars, o gate fica desativado e tudo segue aberto — sem quebrar o fluxo de desenvolvimento.

As variáveis `JIRA_*` vivem nos **Secrets do GitHub Actions** (usadas pelo workflow de sync) e também podem ser colocadas no `.env.local` (gitignored) para rodar `npm run sync:jira` localmente. O Jira é a instância **Grupo LM** (`https://grupolm.atlassian.net`); o token é um Atlassian API token (Basic Auth `email:token`).

---

## Build e Deploy

```bash
# Build local (TypeScript + Vite)
npm run build
# Gera dist/

# Deploy automático
git push origin main
# → Vercel detecta o push e faz o deploy
```

O pipeline de build completo (`npm run build`) executa:
1. `npm run sync:sfmkt` — sincroniza dados do Salesforce Marketplace
2. `tsc -b` — verificação TypeScript strict (zero warnings tolerados)
3. `vite build` — bundle otimizado

---

## Arquitetura

```
locavia-dashboard/
├── src/                       # Código da SPA (tudo que vai pro browser)
│   ├── App.tsx                # Roteamento principal (React Router v7)
│   ├── pages/
│   │   ├── BFCEMDashboard.tsx # Dashboard BF/CEM (lazy-loaded)
│   │   ├── SMDashboard.tsx    # Dashboard por Scrum Master
│   │   ├── ReleaseDetail.tsx  # Detalhe de uma release
│   │   ├── ReleaseDates.tsx   # Datas das releases (início/meta editáveis) — /datas-releases
│   │   ├── ApiDocs.tsx        # Swagger UI (OpenAPI 3.1) — /api-docs (lazy, atrás do login)
│   │   └── TeamDetail.tsx     # Detalhe de um time
│   ├── hooks/
│   │   ├── useDashboardData.ts   # Hook principal: dados + filtros + cone
│   │   └── useSMDashboardData.ts # Hook por SM
│   ├── theme/
│   │   └── ThemeProvider.tsx  # Contexto de tema light/dark (Venice) + hook useTheme
│   ├── components/            # Gráficos e UI reutilizáveis (Recharts)
│   │   └── ui/                # Primitivos do DS Venice: Button, Input, Badge, ThemeToggle
│   ├── services/
│   │   ├── dataService.ts     # Fetch Google Sheets com fallback para data.json
│   │   ├── commentsService.ts # CRUD de análises via /api/comments
│   │   └── releaseDatesService.ts # GET/POST datas de release via /api/release-dates
│   ├── config/                # Configurações de SM, quinzenas, semanas, releases
│   ├── types/                 # Interfaces TypeScript
│   ├── api-docs/openapi.ts    # Spec OpenAPI 3.1 (consumida por pages/ApiDocs.tsx)
│   ├── cone/                  # Algoritmo de cálculo CONE (computeCone.ts)
│   ├── cfd/                   # CFD (Cumulative Flow Diagram) — computeCFD.ts (transform isolado)
│   ├── lib/                   # Utilitários puros (timeBuckets.ts — granularidade dos gráficos)
│   ├── data.json              # Dados sincronizados do Jira (gerado pelo sync)
│   └── data-meta.json         # { syncedAt } — hora real da última sincronização
│
├── api/
│   ├── comments.ts            # Vercel serverless: GET/POST análises no Redis (roteia hash por cadência)
│   ├── data.ts                # Serve o dataset (Blob privado + fallback) — cache em memória + ETag/304
│   ├── release-dates.ts       # GET/POST datas de release no Redis (hash locavia_release_dates_v1)
│   ├── login.ts               # Gate de login (senha única) — sessão por cookie HttpOnly
│   └── refresh.ts             # Dispara o sync do Jira sob demanda (workflow_dispatch) + status
│   # (lógica de sessão HMAC é inline em cada function — a Vercel não empacota imports
│   #  relativos entre serverless functions)
│
├── sync/                      # Scripts de sincronização (Jira + Salesforce)
│   ├── sync-jira.ts           # Orquestra a busca (JQL) e grava src/data.json + data-meta.json
│   ├── jira-client.ts         # Cliente REST do Jira (Basic Auth, paginação por token, expand=changelog)
│   ├── field-mapper.ts        # Mapeia issue do Jira → DashboardItem (time, release, status, datas)
│   ├── metrics-calculator.ts  # Pós-processo: TimeInTodo (changelog), LeadTime, flags de qualidade
│   ├── status-classification.ts # Fonte única de classificação de status (DONE/IN_PROGRESS/TODO)
│   ├── story-points.ts        # Fonte única de extração de story points (compartilhado)
│   └── sfmkt-sync.ts          # Sync dedicado do projeto SFMKT → sfmkt_data.json (métricas de sprint)
│
├── scripts/                   # Scripts de build e verificação de dados
│   ├── update-data.ts
│   ├── verify-data.ts
│   └── process-local-csv.ts
│
├── tools/                     # Utilitários de desenvolvimento (não vão pro browser)
│   ├── scratch/               # Scripts ad-hoc de análise e investigação
│   ├── debug/                 # Helpers de debug e comparação de dados
│   ├── debug-render.cjs       # Helper de renderização para debug
│   ├── find-fields.ts         # Descoberta de campos Jira
│   ├── local-api-server.ts    # API de comments local (porta 3001) p/ testes E2E
│   ├── migrate-comments-to-hash.ts # Migração blob -> Redis Hash (one-shot)
│   └── inspect-redis.ts       # Inspeciona/limpa o conteúdo do Redis
│
└── tests/                     # Playwright E2E tests
```

**Persistência de análises:** Cada análise qualitativa é salva no Redis como um **Hash**
(`locavia_dashboard_comments_v2`), onde cada campo é um comentário isolado:

- **Campo:** `encodeURIComponent(squadId):encodeURIComponent(releaseId):encodeURIComponent(quinzenaId):encodeURIComponent(metricId)`
- **Valor:** `{ gap, action, updatedAt }` — `updatedAt` é um timestamp ISO gerado **no servidor** a cada save (`POST /api/comments`) e exibido como "Última edição em…" no card. É opcional na leitura, então análises antigas sem o campo continuam válidas.

Cada save faz `HSET` apenas no seu próprio campo — escrita **atômica e isolada**, sem
read-modify-write do blob inteiro. Isso elimina a condição de corrida entre múltiplos
editores na mesma página e o risco de um save sobrescrever os dados de outro time.
O `GET /api/comments` reconstrói a árvore aninhada (`[squadId][releaseId][periodId][metricId]`)
que o frontend consome. O blob legado `locavia_dashboard_comments` é mantido como backup.

**Cadência (quinzenal × semanal):** a partir do pedido da LM, as análises do **SMDashboard**
passaram a ser **semanais**. Para não misturar com as quinzenas do Locavia/BF-CEM, o
`/api/comments` roteia o hash por uma flag `cadence` (migração **não-destrutiva**):

| Cadência | Hash Redis | Usado por |
|---|---|---|
| `quinzena` (default) | `locavia_dashboard_comments_v2` | Locavia, BF/CEM (inalterado) |
| `semana` | `locavia_dashboard_comments_v3_semana` | SMDashboard (seletor de semana) |

O `periodId` na chave do campo é o id da quinzena **ou** o id da semana (segunda-feira `YYYY-MM-DD`,
ver [`src/config/semanas.ts`](src/config/semanas.ts)), conforme a cadência. O `v2` antigo segue
intacto e legível.

> **Atenção (follow-up conhecido):** o deck `/presentation/:smId` ainda lê comentários na cadência
> padrão (`quinzena`/v2). Para exibir as novas análises semanais (v3) ele precisa do mesmo tratamento
> de cadência — fora do escopo desta entrega.

---

## Design System (Venice)

A UI segue o **Design System Venice (by blite)**: tipografia **Inter**, verde
**`#2BE86B`** como cor de marca e **light/dark mode** completos. O **chrome é claro**
(superfícies + header translúcido), com o verde **apenas como acento** — fiel ao DS.

- **Tokens** em [`src/index.css`](src/index.css) (fontes + `color-scheme`) e [`src/App.css`](src/App.css):
  o `:root` define a paleta (escala `--green-*`, `--accent`, superfícies, texto, bordas,
  feedback `--ok/warn/err`, `--page`, ruído) e `[data-theme="dark"]` faz o override do tema
  escuro. **Aliases legados** (`--primary`, `--text-main`, `--bg-color`, `--navy`, …) apontam
  para os tokens novos — componentes que usam `var(--*)` herdam o tema automaticamente.
- **Tema:** [`ThemeProvider`](src/theme/ThemeProvider.tsx) (envolve a app em
  [src/main.tsx](src/main.tsx)) seta `data-theme` no `<html>`, persiste em `localStorage`
  (`venice-theme`) e usa a preferência do SO como default. Um script inline no
  [index.html](index.html) aplica o tema **antes da pintura** (sem flash). O toggle
  (sol/lua) fica na topbar via [`ui/ThemeToggle`](src/components/ui/ThemeToggle.tsx).
- **Primitivos** em [`src/components/ui/`](src/components/ui/): `Button` (variantes
  primary/accent/secondary/tertiary/destructive), `Input`/`Select`/`Textarea`, `Badge`.
  As classes base (`.vds-btn*`, `.vds-input`, …) vivem em [src/App.css](src/App.css) para
  ter estados `:hover/:active/:focus-visible` reais.
- **Chrome (sidebar/topbar/hero):** superfícies claras via tokens `--shell-*`/`--hero-*`
  (que herdam de `--surface*`/`--text-*`, então viram near-black no dark). Header translúcido
  `.vds-topbar` (`color-mix` + blur). Nada de "shell escuro" — o verde aparece só em acentos
  (nav ativo, pills, KPIs, cone). [`AppShell`](src/components/AppShell.tsx),
  [`PageHero`](src/components/PageHero.tsx), [`NavDropdown`](src/components/NavDropdown.tsx).
- **Gráficos:** paleta central em [`src/lib/chartColors.ts`](src/lib/chartColors.ts)
  (verde/forest/sage + neutro; **sem azul/violeta**). `grid`/`axis` usam cinza translúcido
  para servir light e dark. O **`ConeCanvas`** é **theme-aware** (recebe `theme` e troca a
  paleta light/dark) e o **CFD** usa card claro com `dark={theme==='dark'}`. O violeta e o
  verde-teal antigo (`#2BBB92`) foram removidos em favor do verde Venice.

> **Convenção:** prefira `var(--token)` a hex fixo. Ao criar superfícies/cores novas, use os
> tokens semânticos (`--surface*`, `--text-*`, `--border-*`, `--accent`, `--ok/warn/err`) para
> manter o suporte a dark mode.

---

## Segurança e Acesso

- **Gate de login (senha única).** O app é envolvido por `AuthGate` ([src/components/AuthGate.tsx](src/components/AuthGate.tsx)),
  que checa a sessão via `GET /api/login`. Em produção (com `SESSION_SECRET` + `DASHBOARD_PASSWORD`
  setadas), exibe a tela de senha; a senha é validada no servidor (timing-safe) e a sessão fica
  num cookie **HttpOnly** assinado por HMAC (12h). As APIs `/api/comments` e `/api/refresh` recusam
  requisições sem sessão quando o gate está ativo.
- **CORS travado.** O `/api/comments` só aceita origem cruzada da `ALLOWED_ORIGIN` (sem `*`).
  Chamadas same-origin (a própria SPA) seguem funcionando.
- **Segredos.** Tokens (Jira, GitHub PAT, Redis, senha) vivem **só no servidor** (env vars na Vercel /
  Secrets do GitHub). Nada é embarcado no cliente. Rotacione `GITHUB_DISPATCH_TOKEN` e o token Jira
  periodicamente.
- **Limite honesto (P1 futuro).** O `data.json` ainda é embarcado no bundle público — quem inspeciona
  o JS consegue baixá-lo. Proteção real do dataset exige servir os dados por API autenticada (mudança
  arquitetural maior, fora deste escopo).

---

## SMDashboard — Vazão/Lead Time, CFD, Granularidade e Refresh

- **Vazão e Lead Time separados.** Antes combinados num só gráfico; agora são dois cards
  ([VazaoTrendChart](src/components/VazaoTrendChart.tsx) e [LeadTimeTrendChart](src/components/LeadTimeTrendChart.tsx)).
  Os mesmos componentes existem nas páginas Locavia/BF-CEM ([WeeklyVazaoChart](src/components/WeeklyVazaoChart.tsx) / [WeeklyLeadTimeChart](src/components/WeeklyLeadTimeChart.tsx)).
- **CFD (Cumulative Flow Diagram).** Fluxo acumulado por status (A Fazer · Em andamento · Concluído),
  calculado em [`src/cfd/computeCFD.ts`](src/cfd/computeCFD.ts) como **saída aditiva** do
  `useSMDashboardData` — mesmo recorte de filtros dos demais gráficos, **sem alterar** cone/vazão/lead time.
  `Created`/`Resolved` são confiáveis; a banda **Em andamento** depende de `StartDate` (esparso ~61%),
  com fallback `StartDate → CommitmentDate` e **aviso de fidelidade** na UI quando a cobertura é baixa.
- **Granularidade.** Seletor Semanal/Quinzenal/Mensal ([`src/lib/timeBuckets.ts`](src/lib/timeBuckets.ts))
  re-agrega as séries semanais para visualizar evoluções mais longas. **Não** altera a geração de
  semanas do cone (vazão/contagens somadas; lead time ponderado pelo throughput; CFD pega o estado
  acumulado da última semana do bin).
- **Botão "Atualizar agora".** Dispara o sync do Jira sob demanda via `POST /api/refresh`
  (`workflow_dispatch` no [hourly-sync.yml](.github/workflows/hourly-sync.yml)), com o token só no
  servidor. **Não é instantâneo** (~2-5 min de sync + redeploy): a UI faz polling do status da
  execução e recarrega ao concluir. Requer `GITHUB_DISPATCH_TOKEN` + `GITHUB_REPO`.
- **Cadência semanal das análises.** O seletor de período do SM passou de quinzena para **semana**:
  a semana escolhida define o comentário (Redis v3) **e** a janela dos gráficos (semana + 7 anteriores
  para contexto). O modo "Período Customizado (Dias)" segue disponível.

---

## Regras de Sincronização (Paridade CONE)

Para garantir que o Dashboard reflita exatamente os números da planilha mestre **TI-LM CONE**, o script de sincronização segue estas regras:

### Critérios de Inclusão (Filtro Positivo)
O sistema busca itens que atendam a **PELO MENOS UM** destes critérios:
- **Release**: Deve estar em uma das versões mapeadas (ex: `O4R1`, `O4R2`, `CEM`, `Release 01`).
- **Jornada**: Se não houver release, o item deve pertencer a uma das 30+ jornadas oficiais (ex: `FATURAMENTO`, `LOGÍSTICA`, `VENDAS_AUTO-ATENDIMENTO`) dentro dos projetos core (`VAA`, `RM`, `LKD`, etc).

### Filtro de Saneamento (Filtro Negativo)
Mesmo que atenda aos critérios acima, o item é **DESCARTADO** se o status for:
- `1. BACKLOG` ou `BACKLOG`
- `EM REFINAMENTO`, `REFINANDO` ou `A REFINAR`
- `SANEAMENTO` ou `ESPERANDO`
- `DESCARTADO` ou `CANCELADO`

> [!IMPORTANT]
> Estas regras garantem uma paridade de ~100% com a aba "BASE CONE" da planilha SharePoint, filtrando ruídos e itens que ainda não entraram em ciclo de entrega.

### Data de conclusão e classificação de status

A **data de conclusão** (`Resolved`) de cada item vem **direto do `resolutiondate` do Jira** — exatamente o campo `resolved` que os times usam no JQL de vazão (`resolved >= startOfWeek()`). A classificação de status vive numa fonte única, [`sync/status-classification.ts`](sync/status-classification.ts), importada por `field-mapper.ts` e `metrics-calculator.ts` (não duplicar listas).

Regras:
- **`StatusCategory = DONE`** quando o item tem `resolution`/`resolutiondate` **OU** o `statusCategory` do Jira é concluído (no Jira da LM os nomes são em pt-BR: `Itens concluídos` / `Em andamento` / `Itens Pendentes`).
- **Status de QA/deploy/homolog NÃO são DONE.** `AGUARDANDO QA`, `QA EM PROGRESSO`, `EM TESTE(S)`, `AGUARDANDO DEPLOY QA/PROD`, `AGUARDANDO HOMOLOG`, `HOMOLOG EM PROGRESSO` são `Em andamento` no Jira (sem `resolution`) → `IN_PROGRESS`. Tratá-los como entrega jogava a data de conclusão para a semana em que a issue entrou em QA, antecipando a vazão em até ~2 semanas.
- **`DESCARTADO`/`CANCELADO` nunca são DONE** (não contam como entrega), mesmo tendo `resolution`.
- **Subtarefas (`Subtarefa`/`Sub-Bug`) são excluídas** pelo JQL (`type not in (Epic, subTaskIssueTypes())`). Um JQL manual sem essa exclusão retorna mais itens que o painel — a diferença é esperada.
- `metrics-calculator.ts` usa o changelog **apenas** para `TimeInTodo` (início do desenvolvimento); **não** deriva a conclusão do changelog.

### SFMKT (Salesforce Marketplace)

A aba **"SFMktplace"** da Gabi vem do **sync principal** (`src/data.json`), como qualquer outro time: o JQL do [`sync-jira.ts`](sync/sync-jira.ts) inclui `OR (project = SFMKT ...)` e o [`field-mapper.ts`](sync/field-mapper.ts) marca `Team='SFMKT'` para keys `SFMKT-*`. A team `SALESFORCE` em [`sm-config.ts`](src/config/sm-config.ts) casa **só** SFMKT (antes incluía `APV`/`FUSCA`, do pós-venda, o que poluía a aba com bugs que não eram do SFMKT). O sync dedicado (`sfmkt-sync.ts` → `sfmkt_data.json`) segue existindo para métricas de sprint/cycle.

### Story Points das User Stories

O sync puxa os story points do Jira via [`sync/story-points.ts`](sync/story-points.ts) (campos `customfield_10026` = "Story Points" clássico e `customfield_10016` = "Story point estimate" team-managed) e popula `StoryPoints` em cada item do `data.json`. O dashboard de SM usa isso para a seção **"Pontos das User Stories"** (Velocidade e Comprometido vs Entregue), agregada em [`useSMDashboardData.ts`](src/hooks/useSMDashboardData.ts). A seção exibe a **cobertura de estimativa** (% de USs entregues com ponto) como indicador de confiança no dado.

### Indicador de frescura dos dados (`syncedAt`)

A cada execução, `sync/sync-jira.ts` grava `src/data-meta.json` com o timestamp real da sincronização (`{ syncedAt }`). O header dos dashboards de SM lê esse valor e exibe **"Sincronizado em DD/MM/AAAA HH:mm"** — antes a data era inferida do `UpdatedAt` de uma issue arbitrária, o que não refletia a frescura real.

Como o `syncedAt` muda a cada run, o workflow de sync (`git add … src/data-meta.json`) **commita a cada execução**, garantindo um redeploy no Vercel e funcionando como _heartbeat_: se a data no header parar de avançar enquanto o git mostra novos commits "automated hourly sync", o Vercel não está redeployando (verifique um eventual "Ignored Build Step" no painel do projeto).

O workflow [`hourly-sync.yml`](.github/workflows/hourly-sync.yml) roda a cada **30 min** (`cron: '*/30 * * * *'`), mas crons agendados do GitHub são _best-effort_ e podem atrasar/pular. Por isso o header do SMDashboard mostra um **badge âmbar de defasagem** quando `syncedAt` tem mais de 2h, para ninguém confiar num número desatualizado sem perceber. Para forçar um sync na hora, use **workflow_dispatch** (aba Actions) ou rode localmente `npm run sync:jira` com as credenciais Jira no `.env.local`.

---

## Testes E2E (Playwright)

Os testes verificam: persistência de análises, isolamento entre times, mudança de quinzena e feedback visual dos botões.

### Pré-requisitos

```bash
# Obter credenciais do Redis (necessário uma vez)
vercel env pull .env.local
```

O `.env.local` já deve conter (adicionado automaticamente):
```
VITE_API_URL=http://localhost:3001
```

### Rodar os testes

```bash
# Em um terminal: inicia o servidor API local (porta 3001, lê Redis via .env.local)
npm run api:local

# Em outro terminal: inicia o Vite dev (porta 5173, proxy → 3001)
npm run dev

# Em outro terminal: roda os testes
npx playwright test tests/comments-e2e.spec.ts --config=playwright.local.config.ts
```

Ou deixe o Playwright subir tudo automaticamente (mais lento na primeira vez):
```bash
npx playwright test tests/comments-e2e.spec.ts --config=playwright.local.config.ts
```

> **Nota:** O `playwright.vercel.config.ts` aponta para a URL de produção mas o Vercel tem
> Security Checkpoint que bloqueia browsers automatizados. Use sempre o `playwright.local.config.ts`.

---

## Cone — Faixa de Incerteza (bootstrap)

O motor do cone ([`src/cone/computeCone.ts`](src/cone/computeCone.ts)) deriva o melhor/pior cenário
(`velBest`/`velWorst`) por um de dois métodos, via `ConeParams.bandMethod`:

- **`'percentile'` (default):** `PERCENTILE_CONT` direto da amostra recente, piso 1, arredondado.
  É o método **auditado célula-a-célula contra o Excel** — usado pelo dashboard principal
  (`dashboardState` em [`useDashboardData.ts`](src/hooks/useDashboardData.ts)). **Não alterar.**
- **`'bootstrap'`:** reamostragem Monte Carlo **determinística** (PRNG `mulberry32` semeado a partir
  da própria amostra → estável entre renders, não pisca) do throughput observado. Estima a
  distribuição da velocidade média e tira P85/P50/P15. Com **poucas** semanas a variância natural
  **abre** a faixa; com **muitas**, ela estreita. Piso baixo (0.1, não 1) para não colapsar a faixa
  de times lentos (<1 item/semana). Usado **só no cone executivo da home** (`releaseCones`), para que
  **toda release** tenha melhor/pior cenário — não só as maduras. A faixa só some quando não há
  dispersão real (ex.: throughput constante), aí cai no aviso honesto de "amostra curta".

## Datas das Releases (editáveis)

A página `/datas-releases` ([`src/pages/ReleaseDates.tsx`](src/pages/ReleaseDates.tsx)) permite à LM
registrar **início (kickoff)** e **data-alvo (meta)** de cada release. Persiste no Redis via
[`api/release-dates.ts`](api/release-dates.ts) (hash `locavia_release_dates_v1`, campo = `releaseId`,
HSET atômico por release). A home lê essas datas ([`releaseDatesService.ts`](src/services/releaseDatesService.ts))
e usa a **meta** (com fallback no `deadline` do `release-config.json`) para o status dos cards:
**Atrasado** quando nem o otimista alcança a meta; **Em Risco** quando o pessimista a estoura.
O endpoint é protegido pelo mesmo gate de sessão das demais APIs.

## Documentação da API (Swagger / OpenAPI)

A rota `/api-docs` ([`src/pages/ApiDocs.tsx`](src/pages/ApiDocs.tsx)) renderiza o **Swagger UI** a partir
de uma spec **OpenAPI 3.1** mantida à mão em [`src/api-docs/openapi.ts`](src/api-docs/openapi.ts) (objeto
TS passado direto ao Swagger UI — **sem arquivo público**, então a doc fica **atrás do gate de login**).
Documenta os endpoints reais: `/api/login`, `/api/data`, `/api/comments`, `/api/release-dates`,
`/api/refresh` e `/api/trigger-sync`, com o securityScheme do cookie `dash_session`. A página é
**lazy-loaded** (usa `swagger-ui-dist`, ~1MB) → sai num chunk separado, sem inflar o bundle principal.
Acesso pela topbar (botão **API**). **Ao alterar um endpoint em `api/*`, atualize o contrato em
`openapi.ts`.**

## Governança e Boas Práticas

- Verifique o card **Qualidade dos Dados** no Dashboard para identificar itens "Done" sem data de resolução.
- Análises qualitativas devem ser registradas **por time** — ao selecionar um time específico no filtro do dashboard SM, a análise ficará vinculada àquele time (não ao SM como um todo).
- Quinzenas (Locavia/BF-CEM) com datas de início e fim corretas garantem que os filtros de período funcionem. Qualquer nova quinzena deve ser adicionada em `src/config/quinzenas.ts` seguindo o padrão `YYYY-MM-DD`.
- O **SMDashboard** usa cadência **semanal** ([`src/config/semanas.ts`](src/config/semanas.ts), segunda-feira como início). As análises semanais são gravadas no hash Redis `..._v3_semana` (via flag `cadence`); o `v2` (quinzenal) permanece intacto.
