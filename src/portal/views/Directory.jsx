import { useMemo, useState } from 'react';
import { nf } from '../data.js';

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const LEVELS = [['Todos', () => true], ['Alto', (v) => v > .45], ['Médio', (v) => v > .3 && v <= .45], ['Baixo', (v) => v <= .3]];

// Searchable, filterable directory of people shown above a 360° profile.
// rows: [{ id, name, hosp, group, risk, sub, featured }]
export function Directory({ rows, sel, onSel, noun, groupLabel, riskLabel, note }) {
  const [q, setQ] = useState('');
  const [hosp, setHosp] = useState('');
  const [group, setGroup] = useState('');
  const [lvl, setLvl] = useState('Todos');
  const [open, setOpen] = useState(false);
  const [limit, setLimit] = useState(40);
  const hosps = useMemo(() => [...new Set(rows.map((r) => r.hosp))].sort(), [rows]);
  const groups = useMemo(() => [...new Set(rows.map((r) => r.group))].sort(), [rows]);
  const test = LEVELS.find((l) => l[0] === lvl)[1];
  const list = rows
    .filter((r) => (!q || norm(r.name + ' ' + r.sub).includes(norm(q))) && (!hosp || r.hosp === hosp) && (!group || r.group === group) && test(r.risk))
    .sort((a, b) => b.risk - a.risk);
  const featured = rows.filter((r) => r.featured);
  const current = rows.find((r) => r.id === sel);
  const filtering = q || hosp || group || lvl !== 'Todos';
  const pickRow = (id) => { onSel(id); setOpen(false); scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="dir card">
      <div className="dir-bar">
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} placeholder={`Procurar ${noun} por nome…`} aria-label={`Procurar ${noun}`} />
        <select value={hosp} onChange={(e) => { setHosp(e.target.value); setOpen(true); }} aria-label="Hospital"><option value="">Todos os hospitais</option>{hosps.map((h) => <option key={h}>{h}</option>)}</select>
        <select value={group} onChange={(e) => { setGroup(e.target.value); setOpen(true); }} aria-label={groupLabel}><option value="">{groupLabel}: todos</option>{groups.map((g) => <option key={g}>{g}</option>)}</select>
        <select value={lvl} onChange={(e) => { setLvl(e.target.value); setOpen(true); }} aria-label={riskLabel}>{LEVELS.map(([l]) => <option key={l} value={l}>{l === 'Todos' ? `${riskLabel}: todos` : `${riskLabel}: ${l.toLowerCase()}`}</option>)}</select>
        <button className={`btn${open ? ' pri' : ''}`} onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Fechar lista' : `Ver lista · ${nf(list.length)}`}</button>
      </div>
      <div className="dir-feat">
        <span className="sub" style={{ margin: 0 }}>Em destaque:</span>
        {featured.map((r) => <button key={r.id} className={`chip-p${r.id === sel ? ' on' : ''}`} onClick={() => pickRow(r.id)}>{r.name}</button>)}
        <span className="sub dir-note">{nf(rows.length)} {noun}{noun.endsWith("r") ? "es" : "s"} · {note}</span>
      </div>
      {open && (
        <div className="dir-list">
          <table className="tabular">
            <thead><tr><th>Nome</th><th>Hospital</th><th>{groupLabel}</th><th>{riskLabel}</th><th>Detalhe</th></tr></thead>
            <tbody>{list.slice(0, limit).map((r) => (
              <tr key={r.id} className={r.id === sel ? 'sel' : ''} style={{ cursor: 'pointer' }} onClick={() => pickRow(r.id)}>
                <td><b>{r.name}</b>{r.featured && <span className="new-tag">DESTAQUE</span>}</td><td>{r.hosp}</td><td>{r.group}</td>
                <td><span className={`pill ${r.risk > .45 ? 'p-bad' : r.risk > .3 ? 'p-warn' : 'p-ok'}`}>{Math.round(r.risk * 100)}%</span></td>
                <td style={{ color: 'var(--muted)' }}>{r.sub}</td>
              </tr>))}</tbody>
          </table>
          {!list.length && <p className="sub" style={{ padding: 12 }}>Nenhum resultado com estes filtros. Limpe a pesquisa ou escolha outro hospital.</p>}
          {list.length > limit && <button className="btn" style={{ marginTop: 10 }} onClick={() => setLimit(limit + 60)}>Mostrar mais ({nf(list.length - limit)})</button>}
          {filtering && <button className="btn" style={{ marginTop: 10, marginLeft: 8 }} onClick={() => { setQ(''); setHosp(''); setGroup(''); setLvl('Todos'); }}>Limpar filtros</button>}
        </div>
      )}
      {current && !open && <div className="dir-cur">A ver: <b>{current.name}</b> · {current.hosp} · {current.group}</div>}
    </div>
  );
}
