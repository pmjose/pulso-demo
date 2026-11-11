import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionButton, Card, Kpi, useActions, usePersona, useToast } from '../ui.jsx';
import { GROUP, nf } from '../data.js';
import { ANOMALIES, DICTIONARY, PLAN } from '../analytics.js';

// ---------- personas ----------
export const PERSONAS = [
  { id: 'ceo', name: 'Dra. Carolina Mendes', initials: 'CM', role: 'Presidente da Comissão Executiva', kpis: [['Receita acumulada 2026', `${nf(GROUP.ytdRevenue, 1)} M€`, '+1,1% vs. orçamento', 'up'], ['Margem operacional', '17,7%', 'plano 18,2%', 'down'], ['NPS', '71', '▲ 3 pontos', 'up'], ['Ocupação de internamento', '85,6%', '15 hospitais', 'neu']],
    digest: ['A receita de outubro fechou em <b>83,8 M€</b>, 0,6% abaixo do orçamento do mês, mas o acumulado continua <b>+1,1%</b> acima.', 'A ocupação do <b>HL Lisboa</b> deve passar 92% na quinta e sexta-feira; o plano de contingência aguarda aprovação da Direção Clínica.', 'O <b>HL Leiria</b> está 3 p.p. abaixo do plano de abertura em ocupação.', 'A taxa de rejeição da <b>AdvanceCare</b> subiu para 4,9% (esperado 3,1%).'],
    links: [['Análise de variação', 'variacao'], ['Relatório do conselho', 'relatorio'], ['Novas unidades', 'novas']] },
  { id: 'clin', name: 'Dra. Marta Correia', initials: 'MC', role: 'Direção Clínica', kpis: [['Readmissões a 30 dias', '6,8%', 'referência 8,1%', 'up'], ['Infeção hospitalar (IACS)', '3,1%', 'referência 5,0%', 'up'], ['Espera média na urgência', '38 min', '▼ 6 min vs. ontem', 'up'], ['Ocupação de internamento', '85,6%', 'HL Lisboa 91,2%', 'down']],
    digest: ['O orquestrador propôs um <b>plano para a frente fria</b> de sexta-feira: 22 altas antecipadas, 6 transferências e reforço de escalas. Aguarda a sua aprovação.', 'A vigilância de sépsis gerou <b>14 alertas</b> nas últimas 24 h; 12 confirmados pelo médico.', 'A demora média em <b>Ortopedia</b> subiu para 4,1 dias, sobretudo por fraturas do colo do fémur em maiores de 80 anos.', 'A espera na triagem laranja do <b>HL Arrábida</b> está em 14 min (alvo 10).'],
    links: [['Agentes IA', 'agentes'], ['Qualidade clínica', 'qualidade'], ['Operações hospitalares', 'operacoes']] },
  { id: 'cfo', name: 'Dr. João Novais', initials: 'JN', role: 'Direção Financeira', kpis: [['Receita acumulada 2026', `${nf(GROUP.ytdRevenue, 1)} M€`, `orçamento ${nf(PLAN.ytdBudget, 1)} M€`, 'up'], ['Prazo médio de recebimento', '47 dias', '▼ 5 dias no trimestre', 'up'], ['Taxa de rejeição', '3,4%', '▼ 0,9 p.p. com IA', 'up'], ['Margem operacional', '17,7%', 'plano 18,2%', 'down']],
    digest: ['A ponte da receita mostra <b>+58,6 M€</b> face a 2025: volume +30,9, preço +17,9, mix +9,8.', 'A <b>AdvanceCare</b> rejeitou 4,9% do faturado esta semana; o motivo dominante é autorização prévia em falta.', 'A previsão de fecho está em <b>875 M€</b>, +7 M€ acima do orçamento.', 'Foram identificados <b>≈ 0,25 M€</b> de poupança por harmonização de preços em 5 artigos.'],
    links: [['Análise de variação', 'variacao'], ['Planeamento e cenários', 'planeamento'], ['Receita e seguradoras', 'receita']] },
  { id: 'hosp', name: 'Dr. Pedro Lacerda', initials: 'PL', role: 'Diretor · Hospital da Luz Lisboa', kpis: [['Ocupação de camas', '91,2%', '540 camas', 'down'], ['Espera média na urgência', '46 min', 'pico previsto sex. 20h', 'down'], ['Utilização do bloco', '78,2%', 'objetivo 85%', 'down'], ['Cirurgias canceladas', '3,6%', 'alvo < 4%', 'up']],
    digest: ['Ocupação prevista de <b>93,1%</b> na sexta-feira; Medicina Interna já está a 97%.', 'O stock de <b>contraste iodado</b> cobre 4 dias; o agente propõe transferir 380 unidades do HL Coimbra.', 'A enfermeira <b>Joana Matos</b> (Medicina Interna) tem risco de saída de 58%; há uma ação de retenção proposta.', 'Há 28 movimentos de camas propostos pelo gestor de camas.'],
    links: [['Fluxo de doentes', 'fluxo'], ['Farmácia e stocks', 'stocks'], ['Colaborador 360°', 'colaborador']] },
  { id: 'nurse', name: 'Enf.ª Teresa Moura', initials: 'TM', role: 'Direção de Enfermagem', kpis: [['Horas extra (mês)', '38 400', '▲ 9% · época gripal', 'down'], ['Absentismo', '4,7%', '▼ 0,4 p.p.', 'up'], ['Profissionais por cama', '6,6', 'referência 6,5', 'up'], ['Readmissões a 30 dias', '6,8%', 'seguimento pós-alta ativo', 'up']],
    digest: ['O turno da noite de <b>Medicina Interna (HL Lisboa)</b> está 54% acima do rácio-alvo.', 'O agente de escalas propõe <b>2 reforços</b> da bolsa interna, excluindo 3 enfermeiros com risco de burnout.', '63% das horas extra dos últimos 3 meses eram <b>previsíveis com 7 dias</b>.', 'A formação em <b>Prevenção de IACS</b> expira em 12 dias para 41 enfermeiros.'],
    links: [['Pessoas e capacidade', 'pessoas'], ['Colaborador 360°', 'colaborador'], ['Agentes IA', 'agentes']] },
  { id: 'hr', name: 'Dra. Rita Fonseca', initials: 'RF', role: 'Direção de Recursos Humanos', kpis: [['Absentismo', '4,7%', '▼ 0,4 p.p.', 'up'], ['Horas extra (mês)', '38 400', '▲ 9%', 'down'], ['Profissionais por cama', '6,6', 'referência 6,5', 'up'], ['Readmissões a 30 dias', '6,8%', '', 'neu']],
    digest: ['<b>27 colaboradores</b> passaram a risco de saída alto este mês, 19 deles enfermeiros especialistas.', 'O contrato a termo de <b>Sara Nunes</b> (HL Leiria) termina em 03/2027; o desempenho está no top 20%.', 'O inquérito de clima mostra <b>2,1/5</b> em equilíbrio vida-trabalho em Medicina Interna.', 'Há <b>2 vagas</b> de técnico de radiologia no HL Coimbra compatíveis com mobilidade interna.'],
    links: [['Colaborador 360°', 'colaborador'], ['Pessoas e capacidade', 'pessoas'], ['Plano de ações', 'acoes']] },
];

