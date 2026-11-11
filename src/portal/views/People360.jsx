import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ActionButton, Card, Chart, Html, Insight, useCopilot } from '../ui.jsx';
import { C, nf } from '../data.js';
import { EMPLOYEE_EXTRA, PATIENT_EXTRA } from './people360Extra.js';
import { GEN_EMPLOYEES, GEN_PATIENTS } from '../peopleGen.js';
import { CONDITIONS } from '../peopleParts.js';
import { Directory } from './Directory.jsx';

// Directory metadata for the hand-crafted profiles.
const FEAT_P = { ana: ['HL Lisboa', 'Diabetes tipo 2', .64, '58 anos · Multicare'], manuel: ['HL Arrábida', 'Insuficiência cardíaca', .58, '72 anos · ADSE · pós-operatório'], beatriz: ['HL Oeiras', 'Gravidez', .22, '33 anos · Médis · 31 semanas'] };
const FEAT_E = { joana: ['HL Lisboa', 'Enfermeiro(a)', .58, 'Medicina Interna · 9 anos'], ricardo: ['HL Lisboa', 'Médico(a)', .19, 'Ortopedia · 14 anos'], sara: ['HL Leiria', 'Técnico(a) superior de saúde', .46, 'Imagiologia · 8 meses'] };

// ---------- shared 360° pieces ----------
function Insights({ items, sub }) {
  return (
    <Card className="s2" title="Insights da Luz IA" pill="Cruza dados de vários sistemas" pillClass="p-ai" sub={sub}>
      {items.map(([ic, html, src]) => (
        <div key={html} className="insight">
          <div className="ic">{ic}</div>
          <div><Html html={html} /><div className="srcs">{src.map((x) => <span key={x}>{x}</span>)}</div></div>
        </div>
      ))}
    </Card>
  );
}

function Explain({ title, items }) {
  return (
    <Card title="Porque este risco?" pill="SHAP" pillClass="p-ml" sub={title}>
      <Chart ai={{ action: `Atuar primeiro sobre "${items[0][0].toLowerCase()}", o fator com maior peso nesta previsão.`, impact: `Remover os 2 fatores principais reduz até ${Math.round((items[0][1] + items[1][1]) * 100)}% da contribuição para o risco.` }} type="bars" opts={{ items: items.map(([l, v]) => ({ label: l, value: +(v * 100).toFixed(0), color: C.violet })), unit: '%' }} />
      <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>Contribuição de cada fator para a previsão deste doente.</p>
    </Card>
  );
}

