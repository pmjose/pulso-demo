import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionButton, Card, Chart, Insight, Kpi } from '../ui.jsx';
import { C, nf } from '../data.js';
import { GEN_EMPLOYEES } from '../peopleGen.js';
import {
  BLOCKS, CHECK, DAY, EQUIPMENT, FIRST_CASE, KITS, NOW, PREOP, RECOVERY, ROOMS, SURGEONS, TEAM, TOMORROW, TREND, TURNOVER, UTIL_SPEC, hhmm,
} from '../surgeryData.js';

const PCT = (m) => `${(m / DAY) * 100}%`;
const surgeonId = (name) => (name === 'Dr. Ricardo Alves' ? 'ricardo' : GEN_EMPLOYEES.find((e) => e.name === name)?.id);

// ---------- live board ----------
function Board() {
  const navigate = useNavigate();
  const [hover, setHover] = useState(null);
  const hours = Array.from({ length: 13 }, (_, i) => i * 60);
  return (
    <div className="gantt">
      <div className="g-head"><span />{hours.map((m) => <span key={m} style={{ left: PCT(m) }}>{hhmm(m)}</span>)}</div>
      {ROOMS.map((r) => (
        <div key={r.name} className="g-row">
          <div className="g-room"><b>{r.name}</b><small>{r.spec}</small></div>
          <div className="g-track">
            {hours.map((m) => <i key={m} className="g-grid" style={{ left: PCT(m) }} />)}
            {r.cases.map((c, k) => (c.cancelled ? (
              <div key={k} className="g-case cancelled" style={{ left: PCT(c.ps), width: PCT(c.pd) }} title={`Cancelada: ${c.cancelled}`}><span>Cancelada</span></div>
            ) : (
              <span key={k} style={{ display: 'contents' }}>
                <div className="g-plan" style={{ left: PCT(c.ps), width: PCT(c.pd) }} />
                <div className={`g-case ${c.status}${c.ad > c.pd * 1.1 ? ' over' : ''}`} style={{ left: PCT(c.as), width: PCT(Math.min(c.ad, DAY - c.as + 40)) }}
                  onMouseEnter={() => setHover({ r, c })} onMouseLeave={() => setHover(null)}
                  onClick={() => { const id = surgeonId(c.surgeon); if (id) navigate('/portal/colaborador', { state: { pick: id } }); }}>
                  <span>{c.proc}</span>
                </div>
                {k < r.cases.length - 1 && <div className="g-clean" style={{ left: PCT(c.ae), width: PCT(r.turnover) }} />}
              </span>
            )))}
            {r.overtime > 0 && <div className="g-ot" style={{ left: PCT(DAY) }}>+{r.overtime} min</div>}
            <div className="g-now" style={{ left: PCT(NOW) }} />
          </div>
        </div>
      ))}
      <div className="legend" style={{ marginTop: 10 }}>
        <span><i style={{ background: '#1f9d6b' }} />Concluída</span><span><i style={{ background: '#00acc1' }} />Em curso</span><span><i style={{ background: '#a8d8e0' }} />Programada</span>
        <span><i style={{ background: '#e4572e' }} />Acima da duração prevista</span><span><i style={{ background: 'repeating-linear-gradient(45deg,#cfd8dc 0 3px,#eef2f3 3px 6px)' }} />Limpeza e preparação</span><span><i style={{ border: '1px dashed #64767d', background: 'transparent' }} />Plano original</span>
      </div>
      {hover && (
        <div className="g-tip">
          <b>{hover.c.proc}</b> · {hover.r.name}<br />
          {hover.c.surgeon} · ASA {hover.c.asa}<br />
          Previsto {hhmm(hover.c.ps)} ({hover.c.pd} min) · real {hhmm(hover.c.as)} ({hover.c.ad} min){hover.c.delay > 0 ? ` · início com ${hover.c.delay} min de atraso` : ''}
        </div>
      )}
    </div>
  );
}

