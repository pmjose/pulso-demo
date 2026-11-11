// Generates coherent patient and employee profiles in the same shape the 360° views use.
// Deterministic (seeded) so the same person always looks the same. All data is fictitious.
import { C, nf, seeded } from './data.js';
import { COND_KEYS, CONDITIONS, FIRST_F, FIRST_M, LAST, PAYER_MIX, PLACES } from './peopleParts.js';

const pick = (r, a) => a[Math.floor(r() * a.length)];
const wpick = (r, pairs) => { const t = pairs.reduce((a, p) => a + p[1], 0); let x = r() * t; for (const p of pairs) { x -= p[1]; if (x <= 0) return p[0]; } return pairs[0][0]; };
const between = (r, a, b) => a + r() * (b - a);
const initials = (n) => n.replace(/^(Dra?\.|Enf\.ª|Enf\.)\s/, '').split(' ').filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join('');
const HOSP_W = [['HL Lisboa', 30], ['HL Arrábida', 12], ['HL Torres de Lisboa', 8], ['HL Coimbra', 8], ['HL Setúbal', 7], ['HL Oeiras', 6], ['HL Funchal', 6], ['HL Aveiro', 6], ['HL Leiria', 5], ['HL Santarém', 4], ['HL Figueira da Foz', 3]];
const DATES = ['04/11/2026', '27/10/2026', '13/10/2026', '22/09/2026', '02/09/2026', '18/07/2026', '30/06/2026', '12/05/2026', '21/03/2026', '08/02/2026', '15/12/2025', '03/10/2025'];
const MONTHS9 = ['nov 24', 'fev 25', 'mai 25', 'ago 25', 'nov 25', 'fev 26', 'mai 26', 'ago 26', 'nov 26'];
const DOCS = { Endocrinologia: 'Dr. Paulo Simões', 'Medicina Interna': 'Dra. Helena Duarte', Pneumologia: 'Dr. Vasco Leitão', Cardiologia: 'Dr. Nuno Teixeira', Ortopedia: 'Dr. Ricardo Alves', Imunoalergologia: 'Dra. Joana Prates', Oncologia: 'Dra. Leonor Barros', Nefrologia: 'Dr. Filipe Quaresma' };
const name3 = (r, sex) => `${pick(r, sex === 'F' ? FIRST_F : FIRST_M)} ${pick(r, LAST)} ${pick(r, LAST)}`;

