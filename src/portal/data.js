// Fictitious demo data shared by the portal views.
export const C = { teal: '#00acc1', petrol: '#007c8c', sun: '#f5a800', coral: '#e4572e', violet: '#6b5bd2', sky: '#2a9fd6', ok: '#1f9d6b', grey: '#9fb0b6' };

let seed = 42;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));
export const nf = (v, d = 0) => v.toLocaleString('pt-PT', { minimumFractionDigits: d, maximumFractionDigits: d });
export const days = (n, from) => range(n, (i) => { const d = new Date(2026, 10, 11 + from + i); return `${d.getDate()}/${d.getMonth() + 1}`; });
export const MONTHS = ['dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov'];

// Group network: 15 hospitals (beds are fictitious). New units opened recently are flagged.
export const HOSPITALS = [
  { name: 'Hospital da Luz Lisboa', short: 'HL Lisboa', region: 'Lisboa', beds: 540, flagship: true },
  { name: 'Hospital da Luz Torres de Lisboa', short: 'HL Torres de Lisboa', region: 'Lisboa', beds: 110 },
  { name: 'Hospital da Luz Oeiras', short: 'HL Oeiras', region: 'Lisboa', beds: 80 },
  { name: 'Hospital do Mar Cuidados Especializados', short: 'Hospital do Mar', region: 'Lisboa', beds: 120 },
  { name: 'Hospital da Luz Setúbal', short: 'HL Setúbal', region: 'Sul', beds: 120 },
  { name: 'Hospital da Luz Arrábida', short: 'HL Arrábida', region: 'Norte', beds: 200 },
  { name: 'Hospital da Luz Guimarães', short: 'HL Guimarães', region: 'Norte', beds: 90 },
  { name: 'Hospital da Luz Póvoa de Varzim', short: 'HL Póvoa de Varzim', region: 'Norte', beds: 60 },
  { name: 'Hospital da Luz Vila Real', short: 'HL Vila Real', region: 'Norte', beds: 50 },
  { name: 'Hospital da Luz Coimbra', short: 'HL Coimbra', region: 'Centro', beds: 130 },
  { name: 'Hospital da Luz Aveiro', short: 'HL Aveiro', region: 'Centro', beds: 90, isNew: true },
  { name: 'Hospital da Luz Leiria', short: 'HL Leiria', region: 'Centro', beds: 70, isNew: true },
  { name: 'Hospital da Luz Santarém', short: 'HL Santarém', region: 'Centro', beds: 60, isNew: true },
  { name: 'Hospital da Luz Figueira da Foz', short: 'HL Figueira da Foz', region: 'Centro', beds: 50, isNew: true },
  { name: 'Hospital da Luz Funchal', short: 'HL Funchal', region: 'Madeira', beds: 110 },
];
export const UNITS = HOSPITALS.map((h) => h.name);
// Hospitals with their own detail in the portal (patients, agents, insights, stocks).
// The others still count in group totals but are not offered as a filter.
const NO_DETAIL = ['Hospital da Luz Guimarães', 'Hospital da Luz Póvoa de Varzim', 'Hospital da Luz Vila Real'];
export const FILTER_UNITS = UNITS.filter((u) => !NO_DETAIL.includes(u));

// Outpatient clinics (no beds): consultations, imaging and minor procedures.
export const CLINICS = [
  ['Amadora', 'Lisboa'], ['Odivelas', 'Lisboa'], ['Cascais', 'Lisboa'], ['Sintra', 'Lisboa'], ['Almada', 'Sul'], ['Barreiro', 'Sul'],
  ['Montijo', 'Sul'], ['Seixal', 'Sul'], ['Torres Vedras', 'Lisboa'], ['Mafra', 'Lisboa'], ['Maia', 'Norte'], ['Matosinhos', 'Norte'],
  ['Gondomar', 'Norte'], ['Braga', 'Norte'], ['Amarante', 'Norte'], ['Chaves', 'Norte'], ['Águeda', 'Centro'], ['Oliveira de Azeméis', 'Centro'],
  ['Viseu', 'Centro'], ['Pombal', 'Centro'], ['Caldas da Rainha', 'Centro'], ['Faro', 'Sul'], ['Portimão', 'Sul'], ['Machico', 'Madeira'],
].map(([city, region]) => {
  const r = seeded('cl' + city);
  return { name: `Clínica Hospital da Luz ${city}`, short: `Clínica ${city}`, region, consults: Math.round(2400 + r() * 5200), daysToFirst: 4 + r() * 12, noShow: 5 + r() * 4.5, tele: 3 + r() * 6, imaging: r() > .35 };
});
export const TOTAL_BEDS = HOSPITALS.reduce((a, h) => a + h.beds, 0);

