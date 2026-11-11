import { useMemo, useState } from 'react';
import { Card, Chart, Kpi, PageTabs } from '../ui.jsx';
import { C, nf, range, seeded } from '../data.js';

// ---------- synthetic world: 180 days of external signals and hospital activity ----------
const N = 180;
const START = new Date(2026, 4, 16); // 16 May 2026 → 11 Nov 2026
const dateOf = (i) => new Date(START.getFullYear(), START.getMonth(), START.getDate() + i);
const label = (i) => { const d = dateOf(i); return `${d.getDate()}/${d.getMonth() + 1}`; };

function buildWorld() {
  const r = seeded('signals-world');
  const g = () => (r() + r() + r() - 1.5) * 1.4; // ~normal noise
  const lag = (arr, k) => (i) => arr[Math.max(0, i - k)];
  const doy = (i) => (dateOf(i) - new Date(2026, 0, 1)) / 864e5;

  const tmax = range(N, (i) => 23 + 8 * Math.sin((doy(i) - 110) / 365 * 2 * Math.PI) + g() * 1.6 + (i > 68 && i < 76 ? 8 : 0) + (i > 88 && i < 93 ? 6 : 0));
  const tmin = range(N, (i) => tmax[i] - 9 - g() * 1.2 - (i > 160 ? 3 : 0) - (i > 150 && i < 156 ? 4 : 0));
  const rain = range(N, (i) => { const wet = doy(i) > 270 ? .45 : .08; return r() < wet ? Math.round(2 + r() * 24) : 0; });
  const firstRain = rain.map((v, i) => (v > 0 && rain.slice(Math.max(0, i - 10), i).every((x) => x === 0) ? 1 : 0));
  const pollen = range(N, (i) => Math.max(0, Math.min(5, 4.6 - i / 14 + g() * .6 + (rain[i] > 0 ? -1.2 : 0))));
  const fires = range(N, (i) => (i > 80 && i < 112 ? Math.max(0, 6 * Math.sin((i - 80) / 32 * Math.PI) + g()) : 0));
  const pm25 = range(N, (i) => 9 + fires[i] * 3.4 + g() * 2 + (rain[i] > 5 ? -3 : 0));
  const wastewater = range(N, (i) => Math.max(2, 4 + (i > 118 ? (i - 118) ** 1.6 / 9 : 0) + g() * 2));
  const flu = range(N, (i) => Math.max(1, wastewater[Math.max(0, i - 6)] * .9 + g() * 3));
  const match = range(N, (i) => (dateOf(i).getDay() === 0 || dateOf(i).getDay() === 3) && r() < .55 && (i < 45 || i > 95) ? 1 : 0);
  const snsClosed = range(N, (i) => { const wk = dateOf(i).getDay() % 6 === 0 ? 2.2 : 1; const summer = i > 40 && i < 115 ? 2.4 : 1; return Math.round(Math.max(0, 1.4 * wk * summer + g())); });
  const school = range(N, (i) => (i > 35 && i < 118 ? 0 : 1));
  const tourism = range(N, (i) => 62 + 26 * Math.sin((i - 20) / 120 * Math.PI) + g() * 3);
  const wkend = (i) => (dateOf(i).getDay() % 6 === 0 ? 1 : 0);

  const T = { tmin: lag(tmin, 2), flu3: lag(flu, 3), flu5: lag(flu, 5), pm1: lag(pm25, 1), pol1: lag(pollen, 1), tmax1: lag(tmax, 1), school7: lag(school, 7), tmin3: lag(tmin, 3) };
  const resp = range(N, (i) => 150 + 7.5 * Math.max(0, 15 - T.tmin(i)) + 1.1 * T.flu3(i) + 1.6 * T.pm1(i) + g() * 9);
  const paed = range(N, (i) => 210 + 70 * T.school7(i) + .9 * T.flu5(i) + g() * 12);
  const trauma = range(N, (i) => 190 + 34 * firstRain[i] + .7 * tourism[i] + 22 * wkend(i) + g() * 9);
  const allergy = range(N, (i) => 36 + 19 * T.pol1(i) + .9 * pm25[i] + g() * 5);
  const heat = range(N, (i) => 18 + 6.5 * Math.max(0, T.tmax1(i) - 31) + g() * 3);
  const cardiac = range(N, (i) => 31 + .9 * Math.max(0, 13 - T.tmin3(i)) + g() * 2.4);
  const er = range(N, (i) => 1050 + resp[i] + paed[i] + trauma[i] + heat[i] + 11 * snsClosed[i] - 90 * match[i] + g() * 25);
  const noshow = range(N, (i) => 7.1 + .07 * rain[i] + 1.1 * match[i] + (school[i] ? 0 : .6) + g() * .35);
  const funchal = range(N, (i) => 40 + .55 * tourism[i] + g() * 4);

  return {
    signals: {
      tmin: { name: 'Temperatura mínima', unit: '°C', src: 'IPMA · Marketplace', data: tmin },
      tmax: { name: 'Temperatura máxima', unit: '°C', src: 'IPMA · Marketplace', data: tmax },
      rain: { name: 'Precipitação', unit: 'mm', src: 'IPMA · Marketplace', data: rain },
      firstRain: { name: 'Primeira chuva após período seco', unit: 'sim/não', src: 'Derivado de IPMA', data: firstRain },
      pollen: { name: 'Índice de pólen', unit: '0-5', src: 'Rede Portuguesa de Aerobiologia', data: pollen },
      pm25: { name: 'Partículas PM2,5', unit: 'µg/m³', src: 'QualAr · APA', data: pm25 },
      fires: { name: 'Área ardida (fumo de incêndios)', unit: 'índice', src: 'ICNF · fogos.pt', data: fires },
      wastewater: { name: 'Vírus respiratórios em águas residuais', unit: 'índice', src: 'INSA · vigilância', data: wastewater },
      flu: { name: 'Pesquisas por "gripe" e "febre"', unit: 'índice', src: 'Google Trends', data: flu },
      match: { name: 'Jogo grande de futebol', unit: 'sim/não', src: 'Calendário Liga Portugal', data: match },
      snsClosed: { name: 'Urgências SNS encerradas na região', unit: 'n.º', src: 'Portal SNS · dados abertos', data: snsClosed },
      school: { name: 'Período escolar', unit: 'sim/não', src: 'Calendário escolar · DGE', data: school },
      tourism: { name: 'Ocupação hoteleira', unit: '%', src: 'INE · Turismo de Portugal', data: tourism },
    },
    metrics: {
      er: { name: 'Episódios de urgência (grupo)', data: er },
      resp: { name: 'Urgência · respiratória', data: resp },
      paed: { name: 'Urgência · pediátrica', data: paed },
      trauma: { name: 'Urgência · traumatologia', data: trauma },
      allergy: { name: 'Consultas e urgência · alergologia', data: allergy },
      heat: { name: 'Desidratação e golpe de calor', data: heat },
      cardiac: { name: 'Síndrome coronária aguda', data: cardiac },
      noshow: { name: 'Taxa de faltas a consultas (%)', data: noshow },
      funchal: { name: 'Urgência · HL Funchal', data: funchal },
    },
  };
}