// ---------- patients ----------
function makePatient(i, o = {}) {
  const r = seeded('pt' + i + (o.name || ''));
  const cond = o.cond || pick(r, COND_KEYS);
  const T = CONDITIONS[cond];
  const sex = o.sex || (T.sex === 'any' ? (r() < .52 ? 'F' : 'M') : T.sex);
  const name = o.name || name3(r, sex);
  const age = o.age || Math.round(between(r, T.ages[0], T.ages[1]));
  const hosp = o.hosp || wpick(r, HOSP_W);
  const place = pick(r, PLACES[hosp]);
  const payer = o.payer || wpick(r, PAYER_MIX);
  const bad = o.bad != null ? o.bad : r() < .34;
  const second = COND_KEYS.filter((k) => k !== cond && CONDITIONS[k].ages[0] <= age && CONDITIONS[k].ages[1] >= age && (CONDITIONS[k].sex === 'any' || CONDITIONS[k].sex === sex));
  const conds = [cond, ...(r() < .55 && second.length ? [pick(r, second)] : [])];
  const since = 2026 - Math.floor(between(r, 1, 17));
  const risk = +(bad ? between(r, .46, .78) : between(r, .1, .32)).toFixed(2);
  const noShow = +between(r, .06, .42).toFixed(2), churn = +between(r, .08, .38).toFixed(2);
  const meds = conds.flatMap((k) => CONDITIONS[k].meds).slice(0, 4).map(([m, f]) => [m, f, Math.round(bad ? between(r, 52, 88) : between(r, 78, 98))]);
  const worstMed = [...meds].sort((a, b) => a[2] - b[2])[0];
  const gaps = conds.flatMap((k) => CONDITIONS[k].gaps.map(([g]) => { const late = r() < (bad ? .55 : .2); return [g, late ? 'Em atraso' : 'Em dia', late ? 'p-bad' : 'p-ok', late ? `Último em ${pick(r, DATES.slice(6))}` : pick(r, DATES.slice(0, 5))]; }));
  if (o.surgery) gaps.unshift([`Pré-operatório · ${o.surgery.proc}`, o.surgery.ready ? 'Completo' : 'Incompleto', o.surgery.ready ? 'p-ok' : 'p-bad', o.surgery.ready ? 'Pronto para amanhã' : o.surgery.missing]);
  const a = T.series(bad);
  const app = MONTHS9.map((_, k) => Math.max(0, Math.round((payer === 'Particular' ? 4 : 7) + Math.sin(k + i) * 2 + (bad ? -k * .3 : k * .2))));
  const dates = DATES.slice(0, 4 + Math.floor(r() * 3));
  const timeline = dates.map((d, k) => {
    const c = CONDITIONS[conds[k % conds.length]];
    const ev = [`Consulta · ${c.spec}`, 'Análises clínicas', `Teleconsulta · ${c.spec} · LUZ 24`, 'Urgência · triagem amarela', 'Exame de imagem', 'Check-up LUZ ON PRIME'][(k + i) % 6];
    return [d, `${ev} · ${hosp}`, k === 0 && bad ? `${a.name.split(' (')[0]} fora do alvo` : 'Sem alterações relevantes'];
  });
  if (o.surgery) timeline.unshift(['12/11/2026', `Cirurgia programada · ${o.surgery.proc}`, `${o.surgery.when}`]);
  const shapNames = T.risk[1];
  const raw = shapNames.map((_, k) => (5 - k) + r());
  const tot = raw.reduce((x, y) => x + y, 0);
  const shap = shapNames.map((n, k) => [n, +(raw[k] / tot).toFixed(2)]);
  const doc = DOCS[T.spec];
  const lastA = a.data[a.data.length - 1], firstA = a.data[0];
  const insights = [
    ['◈', `<b>${a.name.split(' (')[0]}</b> passou de ${nf(firstA, firstA % 1 ? 1 : 0)} para ${nf(lastA, lastA % 1 ? 1 : 0)} em 24 meses${bad ? ', com tendência desfavorável nas últimas 3 medições' : ', estável dentro do alvo'}.`, ['Análises', 'Dispositivos']],
    ['℞', `A adesão a <b>${worstMed[0]}</b> é de ${worstMed[2]}% (levantamentos na farmácia).${worstMed[2] < 75 ? ' É o fator modificável com mais peso no risco.' : ''}`, ['Farmácia', 'Prescrição']],
    ...(gaps.some((g) => g[2] === 'p-bad') ? [['⚑', `${gaps.filter((g) => g[2] === 'p-bad').length} lacuna(s) de cuidados por resolver, incluindo <b>${gaps.find((g) => g[2] === 'p-bad')[0].toLowerCase()}</b>.`, ['Normas clínicas', 'Processo clínico']]] : []),
    [app[8] < app[4] ? '☺' : '♡', `Usou a app MY LUZ ${app[8]} vezes no último trimestre (${app[8] < app[4] ? 'em queda' : 'em subida'}). ${app[8] >= 5 ? 'A app é o melhor canal para lembretes.' : 'Preferir contacto telefónico.'}`, ['App MY LUZ']],
  ];
  const nba = [...T.nba, ...(gaps.find((g) => g[2] === 'p-bad') ? [`Resolver: <b>${gaps.find((g) => g[2] === 'p-bad')[0]}</b>.`] : [])].slice(0, 3).map((t, k) => [t, ['Marcar via MY LUZ', 'Propor data', 'Enviar convite'][k]]);
  const id = o.id || `p${i}`;
  return {
    id, generated: true, cond, conds, hosp, risk, bad,
    initials: initials(name), name, sex, age,
    meta: `${age} anos · Processo n.º ${nf(1000000 + Math.floor(r() * 3800000))} · Cliente desde ${since} · ${place}`,
    tags: [[payer === 'Particular' ? 'p-teal' : 'p-ok', payer === 'Particular' ? 'Particular' : `Seguro: ${payer}`], ...conds.map((k) => ['p-warn', CONDITIONS[k].label]), ...(o.surgery ? [['p-bad', 'Cirurgia amanhã']] : []), ...(r() < .35 ? [['p-teal', 'LUZ ON PRIME']] : [])],
    alerts: [...(r() < .2 ? ['Alergia: ' + pick(r, ['penicilina', 'iodo', 'AINE', 'látex'])] : []), ...(o.alerts || [])],
    risks: [[T.risk[0], risk, risk > .45 ? C.coral : risk > .3 ? C.sun : C.ok, `Principal fator: ${shap[0][0].toLowerCase()}`], ['Falta à próxima consulta', noShow, noShow > .3 ? C.sun : C.ok, noShow > .3 ? 'Historial de faltas' : 'Confirma pela app'], ['Abandono do grupo', churn, churn > .3 ? C.sun : C.ok, churn > .3 ? 'Plafond do seguro perto do limite' : 'Relação estável']],
    problems: conds.map((k) => [...CONDITIONS[k].code, String(2026 - Math.floor(between(r, 1, 12)))]).concat(o.problem ? [o.problem] : []),
    meds, timeline,
    series: { labels: MONTHS9, a: { name: a.name, data: a.data, min: a.min, max: a.max, target: a.target == null ? a.data[0] : a.target }, b: { name: 'Sessões na app MY LUZ', data: app } },
    nba, summary: `${sex === 'F' ? 'Doente' : 'Doente'} de ${age} anos com ${conds.map((k) => CONDITIONS[k].label.toLowerCase()).join(' e ')}, acompanhado${sex === 'F' ? 'a' : ''} no ${hosp}. ${a.name.split(' (')[0]} ${bad ? 'com evolução desfavorável' : 'controlado'}. ${gaps.some((g) => g[2] === 'p-bad') ? `Lacunas por resolver: ${gaps.filter((g) => g[2] === 'p-bad').map((g) => g[0].toLowerCase()).join('; ')}.` : 'Sem lacunas de cuidados.'} Adesão terapêutica mais baixa: ${worstMed[0]} (${worstMed[2]}%).`,
    finance: [['Financiador', payer], ['Faturas em aberto', r() < .25 ? `1 · ${nf(between(r, 18, 140), 2)} €` : '0'], ['Valor dos últimos 3 anos', `${nf(Math.round(between(r, 900, 14000)))} €`], ['NPS (último inquérito)', String(Math.round(between(r, bad ? 4 : 7, 10)))]],
    social: [['Vive com', age > 75 && r() < .4 ? 'Sozinh' + (sex === 'F' ? 'a' : 'o') : pick(r, ['Cônjuge', 'Família', 'Filhos'])], ['Distância ao hospital', `${nf(between(r, 1.5, 38), 1)} km`], ['Canal preferido', app[8] >= 5 ? 'App MY LUZ' : 'Telefone'], ['Dispositivo ligado', r() < .3 ? 'Sim' : 'Não']],
    consent: [['Partilha com Learning Health (anonimizada)', r() < .71], ['Comunicações de saúde personalizadas', r() < .85], ['Marketing de parceiros', r() < .3]],
    extra: {
      team: [['Médico assistente', `${doc} · ${T.spec}`], ['Enfermeira de referência', `Enf.ª ${pick(r, FIRST_F)} ${pick(r, LAST)}`], ['Hospital habitual', hosp]],
      upcoming: o.surgery ? [['12/11/2026', `${o.surgery.proc} · ${o.surgery.when}`, o.surgery.ready ? 'p-ok' : 'p-bad']] : r() < .55 ? [[pick(r, ['18/11/2026', '25/11/2026', '03/12/2026', '10/12/2026']), `Consulta · ${T.spec} · ${hosp}`, 'p-ok']] : [['Sem marcação', 'Nenhuma consulta nos próximos 90 dias', 'p-bad']],
      insights, explainFor: 0, shap, gaps,
      projection: { ...T.proj(bad), labels: ['hoje', '+3 m', '+6 m', '+9 m', '+12 m'] },
      use: [['Consultas', String(Math.round(between(r, 2, 11))), `das quais ${Math.round(between(r, 0, 3))} teleconsultas`], ['Análises', String(Math.round(between(r, 1, 7))), ''], ['Urgência', String(Math.round(between(r, 0, bad ? 3 : 1))), ''], ['Gasto em 12 meses', `${nf(Math.round(between(r, 400, 6200)))} €`, payer]],
      app: { name: 'Sessões na app MY LUZ', labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], data: app.slice(3) },
    },
  };
}

