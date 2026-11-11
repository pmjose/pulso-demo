import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Kpi, useToast } from '../ui.jsx';
import { nf } from '../data.js';

// Step kinds and how they are drawn.
const KIND = {
  trigger: { label: 'Gatilho', color: '#f5a800', icon: '⚡' },
  sql: { label: 'Cortex Analyst', color: '#2a9fd6', icon: '▦' },
  search: { label: 'Cortex Search', color: '#007c8c', icon: '⌕' },
  model: { label: 'Modelo ML', color: '#6b5bd2', icon: '◈' },
  llm: { label: 'Raciocínio LLM', color: '#9b59d0', icon: '✦' },
  agent: { label: 'Subagente', color: '#00acc1', icon: '◎' },
  approval: { label: 'Aprovação humana', color: '#e4572e', icon: '✋' },
  action: { label: 'Ação', color: '#1f9d6b', icon: '✓' },
};

const A = (id, name, team, autonomy, objective, trigger, kpis, steps, outcome) => ({ id, name, team, autonomy, objective, trigger, kpis, steps, outcome });

const AGENTS = [
  A('coldfront', 'Orquestrador · Plano para a frente fria', 'Direção Clínica', 'Executa com aprovação',
    'Prepara o grupo para um pico de procura previsto, coordenando camas, escalas, stocks e comunicação.',
    'Previsão IPMA: mínima de 6 °C na sexta-feira + vírus respiratórios em subida nas águas residuais (INSA)',
    { runs: 14, saved: '61 h', ok: '93%' },
    [
      ['trigger', 'Sinal externo detetado', 'IPMA: −5 °C na mínima em 48 h · INSA: +38% vírus respiratórios', 'Correlação histórica r = 0,88 com a urgência respiratória (desfasamento 9 d)'],
      ['model', 'Previsão de procura com sinais externos', 'forecast_urgencia_v14 · HL Lisboa, Arrábida, Coimbra', '+21% urgência respiratória sex-dom · ocupação prevista 94,8% no HL Lisboa'],
      ['agent', 'Subagente Gestor de camas', 'Pedir plano de altas e transferências', '22 altas antecipáveis · 6 transferências para o Hospital do Mar'],
      ['agent', 'Subagente Escalas de enfermagem', 'Pedir reforço com custo mínimo', '+5 enfermeiros (bolsa interna) · +2 médicos de urgência · custo 4 180 €'],
      ['agent', 'Subagente Reposição de stocks', 'Verificar oxigénio, antivirais e antibióticos IV', '2 artigos abaixo do stock de segurança · transferência de Coimbra para Lisboa'],
      ['llm', 'Consolidar plano e redigir comunicação', 'Plano único com responsáveis e prazos; mensagem MY LUZ para doentes crónicos', 'Plano com 4 ações e 1 campanha (18 400 doentes DPOC/asma)'],
      ['approval', 'Aprovação da Direção Clínica', 'Plano de contingência · custo total estimado 6 920 €', ''],
      ['action', 'Executar', 'Escalas publicadas · pedidos de transferência criados · campanha MY LUZ agendada para quinta 18h', 'Todas as equipas notificadas'],
    ],
    { headline: 'Plano de contingência ativo em 3 hospitais', metrics: [['Espera prevista na urgência', '74 → 43 min'], ['Ocupação prevista HL Lisboa', '94,8% → 90,1%'], ['Tempo de preparação manual evitado', '≈ 6 h de reuniões']] }),

  A('beds', 'Gestor de camas', 'Gestão de camas', 'Executa com aprovação',
    'Antecipa a falta de camas e propõe altas, transferências e reservas para cirurgias.',
    'Ocupação prevista > 92% em qualquer hospital nas próximas 48 h',
    { runs: 312, saved: '208 h', ok: '88%' },
    [
      ['trigger', 'Ocupação prevista acima do limite', 'HL Lisboa · quinta-feira 93,1%', ''],
      ['sql', 'Doentes internados e altas previstas', 'SELECT … FROM OPERACOES.INTERNAMENTOS WHERE hospital = \'HL Lisboa\'', '497 internados · 61 com alta prevista ≤ 48 h'],
      ['model', 'Probabilidade de alta em 24 h', 'discharge_model_v6 (AUC 0,86)', '22 doentes com probabilidade > 80%'],
      ['search', 'Critérios de transferência', 'Protocolo PC-INT-009 · cuidados continuados', '6 doentes elegíveis para o Hospital do Mar'],
      ['llm', 'Priorizar e justificar', 'Ordenar por impacto e risco clínico', 'Lista de 22 altas e 6 transferências com justificação'],
      ['approval', 'Aprovação do enfermeiro gestor', '28 movimentos propostos', ''],
      ['action', 'Executar', 'Alertas de alta aos médicos assistentes · pedidos de transporte criados', ''],
    ],
    { headline: '28 camas libertadas até quinta-feira às 12h', metrics: [['Ocupação prevista', '93,1% → 88,9%'], ['Cirurgias protegidas', '9'], ['Tempo do gestor poupado', '2 h 40 min']] }),

  A('prior', 'Autorizações prévias', 'Faturação', 'Autónomo dentro de limites',
    'Pede autorizações prévias às seguradoras com a justificação clínica já preenchida.',
    'Nova requisição de exame ou cirurgia com financiador que exige autorização',
    { runs: 4210, saved: '1 120 h', ok: '97%' },
    [
      ['trigger', 'Requisição de RM do joelho', 'Doente Multicare · plano Proteção Vital', ''],
      ['sql', 'Regras de cobertura da apólice', 'Clean Room Fidelidade · coberturas e plafond', 'Exige autorização · plafond disponível 1 840 €'],
      ['search', 'Evidência clínica no processo', 'Notas de Ortopedia, últimos 6 meses', 'Dor persistente 4 meses, falha de fisioterapia, suspeita de rotura de menisco'],
      ['llm', 'Redigir justificação clínica', 'Formato exigido pela Multicare', 'Justificação de 120 palavras com códigos CID-10 M23.2'],
      ['action', 'Submeter à seguradora', 'API de autorizações · resposta em 3 min 40 s', 'Autorizado · n.º AUT-2026-884 102'],
    ],
    { headline: 'Autorização obtida em 4 minutos (antes: 2,3 dias)', metrics: [['Valor protegido', '412 €'], ['Rejeições evitadas no ano', '1 980'], ['Intervenção humana', 'apenas se rejeitado']] }),

  A('denials', 'Prevenção de rejeições', 'Faturação', 'Recomenda',
    'Revê episódios antes da faturação e corrige códigos e anexos em falta.',
    'Episódio fechado com risco de rejeição > 60%',
    { runs: 2870, saved: '640 h', ok: '91%' },
    [
      ['trigger', 'Episódio 25-118 309 fechado', 'Ortopedia · Multicare · 3 602 €', ''],
      ['model', 'Risco de rejeição', 'denial_model_v7 (AUC 0,91)', 'Risco 92% · motivo provável: falta de autorização prévia'],
      ['search', 'Procurar autorização nos documentos', 'Emails, PDF digitalizados, notas', 'Autorização AUT-2026-771 encontrada num PDF não anexado'],
      ['llm', 'Propor correção', 'Anexar autorização e rever código do ato', '1 anexo + 1 código alterado (compatível com o diagnóstico)'],
      ['approval', 'Validação do codificador', 'Correção sugerida', ''],
      ['action', 'Corrigir e submeter', 'Fatura reenviada à Multicare', 'Risco de rejeição: 92% → 6%'],
    ],
    { headline: '3 602 € protegidos neste episódio', metrics: [['Receita recuperada no ano', '4,2 M€'], ['Taxa de rejeição', '4,3% → 3,4%'], ['Prazo de recebimento', '−5 dias']] }),

  A('discharge', 'Seguimento pós-alta', 'Enfermagem', 'Executa com aprovação',
    'Acompanha doentes de alto risco nos 30 dias após a alta e escala quando necessário.',
    'Alta com risco de readmissão > 30% ou dispositivo ligado com alerta',
    { runs: 1840, saved: '410 h', ok: '86%' },
    [
      ['trigger', 'Alerta de dispositivo', 'Manuel Carvalho · +1,5 kg em 3 dias (balança ligada)', ''],
      ['model', 'Risco de readmissão atualizado', 'readmission_model_v4', '41% → 58% com os novos dados'],
      ['search', 'Plano de alta e medicação', 'Carta de alta · HL Arrábida', 'Furosemida iniciada na alta, sem levantamento na farmácia'],
      ['llm', 'Avaliar e propor ação', 'Sinais de descompensação + falta de adesão', 'Teleconsulta de enfermagem amanhã 10h + contacto com a filha'],
      ['approval', 'Aprovação da enfermeira de referência', 'Teleconsulta e contacto familiar', ''],
      ['action', 'Agendar e notificar', 'Teleconsulta LUZ 24 marcada · SMS à filha · alerta ao cardiologista', ''],
    ],
    { headline: 'Intervenção 2 dias antes de uma provável readmissão', metrics: [['Readmissões a 30 dias', '7,4% → 6,1%'], ['Custo médio evitado', '5 200 € por readmissão'], ['Doentes acompanhados', '1 120 ativos']] }),

  A('trials', 'Recrutamento para ensaios', 'Learning Health', 'Recomenda',
    'Encontra doentes elegíveis para ensaios clínicos e prepara o contacto pelo investigador.',
    'Ensaio abaixo de 70% do objetivo de recrutamento',
    { runs: 96, saved: '380 h', ok: '79%' },
    [
      ['trigger', 'LH-ONC-031 abaixo do objetivo', '38 de 60 doentes · prazo 03/2027', ''],
      ['search', 'Critérios de inclusão e exclusão', 'Protocolo do ensaio (PDF, 84 páginas)', '14 critérios estruturados'],
      ['sql', 'Pré-seleção no processo clínico', 'Oncologia · estadio, biomarcadores, função renal', '412 candidatos'],
      ['model', 'Correspondência de elegibilidade', 'trial_matching_v2 sobre notas e análises', '112 elegíveis com confiança > 0,8 · todos com consentimento'],
      ['approval', 'Revisão do investigador principal', '112 doentes propostos', ''],
      ['action', 'Preparar contacto', 'Lista no portal do investigador · convites na consulta seguinte', ''],
    ],
    { headline: '112 doentes elegíveis em 6 minutos (antes: 3 semanas)', metrics: [['Previsão de recrutamento completo', 'jan 2027'], ['Revisão manual de processos evitada', '≈ 140 h'], ['Doentes sem consentimento', 'excluídos automaticamente']] }),

  A('staffing', 'Escalas de enfermagem', 'Recursos Humanos', 'Executa com aprovação',
    'Ajusta escalas à procura prevista, respeitando descanso, competências e preferências.',
    'Rácio doentes/enfermeiro previsto acima do alvo num turno',
    { runs: 520, saved: '310 h', ok: '90%' },
    [
      ['trigger', 'Noite de sexta · Medicina Interna HL Lisboa', 'Rácio previsto 10,8 (alvo 7)', ''],
      ['sql', 'Disponibilidade e horas acumuladas', 'RH.ESCALAS · bolsa interna · horas extra do mês', '14 enfermeiros disponíveis'],
      ['model', 'Risco de burnout por colaborador', 'burnout_model_v3', 'Excluídos 3 com risco > 0,5 (ex.: Enf.ª Joana Matos)'],
      ['llm', 'Otimizar escala', 'Mínimo custo, competências e preferências', '2 reforços da bolsa interna · custo 620 €'],
      ['approval', 'Aprovação do enfermeiro-chefe', 'Alteração de escala', ''],
      ['action', 'Publicar escala', 'Notificação na app dos colaboradores', ''],
    ],
    { headline: 'Turno da noite dentro do rácio-alvo', metrics: [['Rácio previsto', '10,8 → 6,9'], ['Horas extra evitadas', '18 h'], ['Colaboradores em risco protegidos', '3']] }),

  A('sepsis', 'Vigilância de sépsis', 'Qualidade clínica', 'Recomenda',
    'Lê sinais vitais e notas em tempo real e alerta a equipa para suspeita de sépsis.',
    'A cada nova medição de sinais vitais ou nota de enfermagem',
    { runs: 182400, saved: '—', ok: '94%' },
    [
      ['trigger', 'Nova nota de enfermagem', 'HL Arrábida · Cama 312', ''],
      ['llm', 'Extrair sinais da nota', 'AI_EXTRACT sobre texto livre', 'Febre 38,9 °C, FC 118, "confuso desde a manhã"'],
      ['model', 'Pontuação de alerta precoce', 'sepsis_ews_v5 + qSOFA', 'Risco 0,81 · qSOFA 2'],
      ['search', 'Protocolo interno', 'PC-URG-014 · sépsis', 'Lactato e hemoculturas antes do antibiótico; antibiótico na 1.ª hora'],
      ['action', 'Alertar a equipa', 'Alerta ao médico de serviço · pedido de lactato sugerido', 'Confirmação pelo médico em 4 min'],
    ],
    { headline: 'Antibiótico administrado 52 min após o alerta', metrics: [['Cumprimento da 1.ª hora', '84% → 92%'], ['Alertas falsos', '1 em 6'], ['Decisão clínica', 'sempre do médico']] }),

  A('stock', 'Reposição de stocks', 'Farmácia e logística', 'Autónomo dentro de limites',
    'Prevê consumo, transfere entre hospitais e cria encomendas no ERP dentro de limites aprovados.',
    'Cobertura prevista < 7 dias para artigo crítico',
    { runs: 940, saved: '260 h', ok: '98%' },
    [
      ['trigger', 'Contraste iodado 350 · HL Lisboa', 'Cobertura prevista: 4 dias', ''],
      ['model', 'Procura a 14 dias', 'demand_forecast_v9 (inclui plano operatório)', '1 240 unidades necessárias'],
      ['sql', 'Stock noutros hospitais', 'ERP · stocks e validades', 'HL Coimbra com 380 unidades a expirar em 60 dias'],
      ['llm', 'Decidir transferência vs. compra', 'Custo, prazo e validade', 'Transferir 380 de Coimbra + encomendar 900'],
      ['action', 'Executar no ERP', 'Guia de transferência + encomenda (limite 25 000 €)', 'Encomenda ENC-26-55 120 · 18 400 €'],
    ],
    { headline: 'Rutura evitada e 6 200 € de validades recuperados', metrics: [['Ruturas evitadas (30 d)', '27'], ['Stock imobilizado', '−1,8 M€'], ['Acima do limite', 'pede aprovação']] }),

  A('complaints', 'Reclamações e experiência', 'Experiência do doente', 'Executa com aprovação',
    'Classifica reclamações, encontra a causa e prepara a resposta personalizada.',
    'Nova reclamação (app, email ou Livro de Reclamações)',
    { runs: 3120, saved: '520 h', ok: '89%' },
    [
      ['trigger', 'Nova reclamação na app', '"A fatura veio com um valor que não percebo"', ''],
      ['llm', 'Classificar e medir sentimento', 'AI_CLASSIFY + AI_SENTIMENT', 'Faturação · sentimento −0,62 · cliente LUZ ON PRIME'],
      ['sql', 'Faturas e coberturas do doente', 'Faturação + apólice Multicare', 'Copagamento de 46,20 € por plafond de exames esgotado'],
      ['llm', 'Redigir resposta', 'Tom institucional, explicação clara do copagamento', 'Resposta com detalhe do plafond e opção de pagamento fracionado'],
      ['approval', 'Revisão pela equipa de apoio', 'Resposta pronta a enviar', ''],
      ['action', 'Enviar e registar', 'Resposta na app · caso fechado no CRM', ''],
    ],
    { headline: 'Resposta enviada em 11 minutos (antes: 6 dias)', metrics: [['Tempo médio de resposta', '6 d → 4 h'], ['NPS após resposta', '+18 pontos'], ['Causas recorrentes', 'reportadas semanalmente']] }),

  A('finops', 'FinOps da plataforma', 'Sistemas de Informação', 'Recomenda',
    'Vigia o consumo do Snowflake e propõe ajustes de warehouses e consultas.',
    'Consumo diário acima de 120% da média de 7 dias',
    { runs: 44, saved: '—', ok: '100%' },
    [
      ['trigger', 'Pico de consumo no WH_DS_ML', '+64% vs. média de 7 dias', ''],
      ['sql', 'Consultas mais caras', 'SNOWFLAKE.ACCOUNT_USAGE.QUERY_HISTORY', 'Treino semanal repetido 3 vezes por erro de agendamento'],
      ['llm', 'Propor correção', 'Agendamento e dimensionamento', 'Corrigir tarefa duplicada + suspensão automática a 60 s'],
      ['approval', 'Aprovação da equipa de dados', 'Alteração de tarefa e warehouse', ''],
      ['action', 'Aplicar', 'ALTER TASK … SUSPEND · ALTER WAREHOUSE … AUTO_SUSPEND = 60', ''],
    ],
    { headline: '41 créditos poupados por semana', metrics: [['Poupança anual estimada', '≈ 6 400 €'], ['Previsão do mês', '94% → 87% do orçamento'], ['Alterações em produção', 'sempre com aprovação']] }),
];