// Deterministic generator per key, so a unit shows the same figures on every view.
export function seeded(key) {
  let h = 2166136261;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let x = (h >>> 0) || 1;
  return () => ((x = Math.imul(x ^ (x >>> 15), 2246822507) ^ Math.imul(x ^ (x >>> 13), 3266489909)) >>> 0) / 4294967296;
}
const between = (r, a, b) => a + r() * (b - a);

// Core operating figures for one hospital. All views read from here.
export function unitStats(h) {
  const r = seeded(h.name);
  // New units follow their opening ramp-up (see Novas unidades); Leiria is 3 p.p. behind plan.
  const NEW_OCC = { 'Hospital da Luz Aveiro': 79.1, 'Hospital da Luz Leiria': 68.5, 'Hospital da Luz Santarém': 63.4, 'Hospital da Luz Figueira da Foz': 48.7 };
  const occ = h.flagship ? 91.2 : h.isNew ? (r(), NEW_OCC[h.name]) : between(r, 78, 92);
  const alos = h.name.includes('Mar') ? 18.4 : between(r, 3.1, 4.9);
  const admissions = Math.round((h.beds * occ / 100) / alos * between(r, .95, 1.05));
  return {
    occ, alos, admissions, discharges: Math.round(admissions * between(r, .92, 1.06)),
    erWait: h.flagship ? 46 : between(r, 18, 52), erVisits: Math.round(h.beds * between(r, .9, 1.4)),
    orUtil: between(r, 71, 93), orCancel: between(r, 2.1, 6.8),
    nps: between(r, 62, 79), readm: between(r, 5.1, 8.4), iacs: between(r, 2.2, 4.6), moe: between(r, .78, 1.04), compl: between(r, 1.6, 3.4),
    staffPerBed: between(r, 5.4, 8.1), overtime: Math.round(h.beds * between(r, 14, 26)), absent: between(r, 3.6, 6.4),
    revenue: h.beds * between(r, .36, .44) * (h.flagship ? 1.25 : 1), margin: h.flagship ? 19.4 : h.isNew ? between(r, -4, 6) : between(r, 9, 21),
    consults: Math.round(h.beds * between(r, 95, 140)), daysToFirst: between(r, 6, 24), noShow: between(r, 5.8, 10.2), tele: between(r, 3.8, 7.6),
  };
}
export const STATS = Object.fromEntries(HOSPITALS.map((h) => [h.name, unitStats(h)]));

// Group totals, weighted by beds where a rate is averaged.
export function groupStats(list = HOSPITALS) {
  const w = list.reduce((a, h) => a + h.beds, 0);
  const avg = (k) => list.reduce((a, h) => a + STATS[h.name][k] * h.beds, 0) / w;
  const sum = (k) => list.reduce((a, h) => a + STATS[h.name][k], 0);
  return {
    beds: w, occ: avg('occ'), alos: avg('alos'), admissions: sum('admissions'), discharges: sum('discharges'), erWait: avg('erWait'), erVisits: sum('erVisits'),
    orUtil: avg('orUtil'), orCancel: avg('orCancel'), nps: avg('nps'), readm: avg('readm'), iacs: avg('iacs'), moe: avg('moe'), compl: avg('compl'),
    staffPerBed: avg('staffPerBed'), overtime: sum('overtime'), absent: avg('absent'), revenue: sum('revenue'), margin: avg('margin'),
    consults: sum('consults'), daysToFirst: avg('daysToFirst'), noShow: avg('noShow'), tele: avg('tele'),
  };
}

export const PAYERS = [
  { name: 'Multicare (Fidelidade)', short: 'Multicare', share: 31, dso: 34, color: '#00acc1' },
  { name: 'Médis', short: 'Médis', share: 14, dso: 41, color: '#2a9fd6' },
  { name: 'AdvanceCare', short: 'AdvanceCare', share: 9, dso: 45, color: '#6b5bd2' },
  { name: 'Outras seguradoras', short: 'Outras', share: 6, dso: 52, color: '#9fb0b6' },
  { name: 'ADSE e subsistemas', short: 'ADSE', share: 15, dso: 61, color: '#007c8c' },
  { name: 'SNS (convenções)', short: 'SNS', share: 7, dso: 96, color: '#e4572e' },
  { name: 'Particulares', short: 'Particulares', share: 18, dso: 6, color: '#f5a800' },
];

export const SPECIALTIES = ['Cardiologia', 'Ortopedia', 'Oncologia', 'Cirurgia Geral', 'Obstetrícia', 'Imagiologia', 'Medicina Interna', 'Pediatria', 'Oftalmologia', 'Medicina Física e Reabilitação'];