// People already named elsewhere in the portal get full profiles that match.
const SURGICAL = [
  ['Joaquim Ferreira', 71, 'M', 'oa', 'Artroplastia total do joelho (robótica)', 'Sala 4 · 08:00', 'Multicare', true, ''],
  ['Rosa Marques', 78, 'F', 'oa', 'Artroplastia total do joelho (robótica)', 'Sala 4 · 10:10', 'ADSE', false, 'Avaliação anestésica por fazer'],
  ['Fernando Lopes', 69, 'M', 'oa', 'Revisão de prótese da anca', 'Sala 4 · 12:20', 'Médis', false, 'Análises e autorização da Médis em falta'],
  ['Helena Duarte Silva', 62, 'F', 'dm2', 'Gastrectomia parcial', 'Sala 1 · 08:00', 'Multicare', true, '', ['C16.9', 'Neoplasia do estômago', '2026']],
  ['Carla Monteiro', 44, 'F', 'asma', 'Colecistectomia laparoscópica', 'Sala 1 · 11:45', 'Particular', false, 'Instruções de jejum não lidas na app', ['K80.2', 'Litíase da vesícula', '2026']],
  ['António Gaspar', 66, 'M', 'hta', 'Prostatectomia radical (robótica)', 'Sala 3 · 08:00', 'AdvanceCare', true, '', ['C61', 'Neoplasia da próstata', '2026']],
  ['Marta Coelho', 47, 'F', 'asma', 'Histerectomia laparoscópica', 'Sala 7 · 08:00', 'Médis', false, 'Consentimento e instruções de jejum em falta', ['D25.9', 'Leiomioma do útero', '2025']],
];
const LINKED = [
  ['Rui Fernandes', 64, 'M', 'ic', 'HL Lisboa'], ['Catarina Lopes', 41, 'F', 'asma', 'HL Lisboa'], ['João Pereira', 72, 'M', 'oa', 'HL Coimbra'], ['Inês Martins', 33, 'F', 'asma', 'HL Oeiras'],
  ['Tiago Sousa', 52, 'M', 'hta', 'HL Setúbal'], ['Mariana Costa', 58, 'F', 'dm2', 'HL Lisboa'],
  ['Maria do Céu Antunes', 86, 'F', 'ic', 'HL Lisboa'], ['António Rodrigues', 84, 'M', 'oa', 'HL Lisboa'], ['Fernanda Vieira', 88, 'F', 'hta', 'HL Lisboa'], ['Manuel Henriques', 83, 'M', 'drc', 'HL Lisboa'],
];

