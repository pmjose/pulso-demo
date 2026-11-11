// Analytics content for the decision-support views. All figures are fictitious but reconcile with
// data.js (GROUP, STATS, PAYERS) and with what other views already state.
import { HOSPITALS, STATS, seeded } from './data.js';

// ---------- KPI dictionary (labels match Kpi labels so cards can show definitions) ----------
// [label, domain, definition, formula, owner, sources, semantic view, refresh, quality %, certified]
export const DICTIONARY = [
  ['Ocupação de internamento', 'Operações', 'Percentagem de camas de internamento ocupadas à meia-noite.', 'SUM(camas_ocupadas) / SUM(camas_disponiveis)', 'Direção de Operações', ['Processo clínico · ADT', 'OPERACOES.OCUPACAO_DIARIA'], 'SV_OPERACOES', 'A cada 15 min', 99.6, true],
  ['Ocupação de camas', 'Operações', 'Igual a "Ocupação de internamento", calculada por hospital e serviço.', 'SUM(camas_ocupadas) / SUM(camas_disponiveis)', 'Direção de Operações', ['Processo clínico · ADT', 'OPERACOES.OCUPACAO_DIARIA'], 'SV_OPERACOES', 'A cada 15 min', 99.6, true],
  ['Demora média', 'Operações', 'Média de dias entre admissão e alta, nos episódios de internamento com alta no período.', 'AVG(DATEDIFF(day, data_admissao, data_alta))', 'Direção Clínica', ['Processo clínico · episódios', 'CLINICO.EPISODIOS_INTERNAMENTO'], 'SV_INTERNAMENTOS', 'Diária · 05:00', 99.2, true],
  ['Espera média na urgência', 'Operações', 'Minutos entre a triagem e a primeira observação médica.', 'AVG(DATEDIFF(minute, hora_triagem, hora_1a_observacao))', 'Direção de Urgência', ['Sistema de urgência', 'URGENCIA.EPISODIOS'], 'SV_URGENCIA', 'A cada 5 min', 98.9, true],
  ['Episódios de urgência hoje', 'Operações', 'Número de episódios de urgência admitidos desde as 00:00.', 'COUNT(episodio_id)', 'Direção de Urgência', ['Sistema de urgência', 'URGENCIA.EPISODIOS'], 'SV_URGENCIA', 'A cada 5 min', 99.8, true],
  ['Utilização do bloco', 'Operações', 'Minutos de cirurgia realizados sobre minutos de bloco atribuídos.', 'SUM(min_cirurgia) / SUM(min_atribuidos)', 'Direção do Bloco Operatório', ['Registo de bloco', 'BLOCO.SESSOES'], 'SV_BLOCO', 'Diária · 05:00', 98.4, true],
  ['Cirurgias canceladas', 'Operações', 'Cirurgias programadas canceladas no próprio dia, sobre o total programado.', 'COUNT_IF(cancelada_mesmo_dia) / COUNT(*)', 'Direção do Bloco Operatório', ['Registo de bloco', 'BLOCO.CIRURGIAS'], 'SV_BLOCO', 'Diária · 05:00', 97.9, true],
  ['Taxa de faltas', 'Ambulatório', 'Consultas marcadas a que o doente não compareceu, sem desmarcação prévia.', 'COUNT_IF(estado = \'falta\') / COUNT(*)', 'Direção de Ambulatório', ['Agendas', 'AMBULATORIO.MARCACOES'], 'SV_AMBULATORIO', 'Diária · 05:00', 99.4, true],
  ['Tempo até 1.ª consulta', 'Ambulatório', 'Dias entre o pedido e a data da primeira consulta da especialidade.', 'MEDIAN(DATEDIFF(day, data_pedido, data_consulta))', 'Direção de Ambulatório', ['Agendas', 'AMBULATORIO.MARCACOES'], 'SV_AMBULATORIO', 'Diária · 05:00', 98.7, true],
  ['Teleconsultas', 'Ambulatório', 'Teleconsultas (Hospital da Luz Digital e LUZ 24) sobre o total de consultas.', 'COUNT_IF(tipo = \'tele\') / COUNT(*)', 'Direção Digital', ['Agendas', 'Plataforma de videoconsulta'], 'SV_AMBULATORIO', 'Diária · 05:00', 99.1, true],
  ['Prazo médio de recebimento', 'Finanças', 'Dias médios entre a emissão da fatura e o recebimento, ponderados pelo valor.', 'SUM(valor * dias_ate_pagamento) / SUM(valor)', 'Direção Financeira', ['ERP · contas a receber', 'FINANCAS.RECEBIMENTOS'], 'SV_RECEITA', 'Diária · 06:00', 99.7, true],
  ['Taxa de rejeição', 'Finanças', 'Valor de faturas rejeitadas pela entidade sobre o valor faturado.', 'SUM(valor_rejeitado) / SUM(valor_faturado)', 'Direção Financeira', ['Faturação', 'RECEITA.FATURAS'], 'SV_RECEITA', 'Diária · 06:00', 99.3, true],
  ['Margem operacional', 'Finanças', 'EBITDA sobre receita, por hospital ou ponderado por camas no grupo.', '(receita - custos_operacionais) / receita', 'Direção Financeira', ['ERP · contabilidade analítica', 'FINANCAS.RESULTADOS'], 'SV_FINANCAS', 'Mensal · dia 3', 99.9, true],
  ['Receita por episódio', 'Finanças', 'Receita faturada sobre o número de episódios com faturação no período.', 'SUM(valor_faturado) / COUNT(DISTINCT episodio_id)', 'Direção Financeira', ['Faturação', 'RECEITA.FATURAS'], 'SV_RECEITA', 'Diária · 06:00', 99.3, true],
  ['Custo por episódio', 'Finanças', 'Custos diretos e indiretos alocados ao episódio pela contabilidade analítica.', 'SUM(custo_alocado) / COUNT(DISTINCT episodio_id)', 'Direção Financeira', ['ERP · contabilidade analítica', 'FINANCAS.CUSTOS_EPISODIO'], 'SV_FINANCAS', 'Mensal · dia 3', 97.8, false],
  ['Readmissões a 30 dias', 'Qualidade', 'Internamentos não programados até 30 dias após uma alta, sobre o total de altas.', 'COUNT(readmissao_30d) / COUNT(altas)', 'Gabinete de Qualidade', ['Processo clínico · episódios', 'QUALIDADE.READMISSOES'], 'SV_QUALIDADE', 'Diária · 05:00', 99.0, true],
  ['Infeção hospitalar (IACS)', 'Qualidade', 'Prevalência de infeções associadas aos cuidados de saúde no estudo de ponto.', 'COUNT(doentes_com_IACS) / COUNT(doentes_internados)', 'Comissão de Controlo de Infeção', ['Registo de IACS', 'QUALIDADE.IACS'], 'SV_QUALIDADE', 'Semanal', 96.4, true],
  ['Índice de mortalidade (O/E)', 'Qualidade', 'Mortalidade observada sobre a esperada para o case-mix (ajustada ao risco).', 'SUM(obitos) / SUM(prob_obito_esperada)', 'Gabinete de Qualidade', ['Processo clínico', 'Modelo de risco ajustado'], 'SV_QUALIDADE', 'Mensal', 98.1, true],
  ['Complicações cirúrgicas', 'Qualidade', 'Episódios cirúrgicos com pelo menos uma complicação registada até 30 dias.', 'COUNT_IF(complicacao_30d) / COUNT(*)', 'Gabinete de Qualidade', ['Registo de bloco', 'Notas clínicas · Cortex AI'], 'SV_QUALIDADE', 'Diária · 05:00', 95.9, false],
  ['NPS', 'Experiência', 'Net Promoter Score dos inquéritos pós-episódio (promotores menos detratores).', '%(nota 9-10) - %(nota 0-6)', 'Direção de Experiência do Cliente', ['App MY LUZ', 'Inquéritos SMS'], 'SV_EXPERIENCIA', 'Diária · 06:00', 99.5, true],
  ['Absentismo', 'Pessoas', 'Horas de ausência não planeada sobre horas contratadas.', 'SUM(horas_ausencia) / SUM(horas_contratadas)', 'Direção de Recursos Humanos', ['Sistema de RH e assiduidade', 'RH.ASSIDUIDADE'], 'SV_PESSOAS', 'Diária · 04:00', 99.2, true],
  ['Horas extra (mês)', 'Pessoas', 'Horas trabalhadas para além do horário contratado no mês corrente.', 'SUM(horas_extra)', 'Direção de Recursos Humanos', ['Sistema de RH e assiduidade', 'RH.ESCALAS'], 'SV_PESSOAS', 'Diária · 04:00', 98.8, true],
  ['Profissionais por cama', 'Pessoas', 'Colaboradores (equivalente a tempo inteiro) por cama disponível.', 'SUM(ETI) / SUM(camas)', 'Direção de Recursos Humanos', ['Sistema de RH', 'OPERACOES.CAMAS'], 'SV_PESSOAS', 'Mensal', 99.6, true],
  ['Receita acumulada 2026', 'Finanças', 'Receita reconhecida de janeiro até ao último fecho mensal.', 'SUM(receita) WHERE ano = 2026', 'Direção Financeira', ['ERP · contabilidade', 'FINANCAS.RESULTADOS'], 'SV_FINANCAS', 'Mensal · dia 3', 99.9, true],
].map(([label, domain, definition, formula, owner, sources, sv, refresh, quality, certified]) => ({ label, domain, definition, formula, owner, sources, sv, refresh, quality, certified }));
export const DICT_BY_LABEL = Object.fromEntries(DICTIONARY.map((d) => [d.label, d]));

