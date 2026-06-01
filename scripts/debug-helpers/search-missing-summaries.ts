import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const missingSummaries = [
  "Ajustes na micro de contratos Master com o gerenciador de propostas com o credito",
  "Exibir detalhamento de veículos do estoque e veículos a comprar na efetivação do pedido de compra",
  "Vinculação automática de veículos ao pedido",
  "Publicar as alterações da situação do contrato em fila",
  "Ajuste da rotina de exibição do texto padrão",
  "Retornar endereço do Local de retirada no termo de adesão",
  "Inserir funcionalidade de select id na criação de cliente via Wizard",
  "Alterar segundo campo de Valor por KM rodado para Valor compra - Aquisição",
  "Ajustar Modal de pesquisa de destino ao adicionar destino",
  "Ajustar modal de cadastro de local de retirada/devolução do pedido de compra",
  "Aplicar parametrização de abertura de pedido de compra",
  "Parametrizar abertura automática de pedido de compra por produto",
  "Ajustar documento enviado via docusign para Sign and Drive Colaboradores",
  "Erro ao buscar tarifas do pricing",
  "Disponibilizar situação do contrato para Gerenciador de propostas",
  "Merge Release 2"
];

const csvPath = path.join(process.cwd(), 'base_cone.csv');
const rawCsv = fs.readFileSync(csvPath, 'latin1');
const csvRecords = parse(rawCsv, { delimiter: ';', columns: true, skip_empty_lines: true, relax_quotes: true, trim: true });

console.log('🔍 Buscando resumos perdidos no base_cone.csv...\n');

missingSummaries.forEach(summary => {
  const match = csvRecords.find((r: any) => {
    const s = String(r['Resumo'] || '').toLowerCase();
    return s.includes(summary.toLowerCase().substring(0, 30));
  });
  
  if (match) {
    console.log(`✅ Encontrado: "${summary}" -> Key no CSV: ${match['Chave da item'] || match['Key']} [${match['Status']}] : ${match['Resumo']}`);
  } else {
    console.log(`❌ NENHUM MATCH para: "${summary}"`);
  }
});