// ---------- statistics ----------
function pearson(x, y) {
  const n = x.length, mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const a = x[i] - mx, b = y[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}
// Correlate signal(t - lag) with metric(t).
const atLag = (s, m, k) => [s.slice(0, N - k), m.slice(k)];
function lagProfile(s, m, max = 10) {
  return range(max + 1, (k) => pearson(...atLag(s, m, k)));
}
function slope(x, y) {
  const n = x.length, mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  return x.reduce((a, v, i) => a + (v - mx) * (y[i] - my), 0) / (x.reduce((a, v) => a + (v - mx) ** 2, 0) || 1);
}
const z = (a) => { const m = a.reduce((x, y) => x + y, 0) / a.length; const sd = Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / a.length) || 1; return a.map((v) => (v - m) / sd); };
const strength = (r) => { const a = Math.abs(r); return a > .7 ? 'muito forte' : a > .5 ? 'forte' : a > .3 ? 'moderada' : a > .15 ? 'fraca' : 'sem relação relevante'; };

// Strong but non-causal pairs the analyst should not act on directly.
const CONFOUNDED = {
  'tourism:paed': 'Confundido: ambos seguem as férias escolares',
  'tmin:funchal': 'Confundido: explicado pelo turismo',
  'tmax:funchal': 'Confundido: explicado pelo turismo',
  'tmax:paed': 'Confundido: ambos seguem as férias escolares',
  'tourism:er': 'Confundido: sazonalidade de verão',
};

