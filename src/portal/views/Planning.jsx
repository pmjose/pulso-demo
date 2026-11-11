import { useState } from 'react';
import { Card, Chart, Kpi } from '../ui.jsx';
import { C, HOSPITALS, STATS, groupStats, nf } from '../data.js';
import { MONTHLY_2026, PLAN, growth2026 } from '../analytics.js';

// Each lever's effect per unit, consistent with figures quoted in other views.
const LEVERS = [
  { k: 'beds', name: 'Camas de cuidados continuados', unit: 'camas', min: 0, max: 30, step: 2, rev: 0.31, occ: -0.045, note: '10 camas libertam ≈ 2 600 dias de internamento agudo por ano' },
  { k: 'blocks', name: 'Blocos operatórios extra por semana', unit: 'blocos', min: 0, max: 6, step: 1, rev: 1.06, surg: 200, wait: -3, note: '≈ 4 cirurgias por bloco · 5 310 € por episódio cirúrgico' },
  { k: 'price', name: 'Preço médio Multicare', unit: '%', min: 0, max: 5, step: 0.5, rev: 2.7, note: '+1% vale ≈ 2,7 M€ por ano' },
  { k: 'tele', name: 'Teleconsulta (pontos percentuais)', unit: 'p.p.', min: 0, max: 5, step: 0.5, rev: 0.9, slots: 2100, note: 'cada p.p. liberta ≈ 2 100 vagas presenciais por mês' },
  { k: 'noshow', name: 'Redução da taxa de faltas', unit: 'p.p.', min: 0, max: 3, step: 0.5, rev: 2.2, note: 'cada p.p. recupera ≈ 2 140 consultas por mês' },
];

