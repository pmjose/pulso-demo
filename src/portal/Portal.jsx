import { useContext, useEffect, useState } from 'react';
import { NavLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ToastProvider, UnitCtx, useToast } from './ui.jsx';
import { UNITS } from './data.js';
import { Flow, Overview, Revenue, Supply } from './views/Management.jsx';
import { Senior } from './views/Patients.jsx';
import { Operations, Outpatient } from './views/Operations.jsx';
import { Finance } from './views/Finance.jsx';
import { People, Quality } from './views/Quality.jsx';
import { Platform } from './views/Platform.jsx';
import { Signals } from './views/Signals.jsx';
import { Employee360, Patient360 } from './views/People360.jsx';
import { Research } from './views/Research.jsx';
import { Agents } from './views/Agents.jsx';
import { Assistant, Models, Notes } from './views/AI.jsx';
import '../styles/portal.css';

const A = import.meta.env.BASE_URL + 'assets/';
const I = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d}</svg>;

const ICON = {
  grid: <><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></>,
  bed: <><path d="M3 18V7M21 18v-5a3 3 0 0 0-3-3h-7v9M3 14h18" /><circle cx="7" cy="11" r="2" /></>,
  pulse: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  euro: <path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10h9M4 14h9" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  shield: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  team: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /><circle cx="17.5" cy="9" r="2.5" /><path d="M16 14.6c2.8.2 4.9 2 5.5 5.4" /></>,
  badge: <><rect x="4" y="3" width="16" height="18" rx="3" /><circle cx="12" cy="10" r="3" /><path d="M8 17c.8-1.8 2.2-2.6 4-2.6s3.2.8 4 2.6" /></>,
  box: <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10" />,
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>,
  home: <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  wave: <><path d="M2 15c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3" /><path d="M12 3v6M9 6h6" /></>,
  spark: <><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
  doc: <><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h7M9 16h5M9 8h3" /></>,
  nodes: <><circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><circle cx="12" cy="12" r="2" /><path d="M7 12h3M14 11l3.5-4.5M14 13l3.5 4.5" /></>,
  flask: <><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3" /><path d="M7 15h10" /></>,
  bot: <><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 4v4M9 14h.01M15 14h.01M2 13v3M22 13v3" /></>,
  flake: <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5" />,
};

const VIEWS = [
  { slug: 'visao-geral', group: 'Gestão', title: 'Visão geral', el: Overview, icon: 'grid' },
  { slug: 'operacoes', group: 'Gestão', title: 'Operações hospitalares', el: Operations, icon: 'bed' },
  { slug: 'fluxo', group: 'Gestão', title: 'Fluxo de doentes', el: Flow, icon: 'pulse' },
  { slug: 'ambulatorio', group: 'Gestão', title: 'Ambulatório e acesso', el: Outpatient, icon: 'calendar' },
  { slug: 'receita', group: 'Finanças', title: 'Receita e seguradoras', el: Revenue, icon: 'euro' },
  { slug: 'financas', group: 'Finanças', title: 'Finanças e margem', el: Finance, icon: 'chart' },
  { slug: 'qualidade', group: 'Qualidade e pessoas', title: 'Qualidade clínica', el: Quality, icon: 'shield' },
  { slug: 'pessoas', group: 'Qualidade e pessoas', title: 'Pessoas e capacidade', el: People, icon: 'team' },
  { slug: 'colaborador', group: 'Qualidade e pessoas', title: 'Colaborador 360°', el: Employee360, icon: 'badge' },
  { slug: 'stocks', group: 'Qualidade e pessoas', title: 'Farmácia e stocks', el: Supply, icon: 'box' },
  { slug: 'doente', group: 'Doentes', title: 'Doente 360°', el: Patient360, icon: 'person' },
  { slug: 'senior', group: 'Doentes', title: 'Cuidados sénior', el: Senior, icon: 'home' },
  { slug: 'investigacao', group: 'Doentes', title: 'Learning Health', el: Research, icon: 'flask', badge: 'Novo' },
  { slug: 'agentes', group: 'Inteligência artificial', title: 'Agentes IA', el: Agents, icon: 'bot', badge: 'Novo' },
  { slug: 'sinais', group: 'Inteligência artificial', title: 'Sinais externos', el: Signals, icon: 'wave' },
  { slug: 'assistente', group: 'Inteligência artificial', title: 'Assistente Luz IA', el: Assistant, icon: 'spark' },
  { slug: 'notas', group: 'Inteligência artificial', title: 'Notas clínicas IA', el: Notes, icon: 'doc' },
  { slug: 'modelos', group: 'Inteligência artificial', title: 'Modelos preditivos', el: Models, icon: 'nodes' },
  { slug: 'plataforma', group: 'Plataforma', title: 'Custos Snowflake', el: Platform, icon: 'flake' },
];
// Views whose figures are group-wide; they show a note when a hospital filter is active.
const GROUP_ONLY = new Set(['doente', 'colaborador', 'senior', 'sinais', 'assistente', 'notas', 'modelos', 'plataforma', 'investigacao', 'agentes']);
const PEOPLE = [
  { id: 'ana', view: 'doente', keys: ['ana sofia', 'ribeiro', '2004581', '2 004 581'] },
  { id: 'manuel', view: 'doente', keys: ['manuel', 'carvalho'] },
  { id: 'beatriz', view: 'doente', keys: ['beatriz', 'gomes'] },
  { id: 'joana', view: 'colaborador', keys: ['joana', 'matos'] },
  { id: 'ricardo', view: 'colaborador', keys: ['ricardo', 'alves'] },
  { id: 'sara', view: 'colaborador', keys: ['sara', 'nunes'] },
];
const GROUPS = [...new Set(VIEWS.map((v) => v.group))];

