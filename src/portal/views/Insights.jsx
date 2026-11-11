import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Chart, Kpi, useUnit } from '../ui.jsx';
import { C, GROUP, HOSPITALS, STATS, nf } from '../data.js';
import { ACUTE, ANOMALIES, BENCH, BRIDGE, BRIDGE_BY_PAYER, CMI, ROOT_CAUSES, benchValue } from '../analytics.js';

// ---------- Análise de variação ----------
export function Variance() {
  const navigate = useNavigate();
  const [kpi, setKpi] = useState('occ');
  const rc = ROOT_CAUSES[kpi];
  const delta = rc.to[1] - rc.from[1];
  const totals = BRIDGE_BY_PAYER.map(([p, v, pr, m]) => [p, v, pr, m, v + pr + m]);

  return (
    <>
      <div className="grid g4">
        <Kpi label="Receita acumulada 2026" value={`${nf(GROUP.ytdRevenue, 1)} M€`} delta={`▲ ${nf(58.6, 1)} M€ vs. jan-out 2025`} tone="up" />
        <Kpi label="Efeito volume" value="+30,9 M€" delta="mais episódios, incluindo novas unidades" tone="up" />
        <Kpi label="Efeito preço" value="+17,9 M€" delta="tabelas 2026 e revisão de convenções" tone="up" />
        <Kpi label="Efeito mix" value="+9,8 M€" delta="mais cirurgia e oncologia" tone="up" />
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Ponte da receita · jan-out 2025 → jan-out 2026" pill="Cortex · decomposição" pillClass="p-ai" sub="Milhões de euros. Cada barra mostra quanto cada fator explica da variação.">
          <Chart type="waterfall" ai={{ action: 'Proteger o efeito preço nas renegociações de 2027 e atacar as rejeições e cancelamentos, o único fator negativo.', impact: 'Reduzir rejeições e cancelamentos para metade acrescenta ≈ 3,3 M€ à receita do próximo ano.' }}
            opts={{ items: BRIDGE, unit: ' M€', min: 660 }} />
        </Card>
        <Card title="Variação por pagador" sub="M€ · volume, preço e mix">
          <table className="tabular">
            <thead><tr><th>Pagador</th><th>Volume</th><th>Preço</th><th>Mix</th><th>Total</th></tr></thead>
            <tbody>{totals.map(([p, v, pr, m, t]) => (
              <tr key={p}><td><b>{p.split(' (')[0]}</b></td><td>{nf(v, 1)}</td><td style={{ color: pr < 0 ? C.coral : 'inherit' }}>{nf(pr, 1)}</td><td>{nf(m, 1)}</td><td><b>{nf(t, 1)}</b></td></tr>))}
              <tr><td><b>Total</b></td><td><b>30,9</b></td><td><b>17,9</b></td><td><b>9,8</b></td><td><b>58,6</b></td></tr></tbody>
          </table>
          <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>O volume inclui novas unidades (+6,1) e perdas por rejeições e cancelamentos (−6,6), detalhadas na ponte.</p>
        </Card>
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Porque mudou este indicador?" pill="Análise de contribuição" pillClass="p-ai" sub="Escolha um indicador: a IA decompõe a variação pelos fatores que a explicam">
          <div className="switch" style={{ marginBottom: 12 }}>
            {Object.entries(ROOT_CAUSES).map(([k, v]) => <button key={k} className={k === kpi ? 'on' : ''} onClick={() => setKpi(k)}>{v.name}</button>)}
          </div>
          <div className="rc-head">
            <div><small>{rc.from[0]}</small><b>{nf(rc.from[1], rc.from[1] % 1 ? 1 : 0)}{rc.unit === ' p.p.' ? '%' : rc.unit}</b></div>
            <span>→</span>
            <div><small>{rc.to[0]}</small><b>{nf(rc.to[1], rc.to[1] % 1 ? 1 : 0)}{rc.unit === ' p.p.' ? '%' : rc.unit}</b></div>
            <div className={`rc-delta ${(kpi === 'dso' || kpi === 'alos' || kpi === 'occ') ? (delta < 0 ? 'up' : 'down') : (delta > 0 ? 'up' : 'down')}`}>{delta > 0 ? '+' : ''}{nf(delta, Math.abs(delta) < 10 && delta % 1 ? 1 : 0)}{rc.unit}</div>
          </div>
          <Chart type="waterfall" ai={{ action: `Atuar primeiro sobre "${rc.drivers[0][0].toLowerCase()}", o fator que mais explica a variação de ${rc.name.toLowerCase()}.`, impact: `Este fator explica ${nf(Math.abs(rc.drivers[0][1] / delta) * 100, 0)}% da variação observada.` }}
            opts={{ unit: rc.unit, min: Math.floor(Math.min(rc.from[1], rc.to[1]) * .97), height: 220, items: [
              { label: rc.from[0], value: rc.from[1], total: true },
              ...rc.drivers.map(([l, v]) => ({ label: l.length > 22 ? l.slice(0, 21) + '…' : l, value: v })),
              { label: rc.to[0], value: rc.to[1], total: true },
            ], upColor: kpi === 'nps' ? C.ok : C.coral, downColor: kpi === 'nps' ? C.coral : C.ok }} />
          <div className="legend">{rc.drivers.map(([l, v]) => <span key={l}>{l}: <b>{v > 0 ? '+' : ''}{nf(v, Math.abs(v) < 1 ? 2 : 1)}{rc.unit}</b></span>)}</div>
        </Card>
        <Card title="Anomalias detetadas hoje" pill="ML · deteção automática" pillClass="p-ml" sub="Desvios face ao valor esperado pelo modelo, ordenados por gravidade">
          {ANOMALIES.map(([t, k, h, d, c, sev, to]) => (
            <button key={t + k} className="anom" onClick={() => navigate(`/portal/${to}`)}>
              <span className={`pill ${c}`}>{sev}</span>
              <div><b>{k}</b> · {h}<br /><small>{d} · {t}</small></div>
              <span className="go">›</span>
            </button>
          ))}
        </Card>
      </div>
    </>
  );
}

