// Luz IA copilot: floating button and right-hand panel with predefined,
// page-aware questions. Answers stream like a live model, with reasoning and charts.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chart, CopilotCtx } from './ui.jsx';
import { analyse } from './aiBrief.js';
import { handcrafted } from './copilotContent.js';

const strip = (h) => String(h).replace(/<[^>]+>/g, '');
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ');
const words = (t) => norm(t).split(/\s+/).filter((w) => w.length > 3);

export function CopilotProvider({ slug, title, unit, children }) {
  const [open, setOpen] = useState(false);
  const [tabS, setTabS] = useState({});
  const [subjS, setSubjS] = useState({});
  const [ver, setVer] = useState(0);
  const charts = useRef(new Map());
  const slugRef = useRef(slug);
  slugRef.current = slug;
  const timer = useRef(0);
  const bump = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setVer((v) => v + 1), 250); };

  const api = useMemo(() => ({
    registerChart: (id, v) => { charts.current.set(id, v); bump(); },
    unregisterChart: (id) => { charts.current.delete(id); bump(); },
    // Tagged with the page so a stale tab never leaks into the next page.
    setTab: (t) => setTabS({ slug: slugRef.current, t }),
    setSubject: (s) => setSubjS({ slug: slugRef.current, s }),
  }), []);

  const tab = tabS.slug === slug ? tabS.t : null;
  const subject = subjS.slug === slug ? subjS.s : null;
  const ctx = { slug, title, tab, subject, unit };

  return (
    <CopilotCtx.Provider value={api}>
      {children}
      {!open && (
        <button className="cp-fab" onClick={() => setOpen(true)} aria-label="Abrir Luz IA">
          <span className="cp-spark">✦</span>Perguntar à Luz IA
        </button>
      )}
      <div role="complementary" className={`cp-panel${open ? ' on' : ''}`} aria-hidden={!open} aria-label="Luz IA · Copiloto">
        {open && <Panel ctx={ctx} charts={charts} ver={ver} onClose={() => setOpen(false)} />}
      </div>
    </CopilotCtx.Provider>
  );
}

function readKpis() {
  return [...document.querySelectorAll('.view.on .kpi')].slice(0, 8).map((k) => ({
    label: k.querySelector('.lbl')?.childNodes[0]?.textContent?.trim() || '',
    value: k.querySelector('.v')?.textContent?.trim() || '',
    delta: k.querySelector('.d')?.textContent?.trim() || '',
    tone: ['up', 'down', 'bad', 'good', 'warn'].find((t) => k.querySelector('.d')?.classList.contains(t)) || 'neu',
  })).filter((k) => k.label && k.value);
}

// Generic questions built from what is actually on the page.
function genericQs(ctx, kpis, chartList) {
  const qs = [];
  const where = ctx.tab ? `${ctx.title} · ${ctx.tab}` : ctx.title;
  if (kpis.length) {
    const bad = kpis.filter((k) => k.tone === 'down' || k.tone === 'bad' || k.tone === 'warn');
    qs.push({ q: 'Resume esta página', a: {
      steps: [`Ler os ${kpis.length} indicadores de «${where}»`, ctx.unit ? `Aplicar o filtro: ${ctx.unit}` : 'Usar o âmbito: todo o grupo', 'Comparar com o período anterior e destacar desvios'],
      html: `Em <b>${where}</b>${ctx.unit ? ` (${ctx.unit})` : ''}, os indicadores principais são:<br>${kpis.slice(0, 5).map((k) => `• <b>${k.label}</b>: ${k.value}${k.delta ? ` (${k.delta})` : ''}`).join('<br>')}${bad.length ? `<br><br>O que merece atenção: <b>${bad[0].label.toLowerCase()}</b> (${bad[0].delta}).` : '<br><br>Nenhum indicador está fora do intervalo esperado.'}`,
      sources: ['Semantic views do portal', 'Dicionário de dados'],
      follow: chartList[0] ? [`Explica o gráfico «${chartList[0].title}»`] : [],
    } });
  }
  chartList.slice(0, 2).forEach((c) => {
    const r = analyse(c.type, c.opts);
    qs.push({ q: `Explica o gráfico «${c.title}»`, a: {
      steps: [`Ler os dados do gráfico (${r ? r.points : 'vários'} pontos)`, 'Calcular tendência, máximos e desvios', c.ai?.action ? 'Ligar a análise à ação recomendada' : 'Resumir o padrão principal'],
      html: `${(r?.facts || []).slice(0, 3).map((f) => '• ' + f).join('<br>') || 'O gráfico não mostra variações relevantes.'}${c.ai?.action ? `<br><br><b>O que recomendo:</b> ${c.ai.action}` : ''}${c.ai?.impact ? `<br><b>Impacto esperado:</b> ${c.ai.impact}` : ''}`,
      chart: { type: c.type, opts: c.type === 'heat' ? { ...c.opts, cols: c.opts.cols.slice(0, 5), matrix: c.opts.matrix.map((r) => r.slice(0, 5)) } : { ...c.opts, height: Math.min(c.opts.height || 200, 200) } },
      sources: [where, 'Snowflake Cortex · análise do gráfico'],
    } });
  });
  const acts = chartList.filter((c) => c.ai?.action).slice(0, 3);
  if (acts.length) qs.push({ q: 'Por onde começo?', a: {
    steps: ['Juntar as ações recomendadas nos gráficos desta página', 'Ordenar por impacto e esforço'],
    html: `Nesta página, começaria por:<br>${acts.map((c, i) => `${i + 1}. ${c.ai.action} <span class="cp-from">(${c.title})</span>`).join('<br>')}`,
    sources: [where],
  } });
  return qs;
}