export const GEN_PATIENTS = [
  ...SURGICAL.map(([name, age, sex, cond, proc, when, payer, ready, missing, problem], k) => makePatient(1000 + k, { id: `cx${k}`, name, age, sex, cond, payer, hosp: 'HL Lisboa', problem, surgery: { proc, when, ready, missing } })),
  ...LINKED.map(([name, age, sex, cond, hosp], k) => makePatient(2000 + k, { id: `ln${k}`, name, age, sex, cond, hosp, bad: k >= 6 || k % 2 === 0 })),
  ...Array.from({ length: 220 }, (_, i) => makePatient(i)),
];

// ---------- employees ----------
const ROLES = [
  ['Enfermeiro(a)', 44, ['Medicina Interna', 'Cirurgia', 'Ortopedia', 'Cuidados Intensivos', 'Urgência', 'Bloco Operatório', 'Pediatria', 'Maternidade']],
  ['Médico(a)', 28, ['Medicina Interna', 'Cirurgia Geral', 'Ortopedia', 'Anestesiologia', 'Cardiologia', 'Urgência', 'Pediatria', 'Ginecologia/Obstetrícia', 'Radiologia']],
  ['Técnico(a) superior de saúde', 13, ['Imagiologia', 'Análises Clínicas', 'Fisioterapia', 'Farmácia']],
  ['Assistente operacional', 10, ['Internamento', 'Bloco Operatório', 'Urgência', 'Esterilização']],
  ['Administrativo(a)', 5, ['Atendimento', 'Faturação', 'Marcações']],
];
const title = (role, sex) => (role.startsWith('Enf') ? (sex === 'F' ? 'Enf.ª' : 'Enf.') : role.startsWith('Méd') ? (sex === 'F' ? 'Dra.' : 'Dr.') : '');
const roleName = (role, sex) => role.replace('o(a)', sex === 'F' ? 'a' : 'o');
const TRAIN = {
  'Enfermeiro(a)': ['Suporte Básico de Vida', 'Prevenção de IACS', 'Gestão de cateteres venosos', 'Administração segura de medicação'],
  'Médico(a)': ['Suporte Avançado de Vida', 'Prevenção de IACS', 'Proteção de dados em saúde', 'Comunicação de más notícias'],
  'Técnico(a) superior de saúde': ['Prevenção de IACS', 'Proteção de dados em saúde'],
  'Assistente operacional': ['Higienização hospitalar', 'Prevenção de IACS', 'Movimentação de doentes'],
  'Administrativo(a)': ['Proteção de dados em saúde', 'Atendimento ao cliente', 'Faturação a seguradoras'],
};