// ---------- Início ----------
export function Home() {
  const navigate = useNavigate();
  const { persona, setPersona } = usePersona();
  const { actions } = useActions();
  const P = PERSONAS.find((p) => p.id === persona) || PERSONAS[1];
  const mine = actions.filter((a) => a.ownerId === P.id || (!a.ownerId && P.id === 'clin'));
  const hour = 12;
  return (
    <>
      <div className="switch" role="tablist" aria-label="Perfil">
        {PERSONAS.map((p) => <button key={p.id} role="tab" aria-selected={p.id === P.id} className={p.id === P.id ? 'on' : ''} onClick={() => setPersona(p.id)}>{p.role}</button>)}
      </div>
      <div className="hello">
        <h2>{hour < 12 ? 'Bom dia' : 'Boa tarde'}, {P.name.split(' ').slice(0, 2).join(' ')}.</h2>
        <p>{P.role} · quarta-feira, 11 de novembro de 2026</p>
      </div>
      <div className="grid g4">{P.kpis.map(([l, v, d, t]) => <Kpi key={l} label={l} value={v} delta={d} tone={t} />)}</div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="O que mudou desde ontem" pill="Resumo gerado pela Luz IA às 07:00" pillClass="p-ai" sub="Só o que é relevante para a sua função">
          {P.digest.map((d, i) => <div key={i} className="insight"><div className="ic">{i + 1}</div><div><p dangerouslySetInnerHTML={{ __html: d }} /></div></div>)}
          <div className="act" style={{ marginTop: 6 }}>{P.links.map(([l, to]) => <button key={to} className="btn" onClick={() => navigate(`/portal/${to}`)}>{l}</button>)}</div>
        </Card>
        <div className="phone" aria-label="Resumo na app móvel">
          <div className="ph-notch" />
          <div className="ph-top"><small>08:00</small><b>Resumo matinal</b></div>
          {P.kpis.slice(0, 3).map(([l, v, d]) => <div key={l} className="ph-kpi"><small>{l}</small><b>{v}</b><span>{d}</span></div>)}
          <div className="ph-alert">⚠ {ANOMALIES[0][1]} · {ANOMALIES[0][2]}</div>
          <div className="ph-alert">⏳ {mine.filter((a) => a.status !== 'Concluída').length} ações à sua espera</div>
          <small className="ph-foot">Enviado pela app Luz Saúde · também por email às 07:00</small>
        </div>
      </div>
      <Card style={{ marginTop: 16 }} title="As minhas ações" sub="Do plano de ações, atribuídas a si">
        {mine.length ? (
          <table className="tabular"><thead><tr><th>Ação</th><th>Origem</th><th>Prazo</th><th>Estado</th></tr></thead>
            <tbody>{mine.slice(0, 6).map((a) => <tr key={a.id}><td><b>{a.title}</b></td><td>{a.source}</td><td>{a.due}</td><td><span className={`pill ${STATUS[a.status]}`}>{a.status}</span></td></tr>)}</tbody></table>
        ) : <p className="sub">Sem ações atribuídas.</p>}
      </Card>
    </>
  );
}

