import { useMemo } from 'react';
import { ActionButton, Card, Chart, Kpi, ScopeNote, useScope, useUnit } from '../ui.jsx';
import { C, GROUP, HOSPITALS, SPECIALTIES, STATS, days, nf, range, seeded } from '../data.js';

// Manchester triage levels with target times (minutes).
const TRIAGE = [
  { level: 'Vermelho', label: 'Emergente', color: '#d64545', target: 0, share: .6 },
  { level: 'Laranja', label: 'Muito urgente', color: '#ef7d22', target: 10, share: 7.4 },
  { level: 'Amarelo', label: 'Urgente', color: '#f5c400', target: 60, share: 31.8 },
  { level: 'Verde', label: 'Pouco urgente', color: '#1f9d6b', target: 120, share: 52.1 },
  { level: 'Azul', label: 'Não urgente', color: '#2a9fd6', target: 240, share: 8.1 },
];

// ---------- Operações hospitalares ----------
export function Operations() {
  const { list, g, isAll, label } = useScope();
  const { setUnit } = useUnit();
  const r = useMemo(() => seeded('ops' + label), [label]);
  const d = useMemo(() => {
    const triage = TRIAGE.map((t) => {
      const wait = t.target === 0 ? 0 : t.target * (.45 + r() * .55) * (g.erWait / 38);
      return { ...t, visits: Math.round(g.erVisits * t.share / 100), wait, within: Math.min(99, 100 - Math.max(0, (wait - t.target * .7) / Math.max(1, t.target)) * 60 - r() * 6) };
    });
    const adm = range(14, (i) => Math.round(g.admissions * (.88 + .2 * Math.sin(i / 2) + r() * .08) * (i % 7 > 4 ? .72 : 1)));
    const dis = adm.map((v) => Math.round(v * (.94 + r() * .1)));
    const alosSpec = SPECIALTIES.slice(0, 7).map((s) => ({ label: s, value: +(g.alos * (.6 + r() * .9)).toFixed(1) }));
    const cancel = [['Doente não apto (pré-operatório)', 31], ['Falta de cama de internamento', 22], ['Atraso da cirurgia anterior', 18], ['Doente faltou', 14], ['Material/equipamento', 9], ['Outros', 6]];
    return { triage, adm, dis, alosSpec, cancel };
  }, [label]);

  return (
    <>
      <ScopeNote />
      <div className="grid g6">
        <Kpi label="Ocupação de camas" value={`${nf(g.occ, 1)}%`} delta={`${nf(g.beds)} camas · alvo 88%`} tone={g.occ > 90 ? 'down' : 'up'} />
        <Kpi label="Demora média" value={`${nf(g.alos, 1)} dias`} delta="▼ 0,2 dias vs. 2025" tone="up" />
        <Kpi label="Admissões hoje" value={nf(g.admissions)} delta={`${nf(g.discharges)} altas`} />
        <Kpi label="Episódios de urgência hoje" value={nf(g.erVisits)} delta={`Espera média ${nf(g.erWait)} min`} tone={g.erWait > 45 ? 'down' : 'up'} />
        <Kpi label="Utilização do bloco" value={`${nf(g.orUtil, 1)}%`} delta="Objetivo 85%" tone={g.orUtil >= 85 ? 'up' : 'down'} />
        <Kpi label="Cirurgias canceladas" value={`${nf(g.orCancel, 1)}%`} delta="no próprio dia · alvo < 4%" tone={g.orCancel < 4 ? 'up' : 'down'} />
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Urgência por nível de triagem de Manchester" pill="Hoje" pillClass="p-teal" sub={`${label} · volume, tempo até primeira observação médica e cumprimento do tempo-alvo`}>
          <table className="tabular">
            <thead><tr><th>Prioridade</th><th>Episódios</th><th>% do total</th><th>Espera média</th><th>Tempo-alvo</th><th>Dentro do alvo</th></tr></thead>
            <tbody>{d.triage.map((t) => (
              <tr key={t.level}>
                <td><span className="triage" style={{ background: t.color }} /><b>{t.level}</b> <span style={{ color: 'var(--muted)' }}>· {t.label}</span></td>
                <td>{nf(t.visits)}</td><td>{nf(t.share, 1)}%</td>
                <td>{t.target === 0 ? 'Imediato' : `${nf(t.wait)} min`}</td>
                <td>{t.target === 0 ? 'Imediato' : `${t.target} min`}</td>
                <td><span className={`pill ${t.within >= 90 ? 'p-ok' : t.within >= 75 ? 'p-warn' : 'p-bad'}`}>{nf(t.target === 0 ? 100 : t.within)}%</span></td>
              </tr>))}</tbody>
          </table>
        </Card>
        <Card title="Distribuição por prioridade" sub="Episódios de urgência hoje">
          <Chart type="donut" opts={{ center: nf(g.erVisits), centerLabel: 'episódios', items: d.triage.map((t) => ({ label: t.level, value: t.visits, color: t.color })) }} />
        </Card>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Admissões e altas" sub={`${label} · últimos 14 dias`}>
          <Chart type="columns" opts={{ labels: days(14, -13), series: [{ name: 'Admissões', color: C.teal, data: d.adm }, { name: 'Altas', color: C.sun, data: d.dis }] }} />
        </Card>
        <Card title="Demora média por especialidade" sub="Dias de internamento, últimos 30 dias">
          <Chart type="bars" opts={{ unit: ' d', items: d.alosSpec.map((x) => ({ ...x, color: x.value > g.alos * 1.2 ? C.coral : C.teal })) }} />
        </Card>
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Ocupação por hospital" sub="Clique numa linha para filtrar o portal por esse hospital">
          <table className="tabular">
            <thead><tr><th>Hospital</th><th>Região</th><th>Camas</th><th>Ocupação</th><th>Demora média</th><th>Bloco</th><th>Cancelamentos</th></tr></thead>
            <tbody>{(isAll ? HOSPITALS : list).map((h) => {
              const s = STATS[h.name];
              return (
                <tr key={h.name} style={{ cursor: 'pointer' }} onClick={() => setUnit(h.name)}>
                  <td><b>{h.short}</b>{h.isNew && <span className="new-tag">NOVA</span>}</td><td>{h.region}</td><td>{h.beds}</td>
                  <td><span className="bar-mini" style={{ width: s.occ * .5, background: s.occ > 90 ? C.coral : C.teal }} />{nf(s.occ, 1)}%</td>
                  <td>{nf(s.alos, 1)} d</td><td>{nf(s.orUtil)}%</td>
                  <td><span className={`pill ${s.orCancel < 4 ? 'p-ok' : 'p-warn'}`}>{nf(s.orCancel, 1)}%</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </Card>
        <Card title="Motivos de cancelamento cirúrgico" sub="Últimos 90 dias · % dos cancelamentos">
          <Chart type="bars" opts={{ unit: '%', items: d.cancel.map(([l, v], i) => ({ label: l, value: v, color: i < 2 ? C.coral : C.sun })) }} />
          <div className="insight" style={{ marginTop: 14 }}><div className="ic">✦</div><div><p>22% dos cancelamentos devem-se a <b>falta de cama</b>. O modelo de previsão de altas permite reservar camas 48 h antes.</p></div></div>
        </Card>
      </div>
    </>
  );
}

// ---------- Ambulatório e acesso ----------
const CHANNELS = [['App MY LUZ', 41, C.teal], ['Telefone (Linha Luz)', 27, C.sky], ['Website', 14, C.violet], ['Balcão', 11, C.sun], ['LUZ 24 · Digital', 7, C.coral]];
const NOSHOW = [
  ['Rui Fernandes', 'Cardiologia', '08:00', '2 faltas nos últimos 6 meses', 82], ['Catarina Lopes', 'Dermatologia', '09:30', 'Marcação feita há 94 dias', 74],
  ['João Pereira', 'Ortopedia', '10:15', 'Distância > 40 km e previsão de chuva', 69], ['Inês Martins', 'Psiquiatria', '11:00', 'Sem confirmação na app', 61],
  ['Tiago Sousa', 'Gastroenterologia', '14:30', 'Primeira consulta, sem seguro', 55], ['Beatriz Gomes', 'Pediatria', '15:00', 'Historial de atrasos às 15h', 48],
];

export function Outpatient() {
  const { g, label } = useScope();
  const d = useMemo(() => {
    const r = seeded('amb' + label);
    const spec = SPECIALTIES.map((s) => ({ s, n: Math.round(g.consults * (.04 + r() * .12)), wait: g.daysToFirst * (.5 + r() * 1.1), ns: g.noShow * (.7 + r() * .6), tele: g.tele * (.3 + r() * 2) }));
    const months = ['jun', 'jul', 'ago', 'set', 'out', 'nov'];
    const pres = months.map((_, i) => Math.round(g.consults * (1 - g.tele / 100) * (.93 + i * .015 + r() * .03)));
    const tele = months.map((_, i) => Math.round(g.consults * g.tele / 100 * (.85 + i * .05 + r() * .04)));
    return { spec, months, pres, tele };
  }, [label]);
  const prime = [312, 318, 327, 333, 341, 352, 360, 368, 377, 389, 398, 411];

  return (
    <>
      <ScopeNote />
      <div className="grid g6">
        <Kpi label="Consultas este mês" value={nf(g.consults)} delta="▲ 6,9% homólogo" tone="up" />
        <Kpi label="Tempo até 1.ª consulta" value={`${nf(g.daysToFirst, 1)} dias`} delta="média · alvo 14 dias" tone={g.daysToFirst <= 14 ? 'up' : 'down'} />
        <Kpi label="Taxa de faltas" value={`${nf(g.noShow, 1)}%`} delta="▼ 1,4 p.p. com lembretes IA" tone="up" />
        <Kpi label="Teleconsultas" value={`${nf(g.tele, 1)}%`} delta={`≈ ${nf(g.consults * g.tele / 100)} este mês`} />
        <Kpi label="Marcações via MY LUZ" value="41%" delta="▲ 5 p.p. homólogo" tone="up" />
        <Kpi label="Utilizadores MY LUZ" value={`${nf(GROUP.myLuzUsers, 1)} M`} delta="411 mil LUZ ON PRIME" tone="up" />
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Consultas por especialidade" sub={`${label} · este mês`}>
          <table className="tabular">
            <thead><tr><th>Especialidade</th><th>Consultas</th><th>Tempo até 1.ª consulta</th><th>Faltas</th><th>Teleconsulta</th></tr></thead>
            <tbody>{d.spec.map((x) => (
              <tr key={x.s}><td><b>{x.s}</b></td><td>{nf(x.n)}</td>
                <td><span className="bar-mini" style={{ width: x.wait * 3, background: x.wait > 21 ? C.coral : x.wait > 14 ? C.sun : C.teal }} />{nf(x.wait)} dias</td>
                <td>{nf(x.ns, 1)}%</td><td>{nf(x.tele, 1)}%</td></tr>))}</tbody>
          </table>
        </Card>
        <Card title="Canal de marcação" sub="Últimos 30 dias">
          <Chart type="donut" opts={{ center: '41%', centerLabel: 'via app MY LUZ', items: CHANNELS.map(([l, v, c]) => ({ label: l, value: v, color: c })) }} />
        </Card>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Presencial vs. teleconsulta" sub="Hospital da Luz Digital e LUZ 24 · últimos 6 meses">
          <Chart type="columns" opts={{ labels: d.months, stacked: true, series: [{ name: 'Presencial', color: C.teal, data: d.pres }, { name: 'Teleconsulta', color: C.violet, data: d.tele }] }} />
        </Card>
        <Card title="Subscritores LUZ ON PRIME" sub="Milhares, últimos 12 meses">
          <Chart type="line" opts={{ labels: ['dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov'], min: 300, max: 420, series: [{ name: 'Subscritores (mil)', color: C.sun, data: prime, area: true }] }} />
        </Card>
      </div>

      <Card style={{ marginTop: 16 }} title="Consultas com risco de falta · amanhã" pill="ML · no-show AUC 0,87" sub="Ordenado por probabilidade. Lembretes automáticos via app MY LUZ e SMS.">
        <table className="tabular">
          <thead><tr><th>Doente</th><th>Especialidade</th><th>Hora</th><th>Probabilidade de falta</th><th>Principal motivo</th><th /></tr></thead>
          <tbody>{NOSHOW.map(([n, s, h, why, p]) => (
            <tr key={n}><td><b>{n}</b></td><td>{s}</td><td>{h}</td>
              <td><span className="bar-mini" style={{ width: p, background: p > 60 ? C.coral : C.sun }} />{p}%</td>
              <td style={{ color: 'var(--muted)' }}>{why}</td>
              <td><ActionButton label="Enviar lembrete" done="Enviado" toast="Lembrete enviado pela app MY LUZ" /></td></tr>))}</tbody>
        </table>
      </Card>
    </>
  );
}