// ---------- Doente 360° ----------
const PATIENTS = [
  {
    id: 'ana', initials: 'AS', name: 'Ana Sofia Ribeiro', meta: '58 anos · Processo n.º 2 004 581 · Cliente desde 2016 · Lisboa (Benfica)',
    tags: [['p-teal', 'LUZ ON PRIME'], ['p-ok', 'Multicare · plano Proteção Vital'], ['p-warn', 'Diabetes tipo 2'], ['p-warn', 'Hipertensão'], ['p-ai', 'Utilizadora ativa MY LUZ']],
    alerts: ['Alergia: penicilina (anafilaxia, 2011)', 'Rastreio de retinopatia em atraso há 9 meses'],
    risks: [['Descompensação diabética', .64, C.coral, 'HbA1c a subir 3 análises seguidas; Nutrição suspensa'], ['Falta à próxima consulta', .18, C.ok, 'Confirma sempre pela app'], ['Abandono do grupo', .31, C.sun, 'Plafond Multicare a 82%; 1 reclamação de faturação']],
    problems: [['E11.9', 'Diabetes mellitus tipo 2', '2019'], ['I10', 'Hipertensão essencial', '2017'], ['E78.0', 'Hipercolesterolemia', '2020'], ['M17.1', 'Gonartrose primária, joelho direito', '2024']],
    meds: [['Metformina 1000 mg', '2×/dia', 92], ['Sitagliptina 100 mg', '1×/dia', 71], ['Perindopril 5 mg', '1×/dia', 95], ['Atorvastatina 20 mg', '1×/dia', 64]],
    timeline: [
      ['03/11/2026', 'Análises clínicas · HL Lisboa', 'HbA1c 7,9% · LDL 118 mg/dL'], ['22/09/2026', 'Teleconsulta · Medicina Geral · LUZ 24', 'Ajuste anti-hipertensor'],
      ['14/07/2026', 'Check-up LUZ ON PRIME', 'Avaliador de Saúde preenchido na app'], ['08/04/2026', 'Consulta · Endocrinologia', 'Última consulta da especialidade'],
      ['17/01/2026', 'Urgência · HL Torres de Lisboa · triagem amarela', 'Hipoglicemia ligeira, alta no próprio dia'], ['02/10/2025', 'Consulta · Nutrição', 'Plano alimentar suspenso pela doente'],
    ],
    series: { labels: ['nov 24', 'fev 25', 'mai 25', 'ago 25', 'nov 25', 'fev 26', 'mai 26', 'ago 26', 'nov 26'], a: { name: 'HbA1c (%)', data: [7.4, 7.2, 7.0, 6.9, 7.1, 7.3, 7.5, 7.7, 7.9], min: 6, max: 8.5, target: 7 }, b: { name: 'Passos/dia (mil, app)', data: [7.8, 8.1, 8.4, 7.9, 6.6, 5.9, 5.4, 5.1, 4.8] } },
    nba: [['Marcar <b>Endocrinologia</b>. Seguimento em atraso há 4 meses.', 'Marcar via MY LUZ'], ['Agendar <b>rastreio de retinopatia</b>. Coberto pela Multicare.', 'Propor data'], ['Reativar <b>Nutrição</b> por teleconsulta: prefere horários ao fim do dia.', 'Enviar convite']],
    summary: 'Diabetes tipo 2 desde 2019 e hipertensão controlada. HbA1c com subida contínua desde a suspensão da Nutrição (7,1% → 7,9%), em paralelo com queda da atividade física registada na app (−40% de passos). Endocrinologia sem seguimento há 7 meses. Rastreio de retinopatia em atraso. Boa adesão digital: check-in pela app em 92% das visitas.',
    finance: [['Plafond anual Multicare usado', '82%'], ['Faturas em aberto', '1 · 46,20 €'], ['Valor dos últimos 3 anos', '6 840 €'], ['NPS (último inquérito)', '6 · faturação pouco clara']],
    social: [['Vive com', 'Marido'], ['Distância ao HL Lisboa', '4,2 km'], ['Canal preferido', 'App MY LUZ, fim do dia'], ['Wearable ligado', 'Sim · desde 2024']],
    consent: [['Partilha com Learning Health (anonimizada)', true], ['Comunicações de saúde personalizadas', true], ['Marketing de parceiros', false]],
  },
  {
    id: 'manuel', initials: 'MC', name: 'Manuel Carvalho', meta: '72 anos · Processo n.º 1 118 204 · Cliente desde 2009 · Vila Nova de Gaia',
    tags: [['p-ok', 'ADSE'], ['p-bad', 'Pós-operatório cardíaco'], ['p-warn', 'Fibrilhação auricular'], ['p-warn', 'Polimedicado (9 fármacos)']],
    alerts: ['Hipocoagulado: apixabano', 'Alta há 6 dias após bypass coronário (HL Arrábida)'],
    risks: [['Readmissão a 30 dias', .58, C.coral, 'Subiu de 41% para 58% com os dados da balança ligada'], ['Falta à reabilitação cardíaca', .37, C.sun, 'Sem transporte; 14 km do hospital'], ['Queda no domicílio', .22, C.sun, 'Novo diurético + 74 anos']],
    problems: [['I25.1', 'Doença coronária aterosclerótica', '2026'], ['I48.91', 'Fibrilhação auricular', '2021'], ['N18.3', 'Doença renal crónica, estádio 3', '2022'], ['E11.9', 'Diabetes mellitus tipo 2', '2015']],
    meds: [['Apixabano 5 mg', '2×/dia', 88], ['Bisoprolol 2,5 mg', '1×/dia', 90], ['Furosemida 40 mg', '1×/dia · novo', 0], ['Atorvastatina 80 mg', '1×/dia', 84], ['Metformina 500 mg', '2×/dia', 81]],
    timeline: [
      ['05/11/2026', 'Alta · Cirurgia Cardiotorácica · HL Arrábida', 'Bypass coronário triplo, 9 dias de internamento'], ['27/10/2026', 'Urgência · HL Arrábida · triagem laranja', 'Síndrome coronária aguda'],
      ['12/08/2026', 'Consulta · Cardiologia', 'Prova de esforço positiva'], ['30/05/2026', 'Análises clínicas', 'TFG 48 mL/min'],
    ],
    series: { labels: ['jun', 'jul', 'ago', 'set', 'out', '1/11', '5/11', '8/11', '11/11'], a: { name: 'Peso (kg, balança ligada)', data: [81.2, 81.0, 80.6, 80.9, 81.4, 79.8, 78.1, 78.9, 79.6], min: 76, max: 83, target: 79 }, b: { name: 'Frequência cardíaca em repouso', data: [72, 70, 74, 76, 82, 78, 74, 76, 79] } },
    nba: [['Teleconsulta de <b>enfermagem</b> amanhã: o peso subiu 1,5 kg em 3 dias.', 'Agendar teleconsulta'], ['Ativar <b>transporte</b> para a reabilitação cardíaca (coberto pela ADSE).', 'Pedir transporte'], ['Revisão de medicação: <b>9 fármacos</b>, interação furosemida + DRC.', 'Pedir revisão']],
    summary: 'Pós-operatório de bypass coronário triplo (alta a 05/11). Fibrilhação auricular hipocoagulada e doença renal crónica estádio 3. Vive sozinho. A balança ligada regista +1,5 kg em 3 dias e a frequência cardíaca em repouso está a subir: sinais precoces de descompensação. Furosemida iniciada na alta, sem levantamento na farmácia registado.',
    finance: [['Financiador', 'ADSE · regime convencionado'], ['Faturas em aberto', '0'], ['Episódio cirúrgico', '18 420 €'], ['NPS (internamento)', '9']],
    social: [['Vive com', 'Sozinho · filha em Lisboa'], ['Distância ao HL Arrábida', '14 km'], ['Canal preferido', 'Telefone · filha na app'], ['Dispositivos', 'Balança e tensiómetro ligados']],
    consent: [['Partilha com Learning Health (anonimizada)', true], ['Telemonitorização', true], ['Acesso da filha ao processo', true]],
  },
  {
    id: 'beatriz', initials: 'BG', name: 'Beatriz Gomes', meta: '33 anos · Processo n.º 3 402 977 · Cliente desde 2022 · Oeiras',
    tags: [['p-ok', 'Médis'], ['p-teal', 'Gravidez · 31 semanas'], ['p-ai', 'Utilizadora ativa MY LUZ']],
    alerts: ['Diabetes gestacional (diagnóstico às 26 semanas)'],
    risks: [['Parto pré-termo', .14, C.sun, 'Diabetes gestacional; colo normal'], ['Cesariana', .29, C.sun, 'Estimativa de peso fetal no P85'], ['Escolha de outro hospital para o parto', .22, C.sun, 'Visitou 2 maternidades no site']],
    problems: [['O24.4', 'Diabetes gestacional', '2026'], ['Z34.0', 'Vigilância de gravidez normal', '2026']],
    meds: [['Ácido fólico + iodo', '1×/dia', 97], ['Ferro oral', '1×/dia', 78]],
    timeline: [
      ['06/11/2026', 'Ecografia 3.º trimestre · HL Oeiras', 'Peso fetal estimado 1 790 g (P85)'], ['21/10/2026', 'Consulta · Obstetrícia', 'Glicemias controladas com dieta'],
      ['02/09/2026', 'Prova de tolerância à glicose', 'Diagnóstico de diabetes gestacional'], ['10/06/2026', 'Ecografia morfológica', 'Sem alterações'],
    ],
    series: { labels: ['20s', '22s', '24s', '26s', '27s', '28s', '29s', '30s', '31s'], a: { name: 'Glicemia em jejum (mg/dL)', data: [84, 86, 88, 97, 94, 91, 89, 90, 88], min: 75, max: 105, target: 92 }, b: { name: 'Aumento de peso (kg)', data: [5.1, 5.9, 6.8, 7.9, 8.3, 8.9, 9.4, 9.8, 10.3] } },
    nba: [['Convidar para a <b>visita à Maternidade</b> do HL Lisboa e curso de preparação para o parto.', 'Enviar convite'], ['Consulta de <b>Nutrição</b> por teleconsulta para a diabetes gestacional.', 'Marcar'], ['Pré-registo do parto e <b>plano de nascimento</b> na app.', 'Abrir pré-registo']],
    summary: 'Grávida de 31 semanas, diabetes gestacional controlada com dieta. Ecografia recente com peso fetal no percentil 85. Muito ativa na app MY LUZ. Visitou páginas de maternidades de outros grupos: oportunidade de fidelização para o parto e o acompanhamento pediátrico.',
    finance: [['Financiador', 'Médis · plano com parto'], ['Faturas em aberto', '0'], ['Valor previsto do parto', '3 640 €'], ['NPS', '10']],
    social: [['Vive com', 'Companheiro'], ['Distância ao HL Oeiras', '3,1 km'], ['Canal preferido', 'App MY LUZ'], ['Notificações', 'Ativas']],
    consent: [['Partilha com Learning Health (anonimizada)', false], ['Comunicações de saúde personalizadas', true], ['Marketing de parceiros', true]],
  },
];

