export interface TeamConfig {
  carCode: string;
  displayName: string;
  teamFieldValues: string[];    // Valores no campo Time (customfield_11795)
  keyPrefixes: string[];        // Prefixos de issue key
  coneTab?: string;             // Nome da aba no Cone XLSX (para referência)
}

export interface SMConfig {
  id: string;
  name: string;
  avatar: string;               // Iniciais para avatar
  teams: TeamConfig[];
}

export const SM_CONFIGS: SMConfig[] = [
  {
    id: 'gabriela',
    name: 'Gabriela',
    avatar: 'GA',
    teams: [
      { carCode: 'TAOS', displayName: 'Taos', teamFieldValues: ['TAOS', 'Crédito e Proposta'], 
        keyPrefixes: ['TAOS'], coneTab: 'TAOS O4R2' },
      { carCode: 'GOL', displayName: 'Gol', teamFieldValues: ['GOL', 'Portal de Vendas Assistidas'], 
        keyPrefixes: ['GOL', 'LI'], coneTab: 'GOL O4R2' },
      { carCode: 'SALESFORCE', displayName: 'SFMktplace', 
        teamFieldValues: ['FUSCA', 'SALES_FORCE', 'SALES FORCE', 'Pós Venda Salesforce'], 
        keyPrefixes: ['APV', 'SFMKT'], coneTab: 'FUSCA O4R2' },
    ]
  },
  {
    id: 'rafael',
    name: 'Rafael',
    avatar: 'RA',
    teams: [
      { carCode: 'OPTIMUS', displayName: 'Optimus', teamFieldValues: ['OPTIMUS', 'Contratos / Multas / Ressarcimento / Manutenção'], 
        keyPrefixes: ['CTO'], coneTab: 'OPTIMUS O4R2' },
      { carCode: 'NIVUS', displayName: 'Nivus', teamFieldValues: ['NIVUS', 'Portal de Auto Atendimento'], 
        keyPrefixes: ['VAA'], coneTab: 'NIVUS O4R2' },
      { carCode: 'JETTA', displayName: 'Jetta', teamFieldValues: ['JETTA', 'Mobilização'], 
        keyPrefixes: ['JETTA', 'JVE'] },
    ]
  },
  {
    id: 'ed',
    name: 'Ed',
    avatar: 'ED',
    teams: [
      { carCode: 'SCANIA', displayName: 'Scania', teamFieldValues: ['SCANIA', 'SCANIA S 650', 'Compras e Estoque'], 
        keyPrefixes: ['SCANIA'] },
      { carCode: 'PARATI', displayName: 'Parati', teamFieldValues: ['PARATI', 'Evoluções / Buy a Feature'], 
        keyPrefixes: ['PARATI'] },
    ]
  }
];
