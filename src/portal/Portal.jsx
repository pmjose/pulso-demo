import { useEffect, useState } from 'react';
import { NavLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ToastProvider, useToast } from './ui.jsx';
import { UNITS } from './data.js';
import { Flow, Overview, Revenue, Supply } from './views/Management.jsx';
import { Patient, Senior } from './views/Patients.jsx';
import { Assistant, Models, Notes } from './views/AI.jsx';
import '../styles/portal.css';

const A = import.meta.env.BASE_URL + 'assets/';
const I = (d) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{d}</svg>;

const VIEWS = [
  { slug: 'visao-geral', group: 'Gestão', title: 'Visão geral', el: Overview, icon: I(<><rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" /></>) },
  { slug: 'fluxo', group: 'Gestão', title: 'Fluxo de doentes', el: Flow, icon: I(<path d="M3 12h4l3-8 4 16 3-8h4" />) },
  { slug: 'receita', group: 'Gestão', title: 'Receita e seguradoras', el: Revenue, icon: I(<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10h9M4 14h9" />) },
  { slug: 'stocks', group: 'Gestão', title: 'Farmácia e stocks', el: Supply, icon: I(<path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10" />) },
  { slug: 'doente', group: 'Doentes', title: 'Doente 360°', el: Patient, icon: I(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></>) },
  { slug: 'senior', group: 'Doentes', title: 'Cuidados sénior', el: Senior, icon: I(<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />) },
  { slug: 'assistente', group: 'Inteligência artificial', title: 'Assistente Luz IA', el: Assistant, badge: 'Novo', icon: I(<><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>) },
  { slug: 'notas', group: 'Inteligência artificial', title: 'Notas clínicas IA', el: Notes, icon: I(<><path d="M6 3h9l4 4v14H6z" /><path d="M9 12h7M9 16h5M9 8h3" /></>) },
  { slug: 'modelos', group: 'Inteligência artificial', title: 'Modelos preditivos', el: Models, icon: I(<><circle cx="5" cy="12" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><circle cx="12" cy="12" r="2" /><path d="M7 12h3M14 11l3.5-4.5M14 13l3.5 4.5" /></>) },
];
const GROUPS = [...new Set(VIEWS.map((v) => v.group))];

export default function Portal() {
  return <ToastProvider><Shell /></ToastProvider>;
}

function Shell() {
  const { view } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const current = VIEWS.find((v) => v.slug === view);

  useEffect(() => { window.scrollTo(0, 0); }, [view]);
  useEffect(() => { if (current) document.title = `${current.title} · Luz Saúde`; }, [current]);

  if (!current) return <Navigate to="/portal/visao-geral" replace />;
  const View = current.el;

  const onSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate('/portal/assistente', { state: { ask: search.trim() } });
      setSearch('');
    }
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
                    {v.icon}{v.title}{v.badge && <span className="new">{v.badge}</span>}
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
              <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={onSearch} placeholder="Pergunte à Luz IA ou pesquise um doente…" aria-label="Pesquisa" />
            </label>
            <select aria-label="Unidade" onChange={(e) => toast(`Filtro aplicado: ${e.target.value}`)}>
              <option>Todas as unidades</option>
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
            <div className="user"><div className="avatar">MC</div><div><b>Dra. Marta Correia</b>Direção Clínica</div></div>
          </header>

          <main>
            <section className="view on" key={current.slug}><View /></section>
            <div className="foot"><span>© 2026 Luz Saúde · Portal de Inteligência v3.4</span><span>Construído sobre Snowflake AI Data Cloud</span><span>Demonstração: todos os dados são fictícios</span></div>
          </main>
        </div>
      </div>
    </div>
  );
}
