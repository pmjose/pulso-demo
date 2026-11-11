import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/value.css';

const A = import.meta.env.BASE_URL + 'assets/';
const jump = (id) => (e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };
const clamp = (v) => Math.max(0, Math.min(1, v));

// Drives every scroll animation: each [data-scroll] element gets a --p (0..1) CSS variable.
//   sticky  → progress while its sticky child is pinned
//   view    → progress while the element crosses the viewport
//   hscroll → sticky progress plus --shift in px for a horizontal track
function useScrollScenes(root) {
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const els = [...root.current.querySelectorAll('[data-scroll]')];
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = innerHeight;
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const kind = el.dataset.scroll;
        let p = kind === 'view' ? clamp((vh - r.top) / (vh * 0.9)) : clamp(-r.top / Math.max(1, r.height - vh));
        if (reduce) p = 1;
        el.style.setProperty('--p', p.toFixed(4));
        if (kind === 'hscroll') {
          const track = el.querySelector('.track');
          el.style.setProperty('--shift', `${-(track.scrollWidth - innerWidth) * p}px`);
        }
      }
      const nav = root.current.querySelector('.vnav');
      nav.classList.toggle('solid', scrollY > 40);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    // Dev-only: ?y=<px> jumps to a scroll position so scenes can be checked headlessly.
    const y = import.meta.env.DEV && new URLSearchParams(location.search).get('y');
    if (y) { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, +y); }
    update();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [root]);
}

// Counts a number up once it scrolls into view.
function Count({ to, decimals = 0, suffix = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    const fmt = (v) => v.toLocaleString('pt-PT', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(to); return; }
    el.textContent = fmt(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1600;
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 4);
        el.textContent = fmt(to * ease);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, decimals, suffix]);
  return <span ref={ref} />;
}

// Glass card with a spotlight that follows the pointer.
function Glass({ className = '', children, ...rest }) {
  const move = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return <div className={`glass ${className}`} onPointerMove={move} {...rest}>{children}</div>;
}

const STATEMENT = 'Processo clínico, faturação, marcações, app MY LUZ, ERP e seguradora vivem em sistemas diferentes. Cada pergunta transversal exige extrações, folhas de cálculo e dias de espera. A informação existe. Só está espalhada.';

const SILOS = [
  ['Processo clínico', -38, -30], ['Faturação', 34, -34], ['Marcações', -44, 4], ['App MY LUZ', 42, 2],
  ['ERP', -30, 32], ['Imagiologia', 30, 34], ['Seguradora', 0, -42], ['Cuidados continuados', -6, 40], ['Investigação', 46, -14],
];

const USES = [
  ['Fluxo de doentes', 'Previsão de afluência à urgência a 72 horas e ocupação de camas a 14 dias, com recomendação de escalas.', '−18%', 'tempo de espera na urgência'],
  ['Ciclo de receita', 'Episódios com risco de rejeição detetados antes da faturação, e menos dias até ao recebimento.', '+4,2 M€', 'receita recuperada por ano'],
  ['Doente 360° e MY LUZ', 'Próxima melhor ação personalizada: rastreios em atraso, seguimentos e adesão ao LUZ ON PRIME.', '+12%', 'adesão a seguimentos'],
  ['Notas clínicas com IA', 'Codificação CID-10 assistida e extração estruturada de altas e relatórios com Cortex AI.', '−60%', 'tempo de codificação'],
  ['Bloco operatório', 'Previsão da duração cirúrgica e plano operatório semanal otimizado.', '+9%', 'utilização de salas'],
  ['Cuidados sénior', 'Risco de queda e de readmissão em cuidados continuados e residências, com alertas à equipa.', '−22%', 'quedas com lesão'],
];

const ROAD = [
  ['6 semanas', 'Fundação', 'Ingestão das fontes core, modelo de episódio e governação RGPD.'],
  ['8 semanas', 'Insight', 'Portal de inteligência e indicadores partilhados por todo o grupo.'],
  ['10 semanas', 'Previsão', 'Modelos de afluência, faltas e glosas em produção, com monitorização.'],
  ['Contínuo', 'Agentes', 'Assistentes em português e partilha segura com seguradora e investigação.'],
];