// ---------- variance: revenue bridge YTD (Jan-Oct), M€ ----------
export const BRIDGE = [
  { label: 'Jan-out 2025', value: 697.6, total: true }, { label: 'Volume', value: 31.4 }, { label: 'Preço', value: 17.9 },
  { label: 'Mix', value: 9.8 }, { label: 'Novas unidades', value: 6.1 }, { label: 'Rejeições e cancelamentos', value: -6.6 }, { label: 'Jan-out 2026', value: 756.2, total: true },
];
// Volume here includes new units and losses, so columns add up to the bridge (30,9 + 17,9 + 9,8 = 58,6).
export const BRIDGE_BY_PAYER = [
  ['Multicare (Fidelidade)', 10.0, 7.6, 3.8], ['Médis', 3.9, 2.9, 1.3], ['AdvanceCare', 2.6, 1.7, 0.9], ['Outras seguradoras', 1.0, 0.6, 0.4],
  ['ADSE e subsistemas', 5.7, 1.3, 0.9], ['SNS (convenções)', 1.7, -0.3, 0.2], ['Particulares', 6.0, 4.1, 2.3],
];
export const ROOT_CAUSES = {
  occ: { name: 'Ocupação · HL Lisboa', unit: ' p.p.', from: ['Semana anterior', 88.4], to: ['Esta semana', 91.2], drivers: [['Medicina Interna (respiratórios)', 1.4], ['Doentes com mais de 80 anos', 0.7], ['Altas sociais em espera', 0.5], ['Cirurgia com internamento', 0.4], ['Transferências para o Hospital do Mar', -0.2]] },
  alos: { name: 'Demora média · Ortopedia', unit: ' d', from: ['Outubro', 3.4], to: ['Novembro', 4.1], drivers: [['Fraturas do colo do fémur (> 80 anos)', 0.38], ['Altas sociais (vaga em continuados)', 0.21], ['Menos fisioterapia ao fim de semana', 0.14], ['Outros', -0.03]] },
  dso: { name: 'Prazo médio de recebimento', unit: ' d', from: ['Julho', 52], to: ['Outubro', 47], drivers: [['Autorizações automáticas Multicare', -2.6], ['Faturação semanal ADSE', -1.9], ['Menos rejeições (agente)', -1.4], ['Atrasos nas convenções SNS', 0.9]] },
  nps: { name: 'NPS do grupo', unit: '', from: ['3.º trimestre', 68], to: ['Outubro-novembro', 71], drivers: [['Check-in digital MY LUZ', 1.6], ['Resposta a reclamações em 24 h', 1.2], ['Espera na urgência', 0.9], ['Faturação pouco clara', -0.7]] },
};
export const ANOMALIES = [
  ['07:02', 'Taxa de faltas', 'HL Setúbal', '11,8% vs. 7,9% esperado', 'p-bad', 'Alta', 'ambulatorio'],
  ['06:48', 'Taxa de rejeição · AdvanceCare', 'Grupo', '4,9% vs. 3,1% esperado', 'p-bad', 'Alta', 'receita'],
  ['06:30', 'Espera · triagem laranja', 'HL Arrábida', '14 min vs. alvo de 10', 'p-bad', 'Alta', 'operacoes'],
  ['06:15', 'Consumo de contraste iodado', 'HL Lisboa', '+34% vs. previsão', 'p-warn', 'Média', 'stocks'],
  ['05:40', 'Ocupação', 'HL Leiria', '68,5% vs. 71,5% do plano de abertura', 'p-warn', 'Média', 'novas'],
  ['05:12', 'Frescura · faturação', 'Plataforma', 'Atualizado com 38 min de atraso', 'p-ml', 'Baixa', 'plataforma'],
];