// Headline group figures (2025 results, YTD 2026 projections are fictitious).
export const GROUP = {
  revenue2025: 807, revenueGrowth: 10, netProfit2025: 63.4, employees: 14012, doctors: 4021, nurses: 3046,
  hospitals: 15, clinics: 24, myLuzUsers: 1.6, teleconsults2024: 117, ytdRevenue: 756.2, ytdGrowth: 8.4,
};

export const MODELS = [
  { name: 'Afluência à urgência', use: 'Episódios por hora, a 72 h', algo: 'Snowflake Forecast', status: ['p-ok', 'Em produção'], metricName: 'Precisão (1 − MAPE)', metric: '91,8%', vol: '2 160', perf: [.918, 0],
    desc: 'Prevê episódios de urgência por hora e unidade, para planear escalas e abrir áreas de observação.', details: [['Treino', 'Semanal · domingo 02:00'], ['Histórico', '5 anos · 9,2 M episódios'], ['Variáveis externas', 'IPMA, feriados, gripe (DGS)'], ['Decisão servida', 'Escalas de urgência'], ['Controlo humano', 'Aprovação do chefe de equipa']],
    feat: [['Hora do dia', .29], ['Dia da semana', .21], ['Incidência gripal', .16], ['Temperatura', .12], ['Feriado/véspera', .11], ['Eventos locais', .06]], lineage: ['Processo clínico · episódios', 'Dados meteorológicos', 'Feature Store', 'Modelo de previsão', 'Escalas aprovadas'] },
  { name: 'Faltas a consultas', use: 'Probabilidade de no-show', algo: 'XGBoost · Snowpark ML', status: ['p-ok', 'Em produção'], metricName: 'AUC', metric: '0,87', vol: '31 400', perf: [.87, 0],
    desc: 'Identifica consultas com maior risco de falta para lembretes direcionados e overbooking controlado.', details: [['Treino', 'Diário · 03:00'], ['Histórico', '3 anos · 21 M marcações'], ['Ação automática', 'Lembrete MY LUZ / SMS'], ['Impacto medido', '−1,4 p.p. na taxa de faltas'], ['Controlo humano', 'Overbooking requer validação']],
    feat: [['Faltas anteriores', .33], ['Antecedência da marcação', .19], ['Distância ao hospital', .14], ['Confirmação na app', .13], ['Hora da consulta', .11], ['Tipo de financiador', .1]], lineage: ['Agenda de marcações', 'Eventos app MY LUZ', 'Feature Store', 'Modelo no-show', 'Lembretes enviados'] },
  { name: 'Risco de rejeição', use: 'Glosa antes do envio', algo: 'LightGBM · Snowpark ML', status: ['p-ok', 'Em produção'], metricName: 'AUC', metric: '0,91', vol: '18 900', perf: [.91, 0],
    desc: 'Antecipa episódios que a entidade financiadora irá rejeitar e indica o motivo provável.', details: [['Treino', 'Semanal'], ['Histórico', '4 anos · 14 M faturas'], ['Receita recuperada', '4,2 M€/ano (estimativa)'], ['Decisão servida', 'Revisão pré-faturação'], ['Controlo humano', 'Correção por faturação']],
    feat: [['Autorização prévia', .36], ['Combinação ato/diagnóstico', .22], ['Entidade e plano', .17], ['Médico requisitante', .1], ['Valor do episódio', .09], ['Urgência vs. programado', .06]], lineage: ['Faturação e convenções', 'Respostas das seguradoras', 'Cortex AI · classificação', 'Modelo de glosa', 'Fila de revisão'] },
  { name: 'Readmissão a 30 dias', use: 'Risco após alta', algo: 'Regressão logística', status: ['p-warn', 'Drift detetado'], metricName: 'AUC', metric: '0,79', vol: '1 250', perf: [.81, .035],
    desc: 'Classifica doentes com alta pelo risco de readmissão. Drift detetado após mudança de protocolo em Cardiologia; retreino agendado.', details: [['Treino', 'Mensal'], ['Último retreino', 'há 41 dias'], ['Drift (PSI)', '0,23 · acima do limiar'], ['Decisão servida', 'Chamada de follow-up'], ['Controlo humano', 'Validação clínica obrigatória']],
    feat: [['N.º internamentos 12 m', .27], ['Índice de Charlson', .23], ['Demora média', .15], ['Polimedicação', .14], ['Idade', .11], ['Apoio social', .1]], lineage: ['Processo clínico', 'Notas de alta · Cortex AI', 'Feature Store', 'Modelo de readmissão', 'Equipa de follow-up'] },
  { name: 'Duração cirúrgica', use: 'Minutos por cirurgia', algo: 'Random Forest', status: ['p-ok', 'Em produção'], metricName: 'Erro médio', metric: '11 min', vol: '640', perf: [.88, 0],
    desc: 'Estima a duração de cada cirurgia para construir planos operatórios mais realistas.', details: [['Treino', 'Semanal'], ['Histórico', '420 mil cirurgias'], ['Impacto', '+9% utilização de salas'], ['Decisão servida', 'Plano operatório'], ['Controlo humano', 'Validação do cirurgião']],
    feat: [['Procedimento', .41], ['Cirurgião', .2], ['ASA', .13], ['IMC', .1], ['Hora de início', .09], ['Anestesia', .07]], lineage: ['Registo de bloco', 'Processo clínico', 'Feature Store', 'Modelo de duração', 'Plano operatório'] },
  { name: 'Risco de queda', use: 'Residentes, a 7 dias', algo: 'Gradient Boosting', status: ['p-ok', 'Em produção'], metricName: 'AUC', metric: '0,84', vol: '1 284', perf: [.84, 0],
    desc: 'Identifica residentes e utentes com risco aumentado de queda para planos preventivos.', details: [['Treino', 'Quinzenal'], ['Dados de sensores', 'Sim · quartos equipados'], ['Impacto', '−22% quedas com lesão'], ['Decisão servida', 'Plano preventivo'], ['Controlo humano', 'Enfermeiro responsável']],
    feat: [['Quedas anteriores', .31], ['Psicofármacos', .24], ['Levantes noturnos', .17], ['Tinetti', .13], ['Idade', .08], ['Infeção recente', .07]], lineage: ['Registos de enfermagem', 'Sensores IoT', 'Feature Store', 'Modelo de queda', 'Planos preventivos'] },
  { name: 'Procura de medicamentos', use: 'Consumo a 14 dias', algo: 'Snowflake Forecast', status: ['p-ok', 'Em produção'], metricName: 'Precisão', metric: '93,1%', vol: '48 000', perf: [.931, 0],
    desc: 'Prevê consumo por artigo e unidade para evitar ruturas e reduzir stock imobilizado.', details: [['Treino', 'Diário'], ['Artigos', '12 400'], ['Ruturas evitadas', '27 nos últimos 30 dias'], ['Decisão servida', 'Encomendas no ERP'], ['Controlo humano', 'Aprovação de compras']],
    feat: [['Histórico de consumo', .38], ['Plano operatório', .22], ['Sazonalidade', .17], ['Ocupação prevista', .13], ['Prazo do fornecedor', .1]], lineage: ['ERP · stocks e compras', 'Plano operatório', 'Feature Store', 'Previsão de procura', 'Pedidos de compra'] },
  { name: 'Próxima melhor ação', use: 'Recomendação por doente', algo: 'Cortex AI + regras clínicas', status: ['p-ml', 'Piloto'], metricName: 'Aceitação', metric: '34%', vol: '22 000', perf: [.34, 0],
    desc: 'Combina guidelines clínicas, histórico e preferências para sugerir o próximo passo de cuidados na app MY LUZ.', details: [['Fase', 'Piloto · 3 unidades'], ['Conversão em marcação', '12%'], ['Canais', 'App MY LUZ, email'], ['Decisão servida', 'Campanhas de seguimento'], ['Controlo humano', 'Revisão clínica das regras']],
    feat: [['Seguimento em atraso', .34], ['Rastreios elegíveis', .25], ['Cobertura do seguro', .16], ['Engagement na app', .15], ['Preferência de canal', .1]], lineage: ['Doente 360°', 'Guidelines clínicas · Cortex Search', 'Cortex AI', 'Recomendação', 'Notificação MY LUZ'] },
  { name: 'Alerta precoce de sépsis', use: 'Risco em tempo real', algo: 'Gradient Boosting + LLM', status: ['p-ok', 'Em produção'], metricName: 'AUC', metric: '0,89', vol: '182 400', perf: [.89, 0],
    desc: 'Combina sinais vitais com texto livre das notas de enfermagem (Cortex AI) para alertar suspeita de sépsis.', details: [['Atualização', 'A cada nova medição'], ['Fonte de texto', 'AI_EXTRACT sobre notas'], ['Agente', 'Vigilância de sépsis'], ['Decisão servida', 'Avaliação médica urgente'], ['Controlo humano', 'Decisão sempre do médico']],
    feat: [['Frequência cardíaca', .24], ['Temperatura', .19], ['Estado de consciência (texto)', .17], ['Lactato prévio', .14], ['Tensão arterial', .14], ['Idade e comorbilidades', .12]], lineage: ['Monitores de sinais vitais', 'Notas · Cortex AI', 'Feature Store (streaming)', 'Modelo de sépsis', 'Alerta à equipa'] },
  { name: 'Previsão de alta', use: 'Alta nas próximas 24 h', algo: 'XGBoost · Snowpark ML', status: ['p-ok', 'Em produção'], metricName: 'AUC', metric: '0,86', vol: '1 640', perf: [.86, 0],
    desc: 'Estima a probabilidade de alta de cada doente internado para planear camas e cirurgias.', details: [['Treino', 'Semanal'], ['Agente', 'Gestor de camas'], ['Impacto', '−22% cancelamentos por falta de cama'], ['Decisão servida', 'Plano de altas'], ['Controlo humano', 'Médico assistente']],
    feat: [['Dias de internamento vs. esperado', .29], ['Tendência de análises', .2], ['Medicação EV ativa', .18], ['Notas "alta prevista"', .15], ['Dia da semana', .1], ['Apoio social', .08]], lineage: ['Internamentos', 'Análises e prescrições', 'Feature Store', 'Modelo de alta', 'Gestão de camas'] },
  { name: 'Correspondência para ensaios', use: 'Elegibilidade de doentes', algo: 'Embeddings + regras (Cortex)', status: ['p-ml', 'Piloto'], metricName: 'Precisão', metric: '0,83', vol: '9 800', perf: [.83, 0],
    desc: 'Compara critérios de inclusão dos protocolos com o processo clínico estruturado e não estruturado.', details: [['Protocolos indexados', '64'], ['Agente', 'Recrutamento para ensaios'], ['Consentimento', 'Verificado antes da sugestão'], ['Decisão servida', 'Convite do investigador'], ['Controlo humano', 'Investigador principal']],
    feat: [['Diagnóstico e estadio', .31], ['Biomarcadores', .24], ['Função renal e hepática', .16], ['Terapêuticas prévias', .15], ['Idade', .08], ['Distância ao centro', .06]], lineage: ['Protocolos · Cortex Search', 'Processo clínico', 'Embeddings', 'Modelo de correspondência', 'Portal do investigador'] },
  { name: 'Risco de saída de colaboradores', use: 'Saída a 12 meses', algo: 'Survival (Cox) · Snowpark ML', status: ['p-ok', 'Em produção'], metricName: 'C-index', metric: '0,78', vol: '14 012', perf: [.78, 0],
    desc: 'Estima o risco de saída por colaborador para ações de retenção pela chefia direta.', details: [['Treino', 'Mensal'], ['Visibilidade', 'Chefia direta e RH (row access policy)'], ['Variáveis excluídas', 'Género, idade, nacionalidade'], ['Decisão servida', 'Plano de retenção'], ['Controlo humano', 'Sempre']],
    feat: [['Horas extra (3 meses)', .27], ['Noites e fins de semana', .21], ['Pedidos recusados', .16], ['Tempo sem progressão', .15], ['Distância casa-trabalho', .11], ['Tipo de contrato', .1]], lineage: ['RH · contratos e escalas', 'Avaliações', 'Feature Store', 'Modelo de saída', 'Colaborador 360°'] },
  { name: 'Demora média esperada', use: 'Dias de internamento', algo: 'LightGBM', status: ['p-ok', 'Em produção'], metricName: 'Erro médio', metric: '0,9 dias', vol: '1 250', perf: [.87, 0],
    desc: 'Estima a demora esperada à admissão por GDH e perfil do doente, para comparar com o real.', details: [['Treino', 'Mensal'], ['Agrupamento', 'GDH + comorbilidades'], ['Uso', 'Benchmark entre hospitais'], ['Decisão servida', 'Gestão de casos'], ['Controlo humano', 'Gestor de casos']],
    feat: [['GDH', .34], ['Índice de Charlson', .22], ['Idade', .14], ['Origem (urgência/programado)', .13], ['Hospital', .1], ['Apoio social', .07]], lineage: ['Episódios', 'Codificação GDH', 'Feature Store', 'Modelo de demora', 'Painel de operações'] },
  { name: 'Triagem de RX de tórax', use: 'Prioridade de leitura', algo: 'Visão computacional (parceiro)', status: ['p-ml', 'Piloto'], metricName: 'Sensibilidade', metric: '0,94', vol: '1 180', perf: [.94, 0],
    desc: 'Ordena a lista de leitura do radiologista, colocando primeiro os exames com achados urgentes. Piloto 37 do programa de inovação.', details: [['Origem', 'Startup do programa de 50 pilotos'], ['Execução', 'Snowpark Container Services'], ['Impacto', 'Achados urgentes lidos 38 min mais cedo'], ['Decisão servida', 'Ordem de leitura'], ['Controlo humano', 'Relatório sempre do radiologista']],
    feat: [['Opacidades', .3], ['Derrame pleural', .22], ['Pneumotórax', .2], ['Cardiomegalia', .15], ['Qualidade da imagem', .13]], lineage: ['PACS · imagens', 'Container Services', 'Modelo de visão', 'Fila de leitura', 'Radiologista'] },
  { name: 'Abandono de clientes', use: 'Risco de mudar de prestador', algo: 'XGBoost', status: ['p-ok', 'Em produção'], metricName: 'AUC', metric: '0,81', vol: '1,6 M', perf: [.81, 0],
    desc: 'Identifica clientes com risco de procurar outro grupo, para ações de fidelização (LUZ ON PRIME, MY LUZ).', details: [['Treino', 'Mensal'], ['Universo', 'Utilizadores MY LUZ'], ['Impacto', '+4 p.p. de retenção em campanhas'], ['Decisão servida', 'Campanhas de fidelização'], ['Controlo humano', 'Equipa de marketing']],
    feat: [['Reclamações recentes', .26], ['Plafond do seguro esgotado', .21], ['Tempo de espera vivido', .18], ['Pesquisa de outros prestadores', .14], ['Uso da app', .12], ['NPS', .09]], lineage: ['Doente 360°', 'Eventos MY LUZ', 'Feature Store', 'Modelo de abandono', 'Campanhas'] },
  { name: 'Anomalias de faturação', use: 'Padrões suspeitos', algo: 'Isolation Forest', status: ['p-ok', 'Em produção'], metricName: 'Precisão', metric: '0,72', vol: '18 900', perf: [.72, 0],
    desc: 'Deteta atos e faturas anómalas, partilhando padrões agregados com a seguradora via Clean Room.', details: [['Treino', 'Semanal'], ['Partilha', 'Clean Room com a Fidelidade'], ['Detetado no ano', '0,6 M€'], ['Decisão servida', 'Auditoria'], ['Controlo humano', 'Auditor interno']],
    feat: [['Frequência de atos por médico', .29], ['Combinações raras de atos', .25], ['Horário do registo', .16], ['Valor vs. mediana', .16], ['Correções posteriores', .14]], lineage: ['Faturação', 'Clean Room Fidelidade', 'Feature Store', 'Modelo de anomalias', 'Auditoria'] },
  { name: 'Procura nas clínicas', use: 'Consultas por clínica e dia', algo: 'Snowflake Forecast (multi-série)', status: ['p-ok', 'Em produção'], metricName: 'Precisão', metric: '90,4%', vol: '24 séries', perf: [.904, 0],
    desc: 'Prevê consultas por clínica e especialidade para abrir agendas e alocar médicos.', details: [['Treino', 'Semanal'], ['Séries', '24 clínicas × 18 especialidades'], ['Sinais externos', 'Feriados, escolas, IPMA'], ['Decisão servida', 'Abertura de agendas'], ['Controlo humano', 'Diretor da clínica']],
    feat: [['Sazonalidade semanal', .32], ['Histórico de marcações', .27], ['Calendário escolar', .14], ['Feriados', .13], ['Temperatura', .08], ['Campanhas MY LUZ', .06]], lineage: ['Agendas das clínicas', 'Sinais externos', 'Feature Store', 'Previsão de procura', 'Abertura de agendas'] }
];