export function Patient360() {
  const location = useLocation();
  const [pid, setPid] = useState(location.state?.pick || 'ana');
  useEffect(() => { if (location.state?.pick) setPid(location.state.pick); }, [location]);
  const all = [...PATIENTS, ...GEN_PATIENTS];
  const p = all.find((x) => x.id === pid) || PATIENTS[0];
  const x = PATIENT_EXTRA[p.id] || p.extra;
  const cp = useCopilot();
  useEffect(() => { cp?.setSubject({ person: p, extra: x }); }, [p.id]);
  const rows = all.map((q) => (FEAT_P[q.id]
    ? { id: q.id, name: q.name, hosp: FEAT_P[q.id][0], group: FEAT_P[q.id][1], risk: FEAT_P[q.id][2], sub: FEAT_P[q.id][3], featured: true }
    : { id: q.id, name: q.name, hosp: q.hosp, group: CONDITIONS[q.cond].label, risk: q.risk, sub: `${q.age} anos · ${q.finance[0][1]}${q.id.startsWith('cx') ? ' · cirurgia amanhã' : ''}`, featured: q.id.startsWith('cx') && q.id === 'cx1' }));
  return (
    <>
      <Directory rows={rows} sel={p.id} onSel={setPid} noun="doente" groupLabel="Condição" riskLabel="Risco principal" note="visível a profissionais com relação terapêutica · dados fictícios" />

      <div className="grid g3" key={p.id}>
        <div className="card s2">
          <div className="pt-head">
            <div className="pt-av">{p.initials}</div>
            <div>
              <h3 style={{ fontSize: 20 }}>{p.name}</h3>
              <div className="sub" style={{ margin: '2px 0 0' }}>{p.meta}</div>
              <div className="tags">{p.tags.map(([c, t]) => <span key={t} className={`pill ${c}`}>{t}</span>)}</div>
            </div>
          </div>
          <div className="alerts">{p.alerts.map((a) => <div key={a}>⚠ {a}</div>)}</div>
          <div className="grid g3" style={{ marginTop: 14 }}>
            {p.risks.map(([l, v, c, why]) => (
              <div key={l}><Chart type="gauge" opts={{ value: v, color: c, label: l }} /><p className="why">{why}</p></div>
            ))}
          </div>
        </div>
        <Card title="Próxima melhor ação" pill="Luz IA" pillClass="p-ai" sub="Priorizada por impacto clínico e preferência do doente">
          {p.nba.map(([t, a], i) => (
            <Insight key={t} icon={i + 1} actions={<ActionButton primary label={a} done="Feito" toast="Ação registada e notificação enviada" />}><Html html={t} /></Insight>
          ))}
        </Card>
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Insights items={x.insights} sub="Gerados hoje a partir do processo clínico, app, farmácia, faturação e seguradora" />
        <Explain title={p.risks[x.explainFor][0]} items={x.shap} />
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title="Lacunas de cuidados" pill={`${x.gaps.filter((g) => g[2] !== 'p-ok').length} por resolver`} pillClass="p-warn" sub="Comparação com as normas clínicas aplicáveis">
          {x.gaps.map(([t, st, c, d]) => (
            <div key={t} className="metric"><span>{t}<br /><small style={{ color: 'var(--muted)' }}>{d}</small></span><span className={`pill ${c}`}>{st}</span></div>
          ))}
        </Card>
        <Card title={x.projection.title} pill="ML · simulação" pillClass="p-ml" sub="Trajetória prevista com e sem as ações recomendadas">
          <Chart ai={{ action: `${x.projection.actionName}.`, impact: `No último ponto, ${nf(Math.abs(x.projection.base[x.projection.base.length - 1] - x.projection.action[x.projection.action.length - 1]), 0)}${x.projection.unit} de diferença face ao cenário sem ação.` }} type="line" opts={{ labels: x.projection.labels, unit: x.projection.unit, min: x.projection.min, max: x.projection.max, height: 200, series: [
            { name: 'Sem ação', color: C.coral, data: x.projection.base, dash: true },
            { name: x.projection.actionName, color: C.teal, data: x.projection.action, width: 2.6 },
            ...(x.projection.target ? [{ name: 'Alvo', color: C.grey, width: 1, data: Array(x.projection.labels.length).fill(x.projection.target) }] : []),
          ] }} />
        </Card>
        <Card title="Equipa e próximas marcações" sub="Quem acompanha e o que está agendado">
          {x.team.map(([r, n]) => <div key={r} className="metric"><span>{r}</span><b>{n}</b></div>)}
          <h4 className="mini-h" style={{ marginTop: 14 }}>Próximas marcações</h4>
          {x.upcoming.map(([d, t, c]) => <div key={t} className="metric"><span>{t}</span><span className={`pill ${c}`}>{d}</span></div>)}
        </Card>
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title="Percurso de cuidados" sub="Urgência, consulta, teleconsulta, exames e app num só sítio">
          <div className="tl">{p.timeline.map(([d, t, s]) => <div key={d + t} className="tl-i"><b>{t}</b><small>{d} · {s}</small></div>)}</div>
        </Card>
        <Card title="Indicadores clínicos e dispositivos" sub="Análises, medições e dados da app">
          <Chart ai={{ action: `Rever ${p.series.a.name.split(' (')[0]} com ${x.team[0][1].split(' · ')[0]} e confirmar o plano em curso.`, impact: 'Valores fora do alvo em 3 medições seguidas aumentam o risco principal deste doente.' }} type="line" opts={{ labels: p.series.labels, min: p.series.a.min, max: p.series.a.max, height: 150, series: [{ name: p.series.a.name, color: C.coral, data: p.series.a.data }, { name: 'Alvo', color: C.grey, width: 1, data: Array(9).fill(p.series.a.target) }] }} />
          <Chart ai={{ action: `Acompanhar ${p.series.b.name.split(' (')[0].toLowerCase()} pela app e alertar a equipa se a tendência se mantiver 7 dias.`, impact: 'Os dados de dispositivos e da app antecipam a deterioração, em média, 2 a 4 dias antes da consulta.' }} style={{ marginTop: 6 }} type="line" opts={{ labels: p.series.labels, height: 140, series: [{ name: p.series.b.name, color: C.teal, data: p.series.b.data, area: true }] }} />
        </Card>
        <Card title="Resumo clínico" pill="Cortex AI" pillClass="p-ai" sub="Gerado a partir de todos os documentos do processo">
          <p style={{ lineHeight: 1.65, fontSize: 13 }}>{p.summary}</p>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>Revisto por médico: não · Gerado hoje às 07:12</div>
        </Card>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Utilização nos últimos 12 meses" sub="Episódios e custos em todos os hospitais e clínicas">
          <div className="grid g4">{x.use.map(([k, v, d]) => <div key={k} className="kpi"><div className="lbl">{k}</div><div className="v" style={{ fontSize: 22 }}>{v}</div><div className="d neu">{d}</div></div>)}</div>
        </Card>
        <Card title="Envolvimento digital" sub={x.app.name}>
          <Chart ai={{ action: 'Usar a app como canal principal para as próximas ações e lembretes deste doente.', impact: 'Doentes com lembretes pela app faltam 1,4 p.p. menos e aderem mais 12% aos seguimentos.' }} type="columns" opts={{ labels: x.app.labels, height: 150, series: [{ name: x.app.name, color: C.teal, data: x.app.data }] }} />
        </Card>
      </div>

      <div className="grid g4" style={{ marginTop: 16 }}>
        <Card title="Problemas ativos" sub="CID-10">
          {p.problems.map(([c, t, y]) => <div key={c} className="metric"><span><b>{c}</b> {t}</span><b>{y}</b></div>)}
        </Card>
        <Card title="Medicação e adesão" sub="Levantamentos na farmácia, últimos 90 dias">
          {p.meds.map(([m, f, a]) => (
            <div key={m} style={{ padding: '6px 0' }}>
              <div className="metric" style={{ border: 0, padding: 0 }}><span><b>{m}</b> · {f}</span><b style={{ color: a < 70 ? C.coral : 'inherit' }}>{a ? `${a}%` : 'sem levantamento'}</b></div>
              <div className="progress" style={{ marginTop: 4 }}><i style={{ width: `${a}%`, background: a < 70 ? C.coral : C.teal }} /></div>
            </div>
          ))}
        </Card>
        <Card title="Relação e financiamento" sub="Faturação, seguro e satisfação">
          {p.finance.map(([k, v]) => <div key={k} className="metric"><span>{k}</span><b>{v}</b></div>)}
        </Card>
        <Card title="Contexto e consentimentos" sub="Determinantes sociais e RGPD">
          {p.social.map(([k, v]) => <div key={k} className="metric"><span>{k}</span><b>{v}</b></div>)}
          {p.consent.map(([k, v]) => <div key={k} className="metric"><span>{k}</span><span className={`pill ${v ? 'p-ok' : 'p-bad'}`}>{v ? 'Consentido' : 'Recusado'}</span></div>)}
        </Card>
      </div>
    </>
  );
}

