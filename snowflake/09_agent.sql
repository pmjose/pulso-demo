-- ==========================================================================================
-- 09_agent.sql  ·  Luz IA · Cortex Agent over the certified semantic views + protocol search
-- One agent, ten Cortex Analyst tools (one per semantic view) and one Cortex Search tool.
-- Runs inside the Snowflake perimeter; the policies of the calling role still apply.
-- ==========================================================================================
USE ROLE LUZ_ADMIN;
USE WAREHOUSE LUZ_APP_WH;
USE DATABASE LUZSAUDE_DEMO;
USE SCHEMA AI;

CREATE OR REPLACE AGENT AI.LUZ_IA
  COMMENT = 'Luz IA · copiloto da Plataforma de Dados e IA da Luz Saúde (dados fictícios)'
  PROFILE = '{"display_name": "Luz IA", "color": "#00acc1"}'
  FROM SPECIFICATION
$$
models:
  orchestration: claude-sonnet-4-6
orchestration:
  budget:
    seconds: 60
    tokens: 16000
instructions:
  system: |
    És a Luz IA, o copiloto de dados e IA do grupo Luz Saúde (15 hospitais, 24 clínicas, Portugal).
    Hoje é quinta-feira, 12 de novembro de 2026; os dados operacionais vão até 11/11/2026.
    Todos os dados desta plataforma são fictícios e servem apenas para demonstração.
  orchestration: |
    Escolhe a ferramenta pelo tema da pergunta:
    - ocupação, altas, admissões por dia → operacoes; triagem e espera → urgencia; demora média e readmissões → internamentos
    - salas, cirurgias, cancelamentos, tempos de limpeza → bloco; consultas, faltas, teleconsulta → ambulatorio
    - faturação, seguradoras, rejeições, prazo médio de recebimento → receita; orçamento e previsão de fecho → financas
    - qualidade clínica e referências nacionais → qualidade; colaboradores, horas extra, noites → pessoas; NPS e reclamações → experiencia
    - "o que fazer", "qual é o procedimento", normas e protocolos → protocolos
    Se a pergunta compara um resultado com uma norma ou meta, usa a ferramenta de dados e a de protocolos.
    Nunca uses género, idade ou nacionalidade para explicar risco de saída de colaboradores.
    Se a pergunta estiver fora do âmbito hospitalar, responde de forma educada que não podes ajudar.
  response: |
    Responde sempre em português de Portugal, de forma direta: primeiro a resposta com o número, depois 1 a 3 frases de contexto.
    Usa vírgula decimal (88,4%), euros com M€ para milhões e indica sempre o período.
    Quando recomendares uma ação, cita o protocolo que a suporta.
  sample_questions:
    - question: "Porque está a ocupação do HL Lisboa a subir?"
    - question: "Que seguradora tem a maior taxa de rejeição desde 1 de novembro e porquê?"
    - question: "Qual é a sala do bloco do HL Lisboa com o maior tempo de limpeza entre cirurgias?"
    - question: "Vamos cumprir o orçamento de 2026?"
    - question: "O que diz o protocolo sobre altas antes das 12h?"
