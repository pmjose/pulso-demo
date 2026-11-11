import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Chart, Kpi, PageTabs } from '../ui.jsx';
import { C } from '../data.js';

// ---------- Arquitetura da plataforma (Diretor de Dados e CIO) ----------
// Source systems: domain, system, product, data, volume per day, integration, freshness.
// Freshness matches the pipelines on Observabilidade.
const SOURCES = [
  ['Clínico', 'Processo clínico eletrónico (HIS)', 'ALERT® / Glintt HIS', 'Episódios ADT, diagnósticos ICD-10, prescrições, sinais vitais, notas', '1,2 M eventos', 'HL7 v2 · motor de integração → Snowpipe Streaming', '< 1 min'],
  ['Clínico', 'Urgência e triagem de Manchester', 'Módulo de urgência do HIS', 'Episódios, prioridade, tempos por etapa', '84 mil eventos', 'HL7 v2 / FHIR R4 → Snowpipe Streaming', '< 1 min'],
  ['Clínico', 'Bloco operatório e registo cirúrgico', 'Módulo de bloco do HIS', 'Planos, tempos de sala, equipas, checklist OMS', '22 mil eventos', 'HL7 SIU / FHIR Procedure → Snowpipe Streaming', '< 1 min'],
  ['Clínico', 'Laboratório (LIS)', 'Clinidata®', 'Pedidos e resultados codificados em LOINC', '310 mil resultados', 'HL7 ORU → Snowpipe Streaming', '5 min'],
  ['Clínico', 'Imagiologia (RIS e PACS)', 'Agfa Enterprise Imaging', 'Relatórios, metadados DICOM (as imagens ficam no PACS)', '210 mil registos', 'DICOM SR e ficheiros → Snowpipe', '30 min'],
  ['Clínico', 'Monitorização à cabeceira (UCI e bloco)', 'Philips IntelliVue · Capsule', 'Séries temporais de sinais vitais', '48 M leituras', 'Kafka → Snowpipe Streaming', 'segundos'],
  ['Clínico', 'Farmácia hospitalar e dispensa automática', 'Glintt · Omnicell', 'Validação, dispensa, stock por armário', '96 mil movimentos', 'CDC · Openflow', '15 min'],
  ['Clínico', 'Esterilização e rastreio de kits', 'Getinge T-DOC', 'Ciclos, caixas, rastreabilidade por doente', '7 mil ciclos', 'API REST · Openflow', '5 min'],
  ['Clínico', 'Ensaios clínicos e investigação', 'REDCap', 'Formulários de estudo, recrutamento', '3 mil registos', 'API · Openflow', 'diária'],
  ['Financeiro', 'Faturação clínica e convenções', 'Módulo de faturação do HIS', 'Atos, faturas, rejeições, notas de crédito', '3,4 M linhas', 'CDC · Openflow', '15 min'],
  ['Financeiro', 'ERP · finanças, compras e stocks', 'SAP S/4HANA', 'FI/CO, MM, ativos, fornecedores', '960 mil linhas', 'Openflow · conector SAP', '15 min'],
  ['Financeiro', 'Seguradoras · autorizações e respostas', 'Multicare, Médis, AdvanceCare', 'Pedidos de autorização, respostas, motivos de rejeição', '41 mil mensagens', 'API e EDI · Openflow', 'horária'],
  ['Financeiro', 'Subsistemas e SNS', 'ADSE Direta · SPMS (RSE, CTH)', 'Comparticipações, referenciação, convenções', '18 mil registos', 'SFTP e API → Snowpipe', 'diária'],
  ['Pessoas', 'Recursos humanos e formação', 'SAP SuccessFactors', 'Colaboradores, carreiras, avaliação, formação', '14 mil perfis', 'OData · Openflow', 'diária'],
  ['Pessoas', 'Escalas e assiduidade', 'UKG Workforce Central', 'Turnos, horas extra, ausências', '62 mil registos', 'API · Openflow', '15 min'],
  ['Cliente', 'App e site MY LUZ', 'Plataforma digital própria', 'Sessões, marcações, check-in, pagamentos', '6,8 M eventos', 'Kafka → Snowpipe Streaming', '< 1 min'],
  ['Cliente', 'CRM e campanhas', 'Salesforce Health Cloud', 'Contactos, campanhas, oportunidades corporativas', '240 mil registos', 'Openflow · conector Salesforce', '15 min'],
  ['Cliente', 'Centro de contacto', 'Genesys Cloud CX', 'Chamadas, chat, gravações (transcritas com IA)', '22 mil interações', 'API e ficheiros de áudio → stage', 'horária'],
  ['Cliente', 'Inquéritos e reclamações', 'Qualtrics · Livro de Reclamações', 'NPS, comentários livres, reclamações', '9 mil respostas', 'API · Openflow', 'diária'],
  ['Documentos', 'Documentos clínicos e administrativos', 'Arquivo digital', 'PDF de relatórios externos, consentimentos, faturas digitalizadas', '35 mil documentos', 'Stage interno · AI_PARSE_DOCUMENT', 'diária'],
  ['Externo', 'Sinais externos', 'IPMA, INSA, APA QualAr, INE, Google Trends', 'Meteorologia, águas residuais, qualidade do ar, demografia, pesquisas', '13 fontes', 'Snowflake Marketplace · partilha sem cópias', 'diária'],
  ['Externo', 'Parceiro · Fidelidade', 'Data Clean Room', 'Sinistralidade e utilização agregada (sem dados individuais)', 'agregados', 'Snowflake Data Clean Rooms', 'diária'],
];
const DOMAIN_COLOR = { Clínico: C.teal, Financeiro: C.sun, Pessoas: C.violet, Cliente: C.sky, Documentos: C.grey, Externo: C.ok };