const IDEAS = [
  ['Urgências SNS encerradas', 'Portal SNS', 'Quando o SNS fecha urgências na região, a procura transfere-se para a rede privada no próprio dia.'],
  ['Vírus em águas residuais', 'INSA', 'Antecipa em 6 a 9 dias o pico de gripe, antes das pesquisas e dos sintomas.'],
  ['Fumo de incêndios (PM2,5)', 'APA · ICNF', 'Agrava DPOC e asma 24 h depois, sobretudo em Centro e Norte em agosto.'],
  ['Primeira chuva após seca', 'IPMA', 'Pisos escorregadios: picos de traumatologia e acidentes de viação no próprio dia.'],
  ['Jogos de Benfica, Porto e Sporting', 'Liga Portugal', 'A urgência esvazia durante o jogo e enche nas 2 horas seguintes.'],
  ['Regresso às aulas', 'DGE', 'Infeções pediátricas sobem 7 dias depois do início do período escolar.'],
  ['Mudança de hora', 'Calendário', 'Aumento de eventos cardíacos na segunda-feira seguinte.'],
  ['Turismo e cruzeiros', 'INE · Porto do Funchal', 'Explica a urgência no HL Funchal em dias com navios atracados.'],
  ['Greves de transportes', 'CP · Metro', 'Mais faltas a consultas e cirurgias canceladas em Lisboa.'],
  ['Listas de espera do SNS', 'Portal da Transparência', 'Tempos de espera longos no SNS aumentam a procura privada em Oncologia e Ortopedia.'],
  ['Dia de pagamento de salários', 'Calendário', 'Mais marcações de particulares na primeira semana do mês.'],
  ['Renovação de apólices', 'Fidelidade · Multicare', 'Picos de consultas antes do fim do plafond anual.'],
];

