// Predefined copilot questions and answers per page, tab or selected person.
// Figures come from the same modules the pages use, so answers match the screen.
import { C, GROUP, HOSPITALS, MODELS, PAYERS, STATS, nf } from './data.js';
import { BENCH, BRIDGE, DICTIONARY, MONTHLY_2026, PLAN, ROOT_CAUSES, WAITING } from './analytics.js';
import { SEED_ACTIONS } from './views/Work.jsx';
import { RECOVERY, ROOMS, TEAM, TOMORROW, TREND, TURNOVER, PREOP, hhmm } from './surgeryData.js';

const A = (steps, html, chart, sources, follow = []) => ({ steps, html, chart, sources, follow });
const ACUTE = HOSPITALS.filter((h) => !h.name.includes('Mar'));

const PAGES = {
  inicio: () => [
    { q: 'O que preciso de decidir hoje?', a: A(['Ler o plano de ações e os alertas abertos', 'Filtrar decisões que dependem de mim', 'Ordenar por impacto e prazo'],
      'Há <b>3 decisões</b> à sua espera hoje:<br><br>1. <b>Plano de contingência para a frente fria</b> de sexta-feira: 22 altas antecipadas, 6 transferências para o Hospital do Mar e reforço de escalas (prazo: amanhã).<br>2. <b>Plano operatório de quinta-feira</b>: o otimizador resolveu o conflito do robô e retira 55 min de horas extra à Sala 4.<br>3. <b>Reunião com a AdvanceCare</b>: a taxa de rejeição está em 4,9% (esperado 3,1%).',
      null, ['Plano de ações', 'Agentes IA', 'Anomalias de hoje'], ['Como está o grupo face ao orçamento?', 'Porque está a ocupação a subir?']) },
    { q: 'Como está o grupo face ao orçamento?', a: A(['Consultar a semantic view SV_FINANCAS', 'Comparar real, orçamento e previsão de 2026', 'Calcular o desvio acumulado'],
      `A receita acumulada até outubro é de <b>${nf(PLAN.ytdActual, 1)} M€</b>, ${nf((PLAN.ytdActual / PLAN.ytdBudget - 1) * 100, 1)}% acima do orçamento (${nf(PLAN.ytdBudget, 1)} M€). A previsão de fecho é de <b>${PLAN.forecast2026} M€</b>, ${PLAN.forecast2026 - PLAN.budget2026} M€ acima do orçamento anual.<br><br>Outubro ficou 0,6% abaixo do orçamento do mês; novembro e dezembro são sazonalmente mais fracos.`,
      { type: 'line', opts: { labels: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out'], min: 60, max: 90, series: [{ name: 'Real', color: C.teal, data: MONTHLY_2026.actual, area: true }, { name: 'Orçamento', color: C.grey, data: MONTHLY_2026.budget.slice(0, 10) }] } },
      ['SV_FINANCAS', 'ERP · contabilidade'], ['O que explica o crescimento da receita?']) },
  ],
  'visao-geral': () => [
    { q: 'Porque está a ocupação a subir?', a: A(['Ler a ocupação dos 15 hospitais', 'Identificar o hospital com maior variação', 'Decompor a variação por fator'],
      `A subida concentra-se no <b>HL Lisboa</b>: de ${nf(ROOT_CAUSES.occ.from[1], 1)}% para ${nf(ROOT_CAUSES.occ.to[1], 1)}% numa semana. O maior fator é <b>Medicina Interna</b> com doentes respiratórios (+1,4 p.p.), seguido de doentes com mais de 80 anos (+0,7) e altas sociais em espera (+0,5).<br><br>A previsão aponta para 93,1% na sexta-feira, acima do limite de 92%.`,
      { type: 'waterfall', opts: { unit: ' p.p.', min: 86, items: [{ label: 'Semana anterior', value: ROOT_CAUSES.occ.from[1], total: true }, ...ROOT_CAUSES.occ.drivers.map(([l, v]) => ({ label: l.split(' (')[0].slice(0, 18), value: v })), { label: 'Esta semana', value: ROOT_CAUSES.occ.to[1], total: true }], upColor: C.coral, downColor: C.ok } },
      ['SV_OPERACOES', 'Análise de contribuição'], ['Que hospitais precisam de atenção hoje?']) },
    { q: 'Que hospitais precisam de atenção hoje?', a: (() => {
      const hot = ACUTE.map((h) => [h, STATS[h.name]]).filter(([, s]) => s.occ > 90 || s.erWait > 45).sort((a, b) => b[1].occ - a[1].occ);
      return A(['Ler ocupação e espera na urgência por hospital', 'Aplicar limites: ocupação > 90% ou espera > 45 min', 'Ordenar por gravidade'],
        `${hot.length} hospitais ultrapassam um dos limites hoje: ${hot.map(([h, s]) => `<b>${h.short}</b> (${nf(s.occ, 1)}%, ${nf(s.erWait)} min)`).join(', ')}.<br><br>O HL Lisboa é o único com os dois indicadores acima do limite.`,
        { type: 'bars', opts: { unit: '%', items: hot.map(([h, s]) => ({ label: h.short, value: +s.occ.toFixed(1), target: 92, color: s.occ > 92 ? C.coral : C.sun })) } },
        ['SV_OPERACOES', 'SV_URGENCIA'], ['Porque está a ocupação a subir?']);
    })() },
  ],
  receita: () => [
    { q: 'Que pagador demora mais a pagar?', a: A(['Consultar contas a receber por entidade', 'Ponderar o prazo pelo valor faturado'],
      `O <b>SNS</b> é o mais lento (${PAYERS.find((p) => p.short === 'SNS').dso} dias), seguido da <b>ADSE</b> (${PAYERS.find((p) => p.short === 'ADSE').dso} dias). A Multicare, o maior pagador (31% da receita), paga em ${PAYERS[0].dso} dias.<br><br>Baixar o SNS de 96 para 70 dias libertaria ≈ 3,8 M€ de fundo de maneio.`,
      { type: 'bars', opts: { unit: ' d', items: [...PAYERS].sort((a, b) => b.dso - a.dso).map((p) => ({ label: p.short, value: p.dso, color: p.dso > 60 ? C.coral : C.teal })) } },
      ['SV_RECEITA', 'ERP · contas a receber'], ['Porque está a AdvanceCare a rejeitar mais?']) },
    { q: 'Porque está a AdvanceCare a rejeitar mais?', a: A(['Ler as respostas de rejeição dos últimos 7 dias', 'Classificar os motivos com AI_CLASSIFY', 'Comparar com o padrão habitual'],
      'A taxa de rejeição da <b>AdvanceCare</b> subiu para 4,9% esta semana (esperado 3,1%). <b>58%</b> das rejeições são por <b>autorização prévia em falta</b> em exames de imagiologia, depois de a AdvanceCare ter alterado a lista de exames que exigem autorização a 1 de novembro.<br><br>Recomendo atualizar as regras do agente de autorizações prévias com a nova lista.',
      { type: 'donut', opts: { center: '4,9%', centerLabel: 'rejeição', items: [{ label: 'Autorização prévia em falta', value: 58, color: C.coral }, { label: 'Código de ato', value: 19, color: C.sun }, { label: 'Fora da cobertura', value: 14, color: C.violet }, { label: 'Outros', value: 9, color: C.grey }] } },
      ['Respostas das seguradoras · AI_CLASSIFY', 'SV_RECEITA'], ['Que pagador demora mais a pagar?']) },
  ],
  variacao: () => [
    { q: 'O que explica o crescimento da receita?', a: A(['Ler a ponte da receita jan-out', 'Separar volume, preço, mix e perdas'],
      `A receita cresceu <b>58,6 M€</b> (+8,4%): <b>volume</b> +31,4 M€ (mais episódios), <b>preço</b> +17,9 M€ (tabelas de 2026), <b>mix</b> +9,8 M€ (mais cirurgia e oncologia) e <b>novas unidades</b> +6,1 M€. Rejeições e cancelamentos retiraram 6,6 M€.`,
      { type: 'waterfall', opts: { unit: ' M€', min: 660, items: BRIDGE } }, ['SV_FINANCAS', 'Faturação'], ['Vamos cumprir o orçamento?']) },
  ],
  planeamento: () => [
    { q: 'Vamos cumprir o orçamento?', a: A(['Ler a previsão de fecho do modelo', 'Comparar com o orçamento anual'],
      `Sim. A previsão de fecho é de <b>${PLAN.forecast2026} M€</b> contra um orçamento de ${PLAN.budget2026} M€ (+${nf((PLAN.forecast2026 / PLAN.budget2026 - 1) * 100, 1)}%). O risco está em dezembro: cada semana de bloco completo vale ≈ 3,4 M€.`,
      { type: 'columns', opts: { labels: ['2025', 'Orçamento 2026', 'Previsão 2026'], series: [{ name: 'M€', color: C.teal, data: [PLAN.revenue2025, PLAN.budget2026, PLAN.forecast2026] }] } }, ['SV_FINANCAS', 'Modelo de previsão de fecho']) },
  ],
  qualidade: () => [
    { q: 'Como comparamos com a referência nacional?', a: A(['Ler os indicadores de qualidade do grupo', 'Comparar com as referências nacionais'],
      'O grupo está melhor do que a referência nacional em todos os indicadores principais: readmissões a 30 dias em <b>6,8%</b> (referência 8,1%), infeção hospitalar em <b>3,1%</b> (5,0%) e índice de mortalidade ajustada abaixo de 1.',
      { type: 'columns', opts: { labels: ['Readmissões', 'IACS', 'Complicações'], series: [{ name: 'Grupo', color: C.teal, data: [6.8, 3.1, 2.4] }, { name: 'Referência nacional', color: C.grey, data: [8.1, 5.0, 2.6] }] } }, ['SV_QUALIDADE']) },
  ],
  sinais: () => [
    { q: 'Que sinal externo antecipa melhor a urgência?', a: A(['Analisar 1 287 combinações de sinal, métrica e desfasamento', 'Excluir relações confundidas', 'Ordenar por correlação'],
      'O sinal mais útil é <b>vírus respiratórios nas águas residuais</b> (INSA): correlação de <b>0,88</b> com a urgência respiratória, <b>9 dias</b> antes. Antecipa o pico mais cedo do que as pesquisas por "gripe" (3 dias) e do que a temperatura mínima.',
      { type: 'columns', opts: { labels: ['Águas residuais', 'Pesquisas "gripe"', 'T. mínima', 'PM2,5'], series: [{ name: 'Correlação', color: C.violet, data: [0.88, 0.88, 0.63, 0.41] }] } }, ['INSA', 'Google Trends', 'IPMA · Marketplace']) },
  ],
  plataforma: () => [
    { q: 'Os dados estão atualizados?', a: A(['Ler o estado dos pipelines', 'Verificar frescura face ao alvo'],
      'Sim, com uma exceção: o pipeline de <b>faturação</b> teve um atraso de 38 min às 05:12, provocado por uma tarefa duplicada. O agente de observabilidade já propôs a correção. Todas as outras fontes estão dentro do alvo; as fontes clínicas críticas têm menos de 1 minuto.',
      null, ['ACCOUNT_USAGE', 'Openflow']) },
  ],
  acoes: () => {
    const by = ['Por iniciar', 'Em curso', 'Atrasada', 'Concluída'].map((st) => [st, SEED_ACTIONS.filter((a) => a.status === st).length]);
    const late = SEED_ACTIONS.filter((a) => a.status === 'Atrasada');
    return [
      { q: 'Que ações estão atrasadas?', a: A(['Ler o plano de ações', 'Filtrar por estado e prazo'],
        `${late.length === 1 ? 'Há <b>1 ação atrasada</b>' : `Há <b>${late.length} ações atrasadas</b>`}: ${late.map((a) => `<b>${a.title}</b> (${a.owner}, prazo ${a.due})`).join('; ')}. Das ${SEED_ACTIONS.length} ações, ${by[1][1]} estão em curso e ${by[3][1]} ${by[3][1] === 1 ? 'está concluída' : 'estão concluídas'}.`,
        { type: 'donut', opts: { center: String(SEED_ACTIONS.length), centerLabel: 'ações', items: by.map(([l, v], i) => ({ label: l, value: v, color: [C.grey, C.teal, C.coral, C.ok][i] })) } }, ['Plano de ações'], ['Que ações têm mais impacto?']) },
      { q: 'Que ações têm mais impacto?', a: A(['Ler o impacto esperado de cada ação', 'Ordenar por valor e urgência'],
        `As três com mais impacto:<br>1. <b>${SEED_ACTIONS[0].title}</b>: ${SEED_ACTIONS[0].expected}.<br>2. <b>${SEED_ACTIONS[1].title}</b>: ${SEED_ACTIONS[1].expected} (${SEED_ACTIONS[1].realised}).<br>3. <b>${SEED_ACTIONS[2].title}</b>: ${SEED_ACTIONS[2].expected}.`,
        null, ['Plano de ações'], ['Que ações estão atrasadas?']) },
    ];
  },
  alertas: () => [
    { q: 'Que alertas dispararam esta semana?', a: A(['Ler o histórico de alertas dos últimos 7 dias', 'Agrupar por indicador'],
      'Dispararam <b>4 alertas</b> esta semana: ocupação do HL Lisboa acima de 92% previsto (2 vezes), taxa de rejeição da AdvanceCare acima de 4% e faltas no HL Setúbal acima de 10%. Todos foram entregues por email e na app em menos de 2 minutos.',
      { type: 'columns', opts: { labels: ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'], series: [{ name: 'Alertas', color: C.coral, data: [0, 1, 2, 0, 1, 0, 0] }] } }, ['Alertas · Snowflake Tasks']) },
  ],
  relatorio: () => [
    { q: 'Quais são as 3 mensagens para o conselho?', a: A(['Ler o pacote mensal do conselho', 'Escolher o que mudou face ao mês anterior'],
      `1. <b>Receita acima do orçamento</b>: ${nf(PLAN.ytdActual, 1)} M€ acumulados, previsão de fecho de ${PLAN.forecast2026} M€.<br>2. <b>Pressão no internamento</b>: o HL Lisboa deve passar os 92% de ocupação na sexta-feira; o plano de contingência está aprovado.<br>3. <b>Novas unidades</b>: Aveiro acima do plano, Leiria atrás; a Ortopedia programada em Leiria antecipa o break-even.`,
      { type: 'columns', opts: { labels: ['2025', 'Orçamento 2026', 'Previsão 2026'], series: [{ name: 'M€', color: C.teal, data: [PLAN.revenue2025, PLAN.budget2026, PLAN.forecast2026] }] } }, ['Pacote do conselho', 'SV_FINANCAS']) },
  ],
  dicionario: () => [
    { q: 'Quantos indicadores estão certificados?', a: A(['Ler o dicionário de indicadores', 'Contar por domínio'],
      (() => { const d = {}; DICTIONARY.forEach((x) => { d[x.domain] = (d[x.domain] || 0) + 1; }); return `O dicionário tem <b>${DICTIONARY.length} indicadores</b>, dos quais <b>${DICTIONARY.filter((x) => x.certified).length} certificados</b>, todos com definição, fórmula e responsável, distribuídos por ${Object.keys(d).length} domínios. O maior é <b>${Object.entries(d).sort((a, b) => b[1] - a[1])[0][0]}</b>.`; })(),
      (() => { const d = {}; DICTIONARY.forEach((x) => { d[x.domain] = (d[x.domain] || 0) + 1; }); return { type: 'bars', opts: { items: Object.entries(d).sort((a, b) => b[1] - a[1]).map(([l, v]) => ({ label: l, value: v, color: C.teal })) } }; })(),
      ['Dicionário de indicadores', 'Horizon Catalog']) },
  ],
  assistente: () => [
    { q: 'O que posso perguntar ao assistente?', a: A(['Ler as semantic views disponíveis'],
      'O assistente responde a perguntas em linguagem natural sobre <b>operações, receita, qualidade e pessoas</b>, usando as semantic views certificadas. Por exemplo: "Qual a ocupação do HL Lisboa esta semana?" ou "Que seguradora tem mais rejeições?". Cada resposta mostra a consulta SQL usada.',
      null, ['Cortex Analyst', 'Semantic views']) },
  ],
  benchmarking: () => [
    { q: 'Onde estamos pior do que a referência?', a: A(['Comparar o grupo com as referências nacionais', 'Ajustar ao case-mix'],
      `O grupo está melhor do que a referência na maioria dos indicadores. As exceções: a <b>utilização do bloco</b> (78,2% face a ${BENCH.find((b) => b[0] === 'orUtil')[4]}% de referência, sem margem) e a <b>taxa de faltas</b> no HL Setúbal, acima de ${nf(BENCH.find((b) => b[0] === 'noShow')[4], 1)}%.`,
      null, ['SV_QUALIDADE', 'Referências nacionais']) },
  ],
  arquitetura: () => [
    { q: 'Como entram os dados clínicos na plataforma?', a: A(['Ler o catálogo de sistemas fonte', 'Agrupar por padrão de integração'],
      'Os sistemas clínicos enviam mensagens <b>HL7 v2</b> e recursos <b>FHIR R4</b> para o motor de integração, que as entrega em <b>Snowpipe Streaming</b> em menos de 1 minuto. Os monitores da UCI e a app MY LUZ usam <b>Kafka</b>; a faturação e a farmácia são replicadas por <b>CDC com Openflow</b> a cada 15 minutos. Não há ferramentas de ETL externas. Das 22 fontes, 5 chegam em menos de 1 minuto.',
      { type: 'bars', opts: { items: [['Menos de 1 minuto', 5], ['Até 15 minutos', 7], ['Até 1 hora', 3], ['Diária', 7]].map(([l, v]) => ({ label: l, value: v, color: C.teal })) } }, ['Catálogo de sistemas fonte'], ['Como estão protegidos os dados de saúde?']) },
    { q: 'Como estão protegidos os dados de saúde?', a: A(['Ler as políticas de governança', 'Verificar conformidade'],
      'Por desenho: o Horizon <b>classifica automaticamente</b> dados pessoais e de saúde, <b>máscaras</b> escondem o diagnóstico a perfis não clínicos, <b>políticas por hospital</b> limitam o que cada direção vê e os <b>consentimentos</b> do MY LUZ excluem automaticamente quem não autorizou investigação. As chaves são da Luz Saúde (Tri-Secret Secure), a rede é privada (PrivateLink) e os dados ficam na UE.',
      null, ['Horizon', 'Políticas de governança'], ['Que tipos de dados existem?']) },
    { q: 'Que tipos de dados existem?', a: A(['Medir o volume armazenado por tipo'],
      'São <b>186 TB</b>: 41% estruturados, 27% semiestruturados (HL7, FHIR, JSON), 18% séries temporais, 11% não estruturados (notas, PDF, áudio) e 3% externos. As imagens médicas ficam no PACS; na plataforma ficam os metadados e os relatórios.',
      { type: 'donut', opts: { center: '186 TB', centerLabel: 'total', items: [['Estruturados', 41, C.teal], ['Semiestruturados', 27, C.sky], ['Séries temporais', 18, C.violet], ['Não estruturados', 11, C.sun], ['Externos', 3, C.ok]].map(([label, value, color]) => ({ label, value, color })) } }, ['Catálogo de dados']) },
  ],
  agentes: () => [
    { q: 'Que agentes poupam mais tempo?', a: A(['Ler o registo de execuções dos últimos 30 dias', 'Somar o tempo manual evitado'],
      'Os que mais poupam são as <b>autorizações prévias</b> (1 120 h), a <b>prevenção de rejeições</b> (640 h) e a <b>preparação pré-operatória</b> (520 h). No total, os agentes pouparam ≈ 3 909 h no mês.',
      { type: 'bars', opts: { unit: ' h', items: [['Autorizações prévias', 1120], ['Prevenção de rejeições', 640], ['Preparação pré-operatória', 520], ['Reclamações', 520], ['Seguimento pós-alta', 410], ['Recrutamento para ensaios', 380]].map(([l, v]) => ({ label: l, value: v, color: C.teal })) } }, ['AI Observability']) },
    { q: 'Os agentes erram muito?', a: A(['Ler as avaliações humanas das execuções', 'Calcular a taxa de aceitação'],
      'Pouco. Nos últimos 30 dias, <b>94%</b> das propostas dos agentes foram aceites sem alterações, 5% foram editadas e 1% rejeitadas. Todas as ações com impacto clínico ou financeiro exigem aprovação humana.',
      { type: 'donut', opts: { center: '94%', centerLabel: 'aceites', items: [{ label: 'Aceites', value: 94, color: C.ok }, { label: 'Editadas', value: 5, color: C.sun }, { label: 'Rejeitadas', value: 1, color: C.coral }] } }, ['AI Observability']) },
  ],
};

// Operating theatre, per tab.
const BLOCO = {
  Hoje: () => {
    const ot = ROOMS.filter((r) => r.overtime);
    const s4 = ROOMS[3];
    return [
      { q: 'Porque está a Sala 4 atrasada?', a: A(['Ler o registo de bloco da Sala 4', 'Comparar tempos de limpeza com as outras salas', 'Verificar material e equipa'],
        `Três causas somam-se:<br>1. A primeira cirurgia começou <b>${s4.firstDelay} min</b> atrasada.<br>2. A limpeza e preparação entre cirurgias demora <b>${s4.turnover} min</b>, contra 22 nas outras salas.<br>3. A caixa de joelho robótico n.º 2 fica pronta 30 min depois do previsto.<br><br>Resultado: a sala deve terminar às <b>${hhmm(s4.end)}</b>, ${s4.overtime} min depois das 20:00. Não é a duração das cirurgias do Dr. Ricardo Alves, que estão dentro do previsto.`,
        { type: 'bars', opts: { unit: ' min', items: TURNOVER.map(([l, v]) => ({ label: l, value: v, target: 22, color: v > 28 ? C.coral : C.teal })) } }, ['Registo de bloco', 'Esterilização'], ['Temos camas para as cirurgias de hoje?']) },
      { q: 'Que salas vão terminar depois das 20h?', a: A(['Projetar o fim de cada sala com os tempos reais', 'Comparar com o horário de 20:00'],
        ot.length ? `${ot.length === 1 ? 'Apenas a' : 'As salas'} <b>${ot.map((r) => r.name).join(', ')}</b> ${ot.length === 1 ? 'deve' : 'devem'} terminar depois das 20:00 (${ot.map((r) => `${r.name} às ${hhmm(r.end)}`).join(', ')}). As restantes terminam a horas.` : 'Nenhuma sala deve terminar depois das 20:00.',
        { type: 'bars', opts: { unit: '%', max: 100, items: ROOMS.map((r) => ({ label: r.name, value: Math.round(r.util), target: 85, color: r.overtime ? C.coral : C.teal })) } }, ['Registo de bloco', 'Plano operatório']) },
      { q: 'Temos camas para as cirurgias de hoje?', a: A(['Somar necessidades de recobro, UCI e internamento', 'Comparar com camas livres agora'],
        `Não totalmente. O <b>recobro</b> chega a ${Math.max(...RECOVERY.pacu)} de ${RECOVERY.pacuBeds} camas às 16h; na <b>UCI</b> há ${RECOVERY.icuFree} camas livres para ${RECOVERY.icuNeed} necessidades; no <b>internamento cirúrgico</b> faltam ${RECOVERY.wardNeed - RECOVERY.wardFree} camas até às 18h. Recomendo ativar o gestor de camas.`,
        { type: 'columns', opts: { labels: ['Recobro (pico)', 'UCI', 'Internamento'], series: [{ name: 'Necessárias', color: C.coral, data: [Math.max(...RECOVERY.pacu), RECOVERY.icuNeed, RECOVERY.wardNeed] }, { name: 'Disponíveis', color: C.teal, data: [RECOVERY.pacuBeds, RECOVERY.icuFree, RECOVERY.wardFree] }] } }, ['Gestão de camas', 'Plano operatório']) },
    ];
  },
  'Amanhã e plano': () => [
    { q: 'Quanto tempo a mais prevê o modelo para amanhã?', a: A(['Correr o modelo de duração cirúrgica', 'Comparar com as estimativas dos cirurgiões'],
      `O modelo prevê <b>+${TOMORROW.reduce((a, t) => a + (t.p50 - t.est), 0)} min</b> face às estimativas. A maior diferença é a <b>revisão de prótese da anca</b> na Sala 4 (+${TOMORROW[2].p50 - TOMORROW[2].est} min). A prostatectomia robótica é a única que o modelo prevê mais curta.`,
      { type: 'columns', opts: { labels: TOMORROW.map((t) => t.proc.split(' ').slice(0, 2).join(' ')), series: [{ name: 'Estimativa', color: C.grey, data: TOMORROW.map((t) => t.est) }, { name: 'Modelo (P50)', color: C.teal, data: TOMORROW.map((t) => t.p50) }] } }, ['Modelo de duração cirúrgica (erro médio 11 min)'], ['Como resolver o conflito do robô?']) },
    { q: 'Como resolver o conflito do robô?', a: A(['Ler os pedidos de equipamento de amanhã', 'Simular alternativas de sequência', 'Escolher a de menor impacto'],
      'A Sala 3 e a Sala 4 pedem o robô às 08:00. A melhor opção é dar o robô à <b>Sala 3 às 08:00</b> (prostatectomia, 171 min previstos) e à <b>Sala 4 a partir das 12:30</b>, começando o dia da Sala 4 pela revisão de prótese da anca, que não precisa de robô. O otimizador já propôs este plano.',
      null, ['Plano operatório', 'Inventário de equipamento']) },
  ],
  'Doentes e risco': () => [
    { q: 'Que doentes podem ser cancelados amanhã?', a: A(['Correr o modelo de cancelamento', 'Cruzar com o checklist pré-operatório'],
      `${PREOP.filter((p) => p.cancel > .15).length} doentes têm risco acima de 15%: ${PREOP.filter((p) => p.cancel > .15).sort((a, b) => b.cancel - a.cancel).map((p) => `<b>${p.name}</b> (${Math.round(p.cancel * 100)}%)`).join(', ')}. Em todos falta pelo menos um item do pré-operatório.`,
      { type: 'bars', opts: { unit: '%', items: [...PREOP].sort((a, b) => b.cancel - a.cancel).map((p) => ({ label: p.name, value: Math.round(p.cancel * 100), target: 15, color: p.cancel > .15 ? C.coral : C.teal })) } }, ['Modelo de cancelamento (AUC 0,84)', 'Checklist pré-operatório']) },
  ],
  Recursos: () => [
    { q: 'Falta alguém na equipa hoje?', a: A(['Ler escalas do bloco', 'Comparar com as necessidades do plano da tarde'],
      `Sim: falta <b>1 anestesiologista</b> a partir das 14:00 (baixa médica) e <b>1 enfermeiro circulante</b> (a Sala 9 partilha com a Sala 8 à tarde). ${TEAM.filter((t) => t[2] >= t[1]).length} das ${TEAM.length} funções estão completas.`,
      { type: 'columns', opts: { labels: TEAM.map((t) => t[0].split(' ')[0]), series: [{ name: 'Necessários', color: C.coral, data: TEAM.map((t) => t[1]) }, { name: 'Disponíveis', color: C.teal, data: TEAM.map((t) => t[2]) }] } }, ['Escalas', 'Plano operatório']) },
  ],
  Desempenho: () => [
    { q: 'A utilização do bloco está a melhorar?', a: A(['Ler 12 semanas de registo de bloco', 'Calcular a tendência'],
      `Sim. A utilização subiu de <b>${nf(TREND.util[0], 1)}%</b> para <b>${nf(TREND.util[11], 1)}%</b> em 12 semanas e os cancelamentos no próprio dia desceram de ${nf(TREND.cancel[0], 1)}% para ${nf(TREND.cancel[11], 1)}%. O objetivo de 85% continua por atingir; a primeira cirurgia a horas (71%) é a maior alavanca.`,
      { type: 'line', opts: { labels: TREND.labels, unit: '%', min: 70, max: 90, series: [{ name: 'Utilização', color: C.teal, data: TREND.util, area: true }, { name: 'Objetivo (85%)', color: C.grey, width: 1, data: Array(12).fill(85) }] } }, ['Registo de bloco']) },
  ],
};

// Selected person in the 360° views.
function personQs(kind, p, x) {
  const first = p.name.replace(/^(Dra?\.|Enf\.ª|Enf\.)\s/, '').split(' ')[0];
  const main = p.risks[0];
  const qs = [
    { q: `Resume ${kind === 'doente' ? 'este doente' : 'este colaborador'}`, a: A([`Ler o perfil de ${p.name}`, 'Juntar dados de todos os sistemas', 'Destacar o mais relevante'],
      `<b>${p.name}</b> · ${p.meta}.<br><br>${x.insights.slice(0, 3).map(([, h]) => '• ' + h).join('<br>')}`,
      null, [...new Set(x.insights.flatMap((i) => i[2]))].slice(0, 4), [`Porque é que ${first} tem este risco?`, 'O que devo fazer a seguir?']) },
    { q: `Porque é que ${first} tem este risco?`, a: A([`Ler o modelo de ${main[0].toLowerCase()}`, 'Calcular a contribuição de cada fator (SHAP)'],
      `O risco de <b>${main[0].toLowerCase()}</b> é de <b>${Math.round(main[1] * 100)}%</b>. ${main[3]}.${x.shap ? ` O fator com mais peso é «${x.shap[0][0]}» (${Math.round(x.shap[0][1] * 100)}% da previsão).` : ''}`,
      x.shap ? { type: 'bars', opts: { unit: '%', items: x.shap.map(([l, v]) => ({ label: l, value: Math.round(v * 100), color: C.violet })) } }
        : x.peers ? { type: 'bars', opts: { items: x.peers.map(([l, v]) => ({ label: l, value: v, color: C.teal })) } } : null,
      [kind === 'doente' ? 'Modelo de risco clínico' : 'Modelo de saída (sem género, idade ou nacionalidade)']) },
    { q: 'O que devo fazer a seguir?', a: A(['Ler as ações recomendadas', 'Ordenar por impacto'],
      `Recomendo, por esta ordem:<br>${p.nba.map(([t], i) => `${i + 1}. ${t}`).join('<br>')}`,
      null, ['Luz IA · próxima melhor ação']) },
  ];
  if (kind === 'doente' && x.gaps) {
    const open = x.gaps.filter((g) => g[2] !== 'p-ok');
    qs.push({ q: 'Que lacunas de cuidados existem?', a: A(['Comparar o percurso do doente com as normas clínicas'],
      open.length ? `Há <b>${open.length}</b> lacuna(s) por resolver: ${open.map((g) => `${g[0].toLowerCase()} (${g[3]})`).join('; ')}.` : 'Não há lacunas de cuidados por resolver.', null, ['Normas clínicas', 'Processo clínico']) });
  }
  return qs;
}

export function handcrafted(ctx) {
  if (ctx.subject && (ctx.slug === 'doente' || ctx.slug === 'colaborador')) return personQs(ctx.slug, ctx.subject.person, ctx.subject.extra);
  if (ctx.slug === 'bloco') return (BLOCO[ctx.tab] || BLOCO.Hoje)();
  return PAGES[ctx.slug] ? PAGES[ctx.slug]() : [];
}

// Model card for the "which models" follow-up.
export const MODEL_COUNT = MODELS.length;
export const WAIT_ORTO = WAITING[0];