function HeroDashboard() {
  const pts = [62, 58, 64, 70, 66, 74, 72, 80, 76, 84, 88, 86, 92];
  const path = pts.map((v, i) => `${i ? 'L' : 'M'}${i * 25} ${100 - v}`).join(' ');
  return (
    <div className="dash">
      <div className="dash-bar"><img src={A + 'logo-luzsaude.svg'} alt="" /><span>Portal de Inteligência</span><i /><i /><i /></div>
      <div className="dash-kpis">
        {[['Ocupação', '87,4%'], ['Espera urgência', '38 min'], ['Receita', '756 M€'], ['Faltas', '7,8%']].map(([l, v]) => (
          <div key={l}><small>{l}</small><b>{v}</b></div>
        ))}
      </div>
      <div className="dash-main">
        <svg viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
          <defs><linearGradient id="dg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#29b5e8" stopOpacity=".45" /><stop offset="1" stopColor="#29b5e8" stopOpacity="0" /></linearGradient></defs>
          <path d={`${path} L300 100 L0 100 Z`} fill="url(#dg)" />
          <path d={path} fill="none" stroke="#7fe3f0" strokeWidth="2" />
          <path d="M200 24 C 240 18, 260 12, 300 6" fill="none" stroke="#b9a7ff" strokeWidth="2" strokeDasharray="5 5" />
        </svg>
        <div className="dash-ai"><span>✦ Luz IA</span>A ocupação no HL Lisboa deverá ultrapassar 92% na sexta-feira. Sugiro antecipar 22 altas.</div>
      </div>
    </div>
  );
}

