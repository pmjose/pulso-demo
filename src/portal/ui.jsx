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

function AiBrief({ type, opts, ai }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showData, setShowData] = useState(false);
  const [vote, setVote] = useState(null);
  const [at, setAt] = useState('');
  const timer = useRef();
  const toast = useToast();
  const brief = analyse(type, opts);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!brief) return null;

  const toggle = () => {
    const next = !open; setOpen(next);
    if (next) {
      setBusy(true); setShowData(false);
      timer.current = setTimeout(() => { setBusy(false); setAt(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })); }, 750 + Math.min(900, brief.points * 6));
    }
  };
  const rate = (v) => { setVote(v); toast(v === 'up' ? 'Obrigado: a avaliação melhora as próximas respostas' : 'Registado: a equipa de dados vai rever esta análise'); };

  return (
    <div className="ai-w">
      <div className="ai-row">
        <button type="button" className={`ai-btn${open ? ' on' : ''}`} onClick={toggle} aria-expanded={open}>✦ IA</button>
      </div>
      {open && (
        <div className="ai-panel" role="region" aria-label="Análise de IA deste gráfico">
          {busy ? (
            <p className="ai-busy"><span className="typing"><span /><span /><span /></span> A analisar {nf(brief.points)} pontos de dados com Cortex AI…</p>
          ) : (
            <>
              <div className="ai-b"><h5>💡 Insights</h5><ul>{brief.facts.map((f) => <li key={f} dangerouslySetInnerHTML={{ __html: f }} />)}{ai.insight && <li dangerouslySetInnerHTML={{ __html: ai.insight }} />}</ul></div>
              <div className="ai-b"><h5>🎯 Ação recomendada</h5><p>{ai.action}</p></div>
              <div className="ai-b"><h5>📈 Impacto esperado</h5><p>{ai.impact}</p></div>
              <div className="ai-foot">
                <span>Snowflake Cortex · {MODEL} · gerado às {at}</span>
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
