import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Ch } from '../lib/charts.js';
import { HOSPITALS, groupStats } from './data.js';

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
export function Chart({ type, opts, className, style }) {
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
  return <div ref={ref} id={id} className={className} style={style} />;
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