// ---------- Colaborador 360° ----------
const EMPLOYEES = [
  {
    id: 'joana', initials: 'JM', name: 'Enf.ª Joana Matos', meta: 'Enfermeira especialista · Medicina Interna · HL Lisboa · 9 anos na Luz Saúde',
    tags: [['p-teal', 'Contrato sem termo'], ['p-ok', 'Especialista em reabilitação'], ['p-warn', 'Turnos rotativos']],
    risks: [['Risco de saída (12 meses)', .58, C.coral, '3 meses seguidos com > 20 h extra; pedido de mudança de horário recusado'], ['Risco de burnout', .52, C.coral, '6 noites nos últimos 14 dias; 2 fins de semana seguidos'], ['Absentismo previsto', .21, C.sun, 'Abaixo da média do serviço']],
    kpis: [['Horas este mês', '176 h', '+22 h extra'], ['Doentes por turno', '7,4', 'serviço: 7,2'], ['Avaliação de desempenho', '4,6 / 5', 'top 10%'], ['Elogios de doentes', '14', 'no ano']],
    hours: { labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], base: [148, 152, 150, 154, 150, 154], extra: [12, 24, 21, 23, 26, 22] },
    shifts: [[1, 1, 0, 2, 2, 0, 0], [3, 3, 3, 0, 0, 1, 1], [2, 2, 0, 3, 3, 3, 0], [0, 1, 1, 2, 3, 3, 3]],
    training: [['Suporte Básico de Vida', 'Válido até 03/2027', 'p-ok'], ['Prevenção de IACS', 'Expira em 12 dias', 'p-warn'], ['Gestão de cateteres venosos', 'Concluído 2026', 'p-ok'], ['Liderança de equipas', 'Inscrita · jan 2027', 'p-ml']],
    nba: [['Aceitar o pedido de <b>horário fixo de manhã</b> a partir de janeiro: reduz o risco de saída para 0,31.', 'Propor ao enfermeiro-chefe'], ['Limitar a <b>2 noites por semana</b> nas próximas 4 semanas.', 'Ajustar escala'], ['Renovar formação em <b>Prevenção de IACS</b> antes do fim do prazo.', 'Inscrever']],
  },
  {
    id: 'ricardo', initials: 'RA', name: 'Dr. Ricardo Alves', meta: 'Cirurgião ortopédico · HL Lisboa e HL Torres de Lisboa · 14 anos na Luz Saúde',
    tags: [['p-teal', 'Prestação de serviços'], ['p-ok', 'Coordenador da Unidade de Joelho'], ['p-ai', 'Docente Católica Medical School']],
    risks: [['Risco de saída (12 meses)', .19, C.ok, 'Estável; aumento de blocos atribuídos em 2026'], ['Cancelamentos cirúrgicos', .27, C.sun, '4,1% vs. serviço 3,2%: atrasos na sala 4'], ['Readmissão dos seus doentes', .12, C.ok, 'Abaixo da média do serviço']],
    kpis: [['Cirurgias este mês', '38', '▲ 6 vs. média'], ['Duração vs. prevista', '+7 min', 'modelo ML: 94 min'], ['Complicações (12 m)', '1,4%', 'serviço: 2,1%'], ['NPS dos doentes', '82', 'top 5% do grupo']],
    hours: { labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], base: [32, 28, 18, 34, 36, 38], extra: [4, 4, 2, 4, 5, 4] },
    hoursLabel: ['Cirurgias', 'Turnos de urgência'],
    shifts: [[2, 1, 0, 2, 1, 0, 0], [1, 2, 0, 1, 2, 3, 0], [2, 1, 0, 2, 1, 0, 0], [1, 2, 0, 1, 2, 0, 0]],
    training: [['Cirurgia robótica', 'Certificado 2025', 'p-ok'], ['Suporte Avançado de Vida', 'Expira em 2 meses', 'p-warn'], ['Ensaio LH-ORT-024', 'Investigador principal', 'p-ml']],
    nba: [['Mover as cirurgias de quinta-feira da <b>sala 4</b>: 70% dos atrasos vêm da limpeza entre cirurgias.', 'Propor ao bloco'], ['Renovar <b>Suporte Avançado de Vida</b>.', 'Inscrever'], ['Incluir no programa de <b>mentoria</b> de internos de Ortopedia.', 'Convidar']],
  },
  {
    id: 'sara', initials: 'SN', name: 'Sara Nunes', meta: 'Técnica de radiologia · Imagiologia · HL Leiria (nova unidade) · 8 meses na Luz Saúde',
    tags: [['p-teal', 'Contrato a termo'], ['p-ml', 'Período de integração'], ['p-ok', 'Ressonância magnética']],
    risks: [['Risco de saída (12 meses)', .46, C.sun, 'Contrato a termo; 58 km de casa; sem progressão definida'], ['Necessidade de formação', .62, C.coral, '2 protocolos de TC ainda por certificar'], ['Absentismo previsto', .15, C.ok, 'Baixo']],
    kpis: [['Exames este mês', '412', '▲ 18% vs. setembro'], ['Tempo médio por RM', '31 min', 'alvo: 30 min'], ['Repetições de exame', '1,9%', 'unidade: 2,6%'], ['Integração concluída', '72%', 'de 18 módulos']],
    hours: { labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], base: [150, 152, 151, 152, 150, 150], extra: [4, 6, 2, 8, 12, 9] },
    shifts: [[1, 1, 1, 1, 1, 0, 0], [2, 2, 2, 0, 1, 1, 0], [1, 1, 1, 1, 1, 0, 0], [2, 2, 0, 2, 2, 0, 1]],
    training: [['Proteção radiológica', 'Válido', 'p-ok'], ['Protocolos TC cardíaca', 'Por certificar', 'p-warn'], ['Protocolos TC oncológica', 'Por certificar', 'p-warn'], ['RM de próstata (multiparamétrica)', 'Concluído', 'p-ok']],
    nba: [['Propor <b>conversão para sem termo</b>: desempenho no top 20% da Imagiologia do grupo.', 'Propor a RH'], ['Agendar os 2 protocolos de <b>TC</b> no HL Lisboa (formação em contexto).', 'Agendar'], ['Avaliar <b>mobilidade</b> para HL Coimbra (12 km de casa).', 'Registar interesse']],
  },
];
const SHIFT = [['Folga', 'rgba(0,60,80,.06)'], ['Manhã', '#a8e4ec'], ['Tarde', '#00acc1'], ['Noite', '#004f5a']];