const PATTERNS = [
  ['Streaming de eventos clínicos', 'HL7 v2 e FHIR R4 → motor de integração → Snowpipe Streaming', 'ADT, urgência, bloco, laboratório', 'segundos'],
  ['Streaming de dispositivos e app', 'Kafka → Snowflake Connector for Kafka (Snowpipe Streaming)', 'Monitores, MY LUZ', 'segundos'],
  ['Replicação de bases de dados (CDC)', 'Openflow · CDC de Oracle e SQL Server', 'Faturação, farmácia', '≤ 15 min'],
  ['Aplicações SaaS e SAP', 'Conectores Openflow (SAP, Salesforce, SuccessFactors)', 'ERP, CRM, RH', '≤ 15 min'],
  ['Ficheiros e documentos', 'SFTP / S3 → Snowpipe auto-ingest · AI_PARSE_DOCUMENT', 'ADSE, PACS, documentos', '≤ 30 min'],
  ['Dados de terceiros sem cópias', 'Snowflake Marketplace · Secure Data Sharing', 'IPMA, INSA, INE', 'diária'],
  ['Colaboração com parceiros', 'Snowflake Data Clean Rooms', 'Fidelidade', 'diária'],
  ['Formato aberto para investigação', 'Apache Iceberg™ · Horizon Catalog', 'OMOP com parceiros académicos', 'diária'],
  ['Devolver às aplicações (reverse ETL)', 'Openflow · APIs · Snowflake Notifications', 'CRM, HIS, Teams, email', 'minutos'],
];

const DATA_TYPES = [
  ['Estruturados', 'Episódios, faturação, ERP, escalas', 'Tabelas Snowflake', 41, C.teal],
  ['Semiestruturados', 'Mensagens HL7, recursos FHIR, eventos JSON', 'VARIANT · FLATTEN', 27, C.sky],
  ['Séries temporais', 'Sinais vitais, sensores, eventos da app', 'Tabelas com clustering por tempo', 18, C.violet],
  ['Não estruturados', 'Notas clínicas, PDF, áudio do centro de contacto', 'Stages · Cortex AI · Cortex Search', 11, C.sun],
  ['Externos e partilhados', 'Marketplace, Clean Room', 'Partilha sem cópias', 3, C.ok],
];

const LAYERS = [
  ['RAW', 'Dados tal como chegam', 'Uma tabela por fonte, VARIANT para HL7/FHIR, Time Travel de 90 dias, sem transformações', C.grey],
  ['CONFORMED', 'Limpos e harmonizados', 'Deduplicação, índice mestre de doentes (MPI), terminologias ICD-10, SNOMED CT, LOINC e ATC, datas e unidades normalizadas', C.sky],
  ['CORE', 'Modelos de domínio', 'Episódio, Doente 360°, Colaborador 360°, Cirurgia, Fatura, Stock · modelo OMOP CDM 5.4 para Learning Health', C.teal],
  ['SEMANTIC', 'Linguagem do negócio', '10 semantic views certificadas com métricas, sinónimos e relações; uma só definição para portal, Luz IA e Power BI', C.violet],
  ['FEATURES', 'Dados para modelos', 'Feature Store com 312 variáveis versionadas (risco clínico, procura, pessoas)', C.coral],
];

