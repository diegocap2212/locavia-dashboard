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
      { carCode: 'TAOS', displayName: 'Taos', teamFieldValues: ['TAOS'], 
        keyPrefixes: ['TAOS'], coneTab: 'TAOS O4R2' },
      { carCode: 'GOL', displayName: 'Gol', teamFieldValues: ['GOL'], 
        keyPrefixes: ['GOL', 'LI'], coneTab: 'GOL O4R2' },
      { carCode: 'SALESFORCE', displayName: 'SFMktplace',
        teamFieldValues: ['SFMKT'],
        keyPrefixes: ['SFMKT'], coneTab: 'FUSCA O4R2' },
    ]
  },
  {
    id: 'rafael',
    name: 'Rafael',
    avatar: 'RA',
    teams: [
      { carCode: 'OPTIMUS', displayName: 'Optimus', teamFieldValues: ['OPTIMUS'], 
        keyPrefixes: ['CTO'], coneTab: 'OPTIMUS O4R2' },
      { carCode: 'NIVUS', displayName: 'Nivus', teamFieldValues: ['NIVUS'], 
        keyPrefixes: ['VAA'], coneTab: 'NIVUS O4R2' },
      { carCode: 'JETTA', displayName: 'Jetta', teamFieldValues: ['JETTA'], 
        keyPrefixes: ['JETTA', 'JVE'] },
    ]
  },
  {
    id: 'ed',
    name: 'Ed',
    avatar: 'ED',
    teams: [
      { carCode: 'SCANIA', displayName: 'Scania', teamFieldValues: ['SCANIA', 'SCANIA S 650'], 
        keyPrefixes: ['SCANIA'] },
      { carCode: 'PARATI', displayName: 'Parati', teamFieldValues: ['PARATI'], 
        keyPrefixes: ['PARATI'] },
    ]
  }
];