// ---------- benchmarking ----------
// key, label, unit, lower is better, national reference
export const BENCH = [
  ['alosAdj', 'Demora média ajustada ao case-mix', ' d', true, 4.6], ['readm', 'Readmissões a 30 dias', '%', true, 8.1], ['iacs', 'Infeção hospitalar (IACS)', '%', true, 5.0],
  ['moe', 'Índice de mortalidade (O/E)', '', true, 1.0], ['compl', 'Complicações cirúrgicas', '%', true, 2.6], ['orUtil', 'Utilização do bloco', '%', false, 78],
  ['orCancel', 'Cirurgias canceladas', '%', true, 5.0], ['noShow', 'Taxa de faltas', '%', true, 9.5], ['nps', 'NPS', '', false, 62], ['margin', 'Margem operacional', '%', false, 12],
];
export const CMI = Object.fromEntries(HOSPITALS.map((h) => { const r = seeded('cmi' + h.name); return [h.name, h.flagship ? 1.24 : 0.86 + r() * .3]; }));
export const benchValue = (h, key) => (key === 'alosAdj' ? STATS[h.name].alos / CMI[h.name] : STATS[h.name][key]);
export const ACUTE = HOSPITALS.filter((h) => !h.name.includes('Mar')); // continuing care is not comparable