export function Signals() {
  const W = useMemo(buildWorld, []);
  const [sig, setSig] = useState('wastewater');
  const [met, setMet] = useState('resp');
  const S = W.signals[sig], M = W.metrics[met];

  const prof = useMemo(() => lagProfile(S.data, M.data), [sig, met]);
  const best = prof.reduce((b, r, k) => (Math.abs(r) > Math.abs(prof[b]) ? k : b), 0);
  const [xs, ys] = atLag(S.data, M.data, best);
  const r = prof[best], b = slope(xs, ys);
  const t = r * Math.sqrt((xs.length - 2) / Math.max(1e-6, 1 - r * r));

  // Automatic discovery across every signal × metric pair.
  const top = useMemo(() => {
    const out = [];
    for (const [sk, s] of Object.entries(W.signals)) for (const [mk, m] of Object.entries(W.metrics)) {
      const p = lagProfile(s.data, m.data); const k = p.reduce((bb, v, j) => (Math.abs(v) > Math.abs(p[bb]) ? j : bb), 0);
      out.push({ sk, mk, r: p[k], k, slope: slope(...atLag(s.data, m.data, k)) });
    }
    return out.sort((a, c) => Math.abs(c.r) - Math.abs(a.r)).slice(0, 8);
  }, []);

  const view = 90; // overlay window: last 90 days
  const zs = z(S.data.slice(N - view - best, N - best)), zm = z(M.data.slice(N - view));
  const unitWord = S.unit === 'sim/não' ? 'quando ocorre' : `por cada +1 ${S.unit}`;

  return (
    <>
      <div className="grid g4">
        <Kpi label="Sinais externos ligados" value={Object.keys(W.signals).length} delta="Marketplace e dados abertos" />
        <Kpi label="Métricas internas" value={Object.keys(W.metrics).length} delta="urgência, consulta, faltas" />
        <Kpi label="Pares analisados" value={nf(Object.keys(W.signals).length * Object.keys(W.metrics).length * 11)} delta="todos os desfasamentos de 0 a 10 dias" />
        <Kpi label="Histórico" value="180 dias" delta="16/5 a 11/11/2026" />
      </div>
      <PageTabs label="Secções" tabs={[
        ['Explorador de correlações', () => (
          <>
          <Card style={{ marginTop: 16 }} title="Explorador de correlações" pill="Snowflake Marketplace" pillClass="p-teal" sub="Escolha um sinal externo e uma métrica do hospital. O desfasamento ótimo é calculado automaticamente.">
            <div className="row" style={{ gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <label className="sel-l">Sinal externo
                <select value={sig} onChange={(e) => setSig(e.target.value)}>{Object.entries(W.signals).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select></label>
              <span style={{ fontSize: 20, color: 'var(--sky)', marginTop: 16 }}>→</span>
              <label className="sel-l">Métrica do hospital
                <select value={met} onChange={(e) => setMet(e.target.value)}>{Object.entries(W.metrics).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}</select></label>
              <div className="corr-badge" style={{ marginLeft: 'auto' }}>
                <b style={{ color: Math.abs(r) > .5 ? C.ok : Math.abs(r) > .3 ? C.sun : C.grey }}>r = {nf(r, 2)}</b>
                <span>{strength(r)} · desfasamento {best} {best === 1 ? 'dia' : 'dias'} · R² {nf(r * r * 100, 0)}%</span>
              </div>
            </div>
            <div className="grid g3">
              <div className="s2">
                <h4 className="mini-h">Sinal (desfasado {best} d) e métrica, normalizados · últimos 90 dias</h4>
                <Chart ai={{ action: `Incluir "${S.name}" com ${best} ${best === 1 ? 'dia' : 'dias'} de desfasamento no modelo de previsão de ${M.name.toLowerCase()}.`, impact: `Este sinal explica ${nf(r * r * 100, 0)}% da variação diária da métrica no período.` }} type="line" opts={{ labels: range(view, (i) => label(N - view + i)), height: 220, min: -3, max: 3.5, series: [
                  { name: `${S.name} (há ${best} d)`, color: C.violet, data: zs.map((v) => +v.toFixed(2)), width: 2 },
                  { name: M.name, color: C.teal, data: zm.map((v) => +v.toFixed(2)), width: 2.4 },
                ] }} />
              </div>
              <div>
                <h4 className="mini-h">Correlação por desfasamento</h4>
                <Chart ai={{ action: `Planear com ${best} ${best === 1 ? 'dia' : 'dias'} de antecedência: é o desfasamento com maior correlação.`, impact: 'Dá uma janela de antecipação para ajustar escalas, camas e stocks.' }} type="columns" opts={{ labels: range(11, (k) => `${k}d`), height: 220, series: [{ name: 'r de Pearson (valor absoluto)', color: C.sky, data: prof.map((v) => +Math.abs(v).toFixed(2)) }] }} />
              </div>
            </div>
            <div className="grid g3" style={{ marginTop: 12 }}>
              <div className="s2">
                <h4 className="mini-h">Dispersão · cada ponto é um dia</h4>
                <Chart ai={{ action: `Usar a inclinação da reta para converter a previsão de "${S.name.toLowerCase()}" em volume esperado.`, impact: 'Transforma um sinal externo num número de doentes planeável.' }} type="scatter" opts={{ points: xs.map((x, i) => [x, ys[i]]), color: C.teal, xLabel: `${S.name} (${S.unit})` }} />
              </div>
              <div>
                <div className="insight"><div className="ic">✦</div><div>
                  <p>{Math.abs(r) < .15
                    ? <>Não há relação relevante entre <b>{S.name.toLowerCase()}</b> e <b>{M.name.toLowerCase()}</b> neste período.</>
                    : <><b>{S.name}</b> tem uma relação <b>{strength(r)}</b> com <b>{M.name.toLowerCase()}</b>, com efeito máximo <b>{best === 0 ? 'no próprio dia' : `${best} ${best === 1 ? 'dia' : 'dias'} depois`}</b>. {unitWord}, a métrica varia <b>{b > 0 ? '+' : ''}{nf(b, b < 1 && b > -1 ? 2 : 1)}</b> em média.</>}</p>
                  <p className="sub" style={{ margin: '8px 0 0' }}>t = {nf(t, 1)} · n = {xs.length} dias · {Math.abs(t) > 3.3 ? 'p < 0,001' : Math.abs(t) > 2 ? 'p < 0,05' : 'não significativo'}. Correlação não implica causalidade.</p>
                </div></div>
                <div className="metric"><span>Fonte do sinal</span><b>{S.src}</b></div>
                <div className="metric"><span>Uso sugerido</span><b>{Math.abs(r) > .4 ? 'Variável no modelo de previsão' : 'Monitorizar'}</b></div>
                <pre className="code" style={{ fontSize: 11 }}>{`SELECT CORR(s.valor, m.valor) AS r
    FROM MARKETPLACE.SINAIS.${sig.toUpperCase()} s
    JOIN LUZ_ANALYTICS.URGENCIA.DIARIO m
      ON m.data = DATEADD(day, ${best}, s.data)
    WHERE m.metrica = '${met}';`}</pre>
              </div>
            </div>
          </Card>
          </>
        )],
        ['Descobertas e impacto', () => (
          <>
          <div className="grid g3" style={{ marginTop: 16 }}>
            <Card className="s2" title="Descobertas automáticas da Luz IA" pill="Cortex · análise de 1 287 pares" pillClass="p-ai" sub="As relações mais fortes encontradas esta semana. Clique para abrir no explorador.">
              <table className="tabular">
                <thead><tr><th>Sinal externo</th><th>Métrica</th><th>r</th><th>Desfasamento</th><th>Leitura</th></tr></thead>
                <tbody>{top.map((x) => {
                  const s = W.signals[x.sk];
                  return (
                    <tr key={x.sk + x.mk} style={{ cursor: 'pointer' }} onClick={() => { setSig(x.sk); setMet(x.mk); scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <td><b>{s.name}</b><br /><small style={{ color: 'var(--muted)' }}>{s.src}</small></td><td>{W.metrics[x.mk].name}</td>
                      <td><span className={`pill ${Math.abs(x.r) > .6 ? 'p-ok' : 'p-warn'}`}>{nf(x.r, 2)}</span></td>
                      <td>{x.k} {x.k === 1 ? 'dia' : 'dias'}</td>
                      <td>{CONFOUNDED[`${x.sk}:${x.mk}`]
                        ? <span className="pill p-warn">{CONFOUNDED[`${x.sk}:${x.mk}`]}</span>
                        : <span style={{ color: 'var(--muted)' }}>{x.slope > 0 ? '+' : ''}{nf(x.slope, Math.abs(x.slope) < 1 ? 2 : 1)} {s.unit === 'sim/não' ? 'quando ocorre' : `por ${s.unit}`}</span>}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </Card>
            <Card title="Impacto previsto · próximos 7 dias" pill="ML · com sinais externos" sub="HL Lisboa · urgência respiratória vs. modelo sem sinais">
              <Chart ai={{ action: 'Adotar o modelo com sinais externos como previsão oficial da urgência.', impact: 'Erro de previsão de 11,8% para 6,4%: escalas mais ajustadas e menos horas extra.' }} type="columns" opts={{ labels: ['qui', 'sex', 'sáb', 'dom', 'seg', 'ter', 'qua'], height: 190, series: [
                { name: 'Sem sinais externos', color: C.grey, data: [48, 49, 44, 41, 50, 49, 48] },
                { name: 'Com IPMA + INSA + QualAr', color: C.teal, data: [53, 61, 63, 55, 58, 54, 51] },
              ] }} />
              <div className="metric"><span>Erro de previsão (MAPE)</span><b>11,8% → 6,4%</b></div>
              <div className="metric"><span>Sinais com maior ganho</span><b>T. mínima, águas residuais</b></div>
            </Card>
          </div>
          <Card style={{ marginTop: 16 }} title="Ideias de sinais para ligar" sub="Fontes externas a combinar com os dados da Luz Saúde, via Snowflake Marketplace ou dados abertos">
            <div className="grid g4">{IDEAS.map(([t, src, d]) => (
              <div key={t} className="idea"><b>{t}</b><small>{src}</small><p>{d}</p></div>
            ))}</div>
          </Card>
          </>
        )],
      ]} />
    </>
  );
}