// ---------- Plano de ações ----------
export const STATUS = { 'Por iniciar': 'p-ml', 'Em curso': 'p-warn', 'Concluída': 'p-ok', 'Atrasada': 'p-bad' };
export const SEED_ACTIONS = [
  ['Plano de contingência para a frente fria (sexta-feira)', 'Agente orquestrador', 'clin', 'Direção Clínica', 'Grupo', '12/11', 'Por iniciar', 'Espera na urgência 74 → 43 min', null],
  ['Ativar agente de autorizações prévias em toda a imagiologia', 'Insight · Receita', 'cfo', 'Direção Financeira', 'Grupo', '30/11', 'Em curso', '≈ 1,4 M€/ano', '0,38 M€ até hoje'],
  ['Antecipar altas de Medicina Interna antes das 12h', 'Insight · Fluxo de doentes', 'hosp', 'Direção HL Lisboa', 'HL Lisboa', '13/11', 'Em curso', '≈ 60 camas-dia por semana', '41 camas-dia'],
  ['Transferir 380 unidades de contraste do HL Coimbra', 'Agente de stocks', 'hosp', 'Farmácia', 'HL Lisboa', '12/11', 'Concluída', 'Rutura evitada', 'Rutura evitada'],
  ['Horário fixo de manhã para a Enf.ª Joana Matos', 'Colaborador 360°', 'nurse', 'Enfermeiro-chefe MI', 'HL Lisboa', '01/01', 'Por iniciar', 'Risco de saída 0,58 → 0,31', null],
  ['Converter contrato de Sara Nunes para sem termo', 'Colaborador 360°', 'hr', 'Recursos Humanos', 'HL Leiria', '31/01', 'Por iniciar', 'Permanência a 2 anos 91%', null],
  ['Bloco quinzenal extra na Unidade de Joelho', 'Insight · Percurso do doente', 'hosp', 'Direção do Bloco', 'HL Lisboa', '15/12', 'Por iniciar', 'Espera 41 → 29 dias', null],
  ['Campanha de seguimento de 4 120 diabéticos', 'Insight · Visão geral', 'clin', 'Experiência do Cliente', 'Grupo', '20/11', 'Em curso', '+12% adesão a seguimentos', '6% até hoje'],
  ['Reunião com a AdvanceCare sobre rejeições', 'Anomalia detetada', 'cfo', 'Direção Financeira', 'Grupo', '18/11', 'Por iniciar', 'Rejeição 4,9% → 3,1%', null],
  ['Abrir Ortopedia programada no HL Leiria', 'Novas unidades', 'ceo', 'Comissão Executiva', 'HL Leiria', '31/12', 'Em curso', 'Break-even 2 meses mais cedo', null],
  ['Renovar formação de Prevenção de IACS (41 enfermeiros)', 'Insight · Pessoas', 'nurse', 'Formação', 'Grupo', '23/11', 'Atrasada', 'Escalas de isolamento sem restrições', null],
  ['Harmonizar preço da prótese de anca entre hospitais', 'Insight · Ativos e compras', 'cfo', 'Compras', 'Grupo', '31/12', 'Em curso', '≈ 0,04 M€/ano', '—'],
].map(([title, source, ownerId, owner, scope, due, status, expected, realised], i) => ({ id: `s${i}`, title, source, ownerId, owner, scope, due, status, expected, realised }));