function Today() {
  const live = ROOMS.flatMap((r) => r.cases.filter((c) => !c.cancelled));
  const done = live.filter((c) => c.status === 'done').length;
  const running = live.filter((c) => c.status === 'running').length;
  const elective = ROOMS.filter((r) => !r.spec.startsWith('Urgência'));
  const util = elective.reduce((a, r) => a + r.util, 0) / elective.length;
  const started = live.filter((c) => c.status !== 'next');
  const late = started.filter((c) => c.delay > 15).length;
  const ot = ROOMS.filter((r) => r.overtime);
  return (
    <>
      <div className="grid g6">
        <Kpi label="Cirurgias hoje" value={live.length} delta={`${done} concluídas · ${running} em curso`} />
        <Kpi label="Utilização prevista (salas programadas)" value={`${nf(util, 1)}%`} delta="média dos últimos 30 dias 78,2%" tone={util >= 78 ? 'up' : 'down'} />
        <Kpi label="Iniciadas com atraso > 15 min" value={late} delta={`de ${started.length} já iniciadas`} tone={late > 4 ? 'down' : 'neu'} />
        <Kpi label="Canceladas hoje" value={ROOMS.reduce((a, r) => a + r.cases.filter((c) => c.cancelled).length, 0)} delta="doente não apto (pré-operatório)" tone="down" />
        <Kpi label="Salas em horas extra (previsão)" value={ot.length} delta={ot.map((r) => `${r.name} +${r.overtime} min`).join(' · ') || 'nenhuma'} tone={ot.length ? 'down' : 'up'} />
        <Kpi label="Recobro ocupado (pico)" value={`${Math.max(...RECOVERY.pacu)} / ${RECOVERY.pacuBeds}`} delta="previsto às 16h" tone="down" />
      </div>
      <Card style={{ marginTop: 16 }} title="Bloco operatório · HL Lisboa · agora" pill={`Atualizado às ${hhmm(NOW)}`} pillClass="p-teal" sub="Cada barra é uma cirurgia (passe o rato para ver o detalhe; clique para abrir o cirurgião). A linha vertical marca a hora atual.">
        <Board />
      </Card>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title="Alertas do bloco" pill="Luz IA" pillClass="p-ai" sub="Gerados a partir do plano, do registo de bloco e do inventário">
          <Insight icon="⏱" actions={<ActionButton primary label="Antecipar a esterilização" done="Pedido enviado à esterilização" toast="Prioridade dada à caixa de joelho robótico n.º 2" />}>
            <p>A <b>caixa de joelho robótico n.º 2</b> só fica pronta às {KITS[0][3]}, 30 min depois da hora prevista para a 4.ª cirurgia da Sala 4.</p>
          </Insight>
          <Insight icon="!" actions={<ActionButton primary label="Pedir reforço" done="Reforço pedido à escala" toast="Pedido de anestesiologista de reforço enviado" />}>
            <p>Falta <b>1 anestesiologista</b> a partir das 14:00. Com {ot.length ? `${ot[0].name} a terminar às ${hhmm(ot[0].end)}` : 'o plano atual'}, o turno da tarde fica descoberto.</p>
          </Insight>
          <Insight icon="⌂" actions={<ActionButton primary label="Reservar camas" done="Camas reservadas" toast="4 camas de internamento reservadas para o pós-operatório" />}>
            <p>As cirurgias de hoje precisam de <b>{RECOVERY.wardNeed} camas</b> de internamento; há {RECOVERY.wardFree} livres. Faltam {RECOVERY.wardNeed - RECOVERY.wardFree} até às 18h.</p>
          </Insight>
        </Card>
        <Card title="Ocupação do recobro" sub={`Doentes no recobro ao longo do dia · ${RECOVERY.pacuBeds} camas`}>
          <Chart type="columns" ai={{ action: 'Antecipar 2 altas do recobro para o internamento antes das 15:30 e escalonar as saídas das Salas 1 e 4.', impact: 'Evita que o recobro chegue a 100% às 16h, o que atrasaria em ≈ 25 min as cirurgias seguintes.' }}
            opts={{ labels: RECOVERY.labels, height: 200, series: [{ name: 'Doentes no recobro', color: C.violet, data: RECOVERY.pacu }] }} />
          <div className="metric"><span>Camas de UCI pós-operatórias</span><b style={{ color: C.coral }}>{RECOVERY.icuFree} livres · {RECOVERY.icuNeed} necessárias</b></div>
        </Card>
        <Card title="Utilização por sala · hoje" sub="% do dia programado (08:00-20:00)">
          <Chart type="bars" ai={{ action: 'Ocupar o tempo livre da Sala 7 (cirurgia cancelada) com 2 casos da lista de espera de Ginecologia já preparados.', impact: 'Recupera ≈ 2 h de bloco hoje e sobe a utilização da sala de 46% para ≈ 70%.' }}
            opts={{ unit: '%', max: 100, items: ROOMS.map((r) => ({ label: r.name, value: Math.round(r.util), target: 85, color: r.util < 60 ? C.coral : r.util < 80 ? C.sun : C.teal })) }} />
        </Card>
      </div>
    </>
  );
}