const AUTONOMY = { 'Recomenda': 'p-ml', 'Executa com aprovação': 'p-warn', 'Autónomo dentro de limites': 'p-ok' };

function clock(base, i) {
  const t = new Date(base + i * 1700);
  return t.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function Agents() {
  const location = useLocation();
  const toast = useToast();
  const [sel, setSel] = useState(location.state?.pick || 'coldfront');
  const [step, setStep] = useState(-1);      // index of the step currently shown as done
  const [state, setState] = useState('idle'); // idle | running | waiting | done | rejected
  const t0 = useRef(Date.now());
  const logRef = useRef(null);
  const timer = useRef();
  const agent = AGENTS.find((a) => a.id === sel);

  useEffect(() => { if (location.state?.pick) setSel(location.state.pick); }, [location]);
  useEffect(() => { clearTimeout(timer.current); setStep(-1); setState('idle'); }, [sel]);
  useEffect(() => () => clearTimeout(timer.current), []);

  // Advance one step at a time; pause on approval steps until the user decides.
  useEffect(() => {
    if (state !== 'running') return;
    const next = step + 1;
    if (next >= agent.steps.length) { setState('done'); toast(`${agent.name}: execução concluída`); return; }
    timer.current = setTimeout(() => {
      setStep(next);
      if (agent.steps[next][0] === 'approval') setState('waiting');
    }, next === 0 ? 300 : 1100);
    return () => clearTimeout(timer.current);
  }, [state, step, sel]);

  // Keep the newest step (and the approval prompt) in view.
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [step, state]);

  const run = () => { t0.current = Date.now(); setStep(-1); setState('running'); };
  const approve = () => setState('running');
  const reject = () => { setState('rejected'); toast('Execução cancelada pelo aprovador'); };

  const total = AGENTS.reduce((a, x) => a + x.kpis.runs, 0);

  return (
    <>
      <div className="grid g6">
        <Kpi label="Agentes em produção" value={AGENTS.length} delta="3 autónomos dentro de limites" />
        <Kpi label="Execuções (30 dias)" value={nf(total)} delta="inclui vigilância contínua" tone="up" />
        <Kpi label="Horas de trabalho poupadas" value="3 909 h" delta="≈ 24 profissionais a tempo inteiro" tone="up" />
        <Kpi label="Taxa de aprovação" value="91%" delta="das propostas com aprovação humana" tone="up" />
        <Kpi label="Tempo médio até decisão" value="6 min" delta="vs. 1,8 dias em processo manual" tone="up" />
        <Kpi label="Ações bloqueadas por regras" value="38" delta="limites de valor e permissões" />
      </div>

      <div className="agents" style={{ marginTop: 16 }}>
        <div className="agent-list">
          {AGENTS.map((a) => (
            <button key={a.id} className={`agent-item${a.id === sel ? ' on' : ''}`} onClick={() => setSel(a.id)}>
              <b>{a.name}</b>
              <span>{a.team}</span>
              <span className={`pill ${AUTONOMY[a.autonomy]}`}>{a.autonomy}</span>
            </button>
          ))}
        </div>

        <div>
          <div className="card">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 19 }}>{agent.name}</h3>
                <p className="sub" style={{ margin: '4px 0 0', maxWidth: '70ch' }}>{agent.objective}</p>
              </div>
              <button className="btn pri sp" onClick={run} disabled={state === 'running' || state === 'waiting'}>
                {state === 'idle' ? 'Executar simulação' : state === 'done' || state === 'rejected' ? 'Executar novamente' : 'A executar…'}
              </button>
            </div>
            <div className="trigger"><b>Gatilho</b> {agent.trigger}</div>

            <div className="flow-row" aria-label="Fluxo do agente">
              {agent.steps.map(([k, title], i) => (
                <div key={i} className={`node${i <= step ? ' done' : ''}${i === step && state === 'waiting' ? ' wait' : ''}`} style={{ '--c': KIND[k].color }}>
                  <span className="n-ic">{KIND[k].icon}</span>
                  <small>{KIND[k].label}</small>
                  <b>{title}</b>
                </div>
              ))}
            </div>
          </div>

          <div className="grid g3" style={{ marginTop: 16 }}>
            <div className="card s2">
              <div className="row"><h3>Registo de execução</h3><span className="pill p-teal sp">Rastreável · AI Observability</span></div>
              <div className="log" ref={logRef} aria-live="polite">
                {state === 'idle' && <p className="sub">Carregue em "Executar simulação" para ver o agente a trabalhar passo a passo.</p>}
                {agent.steps.slice(0, step + 1).map(([k, title, detail, out], i) => (
                  <div key={i} className="log-l" style={{ '--c': KIND[k].color }}>
                    <span className="ts">{clock(t0.current, i)}</span>
                    <div>
                      <b>{KIND[k].icon} {title}</b> <small>{KIND[k].label}</small>
                      <div className="det">{detail}</div>
                      {out && <div className="out">→ {out}</div>}
                    </div>
                  </div>
                ))}
                {state === 'running' && <div className="log-l"><span className="ts">…</span><span className="typing"><span /><span /><span /></span></div>}
                {state === 'waiting' && (
                  <div className="approve">
                    <div><b>✋ Aguarda a sua aprovação</b><p>{agent.steps[step][2]}</p></div>
                    <button className="btn pri" onClick={approve}>Aprovar</button>
                    <button className="btn" onClick={reject}>Rejeitar</button>
                  </div>
                )}
                {state === 'rejected' && <div className="out" style={{ color: 'var(--bad)' }}>Execução cancelada. Nenhuma ação foi tomada.</div>}
              </div>
            </div>
            <div className="card">
              {state === 'done' ? (
                <>
                  <span className="pill p-ok">Concluído</span>
                  <h3 style={{ marginTop: 10, fontSize: 17 }}>{agent.outcome.headline}</h3>
                  <div style={{ marginTop: 10 }}>{agent.outcome.metrics.map(([k, v]) => <div key={k} className="metric"><span>{k}</span><b>{v}</b></div>)}</div>
                </>
              ) : (
                <>
                  <h3>Perfil do agente</h3>
                  <p className="sub">Ferramentas e limites</p>
                  <div className="metric"><span>Autonomia</span><span className={`pill ${AUTONOMY[agent.autonomy]}`}>{agent.autonomy}</span></div>
                  <div className="metric"><span>Equipa responsável</span><b>{agent.team}</b></div>
                  <div className="metric"><span>Execuções (30 dias)</span><b>{nf(agent.kpis.runs)}</b></div>
                  <div className="metric"><span>Tempo poupado</span><b>{agent.kpis.saved}</b></div>
                  <div className="metric"><span>Propostas aceites</span><b>{agent.kpis.ok}</b></div>
                  <div className="metric"><span>Ferramentas</span><b>{[...new Set(agent.steps.map(([k]) => KIND[k].label).filter((l) => !['Gatilho', 'Ação', 'Aprovação humana'].includes(l)))].join(', ')}</b></div>
                  <p className="sub" style={{ marginTop: 12, marginBottom: 0 }}>Atua com as permissões do utilizador responsável. Todas as chamadas ficam registadas.</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Card style={{ marginTop: 16 }} title="Atividade recente dos agentes" sub="Últimas execuções em todo o grupo">
        <table className="tabular">
          <thead><tr><th>Hora</th><th>Agente</th><th>Hospital</th><th>Resultado</th><th>Estado</th></tr></thead>
          <tbody>{[
            ['10:42', 'Autorizações prévias', 'HL Torres de Lisboa', 'RM lombar autorizada pela Médis em 2 min', 'p-ok', 'Autónomo'],
            ['10:38', 'Vigilância de sépsis', 'HL Arrábida', 'Alerta cama 312 · lactato pedido', 'p-ok', 'Confirmado'],
            ['10:21', 'Gestor de camas', 'HL Lisboa', '28 movimentos propostos', 'p-warn', 'Aguarda aprovação'],
            ['10:05', 'Reposição de stocks', 'HL Coimbra', 'Transferência de 380 unidades para HL Lisboa', 'p-ok', 'Autónomo'],
            ['09:57', 'Prevenção de rejeições', 'HL Setúbal', '14 episódios corrigidos · 41 200 €', 'p-ok', 'Validado'],
            ['09:40', 'Reclamações e experiência', 'Grupo', '23 respostas preparadas', 'p-warn', 'Em revisão'],
            ['09:12', 'Escalas de enfermagem', 'HL Leiria', 'Reforço rejeitado: orçamento esgotado', 'p-bad', 'Rejeitado'],
          ].map(([t, a, h, r, c, st]) => (
            <tr key={t + a}><td>{t}</td><td><b>{a}</b></td><td>{h}</td><td>{r}</td><td><span className={`pill ${c}`}>{st}</span></td></tr>))}</tbody>
        </table>
      </Card>
    </>
  );
}
