// Lightweight SVG charts for the portal. No dependencies.
/* eslint-disable */
  const NS = 'http://www.w3.org/2000/svg';
  const fmt = (v) => typeof v === 'number' ? v.toLocaleString('pt-PT', { maximumFractionDigits: 1 }) : v;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function niceMax(v) {
    const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
    const n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  }

  function line(el, o) {
    const W = 640, H = o.height || 240, P = { l: 44, r: 14, t: 14, b: 28 };
    const all = o.series.flatMap((s) => s.data.concat(s.hi || []));
    const min = o.min != null ? o.min : 0;
    const max = o.max || niceMax(Math.max(...all.filter((v) => v != null)));
    const n = o.labels.length;
    const X = (i) => P.l + (i * (W - P.l - P.r)) / (n - 1);
    const Y = (v) => H - P.b - ((v - min) * (H - P.t - P.b)) / (max - min);
    let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(o.title || 'Gráfico')}">`;
    for (let k = 0; k <= 4; k++) {
      const v = min + ((max - min) * k) / 4, y = Y(v);
      s += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}" class="grid"/><text x="${P.l - 8}" y="${y + 4}" class="ax" text-anchor="end">${fmt(v)}${o.unit || ''}</text>`;
    }
    const step = Math.ceil(n / 8);
    o.labels.forEach((l, i) => { if (i % step === 0 || (i === n - 1 && i % step > step / 2)) s += `<text x="${X(i)}" y="${H - 8}" class="ax" text-anchor="middle">${esc(l)}</text>`; });
    if (o.forecastFrom != null) {
      const x0 = X(o.forecastFrom);
      s += `<rect x="${x0}" y="${P.t}" width="${W - P.r - x0}" height="${H - P.t - P.b}" class="fc-zone"/><text x="${x0 + 6}" y="${P.t + 12}" class="ax fc-label">Previsão</text>`;
    }
    o.series.forEach((se, si) => {
      if (se.lo && se.hi) {
        const pts = se.hi.map((v, i) => v == null ? null : `${X(i)},${Y(v)}`).filter(Boolean);
        const back = se.lo.map((v, i) => v == null ? null : `${X(i)},${Y(v)}`).filter(Boolean).reverse();
        s += `<polygon points="${pts.concat(back).join(' ')}" fill="${se.color}" opacity=".14"/>`;
      }
      let d = '', started = false;
      se.data.forEach((v, i) => { if (v == null) { started = false; return; } d += (started ? 'L' : 'M') + X(i) + ' ' + Y(v) + ' '; started = true; });
      if (se.area) {
        const idx = se.data.map((v, i) => v == null ? -1 : i).filter((i) => i >= 0);
        s += `<path d="${d} L${X(idx[idx.length - 1])} ${H - P.b} L${X(idx[0])} ${H - P.b} Z" fill="url(#gr${si}${el.id})" />`;
        s += `<defs><linearGradient id="gr${si}${el.id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${se.color}" stop-opacity=".28"/><stop offset="1" stop-color="${se.color}" stop-opacity="0"/></linearGradient></defs>`;
      }
      s += `<path d="${d}" fill="none" stroke="${se.color}" stroke-width="${se.width || 2.4}" ${se.dash ? 'stroke-dasharray="5 5"' : ''} stroke-linejoin="round" stroke-linecap="round" class="draw"/>`;
      se.data.forEach((v, i) => { if (v != null) s += `<circle cx="${X(i)}" cy="${Y(v)}" r="7" class="hit"><title>${esc(o.labels[i])} · ${esc(se.name)}: ${fmt(v)}${o.unit || ''}</title></circle>`; });
    });
    s += '</svg>';
    s += legend(o.series);
    el.innerHTML = s;
  }

  function legend(items) {
    return `<div class="legend">${items.filter((i) => i.name).map((i) => `<span><i style="background:${i.color}"></i>${esc(i.name)}</span>`).join('')}</div>`;
  }

  function bars(el, o) {
    const items = o.items, max = o.max || niceMax(Math.max(...items.map((i) => Math.abs(i.value))));
    el.innerHTML = `<div class="hbars">${items.map((i) => `
      <div class="hbar"><span class="lbl">${esc(i.label)}</span>
        <span class="track"><span class="fill" style="width:${(Math.abs(i.value) / max) * 100}%;background:${i.color || 'var(--teal)'}"></span>${i.target ? `<span class="target" style="left:${(i.target / max) * 100}%" title="Objetivo ${fmt(i.target)}"></span>` : ''}</span>
        <span class="val">${fmt(i.value)}${o.unit || ''}</span></div>`).join('')}</div>`;
  }

  function columns(el, o) {
    const W = 640, H = o.height || 220, P = { l: 40, r: 10, t: 10, b: 28 };
    const n = o.labels.length;
    const stacked = o.stacked;
    const totals = o.labels.map((_, i) => stacked ? o.series.reduce((a, s) => a + s.data[i], 0) : Math.max(...o.series.map((s) => s.data[i])));
    const max = niceMax(Math.max(...totals));
    const bw = (W - P.l - P.r) / n;
    const Y = (v) => ((H - P.t - P.b) * v) / max;
    let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(o.title || 'Gráfico')}">`;
    for (let k = 0; k <= 4; k++) { const v = (max * k) / 4, y = H - P.b - Y(v); s += `<line x1="${P.l}" x2="${W - P.r}" y1="${y}" y2="${y}" class="grid"/><text x="${P.l - 6}" y="${y + 4}" class="ax" text-anchor="end">${fmt(v)}</text>`; }
    o.labels.forEach((l, i) => {
      const x = P.l + i * bw;
      let base = H - P.b;
      o.series.forEach((se, si) => {
        const v = se.data[i], h = Y(v);
        if (stacked) { s += `<rect x="${x + bw * .18}" y="${base - h}" width="${bw * .64}" height="${h}" fill="${se.color}" rx="3"><title>${esc(l)} · ${esc(se.name)}: ${fmt(v)}</title></rect>`; base -= h; }
        else { const w = (bw * .7) / o.series.length; s += `<rect x="${x + bw * .15 + si * w}" y="${H - P.b - h}" width="${w - 2}" height="${h}" fill="${se.color}" rx="3"><title>${esc(l)} · ${esc(se.name)}: ${fmt(v)}</title></rect>`; }
      });
      s += `<text x="${x + bw / 2}" y="${H - 8}" class="ax" text-anchor="middle">${esc(l)}</text>`;
    });
    s += '</svg>' + legend(o.series);
    el.innerHTML = s;
  }

  function donut(el, o) {
    const total = o.items.reduce((a, i) => a + i.value, 0);
    const R = 70, r = 46, C = 90;
    let a0 = -Math.PI / 2, s = `<svg viewBox="0 0 180 180" class="donut" role="img" aria-label="${esc(o.title || 'Distribuição')}">`;
    o.items.forEach((i) => {
      const a1 = a0 + (i.value / total) * Math.PI * 2, big = a1 - a0 > Math.PI ? 1 : 0;
      const p = (a, rad) => `${C + rad * Math.cos(a)} ${C + rad * Math.sin(a)}`;
      s += `<path d="M${p(a0, R)} A${R} ${R} 0 ${big} 1 ${p(a1, R)} L${p(a1, r)} A${r} ${r} 0 ${big} 0 ${p(a0, r)} Z" fill="${i.color}"><title>${esc(i.label)}: ${fmt(i.value)}${o.unit || ''} (${Math.round((i.value / total) * 100)}%)</title></path>`;
      a0 = a1;
    });
    s += `<text x="90" y="86" text-anchor="middle" class="d-big">${esc(o.center || fmt(total))}</text><text x="90" y="106" text-anchor="middle" class="d-sm">${esc(o.centerLabel || '')}</text></svg>`;
    s += `<div class="dlegend">${o.items.map((i) => `<div><i style="background:${i.color}"></i><span>${esc(i.label)}</span><b>${Math.round((i.value / total) * 100)}%</b></div>`).join('')}</div>`;
    el.innerHTML = `<div class="donut-wrap">${s}</div>`;
  }

  function heat(el, o) {
    const max = Math.max(...o.matrix.flat());
    let s = `<div class="heat" style="grid-template-columns:44px repeat(${o.cols.length},1fr)"><span></span>`;
    o.cols.forEach((c, i) => s += `<span class="hc">${i % (o.every || 3) === 0 ? esc(c) : ''}</span>`);
    o.rows.forEach((r, ri) => {
      s += `<span class="hr">${esc(r)}</span>`;
      o.matrix[ri].forEach((v, ci) => { const a = v / max; s += `<span class="cell" style="background:rgba(0,133,127,${.07 + a * .9})" title="${esc(r)} ${esc(o.cols[ci])}: ${fmt(v)} ${esc(o.unit || '')}"></span>`; });
    });
    el.innerHTML = s + '</div>';
  }

  function spark(el, data, color) {
    const W = 120, H = 34, max = Math.max(...data), min = Math.min(...data);
    const pts = data.map((v, i) => `${(i * W) / (data.length - 1)},${H - 3 - ((v - min) / (max - min || 1)) * (H - 6)}`).join(' ');
    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" class="spark"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round"/></svg>`;
  }

  function gauge(el, v, color, label) {
    const a = Math.PI * (1 - v), x = 60 + 48 * Math.cos(a), y = 60 - 48 * Math.sin(a);
    el.innerHTML = `<svg viewBox="0 0 120 72" class="gauge"><path d="M12 60 A48 48 0 0 1 108 60" fill="none" stroke="var(--line)" stroke-width="10" stroke-linecap="round"/>
      <path d="M12 60 A48 48 0 0 1 ${x} ${y}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round"/>
      <text x="60" y="56" text-anchor="middle" class="g-big">${Math.round(v * 100)}%</text></svg><div class="g-lbl">${esc(label)}</div>`;
  }

  function scatter(el, o) {
    const W = 640, H = o.height || 260, P = { l: 46, r: 14, t: 12, b: 34 };
    const xs = o.points.map((p) => p[0]), ys = o.points.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const X = (v) => P.l + ((v - x0) / (x1 - x0 || 1)) * (W - P.l - P.r);
    const Y = (v) => H - P.b - ((v - y0) / (y1 - y0 || 1)) * (H - P.t - P.b);
    let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(o.title || 'Dispersão')}">`;
    for (let k = 0; k <= 4; k++) {
      const vy = y0 + ((y1 - y0) * k) / 4, vx = x0 + ((x1 - x0) * k) / 4;
      s += `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(vy)}" y2="${Y(vy)}" class="grid"/><text x="${P.l - 8}" y="${Y(vy) + 4}" class="ax" text-anchor="end">${fmt(Math.round(vy))}</text>`;
      s += `<text x="${X(vx)}" y="${H - 14}" class="ax" text-anchor="middle">${fmt(+vx.toFixed(1))}</text>`;
    }
    s += `<text x="${W - P.r}" y="${H - 2}" class="ax" text-anchor="end">${esc(o.xLabel || '')}</text>`;
    o.points.forEach((p) => { s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3.6" fill="${o.color}" opacity=".55"><title>${fmt(+p[0].toFixed(1))} → ${fmt(Math.round(p[1]))}</title></circle>`; });
    // least-squares trend line
    const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    const b = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / (xs.reduce((a, x) => a + (x - mx) ** 2, 0) || 1);
    s += `<line x1="${X(x0)}" y1="${Y(my + b * (x0 - mx))}" x2="${X(x1)}" y2="${Y(my + b * (x1 - mx))}" stroke="${o.trend || '#14262e'}" stroke-width="2" stroke-dasharray="6 4"/>`;
    el.innerHTML = s + '</svg>';
  }

  // Bridge chart: items are { label, value, total? }. Totals are drawn from zero, deltas float.
  function waterfall(el, o) {
    const W = 640, H = o.height || 240, P = { l: 46, r: 10, t: 22, b: 30 };
    let run = 0; const bars = o.items.map((it) => {
      if (it.total) { run = it.value; return { ...it, y0: 0, y1: it.value }; }
      const y0 = run; run += it.value; return { ...it, y0, y1: run };
    });
    const lo = o.min != null ? o.min : 0;
    const hi = niceMax(Math.max(...bars.map((b) => Math.max(b.y0, b.y1))));
    const Y = (v) => H - P.b - ((v - lo) * (H - P.t - P.b)) / (hi - lo);
    const bw = (W - P.l - P.r) / bars.length;
    let s = `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(o.title || 'Ponte')}">`;
    for (let k = 0; k <= 4; k++) { const v = lo + ((hi - lo) * k) / 4; s += `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${P.l - 6}" y="${Y(v) + 4}" class="ax" text-anchor="end">${fmt(v)}</text>`; }
    bars.forEach((b, i) => {
      const x = P.l + i * bw + bw * .16, w = bw * .68, top = Y(Math.max(b.y0, b.y1)), h = Math.max(1.5, Math.abs(Y(b.y0) - Y(b.y1)));
      const c = b.total ? (o.totalColor || '#004f5a') : b.value >= 0 ? (o.upColor || '#1f9d6b') : (o.downColor || '#e4572e');
      s += `<rect x="${x}" y="${top}" width="${w}" height="${h}" rx="3" fill="${c}"><title>${esc(b.label)}: ${b.total ? '' : b.value > 0 ? '+' : ''}${fmt(b.value)}${o.unit || ''}</title></rect>`;
      s += `<text x="${x + w / 2}" y="${top - 5}" class="ax" text-anchor="middle" style="font-weight:700;fill:#14262e">${b.total ? '' : b.value > 0 ? '+' : ''}${fmt(b.value)}</text>`;
      if (i < bars.length - 1) s += `<line x1="${x + w}" x2="${x + bw}" y1="${Y(b.y1)}" y2="${Y(b.y1)}" stroke="#9fb0b6" stroke-dasharray="3 3"/>`;
      s += `<text x="${x + w / 2}" y="${H - 10}" class="ax" text-anchor="middle">${esc(b.label)}</text>`;
    });
    el.innerHTML = s + '</svg>';
  }

export const Ch = { line, bars, columns, donut, heat, spark, gauge, scatter, waterfall, fmt };
