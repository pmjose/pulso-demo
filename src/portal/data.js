// Fictitious demo data shared by the portal views.
export const C = { teal: '#00acc1', petrol: '#007c8c', sun: '#f5a800', coral: '#e4572e', violet: '#6b5bd2', sky: '#2a9fd6', ok: '#1f9d6b', grey: '#9fb0b6' };

let seed = 42;
export const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));
export const nf = (v, d = 0) => v.toLocaleString('pt-PT', { minimumFractionDigits: d, maximumFractionDigits: d });
export const days = (n, from) => range(n, (i) => { const d = new Date(2026, 10, 11 + from + i); return `${d.getDate()}/${d.getMonth() + 1}`; });
export const MONTHS = ['dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov'];

export const UNITS = ['Hospital da Luz Lisboa', 'Hospital da Luz Torres de Lisboa', 'Hospital da Luz Arrábida', 'Hospital da Luz Coimbra', 'Hospital da Luz Aveiro', 'Hospital da Luz Setúbal', 'Hospital da Luz Oeiras', 'Hospital da Luz Guimarães', 'Hospital da Luz Funchal', 'Hospital do Mar Cuidados Especializados'];

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
    feat: [['Seguimento em atraso', .34], ['Rastreios elegíveis', .25], ['Cobertura do seguro', .16], ['Engagement na app', .15], ['Preferência de canal', .1]], lineage: ['Doente 360°', 'Guidelines clínicas · Cortex Search', 'Cortex AI', 'Recomendação', 'Notificação MY LUZ'] }
];

export const QA = {
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
  'Quanto faturámos à Seguradora A no último trimestre e qual o risco de rejeição?': {
    text: 'No 3.º trimestre de 2026 faturaram-se <b>58,3 M€</b> à Seguradora A (+7,4% homólogo), em 212 480 atos. A taxa de rejeição foi de <b>2,9%</b> (1,69 M€).<br><br>Neste momento há <b>148 episódios por faturar com risco elevado</b> (0,84 M€). O motivo mais comum é a <b>falta de autorização prévia</b> em exames de imagiologia (61%).',
    chart: { labels: ['jul', 'ago', 'set'], data: [19.1, 18.6, 20.6] },
    sql: "SELECT DATE_TRUNC('month', data_fatura) AS mes,\n       SUM(valor) / 1e6 AS faturado_meur,\n       SUM(IFF(rejeitado, valor, 0)) / SUM(valor) AS taxa_rejeicao\nFROM LUZ_ANALYTICS.RECEITA.FATURAS\nWHERE entidade = 'Seguradora A' AND trimestre = '2026-Q3'\nGROUP BY 1 ORDER BY 1;", src: 'Semantic view: Receita e faturação · Modelo: Risco de glosa v7'
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
