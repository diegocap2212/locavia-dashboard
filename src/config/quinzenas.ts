export interface QuinzenaConfig {
  id: string;              // Formato YYYY-MM-DD da data de apresentação
  label: string;           // Rótulo amigável
  startDate: string;       // Data de início (YYYY-MM-DD, 4 semanas antes)
  endDate: string;         // Data de término (YYYY-MM-DD, véspera da apresentação)
  presentationDate: Date;  // Data da apresentação
}

export const QUINZENAS: QuinzenaConfig[] = [
  { id: '2026-01-08', label: 'Quinzena 08/01 (11/12 a 07/01)', startDate: '2026-12-11', endDate: '2026-01-07', presentationDate: new Date('2026-01-08T00:00:00') },
  { id: '2026-01-22', label: 'Quinzena 22/01 (25/12 a 21/01)', startDate: '2025-12-25', endDate: '2026-01-21', presentationDate: new Date('2026-01-22T00:00:00') },
  { id: '2026-02-05', label: 'Quinzena 05/02 (08/01 a 04/02)', startDate: '2026-01-08', endDate: '2026-02-04', presentationDate: new Date('2026-02-05T00:00:00') },
  { id: '2026-02-19', label: 'Quinzena 19/02 (22/01 a 18/02)', startDate: '2026-01-22', endDate: '2026-02-18', presentationDate: new Date('2026-02-19T00:00:00') },
  { id: '2026-03-05', label: 'Quinzena 05/03 (05/02 a 04/03)', startDate: '2026-02-05', endDate: '2026-03-04', presentationDate: new Date('2026-03-05T00:00:00') },
  { id: '2026-03-19', label: 'Quinzena 19/03 (19/02 a 18/03)', startDate: '2026-02-19', endDate: '2026-03-18', presentationDate: new Date('2026-03-19T00:00:00') },
  { id: '2026-04-02', label: 'Quinzena 02/04 (05/03 a 01/04)', startDate: '2026-03-05', endDate: '2026-04-01', presentationDate: new Date('2026-04-02T00:00:00') },
  { id: '2026-04-16', label: 'Quinzena 16/04 (19/03 a 15/04)', startDate: '2026-03-19', endDate: '2026-04-15', presentationDate: new Date('2026-04-16T00:00:00') },
  { id: '2026-04-30', label: 'Quinzena 30/04 (03/04 a 29/04)', startDate: '2026-04-03', endDate: '2026-04-29', presentationDate: new Date('2026-04-30T00:00:00') },
  { id: '2026-05-14', label: 'Quinzena 14/05 (16/04 a 13/05)', startDate: '2026-04-16', endDate: '2026-05-13', presentationDate: new Date('2026-05-14T00:00:00') },
  { id: '2026-05-28', label: 'Quinzena 28/05 (30/04 a 27/05)', startDate: '2026-04-30', endDate: '2026-05-27', presentationDate: new Date('2026-05-28T00:00:00') },
  { id: '2026-06-11', label: 'Quinzena 11/06 (14/05 a 10/06)', startDate: '2026-05-14', endDate: '2026-06-10', presentationDate: new Date('2026-06-11T00:00:00') },
  { id: '2026-06-25', label: 'Quinzena 25/06 (28/05 a 24/06)', startDate: '2026-05-28', endDate: '2026-06-24', presentationDate: new Date('2026-06-25T00:00:00') },
  { id: '2026-07-09', label: 'Quinzena 09/07 (11/06 a 08/07)', startDate: '2026-06-11', endDate: '2026-07-08', presentationDate: new Date('2026-07-09T00:00:00') },
  { id: '2026-07-23', label: 'Quinzena 23/07 (25/06 a 22/07)', startDate: '2026-06-25', endDate: '2026-07-22', presentationDate: new Date('2026-07-23T00:00:00') },
  { id: '2026-08-06', label: 'Quinzena 06/08 (09/07 a 05/08)', startDate: '2026-07-09', endDate: '2026-08-05', presentationDate: new Date('2026-08-06T00:00:00') },
  { id: '2026-08-20', label: 'Quinzena 20/08 (23/07 a 19/08)', startDate: '2026-07-23', endDate: '2026-08-19', presentationDate: new Date('2026-08-20T00:00:00') },
  { id: '2026-09-03', label: 'Quinzena 03/09 (06/08 a 02/09)', startDate: '2026-08-06', endDate: '2026-09-02', presentationDate: new Date('2026-09-03T00:00:00') },
  { id: '2026-09-17', label: 'Quinzena 17/09 (20/08 a 16/09)', startDate: '2026-08-20', endDate: '2026-09-16', presentationDate: new Date('2026-09-17T00:00:00') },
  { id: '2026-10-01', label: 'Quinzena 01/10 (03/09 a 30/09)', startDate: '2026-09-03', endDate: '2026-09-30', presentationDate: new Date('2026-10-01T00:00:00') },
  { id: '2026-10-15', label: 'Quinzena 15/10 (17/09 a 14/10)', startDate: '2026-09-17', endDate: '2026-10-14', presentationDate: new Date('2026-10-15T00:00:00') },
  { id: '2026-10-29', label: 'Quinzena 29/10 (01/10 a 28/10)', startDate: '2026-10-01', endDate: '2026-10-28', presentationDate: new Date('2026-10-29T00:00:00') },
  { id: '2026-11-12', label: 'Quinzena 12/11 (15/10 a 11/11)', startDate: '2026-10-15', endDate: '2026-11-11', presentationDate: new Date('2026-11-12T00:00:00') },
  { id: '2026-11-26', label: 'Quinzena 26/11 (29/10 a 25/11)', startDate: '2026-10-29', endDate: '2026-11-25', presentationDate: new Date('2026-11-26T00:00:00') },
  { id: '2026-12-10', label: 'Quinzena 10/12 (12/11 a 09/12)', startDate: '2026-11-12', endDate: '2026-12-09', presentationDate: new Date('2026-12-10T00:00:00') },
  { id: '2026-12-24', label: 'Quinzena 24/12 (26/11 a 23/12)', startDate: '2026-11-26', endDate: '2026-12-23', presentationDate: new Date('2026-12-24T00:00:00') }
];

export function getQuinzenas(): QuinzenaConfig[] {
  return QUINZENAS;
}

export function getAutomaticActiveQuinzena(): string {
  const now = new Date();
  // Zera hora para comparação justa
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Encontra a primeira quinzena cuja data de apresentação seja hoje ou no futuro
  for (const q of QUINZENAS) {
    const qDate = new Date(q.presentationDate);
    const presDateOnly = new Date(qDate.getFullYear(), qDate.getMonth(), qDate.getDate());
    
    if (presDateOnly >= today) {
      return q.id;
    }
  }
  
  // Se passou de todas as datas, retorna a última quinzena
  return QUINZENAS[QUINZENAS.length - 1].id;
}

export function getQuinzenaById(id: string): QuinzenaConfig | undefined {
  return QUINZENAS.find(q => q.id === id);
}
