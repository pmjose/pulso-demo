// Extra 360° content per person. Every figure here is aligned with the rest of the portal
// (agents, Learning Health, models, timelines). All data is fictitious.

// sources: which systems the insight joins, shown as chips.
export const PATIENT_EXTRA = {
  ana: {
    team: [['Médica assistente', 'Dra. Helena Duarte · Medicina Geral'], ['Endocrinologista', 'Dr. Paulo Simões'], ['Enfermeira de referência', 'Enf.ª Rita Lopes'], ['Hospital habitual', 'HL Lisboa']],
    upcoming: [['Sem marcação', 'Nenhuma consulta nos próximos 90 dias', 'p-bad']],
    insights: [
      ['◈', 'A HbA1c subiu <b>0,8 p.p.</b> desde que suspendeu a Nutrição (out 2025). Em 1 240 doentes semelhantes, quem retomou a Nutrição baixou em média <b>0,6 p.p. em 6 meses</b>.', ['Análises', 'Consultas', 'Coorte Learning Health']],
      ['⌁', 'Os passos diários caíram <b>38%</b> desde o diagnóstico de gonartrose (2024). A dor no joelho pode estar a travar a atividade física e, com ela, o controlo glicémico.', ['App MY LUZ', 'Processo clínico']],
      ['℞', 'A sitagliptina é levantada a cada <b>42 dias</b> em vez de 30 (adesão 71%) e a atorvastatina a 64%. O LDL de 118 mg/dL está acima do alvo de 70.', ['Farmácia', 'Análises']],
      ['€', 'O plafond Multicare está a <b>82%</b>. O rastreio de retinopatia e a consulta de Endocrinologia podem gerar copagamento antes de janeiro: avisar antes de marcar evita uma nova reclamação.', ['Multicare · Clean Room', 'Faturação']],
      ['☺', 'Tem uma reclamação de faturação aberta (46,20 €) e deu NPS 6. Resolver <b>antes</b> da próxima marcação baixa o risco de abandono de 31% para 19%.', ['CRM', 'Agente de reclamações', 'Modelo de abandono']],
    ],
    explainFor: 0,
    shap: [['HbA1c a subir em 3 análises seguidas', .32], ['Nutrição suspensa', .21], ['Queda da atividade física', .17], ['Endocrinologia sem seguimento', .16], ['Adesão à sitagliptina 71%', .14]],
    gaps: [
      ['HbA1c (a cada 3-6 meses)', 'Em dia', 'p-ok', '03/11/2026 · 7,9%'],
      ['Rastreio de retinopatia (anual)', 'Em atraso', 'p-bad', 'Último em 02/2025'],
      ['Exame do pé diabético (anual)', 'Em atraso', 'p-bad', 'Último em 04/2025'],
      ['Microalbuminúria (anual)', 'Em dia', 'p-ok', '05/2026'],
      ['LDL abaixo de 70 mg/dL', 'Fora do alvo', 'p-warn', '118 mg/dL'],
      ['Vacina da gripe 2026/27', 'Por fazer', 'p-warn', 'Sem registo'],
    ],
    projection: { title: 'HbA1c projetada a 12 meses', unit: '%', labels: ['nov 26', 'fev 27', 'mai 27', 'ago 27', 'nov 27'], min: 6.5, max: 9, base: [7.9, 8.1, 8.3, 8.4, 8.6], action: [7.9, 7.6, 7.3, 7.2, 7.1], actionName: 'Com Endocrinologia + Nutrição', target: 7 },
    use: [['Consultas', '6', 'das quais 2 teleconsultas'], ['Análises', '4', ''], ['Urgência', '1', 'triagem amarela'], ['Gasto em 12 meses', '2 410 €', '1 980 € Multicare · 430 € copagamento']],
    app: { name: 'Sessões na app MY LUZ', labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], data: [14, 12, 15, 11, 9, 8] },
  },
  manuel: {
    team: [['Cardiologista', 'Dr. Nuno Teixeira · HL Arrábida'], ['Cirurgião', 'Dr. Afonso Pires · Cirurgia Cardiotorácica'], ['Enfermeira pós-alta', 'Enf.ª Cláudia Reis'], ['Cuidadora', 'Filha · Lisboa (acesso autorizado)']],
    upcoming: [['12/11/2026 10:00', 'Teleconsulta de enfermagem (proposta pelo agente)', 'p-warn'], ['Por marcar', 'Consulta de Cardiologia (prazo 03/12)', 'p-bad'], ['Por iniciar', 'Reabilitação cardíaca (fase II)', 'p-bad']],
    insights: [
      ['⚠', '<b>+1,5 kg em 3 dias</b> na balança ligada e frequência cardíaca em repouso a subir (74 → 79): no grupo, este padrão precede <b>68%</b> das readmissões por insuficiência cardíaca.', ['Dispositivos ligados', 'Coorte HL Arrábida']],
      ['℞', 'A <b>furosemida</b> iniciada na alta ainda não foi levantada (6 dias). Sem diurético, o aumento de peso é esperado.', ['Farmácia', 'Carta de alta']],
      ['⚕', 'Com uma TFG de 46 mL/min, a dose de <b>metformina</b> deve ser revista. A IA sinalizou 2 interações entre os 9 fármacos.', ['Análises', 'Prescrição · Cortex AI']],
      ['⌂', 'Vive sozinho a 14 km e não pode conduzir após a cirurgia: <b>37%</b> de risco de faltar à reabilitação cardíaca. A ADSE comparticipa o transporte.', ['Contexto social', 'Regras ADSE']],
      ['☎', 'A filha abre a app MY LUZ 5 vezes por semana para acompanhar o pai: é o canal mais eficaz para lembretes e alertas.', ['App MY LUZ · acesso de cuidador']],
    ],
    explainFor: 0,
    shap: [['Aumento de peso em 3 dias', .27], ['Diurético não levantado', .21], ['Vive sozinho', .15], ['Índice de Charlson 6', .14], ['9 fármacos', .12], ['Doença renal crónica', .11]],
    gaps: [
      ['Cardiologia 2-4 semanas após alta', 'Por marcar', 'p-bad', 'Prazo: 03/12/2026'],
      ['Reabilitação cardíaca (fase II)', 'Não iniciada', 'p-bad', 'Prescrita na alta'],
      ['Revisão de medicação (≥ 5 fármacos)', 'Pendente', 'p-warn', '9 fármacos · 2 interações'],
      ['Função renal 1-2 semanas após alta', 'Em dia', 'p-ok', '10/11/2026 · TFG 46'],
      ['Vacina da gripe 2026/27', 'Em dia', 'p-ok', '10/2026'],
      ['Telemonitorização', 'Ativa', 'p-ok', 'Balança e tensiómetro'],
    ],
    projection: { title: 'Risco acumulado de readmissão · 30 dias', unit: '%', labels: ['hoje', '+7 d', '+14 d', '+21 d', '+30 d'], min: 0, max: 70, base: [0, 22, 38, 49, 58], action: [0, 8, 14, 19, 23], actionName: 'Com teleconsulta, diurético e reabilitação', target: null },
    use: [['Urgência', '1', 'triagem laranja · 27/10'], ['Internamento', '9 dias', 'bypass coronário triplo'], ['Consultas', '3', 'Cardiologia'], ['Episódio cirúrgico', '18 420 €', 'ADSE · regime convencionado']],
    app: { name: 'Sessões na app (filha, acesso de cuidador)', labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], data: [1, 0, 2, 1, 9, 21] },
  },
  beatriz: {
    team: [['Obstetra', 'Dra. Marta Sequeira · HL Oeiras'], ['Enfermeira especialista', 'Enf.ª Inês Valente · Saúde Materna'], ['Nutricionista', 'Por atribuir'], ['Maternidade prevista', 'HL Lisboa']],
    upcoming: [['18/11/2026 15:30', 'Consulta de Obstetrícia · HL Oeiras', 'p-ok'], ['02/12/2026 09:00', 'Análises · glicemia e hemograma', 'p-ok']],
    insights: [
      ['◈', 'Glicemias em jejum estáveis com dieta (88 mg/dL), mas peso fetal no <b>P85</b>. Uma em cada 4 grávidas do grupo com este perfil precisou de insulina até às 36 semanas.', ['Ecografia', 'Análises', 'Coorte Obstetrícia']],
      ['⌕', 'Nas últimas 2 semanas visitou páginas de maternidades de <b>2 outros grupos</b> e usou o simulador de custos do parto.', ['Website e app', 'Modelo de abandono']],
      ['€', 'O plano Médis cobre o parto no HL Lisboa com copagamento de <b>350 €</b>, mas ainda não consultou esta informação na app.', ['Médis · coberturas', 'App MY LUZ']],
      ['♡', 'Muito envolvida: abre a app 4 vezes por semana e registou todas as glicemias. É candidata ao <b>programa de acompanhamento pediátrico</b> do recém-nascido.', ['App MY LUZ']],
    ],
    explainFor: 2,
    shap: [['Visitas a maternidades de outros grupos', .34], ['Simulador de custos usado', .22], ['Sem visita à maternidade agendada', .18], ['Distância ao HL Lisboa (14 km)', .14], ['Primeira gravidez', .12]],
    gaps: [
      ['Ecografia do 3.º trimestre', 'Em dia', 'p-ok', '06/11/2026'],
      ['Vacina contra a tosse convulsa (20-36 sem.)', 'Por fazer', 'p-warn', 'Janela até às 36 semanas'],
      ['Consulta de Nutrição (diabetes gestacional)', 'Não realizada', 'p-bad', 'Recomendada às 26 semanas'],
      ['Pesquisa de Streptococcus B', 'Agendar', 'p-ml', 'Entre as 35 e as 37 semanas'],
      ['Plano de nascimento', 'Não registado', 'p-warn', 'Disponível na app'],
      ['Visita à maternidade', 'Não agendada', 'p-warn', 'HL Lisboa'],
    ],
    projection: { title: 'Glicemia em jejum projetada até ao parto', unit: ' mg/dL', labels: ['31 s', '33 s', '35 s', '37 s', '39 s'], min: 80, max: 102, base: [88, 91, 94, 97, 99], action: [88, 88, 87, 87, 86], actionName: 'Com consulta de Nutrição', target: 92 },
    use: [['Consultas de Obstetrícia', '7', 'HL Oeiras'], ['Ecografias', '4', ''], ['Análises', '5', ''], ['Parto previsto', '3 640 €', 'Médis · copagamento 350 €']],
    app: { name: 'Sessões na app MY LUZ', labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], data: [6, 9, 12, 15, 17, 18] },
  },
};

