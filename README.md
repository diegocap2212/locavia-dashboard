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

As variáveis `KV_*` são configuradas automaticamente ao linkar um Vercel KV Store no painel da Vercel.

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
│   │   └── PresentationDeck.tsx
│   ├── hooks/
│   │   ├── useDashboardData.ts   # Hook principal: dados + filtros + cone
│   │   └── useSMDashboardData.ts # Hook por SM
│   ├── components/            # Gráficos e UI reutilizáveis (Recharts)
│   ├── services/
│   │   ├── dataService.ts     # Fetch Google Sheets com fallback para data.json
│   │   └── commentsService.ts # CRUD de análises via /api/comments
│   ├── config/                # Configurações de SM, quinzenas, releases
│   ├── types/                 # Interfaces TypeScript
│   ├── cone/                  # Algoritmo de cálculo CONE (computeCone.ts)
│   ├── data.json              # Dados sincronizados do Jira (gerado pelo sync)
│   └── data-meta.json         # { syncedAt } — hora real da última sincronização
│
├── api/
│   └── comments.ts            # Vercel serverless: GET/POST análises no Redis
│
├── sync/                      # Scripts de sincronização (Jira + Salesforce)
│   ├── sync-jira.ts
│   ├── story-points.ts        # Fonte única de extração de story points (compartilhado)
│   └── sfmkt-sync.ts
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
O `GET /api/comments` reconstrói a árvore aninhada (`[squadId][releaseId][quinzenaId][metricId]`)
que o frontend consome. O blob legado `locavia_dashboard_comments` é mantido como backup.

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

### Story Points das User Stories

O sync puxa os story points do Jira via [`sync/story-points.ts`](sync/story-points.ts) (campos `customfield_10026` = "Story Points" clássico e `customfield_10016` = "Story point estimate" team-managed) e popula `StoryPoints` em cada item do `data.json`. O dashboard de SM usa isso para a seção **"Pontos das User Stories"** (Velocidade e Comprometido vs Entregue), agregada em [`useSMDashboardData.ts`](src/hooks/useSMDashboardData.ts). A seção exibe a **cobertura de estimativa** (% de USs entregues com ponto) como indicador de confiança no dado.

### Indicador de frescura dos dados (`syncedAt`)

A cada execução, `sync/sync-jira.ts` grava `src/data-meta.json` com o timestamp real da sincronização (`{ syncedAt }`). O header dos dashboards de SM lê esse valor e exibe **"Sincronizado em DD/MM/AAAA HH:mm"** — antes a data era inferida do `UpdatedAt` de uma issue arbitrária, o que não refletia a frescura real.

Como o `syncedAt` muda a cada run, o workflow horário (`git add … src/data-meta.json`) **commita toda hora**, garantindo um redeploy no Vercel e funcionando como _heartbeat_: se a data no header parar de avançar enquanto o git mostra novos commits "automated hourly sync", o Vercel não está redeployando (verifique um eventual "Ignored Build Step" no painel do projeto).

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

## Governança e Boas Práticas

- Verifique o card **Qualidade dos Dados** no Dashboard para identificar itens "Done" sem data de resolução.
- Análises qualitativas devem ser registradas **por time** — ao selecionar um time específico no filtro do dashboard SM, a análise ficará vinculada àquele time (não ao SM como um todo).
- Quinzenas com datas de início e fim corretas garantem que os filtros de período funcionem. Qualquer nova quinzena deve ser adicionada em `src/config/quinzenas.ts` seguindo o padrão `YYYY-MM-DD`.
