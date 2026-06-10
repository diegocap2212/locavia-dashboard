import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const csvPath = path.resolve(process.cwd(), 'base_cone.csv');
if (!fs.existsSync(csvPath)) {
  console.error('base_cone.csv not found');
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, 'latin1');
const records = parse(raw, {
  delimiter: ';',
  columns: true,
  skip_empty_lines: true,
  relax_quotes: true,
  trim: true
});

const doneStatuses = [
  'CONCLUIDO', 'CONCLUÍDO', 'DESENV CONCLUIDO', 'DESENV CONCLUÍDO',
  'DONE', 'RESOLVIDO', 'FINALIZADO', 'ENTREGUE', 'FECHADO', 'ENTREGA FINALIZADA',
  'TESTE CONCLUIDO', 'AGUARDANDO QA', 'QA EM PROGRESSO',
  'EM TESTE', 'AGUARDANDO TESTE',
  'AGUARDANDO DEPLOY QA', 'AGUARDANDO DEPLOY PROD',
  'AGUARDANDO HOMOLOG', 'HOMOLOG EM PROGRESSO'
];

let totalDone = 0;
let equalDates = 0;
let differentDates = 0;
const samples: any[] = [];

records.forEach((r: any) => {
  const status = String(r['Status'] || '').toUpperCase().trim();
  const isDone = doneStatuses.some(s => status === s || status.includes(s));
  
  if (isDone) {
    totalDone++;
    const res = r['Resolvido'] ? String(r['Resolvido']).trim() : '';
    const cre = r['Criado'] ? String(r['Criado']).trim() : '';
    
    if (res && res !== 'null' && res !== '') {
      if (res === cre) {
        equalDates++;
        if (samples.length < 10) {
          samples.push({
            key: r['Chave da item'] || r['Key'],
            status: r['Status'],
            created: cre,
            resolved: res
          });
        }
      } else {
        differentDates++;
      }
    }
  }
});

console.log(`Total done items: ${totalDone}`);
console.log(`Done items with Resolvido == Criado: ${equalDates}`);
console.log(`Done items with Resolvido != Criado: ${differentDates}`);
console.log('\nSamples of done items with equal dates:');
console.table(samples);
