# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## 🚀 Como Rodar o Dashboard Localmente

1. Execute o comando: `npm install` (apenas na primeira vez)
2. Execute o comando: `npm run dev`
3. Acesse o link gerado: [http://localhost:5173](http://localhost:5173)

---

## 📈 Regras de Sincronização (Paridade CONE)

Para garantir que o Dashboard reflita exatamente os números da planilha mestre **TI-LM CONE**, o script de sincronização segue estas regras:

### 1. Critérios de Inclusão (Filtro Positivo)
O sistema busca itens que atendam a **PELO MENOS UM** destes critérios:
- **Release**: Deve estar em uma das versões mapeadas (ex: `O4R1`, `O4R2`, `CEM`, `Release 01`).
- **Jornada**: Se não houver release, o item deve pertencer a uma das 30+ jornadas oficiais (ex: `FATURAMENTO`, `LOGÍSTICA`, `VENDAS_AUTO-ATENDIMENTO`) dentro dos projetos core (`VAA`, `RM`, `LKD`, etc).

### 2. Filtro de Saneamento (Filtro Negativo)
Mesmo que atenda aos critérios acima, o item é **DESCARTADO** se o status for:
- `1. BACKLOG` ou `BACKLOG`
- `EM REFINAMENTO`, `REFINANDO` ou `A REFINAR`
- `SANEAMENTO` ou `ESPERANDO`
- `DESCARTADO` ou `CANCELADO`

> [!IMPORTANT]
> Estas regras garantem uma paridade de ~100% com a aba "BASE CONE" da planilha SharePoint, filtrando ruídos e itens que ainda não entraram em ciclo de entrega.

---

## ⚠️ Governança e Melhores Práticas

- Sempre consulte o [Guia de Preenchimento](file:///C:/Users/Usuario/.gemini/antigravity/brain/ddbd9bff-355f-4901-8dc0-887c99a22c0d/guia_jira.md) para garantir que o time não gere ruídos.
- Verifique o card **Qualidade dos Dados** no Dashboard para identificar itens "Done" sem data de resolução.