// ---------- service lines ----------
export const SERVICE_LINES = {
  onco: {
    name: 'Oncologia', kpis: [['Doentes em tratamento ativo', '3 840', '▲ 7% homólogo', 'up'], ['Diagnóstico → 1.º tratamento', '16 dias', 'mediana · alvo 21', 'up'], ['Sessões de hospital de dia (mês)', '6 120', 'cadeirões a 87%', 'neu'], ['Casos em reunião multidisciplinar', '94%', 'alvo 95%', 'down']],
    chartA: { title: 'Tempo do diagnóstico ao 1.º tratamento', sub: 'Mediana em dias, por tipo de tumor · alvo 21 dias', type: 'bars', opts: { unit: ' d', items: [['Mama', 13], ['Pulmão', 19], ['Colorretal', 17], ['Próstata', 24], ['Hematológico', 9], ['Cabeça e pescoço', 23]].map(([l, v]) => ({ label: l, value: v, target: 21, color: v > 21 ? '#e4572e' : '#00acc1' })) }, ai: { action: 'Abrir uma via rápida de biópsia e estadiamento para próstata e cabeça e pescoço, os dois acima do alvo.', impact: 'Trazer ambos para 21 dias abrange ≈ 420 doentes por ano e reduz a fuga para outros centros.' } },
    chartB: { title: 'Sessões de hospital de dia', sub: 'Por mês', type: 'columns', opts: { labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], series: [{ name: 'Sessões', color: '#6b5bd2', data: [5640, 5710, 5280, 5890, 6040, 6120] }] }, ai: { action: 'Alargar o horário dos cadeirões até às 21h no HL Lisboa nos dias de maior procura.', impact: 'Mais 14% de capacidade sem novos cadeirões; espera para início de quimioterapia −3 dias.' } },
  },
  mat: {
    name: 'Maternidade', kpis: [['Partos (ano)', '4 940', '▲ 4% homólogo', 'up'], ['Taxa de cesarianas', '54,2%', '▼ 3,1 p.p. homólogo', 'up'], ['Analgesia epidural', '81%', 'dos partos vaginais', 'neu'], ['NPS da maternidade', '88', 'o mais alto do grupo', 'up']],
    chartA: { title: 'Taxa de cesarianas', sub: 'Últimos 12 meses · alvo interno 50%', type: 'line', opts: { labels: ['dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov'], unit: '%', min: 45, max: 62, series: [{ name: 'Cesarianas', color: '#e4572e', data: [57.3, 57.0, 56.6, 56.1, 55.9, 55.6, 55.1, 54.9, 54.8, 54.5, 54.4, 54.2] }, { name: 'Alvo interno (50%)', color: '#9fb0b6', width: 1, data: Array(12).fill(50) }] }, ai: { action: 'Rever as cesarianas eletivas sem indicação clínica com as equipas de Obstetrícia, hospital a hospital.', impact: 'Cada ponto percentual a menos representa ≈ 50 cirurgias por ano e menos 2 dias de internamento em média.' } },
    chartB: { title: 'Partos por hospital', sub: 'Acumulado de 2026', type: 'bars', opts: { items: [['HL Lisboa', 1980], ['HL Arrábida', 1120], ['HL Setúbal', 640], ['HL Coimbra', 520], ['HL Funchal', 410]].map(([l, v]) => ({ label: l, value: v, color: '#f5a800' })) }, ai: { action: 'Promover a visita à maternidade e o plano de nascimento na app junto das grávidas em vigilância no grupo.', impact: 'Fidelizar mais 5% das grávidas acompanhadas acrescenta ≈ 250 partos por ano.' } },
  },
  img: {
    name: 'Imagiologia', kpis: [['Exames este mês', '96 400', '▲ 9% homólogo', 'up'], ['Tempo até relatório', '18 h', 'mediana · urgente 42 min', 'neu'], ['Utilização de RM', '86%', 'alvo 85%', 'up'], ['Repetições de exame', '2,4%', 'alvo < 3%', 'up']],
    chartA: { title: 'Exames por modalidade', sub: 'Este mês', type: 'columns', opts: { labels: ['RX', 'Ecografia', 'TC', 'RM', 'Mamografia', 'PET-CT'], series: [{ name: 'Exames', color: '#2a9fd6', data: [41200, 23800, 14100, 10900, 5600, 800] }] }, ai: { action: 'Usar a triagem de RX de tórax por IA para priorizar a leitura no RX, a modalidade com mais volume.', impact: 'Achados urgentes lidos 38 min mais cedo em ≈ 41 mil exames por mês.' } },
    chartB: { title: 'Tempo até relatório por modalidade', sub: 'Mediana em horas · alvo 24 h', type: 'bars', opts: { unit: ' h', items: [['RX', 9], ['Ecografia', 2], ['TC', 21], ['RM', 31], ['Mamografia', 26], ['PET-CT', 38]].map(([l, v]) => ({ label: l, value: v, target: 24, color: v > 24 ? '#e4572e' : '#00acc1' })) }, ai: { action: 'Distribuir a leitura de RM e PET-CT entre hospitais com telerradiologia interna.', impact: 'Baixa a RM de 31 h para menos de 24 h sem novos radiologistas.' } },
  },
  reab: {
    name: 'Reabilitação', kpis: [['Sessões este mês', '38 200', '▲ 5% homólogo', 'up'], ['Ganho funcional (Barthel)', '+18 pontos', 'média por plano', 'up'], ['Abandono do plano', '11%', 'alvo < 8%', 'down'], ['Sessões em casa (tele)', '9%', '▲ 3 p.p.', 'up']],
    chartA: { title: 'Sessões por área', sub: 'Este mês', type: 'bars', opts: { items: [['Ortopédica', 14200], ['Neurológica', 8600], ['Cardíaca', 4100], ['Respiratória', 3900], ['Pediátrica', 3800], ['Pavimento pélvico', 3600]].map(([l, v]) => ({ label: l, value: v, color: '#1f9d6b' })) }, ai: { action: 'Oferecer transporte e sessões por telerreabilitação aos doentes cardíacos com mais de 70 anos.', impact: 'Reduz o abandono na reabilitação cardíaca de 19% para ≈ 10%, com menos readmissões.' } },
    chartB: { title: 'Abandono do plano de reabilitação', sub: 'Por mês · alvo 8%', type: 'line', opts: { labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], unit: '%', min: 0, max: 16, series: [{ name: 'Abandono', color: '#e4572e', data: [12.6, 13.1, 14.2, 11.8, 11.3, 11.0] }, { name: 'Alvo (8%)', color: '#9fb0b6', width: 1, data: Array(6).fill(8) }] }, ai: { action: 'Ligar automaticamente aos doentes que faltam a 2 sessões seguidas.', impact: 'Dois em cada três abandonos começam com 2 faltas seguidas: −3 p.p. de abandono.' } },
  },
};