// ---------- tomorrow & plan ----------
function Plan() {
  const navigate = useNavigate();
  const gap = TOMORROW.reduce((a, t) => a + (t.p50 - t.est), 0);
  const s4 = TOMORROW.filter((t) => t.room === 'Sala 4');
  const s4end = s4.reduce((a, t) => a + t.p50, 0) + 34 * (s4.length - 1);
  return (
    <>
      <div className="grid g4">
        <Kpi label="Cirurgias amanhã (amostra)" value={TOMORROW.length} delta="5 salas · quinta-feira" />
        <Kpi label="Diferença estimativa vs. modelo" value={`+${gap} min`} delta="o modelo prevê mais tempo do que os cirurgiões" tone="down" />
        <Kpi label="Erro médio do modelo" value="11 min" delta="vs. 27 min nas estimativas manuais" tone="up" />
        <Kpi label="Doentes com risco de cancelamento > 20%" value={TOMORROW.filter((t) => t.cancelRisk > .2).length} delta="ver preparação pré-operatória" tone="down" />
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Duração prevista · amanhã" pill="ML · duração cirúrgica (Random Forest)" pillClass="p-ml" sub="Estimativa do cirurgião vs. previsão do modelo (P50) e cenário pessimista (P90), em minutos">
          <Chart type="columns" ai={{ action: 'Planear a Sala 4 com a previsão P50 do modelo e mover a revisão de prótese da anca para o início do dia.', impact: `Com as estimativas manuais, a Sala 4 terminaria ≈ ${Math.round((s4end - 360) / 1)} min depois do previsto; com o modelo, o plano fecha dentro do horário.` }}
            opts={{ labels: TOMORROW.map((t) => `${t.room.replace('Sala ', 'S')} · ${t.proc.split(' ').slice(0, 2).join(' ')}`), height: 240, series: [
              { name: 'Estimativa do cirurgião', color: C.grey, data: TOMORROW.map((t) => t.est) }, { name: 'Previsão do modelo (P50)', color: C.teal, data: TOMORROW.map((t) => t.p50) }, { name: 'Cenário P90', color: C.violet, data: TOMORROW.map((t) => t.p90) },
            ] }} />
        </Card>
        <Card title="Otimizador do plano operatório" pill="Agente" pillClass="p-ai" sub="Reordena casos, salas e equipamento com as previsões do modelo">
          {[['Conflito do robô cirúrgico', 'Sala 3 e Sala 4 pedem o robô às 08:00'], ['Sala 4 em horas extra', 'Plano manual termina às 20:47'], ['Cirurgias com risco de cancelamento', '2 doentes com pré-operatório incompleto'], ['Camas de UCI', '1 doente de amanhã precisará de UCI']].map(([k, v]) => <div key={k} className="metric"><span>{k}</span><b style={{ color: C.coral }}>{v}</b></div>)}
          <div className="act" style={{ marginTop: 14 }}><ActionButton primary label="Executar o agente" onClick={() => navigate('/portal/agentes', { state: { pick: 'orplan' } })} /></div>
        </Card>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Blocos atribuídos vs. necessários" sub="Blocos de 4 h por semana · necessidade calculada a partir da lista de espera">
          <Chart type="columns" ai={{ action: 'Transferir 2 blocos semanais de Ginecologia (63% de utilização) para Ortopedia, que precisa de mais 4.', impact: 'Reduz a mediana de espera em Ortopedia de 38 para ≈ 31 dias sem abrir novas salas.' }}
            opts={{ labels: BLOCKS.map((b) => b[0].split(' ')[0]), series: [{ name: 'Atribuídos', color: C.petrol, data: BLOCKS.map((b) => b[1]) }, { name: 'Necessários', color: C.sun, data: BLOCKS.map((b) => b[2]) }] }} />
        </Card>
        <Card title="Blocos libertados sem aviso (últimos 90 dias)" sub="Blocos não usados e devolvidos com menos de 48 h">
          <Chart type="bars" ai={{ action: 'Exigir libertação de blocos com 72 h de antecedência e redistribuir automaticamente pela lista de espera.', impact: 'Os 12 blocos de Ginecologia libertados em cima da hora equivalem a ≈ 48 cirurgias perdidas por trimestre.' }}
            opts={{ items: BLOCKS.map((b) => ({ label: b[0], value: b[3], color: b[3] > 8 ? C.coral : C.sky })) }} />
        </Card>
      </div>
    </>
  );
}