const SV = ['SV_OPERACOES', 'SV_URGENCIA', 'SV_INTERNAMENTOS', 'SV_BLOCO', 'SV_AMBULATORIO', 'SV_RECEITA', 'SV_FINANCAS', 'SV_QUALIDADE', 'SV_PESSOAS', 'SV_EXPERIENCIA'];

const AI = [
  ['Cortex AISQL', 'AI_CLASSIFY, AI_EXTRACT, AI_COMPLETE, AI_TRANSCRIBE em SQL', 'Motivos de rejeição, notas clínicas, chamadas transcritas'],
  ['Cortex Search', 'Pesquisa híbrida sobre texto e documentos', 'Normas clínicas, protocolos, processo do doente'],
  ['Cortex Analyst', 'Perguntas em linguagem natural sobre as semantic views', 'Assistente Luz IA, perguntas da gestão'],
  ['Cortex Agents · Snowflake Intelligence', 'Agentes que planeiam, usam ferramentas e pedem aprovação', 'Autorizações, plano operatório, pré-operatório'],
  ['Snowflake ML', 'Treino com Container Runtime (CPU/GPU), Feature Store, Model Registry', '19 modelos preditivos'],
  ['AI Observability', 'Avaliação, rastreabilidade e custos de cada execução', 'Agentes e respostas da Luz IA'],
];

const CONSUME = [
  ['Portal de Inteligência', 'Aplicação React em Snowpark Container Services', '1 840 utilizadores'],
  ['Luz IA', 'Snowflake Intelligence e copiloto em todas as páginas', 'Diretores e chefias'],
  ['Power BI', 'Ligação às semantic views (DirectQuery)', 'Relatórios existentes'],
  ['App MY LUZ', 'APIs com recomendações personalizadas', '1,6 M clientes'],
  ['Alertas', 'Snowflake Tasks e Notifications → Teams, email, app', 'Subscrições por perfil'],
  ['Acionistas e parceiros', 'Secure Data Sharing de indicadores agregados', 'Fidelidade, Macquarie'],
];

const SECURITY = [
  ['Classificação automática', 'Horizon deteta e etiqueta dados pessoais e de saúde (PII/PHI) em todas as tabelas novas'],
  ['Máscaras por perfil', 'Médicos veem dados clínicos; Finanças vê o episódio sem diagnóstico; Analistas veem dados pseudonimizados'],
  ['Acesso por hospital', 'Row access policies: cada direção hospitalar vê o seu hospital; a Comissão Executiva vê o grupo'],
  ['Consentimentos', 'Os consentimentos do MY LUZ alimentam políticas que excluem automaticamente quem não autorizou Learning Health'],
  ['Pseudonimização para investigação', 'Identificadores substituídos por chaves irreversíveis; datas deslocadas por doente'],
  ['Auditoria completa', 'Access History regista quem viu que coluna, quando e porquê'],
  ['Chaves e rede', 'Tri-Secret Secure (chaves geridas pela Luz Saúde no AWS KMS) · AWS PrivateLink · sem acesso público'],
  ['Identidade', 'SSO com Microsoft Entra ID, SCIM e MFA obrigatória'],
  ['Residência e continuidade', 'Dados na UE (AWS Frankfurt) · réplica com failover para AWS Irlanda'],
];
const COMPLIANCE = ['RGPD', 'Lei n.º 58/2019', 'Sigilo médico', 'Diretiva NIS2', 'ISO/IEC 27001', 'SOC 2 Type II', 'HITRUST'];

const OPS = [
  ['Produtos de dados por domínio', 'Cada domínio (Clínico, Financeiro, Pessoas, Cliente) tem um responsável de negócio e um responsável técnico'],
  ['Código versionado', 'dbt Projects on Snowflake e Snowflake CLI em Git; revisão obrigatória antes de produção'],
  ['CI/CD', 'GitHub Actions: testes de dados, validação das semantic views e deploy automático'],
  ['Ambientes sem cópias', 'DEV e TESTE criados com zero-copy cloning de produção, com máscaras aplicadas'],
  ['Qualidade contínua', 'Data Metric Functions e testes dbt em cada camada; resultados na Observabilidade'],
  ['Centro de competências', '14 pessoas: plataforma (4), engenharia (5), analítica (3), ciência de dados (2)'],
];