export function Planning() {
  const [v, setV] = useState({ beds: 0, blocks: 0, price: 0, tele: 0, noshow: 0 });
  const dRev = LEVERS.reduce((a, l) => a + l.rev * v[l.k], 0);
  // Extra capacity costs: beds and theatre blocks carry staff and consumables.
  const dCost = v.beds * 0.19 + v.blocks * 0.66 + v.tele * 0.12;
  const base = { rev: PLAN.forecast2026, ebitda: 17.7, occ: STATS['Hospital da Luz Lisboa'].occ, surg: 41200, wait: 38, slots: 0 };
  const sc = {
    rev: base.rev + dRev,
    ebitda: ((base.rev * base.ebitda / 100) + dRev - dCost) / (base.rev + dRev) * 100,
    occ: base.occ + LEVERS[0].occ * v.beds * 10 / 10 * 1,
    surg: base.surg + v.blocks * 200,
    wait: Math.max(18, base.wait + v.blocks * -3),
    slots: v.tele * 2100 + v.noshow * 2140,
  };
  const set = (k, x) => setV({ ...v, [k]: x });
  const active = Object.values(v).some((x) => x > 0);

  const gs = groupStats().revenue;
  const rows = HOSPITALS.map((h) => {
    const r25 = STATS[h.name].revenue * PLAN.revenue2025 / gs;
    // Budget already plans the ramp-up of new units.
    return { h, r25, bRaw: r25 * (h.isNew ? 1.36 : 1.065), fRaw: r25 * (1 + growth2026(h)) };
  });
  const fSum = rows.reduce((a, r) => a + r.fRaw, 0), bSum = rows.reduce((a, r) => a + r.bRaw, 0);
  rows.forEach((r) => { r.budget = r.bRaw * PLAN.budget2026 / bSum; r.forecast = r.fRaw * PLAN.forecast2026 / fSum; r.gap = (r.forecast / r.budget - 1) * 100; });
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const M = MONTHLY_2026;

  return (
    <>
      <div className="grid g4">
        <Kpi label="Receita 2025" value={`${PLAN.revenue2025} M€`} delta="ano fechado" />
        <Kpi label="Orçamento 2026" value={`${PLAN.budget2026} M€`} delta="▲ 7,6% vs. 2025" />
        <Kpi label="Previsão 2026" value={`${PLAN.forecast2026} M€`} delta={`+${PLAN.forecast2026 - PLAN.budget2026} M€ vs. orçamento`} tone="up" />
        <Kpi label="Receita acumulada 2026" value={`${nf(PLAN.ytdActual, 1)} M€`} delta={`orçamento ${nf(PLAN.ytdBudget, 1)} M€ · +${nf((PLAN.ytdActual / PLAN.ytdBudget - 1) * 100, 1)}%`} tone="up" />
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Real, orçamento e previsão 2026" pill="ML · previsão de fecho" pillClass="p-ml" sub="Receita mensal em milhões de euros · novembro e dezembro previstos">
          <Chart type="line" ai={{ action: 'Proteger a receita de novembro e dezembro, sazonalmente mais fracos: manter a atividade cirúrgica programada até 23/12.', impact: 'Cada semana de bloco completo em dezembro vale ≈ 3,4 M€ e protege o fecho acima do orçamento.' }}
            opts={{ labels: months, min: 50, max: 90, forecastFrom: 9, series: [
              { name: 'Real', color: C.teal, data: M.actual.concat([null, null]), area: true },
              { name: 'Previsão', color: C.violet, dash: true, data: Array(9).fill(null).concat([M.actual[9]], M.forecast) },
              { name: 'Orçamento', color: C.grey, width: 1.4, data: M.budget },
            ] }} />
        </Card>
        <Card title="Previsão vs. orçamento por hospital" sub="% de desvio previsto no fecho de 2026">
          <Chart type="bars" ai={{ action: 'Rever com as direções dos hospitais abaixo do orçamento o plano de atividade do 4.º trimestre.', impact: 'Fechar metade do desvio negativo acrescenta ≈ 2 M€ ao resultado do grupo.' }}
            opts={{ unit: '%', items: [...rows].sort((a, b) => b.gap - a.gap).slice(0, 10).map((r) => ({ label: r.h.short, value: +r.gap.toFixed(1), color: r.gap >= 0 ? C.teal : C.coral })) }} />
        </Card>
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Simulador de cenários" pill="E se…?" pillClass="p-ai" sub="Mova as alavancas: o impacto é calculado sobre a previsão de 2026 e a capacidade atual">
          <div className="levers">
            {LEVERS.map((l) => (
              <label key={l.k} className="lever">
                <div className="row"><b>{l.name}</b><span className="sp">{l.unit === '%' ? '+' : '+'}{nf(v[l.k], v[l.k] % 1 ? 1 : 0)} {l.unit}</span></div>
                <input type="range" min={l.min} max={l.max} step={l.step} value={v[l.k]} onChange={(e) => set(l.k, +e.target.value)} />
                <small>{l.note}</small>
              </label>
            ))}
          </div>
          <button className="btn" style={{ marginTop: 8 }} onClick={() => setV({ beds: 0, blocks: 0, price: 0, tele: 0, noshow: 0 })} disabled={!active}>Repor cenário base</button>
        </Card>
        <Card title="Resultado do cenário" sub={active ? 'Base → cenário' : 'Mova uma alavanca para simular'}>
          {[
            ['Receita 2026 (ano completo)', `${nf(base.rev)} M€`, `${nf(sc.rev, 1)} M€`, sc.rev >= base.rev],
            ['Margem EBITDA', `${nf(base.ebitda, 1)}%`, `${nf(sc.ebitda, 1)}%`, sc.ebitda >= base.ebitda],
            ['Ocupação HL Lisboa', `${nf(base.occ, 1)}%`, `${nf(sc.occ, 1)}%`, sc.occ <= base.occ],
            ['Cirurgias por ano', nf(base.surg), nf(sc.surg), sc.surg >= base.surg],
            ['Espera em Ortopedia (mediana)', `${base.wait} dias`, `${nf(sc.wait)} dias`, sc.wait <= base.wait],
            ['Vagas presenciais libertadas/mês', '—', nf(sc.slots), true],
          ].map(([k, a, b, good]) => (
            <div key={k} className="metric"><span>{k}</span><b>{a}{active && <span style={{ color: good ? C.ok : C.coral }}> → {b}</span>}</b></div>
          ))}
          {active && <p className="sub" style={{ marginTop: 12, marginBottom: 0 }}>Investimento operacional estimado: {nf(dCost, 1)} M€ por ano.</p>}
        </Card>
      </div>

      <Card style={{ marginTop: 16 }} title="Orçamento e previsão por hospital" sub="Milhões de euros">
        <table className="tabular">
          <thead><tr><th>Hospital</th><th>Receita 2025</th><th>Orçamento 2026</th><th>Previsão 2026</th><th>Desvio</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.h.name}><td><b>{r.h.short}</b>{r.h.isNew && <span className="new-tag">NOVA</span>}</td><td>{nf(r.r25, 1)}</td><td>{nf(r.budget, 1)}</td><td>{nf(r.forecast, 1)}</td>
              <td><span className={`pill ${r.gap >= 0 ? 'p-ok' : 'p-warn'}`}>{r.gap >= 0 ? '+' : ''}{nf(r.gap, 1)}%</span></td></tr>))}
            <tr><td><b>Grupo</b></td><td><b>{PLAN.revenue2025}</b></td><td><b>{PLAN.budget2026}</b></td><td><b>{PLAN.forecast2026}</b></td><td><b>+{nf((PLAN.forecast2026 / PLAN.budget2026 - 1) * 100, 1)}%</b></td></tr></tbody>
        </table>
      </Card>
    </>
  );
}