export function Employee360() {
  const location = useLocation();
  const [eid, setEid] = useState(location.state?.pick || 'joana');
  useEffect(() => { if (location.state?.pick) setEid(location.state.pick); }, [location]);
  const all = [...EMPLOYEES, ...GEN_EMPLOYEES];
  const e = all.find((x) => x.id === eid) || EMPLOYEES[0];
  const [l1, l2] = e.hoursLabel || ['Horas normais', 'Horas extra'];
  const x = EMPLOYEE_EXTRA[e.id] || e.extra;
  const cp = useCopilot();
  useEffect(() => { cp?.setSubject({ person: e, extra: x }); }, [e.id]);
  const rows = all.map((q) => (FEAT_E[q.id]
    ? { id: q.id, name: q.name, hosp: FEAT_E[q.id][0], group: FEAT_E[q.id][1], risk: FEAT_E[q.id][2], sub: FEAT_E[q.id][3], featured: true }
    : { id: q.id, name: q.name, hosp: q.hosp, group: q.role, risk: q.leave, sub: q.meta.split(' · ').slice(1, 2).concat(q.id.startsWith('sg') ? ['Bloco HL Lisboa'] : []).join(' · ') }));
  return (
    <>
      <Directory rows={rows} sel={e.id} onSel={setEid} noun="colaborador" groupLabel="Função" riskLabel="Risco de saída" note="acesso de chefia direta e RH · dados fictícios" />

      <div className="grid g3" key={e.id}>
        <div className="card s2">
          <div className="pt-head">
            <div className="pt-av" style={{ background: 'linear-gradient(135deg,#a8e4ec,#00acc1)', color: '#003842' }}>{e.initials}</div>
            <div>
              <h3 style={{ fontSize: 20 }}>{e.name}</h3>
              <div className="sub" style={{ margin: '2px 0 0' }}>{e.meta}</div>
              <div className="tags">{e.tags.map(([c, t]) => <span key={t} className={`pill ${c}`}>{t}</span>)}</div>
            </div>
          </div>
          <div className="grid g3" style={{ marginTop: 14 }}>
            {e.risks.map(([l, v, c, why]) => (
              <div key={l}><Chart type="gauge" opts={{ value: v, color: c, label: l }} /><p className="why">{why}</p></div>
            ))}
          </div>
        </div>
        <Card title="Ações recomendadas" pill="Luz IA" pillClass="p-ai" sub="Retenção, bem-estar e desenvolvimento">
          {e.nba.map(([t, a], i) => (
            <Insight key={t} icon={i + 1} actions={<ActionButton primary label={a} done="Registado" toast="Ação enviada à chefia direta" />}><Html html={t} /></Insight>
          ))}
        </Card>
      </div>

      <div className="grid g4" style={{ marginTop: 16 }}>
        {e.kpis.map(([l, v, d]) => <div key={l} className="card kpi"><div className="lbl">{l}</div><div className="v">{v}</div><div className="d neu">{d}</div></div>)}
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Insights items={x.insights} sub="Cruzam escalas, qualidade, formação, RH e operações" />
        <Card title="Comparação com os pares" sub="Mediana da mesma função e serviço">
          {x.peers.map(([l, v, m, u, hi]) => {
            const good = hi ? v >= m : v <= m;
            const max = Math.max(v, m) * 1.15;
            return (
              <div key={l} className="peer">
                <div className="metric" style={{ border: 0, padding: 0 }}><span>{l}</span><b style={{ color: good ? C.ok : C.coral }}>{nf(v, v % 1 ? 1 : 0)}{u}</b></div>
                <div className="progress" style={{ position: 'relative', overflow: 'visible' }}>
                  <i style={{ width: `${v / max * 100}%`, background: good ? C.ok : C.coral }} />
                  <span className="peer-mark" style={{ left: `${m / max * 100}%` }} title={`Pares: ${m}${u}`} />
                </div>
                <small style={{ color: 'var(--muted)' }}>Pares: {nf(m, m % 1 ? 1 : 0)}{u}</small>
              </div>
            );
          })}
        </Card>
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title="Escala das últimas 4 semanas" sub="Turnos por dia (segunda a domingo)">
          <div className="shifts">
            <span /> {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => <span key={i} className="hc">{d}</span>)}
            {e.shifts.map((w, wi) => (
              <span key={wi} style={{ display: 'contents' }}>
                <span className="hr">Sem {wi + 1}</span>
                {w.map((s, di) => <span key={di} className="cell" style={{ background: SHIFT[s][1] }} title={SHIFT[s][0]} />)}
              </span>
            ))}
          </div>
          <div className="legend">{SHIFT.map(([n, c]) => <span key={n}><i style={{ background: c }} />{n}</span>)}</div>
        </Card>
        <Card title={e.hoursLabel ? 'Atividade mensal' : 'Horas trabalhadas'} sub="Últimos 6 meses">
          <Chart ai={{ action: e.hoursLabel ? 'Manter os blocos atribuídos e reduzir urgências noturnas nas semanas com mais cirurgias.' : 'Limitar as horas extra a 12 h por mês e cobrir os picos previstos com a bolsa interna.', impact: e.hoursLabel ? 'Protege a disponibilidade para o bloco, onde o profissional gera mais valor.' : 'Reduz o risco de saída e de burnout sem aumentar o custo total.' }} type="columns" opts={{ labels: e.hours.labels, stacked: true, height: 200, series: [{ name: l1, color: C.teal, data: e.hours.base }, { name: l2, color: C.coral, data: e.hours.extra }] }} />
        </Card>
        <Card title="Formação e certificações" sub="Obrigatórias e de desenvolvimento">
          {e.training.map(([t, s, c]) => <div key={t} className="metric"><span>{t}</span><span className={`pill ${c}`}>{s}</span></div>)}
          <div className="metric"><span>Remuneração</span><b className="masked" title="Política de mascaramento: visível apenas para RH">●●●●● €</b></div>
          <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>A remuneração está mascarada por uma política Snowflake: só o perfil RH a vê.</p>
        </Card>
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title={x.load.title} sub="Últimas 8 semanas">
          <Chart ai={{ action: `Rever a escala das próximas 4 semanas com base em "${x.load.b[0].toLowerCase()}".`, impact: 'Respeitar 11 h de descanso entre turnos reduz em ≈ 30% o risco de erro clínico associado à fadiga.' }} type="columns" opts={{ labels: x.load.labels, height: 190, series: [{ name: x.load.a[0], color: C.petrol, data: x.load.a[1] }, { name: x.load.b[0], color: C.coral, data: x.load.b[1] }] }} />
        </Card>
        <Card title="Percurso profissional" sub="Na Luz Saúde">
          <div className="tl">{x.career.map(([d, t]) => <div key={d + t} className="tl-i"><b>{t}</b><small>{d}</small></div>)}</div>
        </Card>
        <Card title="Retenção" pill="RH" pillClass="p-teal" sub="O que está em jogo">
          {x.retention.map(([k, v]) => <div key={k} className="metric"><span>{k}</span><b>{v}</b></div>)}
          <p className="sub" style={{ marginTop: 12, marginBottom: 0 }}>O risco de saída não usa género, idade nem nacionalidade. A decisão é sempre da chefia e de RH.</p>
        </Card>
      </div>
    </>
  );
}
