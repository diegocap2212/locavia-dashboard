// Projetos de escopo fechado acompanhados no dashboard.
// A ESTRUTURA (fases, rótulos, descrições) é estática aqui; o ANDAMENTO (status, progresso,
// observação) é editável e vive no Redis (hash locavia_project_status_v1, via /api/project-status),
// para que a página seja "viva" — qualquer pessoa da LM atualiza e todos veem em tempo real.

export interface ProjectPhase {
  id: string;          // estável, ex.: 'fase-1'
  monthLabel: string;  // ex.: 'JUL', 'SET–OUT'
  order: number;       // 1..N
  title: string;
  description: string;
}

export interface ProjectContinuousTrack {
  label: string;       // ex.: 'TRILHA CONTÍNUA'
  title: string;
  description: string;
}

export interface ProjectDef {
  id: string;          // slug da rota, ex.: 'governanca-dados'
  name: string;        // 'Governança de Dados'
  eyebrow: string;     // breadcrumb mono
  headline: string;    // subtítulo do hero
  phases: ProjectPhase[];
  continuous?: ProjectContinuousTrack;
}

export const PROJECTS: ProjectDef[] = [
  {
    id: 'governanca-dados',
    name: 'Governança de Dados',
    eyebrow: 'Roadmap · Próximas Fases',
    headline: 'Cinco fases, uma entrega-âncora por mês',
    phases: [
      { id: 'fase-1', monthLabel: 'JUL',     order: 1, title: 'Base de Conhecimento',         description: 'Portal Confluence · guia de acesso · FAQ' },
      { id: 'fase-2', monthLabel: 'AGO',     order: 2, title: 'Boas Práticas & Performance',   description: 'Guias de SQL e biblioteca de queries' },
      { id: 'fase-3', monthLabel: 'SET–OUT', order: 3, title: 'Governança & Metadados',        description: 'Catálogo, dicionário e data owners por domínio' },
      { id: 'fase-4', monthLabel: 'NOV',     order: 4, title: 'Adoção & Evolução',             description: 'Casos de uso e relatório vs baseline' },
      { id: 'fase-5', monthLabel: 'DEZ',     order: 5, title: 'Consolidação & Sustentação',    description: 'Operating model e roadmap de maturidade' },
    ],
    continuous: {
      label: 'Trilha Contínua',
      title: 'Capacitação & Aculturamento',
      description: 'Acontece ao longo de todas as fases. Trilhas por perfil de área e workshops práticos integrados a cada entrega.',
    },
  },
];

export const getProject = (id: string | undefined): ProjectDef | undefined =>
  PROJECTS.find(p => p.id === id);
