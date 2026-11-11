import { useMemo } from 'react';
import { Card, Chart, Kpi } from '../ui.jsx';
import { C, nf, range, seeded } from '../data.js';

// Illustrative list price; the real rate depends on edition, region and contract.
const EUR_PER_CREDIT = 3.0;

const WAREHOUSES = [
  { name: 'WH_PORTAL_BI', size: 'S', use: 'Portal e painéis', suspend: '60 s', credits: 412, queries: 186400, color: C.teal },
  { name: 'WH_ELT', size: 'M', use: 'Ingestão e Dynamic Tables', suspend: '60 s', credits: 368, queries: 9420, color: C.sky },
  { name: 'WH_DS_ML', size: 'M', use: 'Treino de modelos (Snowpark)', suspend: '120 s', credits: 214, queries: 1310, color: C.violet },
  { name: 'WH_AGENT', size: 'XS', use: 'Assistente Luz IA', suspend: '60 s', credits: 58, queries: 22800, color: C.sun },
  { name: 'Cortex AI SQL', size: 'Serverless', use: 'Notas clínicas e comentários', suspend: '—', credits: 121, queries: 48210, color: C.coral },
  { name: 'Serviços serverless', size: 'Serverless', use: 'Snowpipe, tarefas, pesquisa', suspend: '—', credits: 67, queries: 0, color: C.grey },
];
const TEAMS = [['Direção Clínica', 214], ['Financeiro', 188], ['Operações', 241], ['Data Science', 276], ['Learning Health', 132], ['Sistemas de Informação', 189]];
const HOSP_TAG = [['Partilhado (grupo)', 200], ['HL Lisboa', 318], ['HL Arrábida', 142], ['HL Torres de Lisboa', 96], ['HL Coimbra', 88], ['HL Setúbal', 74], ['Novas unidades (4)', 121], ['Restantes 6 hospitais', 201]];

export function Platform() {
  const total = WAREHOUSES.reduce((a, w) => a + w.credits, 0);
  const daily = useMemo(() => {
    const r = seeded('finops');
    return WAREHOUSES.slice(0, 5).map((w) => ({ name: w.name, color: w.color, data: range(11, (i) => +(w.credits / 11 * (i % 7 > 4 ? .45 : 1.12) * (.85 + r() * .3)).toFixed(1)) }));
  }, []);
  const budget = 3600, forecast = Math.round(total / 11 * 30);

  return (
    <>
      <div className="grid g6">
        <Kpi label="Créditos este mês" value={nf(total)} delta="1 a 11 de novembro" />
        <Kpi label="Custo estimado" value={`${nf(total * EUR_PER_CREDIT)} €`} delta={`a ${nf(EUR_PER_CREDIT, 2)} €/crédito (ilustrativo)`} />
        <Kpi label="Previsão do mês" value={`${nf(forecast)} créditos`} delta={`${nf(forecast / budget * 100)}% do orçamento`} tone={forecast <= budget ? 'up' : 'down'} />
        <Kpi label="Custo por utilizador ativo" value={`${nf(total * EUR_PER_CREDIT / 1840, 2)} €`} delta="1 840 utilizadores do portal" tone="up" />
        <Kpi label="Custo por consulta" value={`${nf(total * EUR_PER_CREDIT / 268140 * 100, 2)} c€`} delta="268 140 consultas SQL" tone="up" />
        <Kpi label="Armazenamento" value="18,4 TB" delta="≈ 23 €/TB/mês, comprimido" />
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Consumo diário por warehouse" pill="ACCOUNT_USAGE" pillClass="p-teal" sub="Créditos · fins de semana com consumo mais baixo graças à suspensão automática">
          <Chart type="columns" opts={{ labels: range(11, (i) => `${i + 1}/11`), stacked: true, series: daily }} />
        </Card>
        <Card title="Orçamento mensal" sub="Resource monitor com alertas a 75% e 90%">
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-.02em' }}>{nf(total)} <span style={{ fontSize: 15, color: 'var(--muted)', fontWeight: 600 }}>/ {nf(budget)} créditos</span></div>
          <div className="progress" style={{ margin: '14px 0 6px' }}><i style={{ width: `${total / budget * 100}%`, background: C.teal }} /></div>
          <div className="progress" style={{ marginBottom: 6 }}><i style={{ width: `${forecast / budget * 100}%`, background: 'rgba(107,91,210,.55)' }} /></div>
          <div className="legend"><span><i style={{ background: C.teal }} />Consumido</span><span><i style={{ background: 'rgba(107,91,210,.55)' }} />Previsão a 30/11</span></div>
          <div className="insight" style={{ marginTop: 16 }}><div className="ic">€</div><div><p>Esta demonstração consumiu <b>38,6 créditos</b> (≈ {nf(38.6 * EUR_PER_CREDIT)} €) desde que foi criada, incluindo o treino dos 8 modelos.</p></div></div>
        </Card>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Custo por equipa" sub="Tag de objeto EQUIPA · créditos do mês">
          <Chart type="bars" opts={{ items: TEAMS.map(([l, v]) => ({ label: l, value: v, color: C.petrol })) }} />
        </Card>
        <Card title="Custo por hospital" sub="Tag de objeto HOSPITAL · créditos do mês">
          <Chart type="bars" opts={{ items: HOSP_TAG.map(([l, v]) => ({ label: l, value: v, color: C.teal })) }} />
        </Card>
      </div>

      <Card style={{ marginTop: 16 }} title="Warehouses e serviços" sub="Computação separada por carga de trabalho: o fecho do mês não abranda o portal">
        <table className="tabular">
          <thead><tr><th>Recurso</th><th>Tamanho</th><th>Utilização</th><th>Suspensão automática</th><th>Créditos</th><th>Custo</th><th>Consultas</th></tr></thead>
          <tbody>{WAREHOUSES.map((w) => (
            <tr key={w.name}><td><span className="triage" style={{ background: w.color }} /><b>{w.name}</b></td><td>{w.size}</td><td>{w.use}</td><td>{w.suspend}</td>
              <td>{nf(w.credits)}</td><td>{nf(w.credits * EUR_PER_CREDIT)} €</td><td>{w.queries ? nf(w.queries) : '—'}</td></tr>))}</tbody>
        </table>
        <p className="sub" style={{ marginTop: 12, marginBottom: 0 }}>Valores ilustrativos. O preço por crédito depende da edição, região e contrato.</p>
      </Card>
    </>
  );
}