function Panel({ ctx, charts, ver, onClose }) {
  const [kpis, setKpis] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const body = useRef(null);
  const key = `${ctx.slug}|${ctx.tab}|${ctx.subject?.person?.id}|${ctx.unit}`;

  // New context, new conversation.
  useEffect(() => { setMsgs([]); setBusy(false); }, [key]);
  useEffect(() => { const t = setTimeout(() => setKpis(readKpis()), 300); return () => clearTimeout(t); }, [key, ver]);

  const chartList = useMemo(() => {
    const seen = new Set();
    return [...charts.current.values()].filter((c) => c.title && !seen.has(c.title) && seen.add(c.title));
  }, [ver, key]);
  const qs = useMemo(() => {
    const hand = handcrafted(ctx);
    const gen = genericQs(ctx, kpis, chartList).filter((g) => !hand.some((h) => h.q === g.q));
    return [...hand, ...gen];
  }, [key, kpis, chartList]);

  const ask = useCallback((q) => {
    if (busy || !q.trim()) return;
    let hit = qs.find((x) => x.q === q);
    if (!hit) {
      const w = words(q);
      const scored = qs.map((x) => [x, words(x.q).filter((t) => w.includes(t)).length]).sort((a, b) => b[1] - a[1]);
      if (scored[0] && scored[0][1] >= Math.min(2, words(scored[0][0].q).length)) hit = scored[0][0];
    }
    const a = hit ? hit.a : {
      steps: ['Procurar a pergunta nas respostas disponíveis para esta página', 'Sem correspondência suficiente'],
      html: 'Nesta demonstração só tenho respostas preparadas para algumas perguntas sobre esta página, por isso não consigo responder a essa com rigor. Experimente uma destas:',
      sources: [], follow: qs.slice(0, 4).map((x) => x.q), fallback: true,
    };
    const ans = a.fallback ? a : { ...a, follow: (a.follow || []).filter((f) => f !== q && qs.some((x) => x.q === f)) };
    setMsgs((m) => [...m, { role: 'user', text: q }, { role: 'ai', a: ans, id: Date.now() }]);
    setText('');
    setBusy(true);
  }, [busy, qs]);

  useEffect(() => { const el = body.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs]);

  const where = ctx.subject?.person ? `${ctx.title} · ${ctx.subject.person.name}` : ctx.tab ? `${ctx.title} · ${ctx.tab}` : ctx.title;
  return (
    <>
      <div className="cp-head">
        <div className="cp-id"><span className="cp-logo">✦</span><div><b>Luz IA</b><small>Copiloto · Snowflake Cortex</small></div></div>
        <div className="cp-tools">
          <button onClick={() => setMsgs([])} title="Nova conversa" aria-label="Nova conversa">↺</button>
          <button onClick={onClose} title="Fechar" aria-label="Fechar">×</button>
        </div>
      </div>
      <div className="cp-ctx"><span className="cp-dot" />A ver: <b>{where}</b>{ctx.unit && <> · {ctx.unit}</>}</div>
      <div className="cp-harbor" role="note"><b>Demo limitada</b> · respostas pré-definidas e dados fictícios. Para uma demonstração completa, contacte a Snowflake.</div>

      <div className="cp-body" ref={body}>
        <div className="cp-msg ai">
          <div className="cp-av">✦</div>
          <div className="cp-bubble">
            <p>Olá! Estou a acompanhar <b>{where}</b>. Posso resumir os indicadores, explicar os gráficos ou sugerir próximos passos.</p>
            <div className="cp-chips">{qs.slice(0, 5).map((x) => <button key={x.q} disabled={busy} onClick={() => ask(x.q)}>{x.q}</button>)}</div>
          </div>
        </div>
        {msgs.map((m, i) => m.role === 'user'
          ? <div key={i} className="cp-msg user"><div className="cp-bubble">{m.text}</div></div>
          : <Answer key={m.id} a={m.a} onDone={() => setBusy(false)} onAsk={ask} busy={busy} scroll={() => { const el = body.current; if (el) el.scrollTop = el.scrollHeight; }} />)}
      </div>

      <form className="cp-input" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder={busy ? 'A responder…' : 'Pergunte sobre esta página…'} disabled={busy} aria-label="Pergunta" />
        <button disabled={busy || !text.trim()} aria-label="Enviar">↑</button>
      </form>
      <div className="cp-foot">A Luz IA pode cometer erros. Confirme as informações importantes.</div>
    </>
  );
}