const ROADMAP = [
  ['Fase 1', 'jan-mar 2026', 'Fundação', 'Conta, segurança, ERP, faturação, operações; primeiras semantic views', 'done'],
  ['Fase 2', 'abr-jul 2026', 'Clínico e 360°', 'HIS em streaming, laboratório, imagiologia, MPI, Doente e Colaborador 360°', 'done'],
  ['Fase 3', 'ago-dez 2026', 'IA e agentes', 'Luz IA, agentes com aprovação humana, bloco operatório, sinais externos', 'now'],
  ['Fase 4', '2027', 'Ecossistema', 'Write-back para o HIS, localização em tempo real, Iceberg com parceiros académicos, genómica', 'next'],
];

const CODE = [
  ['Ingestão → modelo', `-- Episódios atualizados em contínuo a partir das mensagens HL7
CREATE OR REPLACE DYNAMIC TABLE CORE.EPISODIO
  TARGET_LAG = '1 minute'
  WAREHOUSE = WH_TRANSFORM
AS
SELECT
  m.msg:PID.3::STRING            AS id_doente,
  m.msg:PV1.19::STRING           AS id_episodio,
  m.msg:PV1.3.4::STRING          AS hospital,
  TRY_TO_TIMESTAMP(m.msg:PV1.44::STRING, 'YYYYMMDDHH24MISS') AS data_admissao,
  TRY_TO_TIMESTAMP(m.msg:PV1.45::STRING, 'YYYYMMDDHH24MISS') AS data_alta
FROM RAW.HL7_ADT m
QUALIFY ROW_NUMBER() OVER (PARTITION BY id_episodio
                           ORDER BY m.recebido_em DESC) = 1;`],
  ['Governança', `-- Diagnóstico visível apenas a perfis clínicos
CREATE MASKING POLICY GOV.MASK_DIAGNOSTICO AS (v STRING)
RETURNS STRING ->
  CASE WHEN IS_ROLE_IN_SESSION('CLINICO') THEN v
       ELSE '*** reservado ***' END;

ALTER TABLE CORE.EPISODIO MODIFY COLUMN diagnostico
  SET MASKING POLICY GOV.MASK_DIAGNOSTICO;

-- Cada direção hospitalar vê apenas o seu hospital
ALTER TABLE CORE.EPISODIO
  ADD ROW ACCESS POLICY GOV.RAP_HOSPITAL ON (hospital);`],
  ['IA em SQL', `-- Classificar motivos de rejeição das seguradoras
SELECT id_fatura, seguradora,
  AI_CLASSIFY(texto_resposta,
    ['Autorização prévia em falta', 'Código de ato',
     'Fora da cobertura', 'Outros']):labels[0]::STRING AS motivo
FROM CORE.RESPOSTA_SEGURADORA
WHERE data_resposta >= DATEADD(day, -7, CURRENT_DATE());`],
];

function Code() {
  const [i, setI] = useState(0);
  return (
    <>
      <div className="switch" role="tablist" aria-label="Exemplos de código">{CODE.map(([n], k) => <button key={n} role="tab" aria-selected={k === i} className={k === i ? 'on' : ''} onClick={() => setI(k)}>{n}</button>)}</div>
      <pre className="arch-code">{CODE[i][1]}</pre>
    </>
  );
}