function makeEmployee(i, o = {}) {
  const r = seeded('emp' + i + (o.name || ''));
  const chosen = o.roleRow ? o.roleRow[0] : wpick(r, ROLES.map((q) => [q[0], q[1]]));
  const [role, , svcs] = ROLES.find((x) => x[0] === chosen);
  const sex = o.sex || (role.startsWith('Enf') ? (r() < .82 ? 'F' : 'M') : r() < .55 ? 'F' : 'M');
  const base = o.name || `${pick(r, sex === 'F' ? FIRST_F : FIRST_M)} ${pick(r, LAST)}`;
  const t = title(role, sex);
  const name = o.name || (t ? `${t} ${base}` : base);
  const svc = o.svc || pick(r, svcs);
  const hosp = o.hosp || wpick(r, HOSP_W);
  const years = o.years || Math.max(1, Math.round(between(r, 0.6, 24)));
  const termo = years < 2 && r() < .6;
  const night = role.startsWith('Enf') || (role.startsWith('Méd') && /Urgência|Intensivos|Anestes/.test(svc)) || (role.startsWith('Assist') && r() < .5);
  const extra = Math.round(role.startsWith('Admin') ? between(r, 0, 4) : between(r, 2, 28));
  const nights14 = night ? Math.round(between(r, 1, 7)) : 0;
  const leave = +Math.min(.82, (extra > 20 ? .28 : .08) + (termo ? .16 : 0) + (nights14 > 5 ? .14 : 0) + r() * .22).toFixed(2);
  const burnout = +Math.min(.8, (extra > 18 ? .22 : .06) + nights14 * .04 + r() * .2).toFixed(2);
  const absent = +between(r, .05, .32).toFixed(2);
  const perf = +between(r, 3.2, 4.9).toFixed(1);
  const hoursBase = [150, 152, 151, 152, 150, 154].map((h) => (role.startsWith('Méd') ? h + 6 : h));
  const hoursExtra = [0, 1, 2, 3, 4, 5].map((k) => Math.max(0, Math.round(extra * (.6 + k * .08) + (r() - .5) * 4)));
  const shifts = [0, 1, 2, 3].map(() => [0, 1, 2, 3, 4, 5, 6].map((d) => {
    if (role.startsWith('Admin')) return d < 5 ? 1 : 0;
    const x = r(); if (x < .28) return 0;
    if (night && x > .78) return 3;
    return x < .55 ? 1 : 2;
  }));
  const TECH = { Imagiologia: 'Proteção radiológica', 'Análises Clínicas': 'Qualidade laboratorial', Fisioterapia: 'Reabilitação baseada em evidência', Farmácia: 'Preparação de citotóxicos' };
  const training = (role.startsWith('Técnico') ? [TECH[svc], ...TRAIN[role]] : TRAIN[role]).map((tr) => { const x = r(); return [tr, x < .14 ? `Expira em ${Math.round(between(r, 5, 40))} dias` : x < .22 ? 'Por fazer' : `Válido até ${pick(r, ['03/2027', '06/2027', '11/2027', '02/2028'])}`, x < .14 ? 'p-warn' : x < .22 ? 'p-bad' : 'p-ok']; });
  const kpis = role.startsWith('Méd')
    ? [['Consultas/atos este mês', String(Math.round(between(r, 120, 320))), 'serviço: 210'], ['Horas este mês', `${hoursBase[5] + hoursExtra[5]} h`, `+${hoursExtra[5]} h extra`], ['Avaliação de desempenho', `${nf(perf, 1)} / 5`, perf > 4.4 ? 'top 15%' : ''], ['NPS dos doentes', String(Math.round(between(r, 62, 90))), 'serviço: 73']]
    : role.startsWith('Enf')
      ? [['Horas este mês', `${hoursBase[5] + hoursExtra[5]} h`, `+${hoursExtra[5]} h extra`], ['Doentes por turno', nf(between(r, 5.8, 9.4), 1), 'serviço: 7,2'], ['Avaliação de desempenho', `${nf(perf, 1)} / 5`, perf > 4.4 ? 'top 15%' : ''], ['Noites (14 dias)', String(nights14), 'serviço: 3']]
      : [['Horas este mês', `${hoursBase[5] + hoursExtra[5]} h`, `+${hoursExtra[5]} h extra`], ['Produtividade', `${Math.round(between(r, 88, 118))}%`, 'face à mediana'], ['Avaliação de desempenho', `${nf(perf, 1)} / 5`, ''], ['Absentismo (12 meses)', `${nf(between(r, .4, 6), 1)}%`, 'serviço: 4,1%']];
  const why = [extra > 20 ? `${hoursExtra.slice(3).filter((h) => h > 20).length || 1} meses com > 20 h extra` : 'Horas extra moderadas', termo ? 'contrato a termo' : `${years} anos de casa`, nights14 > 5 ? `${nights14} noites em 14 dias` : ''].filter(Boolean).join('; ');
  const expiring = training.find((x) => x[2] !== 'p-ok');
  const nba = [
    ...(leave > .45 ? [[`Conversa de retenção com a chefia: risco de saída de ${Math.round(leave * 100)}%.`, 'Agendar conversa']] : []),
    ...(nights14 > 5 ? [[`Limitar a <b>2 noites por semana</b> nas próximas 4 semanas.`, 'Ajustar escala']] : []),
    ...(expiring ? [[`Formação <b>${expiring[0]}</b>: ${expiring[1].toLowerCase()}.`, 'Inscrever']] : []),
    ...(termo ? [['Avaliar <b>conversão para sem termo</b>.', 'Propor a RH']] : []),
    [`Reconhecer o desempenho (${nf(perf, 1)}/5) na avaliação anual.`, 'Registar'],
  ].slice(0, 3);
  const insights = [
    ['◷', `Fez <b>${hoursExtra[5]} h extra</b> este mês (${hoursExtra.slice(3).join(', ')} h nos últimos 3 meses).${extra > 18 ? ' Mais de metade em picos que a previsão de afluência antecipava com 7 dias.' : ''}`, ['Escalas', 'Previsão de afluência']],
    ['⇢', `Risco de saída de <b>${Math.round(leave * 100)}%</b>: ${why}.`, ['RH', 'Modelo de saída']],
    ...(expiring ? [['⚑', `<b>${expiring[0]}</b>: ${expiring[1].toLowerCase()}. Pode limitar a escala em ${svc}.`, ['Formação', 'Escalas']]] : []),
    ['★', `Avaliação de desempenho de ${nf(perf, 1)}/5${perf > 4.4 ? ', no topo do serviço' : ''}.`, ['Avaliações']],
  ];
  const id = o.id || `e${i}`;
  return {
    id, generated: true, role, svc, hosp, leave,
    initials: initials(name), name, sex,
    meta: `${roleName(role, sex)} · ${svc} · ${hosp} · ${years} ${years === 1 ? 'ano' : 'anos'} na Luz Saúde`,
    tags: [['p-teal', termo ? 'Contrato a termo' : 'Contrato sem termo'], ...(night ? [['p-warn', 'Turnos rotativos']] : [['p-ok', 'Horário diurno']]), ...(o.tags || [])],
    risks: [['Risco de saída (12 meses)', leave, leave > .45 ? C.coral : leave > .3 ? C.sun : C.ok, why], ['Risco de burnout', burnout, burnout > .45 ? C.coral : burnout > .3 ? C.sun : C.ok, nights14 ? `${nights14} noites nos últimos 14 dias` : 'Sem noites recentes'], ['Absentismo previsto', absent, absent > .25 ? C.sun : C.ok, absent > .25 ? 'Acima da média do serviço' : 'Abaixo da média do serviço']],
    kpis: o.kpis || kpis, hours: { labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], base: hoursBase, extra: hoursExtra }, hoursLabel: o.hoursLabel, shifts, training, nba,
    extra: {
      insights,
      peers: [['Horas extra por mês', hoursExtra[5], role.startsWith('Admin') ? 2 : 11, ' h', false], ['Avaliação de desempenho', perf, 3.9, '', true], ...(night ? [['Noites nos últimos 14 dias', nights14, 3, '', false]] : []), ['Absentismo', +between(r, .4, 6).toFixed(1), 4.4, '%', false]],
      load: { title: 'Carga e descanso por semana', labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'], a: [night ? 'Noites' : 'Turnos', [0, 1, 2, 3, 4, 5, 6, 7].map(() => Math.round(night ? between(r, 0, 3.4) : between(r, 4, 5.4)))], b: ['Descansos < 11 h entre turnos', [0, 1, 2, 3, 4, 5, 6, 7].map(() => Math.round(night ? between(r, 0, 2.4) : 0))] },
      career: [[String(2026 - years), `Admissão · ${svc} · ${hosp}`], ...(years > 4 ? [[String(2026 - years + 3), 'Progressão na carreira']] : []), ...(years > 8 ? [[String(2026 - Math.round(years / 3)), 'Formador(a) interno(a)']] : []), ['2026', `Avaliação de desempenho: ${nf(perf, 1)}/5`]],
      retention: [['Custo de substituição', `≈ ${nf(role.startsWith('Méd') ? 52000 : role.startsWith('Enf') ? 34000 : 14000)} €`], ['Tempo até contratar', `${role.startsWith('Méd') ? 120 : role.startsWith('Enf') ? 74 : 35} dias`], ['Antiguidade', `${years} ${years === 1 ? 'ano' : 'anos'}`]],
    },
  };
}

