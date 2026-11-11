import { useState } from 'react';
import { Card, Chart, Kpi } from '../ui.jsx';
import { C, CLINICS, nf } from '../data.js';
import { ACQUISITION, CAMPAIGNS, CLINIC_HUB, MYLUZ_FUNNEL, PATHWAYS, SERVICE_LINES, WAITING } from '../analytics.js';

// ---------- Linhas de serviço ----------
export function ServiceLines() {
  const [k, setK] = useState('onco');
  const L = SERVICE_LINES[k];
  return (
    <>
      <div className="switch" role="tablist" aria-label="Linha de serviço">
        {Object.entries(SERVICE_LINES).map(([id, v]) => <button key={id} role="tab" aria-selected={id === k} className={id === k ? 'on' : ''} onClick={() => setK(id)}>{v.name}</button>)}
      </div>
      <div className="grid g4" key={k}>
        {L.kpis.map(([l, v, d, t]) => <Kpi key={l} label={l} value={v} delta={d} tone={t} />)}
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        {[L.chartA, L.chartB].map((c) => (
          <Card key={c.title} title={c.title} sub={c.sub}>
            <Chart type={c.type} opts={c.opts} ai={c.ai} />
          </Card>
        ))}
      </div>
    </>
  );
}

// ---------- Percurso do doente ----------
export function Journey() {
  const [k, setK] = useState('orto');
  const P = PATHWAYS[k];
  const first = P.stages[0][1], last = P.stages[P.stages.length - 1][1];
  const drops = P.stages.slice(1).map(([l, v], i) => [l, (1 - v / P.stages[i][1]) * 100]);
  const worst = drops.reduce((a, b) => (b[1] > a[1] ? b : a));
  const referrals = Object.entries(CLINIC_HUB).map(([reg, hub]) => {
    const cs = CLINICS.filter((c) => c.region === reg);
    const n = cs.reduce((a, c) => a + c.consults, 0);
    return [reg, cs.length, hub, Math.round(n * .184)];
  });
  return (
    <>
      <div className="switch" role="tablist" aria-label="Percurso">
        {Object.entries(PATHWAYS).map(([id, v]) => <button key={id} role="tab" aria-selected={id === k} className={id === k ? 'on' : ''} onClick={() => setK(id)}>{v.name}</button>)}
      </div>
      <div className="grid g4" key={k}>
        <Kpi label="Entradas no percurso" value={nf(first)} delta="últimos 12 meses" />
        <Kpi label="Concluíram o percurso no grupo" value={`${nf(last / first * 100, 1)}%`} delta={`${nf(last)} doentes`} />
        <Kpi label="Maior perda" value={`${nf(worst[1], 0)}%`} delta={`antes de: ${worst[0].toLowerCase()}`} tone="down" />
        <Kpi label="Fuga para outros prestadores" value={k === 'orto' ? '41%' : k === 'mama' ? '10%' : '—'} delta={k === 'cardio' ? 'perda é por abandono, não por fuga' : 'medida via Clean Room com a Fidelidade'} tone={k === 'cardio' ? 'neu' : 'down'} />
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title={`Funil · ${P.name}`} pill="Clean Room Fidelidade" pillClass="p-teal" sub="Doentes em cada etapa e perda entre etapas">
          <div className="funnel">
            {P.stages.map(([l, v], i) => (
              <div key={l} className="f-row">
                <span className="f-l">{l}</span>
                <span className="f-bar"><i style={{ width: `${v / first * 100}%` }} /></span>
                <b>{nf(v)}</b>
                <span className="f-drop">{i ? `−${nf(drops[i - 1][1], 0)}%` : ''}</span>
              </div>
            ))}
          </div>
          <div className="insight" style={{ marginTop: 14 }}><div className="ic">✦</div><div><p>{P.leak}</p></div></div>
          <Chart type="bars" ai={{ action: `Atuar na etapa "${worst[0].toLowerCase()}": contacto ativo da equipa nos 7 dias seguintes à etapa anterior.`, impact: `Reduzir a perda nesta etapa para metade traz mais ${nf(Math.round(P.stages[P.stages.indexOf(P.stages.find((s) => s[0] === worst[0])) - 1][1] * worst[1] / 200))} doentes por ano ao percurso completo.` }}
            opts={{ unit: '%', items: drops.map(([l, v]) => ({ label: `→ ${l}`, value: +v.toFixed(1), color: l === worst[0] ? C.coral : C.sky })) }} />
        </Card>
        <Card title="Encaminhamento das clínicas" sub="Doentes das clínicas que seguem para internamento ou cirurgia no hospital de referência · este mês">
          <table className="tabular">
            <thead><tr><th>Região</th><th>Clínicas</th><th>Hospital de referência</th><th>Encaminhados</th></tr></thead>
            <tbody>{referrals.map(([r, n, h, v]) => <tr key={r}><td><b>{r}</b></td><td>{n}</td><td>{h}</td><td>{nf(v)}</td></tr>)}</tbody>
          </table>
          <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>18,4% dos doentes das clínicas são encaminhados para os hospitais do grupo.</p>
        </Card>
      </div>
      <Card style={{ marginTop: 16 }} title="Listas de espera cirúrgica" sub="Doentes em espera e mediana de dias até à cirurgia · alvo interno por especialidade">
        <div className="grid g2">
          <Chart type="bars" ai={{ action: 'Abrir um bloco quinzenal adicional em Ortopedia e Cirurgia Plástica, as duas acima do alvo com mais doentes em espera.', impact: 'Reduz a mediana de Ortopedia de 38 para ≈ 29 dias e protege ≈ 120 cirurgias por ano que hoje fogem para outros prestadores.' }}
            opts={{ unit: ' d', items: WAITING.map(([s, , d, t]) => ({ label: s, value: d, target: t, color: d > t ? C.coral : C.teal })) }} />
          <table className="tabular">
            <thead><tr><th>Especialidade</th><th>Em espera</th><th>Mediana</th><th>Alvo</th></tr></thead>
            <tbody>{WAITING.map(([s, n, d, t]) => <tr key={s}><td><b>{s}</b></td><td>{nf(n)}</td><td>{d} dias</td><td><span className={`pill ${d > t ? 'p-bad' : 'p-ok'}`}>{t} dias</span></td></tr>)}</tbody>
          </table>
        </div>
        <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>Ortopedia inclui os 146 doentes da Unidade de Joelho do Dr. Ricardo Alves.</p>
      </Card>
    </>
  );
}