export function ActionPlan() {
  const { actions, update } = useActions();
  const [f, setF] = useState('Todas');
  const counts = Object.keys(STATUS).map((s) => [s, actions.filter((a) => a.status === s).length]);
  const shown = actions.filter((a) => f === 'Todas' || a.status === f);
  return (
    <>
      <div className="grid g4">
        {counts.map(([s, n]) => <div key={s} className="card kpi"><div className="lbl">{s}</div><div className="v">{n}</div><div className="d neu">ações</div></div>)}
      </div>
      <Card style={{ marginTop: 16 }} title="Plano de ações" pill="Cada recomendação da IA vira uma tarefa" pillClass="p-ai" sub="As ações aprovadas em qualquer ecrã do portal aparecem aqui, com responsável, prazo e valor realizado">
        <div className="switch" style={{ marginBottom: 12 }}>{['Todas', ...Object.keys(STATUS)].map((s) => <button key={s} className={s === f ? 'on' : ''} onClick={() => setF(s)}>{s}</button>)}</div>
        <table className="tabular">
          <thead><tr><th>Ação</th><th>Origem</th><th>Responsável</th><th>Âmbito</th><th>Prazo</th><th>Valor esperado</th><th>Realizado</th><th>Estado</th></tr></thead>
          <tbody>{shown.map((a) => (
            <tr key={a.id} className={a.isNew ? 'new-row' : ''}><td><b>{a.title}</b>{a.isNew && <span className="new-tag">AGORA</span>}</td><td>{a.source}</td><td>{a.owner}</td><td>{a.scope}</td><td>{a.due}</td><td>{a.expected}</td><td>{a.realised || '—'}</td>
              <td><select className="st-sel" value={a.status} onChange={(e) => update(a.id, { status: e.target.value })}>{Object.keys(STATUS).map((s) => <option key={s}>{s}</option>)}</select></td></tr>))}</tbody>
        </table>
      </Card>
    </>
  );
}

// ---------- Alertas e subscrições ----------
const RULES = [
  ['Ocupação de internamento', '>', '92%', 'Qualquer hospital', 'Teams · Direção Clínica', 'há 2 h', true],
  ['Espera média na urgência', '>', '60 min', 'HL Lisboa, HL Arrábida', 'App móvel · chefe de equipa', 'ontem 21:40', true],
  ['Taxa de rejeição', '>', '4%', 'Por seguradora', 'Email · Direção Financeira', 'hoje 06:48', true],
  ['Stock de artigo crítico', '<', '7 dias', 'Grupo', 'ERP + email · Farmácia', 'hoje 06:15', true],
  ['Risco de saída de colaborador', '>', '0,5', 'Enfermeiros especialistas', 'Email · RH e chefia direta', 'há 3 dias', true],
  ['Drift de modelo (PSI)', '>', '0,2', 'Modelos em produção', 'Teams · Data Science', 'há 6 dias', true],
  ['Frescura de dados', '>', '30 min', 'Pipelines críticos', 'Teams · Plataforma de dados', 'hoje 05:12', true],
  ['NPS da urgência', '<', '55', 'Por hospital', 'Email · Experiência do Cliente', 'há 12 dias', false],
];
const SUBS = [['Resumo matinal personalizado', 'Diário · 07:00', 'App e email', true], ['Relatório semanal da Direção Clínica', 'Segunda-feira · 08:00', 'PDF por email', true], ['Pacote mensal para o conselho', 'Dia 5 · 09:00', 'PDF e Excel', true], ['Indicadores para acionistas', 'Trimestral', 'PDF', false]];