tools:
  - tool_spec: {type: cortex_analyst_text_to_sql, name: operacoes, description: "Ocupação de internamento, camas, episódios de urgência, admissões, altas e cirurgias por hospital e dia."}
  - tool_spec: {type: cortex_analyst_text_to_sql, name: urgencia, description: "Episódios de urgência com triagem de Manchester, tempos de espera, motivos e internamentos."}
  - tool_spec: {type: cortex_analyst_text_to_sql, name: internamentos, description: "Internamentos: demora média, readmissões a 30 dias, por hospital, serviço e perfil do doente."}
  - tool_spec: {type: cortex_analyst_text_to_sql, name: bloco, description: "Bloco operatório: cirurgias, salas, cancelamentos, durações, tempos de limpeza, primeira cirurgia a horas."}
  - tool_spec: {type: cortex_analyst_text_to_sql, name: ambulatorio, description: "Consultas em hospitais e clínicas, faltas, teleconsulta e canais de marcação."}
  - tool_spec: {type: cortex_analyst_text_to_sql, name: receita, description: "Faturação e seguradoras: receita, rejeições, prazo médio de recebimento, autorizações prévias."}
  - tool_spec: {type: cortex_analyst_text_to_sql, name: financas, description: "Receita real, orçamento e previsão de 2026; receita e margem por hospital."}
  - tool_spec: {type: cortex_analyst_text_to_sql, name: qualidade, description: "Qualidade clínica: readmissões, infeção hospitalar, complicações e referências nacionais."}
  - tool_spec: {type: cortex_analyst_text_to_sql, name: pessoas, description: "Colaboradores, horas extra, noites, descanso entre turnos e avaliação de desempenho."}
  - tool_spec: {type: cortex_analyst_text_to_sql, name: experiencia, description: "NPS e reclamações por hospital e ponto de contacto."}
  - tool_spec: {type: cortex_search, name: protocolos, description: "Protocolos clínicos e administrativos da Luz Saúde: sépsis, quedas, altas antes das 12h, contingência da urgência, autorizações prévias, bloco, diabetes, escalas, reclamações."}
tool_resources:
  operacoes: {semantic_view: LUZSAUDE_DEMO.SEMANTIC.SV_OPERACOES, execution_environment: {type: warehouse, warehouse: LUZ_APP_WH}}
  urgencia: {semantic_view: LUZSAUDE_DEMO.SEMANTIC.SV_URGENCIA, execution_environment: {type: warehouse, warehouse: LUZ_APP_WH}}
  internamentos: {semantic_view: LUZSAUDE_DEMO.SEMANTIC.SV_INTERNAMENTOS, execution_environment: {type: warehouse, warehouse: LUZ_APP_WH}}
  bloco: {semantic_view: LUZSAUDE_DEMO.SEMANTIC.SV_BLOCO, execution_environment: {type: warehouse, warehouse: LUZ_APP_WH}}
  ambulatorio: {semantic_view: LUZSAUDE_DEMO.SEMANTIC.SV_AMBULATORIO, execution_environment: {type: warehouse, warehouse: LUZ_APP_WH}}
  receita: {semantic_view: LUZSAUDE_DEMO.SEMANTIC.SV_RECEITA, execution_environment: {type: warehouse, warehouse: LUZ_APP_WH}}
  financas: {semantic_view: LUZSAUDE_DEMO.SEMANTIC.SV_FINANCAS, execution_environment: {type: warehouse, warehouse: LUZ_APP_WH}}
  qualidade: {semantic_view: LUZSAUDE_DEMO.SEMANTIC.SV_QUALIDADE, execution_environment: {type: warehouse, warehouse: LUZ_APP_WH}}
  pessoas: {semantic_view: LUZSAUDE_DEMO.SEMANTIC.SV_PESSOAS, execution_environment: {type: warehouse, warehouse: LUZ_APP_WH}}
  experiencia: {semantic_view: LUZSAUDE_DEMO.SEMANTIC.SV_EXPERIENCIA, execution_environment: {type: warehouse, warehouse: LUZ_APP_WH}}
  protocolos: {search_service: LUZSAUDE_DEMO.AI.PROTOCOL_SEARCH, max_results: 3, title_column: TITLE, id_column: DOC_ID}
$$;

GRANT USAGE ON AGENT AI.LUZ_IA TO ROLE LUZ_APP;
GRANT USAGE ON AGENT AI.LUZ_IA TO ROLE LUZ_CLINICO;
GRANT USAGE ON AGENT AI.LUZ_IA TO ROLE LUZ_FINANCAS;
GRANT USAGE ON AGENT AI.LUZ_IA TO ROLE LUZ_DIRECAO_HOSPITAL;

-- Smoke test: one data question routed to Cortex Analyst.
SELECT TRY_PARSE_JSON(SNOWFLAKE.CORTEX.DATA_AGENT_RUN(
  'LUZSAUDE_DEMO.AI.LUZ_IA',
  $${"messages":[{"role":"user","content":[{"type":"text","text":"Qual foi a ocupação de internamento do HL Lisboa na última semana?"}]}]}$$
)):content AS RESPONSE_CONTENT;