// ---------- patient journey ----------
export const PATHWAYS = {
  orto: { name: 'Ortopedia · joelho e anca', stages: [['Primeiras consultas', 18400], ['Exames de imagem', 14900], ['Proposta cirúrgica', 5120], ['Cirurgia marcada', 4210], ['Cirurgia realizada', 3980]], leak: 'Das 910 propostas cirúrgicas não marcadas, 41% foram operadas noutro prestador em 6 meses (Clean Room com a Fidelidade).', top: 'Proposta cirúrgica → cirurgia marcada (−18%)' },
  cardio: { name: 'Cardiologia · doença coronária', stages: [['Primeiras consultas', 9600], ['Prova de esforço ou angio-TC', 6900], ['Cateterismo proposto', 2140], ['Cateterismo realizado', 1980], ['Reabilitação cardíaca iniciada', 1210]], leak: '39% dos doentes não iniciam a reabilitação cardíaca após o procedimento; a maioria vive a mais de 10 km do hospital.', top: 'Procedimento → reabilitação (−39%)' },
  mama: { name: 'Oncologia · cancro da mama', stages: [['Rastreio (mamografia)', 22800], ['Achado suspeito', 1460], ['Biópsia', 1310], ['Diagnóstico confirmado', 412], ['Tratamento iniciado no grupo', 371]], leak: '10% das doentes com diagnóstico confirmado iniciam o tratamento fora do grupo; 7 em 10 por proximidade de casa.', top: 'Diagnóstico → tratamento no grupo (−10%)' },
};
export const WAITING = [
  ['Ortopedia', 612, 38, 30], ['Oftalmologia', 488, 26, 30], ['Cirurgia Geral', 341, 22, 30], ['Urologia', 276, 34, 30], ['Otorrinolaringologia', 198, 29, 30], ['Ginecologia', 164, 19, 30], ['Cirurgia Plástica', 121, 47, 60],
];
export const CLINIC_HUB = { Lisboa: 'HL Lisboa', Sul: 'HL Setúbal', Norte: 'HL Arrábida', Centro: 'HL Coimbra', Madeira: 'HL Funchal' };

