import { CopilotProvider } from './copilot.jsx';
import { useContext, useEffect, useState } from 'react';
import { NavLink, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ActionsCtx, PersonaCtx, ToastProvider, UnitCtx, useToast } from './ui.jsx';
import { FILTER_UNITS } from './data.js';
import { GEN_EMPLOYEES, GEN_PATIENTS } from './peopleGen.js';
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
import { Benchmark, Variance } from './views/Insights.jsx';
import { Commercial, Journey, ServiceLines } from './views/Business.jsx';
import { Assets, Esg, NewUnits } from './views/Business2.jsx';
import { Planning } from './views/Planning.jsx';
import { ActionPlan, Alerts, BoardPack, Home, PERSONAS, SEED_ACTIONS } from './views/Work.jsx';
import { Dictionary } from './views/Platform.jsx';
import { Surgery } from './views/Surgery.jsx';
import { Architecture } from './views/Architecture.jsx';
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
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  bridge: <path d="M3 20V9h4v11M10 20V5h4v15M17 20v-8h4v8" />,
  rank: <path d="M4 20h4v-7H4zM10 20h4V6h-4zM16 20h4v-11h-4z" />,
  route: <><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6" /></>,
  layers: <path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" />,
  rocket: <><path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2" /><path d="M9 12a12 12 0 0 1 11-9 12 12 0 0 1-9 11z" /><circle cx="15" cy="9" r="1.5" /></>,
  sliders: <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" />,
  leaf: <path d="M5 21c0-9 6-15 16-16-1 10-7 16-16 16zM5 21l7-7" />,
  tool: <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-2.4z" />,
  megaphone: <path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1zM17 8a5 5 0 0 1 0 8" />,
  check: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 12l3 3 6-6" /></>,
  bell: <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0" />,
  report: <><path d="M6 3h9l4 4v14H6z" /><path d="M9 17v-3M12 17v-6M15 17v-4" /></>,
  book: <path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2zM4 19V5" />,
  scalpel: <><path d="M3 21l9-9M12 12l7-7a2 2 0 0 1 3 3l-7 7z" /><path d="M10 14l-2-2" /></>,
  flake: <path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5" />,
};

const VIEWS = [
  { slug: 'inicio', group: 'Início', title: 'Início', el: Home, icon: 'sun' },
  { slug: 'visao-geral', group: 'Gestão', title: 'Visão geral', el: Overview, icon: 'grid' },
  { slug: 'operacoes', group: 'Gestão', title: 'Operações hospitalares', el: Operations, icon: 'bed' },
  { slug: 'bloco', group: 'Gestão', title: 'Bloco operatório', el: Surgery, icon: 'scalpel', badge: 'Novo' },
  { slug: 'fluxo', group: 'Gestão', title: 'Fluxo de doentes', el: Flow, icon: 'pulse' },
  { slug: 'ambulatorio', group: 'Gestão', title: 'Ambulatório e acesso', el: Outpatient, icon: 'calendar' },
  { slug: 'percurso', group: 'Gestão', title: 'Percurso do doente', el: Journey, icon: 'route' },
  { slug: 'linhas', group: 'Gestão', title: 'Linhas de serviço', el: ServiceLines, icon: 'layers' },
  { slug: 'novas', group: 'Gestão', title: 'Novas unidades', el: NewUnits, icon: 'rocket' },
  { slug: 'receita', group: 'Finanças', title: 'Receita e seguradoras', el: Revenue, icon: 'euro' },
  { slug: 'financas', group: 'Finanças', title: 'Finanças e margem', el: Finance, icon: 'chart' },
  { slug: 'variacao', group: 'Finanças', title: 'Análise de variação', el: Variance, icon: 'bridge' },
  { slug: 'planeamento', group: 'Finanças', title: 'Planeamento e cenários', el: Planning, icon: 'sliders' },
  { slug: 'benchmarking', group: 'Desempenho', title: 'Benchmarking', el: Benchmark, icon: 'rank' },
  { slug: 'qualidade', group: 'Desempenho', title: 'Qualidade clínica', el: Quality, icon: 'shield' },
  { slug: 'esg', group: 'Desempenho', title: 'ESG e sustentabilidade', el: Esg, icon: 'leaf' },
  { slug: 'pessoas', group: 'Pessoas e recursos', title: 'Pessoas e capacidade', el: People, icon: 'team' },
  { slug: 'colaborador', group: 'Pessoas e recursos', title: 'Colaborador 360°', el: Employee360, icon: 'badge' },
  { slug: 'stocks', group: 'Pessoas e recursos', title: 'Farmácia e stocks', el: Supply, icon: 'box' },
  { slug: 'ativos', group: 'Pessoas e recursos', title: 'Ativos e compras', el: Assets, icon: 'tool' },
  { slug: 'doente', group: 'Doentes e clientes', title: 'Doente 360°', el: Patient360, icon: 'person' },
  { slug: 'comercial', group: 'Doentes e clientes', title: 'Comercial e digital', el: Commercial, icon: 'megaphone' },
  { slug: 'senior', group: 'Doentes e clientes', title: 'Sénior e Casas da Cidade', el: Senior, icon: 'home' },
  { slug: 'investigacao', group: 'Doentes e clientes', title: 'Learning Health', el: Research, icon: 'flask' },
  { slug: 'agentes', group: 'Inteligência artificial', title: 'Agentes IA', el: Agents, icon: 'bot' },
  { slug: 'sinais', group: 'Inteligência artificial', title: 'Sinais externos', el: Signals, icon: 'wave' },
  { slug: 'assistente', group: 'Inteligência artificial', title: 'Assistente Luz IA', el: Assistant, icon: 'spark' },
  { slug: 'notas', group: 'Inteligência artificial', title: 'Notas clínicas IA', el: Notes, icon: 'doc' },
  { slug: 'modelos', group: 'Inteligência artificial', title: 'Modelos preditivos', el: Models, icon: 'nodes' },
  { slug: 'acoes', group: 'Trabalho', title: 'Plano de ações', el: ActionPlan, icon: 'check' },
  { slug: 'alertas', group: 'Trabalho', title: 'Alertas e subscrições', el: Alerts, icon: 'bell' },
  { slug: 'relatorio', group: 'Trabalho', title: 'Relatório do conselho', el: BoardPack, icon: 'report' },
  { slug: 'dicionario', group: 'Plataforma', title: 'Dicionário de indicadores', el: Dictionary, icon: 'book' },
  { slug: 'plataforma', group: 'Plataforma', title: 'Observabilidade', el: Platform, icon: 'flake' },
  { slug: 'arquitetura', group: 'Plataforma', title: 'Arquitetura da plataforma', el: Architecture, icon: 'grid' },
];
// Views whose figures are group-wide; they show a note when a hospital filter is active.
const GROUP_ONLY = new Set(['inicio', 'doente', 'colaborador', 'senior', 'sinais', 'assistente', 'notas', 'modelos', 'plataforma', 'investigacao', 'agentes', 'percurso', 'linhas', 'novas', 'variacao', 'planeamento', 'benchmarking', 'esg', 'ativos', 'comercial', 'acoes', 'alertas', 'relatorio', 'dicionario', 'bloco']);
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
  const [persona, setPersona] = useState('clin');
  return (
    <ToastProvider><UnitProvider><PersonaCtx.Provider value={{ persona, setPersona }}><ActionsProvider><Shell /></ActionsProvider></PersonaCtx.Provider></UnitProvider></ToastProvider>
  );
}

