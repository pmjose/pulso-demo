// Turns a chart's own data into factual findings for the AI brief.
// Every number in the brief comes from the data actually plotted.
import { nf } from './data.js';

const num = (v, u = '') => `${nf(v, Math.abs(v) < 100 && v % 1 ? 1 : 0)}${u}`;
const pct = (a, b) => (b ? ((a - b) / Math.abs(b)) * 100 : 0);
const signed = (v, d = 0) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${nf(Math.abs(v), d)}`;
const vals = (d) => d.map((v, i) => [v, i]).filter(([v]) => v != null);
const isFlat = (d) => { const v = d.filter((x) => x != null); return v.length > 1 && v.every((x) => Math.abs(x - v[0]) < 1e-9); };
const lab = (o, i) => (o.labels ? o.labels[i] : `#${i + 1}`);

function line(o) {
  const u = o.unit || '';
  const facts = [];
  const real = o.series.filter((s) => s.name && !isFlat(s.data) && !s.dash);
  const fc = o.series.find((s) => s.dash || s.lo);
  const limits = o.series.filter((s) => s.name && isFlat(s.data));
  for (const s of real.slice(0, 2)) {
    const v = vals(s.data); if (v.length < 2) continue;
    const [first, i0] = v[0], [last, i1] = v[v.length - 1];
    const [max, im] = v.reduce((a, b) => (b[0] > a[0] ? b : a));
    const ch = pct(last, first);
    const delta = u.trim() === '%' ? `${signed(last - first, 1)} p.p.` : `${signed(ch, Math.abs(ch) < 10 ? 1 : 0)}%`;
    facts.push(`<b>${s.name}</b> passou de ${num(first, u)} para ${num(last, u)} entre ${lab(o, i0)} e ${lab(o, i1)} (${delta}), com máximo de ${num(max, u)} em ${lab(o, im)}.`);
  }
  if (real.length === 1 && !fc && !limits.length) {
    const v = vals(real[0].data).map(([x]) => x);
    const avg = v.reduce((a, b) => a + b, 0) / v.length;
    const step = (v[v.length - 1] - v[0]) / (v.length - 1);
    facts.push(`Média de ${num(avg, u)} no período, com tendência de ${signed(step, Math.abs(step) < 10 ? 1 : 0)}${u} por período.`);
  }
  if (fc) {
    const v = vals(fc.data).slice(o.forecastFrom != null ? 1 : 0);
    if (v.length) {
      const [max, im] = v.reduce((a, b) => (b[0] > a[0] ? b : a));
      let band = '';
      if (fc.lo && fc.hi) { const k = v[v.length - 1][1]; band = ` O intervalo de confiança abre até ±${num((fc.hi[k] - fc.lo[k]) / 2, u)} no último ponto.`; }
      facts.push(`A <b>${fc.name.toLowerCase()}</b> atinge ${num(max, u)} em ${lab(o, im)}.${band}`);
    }
  }
  for (const t of limits.slice(0, 1)) {
    const level = t.data.find((x) => x != null);
    const pool = (fc ? [fc] : []).concat(real);
    let firstAbove = null, count = 0;
    pool.forEach((s) => s.data.forEach((v, i) => { if (v != null && v > level) { count++; if (firstAbove == null || i < firstAbove) firstAbove = i; } }));
    facts.push(count
      ? `${count} ${count === 1 ? 'ponto fica' : 'pontos ficam'} acima de <b>${t.name.toLowerCase()}</b>; o primeiro em ${lab(o, firstAbove)}.`
      : `Nenhum ponto ultrapassa <b>${t.name.toLowerCase()}</b>${/\d/.test(t.name) ? '' : ` (${num(level, u)})`}.`);
  }
  if (real.length >= 2 && !fc) {
    const [a, b] = real; const r = corr(a.data, b.data);
    if (r != null) facts.push(`As duas séries têm correlação de ${nf(r, 2)} no período.`);
  }
  return facts;
}