// ---------- Comercial e digital ----------
export function Commercial() {
  return (
    <>
      <div className="grid g6">
        <Kpi label="Utilizadores MY LUZ" value="1,6 M" delta="ativos nos últimos 12 meses" tone="up" />
        <Kpi label="Subscritores LUZ ON PRIME" value="411 mil" delta="▲ 32% em 12 meses" tone="up" />
        <Kpi label="Abandono LUZ ON PRIME" value="2,1%" delta="mensal · ▼ 0,4 p.p." tone="up" />
        <Kpi label="Clientes novos (mês)" value="38 200" delta="31% via rede da seguradora" />
        <Kpi label="Clientes recorrentes" value="74%" delta="voltaram nos últimos 12 meses" tone="up" />
        <Kpi label="Marcações via MY LUZ" value="41%" delta="▲ 5 p.p. homólogo" tone="up" />
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title="Funil da app MY LUZ" sub="Milhões de utilizadores">
          <Chart type="bars" ai={{ action: 'Ativar o check-in digital automático para quem já marcou pela app, a maior quebra do funil.', impact: 'Passar de 0,72 M para 0,85 M utilizadores com check-in poupa ≈ 4 min por visita no balcão.' }}
            opts={{ unit: ' M', items: MYLUZ_FUNNEL.map(([l, v]) => ({ label: l, value: v, color: C.teal })) }} />
        </Card>
        <Card title="Origem dos clientes novos" sub="Últimos 90 dias">
          <Chart type="donut" ai={{ action: 'Reforçar a referenciação médica com relatórios de seguimento para os médicos que encaminham doentes.', impact: 'Clientes vindos de referência médica geram 1,8× mais episódios no primeiro ano.' }}
            opts={{ center: '38,2 mil', centerLabel: 'por mês', items: ACQUISITION.map(([l, v, c]) => ({ label: l, value: v, color: c })) }} />
        </Card>
        <Card title="Subscritores LUZ ON PRIME" sub="Milhares · últimos 12 meses">
          <Chart type="line" ai={{ action: 'Propor o LUZ ON PRIME a utilizadores com 3 ou mais visitas por ano que ainda não subscreveram.', impact: 'Uma conversão de 4% nesse grupo acrescenta ≈ 18 mil subscritores em 6 meses.' }}
            opts={{ labels: ['dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov'], min: 300, max: 420, series: [{ name: 'Subscritores (mil)', color: C.sun, data: [312, 318, 327, 333, 341, 352, 360, 368, 377, 389, 398, 411], area: true }] }} />
        </Card>
      </div>
      <Card style={{ marginTop: 16 }} title="Campanhas de saúde" pill="Dados de saúde com consentimento" pillClass="p-teal" sub="Campanhas na app, SMS e email · apenas a clientes com consentimento para comunicações de saúde">
        <table className="tabular">
          <thead><tr><th>Campanha</th><th>Canal</th><th>Destinatários</th><th>Conversão</th><th>Resultado</th><th>Estado</th></tr></thead>
          <tbody>{CAMPAIGNS.map(([n, ch, to, cv, res, c, st]) => <tr key={n}><td><b>{n}</b></td><td>{ch}</td><td>{to}</td><td>{cv}</td><td>{res}</td><td><span className={`pill ${c}`}>{st}</span></td></tr>)}</tbody>
        </table>
        <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>A campanha de diabéticos é a sugerida pela Luz IA na Visão geral.</p>
      </Card>
    </>
  );
}
