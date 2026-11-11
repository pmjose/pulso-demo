import { Link } from 'react-router-dom';
import '../styles/value.css';

const A = import.meta.env.BASE_URL + 'assets/';

// In-page anchors would clash with the hash router, so scroll explicitly.
const jump = (id) => (e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); };

export default function Value() {
  return (
    <div className="value">
<div className="field" aria-hidden="true"><div className="blob b1"></div><div className="blob b2"></div><div className="blob b3"></div><div className="blob b4"></div></div>

<nav>
  <div className="brand"><img src={A + 'logo-snowflake.svg'} alt="Snowflake" height="24" /><span className="x">×</span><img src={A + 'logo-luzsaude-dark.svg'} alt="Luz Saúde" height="18" /></div>
  <div className="links"><a href={"#" + "desafio"} onClick={jump("desafio")}>O desafio</a><a href={"#" + "plataforma"} onClick={jump("plataforma")}>A plataforma</a><a href={"#" + "casos"} onClick={jump("casos")}>Casos de uso</a><a href={"#" + "roteiro"} onClick={jump("roteiro")}>Roteiro</a><Link className="cta" to="/portal">Abrir o portal</Link></div>
</nav>

<section className="hero">
  <h1>Cada decisão clínica,<span>informada por todos os dados.</span></h1>
  <p>Uma única plataforma para unir hospitais, clínicas, cuidados continuados, residências sénior e seguradora. Com IA governada, previsão em tempo real e partilha segura de dados, sem mover nem copiar informação sensível.</p>
  <div className="actions"><Link className="cta big" to="/portal">Ver a plataforma em ação</Link><a className="ghost" href={"#" + "desafio"} onClick={jump("desafio")}>Perceber o valor</a></div>
  <div className="stats">
    <div className="glass stat"><b>30</b><span>hospitais e clínicas com uma visão única de dados</span></div>
    <div className="glass stat"><b>2 M+</b><span>clientes com um perfil 360° consistente</span></div>
    <div className="glass stat"><b>15 mil</b><span>colaboradores com acesso self-service a insights</span></div>
    <div className="glass stat"><b>0</b><span>cópias de dados clínicos para partilhar com parceiros</span></div>
  </div>
</section>

<section id="desafio">
  <div className="problem">
    <div>
      <h2>A informação existe. Só está espalhada.</h2>
      <p className="lead">Processo clínico, faturação, marcações, app MY LUZ, ERP, recursos humanos e seguradora vivem em sistemas diferentes. Cada pergunta transversal, da ocupação de amanhã à rentabilidade de um episódio, exige extrações manuais, folhas de cálculo e dias de espera.</p>
      <p className="lead">O resultado é decidir com dados de ontem, pilotos de IA que não passam a produção e receita que se perde entre sistemas.</p>
    </div>
    <div className="glass silos" aria-label="Fontes de dados atuais">
      <div className="silo"><b>Processo clínico</b>Episódios, diagnósticos, prescrições</div>
      <div className="silo"><b>Faturação</b>Atos, convenções, glosas</div>
      <div className="silo"><b>Marcações</b>Agendas, faltas, listas de espera</div>
      <div className="silo"><b>App MY LUZ</b>Sessões, check-in, videoconsultas</div>
      <div className="silo"><b>ERP</b>Compras, stocks, ativos, RH</div>
      <div className="silo"><b>Imagiologia e laboratório</b>Relatórios, resultados</div>
      <div className="silo"><b>Seguradora</b>Apólices, sinistros, coberturas</div>
      <div className="silo"><b>Cuidados continuados</b>Avaliações, quedas, planos</div>
      <div className="silo"><b>Investigação</b>Coortes, ensaios, registos</div>
    </div>
  </div>
</section>

<section id="plataforma">
  <h2>Uma plataforma. Todas as cargas de trabalho.</h2>
  <p className="lead">O Snowflake junta engenharia de dados, analítica, machine learning e agentes de IA no mesmo sítio, com a mesma governação. Os dados ficam onde estão protegidos; as perguntas vão até eles.</p>
  <div className="bento">
    <div className="glass tile w4"><span className="tag">Dados unificados</span><h3>Doente 360° em minutos, não em meses</h3><p>Ingestão contínua de HL7/FHIR, ficheiros e bases operacionais. Dynamic Tables mantêm o modelo de dados sempre atualizado, sem pipelines frágeis.</p><div className="big">−70%</div><p>tempo de preparação de dados (estimativa ilustrativa)</p></div>
    <div className="glass tile w2"><span className="tag">Governação</span><h3>RGPD por desenho</h3><p>Mascaramento dinâmico, políticas por linha, classificação automática de dados de saúde e linhagem ponta-a-ponta.</p></div>
    <div className="glass tile w2"><span className="tag">Cortex AI</span><h3>IA que lê notas clínicas</h3><p>Extração, classificação e resumo de relatórios em português, diretamente em SQL, sem os dados saírem da plataforma.</p></div>
    <div className="glass tile w2"><span className="tag">Machine learning</span><h3>Previsão no dia a dia</h3><p>Afluência à urgência, faltas a consultas, readmissões e risco de glosa, treinados e servidos no Snowflake.</p></div>
    <div className="glass tile w2"><span className="tag">Partilha segura</span><h3>Hospital e seguradora, sem cópias</h3><p>Secure Data Sharing e Clean Rooms ligam prestação e seguro com privacidade garantida.</p></div>
    <div className="glass tile w3"><span className="tag">Snowflake Intelligence</span><h3>Pergunte em português, obtenha a resposta</h3><p>Diretores clínicos e gestores perguntam "Porque subiu a demora média em Ortopedia?" e recebem gráfico, explicação e fonte.</p></div>
    <div className="glass tile w3"><span className="tag">Escala elástica</span><h3>Paga o que usa</h3><p>Computação separada do armazenamento. O fecho do mês, a investigação e os painéis não competem pelos mesmos recursos.</p><div className="big">99,9%</div><p>disponibilidade de referência</p></div>
  </div>

  <div className="glass arch" aria-label="Arquitetura de referência">
    <div className="flow">
      <div className="col"><h4>Fontes</h4><div className="chip">Processo clínico (HL7/FHIR)</div><div className="chip">Faturação e convenções</div><div className="chip">ERP · Compras e stocks</div><div className="chip">App MY LUZ e website</div><div className="chip">Seguradora · Sinistros</div></div>
      <div className="arrow" aria-hidden="true">›</div>
      <div className="core">
        <div className="title"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#29b5e8" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"/></svg>Snowflake AI Data Cloud</div>
        <div className="grid">
          <div className="chip">Openflow · Snowpipe Streaming</div><div className="chip">Dynamic Tables · dbt</div>
          <div className="chip">Horizon · RGPD e linhagem</div><div className="chip">Semantic Views</div>
          <div className="chip">Snowflake ML · Feature Store</div><div className="chip">Cortex AI SQL</div>
          <div className="chip">Cortex Search · Agents</div><div className="chip">Clean Rooms</div>
        </div>
      </div>
      <div className="arrow" aria-hidden="true">›</div>
      <div className="col"><h4>Consumo</h4><div className="chip">Portal de Inteligência</div><div className="chip">Assistente IA em português</div><div className="chip">Alertas na app MY LUZ</div><div className="chip">Investigação e ensaios</div><div className="chip">Reporte regulatório</div></div>
    </div>
  </div>
</section>

<section id="casos">
  <h2>Valor onde mais importa.</h2>
  <p className="lead">Casos de uso pensados para a realidade de um grupo de saúde privado com seguradora no acionista.</p>
  <div className="uses">
    <div className="glass use"><div className="ico">◎</div><h3>Fluxo de doentes</h3><p>Previsão de afluência à urgência a 72 horas e ocupação de camas a 14 dias, com recomendação de escalas.</p><div className="kpi">−18% tempo de espera na urgência</div></div>
    <div className="glass use"><div className="ico">€</div><h3>Ciclo de receita</h3><p>Deteção de episódios com risco de rejeição antes da faturação e redução do prazo médio de recebimento.</p><div className="kpi">+4,2 M€ receita recuperada/ano</div></div>
    <div className="glass use"><div className="ico">♡</div><h3>Doente 360° e MY LUZ</h3><p>Próxima melhor ação personalizada: rastreios em atraso, consultas de seguimento e adesão ao LUZ ON PRIME.</p><div className="kpi">+12% adesão a seguimentos</div></div>
    <div className="glass use"><div className="ico">✎</div><h3>Notas clínicas com IA</h3><p>Codificação assistida CID-10 e extração estruturada de altas e relatórios com Cortex AI.</p><div className="kpi">−60% tempo de codificação</div></div>
    <div className="glass use"><div className="ico">⌁</div><h3>Bloco operatório</h3><p>Previsão de duração cirúrgica e otimização do plano operatório semanal.</p><div className="kpi">+9% utilização de salas</div></div>
    <div className="glass use"><div className="ico">⌂</div><h3>Cuidados sénior</h3><p>Risco de queda e de readmissão em cuidados continuados e residências, com alertas à equipa.</p><div className="kpi">−22% quedas com lesão</div></div>
  </div>
  <p className="lead" style={{ fontSize: 13, marginTop: 18 }}>Valores ilustrativos para efeitos de demonstração.</p>
</section>

<section id="roteiro">
  <h2>Do primeiro dado ao primeiro agente.</h2>
  <div className="road">
    <div className="glass step"><div className="n">Fase 1 · 6 semanas</div><h3>Fundação</h3><p>Ingestão das fontes core, modelo de dados de episódio e governação RGPD.</p></div>
    <div className="glass step"><div className="n">Fase 2 · 8 semanas</div><h3>Insight</h3><p>Portal de inteligência, semantic views e indicadores partilhados por todo o grupo.</p></div>
    <div className="glass step"><div className="n">Fase 3 · 10 semanas</div><h3>Previsão</h3><p>Modelos de afluência, faltas e glosas em produção, com monitorização de drift.</p></div>
    <div className="glass step"><div className="n">Fase 4 · contínuo</div><h3>Agentes</h3><p>Assistentes em português e partilha segura com seguradora e investigação.</p></div>
  </div>
</section>

<section className="final">
  <div className="glass">
    <h2>Veja como seria o seu dia a dia.</h2>
    <p className="lead">Um portal de demonstração com indicadores, modelos preditivos e um assistente de IA, construído sobre o Snowflake.</p>
    <Link className="cta big" to="/portal">Abrir o portal</Link>
  </div>
</section>
<footer>Demonstração. Todos os dados e valores são fictícios e meramente ilustrativos.</footer>
    </div>
  );
}
