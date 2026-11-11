import { useMemo } from 'react';
import { Card, Chart, Kpi, ScopeNote, useScope, useUnit } from '../ui.jsx';
import { C, GROUP, HOSPITALS, SPECIALTIES, STATS, nf, seeded } from '../data.js';

// Specialty revenue and cost per episode (€), fictitious.
const EPISODE = {
  Cardiologia: [4820, 3910], Ortopedia: [6240, 5120], Oncologia: [7980, 6890], 'Cirurgia Geral': [5310, 4470], Obstetrícia: [3640, 3290],
  Imagiologia: [410, 268], 'Medicina Interna': [3920, 3610], Pediatria: [1480, 1260], Oftalmologia: [1960, 1390], 'Medicina Física e Reabilitação': [720, 640],
};

// Investor-grade KPIs vs. the 2026 plan. Pressure from the new shareholder.
const PLAN = [
  ['Receita (acumulado)', '756,2 M€', '748,0 M€', 'p-ok', 'Acima do plano'],
  ['EBITDA (acumulado)', '133,9 M€', '136,5 M€', 'p-warn', '−1,9% vs. plano'],
  ['Margem EBITDA', '17,7%', '18,2%', 'p-warn', 'Novas unidades em ramp-up'],
  ['Prazo médio de recebimento', '47 dias', '45 dias', 'p-warn', 'SNS e ADSE acima de 60 dias'],
  ['Capex em % da receita', '6,8%', '7,5%', 'p-ok', 'Abaixo do orçamento'],
  ['Dívida líquida / EBITDA', '2,4×', '≤ 2,75×', 'p-ok', 'Dentro do covenant'],
];