export const QA = {
  'Qual a taxa de ocupação no Hospital da Luz Lisboa esta semana?': {
    text: 'Esta semana, a ocupação média no <b>Hospital da Luz Lisboa</b> é de <b>91,2%</b> (540 camas), +2,8 p.p. face à semana anterior e acima do alvo de 88%. Medicina Interna está a <b>97%</b> e Cirurgia a 89%.<br><br>A previsão aponta para <b>93,1% na sexta-feira</b>, impulsionada pela descida da temperatura mínima (6 °C) e pelo aumento de vírus respiratórios nas águas residuais.',
    chart: { labels: ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'], data: [89.4, 90.6, 91.2, 92.4, 93.1, 91.0, 88.9] },
    sql: "SELECT data, ROUND(AVG(camas_ocupadas / camas_disponiveis) * 100, 1) AS taxa_ocupacao\nFROM LUZ_ANALYTICS.OPERACOES.OCUPACAO_DIARIA\nWHERE hospital = 'Hospital da Luz Lisboa'\n  AND data >= DATE_TRUNC('week', CURRENT_DATE())\nGROUP BY data ORDER BY data;", src: 'Semantic view: Operações hospitalares · Snowflake Intelligence'
  },
  'Qual a ocupação prevista para sexta-feira no HL Lisboa?': {
    text: 'Para <b>sexta-feira, 13 de novembro</b>, a ocupação prevista no Hospital da Luz Lisboa é de <b>93,1%</b> (intervalo 90,4%-95,6%), acima do limite operacional de 92%. Os principais fatores são o aumento de casos respiratórios (+18% na semana) e 41 cirurgias programadas com internamento.<br><br><b>Sugestão:</b> antecipar 22 altas previstas de Medicina Interna para quinta-feira e transferir 6 doentes elegíveis para o Hospital do Mar.',
    chart: { labels: ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'], data: [86.2, 87.9, 88.4, 91.2, 93.1, 90.3, 87.5] },
    sql: "SELECT data, ocupacao_prevista, limite_inferior, limite_superior\nFROM LUZ_ANALYTICS.FORECAST.OCUPACAO_INTERNAMENTO\nWHERE unidade = 'HL Lisboa'\n  AND data BETWEEN '2026-11-09' AND '2026-11-15'\nORDER BY data;", src: 'Semantic view: Ocupação e camas · Modelo: Forecast de ocupação v12'
  },
  'Porque subiu a demora média em Ortopedia este mês?': {
    text: 'A demora média em Ortopedia passou de <b>3,4 para 4,1 dias</b> (+21%). A análise identifica três causas:<br>1. <b>Mais doentes com mais de 80 anos</b> em fraturas do colo do fémur (+34%), com demora média de 7,2 dias.<br>2. <b>Atraso nas altas sociais</b>: 19 doentes aguardaram vaga em cuidados continuados, em média 2,6 dias.<br>3. <b>Fisioterapia ao fim de semana</b> com menos 40% de sessões, o que adia a alta de próteses.<br><br>Os outros fatores explicam menos de 10% da variação.',
    chart: { labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], data: [3.3, 3.5, 3.4, 3.4, 3.6, 4.1] },
    sql: "SELECT mes, AVG(demora_dias) AS demora_media,\n       COUNT_IF(idade >= 80) / COUNT(*) AS pct_80_mais\nFROM LUZ_ANALYTICS.CLINICO.EPISODIOS_INTERNAMENTO\nWHERE especialidade = 'Ortopedia'\nGROUP BY mes ORDER BY mes;", src: 'Semantic view: Internamentos · Análise de contribuição (Top Insights)'
  },
  'Quanto faturámos à Multicare no último trimestre e qual o risco de rejeição?': {
    text: 'No 3.º trimestre de 2026 faturaram-se <b>58,3 M€</b> à Multicare (+7,4% homólogo), em 212 480 atos. A taxa de rejeição foi de <b>2,9%</b> (1,69 M€).<br><br>Neste momento há <b>148 episódios por faturar com risco elevado</b> (0,84 M€). O motivo mais comum é a <b>falta de autorização prévia</b> em exames de imagiologia (61%).',
    chart: { labels: ['jul', 'ago', 'set'], data: [19.1, 18.6, 20.6] },
    sql: "SELECT DATE_TRUNC('month', data_fatura) AS mes,\n       SUM(valor) / 1e6 AS faturado_meur,\n       SUM(IFF(rejeitado, valor, 0)) / SUM(valor) AS taxa_rejeicao\nFROM LUZ_ANALYTICS.RECEITA.FATURAS\nWHERE entidade = 'Multicare' AND trimestre = '2026-Q3'\nGROUP BY 1 ORDER BY 1;", src: 'Semantic view: Receita e faturação · Modelo: Risco de glosa v7'
  },
  'Que doentes diabéticos estão sem seguimento há mais de 6 meses?': {
    text: 'Há <b>4 120 doentes</b> com diabetes tipo 2 sem consulta de Endocrinologia ou Medicina Geral há mais de 6 meses. Destes, <b>1 380 têm HbA1c acima de 8%</b> na última análise e 2 960 são utilizadores ativos da app MY LUZ.<br><br>Posso preparar uma <b>campanha de seguimento</b> na app, priorizada por risco clínico. Os dados identificativos só são visíveis a quem tem perfil clínico.',
    chart: { labels: ['6-9 m', '9-12 m', '12-18 m', '> 18 m'], data: [1840, 1120, 760, 400] },
    sql: "SELECT faixa_sem_seguimento, COUNT(*) AS doentes\nFROM LUZ_ANALYTICS.DOENTE.DOENTE_360\nWHERE ARRAY_CONTAINS('E11'::VARIANT, diagnosticos_cid10)\n  AND meses_desde_ultima_consulta > 6\nGROUP BY 1;", src: 'Semantic view: Doente 360° · Política de mascaramento: PII_CLINICO'
  },
  'Resume as reclamações da última semana no HL Arrábida': {
    text: 'Na última semana houve <b>63 reclamações e comentários negativos</b> no Hospital da Luz Arrábida (−12% vs. semana anterior). Resumo gerado com Cortex AI:<br>• <b>Tempo de espera na urgência</b> ao fim da tarde (24 menções), sobretudo na quinta-feira.<br>• <b>Estacionamento</b> esgotado de manhã (11 menções).<br>• <b>Faturação</b>: dúvidas sobre o copagamento em exames (9 menções).<br>• Elogios recorrentes à equipa de Pediatria e à rapidez do check-in na app.',
    chart: { labels: ['Espera', 'Estacionamento', 'Faturação', 'Marcações', 'Outros'], data: [24, 11, 9, 8, 11] },
    sql: "SELECT AI_CLASSIFY(texto, ['Espera','Estacionamento','Faturação','Marcações','Outros']):labels[0] AS tema,\n       COUNT(*) AS n\nFROM LUZ_ANALYTICS.EXPERIENCIA.COMENTARIOS\nWHERE unidade = 'HL Arrábida' AND data >= DATEADD(day, -7, CURRENT_DATE())\n  AND AI_SENTIMENT(texto):categories[0]:sentiment = 'negative'\nGROUP BY 1 ORDER BY n DESC;", src: 'Cortex AI SQL: AI_CLASSIFY, AI_SENTIMENT, AI_AGG'
  },
  'Qual o protocolo interno para sépsis na urgência?': {
    text: 'Segundo o <b>Protocolo Clínico PC-URG-014 (rev. 2025)</b>, perante suspeita de sépsis:<br>1. Triagem prioritária (laranja ou superior) e avaliação médica em ≤ 10 min.<br>2. Lactato, hemoculturas (2 pares) antes do antibiótico.<br>3. <b>Antibioterapia empírica na 1.ª hora</b>.<br>4. Fluidoterapia 30 ml/kg se hipotensão ou lactato ≥ 4 mmol/L.<br>5. Reavaliação às 3 h e contacto com a UCI se não houver resposta.<br><br>Cumprimento da "1.ª hora" no último mês: <b>84%</b> (objetivo 90%).',
    sql: "SELECT * FROM TABLE(\n  CORTEX_SEARCH('LUZ_DOCS.PROTOCOLOS.PESQUISA',\n                'protocolo sépsis urgência antibioterapia'));", src: 'Cortex Search: 2 340 protocolos clínicos · Documento PC-URG-014, pág. 3-5'
  }
};

export const NOTE = `NOTA DE ALTA

Doente do sexo masculino, 71 anos, internado de 02/11 a 07/11/2026 por <mark class="dx">pneumonia adquirida na comunidade</mark> do lobo inferior direito, com <mark class="dx">insuficiência respiratória parcial</mark>. Antecedentes de <mark class="dx">DPOC GOLD 2</mark>, <mark class="dx">fibrilhação auricular</mark> hipocoagulado e diabetes tipo 2 não insulinotratada.

Iniciou <mark class="rx">amoxicilina/ácido clavulânico 1,2 g EV 8/8h</mark> e <mark class="rx">azitromicina 500 mg/dia</mark>, com boa evolução clínica e analítica (PCR 18,4 → 2,1 mg/dL). Oxigenoterapia suspensa ao 4.º dia.

Medicação à data de alta: <mark class="rx">amoxicilina/ác. clavulânico 875/125 mg oral 12/12h durante 3 dias</mark>, apixabano 5 mg 12/12h, metformina 1000 mg 12/12h, tiotrópio inalado.

Doente e família satisfeitos com os cuidados, embora refiram demora na transferência da urgência para o internamento.

<mark class="fu">Reavaliação em consulta de Pneumologia dentro de 4 semanas</mark>, com radiografia de tórax de controlo. Recomendada vacinação antipneumocócica.`;
export const EXTRACT = [
  ['Diagnóstico principal · CID-10', 'J18.1 · Pneumonia lobar, não especificada'],
  ['Diagnósticos secundários', 'J96.0 Insuf. respiratória aguda · J44.9 DPOC · I48.91 Fibrilhação auricular · E11.9 Diabetes tipo 2'],
  ['Medicação de alta', '4 fármacos · 1 antibiótico com fim previsto a 10/11'],
  ['Seguimento', 'Pneumologia em 4 semanas + RX tórax · Vacina antipneumocócica'],
  ['GDH sugerido', '139 · Outras pneumonias, nível de severidade 3'],
  ['Sentimento do doente', 'Positivo, com uma reclamação: tempo de transferência da urgência']
];