// Shared action plan: seeded with recent actions, plus any action approved in the portal.
function ActionsProvider({ children }) {
  const [actions, setActions] = useState(SEED_ACTIONS);
  const [current, setCurrent] = useState('');
  const { persona } = useContext(PersonaCtx);
  const add = (a) => {
    const owner = PERSONAS.find((p) => p.id === persona);
    setActions((xs) => [{ id: `n${Date.now()}`, source: current || 'Portal', ownerId: persona, owner: owner.name, scope: 'Grupo', due: '+7 dias', expected: 'Ver recomendação', realised: null, isNew: true, ...a }, ...xs]);
  };
  const update = (id, patch) => setActions((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  return <ActionsCtx.Provider value={{ actions, add, update, current, setCurrent }}>{children}</ActionsCtx.Provider>;
}

// Only hospitals with their own detail can be selected; table rows for the others explain why.
function UnitProvider({ children }) {
  const [unit, setRaw] = useState('');
  const toast = useToast();
  const setUnit = (u) => {
    if (u && !FILTER_UNITS.includes(u)) { toast(`${u}: sem dados detalhados neste portal. Os valores contam no total do grupo.`); return; }
    setRaw(u);
  };
  return <UnitCtx.Provider value={{ unit, setUnit }}>{children}</UnitCtx.Provider>;
}

function Shell() {
  const { view } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const { unit, setUnit } = useContext(UnitCtx);
  const { persona } = useContext(PersonaCtx);
  const { setCurrent } = useContext(ActionsCtx);
  const me = PERSONAS.find((p) => p.id === persona);
  const current = VIEWS.find((v) => v.slug === view);
  useEffect(() => { if (current) setCurrent(current.title); }, [current]);

  useEffect(() => { window.scrollTo(0, 0); }, [view]);
  useEffect(() => { if (current) document.title = `${current.title} · Luz Saúde`; }, [current]);

  if (!current) return <Navigate to="/portal/inicio" replace />;
  const groupOnly = unit && GROUP_ONLY.has(current.slug);
  const View = current.el;

  // Names jump to the matching 360° profile; anything else goes to the assistant.
  const onSearch = (e) => {
    if (e.key !== 'Enter' || !search.trim()) return;
    const q = search.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const n = (x) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^(dra?\.|enf\.ª?)\s/, '');
    const gen = [...GEN_PATIENTS.map((x) => ({ id: x.id, view: 'doente', name: n(x.name) })), ...GEN_EMPLOYEES.map((x) => ({ id: x.id, view: 'colaborador', name: n(x.name) }))];
    const hit = PEOPLE.find((p) => p.keys.some((k) => q.includes(k))) || gen.find((g) => g.name.includes(q) || q.includes(g.name));
    if (hit) navigate(`/portal/${hit.view}`, { state: { pick: hit.id } });
    else navigate('/portal/assistente', { state: { ask: search.trim() } });
    setSearch('');
  };

  return (
    <div className="portal">
    <CopilotProvider slug={current.slug} title={current.title} unit={unit}>
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
              {FILTER_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <div className="user"><div className="avatar">{me.initials}</div><div><b>{me.name}</b>{me.role}</div></div>
          </header>

          <main>
            {groupOnly && <div className="scope-note" style={{ marginBottom: 16 }}>{current.slug === 'doente' || current.slug === 'colaborador' ? 'O filtro de hospital não se aplica a perfis individuais.' : 'Esta vista mostra dados de todo o grupo.'}<button className="btn" onClick={() => setUnit('')}>Limpar filtro</button></div>}
            <section className="view on" key={current.slug}><View /></section>
            <div className="foot"><span>© 2026 Luz Saúde · Portal de Inteligência v3.4</span><span>Construído sobre Snowflake AI Data Cloud</span><span>Demonstração: todos os dados são fictícios</span></div>
          </main>
        </div>
      </div>
    </CopilotProvider>
    </div>
  );
}