export function Finance() {
  const { list, g, isAll, label } = useScope();
  const { setUnit } = useUnit();
  const shown = isAll ? HOSPITALS : list;
  const heat = useMemo(() => {
    const specs = SPECIALTIES.slice(0, 8);
    const rows = shown.slice(0, 10).map((h) => {
      const r = seeded('mg' + h.name), base = STATS[h.name].margin;
      return specs.map((s) => Math.max(0, Math.round(base + (EPISODE[s][0] - EPISODE[s][1]) / EPISODE[s][0] * 40 - 12 + (r() - .5) * 12)));
    });
    return { specs, rows, names: shown.slice(0, 10).map((h) => h.short.replace('HL ', '')) };
  }, [label]);

  return (
    <>
      <ScopeNote />
      <div className="grid g6">
        <Kpi label="Receita 2025" value={`${GROUP.revenue2025} M€`} delta={`▲ ${GROUP.revenueGrowth}% vs. 2024`} tone="up" />
        <Kpi label="Resultado líquido 2025" value={`${nf(GROUP.netProfit2025, 1)} M€`} delta="Margem líquida 7,9%" tone="up" />
        <Kpi label={isAll ? 'Receita acumulada 2026' : `Receita 2025 · ${label}`} value={isAll ? `${nf(GROUP.ytdRevenue, 1)} M€` : `${nf(g.revenue, 1)} M€`} delta={isAll ? `▲ ${nf(GROUP.ytdGrowth, 1)}% homólogo` : 'ano fechado'} tone="up" />
        <Kpi label="Margem operacional" value={`${nf(g.margin, 1)}%`} delta={isAll ? 'média ponderada por camas' : 'EBITDA da unidade'} tone={g.margin > 10 ? 'up' : 'down'} />
        <Kpi label="Receita por episódio" value="3 412 €" delta="▲ 3,1% homólogo" tone="up" />
        <Kpi label="Custo por episódio" value="2 874 €" delta="▲ 4,6% · pressão salarial" tone="down" />
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Indicadores para acionistas · plano 2026" pill="Reporte mensal" pillClass="p-teal" sub="Acompanhamento acumulado até outubro">
          <table className="tabular">
            <thead><tr><th>Indicador</th><th>Real</th><th>Plano</th><th>Estado</th></tr></thead>
            <tbody>{PLAN.map(([k, real, plan, cls, note]) => (
              <tr key={k}><td><b>{k}</b></td><td>{real}</td><td style={{ color: 'var(--muted)' }}>{plan}</td><td><span className={`pill ${cls}`}>{note}</span></td></tr>))}</tbody>
          </table>
        </Card>
        <Card title="Estrutura acionista" sub="Desde janeiro de 2026">
          <Chart ai={{ action: 'Usar o portal como fonte única do reporte trimestral à Fidelidade e à Macquarie.', impact: 'Elimina ≈ 10 dias de consolidação manual por trimestre.' }} type="donut" opts={{ center: '2', centerLabel: 'acionistas', items: [{ label: 'Fidelidade', value: 60, color: C.teal }, { label: 'Macquarie', value: 40, color: C.petrol }] }} />
          <p className="sub" style={{ marginTop: 14, marginBottom: 0 }}>Reporte trimestral ao conselho com a mesma fonte de dados do portal, sem consolidação manual.</p>
        </Card>
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Margem por hospital e especialidade" sub="Margem operacional (%) · cores mais escuras indicam margem superior">
          <Chart ai={{ action: 'Rever preços e mix nas combinações hospital × especialidade com margem abaixo de 5%.', impact: 'Levar essas combinações à mediana do grupo acrescenta ≈ 6 M€ de EBITDA anual.' }} type="heat" opts={{ rows: heat.names, cols: heat.specs.map((s) => s.split(' ')[0]), unit: '% margem', matrix: heat.rows, every: 1 }} />
          <div className="legend" style={{ marginTop: 10 }}>{heat.specs.map((s) => <span key={s}>{s}</span>)}</div>
        </Card>
        <Card title="Receita vs. custo por episódio" sub="Euros por especialidade">
          <Chart ai={{ action: 'Rever custos de material em Oncologia e Ortopedia, onde o custo por episódio é mais alto.', impact: '−5% no custo destas especialidades vale ≈ 3,2 M€ por ano.' }} type="bars" opts={{ unit: ' €', items: SPECIALTIES.slice(0, 7).map((s) => ({ label: s, value: EPISODE[s][0] - EPISODE[s][1], color: (EPISODE[s][0] - EPISODE[s][1]) / EPISODE[s][0] > .15 ? C.teal : C.sun })) }} />
          <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>Margem por episódio (receita menos custo direto e indireto alocado).</p>
        </Card>
      </div>

      <Card style={{ marginTop: 16 }} title="Resultados por hospital" sub="Receita 2025 por hospital (total do grupo: 807 M€) · clique para filtrar">
        <table className="tabular">
          <thead><tr><th>Hospital</th><th>Receita</th><th>Custos</th><th>Margem</th><th>Ocupação</th><th>Estado</th></tr></thead>
          <tbody>{shown.map((h) => {
            const s = STATS[h.name];
            return (
              <tr key={h.name} style={{ cursor: 'pointer' }} onClick={() => setUnit(h.name)}>
                <td><b>{h.short}</b>{h.isNew && <span className="new-tag">NOVA</span>}</td>
                <td>{nf(s.revenue, 1)} M€</td><td>{nf(s.revenue * (1 - s.margin / 100), 1)} M€</td>
                <td><span className="bar-mini" style={{ width: Math.max(4, s.margin * 4), background: s.margin < 5 ? C.coral : C.teal }} />{nf(s.margin, 1)}%</td>
                <td>{nf(s.occ, 1)}%</td>
                <td><span className={`pill ${h.isNew ? 'p-ml' : s.margin < 10 ? 'p-warn' : 'p-ok'}`}>{h.isNew ? 'Em ramp-up' : s.margin < 10 ? 'Abaixo da média' : 'No plano'}</span></td>
              </tr>
            );
          })}</tbody>
        </table>
      </Card>
    </>
  );
}