export default function Value() {
  const root = useRef(null);
  useScrollScenes(root);
  const words = STATEMENT.split(' ');

  return (
    <div className="value" ref={root}>
      <div className="aurora" aria-hidden="true"><i /><i /><i /></div>

      <nav className="vnav">
        <div className="brand"><img src={A + 'logo-snowflake-white.svg'} alt="Snowflake" height="22" /><span className="x">×</span><img src={A + 'logo-luzsaude.svg'} alt="Luz Saúde" height="16" /></div>
        <div className="links">
          <a href="#desafio" onClick={jump('desafio')}>O desafio</a>
          <a href="#plataforma" onClick={jump('plataforma')}>A plataforma</a>
          <a href="#casos" onClick={jump('casos')}>Casos de uso</a>
          <a href="#roteiro" onClick={jump('roteiro')}>Roteiro</a>
          <Link className="pill-cta" to="/portal">Abrir o portal</Link>
        </div>
      </nav>

      {/* Hero: headline recedes while the glass dashboard tilts up into place */}
      <section className="scene hero" data-scroll="sticky">
        <div className="stick">
          <div className="hero-copy">
            <p className="kicker">Snowflake para a Luz Saúde</p>
            <h1>Cada decisão clínica.<br /><span className="grad">Todos os dados.</span></h1>
            <p className="lede">Hospitais, clínicas, cuidados continuados, residências e seguradora numa única plataforma, com IA governada.</p>
          </div>
          <div className="hero-stage"><HeroDashboard /></div>
          <div className="scroll-cue" aria-hidden="true"><span /></div>
        </div>
      </section>

      {/* Statement lights up word by word */}
      <section id="desafio" className="scene statement" data-scroll="sticky">
        <div className="stick">
          <p className="words" style={{ '--n': words.length }}>
            {words.map((w, i) => <span key={i} style={{ '--i': i }}>{w} </span>)}
          </p>
        </div>
      </section>

      {/* Silos converge into one platform */}
      <section id="plataforma" className="scene converge" data-scroll="sticky">
        <div className="stick">
          <div className="orbit">
            {SILOS.map(([l, x, y]) => <div key={l} className="chip" style={{ '--x': x, '--y': y }}>{l}</div>)}
            <div className="core"><img src={A + 'logo-snowflake-white.svg'} alt="Snowflake" /></div>
          </div>
          <div className="converge-copy">
            <h2>Uma plataforma.<br />Todas as cargas de trabalho.</h2>
            <p>Engenharia de dados, analítica, machine learning e agentes de IA no mesmo sítio, com a mesma governação. Os dados ficam protegidos; as perguntas vão até eles.</p>
          </div>
        </div>
      </section>

      <section className="numbers">
        {[[15, 0, '', 'hospitais e 24 clínicas numa visão única'], [1.6, 1, ' M', 'utilizadores MY LUZ com perfil 360°'], [14, 0, ' mil', 'colaboradores, dos quais 4 mil médicos'], [0, 0, '', 'cópias de dados para partilhar com a Fidelidade']].map(([to, d, s, l]) => (
          <div key={l} className="num"><b><Count to={to} decimals={d} suffix={s} /></b><span>{l}</span></div>
        ))}
      </section>

      <section className="bento-wrap">
        <h2 className="center">Pensado para a saúde.<br /><span className="dim">Construído para escalar.</span></h2>
        <div className="bento">
          <Glass className="w4 tall"><span className="tag">Dados unificados</span><h3>Doente 360° em minutos, não em meses.</h3><p>Ingestão contínua de HL7/FHIR, ficheiros e bases operacionais. Dynamic Tables mantêm o modelo sempre atualizado.</p><div className="huge grad">−70%</div><p className="fine">tempo de preparação de dados</p></Glass>
          <Glass className="w2"><span className="tag">Governação</span><h3>RGPD por desenho.</h3><p>Mascaramento dinâmico, políticas por linha, classificação automática e linhagem ponta-a-ponta.</p></Glass>
          <Glass className="w2"><span className="tag">Cortex AI</span><h3>IA que lê notas clínicas.</h3><p>Extração, classificação e resumo de relatórios em português, diretamente em SQL.</p></Glass>
          <Glass className="w2"><span className="tag">Machine learning</span><h3>Previsão no dia a dia.</h3><p>Afluência, faltas, readmissões e risco de glosa, treinados e servidos no Snowflake.</p></Glass>
          <Glass className="w2"><span className="tag">Partilha segura</span><h3>Hospital e seguradora, sem cópias.</h3><p>Secure Data Sharing e Clean Rooms com privacidade garantida.</p></Glass>
          <Glass className="w2"><span className="tag">Snowflake Intelligence</span><h3>Pergunte em português.</h3><p>"Porque subiu a demora média em Ortopedia?" Gráfico, explicação e fonte em segundos.</p></Glass>
        </div>
      </section>

      {/* Use cases scroll sideways while pinned */}
      <section id="casos" className="scene hscroll" data-scroll="hscroll">
        <div className="stick">
          <h2 className="h-title">Valor onde mais importa.</h2>
          <div className="track">
            {USES.map(([t, d, k, kl]) => (
              <Glass key={t} className="use"><h3>{t}</h3><p>{d}</p><div className="kpi"><b className="grad">{k}</b><span>{kl}</span></div></Glass>
            ))}
          </div>
          <p className="fine h-note">Valores ilustrativos para efeitos de demonstração.</p>
        </div>
      </section>

      <section id="roteiro" className="road" data-scroll="view">
        <h2 className="center">Do primeiro dado<br />ao primeiro agente.</h2>
        <div className="line"><i /></div>
        <div className="steps">
          {ROAD.map(([d, t, s], i) => (
            <div key={t} className="step" style={{ '--i': i }}><small>{d}</small><h3>{t}</h3><p>{s}</p></div>
          ))}
        </div>
      </section>

      <section className="finale">
        <div className="glow" aria-hidden="true" />
        <h2>Veja como seria<br />o seu dia a dia.</h2>
        <p>Indicadores, modelos preditivos e um assistente de IA, construídos sobre o Snowflake.</p>
        <Link className="big-cta" to="/portal">Abrir o portal</Link>
        <footer>Demonstração. Todos os dados e valores são fictícios e meramente ilustrativos.</footer>
      </section>
    </div>
  );
}
