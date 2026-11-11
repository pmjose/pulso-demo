import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Ch } from '../lib/charts.js';
import { HOSPITALS, groupStats, nf } from './data.js';
import { analyse } from './aiBrief.js';

// ---------- toast ----------
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [text, setText] = useState('');
  const [on, setOn] = useState(false);
  const timer = useRef();
  const show = useCallback((t) => {
    setText(t); setOn(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOn(false), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className={`toast${on ? ' on' : ''}`} role="status">{text}</div>
    </ToastCtx.Provider>
  );
}

// ---------- unit filter ----------
// Header select; '' means the whole group.
export const UnitCtx = createContext({ unit: '', setUnit: () => {} });
export const useUnit = () => useContext(UnitCtx);

// Hospitals in the current filter plus their aggregated figures.
export function useScope() {
  const { unit } = useUnit();
  const list = unit ? HOSPITALS.filter((h) => h.name === unit) : HOSPITALS;
  return { list, g: groupStats(list), isAll: !unit, label: unit ? list[0].short : 'Grupo Luz Saúde' };
}

// Small banner telling the user which unit the view is filtered to.
export function ScopeNote() {
  const { unit, setUnit } = useUnit();
  if (!unit) return null;
  return (
    <div className="scope-note">A mostrar dados de <b>{unit}</b>.<button className="btn" onClick={() => setUnit('')}>Ver todo o grupo</button></div>
  );
}

// ---------- charts ----------
// Renders one of the SVG chart types from lib/charts.js into a container.
// Pass `ai={{ action, impact, insight? }}` to attach the AI brief; findings are computed from `opts`.
export function Chart({ type, opts, className, style, ai }) {
  const ref = useRef(null);
  const id = 'c' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const key = JSON.stringify(opts);
  useLayoutEffect(() => {
    const el = ref.current;
    if (type === 'spark') Ch.spark(el, opts.data, opts.color);
    else if (type === 'gauge') Ch.gauge(el, opts.value, opts.color, opts.label);
    else Ch[type](el, opts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, key]);
  if (!ai) return <div ref={ref} id={id} className={className} style={style} />;
  return (
    <div className={className} style={style}>
      <div ref={ref} id={id} />
      <AiBrief type={type} opts={opts} ai={ai} />
    </div>
  );
}

const MODEL = 'llama3.1-70b';

// Reasoning steps shown before the answer, tailored to the chart type.
const STEP2 = {
  line: 'Calcular tendência, picos e limites', columns: 'Comparar períodos e séries', bars: 'Ordenar categorias e comparar com a referência',
  donut: 'Calcular quotas de cada categoria', heat: 'Procurar padrões por linha e coluna', scatter: 'Calcular correlação e regressão',
};

// Build the answer as an ordered list of segments: headings, bullets and paragraphs.
function segmentsOf(brief, ai) {
  const segs = [{ k: 'h', t: '💡 Insights' }, ...brief.facts.map((t) => ({ k: 'li', t }))];
  if (ai.insight) segs.push({ k: 'li', t: ai.insight });
  segs.push({ k: 'h', t: '🎯 Ação recomendada' }, { k: 'p', t: ai.action }, { k: 'h', t: '📈 Impacto esperado' }, { k: 'p', t: ai.impact });
  return segs.map((x) => ({ ...x, w: x.k === 'h' ? [x.t] : x.t.split(' ') }));
}

function AiBrief({ type, opts, ai }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState('idle'); // idle | think | stream | done
  const [step, setStep] = useState(0);
  const [shown, setShown] = useState(0);
  const [showData, setShowData] = useState(false);
  const [vote, setVote] = useState(null);
  const run = useRef(null); // snapshot of the answer being generated
  const timer = useRef();
  const toast = useToast();
  const brief = analyse(type, opts);
  useEffect(() => () => clearTimeout(timer.current), []);

  const steps = brief ? [`Ler ${nf(brief.points)} pontos de dados do gráfico`, STEP2[type] || 'Analisar os dados', 'Juntar contexto da semantic view e de análises anteriores', `Gerar recomendação com ${MODEL}`] : [];
  const total = run.current ? run.current.segs.reduce((a, x) => a + x.w.length, 0) : 0;

  // Drive the reasoning steps, then stream the answer word by word.
  useEffect(() => {
    if (phase === 'think') {
      if (step >= steps.length) { setPhase('stream'); return; }
      timer.current = setTimeout(() => setStep(step + 1), 320 + Math.random() * 380);
    } else if (phase === 'stream') {
      if (shown >= total) { run.current.ms = Math.round(performance.now() - run.current.t0); setPhase('done'); return; }
      timer.current = setTimeout(() => setShown(shown + 1 + (Math.random() < .25 ? 1 : 0)), 18 + Math.random() * 42);
    }
    return () => clearTimeout(timer.current);
  }, [phase, step, shown]);

  if (!brief) return null;

  const toggle = () => {
    const next = !open; setOpen(next);
    if (!next) { clearTimeout(timer.current); setPhase('idle'); return; }
    const segs = segmentsOf(brief, ai);
    run.current = { segs, t0: performance.now(), at: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }), tokens: Math.round(segs.reduce((a, x) => a + x.w.length, 0) * 1.6) };
    setShowData(false); setVote(null); setStep(0); setShown(0);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setStep(steps.length); setShown(1e6); run.current.ms = 0; setPhase('done'); }
    else setPhase('think');
  };
  const rate = (v) => { setVote(v); toast(v === 'up' ? 'Obrigado: a avaliação melhora as próximas respostas' : 'Registado: a equipa de dados vai rever esta análise'); };

  // Render the streamed part of the answer, with a caret at the writing position.
  const body = [];
  if (run.current && (phase === 'stream' || phase === 'done')) {
    let left = phase === 'done' ? Infinity : shown;
    for (let n = 0; n < run.current.segs.length && left > 0; n++) {
      const x = run.current.segs[n];
      const words = x.w.slice(0, left); left -= x.w.length;
      const writing = phase === 'stream' && left <= 0;
      const html = words.join(' ') + (writing ? '<span class="ai-caret"></span>' : '');
      if (x.k === 'h') body.push(<h5 key={n} className="ai-h">{x.t}</h5>);
      else body.push(<div key={n} className={x.k === 'li' ? 'ai-li' : 'ai-p'} dangerouslySetInnerHTML={{ __html: html }} />);
    }
  }

  return (
    <div className="ai-w">
      <div className="ai-row">
        <button type="button" className={`ai-btn${open ? ' on' : ''}`} onClick={toggle} aria-expanded={open}>✦ IA</button>
      </div>
      {open && (
        <div className="ai-panel" role="region" aria-label="Análise de IA deste gráfico" aria-busy={phase !== 'done'}>
          <div className={`ai-steps${phase === 'think' ? '' : ' folded'}`}>
            {steps.map((t, n) => (
              <div key={t} className={`ai-step${n < step ? ' ok' : n === step && phase === 'think' ? ' run' : ''}`}>
                <span className="dot">{n < step ? '✓' : ''}</span>{t}
              </div>
            ))}
          </div>
          {phase !== 'think' && <div className="ai-body">{body}</div>}
          {phase === 'stream' && <div className="ai-gen">A gerar · {nf(Math.round(shown * 1.6))} tokens</div>}
          {phase === 'done' && (
            <>
              <div className="ai-foot">
                <span>Snowflake Cortex · {MODEL} · {run.current.at} · {nf(run.current.ms / 1000, 1)} s · {nf(run.current.tokens)} tokens</span>
                <button type="button" className="ai-link" onClick={() => setShowData(!showData)}>{showData ? 'Ocultar dados' : 'Dados enviados ao modelo'}</button>
                <span className="ai-vote">
                  <button type="button" aria-label="Útil" className={vote === 'up' ? 'on' : ''} onClick={() => rate('up')}>👍</button>
                  <button type="button" aria-label="Não útil" className={vote === 'down' ? 'on' : ''} onClick={() => rate('down')}>👎</button>
                </span>
              </div>
              {showData && <pre className="ai-data">{`tipo: ${type} · ${brief.points} pontos\n${brief.summary}`}</pre>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- building blocks ----------
export function Kpi({ label, value, delta, tone = 'neu', spark, color }) {
  return (
    <div className="card kpi">
      <div className="lbl">{label}</div>
      <div className="v">{value}</div>
      <div className={`d ${tone}`}>{delta}</div>
      {spark && <Chart type="spark" opts={{ data: spark, color }} />}
    </div>
  );
}

export function Card({ title, sub, pill, pillClass = 'p-ml', className = '', style, children }) {
  return (
    <div className={`card ${className}`} style={style}>
      <div className="row"><h3>{title}</h3>{pill && <span className={`pill ${pillClass} sp`}>{pill}</span>}</div>
      {sub && <p className="sub">{sub}</p>}
      {children}
    </div>
  );
}

// A button that flips to a confirmed state and raises a toast when used.
export function ActionButton({ label, done, toast, primary, onClick }) {
  const [isDone, setDone] = useState(false);
  const showToast = useToast();
  const handle = () => {
    if (onClick) return onClick();
    if (isDone) return;
    setDone(true);
    if (toast) showToast(toast);
  };
  return (
    <button className={`btn${primary ? ' pri' : ''}${isDone ? ' done' : ''}`} onClick={handle}>
      {isDone ? `✓ ${done}` : label}
    </button>
  );
}

export function Insight({ icon, children, actions }) {
  return (
    <div className="insight">
      <div className="ic">{icon}</div>
      <div>
        {children}
        {actions && <div className="act">{actions}</div>}
      </div>
    </div>
  );
}

// Trusted, static demo copy that contains inline <b>/<br> markup.
export const Html = ({ as: Tag = 'p', html, ...rest }) => <Tag {...rest} dangerouslySetInnerHTML={{ __html: html }} />;
