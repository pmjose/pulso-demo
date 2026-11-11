import { useMemo } from 'react';
import { Card, Chart, Kpi, ScopeNote, useScope, useUnit, PageTabs } from '../ui.jsx';
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
      <PageTabs label="Secções" tabs={[
        ['Acionistas e plano', () => (
          <>
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
          <div className="grid g2" style={{ marginTop: 16 }}>
            <Card title="EBITDA mensal vs. plano" sub="Milhões de euros · 2026">
              <Chart ai={{ action: 'Acelerar o ramp-up de Leiria e Santarém, que explicam 70% do desvio de EBITDA face ao plano.', impact: 'Atingir o plano de ocupação nas duas unidades fecha ≈ 1,8 M€ do desvio de 2,6 M€.' }} type="line" opts={{ labels: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out'], min: 8, max: 18, series: [
                { name: 'EBITDA real', color: C.teal, area: true, data: [12.4, 12.9, 14.1, 13.3, 14.2, 13.5, 13.0, 10.9, 14.3, 15.3] },
                { name: 'Plano', color: C.grey, data: [12.6, 13.1, 14.0, 13.6, 14.3, 13.8, 13.4, 11.4, 14.5, 15.8] },
              ] }} />
            </Card>
            <Card title="Desvio de EBITDA face ao plano" sub="Contributos para os −2,6 M€ acumulados">
              <Chart ai={{ action: 'Separar no reporte aos acionistas o efeito das novas unidades do desempenho do perímetro comparável.', impact: 'Mostra que o perímetro comparável está 0,9 M€ acima do plano.' }} type="bars" opts={{ unit: ' M€', items: [['Perímetro comparável', 0.9], ['Ramp-up HL Leiria', -1.2], ['Ramp-up HL Santarém', -0.6], ['Custos com pessoal', -1.1], ['Energia', -0.6]].map(([l, v]) => ({ label: l, value: v, color: v >= 0 ? C.ok : C.coral })) }} />
              <div className="metric"><span>Plano → real (acumulado)</span><b>136,5 → 133,9 M€ (−2,6 M€)</b></div>
            </Card>
          </div>
          </>
        )],
        ['Margem', () => (
          <>
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
          <div className="grid g2" style={{ marginTop: 16 }}>
            <Card title="Composição do custo por episódio" sub="2 874 € em média · 2026">
              <Chart ai={{ action: 'Negociar em conjunto para os 15 hospitais os 20 dispositivos de maior valor, onde estão as maiores diferenças de preço.', impact: '−3% no material clínico baixa o custo por episódio em ≈ 20 €.' }} type="donut" opts={{ center: '2 874 €', centerLabel: 'por episódio', items: [{ label: 'Pessoal', value: 52, color: C.teal }, { label: 'Material clínico', value: 19, color: C.sky }, { label: 'Fármacos', value: 13, color: C.violet }, { label: 'Estrutura e energia', value: 11, color: C.sun }, { label: 'Outros', value: 5, color: C.grey }] }} />
            </Card>
            <Card title="Receita e custo por episódio" sub="Euros · últimos 8 trimestres">
              <Chart ai={{ action: 'Proteger a margem por episódio com a atualização de tabelas das seguradoras em janeiro.', impact: 'O custo cresce 4,6% contra 3,1% da receita: sem atualização de preços, a margem por episódio desce ≈ 1 p.p. em 2027.' }} type="line" opts={{ min: 2500, max: 3500, labels: ['T4 24', 'T1 25', 'T2 25', 'T3 25', 'T4 25', 'T1 26', 'T2 26', 'T3 26'], series: [
                { name: 'Receita por episódio', color: C.teal, data: [3240, 3268, 3291, 3305, 3331, 3362, 3390, 3412] },
                { name: 'Custo por episódio', color: C.coral, data: [2690, 2712, 2738, 2761, 2789, 2818, 2847, 2874] },
              ] }} />
            </Card>
          </div>
          </>
        )],
        ['Por hospital', () => (
          <>
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
          <Card style={{ marginTop: 16 }} title="Ocupação vs. margem por hospital" sub="Cada ponto é um hospital · mais ocupação tende a significar mais margem, exceto nas unidades em ramp-up">
            <Chart ai={{ action: 'Nos hospitais com ocupação alta e margem baixa, rever o mix: há doentes médicos de baixa receita a ocupar camas cirúrgicas.', impact: 'Mudar 5% das camas para atividade cirúrgica programada acrescenta ≈ 1,5 p.p. de margem nesses hospitais.' }} type="scatter" opts={{ points: shown.map((h) => [+STATS[h.name].occ.toFixed(1), +STATS[h.name].margin.toFixed(1)]), color: C.teal, xLabel: 'Ocupação (%)', yLabel: 'Margem (%)' }} />
          </Card>
          </>
        )],
      ]} />
    </>
  );
}
