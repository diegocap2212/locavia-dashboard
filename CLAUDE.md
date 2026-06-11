# Instruções para Claude Code — locavia-dashboard

## Regra de Governança: README sempre atualizado

**Toda mudança estrutural no projeto deve ser refletida no `README.md` antes do commit.**

O que conta como mudança estrutural:

| Tipo de mudança | O que atualizar no README |
|---|---|
| Nova rota adicionada ao React Router | Tabela de **Rotas** |
| Novo arquivo/pasta relevante em `src/`, `api/`, `sync/`, `scripts/`, `tools/`, `tests/` | Árvore de **Arquitetura** |
| Nova variável de ambiente necessária | Tabela de **Variáveis de Ambiente** |
| Novo script npm criado | Seção relevante (Como Rodar, Testes E2E, etc.) |
| Mudança no fluxo de build ou deploy | Seção **Build e Deploy** |
| Nova funcionalidade ou comportamento importante | Seção **Governança e Boas Práticas** ou nova seção |
| Mudança nas regras de sincronização/filtro CONE | Seção **Regras de Sincronização** |

> Mudanças de bug fix, refatoração interna, ajuste de UI sem impacto estrutural **não precisam** atualizar o README.

---

## Stack e Restrições

- **TypeScript strict** (`noUnusedLocals: true`, `noUnusedParameters: true`) — zero erros tolerados. Rodar **`tsc -b`** antes de commitar — **não** `tsc --noEmit`: o root `tsconfig.json` tem `files: []`, então `tsc --noEmit` é no-op (checa zero arquivos e passa falsamente). Só `tsc -b` type-checa o `src/` via project references — é exatamente o que o Vercel roda no build.
- **Vercel build command** em `vercel.json`: `tsc -b && vite build` (não usa `npm run build` para evitar o `sync:sfmkt` que requer credenciais externas).
- **`vite.config.ts`** usa `loadEnv()` para ler `VITE_API_URL` do `.env.local` — necessário para o proxy funcionar no dev local.

## Invariantes críticas

- `MetricCommentEditor` deve sempre receber `squadId={selectedTeam}` (não `smConfig.id`) em `SMDashboard.tsx` — senão análises replicam entre times.
- Análises no Redis ficam num **Hash** (`locavia_dashboard_comments_v2`), campo `encodeURIComponent(squadId):...(releaseId):...(quinzenaId):...(metricId)` → `{ gap, action, updatedAt }`. O `updatedAt` (ISO) é gerado **no servidor** no `POST /api/comments` e é opcional na leitura (análises antigas sem o campo continuam válidas). Nunca salvar sob o ID do SM como squadId.
- `saveComment` envia **um único comentário**; o backend faz `HSET` só naquele campo (escrita atômica/isolada). Não voltar para o padrão de salvar o blob inteiro — isso reintroduz a condição de corrida entre editores.
- `GET /api/comments` reconstrói a árvore aninhada que o frontend espera; mudanças na API devem preservar esse formato de leitura.
- Datas em `src/config/quinzenas.ts` devem usar formato `YYYY-MM-DD` com ano correto.
- O header "Sincronizado em…" do `SMDashboard.tsx` lê `src/data-meta.json` (`syncedAt`, gravado por `sync/sync-jira.ts`). Não voltar a derivar a data de `items[0].UpdatedAt` — aquilo era o "updated" de uma issue arbitrária, não a hora do sync. O `data-meta.json` precisa existir no repo (import estático) e ser commitado pelo workflow horário.
- SFMKT (Salesforce Marketplace, aba "SFMktplace" da Gabi): vem do **sync principal** (`sync-jira.ts` adiciona `OR (project = SFMKT and type not in (Epic, subTaskIssueTypes()))` ao JQL, fora dos filtros `cf[13065]`/`cf[12683]` que são específicos dos projetos LM). O `field-mapper.ts` força `Team='SFMKT'` quando o prefixo da key é `SFMKT`. A team `SALESFORCE` em `sm-config.ts` casa **só** `SFMKT` (`keyPrefixes:['SFMKT']`, `teamFieldValues:['SFMKT']`) — **não** reintroduzir `APV`/`FUSCA` (eram pós-venda, apareciam como bugs falsos na aba da Gabi).
- Story points: a extração vive **só** em `sync/story-points.ts` (`extractStoryPoints` + `STORY_POINTS_FIELDS`); `field-mapper.ts` e `sfmkt-sync.ts` importam de lá — não duplicar. Neste Jira os campos são `customfield_10026` ("Story Points") e `customfield_10016` ("Story point estimate"), e ambos precisam estar no array `fields` de `jira-client.ts` senão não vêm na resposta. `StoryPoints` pode ser `null` (US sem estimativa) — tratar como 0 nas somas e expor a cobertura.

## Testes

Para rodar os testes E2E localmente:
```bash
vercel env pull .env.local   # uma vez
npx playwright test tests/comments-e2e.spec.ts --config=playwright.local.config.ts
```

O Playwright sobe automaticamente o `api:local` (porta 3001) e o Vite dev (porta 5173).
Não usar `playwright.vercel.config.ts` — o Vercel tem Security Checkpoint que bloqueia browsers automatizados.
