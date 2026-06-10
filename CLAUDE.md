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

- **TypeScript strict** (`noUnusedLocals: true`, `noUnusedParameters: true`) — zero erros tolerados. Sempre rodar `tsc --noEmit` antes de commitar.
- **Vercel build command** em `vercel.json`: `tsc -b && vite build` (não usa `npm run build` para evitar o `sync:sfmkt` que requer credenciais externas).
- **`vite.config.ts`** usa `loadEnv()` para ler `VITE_API_URL` do `.env.local` — necessário para o proxy funcionar no dev local.

## Invariantes críticas

- `MetricCommentEditor` deve sempre receber `squadId={selectedTeam}` (não `smConfig.id`) em `SMDashboard.tsx` — senão análises replicam entre times.
- Análises no Redis são indexadas por `[teamId][releaseId][quinzenaId][metricId]` — nunca salvar sob o ID do SM.
- `handleSave` em `MetricCommentEditor` faz fresh-fetch antes de escrever para evitar race condition entre múltiplos editores na mesma página.
- Datas em `src/config/quinzenas.ts` devem usar formato `YYYY-MM-DD` com ano correto.

## Testes

Para rodar os testes E2E localmente:
```bash
vercel env pull .env.local   # uma vez
npx playwright test tests/comments-e2e.spec.ts --config=playwright.local.config.ts
```

O Playwright sobe automaticamente o `api:local` (porta 3001) e o Vite dev (porta 5173).
Não usar `playwright.vercel.config.ts` — o Vercel tem Security Checkpoint que bloqueia browsers automatizados.