// ---------- commercial and digital ----------
export const MYLUZ_FUNNEL = [['Instalações da app', 2.3], ['Contas registadas', 1.9], ['Utilizadores ativos (12 meses)', 1.6], ['Marcaram pela app', 0.98], ['Check-in digital', 0.72]];
export const CAMPAIGNS = [
  ['Seguimento de diabéticos sem consulta há 6 meses', 'App + email', '4 120', '—', '—', 'p-ml', 'Rascunho'],
  ['Rastreio do cancro da mama (50-69 anos)', 'App + SMS', '38 400', '24,1%', '9 254 marcações', 'p-ok', 'Ativa'],
  ['Vacina da gripe 65+', 'App + SMS', '61 200', '31,7%', '19 400 vacinas', 'p-ok', 'Ativa'],
  ['Renovação LUZ ON PRIME', 'App', '52 300', '68,0%', '35 564 renovações', 'p-ok', 'Concluída'],
  ['Check-up anual empresas', 'Email', '12 800', '8,6%', '1 101 marcações', 'p-warn', 'Abaixo do previsto'],
];
export const ACQUISITION = [['Rede da seguradora', 38, '#00acc1'], ['Pesquisa na web', 21, '#2a9fd6'], ['App MY LUZ', 17, '#6b5bd2'], ['Referência médica', 14, '#f5a800'], ['Protocolos com empresas', 10, '#9fb0b6']];