// ---------- resources ----------
function Resources() {
  return (
    <>
      <div className="grid g3 res-grid">
        <Card title="Equipas · hoje" sub="Necessários vs. disponíveis no pico da tarde (14:00-20:00)">
          <table className="tabular"><thead><tr><th>Função</th><th>Necessários</th><th>Disponíveis</th><th /></tr></thead>
            <tbody>{TEAM.map(([f, n, a, note]) => <tr key={f}><td><b>{f}</b>{note && <><br /><small style={{ color: 'var(--muted)' }}>{note}</small></>}</td><td>{n}</td><td>{a}</td><td><span className={`pill ${a >= n ? 'p-ok' : 'p-bad'}`}>{a >= n ? 'OK' : `−${n - a}`}</span></td></tr>)}</tbody></table>
        </Card>
        <Card title="Equipamento crítico" sub="Disponibilidade e conflitos">
          <table className="tabular"><thead><tr><th>Equipamento</th><th>Total</th><th>Em uso</th><th>Estado</th></tr></thead>
            <tbody>{EQUIPMENT.map(([e, t, u, note, c, st]) => <tr key={e}><td><b>{e}</b><br /><small style={{ color: 'var(--muted)' }}>{note}</small></td><td>{t}</td><td>{u}</td><td><span className={`pill ${c}`}>{st}</span></td></tr>)}</tbody></table>
        </Card>
        <Card title="Material e esterilização" sub="Caixas e implantes para as próximas cirurgias">
          <table className="tabular"><thead><tr><th>Caixa ou implante</th><th>Necessário às</th><th>Pronto às</th><th>Estado</th></tr></thead>
            <tbody>{KITS.map(([k, w, need, ready, c, st]) => <tr key={k}><td><b>{k}</b><br /><small style={{ color: 'var(--muted)' }}>{w}</small></td><td>{need}</td><td>{ready}</td><td><span className={`pill ${c}`}>{st}</span></td></tr>)}</tbody></table>
        </Card>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Capacidade pós-operatória" sub="Camas necessárias para as cirurgias de hoje vs. disponíveis">
          <Chart type="columns" ai={{ action: 'Ativar o gestor de camas para libertar 4 camas de internamento cirúrgico até às 18h, com base na previsão de altas.', impact: 'Evita cancelar ou adiar as 2 últimas cirurgias do dia por falta de cama, o motivo de 22% dos cancelamentos.' }}
            opts={{ labels: ['Recobro (pico)', 'UCI', 'Internamento cirúrgico'], series: [{ name: 'Necessárias', color: C.coral, data: [Math.max(...RECOVERY.pacu), RECOVERY.icuNeed, RECOVERY.wardNeed] }, { name: 'Disponíveis', color: C.teal, data: [RECOVERY.pacuBeds, RECOVERY.icuFree, RECOVERY.wardFree] }] }} />
        </Card>
        <Card title="Cirurgiões · últimos 30 dias" sub="Clique para abrir o perfil no Colaborador 360°">
          <SurgeonTable />
        </Card>
      </div>
    </>
  );
}

function SurgeonTable() {
  const navigate = useNavigate();
  return (
    <table className="tabular"><thead><tr><th>Cirurgião</th><th>Especialidade</th><th>Cirurgias</th><th>Atraso vs. previsto</th><th>NPS</th><th>Complicações</th></tr></thead>
      <tbody>{SURGEONS.map(([n, s, c, d, nps, comp]) => (
        <tr key={n} style={{ cursor: 'pointer' }} onClick={() => navigate('/portal/colaborador', { state: { pick: surgeonId(n) } })}>
          <td><b>{n}</b></td><td>{s}</td><td>{c}</td><td><span className={`pill ${d > 12 ? 'p-bad' : d > 6 ? 'p-warn' : 'p-ok'}`}>+{d} min</span></td><td>{nps}</td><td>{nf(comp, 1)}%</td>
        </tr>))}</tbody></table>
  );
}