function columns(o) {
  const facts = [];
  const n = o.labels.length;
  const named = o.series.filter((s) => s.name);
  if (o.stacked) {
    const tot = o.labels.map((_, i) => o.series.reduce((a, s) => a + s.data[i], 0));
    const ch = pct(tot[n - 1], tot[0]);
    facts.push(`O total passou de ${num(tot[0])} em ${o.labels[0]} para ${num(tot[n - 1])} em ${o.labels[n - 1]} (${signed(ch, 1)}%).`);
    const sums = named.map((s) => [s.name, s.data.reduce((a, b) => a + b, 0)]).sort((a, b) => b[1] - a[1]);
    const all = sums.reduce((a, s) => a + s[1], 0);
    facts.push(`<b>${sums[0][0]}</b> representa ${nf(sums[0][1] / all * 100, 0)}% do total${sums[1] ? `, seguido de ${sums[1][0]} (${nf(sums[1][1] / all * 100, 0)}%)` : ''}.`);
    const [mx, im] = tot.map((v, i) => [v, i]).reduce((a, b) => (b[0] > a[0] ? b : a));
    facts.push(`O período mais alto é ${o.labels[im]}, com ${num(mx)}.`);
  } else {
    for (const s of (named.length ? named : o.series).slice(0, 2)) {
      const v = s.data.map((x, i) => [x, i]);
      const [mx, im] = v.reduce((a, b) => (b[0] > a[0] ? b : a));
      const [mn, iz] = v.reduce((a, b) => (b[0] < a[0] ? b : a));
      facts.push(`${s.name ? `<b>${s.name}</b>: ` : ''}máximo de ${num(mx)} em ${o.labels[im]} e mínimo de ${num(mn)} em ${o.labels[iz]} (${nf(mx / (mn || 1), 1)}×).`);
    }
    if (named.length >= 2) {
      const [a, b] = named;
      const sa = a.data.reduce((x, y) => x + y, 0), sb = b.data.reduce((x, y) => x + y, 0);
      facts.push(`No conjunto, ${a.name.toLowerCase()} soma ${num(sa)} e ${b.name.toLowerCase()} ${num(sb)} (diferença de ${signed(pct(sb, sa), 1)}%).`);
    } else if (n > 2) {
      const d = o.series[0].data; const ch = pct(d[n - 1], d[0]);
      facts.push(`Do primeiro ao último período a variação é de ${signed(ch, 1)}%.`);
    }
  }
  return facts;
}

function bars(o) {
  const u = o.unit || '';
  const it = [...o.items].sort((a, b) => b.value - a.value);
  const facts = [`<b>${it[0].label}</b> lidera com ${num(it[0].value, u)}; <b>${it[it.length - 1].label}</b> é o mais baixo, com ${num(it[it.length - 1].value, u)}.`];
  const tgt = o.items.find((x) => x.target)?.target;
  if (tgt) {
    const below = o.items.filter((x) => x.value < tgt).length;
    facts.push(`${below} de ${o.items.length} ficam abaixo da referência de ${num(tgt, u)}.`);
  }
  const total = it.reduce((a, x) => a + x.value, 0);
  if (it.length >= 3) facts.push(`Os 2 primeiros concentram ${nf((it[0].value + it[1].value) / total * 100, 0)}% do total.`);
  return facts;
}

function donut(o) {
  const it = [...o.items].sort((a, b) => b.value - a.value);
  const tot = it.reduce((a, x) => a + x.value, 0);
  const facts = [`<b>${it[0].label}</b> representa ${nf(it[0].value / tot * 100, 0)}% do total.`];
  if (it[1]) facts.push(`Com ${it[1].label} (${nf(it[1].value / tot * 100, 0)}%), as duas primeiras categorias somam ${nf((it[0].value + it[1].value) / tot * 100, 0)}%.`);
  if (it.length > 2) facts.push(`A categoria mais pequena, ${it[it.length - 1].label}, pesa ${nf(it[it.length - 1].value / tot * 100, 1)}%.`);
  return facts;
}