// ---------- Benchmarking ----------
export function Benchmark() {
  const { setUnit } = useUnit();
  const [key, setKey] = useState('alosAdj');
  const [, label, unit, lowerBetter, ref] = BENCH.find((b) => b[0] === key);
  const rows = ACUTE.map((h) => ({ h, v: benchValue(h, key) })).sort((a, b) => (lowerBetter ? a.v - b.v : b.v - a.v));
  const best = rows[0].v;
  const groupAvg = rows.reduce((a, r) => a + r.v * r.h.beds, 0) / rows.reduce((a, r) => a + r.h.beds, 0);
  const dec = Math.abs(best) < 10 ? (key === 'moe' ? 2 : 1) : 0;
  // Potential if every hospital reached the best hospital in length of stay.
  const bedsFreed = Math.round(ACUTE.reduce((a, h) => { const s = STATS[h.name]; const target = best * CMI[h.name]; return a + Math.max(0, (s.alos - target) / s.alos) * h.beds * s.occ / 100; }, 0));
  const worse = rows.filter((r) => (lowerBetter ? r.v > ref : r.v < ref)).length;

  return (
    <>
      <div className="grid g4">
        <Kpi label="Hospitais comparados" value={ACUTE.length} delta="agudos · Hospital do Mar excluído" />
        <Kpi label="Melhor hospital" value={rows[0].h.short} delta={`${nf(best, dec)}${unit} em ${label.toLowerCase()}`} tone="up" />
        <Kpi label="Média do grupo" value={`${nf(groupAvg, dec)}${unit}`} delta={`referência nacional ${nf(ref, dec)}${unit}`} tone={(lowerBetter ? groupAvg <= ref : groupAvg >= ref) ? 'up' : 'down'} />
        <Kpi label="Pior que a referência nacional" value={worse} delta={`de ${ACUTE.length} hospitais`} tone={worse ? 'down' : 'up'} />
      </div>

      <Card style={{ marginTop: 16 }} title="Comparação entre hospitais" pill="Ajustado ao case-mix" pillClass="p-teal" sub="Escolha o indicador. Linha: referência nacional. Clique numa linha da tabela para filtrar o portal.">
        <div className="switch" style={{ marginBottom: 14 }}>
          {BENCH.map(([k, l]) => <button key={k} className={k === key ? 'on' : ''} onClick={() => setKey(k)}>{l}</button>)}
        </div>
        <div className="grid g2">
          <Chart type="bars" ai={{ action: `Juntar ${rows[rows.length - 1].h.short} e ${rows[0].h.short} numa sessão de partilha de práticas sobre ${label.toLowerCase()}.`, impact: key === 'alosAdj' ? `Se todos os hospitais igualassem o melhor, libertavam-se ≈ ${bedsFreed} camas por dia no grupo.` : `Levar os ${worse} hospitais abaixo da referência nacional à média do grupo melhora o indicador do grupo em ≈ ${nf(Math.abs(groupAvg - ref) / 2, 1)}${unit}.` }}
            opts={{ unit, items: rows.map((r) => ({ label: r.h.short, value: +r.v.toFixed(dec), target: ref, color: (lowerBetter ? r.v <= ref : r.v >= ref) ? C.teal : C.coral })) }} />
          <table className="tabular">
            <thead><tr><th>#</th><th>Hospital</th><th>Valor</th><th>vs. grupo</th><th>Índice case-mix</th></tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={r.h.name} style={{ cursor: 'pointer' }} onClick={() => setUnit(r.h.name)}>
                <td>{i + 1}</td><td><b>{r.h.short}</b>{r.h.isNew && <span className="new-tag">NOVA</span>}</td><td>{nf(r.v, dec)}{unit}</td>
                <td><span className={`pill ${(lowerBetter ? r.v <= groupAvg : r.v >= groupAvg) ? 'p-ok' : 'p-warn'}`}>{r.v >= groupAvg ? '+' : '−'}{nf(Math.abs(r.v - groupAvg), dec)}{unit}</span></td>
                <td>{nf(CMI[r.h.name], 2)}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }} title="Mapa de desempenho" sub="Cada hospital face à média do grupo em todos os indicadores · verde melhor, vermelho pior">
        <div className="bmap" style={{ gridTemplateColumns: `150px repeat(${BENCH.length}, 1fr)` }}>
          <span />{BENCH.map(([k, l]) => <span key={k} className="hc">{l}</span>)}
          {ACUTE.map((h) => (
            <span key={h.name} style={{ display: 'contents' }}>
              <span className="hr">{h.short}</span>
              {BENCH.map(([k, , u, lb]) => {
                const v = benchValue(h, k), avg = ACUTE.reduce((a, x) => a + benchValue(x, k), 0) / ACUTE.length;
                const z = Math.max(-1, Math.min(1, ((lb ? avg - v : v - avg) / (Math.abs(avg) || 1)) * 4));
                return <span key={k} className="cell" style={{ background: z >= 0 ? `rgba(31,157,107,${.12 + z * .6})` : `rgba(228,87,46,${.12 - z * .6})` }} title={`${h.short} · ${nf(v, Math.abs(v) < 10 ? 1 : 0)}${u}`}>{nf(v, Math.abs(v) < 10 ? (k === 'moe' ? 2 : 1) : 0)}</span>;
              })}
            </span>
          ))}
        </div>
      </Card>
    </>
  );
}