// Surgeons from the Bloco operatório view (Dr. Ricardo Alves keeps his detailed profile).
const SURGEONS_LINK = [
  ['Dr. Rui Pinto', 'M', 'Ortopedia', 11, 31, 4, 88, 1.9], ['Dr. Tomás Vieira', 'M', 'Ortopedia', 6, 22, 18, 64, 3.1], ['Dr. Henrique Sá', 'M', 'Cirurgia Geral', 15, 34, 14, 79, 2.3],
  ['Dra. Inês Cardoso', 'F', 'Cirurgia Geral', 7, 29, 6, 90, 1.7], ['Dr. Miguel Antunes', 'M', 'Urologia', 12, 41, 5, 86, 1.2], ['Dra. Paula Reis', 'F', 'Ginecologia/Obstetrícia', 9, 27, 3, 92, 0.9],
  ['Dra. Clara Neves', 'F', 'Oftalmologia', 13, 96, 1, 95, 0.4], ['Dra. Sofia Brandão', 'F', 'Cirurgia Cardiotorácica', 18, 14, 9, 84, 2.8], ['Dr. Luís Faria', 'M', 'Otorrinolaringologia', 8, 33, 12, 81, 1.1], ['Dra. Ana Lemos', 'F', 'Cirurgia Plástica', 10, 21, 16, 87, 1.6],
];
export const GEN_EMPLOYEES = [
  ...SURGEONS_LINK.map(([name, sex, svc, years, n, delay, nps, compl], k) => makeEmployee(3000 + k, {
    id: `sg${k}`, name, sex, svc, hosp: 'HL Lisboa', years, roleRow: ROLES[1], tags: [['p-ml', 'Cirurgião(ã) · Bloco HL Lisboa']], hoursLabel: ['Cirurgias', 'Turnos de urgência'],
    kpis: [['Cirurgias este mês', String(n), 'Bloco HL Lisboa'], ['Atraso vs. duração prevista', `+${delay} min`, 'modelo ML de duração'], ['Complicações (12 m)', `${nf(compl, 1)}%`, 'serviço: 2,1%'], ['NPS dos doentes', String(nps), 'serviço: 73']],
  })),
  ...Array.from({ length: 170 }, (_, i) => makeEmployee(i)),
];