function heat(o) {
  let mx = [-Infinity], mn = [Infinity];
  o.matrix.forEach((r, ri) => r.forEach((v, ci) => { if (v > mx[0]) mx = [v, ri, ci]; if (v < mn[0]) mn = [v, ri, ci]; }));
  const rowAvg = o.matrix.map((r) => r.reduce((a, b) => a + b, 0) / r.length);
  const top = rowAvg.map((v, i) => [v, i]).reduce((a, b) => (b[0] > a[0] ? b : a));
  return [
    `O valor mais alto é ${num(mx[0])} ${o.unit || ''} em <b>${o.rows[mx[1]]} · ${o.cols[mx[2]]}</b>; o mais baixo, ${num(mn[0])}, em ${o.rows[mn[1]]} · ${o.cols[mn[2]]}.`,
    `${o.rows[top[1]]} tem a média mais alta da tabela (${num(top[0])}).`,
    `A diferença entre o máximo e o mínimo é de ${nf(mx[0] / (mn[0] || 1), 1)}×.`,
  ];
}

function scatter(o) {
  const x = o.points.map((p) => p[0]), y = o.points.map((p) => p[1]);
  const r = corr(x, y);
  const mx = x.reduce((a, b) => a + b, 0) / x.length, my = y.reduce((a, b) => a + b, 0) / y.length;
  const b = x.reduce((a, v, i) => a + (v - mx) * (y[i] - my), 0) / (x.reduce((a, v) => a + (v - mx) ** 2, 0) || 1);
  return [
    `${o.points.length} dias analisados: correlação de <b>${nf(r, 2)}</b> (R² ${nf(r * r * 100, 0)}%).`,
    `Por cada unidade a mais em ${(o.xLabel || 'x').toLowerCase()}, a métrica varia ${signed(b, Math.abs(b) < 1 ? 2 : 1)} em média.`,
  ];
}

function corr(a, b) {
  const p = a.map((v, i) => [v, b[i]]).filter(([x, y]) => x != null && y != null);
  if (p.length < 3) return null;
  const n = p.length, mx = p.reduce((s, q) => s + q[0], 0) / n, my = p.reduce((s, q) => s + q[1], 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const [x, y] of p) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

function waterfall(o) {
  const u = o.unit || '';
  const start = o.items.find((x) => x.total), end = [...o.items].reverse().find((x) => x.total);
  const deltas = o.items.filter((x) => !x.total);
  const up = [...deltas].sort((a, b) => b.value - a.value)[0], down = [...deltas].sort((a, b) => a.value - b.value)[0];
  const facts = [`De ${num(start.value, u)} (${start.label}) para ${num(end.value, u)} (${end.label}): ${signed(end.value - start.value, 1)}${u} (${signed(pct(end.value, start.value), 1)}%).`];
  facts.push(`O maior contributo positivo é <b>${up.label}</b> (${signed(up.value, 1)}${u}), ${nf(up.value / (end.value - start.value) * 100, 0)}% da variação.`);
  if (down.value < 0) facts.push(`<b>${down.label}</b> retira ${num(Math.abs(down.value), u)}.`);
  return facts;
}

const ANALYSERS = { line, columns, bars, donut, heat, scatter, waterfall };

// Returns findings plus the compact data summary that would ground a live model call.
export function analyse(type, o) {
  const f = ANALYSERS[type];
  if (!f) return null;
  let facts = [];
  try { facts = f(o); } catch { facts = []; }
  const points = type === 'bars' || type === 'donut' || type === 'waterfall' ? o.items.length
    : type === 'heat' ? o.matrix.length * o.matrix[0].length
      : type === 'scatter' ? o.points.length
        : o.series.reduce((a, s) => a + s.data.filter((v) => v != null).length, 0);
  const summary = type === 'bars' || type === 'donut' || type === 'waterfall'
    ? o.items.map((x) => `${x.label}=${num(x.value)}`).join('; ')
    : type === 'heat' ? `${o.rows.length}×${o.cols.length} células · máx ${Math.max(...o.matrix.flat())}`
      : type === 'scatter' ? `${o.points.length} pontos (x,y)`
        : o.series.filter((s) => s.name).map((s) => { const v = s.data.filter((x) => x != null); return `${s.name}: ${v.length} valores, ${num(v[0])} → ${num(v[v.length - 1])}`; }).join(' | ');
  return { facts, points, summary };
}