// Tokenise HTML so tags arrive whole while words stream.
const tokens = (html) => html.split(/(<[^>]+>|\s+)/).filter(Boolean);

function Answer({ a, onDone, onAsk, busy, scroll }) {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState('think');
  const [n, setN] = useState(0);
  const [showSteps, setShowSteps] = useState(false);
  const [vote, setVote] = useState(0);
  const [copied, setCopied] = useState(false);
  const toks = useMemo(() => tokens(a.html), [a]);
  const t0 = useRef(Date.now());
  const secs = useRef(0);

  useEffect(() => {
    if (phase !== 'think') return undefined;
    if (step >= a.steps.length) { secs.current = Math.max(2, Math.round((Date.now() - t0.current) / 1000)); setPhase('write'); return undefined; }
    const t = setTimeout(() => setStep((s) => s + 1), 700 + (step * 137) % 500);
    return () => clearTimeout(t);
  }, [phase, step]);

  useEffect(() => {
    if (phase !== 'write') return undefined;
    if (n >= toks.length) { setPhase('done'); onDone(); return undefined; }
    const t = setTimeout(() => setN((x) => Math.min(toks.length, x + 2 + (x % 3))), 28 + (n % 5) * 9);
    return () => clearTimeout(t);
  }, [phase, n]);

  useEffect(scroll, [step, n, phase]);

  return (
    <div className="cp-msg ai">
      <div className="cp-av">✦</div>
      <div className="cp-bubble">
        {phase === 'think' ? (
          <div className="cp-think">
            <div className="cp-think-h"><span className="cp-spin" />A pensar…</div>
            {a.steps.slice(0, step + 1).map((s, i) => <div key={i} className={`cp-step${i < step ? ' ok' : ''}`}>{i < step ? '✓' : '•'} {s}</div>)}
          </div>
        ) : (
          <button className="cp-thought" onClick={() => setShowSteps((v) => !v)}>Pensou durante {secs.current} s {showSteps ? '▴' : '▾'}</button>
        )}
        {phase !== 'think' && showSteps && <div className="cp-think done">{a.steps.map((s, i) => <div key={i} className="cp-step ok">✓ {s}</div>)}</div>}
        {phase !== 'think' && <p className="cp-text" dangerouslySetInnerHTML={{ __html: toks.slice(0, n).join('') + (phase === 'write' ? '<span class="cp-caret"></span>' : '') }} />}
        {phase === 'done' && a.chart && <div className="cp-chart"><Chart inCopilot type={a.chart.type} opts={{ height: 190, ...a.chart.opts }} /></div>}
        {phase === 'done' && a.sources?.length > 0 && <div className="cp-src">{a.sources.map((s) => <span key={s}>⛁ {s}</span>)}</div>}
        {phase === 'done' && !a.fallback && (
          <div className="cp-acts">
            <button className={vote === 1 ? 'on' : ''} onClick={() => setVote(1)} aria-label="Útil">👍</button>
            <button className={vote === -1 ? 'on' : ''} onClick={() => setVote(-1)} aria-label="Pouco útil">👎</button>
            <button onClick={() => { navigator.clipboard?.writeText(strip(a.html.replace(/<br>/g, '\n'))); setCopied(true); }}>{copied ? 'Copiado' : 'Copiar'}</button>
          </div>
        )}
        {phase === 'done' && a.follow?.length > 0 && <div className="cp-chips">{a.follow.map((q) => <button key={q} disabled={busy} onClick={() => onAsk(q)}>{q}</button>)}</div>}
      </div>
    </div>
  );
}
