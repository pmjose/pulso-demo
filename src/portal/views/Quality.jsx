import { useMemo } from 'react';
import { Card, Chart, Kpi, ScopeNote, useScope, useUnit } from '../ui.jsx';
import { C, GROUP, HOSPITALS, STATS, nf, range, seeded } from '../data.js';

const M12 = ['dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov'];
const trend = (r, end, drift, noise) => range(12, (i) => +(end + drift * (11 - i) + (r() - .5) * noise).toFixed(2));

// ---------- Qualidade clínica ----------
export function Quality() {
  const { list, g, isAll, label } = useScope();
  const { setUnit } = useUnit();
  const d = useMemo(() => {
    const r = seeded('q' + label);
    return {
      readm: trend(r, g.readm, .05, .5), iacs: trend(r, g.iacs, .04, .35), moe: trend(r, g.moe, .006, .05),
      nps: [['Urgência', g.nps - 14], ['Internamento', g.nps + 4], ['Consulta externa', g.nps + 2], ['Bloco operatório', g.nps + 8], ['Maternidade', g.nps + 11], ['Teleconsulta', g.nps - 3], ['Faturação', g.nps - 22]].map(([l, v]) => [l, Math.round(Math.min(95, v))]),
    };
  }, [label]);
  const compl = [['Infeção do local cirúrgico', 0.9], ['Tromboembolismo venoso', 0.5], ['Hemorragia pós-operatória', 0.4], ['Reintervenção não planeada', 0.4], ['Lesão por pressão', 0.3], ['Queda com lesão', 0.2]];

  return (
    <>
      <ScopeNote />
      <div className="grid g6">
        <Kpi label="Readmissões a 30 dias" value={`${nf(g.readm, 1)}%`} delta="Referência nacional 8,1%" tone="up" spark={d.readm} color={C.coral} />
        <Kpi label="Infeção hospitalar (IACS)" value={`${nf(g.iacs, 1)}%`} delta="Prevalência · referência 5,0%" tone="up" spark={d.iacs} color={C.violet} />
        <Kpi label="Índice de mortalidade (O/E)" value={nf(g.moe, 2)} delta="< 1 indica melhor que o esperado" tone={g.moe < 1 ? 'up' : 'down'} spark={d.moe} color={C.sky} />
        <Kpi label="Complicações cirúrgicas" value={`${nf(g.compl, 1)}%`} delta="▼ 0,3 p.p. homólogo" tone="up" />
        <Kpi label="NPS" value={nf(g.nps)} delta="▲ 3 pontos no trimestre" tone="up" />
        <Kpi label="Reclamações por 1000 episódios" value="2,7" delta="Livro de Reclamações + app" />
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Evolução dos indicadores de qualidade" sub={`${label} · últimos 12 meses`}>
          <Chart type="line" opts={{ labels: M12, unit: '%', min: 0, max: 10, series: [
            { name: 'Readmissões a 30 dias', color: C.coral, data: d.readm },
            { name: 'IACS', color: C.violet, data: d.iacs },
            { name: 'Referência readmissões', color: C.grey, width: 1, data: Array(12).fill(8.1) },
          ] }} />
        </Card>
        <Card title="Complicações por tipo" sub="% de episódios cirúrgicos, últimos 90 dias">
          <Chart type="bars" opts={{ unit: '%', items: compl.map(([l, v]) => ({ label: l, value: v, color: C.violet })) }} />
        </Card>
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Qualidade por hospital" sub="Comparação com a referência do grupo · clique para filtrar">
          <table className="tabular">
            <thead><tr><th>Hospital</th><th>Readmissões</th><th>IACS</th><th>Mortalidade O/E</th><th>Complicações</th><th>NPS</th></tr></thead>
            <tbody>{(isAll ? HOSPITALS : list).map((h) => {
              const s = STATS[h.name];
              const pill = (v, good, warn) => <span className={`pill ${v <= good ? 'p-ok' : v <= warn ? 'p-warn' : 'p-bad'}`}>{nf(v, v < 2 ? 2 : 1)}</span>;
              return (
                <tr key={h.name} style={{ cursor: 'pointer' }} onClick={() => setUnit(h.name)}>
                  <td><b>{h.short}</b></td><td>{pill(s.readm, 6.5, 7.8)}</td><td>{pill(s.iacs, 3.2, 4.2)}</td><td>{pill(s.moe, .92, 1)}</td><td>{pill(s.compl, 2.4, 3)}</td><td>{nf(s.nps)}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </Card>
        <Card title="NPS por ponto de contacto" sub="Inquéritos pós-episódio na app MY LUZ e por SMS">
          <Chart type="bars" opts={{ max: 100, items: d.nps.map(([l, v]) => ({ label: l, value: v, color: v < 55 ? C.coral : v < 70 ? C.sun : C.ok })) }} />
        </Card>
      </div>
    </>
  );
}

// ---------- Pessoas e capacidade ----------
const SHIFTS = [
  ['Medicina Interna', [6.1, 7.2, 10.8], 7], ['Cirurgia', [5.2, 6.0, 9.4], 6], ['Ortopedia', [5.6, 6.4, 9.9], 6],
  ['Cuidados Intensivos', [1.9, 2.0, 2.1], 2], ['Pediatria', [4.1, 4.4, 6.8], 5], ['Maternidade', [4.8, 5.1, 7.6], 6],
];

export function People() {
  const { list, g, isAll, label } = useScope();
  const share = g.beds / HOSPITALS.reduce((a, h) => a + h.beds, 0);
  const staff = Math.round(GROUP.employees * share), docs = Math.round(GROUP.doctors * share), nurses = Math.round(GROUP.nurses * share);
  const d = useMemo(() => {
    const r = seeded('p' + label);
    return { absent: trend(r, g.absent, -.04, .5), ot: range(6, (i) => Math.round(g.overtime * (.86 + i * .03 + r() * .06))) };
  }, [label]);
  const shown = isAll ? HOSPITALS : list;

  return (
    <>
      <ScopeNote />
      <div className="grid g6">
        <Kpi label="Colaboradores" value={nf(staff)} delta={isAll ? 'grupo Luz Saúde' : label} />
        <Kpi label="Médicos" value={nf(docs)} delta={`${nf(docs / staff * 100, 0)}% do total`} />
        <Kpi label="Enfermeiros" value={nf(nurses)} delta={`${nf(nurses / docs, 2)} por médico`} />
        <Kpi label="Profissionais por cama" value={nf(g.staffPerBed, 1)} delta="referência privada 6,5" tone={g.staffPerBed >= 6 ? 'up' : 'down'} />
        <Kpi label="Horas extra (mês)" value={nf(g.overtime)} delta="▲ 9% · época gripal" tone="down" />
        <Kpi label="Absentismo" value={`${nf(g.absent, 1)}%`} delta="▼ 0,4 p.p. homólogo" tone="up" spark={d.absent} color={C.coral} />
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Doentes por enfermeiro, por turno" pill="Hoje" pillClass="p-teal" sub={`${label} · alvo por serviço; vermelho indica turno acima do alvo`}>
          <table className="tabular">
            <thead><tr><th>Serviço</th><th>Manhã</th><th>Tarde</th><th>Noite</th><th>Alvo</th></tr></thead>
            <tbody>{SHIFTS.map(([s, v, t]) => (
              <tr key={s}><td><b>{s}</b></td>
                {v.map((x, i) => <td key={i}><span className={`pill ${x <= t ? 'p-ok' : x <= t * 1.25 ? 'p-warn' : 'p-bad'}`}>{nf(x, 1)}</span></td>)}
                <td style={{ color: 'var(--muted)' }}>≤ {t}</td></tr>))}</tbody>
          </table>
          <div className="insight" style={{ marginTop: 14 }}><div className="ic">✦</div><div><p>O turno da <b>noite em Medicina Interna</b> está 54% acima do alvo. A previsão de ocupação indica pico até sexta-feira: sugere-se reforço de 2 enfermeiros da bolsa interna.</p></div></div>
        </Card>
        <Card title="Rácio médico/enfermeiro por turno" sub="Grupo · média dos últimos 30 dias">
          <Chart type="bars" opts={{ items: [['Manhã', 1.6], ['Tarde', 2.1], ['Noite', 3.4], ['Fim de semana', 2.7]].map(([l, v]) => ({ label: l, value: v, target: 2.5, color: v > 2.5 ? C.sun : C.teal })) }} />
          <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>Enfermeiros por médico presente. Linha: referência de 2,5.</p>
        </Card>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Horas extra" sub={`${label} · últimos 6 meses`}>
          <Chart type="columns" opts={{ labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], series: [{ name: 'Horas extra', color: C.sun, data: d.ot }] }} />
        </Card>
        <Card title="Capacidade por hospital" sub="Profissionais por cama e absentismo">
          <Chart type="bars" opts={{ items: shown.slice(0, 10).map((h) => ({ label: h.short, value: +STATS[h.name].staffPerBed.toFixed(1), target: 6.5, color: STATS[h.name].absent > 5.5 ? C.coral : C.teal })) }} />
          <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>Barras a vermelho: absentismo acima de 5,5%. Linha: referência de 6,5 profissionais por cama.</p>
        </Card>
      </div>
    </>
  );
}