// peers: [label, value, peer median, unit, higher is better]
export const EMPLOYEE_EXTRA = {
  joana: {
    insights: [
      ['◷', '<b>63%</b> das horas extra dos últimos 3 meses foram em sextas e sábados à noite, em picos de urgência que o modelo previa com 7 dias de antecedência. Eram planeáveis com a bolsa interna.', ['Escalas', 'Previsão de afluência']],
      ['⇢', 'Nos últimos 2 anos, <b>4 de 11</b> enfermeiros especialistas do HL Lisboa com este padrão (mais de 20 h extra durante 3 meses e um pedido recusado) saíram em menos de 6 meses.', ['RH', 'Modelo de saída']],
      ['★', 'Os doentes dela têm <b>0 quedas</b> em 2026 e NPS de 84 (serviço: 71). Substituir uma enfermeira especialista custa ≈ <b>38 000 €</b> e demora 74 dias.', ['Qualidade clínica', 'Inquéritos', 'RH']],
      ['✎', 'No inquérito de clima de outubro, a equipa de Medicina Interna avaliou o equilíbrio vida-trabalho com <b>2,1 em 5</b> (grupo: 3,4).', ['Inquérito de clima · agregado da equipa']],
      ['⚑', 'A formação em Prevenção de IACS expira em 12 dias. Sem ela, deixa de poder ser escalada para quartos de isolamento, o que aumenta a carga das colegas.', ['Formação', 'Escalas']],
    ],
    peers: [['Horas extra por mês', 22, 11, ' h', false], ['Noites nos últimos 14 dias', 6, 3, '', false], ['Avaliação de desempenho', 4.6, 3.9, '', true], ['NPS dos doentes', 84, 71, '', true], ['Absentismo', 1.2, 4.9, '%', false]],
    load: { title: 'Carga e descanso por semana', labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'], a: ['Noites', [1, 2, 1, 2, 3, 2, 3, 3]], b: ['Descansos < 11 h entre turnos', [0, 1, 0, 2, 1, 2, 3, 2]] },
    career: [['2017', 'Admissão no HL Lisboa · Medicina Interna'], ['2020', 'Especialidade em Enfermagem de Reabilitação'], ['2022', 'Formadora interna de mobilização (23 colegas)'], ['2024', 'Candidata a enfermeira gestora (em lista)'], ['09/2026', 'Pedido de horário fixo recusado']],
    retention: [['Custo de substituição', '≈ 38 000 €'], ['Tempo até contratar', '74 dias'], ['Colegas formadas por ela', '23']],
  },
  ricardo: {
    insights: [
      ['◷', '<b>70%</b> dos atrasos nas cirurgias dele acontecem às quintas-feiras na <b>sala 4</b>, por limpeza e preparação entre cirurgias (34 min vs. 22 nas outras salas). Não é a duração cirúrgica.', ['Registo de bloco', 'Modelo de duração cirúrgica']],
      ['★', 'Nas próteses do joelho tem complicações de <b>1,4%</b> e readmissões de 2,8% (serviço: 2,1% e 4,6%). Os doentes dele ficam 2,9 dias internados vs. 3,6 esperados.', ['Qualidade clínica', 'Modelo de demora média']],
      ['€', 'Os blocos dele geram ≈ <b>2,1 M€</b> por ano na Unidade de Joelho, com margem de 24% (Ortopedia: 18%).', ['Finanças · visível à Direção e RH']],
      ['⌕', 'A lista de espera da Unidade de Joelho tem <b>146 doentes</b> (mediana de 41 dias). Mais um bloco quinzenal reduziria a espera para 29 dias.', ['Marcações', 'Simulação de capacidade']],
      ['🎓', 'É investigador principal do ensaio <b>LH-ORT-024</b> (168 de 200 doentes recrutados) e orienta 3 internos da Católica. A atividade académica é o fator de retenção mais forte neste perfil.', ['Learning Health', 'Modelo de saída']],
    ],
    peers: [['Cirurgias por mês', 38, 29, '', true], ['Atraso vs. duração prevista', 7, 11, ' min', false], ['Cancelamentos', 4.1, 3.2, '%', false], ['Complicações', 1.4, 2.1, '%', false], ['NPS dos doentes', 82, 73, '', true]],
    load: { title: 'Bloco operatório e urgência por semana', labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'], a: ['Horas no bloco', [22, 24, 21, 26, 25, 27, 26, 28]], b: ['Urgências noturnas', [1, 0, 1, 1, 0, 1, 1, 0]] },
    career: [['2012', 'Admissão · Ortopedia HL Lisboa'], ['2016', 'Formação em cirurgia robótica'], ['2019', 'Coordenador da Unidade de Joelho'], ['2023', 'Docente na Católica Medical School'], ['2026', 'Investigador principal · LH-ORT-024']],
    retention: [['Blocos atribuídos', '6 por semana (+1 em 2026)'], ['Internos orientados', '3'], ['Renovação do contrato', '03/2027']],
  },
  sara: {
    insights: [
      ['⇢', 'Vive em <b>Condeixa-a-Nova</b>, a 58 km do HL Leiria e a 12 km do HL Coimbra, que tem 2 vagas de técnico de radiologia. A mobilidade interna evita perder a colaboradora.', ['RH', 'Vagas internas']],
      ['★', 'Taxa de repetição de exames de <b>1,9%</b>, a melhor da Imagiologia do HL Leiria (2,6%), com apenas 8 meses de casa.', ['PACS · qualidade de imagem']],
      ['◷', 'O tempo médio por RM (31 min) está a 1 min do alvo e desceu 6 min desde maio: aprende mais depressa do que 80% dos técnicos admitidos em 2025-26.', ['RIS', 'Coorte de admissões']],
      ['⚑', 'Os 2 protocolos de TC por certificar impedem-na de fazer urgências noturnas de TC. Essa escala depende hoje de apenas 2 técnicos no HL Leiria.', ['Formação', 'Escalas']],
      ['✎', 'O contrato a termo termina em <b>03/2027</b>. Técnicos com desempenho semelhante convertidos para sem termo têm 91% de permanência a 2 anos.', ['RH', 'Modelo de saída']],
    ],
    peers: [['Exames por mês', 412, 380, '', true], ['Tempo médio por RM', 31, 29, ' min', false], ['Repetições de exame', 1.9, 2.4, '%', false], ['Horas extra por mês', 9, 6, ' h', false], ['Absentismo', 0.8, 3.9, '%', false]],
    load: { title: 'Exames e horas extra por semana', labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'], a: ['Exames (dezenas)', [8.6, 9.1, 9.4, 9.0, 10.2, 9.8, 10.4, 10.6]], b: ['Horas extra', [1, 2, 2, 3, 2, 3, 2, 2]] },
    career: [['03/2026', 'Admissão no HL Leiria (abertura da unidade)'], ['04/2026', 'Certificação em RM de próstata'], ['07/2026', 'Período experimental: avaliação excelente'], ['11/2026', 'Integração a 72% (13 de 18 módulos)'], ['03/2027', 'Fim do contrato a termo']],
    retention: [['Fim do contrato', '03/2027'], ['Vagas internas compatíveis', '2 · HL Coimbra'], ['Custo de substituição', '≈ 14 000 €']],
  },
};