export function Architecture() {
  const navigate = useNavigate();
  const [dom, setDom] = useState('');
  const shown = SOURCES.filter((s) => !dom || s[0] === dom);
  const byDom = Object.keys(DOMAIN_COLOR).map((d) => [d, SOURCES.filter((s) => s[0] === d).length]);
  return (
    <>
      <div className="arch-note" role="note">Arquitetura de referência. Os produtos indicados são sistemas comuns em hospitais portugueses; o mapeamento final resulta do levantamento com as equipas da Luz Saúde.</div>
      <div className="grid g6" style={{ marginTop: 16 }}>
        <Kpi label="Sistemas fonte ligados" value={String(SOURCES.length)} delta={`${byDom.length} domínios · 9 padrões de integração`} tone="up" />
        <Kpi label="Dados na plataforma" value="186 TB" delta="comprimidos · imagens ficam no PACS" />
        <Kpi label="Ingestão diária" value="640 GB" delta="≈ 60 M eventos por dia" />
        <Kpi label="Fontes em tempo real" value={String(SOURCES.filter((s) => s[6] === '< 1 min' || s[6] === 'segundos').length)} delta="frescura inferior a 1 minuto" tone="up" />
        <Kpi label="Cópias de dados para BI" value="0" delta="uma plataforma, uma definição" tone="up" />
        <Kpi label="Semantic views certificadas" value="10" delta="portal, Luz IA e Power BI" tone="up" />
      </div>
      <PageTabs label="Secções" tabs={[
        ['Visão de conjunto', () => (
          <>
          <Card style={{ marginTop: 16 }} title="Visão de conjunto" sub="Das aplicações da Luz Saúde até às decisões, numa só plataforma governada">
            <div className="arch">
              <div className="arch-col">
                <h4>Fontes</h4>
                {byDom.map(([d, n]) => <div key={d} className="arch-box" style={{ '--c': DOMAIN_COLOR[d] }}><b>{d}</b><small>{n} {n === 1 ? 'sistema' : 'sistemas'}</small></div>)}
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-col">
                <h4>Integração</h4>
                {['Snowpipe Streaming', 'Openflow (CDC, SAP, SaaS)', 'Kafka', 'Snowpipe (ficheiros)', 'Marketplace e partilha', 'Data Clean Rooms'].map((t) => <div key={t} className="arch-box" style={{ '--c': C.sky }}><b>{t}</b></div>)}
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-col arch-sf">
                <h4>Snowflake AI Data Cloud</h4>
                {LAYERS.map(([n, s, , c]) => <div key={n} className="arch-box" style={{ '--c': c }}><b>{n}</b><small>{s}</small></div>)}
                <div className="arch-box" style={{ '--c': C.coral }}><b>Cortex AI e Snowflake ML</b><small>LLM, agentes, pesquisa, modelos</small></div>
              </div>
              <div className="arch-arrow">→</div>
              <div className="arch-col">
                <h4>Consumo</h4>
                {CONSUME.map(([n]) => <div key={n} className="arch-box" style={{ '--c': C.ok }}><b>{n}</b></div>)}
              </div>
            </div>
            <div className="arch-gov"><b>Governança transversal · Horizon</b><span>classificação</span><span>máscaras</span><span>acesso por hospital</span><span>consentimentos</span><span>linhagem</span><span>auditoria</span><span>qualidade</span></div>
          </Card>
          <Card style={{ marginTop: 16 }} title="Plano de implementação" sub="Entregas por fases, cada uma com valor para o negócio">
            <div className="arch-road">
              {ROADMAP.map(([f, when, n, d, st]) => (
                <div key={f} className={`arch-phase ${st}`}>
                  <small>{f} · {when}</small><b>{n}</b><p>{d}</p>
                  <span className={`pill ${st === 'done' ? 'p-ok' : st === 'now' ? 'p-warn' : ''}`}>{st === 'done' ? 'Concluída' : st === 'now' ? 'Em curso' : 'Planeada'}</span>
                </div>
              ))}
            </div>
          </Card>
          </>
        )],
        ['Sistemas fonte', () => (
          <>
          <Card style={{ marginTop: 16 }} title="Sistemas fonte" sub="O que se liga, que dados traz, como entra e com que frescura"
            pill={`${shown.length} sistemas`}>
            <div className="switch" role="tablist" aria-label="Domínio" style={{ marginBottom: 10 }}>
              {['', ...Object.keys(DOMAIN_COLOR)].map((d) => <button key={d || 'all'} role="tab" aria-selected={d === dom} className={d === dom ? 'on' : ''} onClick={() => setDom(d)}>{d || 'Todos'}</button>)}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="tabular">
                <thead><tr><th>Domínio</th><th>Sistema</th><th>Produto</th><th>Dados</th><th>Volume por dia</th><th>Integração</th><th>Frescura</th></tr></thead>
                <tbody>{shown.map(([d, s, p, t, v, i, f]) => <tr key={s}><td><span className="arch-dot" style={{ background: DOMAIN_COLOR[d] }} />{d}</td><td><b>{s}</b></td><td>{p}</td><td>{t}</td><td>{v}</td><td>{i}</td><td>{f}</td></tr>)}</tbody>
              </table>
            </div>
          </Card>
          </>
        )],
        ['Integração e dados', () => (
          <>
          <Card style={{ marginTop: 16 }} title="Padrões de integração" sub="Um padrão por tipo de fonte, sem ferramentas de ETL externas">
            <div style={{ overflowX: 'auto' }}><table className="tabular">
              <thead><tr><th>Padrão</th><th>Tecnologia</th><th>Usado em</th><th>Latência</th></tr></thead>
              <tbody>{PATTERNS.map(([a, b, c, d]) => <tr key={a}><td><b>{a}</b></td><td>{b}</td><td>{c}</td><td>{d}</td></tr>)}</tbody>
            </table></div>
          </Card>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <Card title="Tipos de dados" sub="% do volume armazenado">
              <Chart type="donut" ai={{ action: 'Ligar as gravações do centro de contacto ao AI_TRANSCRIBE para alargar os dados não estruturados disponíveis.', impact: 'Os motivos de contacto passam a entrar nos indicadores de experiência do cliente.' }}
                opts={{ center: '186 TB', centerLabel: 'total', items: DATA_TYPES.map(([l, , , v, c]) => ({ label: l, value: v, color: c })) }} />
              {DATA_TYPES.map(([l, ex, how, , c]) => <div key={l} className="arch-dt" style={{ '--c': c }}><b>{l}</b><span>{ex}</span><small>{how}</small></div>)}
            </Card>
            <Card title="Fontes por domínio" sub="Sistemas ligados">
              <Chart type="bars" ai={{ action: 'Priorizar a ligação da localização em tempo real (RTLS) na Fase 4, o domínio clínico com mais impacto ainda por ligar.', impact: 'Permite medir tempos reais de transporte de doentes e de limpeza de salas.' }}
                opts={{ items: byDom.map(([d, n]) => ({ label: d, value: n, color: DOMAIN_COLOR[d] })) }} />
            </Card>
          </div>
          </>
        )],
        ['Transformação e IA', () => (
          <>
          <Card style={{ marginTop: 16 }} title="Transformação em camadas" sub="Cada camada tem testes de qualidade e linhagem automática · dbt Projects on Snowflake e Dynamic Tables">
            <div className="arch-layers">
              {LAYERS.map(([n, s, d, c], k) => (
                <div key={n} className="arch-layer" style={{ '--c': c }}>
                  <span className="arch-step">{k + 1}</span><b>{n}</b><small>{s}</small><p>{d}</p>
                </div>
              ))}
            </div>
            <div className="arch-sv">{SV.map((s) => <code key={s}>{s}</code>)}</div>
            <p className="sub" style={{ margin: '10px 0 0' }}>A linhagem de cada indicador está no <a className="arch-link" onClick={() => navigate('/portal/dicionario')}>Dicionário de indicadores</a>; o estado dos pipelines e a qualidade por domínio estão na <a className="arch-link" onClick={() => navigate('/portal/plataforma')}>Observabilidade</a>.</p>
          </Card>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <Card title="IA e machine learning" sub="Os modelos correm dentro do perímetro de segurança · os dados não saem da plataforma">
              {AI.map(([n, d, u]) => <div key={n} className="arch-row"><b>{n}</b><span>{d}</span><small>{u}</small></div>)}
            </Card>
            <Card title="Consumo" sub="Todos os canais usam as mesmas semantic views e as mesmas regras de acesso">
              {CONSUME.map(([n, d, u]) => <div key={n} className="arch-row"><b>{n}</b><span>{d}</span><small>{u}</small></div>)}
            </Card>
          </div>
          </>
        )],
        ['Segurança e operação', () => (
          <>
          <Card style={{ marginTop: 16 }} title="Segurança, privacidade e conformidade" sub="Dados de saúde protegidos por desenho, não por processo">
              <div className="arch-sec">{SECURITY.map(([n, d]) => <div key={n}><b>{n}</b><span>{d}</span></div>)}</div>
              <div className="arch-badges">{COMPLIANCE.map((c) => <span key={c}>{c}</span>)}</div>
            </Card>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <Card title="Como se opera" sub="Engenharia de dados com práticas de software">
              {OPS.map(([n, d]) => <div key={n} className="arch-row"><b>{n}</b><span>{d}</span></div>)}
            </Card>
            <Card title="Exemplos de código" sub="O que corre na plataforma, em SQL">
              <Code />
            </Card>
          </div>
          </>
        )],
      ]} />
    </>
  );
}