export function Alerts() {
  const toast = useToast();
  const [rules, setRules] = useState(RULES);
  const [subs, setSubs] = useState(SUBS);
  const [draft, setDraft] = useState({ kpi: DICTIONARY[0].label, op: '>', val: '', ch: 'Teams' });
  const addRule = (e) => {
    e.preventDefault();
    if (!draft.val.trim()) { toast('Indique um valor de referência para a regra.'); return; }
    setRules([[draft.kpi, draft.op, draft.val, 'Grupo', `${draft.ch} · Dra. Marta Correia`, 'nunca', true], ...rules]);
    toast(`Alerta criado: ${draft.kpi} ${draft.op} ${draft.val}`); setDraft({ ...draft, val: '' });
  };
  return (
    <>
      <div className="grid g4">
        <Kpi label="Regras ativas" value={rules.filter((r) => r[6]).length} delta={`de ${rules.length} configuradas`} />
        <Kpi label="Alertas enviados (7 dias)" value="186" delta="74% abertos em menos de 15 min" tone="up" />
        <Kpi label="Alertas com ação tomada" value="61%" delta="▲ 9 p.p. com sugestões da IA" tone="up" />
        <Kpi label="Subscrições ativas" value="1 240" delta="relatórios e resumos" />
      </div>
      <Card style={{ marginTop: 16 }} title="Regras de alerta" sub="Disparam quando um indicador do dicionário cruza o valor definido">
        <form className="rule-form" onSubmit={addRule}>
          <select value={draft.kpi} onChange={(e) => setDraft({ ...draft, kpi: e.target.value })} aria-label="Indicador">{DICTIONARY.map((d) => <option key={d.label}>{d.label}</option>)}</select>
          <select value={draft.op} onChange={(e) => setDraft({ ...draft, op: e.target.value })} aria-label="Condição"><option>{'>'}</option><option>{'<'}</option></select>
          <input value={draft.val} onChange={(e) => setDraft({ ...draft, val: e.target.value })} placeholder="Valor, ex.: 90%" aria-label="Valor" />
          <select value={draft.ch} onChange={(e) => setDraft({ ...draft, ch: e.target.value })} aria-label="Canal"><option>Teams</option><option>Email</option><option>App móvel</option></select>
          <button className="btn pri" type="submit">Criar alerta</button>
        </form>
        <table className="tabular" style={{ marginTop: 12 }}>
          <thead><tr><th>Indicador</th><th>Condição</th><th>Âmbito</th><th>Canal e destinatários</th><th>Último disparo</th><th>Ativa</th></tr></thead>
          <tbody>{rules.map((r, i) => (
            <tr key={r[0] + i}><td><b>{r[0]}</b></td><td>{r[1]} {r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td>{r[5]}</td>
              <td><button className={`tgl${r[6] ? ' on' : ''}`} aria-pressed={r[6]} onClick={() => setRules(rules.map((x, j) => (j === i ? [...x.slice(0, 6), !x[6]] : x)))}><span /></button></td></tr>))}</tbody>
        </table>
      </Card>
      <Card style={{ marginTop: 16 }} title="Subscrições de relatórios" sub="Envios agendados, gerados a partir dos mesmos dados do portal">
        {subs.map((s, i) => (
          <div key={s[0]} className="metric"><span><b>{s[0]}</b><br /><small style={{ color: 'var(--muted)' }}>{s[1]} · {s[2]}</small></span>
            <button className={`tgl${s[3] ? ' on' : ''}`} aria-pressed={s[3]} onClick={() => setSubs(subs.map((x, j) => (j === i ? [x[0], x[1], x[2], !x[3]] : x)))}><span /></button></div>
        ))}
      </Card>
    </>
  );
}

// ---------- Relatório do conselho ----------
const BOARD = [
  ['Receita acumulada (jan-out)', '756,2 M€', '748,0 M€', '+1,1%'], ['EBITDA acumulado', '133,9 M€', '136,5 M€', '−1,9%'], ['Margem EBITDA', '17,7%', '18,2%', '−0,5 p.p.'],
  ['Previsão de receita 2026', '875 M€', '868 M€', '+0,8%'], ['Prazo médio de recebimento', '47 dias', '45 dias', '+2 dias'], ['Dívida líquida / EBITDA', '2,4×', '≤ 2,75×', 'Cumpre'],
  ['Ocupação de internamento', '85,6%', '88%', '−2,4 p.p.'], ['Readmissões a 30 dias', '6,8%', '7,0%', 'Cumpre'], ['NPS', '71', '70', '+1'],
];

export function BoardPack() {
  const toast = useToast();
  const exportCsv = () => {
    const rows = [['Indicador', 'Real', 'Plano', 'Desvio'], ...BOARD];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = 'luz-saude-relatorio-conselho-out-2026.csv'; a.click(); URL.revokeObjectURL(url);
    toast('Excel (CSV) exportado');
  };
  return (
    <>
      <div className="row no-print" style={{ gap: 10, marginBottom: 16 }}>
        <button className="btn pri" onClick={() => window.print()}>Exportar PDF</button>
        <button className="btn" onClick={exportCsv}>Exportar Excel</button>
        <ActionButton label="Agendar envio mensal" done="Envio agendado para o dia 5" toast="Envio mensal agendado para o conselho" />
        <span className="sub sp" style={{ margin: 0 }}>Gerado a partir dos dados do portal · fecho de outubro de 2026</span>
      </div>
      <div className="paper print-area">
        <div className="paper-head"><img src={import.meta.env.BASE_URL + 'assets/logo-luzsaude-dark.svg'} alt="Luz Saúde" /><div><b>Relatório ao Conselho de Administração</b><span>Fecho de outubro de 2026 · Confidencial</span></div></div>
        <h3>1. Sumário executivo</h3>
        <p>A receita acumulada atingiu <b>756,2 M€</b> (+8,4% homólogo e +1,1% face ao orçamento), impulsionada por volume (+30,9 M€), preço (+17,9 M€) e mix (+9,8 M€). A margem EBITDA está 0,5 p.p. abaixo do plano, explicada pelo ramp-up das novas unidades de Aveiro, Leiria, Santarém e Figueira da Foz. A previsão de fecho é de <b>875 M€</b>, 7 M€ acima do orçamento.</p>
        <h3>2. Indicadores face ao plano</h3>
        <table className="tabular"><thead><tr><th>Indicador</th><th>Real</th><th>Plano</th><th>Desvio</th></tr></thead>
          <tbody>{BOARD.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{i ? c : <b>{c}</b>}</td>)}</tr>)}</tbody></table>
        <h3>3. Qualidade e pessoas</h3>
        <p>Readmissões a 30 dias em 6,8% (referência nacional 8,1%) e infeção hospitalar em 3,1%. O NPS subiu 3 pontos no trimestre. O absentismo desceu para 4,7%; as horas extra subiram 9% com a época gripal, 63% delas previsíveis com 7 dias de antecedência.</p>
        <h3>4. Riscos</h3>
        <ul><li>Pico de procura respiratória a partir de sexta-feira; plano de contingência pronto a aprovar.</li><li>Rejeições da AdvanceCare acima do esperado (4,9%).</li><li>Ramp-up do HL Leiria 3 p.p. abaixo do plano de abertura.</li></ul>
        <h3>5. Decisões pedidas ao conselho</h3>
        <ul><li>Aprovar 12 camas adicionais de cuidados continuados no Hospital do Mar.</li><li>Aprovar um bloco operatório quinzenal adicional na Unidade de Joelho do HL Lisboa.</li></ul>
        <p className="paper-foot">Todos os valores são fictícios e servem apenas para demonstração.</p>
      </div>
    </>
  );
}