export default function Portal() {
  const [unit, setUnit] = useState('');
  return <ToastProvider><UnitCtx.Provider value={{ unit, setUnit }}><Shell /></UnitCtx.Provider></ToastProvider>;
}

function Shell() {
  const { view } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const { unit, setUnit } = useContext(UnitCtx);
  const current = VIEWS.find((v) => v.slug === view);

  useEffect(() => { window.scrollTo(0, 0); }, [view]);
  useEffect(() => { if (current) document.title = `${current.title} · Luz Saúde`; }, [current]);

  if (!current) return <Navigate to="/portal/visao-geral" replace />;
  const groupOnly = unit && GROUP_ONLY.has(current.slug);
  const View = current.el;

  // Names jump to the matching 360° profile; anything else goes to the assistant.
  const onSearch = (e) => {
    if (e.key !== 'Enter' || !search.trim()) return;
    const q = search.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const hit = PEOPLE.find((p) => p.keys.some((k) => q.includes(k)));
    if (hit) navigate(`/portal/${hit.view}`, { state: { pick: hit.id } });
    else navigate('/portal/assistente', { state: { ask: search.trim() } });
    setSearch('');
  };

  return (
    <div className="portal">
      <div className="app">
        <aside>
          <div className="logo"><img src={A + 'logo-luzsaude.svg'} alt="Luz Saúde" width="150" /><small>Portal de Inteligência</small></div>
          <nav className="nav" aria-label="Secções">
            {GROUPS.map((g) => (
              <div key={g}>
                <div className="nav-g">{g}</div>
                {VIEWS.filter((v) => v.group === g).map((v) => (
                  <NavLink key={v.slug} to={`/portal/${v.slug}`} className={({ isActive }) => (isActive ? 'on' : undefined)}>
                    {I(ICON[v.icon])}{v.title}{v.badge && <span className="new">{v.badge}</span>}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
          <div className="side-foot">
            <span className="dot" />Dados atualizados há 3 min<br />Ambiente de demonstração · dados fictícios
            <div className="powered"><span>Powered by</span><img src={A + 'logo-snowflake-white.svg'} alt="Snowflake" /></div>
          </div>
        </aside>

        <div>
          <header>
            <div><div className="crumb">{current.group}</div><h1>{current.title}</h1></div>
            <label className="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={onSearch} placeholder="Pesquise um doente, colaborador ou pergunte à Luz IA…" aria-label="Pesquisa" />
            </label>
            <select aria-label="Hospital" value={unit} onChange={(e) => { setUnit(e.target.value); toast(e.target.value ? `A mostrar ${e.target.value}` : 'A mostrar todo o grupo'); }}>
              <option value="">Todo o grupo · 15 hospitais</option>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <div className="user"><div className="avatar">MC</div><div><b>Dra. Marta Correia</b>Direção Clínica</div></div>
          </header>

          <main>
            {groupOnly && <div className="scope-note" style={{ marginBottom: 16 }}>{current.slug === 'doente' || current.slug === 'colaborador' ? 'O filtro de hospital não se aplica a perfis individuais.' : 'Esta vista mostra dados de todo o grupo.'}<button className="btn" onClick={() => setUnit('')}>Limpar filtro</button></div>}
            <section className="view on" key={current.slug}><View /></section>
            <div className="foot"><span>© 2026 Luz Saúde · Portal de Inteligência v3.4</span><span>Construído sobre Snowflake AI Data Cloud</span><span>Demonstração: todos os dados são fictícios</span></div>
          </main>
        </div>
      </div>
    </div>
  );
}