// ---------- performance ----------
function Performance() {
  return (
    <>
      <div className="grid g6">
        <Kpi label="Utilização do bloco" value="78,2%" delta="objetivo 85% · ▲ 3,1 p.p. em 12 semanas" tone="up" />
        <Kpi label="Cirurgias canceladas" value="3,6%" delta="no próprio dia · alvo < 4%" tone="up" />
        <Kpi label="Primeira cirurgia a horas" value="71%" delta="alvo 85%" tone="down" />
        <Kpi label="Tempo médio de limpeza e preparação" value="24 min" delta="Sala 4: 34 min" tone="down" />
        <Kpi label="Cirurgias por ano (grupo)" value="41 200" delta="HL Lisboa ≈ 15 600" />
        <Kpi label="Infeção do local cirúrgico" value="0,9%" delta="dos episódios cirúrgicos" tone="up" />
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Utilização e cancelamentos · últimas 12 semanas" sub="HL Lisboa">
          <Chart type="line" ai={{ action: 'Manter a reserva de camas a 48 h e a verificação pré-operatória automática, que acompanham a descida dos cancelamentos.', impact: 'Cada ponto percentual a menos de cancelamentos recupera ≈ 13 cirurgias por mês no HL Lisboa.' }}
            opts={{ labels: TREND.labels, unit: '%', min: 0, max: 90, series: [{ name: 'Utilização', color: C.teal, data: TREND.util, area: true }, { name: 'Cancelamentos no próprio dia', color: C.coral, data: TREND.cancel }, { name: 'Objetivo de utilização (85%)', color: C.grey, width: 1, data: Array(12).fill(85) }] }} />
        </Card>
        <Card title="Início da primeira cirurgia" sub="% dos dias, últimos 30 dias">
          <Chart type="donut" ai={{ action: 'Fazer a chamada do doente da primeira cirurgia às 07:15 e a verificação de segurança antes das 07:45.', impact: 'Subir a primeira cirurgia a horas de 71% para 85% recupera ≈ 40 min de bloco por sala e por semana.' }}
            opts={{ center: '71%', centerLabel: 'a horas', items: FIRST_CASE.labels.map((l, i) => ({ label: l, value: FIRST_CASE.data[i], color: [C.ok, C.teal, C.sun, C.coral, '#a33'][i] })) }} />
        </Card>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Tempo de limpeza e preparação por sala" sub="Minutos entre cirurgias · média dos últimos 30 dias · referência 22 min">
          <Chart type="bars" ai={{ action: 'Criar uma equipa dedicada de limpeza para a Sala 4 às quintas-feiras e preparar a caixa seguinte em paralelo.', impact: 'Baixar a Sala 4 de 34 para 22 min liberta ≈ 36 min por dia, o suficiente para mais 1 artroscopia.' }}
            opts={{ unit: ' min', items: TURNOVER.map(([s, m]) => ({ label: s, value: m, target: 22, color: m > 28 ? C.coral : C.teal })) }} />
        </Card>
        <Card title="Utilização por especialidade" sub="% dos blocos atribuídos, últimos 30 dias">
          <Chart type="bars" ai={{ action: 'Rever os blocos de Ginecologia e Cirurgia Plástica, abaixo de 75%, na próxima reunião de planeamento do bloco.', impact: 'Levar as duas especialidades a 80% equivale a ≈ 60 cirurgias adicionais por trimestre.' }}
            opts={{ unit: '%', max: 100, items: UTIL_SPEC.map(([s, v]) => ({ label: s, value: v, target: 85, color: v < 75 ? C.sun : C.teal })) }} />
        </Card>
      </div>
    </>
  );
}