// ---------- assets and procurement ----------
export const ASSETS = [
  ['RM 3T', 'HL Lisboa', 98, 112, 41, 2], ['RM 1,5T', 'HL Arrábida', 84, 100, 33, 6], ['TC 128 cortes', 'HL Lisboa', 101, 120, 96, 1], ['TC 64 cortes', 'HL Leiria', 43, 80, 31, 0],
  ['PET-CT', 'HL Lisboa', 46, 60, 26, 4], ['Angiógrafo', 'HL Arrábida', 52, 70, 9, 3], ['Robô cirúrgico', 'HL Lisboa', 34, 48, 4, 0], ['Acelerador linear', 'HL Lisboa', 61, 70, 58, 5],
].map(([eq, h, used, avail, perDay, down]) => ({ eq, h, used, avail, perDay, down, util: used / avail * 100 }));
export const SPEND = [['Medicamentos', 34, '#6b5bd2'], ['Dispositivos e implantes', 27, '#00acc1'], ['Material de consumo', 18, '#2a9fd6'], ['Serviços', 13, '#f5a800'], ['Equipamento', 8, '#9fb0b6']];
export const PRICE_GAPS = [
  ['Prótese total da anca cimentada', 'un.', 1840, 2310, 'HL Setúbal', 'HL Lisboa', 1260],
  ['Stent farmacológico', 'un.', 410, 495, 'HL Arrábida', 'HL Coimbra', 2140],
  ['Contraste iodado 350 (100 ml)', 'un.', 18.2, 23.9, 'HL Lisboa', 'HL Funchal', 46800],
  ['Luvas de nitrilo (caixa de 100)', 'cx.', 4.1, 5.6, 'HL Coimbra', 'HL Oeiras', 61200],
  ['Kit de cateter venoso central', 'un.', 31, 38, 'HL Lisboa', 'HL Leiria', 7900],
].map(([item, u, min, max, best, worst, qty]) => ({ item, u, min, max, best, worst, qty, saving: (max - min) * qty * 0.6 }));

// ---------- ESG ----------
export const ESG = {
  emissions: { labels: ['2022', '2023', '2024', '2025', '2026 (prev.)'], data: [48.9, 46.1, 43.8, 41.2, 38.6], target2030: 28.4 },
  intensity: HOSPITALS.filter((h) => !h.name.includes('Mar')).slice(0, 10).map((h) => { const r = seeded('esg' + h.name); return [h.short, Math.round(92 + r() * 46 + (h.isNew ? -14 : 0))]; }),
};

// ---------- new units ramp-up (Leiria opened 03/2026, as in Sara Nunes' profile) ----------
export const NEW_UNITS = [
  { name: 'Hospital da Luz Aveiro', short: 'HL Aveiro', opened: '10/2025', months: 13, consultPlan: 5400, staffPlan: 310, staff: 296, breakEven: '03/2027' },
  { name: 'Hospital da Luz Leiria', short: 'HL Leiria', opened: '03/2026', months: 8, consultPlan: 4200, staffPlan: 240, staff: 221, breakEven: '11/2027' },
  { name: 'Hospital da Luz Santarém', short: 'HL Santarém', opened: '06/2026', months: 5, consultPlan: 3400, staffPlan: 205, staff: 198, breakEven: '06/2028' },
  { name: 'Hospital da Luz Figueira da Foz', short: 'HL Figueira da Foz', opened: '09/2026', months: 2, consultPlan: 2600, staffPlan: 170, staff: 151, breakEven: '12/2028' },
];
export const rampPlan = (m) => 30 + 52 * (1 - Math.exp(-m / 5)); // planned occupancy % by month since opening

// ---------- planning ----------
export const PLAN = { revenue2025: 807, budget2026: 868, forecast2026: 875, ytdBudget: 748.0, ytdActual: 756.2 };
export const MONTHLY_2026 = { actual: [71.2, 72.8, 77.9, 75.4, 78.6, 76.1, 74.3, 66.9, 79.2, 83.8], budget: [70.8, 72.1, 76.4, 74.6, 77.2, 75.0, 73.2, 66.0, 78.4, 84.3, 61.6, 58.4], forecast: [62.4, 56.4] };
export const growth2026 = (h) => { const r = seeded('g26' + h.name); return h.isNew ? 0.28 + r() * 0.2 : 0.045 + r() * 0.06; };