// ---------- patients & risk ----------
function Patients() {
  const navigate = useNavigate();
  const incomplete = PREOP.filter((p) => p.check.some((c) => !c));
  return (
    <>
      <div className="grid g4">
        <Kpi label="Doentes operados amanhã (amostra)" value={PREOP.length} delta="HL Lisboa" />
        <Kpi label="Pré-operatório incompleto" value={incomplete.length} delta="31% dos cancelamentos vêm daqui" tone="down" />
        <Kpi label="Necessidade de UCI prevista" value={PREOP.filter((p) => p.icu > .3).length} delta="probabilidade > 30%" />
        <Kpi label="Demora média prevista" value={`${nf(PREOP.reduce((a, p) => a + p.los, 0) / PREOP.length, 1)} dias`} delta="modelo de demora esperada" />
      </div>
      <Card style={{ marginTop: 16 }} title="Preparação pré-operatória · amanhã" pill="Agente de preparação" pillClass="p-ai" sub="Checklist automático e riscos previstos por doente · clique no nome para abrir o Doente 360°">
        <table className="tabular">
          <thead><tr><th>Doente</th><th>Cirurgia</th><th>Sala e hora</th>{CHECK.map((c) => <th key={c} style={{ textAlign: 'center' }}>{c}</th>)}<th>Risco de cancelamento</th><th>UCI</th><th>Complicações</th></tr></thead>
          <tbody>{PREOP.map((p, k) => (
            <tr key={p.name}>
              <td><button className="linkish" onClick={() => navigate('/portal/doente', { state: { pick: `cx${k}` } })}><b>{p.name}</b></button><br /><small style={{ color: 'var(--muted)' }}>{p.age} anos · {p.payer}</small></td>
              <td>{p.proc}</td><td>{p.when}</td>
              {p.check.map((c, i) => <td key={i} style={{ textAlign: 'center' }}>{c ? <span className="ck ok">✓</span> : <span className="ck no">✕</span>}</td>)}
              <td><span className={`pill ${p.cancel > .2 ? 'p-bad' : p.cancel > .1 ? 'p-warn' : 'p-ok'}`}>{Math.round(p.cancel * 100)}%</span></td>
              <td>{Math.round(p.icu * 100)}%</td><td>{Math.round(p.compl * 100)}%</td>
            </tr>))}</tbody>
        </table>
        <div className="act" style={{ marginTop: 12 }}><ActionButton primary label="Executar agente de preparação" onClick={() => navigate('/portal/agentes', { state: { pick: 'preop' } })} /></div>
      </Card>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Risco de cancelamento por doente" pill="ML · cancelamento (AUC 0,84)" pillClass="p-ml" sub="Probabilidade de a cirurgia não se realizar amanhã">
          <Chart type="bars" ai={{ action: 'Ligar hoje às 3 doentes com risco acima de 15% e completar os itens em falta antes das 18h.', impact: 'Completar o pré-operatório reduz o risco de cancelamento destes doentes para menos de 5%.' }}
            opts={{ unit: '%', items: [...PREOP].sort((a, b) => b.cancel - a.cancel).map((p) => ({ label: p.name, value: Math.round(p.cancel * 100), target: 15, color: p.cancel > .15 ? C.coral : C.teal })) }} />
        </Card>
        <Card title="Necessidade prevista de UCI" pill="ML · cuidados intensivos pós-operatórios" pillClass="p-ml" sub="Probabilidade por doente">
          <Chart type="bars" ai={{ action: 'Reservar 1 cama de UCI para a gastrectomia parcial da Sala 1 e confirmar a disponibilidade às 07:00.', impact: 'Evita adiar a cirurgia por falta de cama de UCI, que hoje tem 2 camas livres para 3 necessidades.' }}
            opts={{ unit: '%', items: [...PREOP].sort((a, b) => b.icu - a.icu).map((p) => ({ label: p.name, value: Math.round(p.icu * 100), target: 30, color: p.icu > .3 ? C.violet : C.sky })) }} />
        </Card>
      </div>
    </>
  );
}

const TABS = [['Hoje', Today], ['Amanhã e plano', Plan], ['Doentes e risco', Patients], ['Recursos', Resources], ['Desempenho', Performance]];

export function Surgery() {
  const [t, setT] = useState('Hoje');
  const View = TABS.find((x) => x[0] === t)[1];
  return (
    <>
      <div className="switch" role="tablist" aria-label="Bloco operatório">
        {TABS.map(([n]) => <button key={n} role="tab" aria-selected={n === t} className={n === t ? 'on' : ''} onClick={() => setT(n)}>{n}</button>)}
        <span className="sub" style={{ margin: '0 0 0 auto' }}>HL Lisboa · 10 salas · quarta-feira, 11 de novembro</span>
      </div>
      <View />
    </>
  );
}
