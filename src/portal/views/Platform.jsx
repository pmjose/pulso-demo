import { useState } from 'react';
import { Card, Chart, Kpi, PageTabs } from '../ui.jsx';
import { C, MODELS, nf, range, seeded } from '../data.js';
import { DICTIONARY } from '../analytics.js';

// ---------- Dicionário de indicadores ----------
export function Dictionary() {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(DICTIONARY[0].label);
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const list = DICTIONARY.filter((d) => !q || norm(d.label + d.domain + d.definition).includes(norm(q)));
  const d = DICTIONARY.find((x) => x.label === sel) || list[0];
  const domains = [...new Set(DICTIONARY.map((x) => x.domain))];
  return (
    <>
      <div className="grid g4">
        <Kpi label="Indicadores definidos" value={DICTIONARY.length} delta={`${domains.length} domínios`} />
        <Kpi label="Certificados" value={DICTIONARY.filter((x) => x.certified).length} delta="validados pelo responsável" tone="up" />
        <Kpi label="Qualidade média dos dados" value={`${nf(DICTIONARY.reduce((a, x) => a + x.quality, 0) / DICTIONARY.length, 1)}%`} delta="testes automáticos diários" tone="up" />
        <Kpi label="Semantic views" value={new Set(DICTIONARY.map((x) => x.sv)).size} delta="fonte única para portal e Luz IA" />
      </div>
      <div className="dict" style={{ marginTop: 16 }}>
        <div className="card">
          <input className="dict-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar indicador…" aria-label="Procurar indicador" />
          <div className="dict-list">
            {list.map((x) => (
              <button key={x.label} className={x.label === d?.label ? 'on' : ''} onClick={() => setSel(x.label)}>
                <b>{x.label}</b><span>{x.domain}{x.certified ? ' · certificado' : ''}</span>
              </button>
            ))}
            {!list.length && <p className="sub">Nenhum indicador encontrado. Experimente outro termo.</p>}
          </div>
        </div>
        {d && (
          <div>
            <Card title={d.label} pill={d.certified ? 'Certificado' : 'Em validação'} pillClass={d.certified ? 'p-ok' : 'p-warn'} sub={`${d.domain} · responsável: ${d.owner}`}>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{d.definition}</p>
              <pre className="code" style={{ marginTop: 12 }}>{d.formula}</pre>
              <div className="grid g4" style={{ marginTop: 14 }}>
                <div className="kpi"><div className="lbl">Atualização</div><div className="v" style={{ fontSize: 17 }}>{d.refresh}</div></div>
                <div className="kpi"><div className="lbl">Qualidade dos dados</div><div className="v" style={{ fontSize: 17, color: d.quality > 98.5 ? C.ok : C.sun }}>{nf(d.quality, 1)}%</div></div>
                <div className="kpi"><div className="lbl">Semantic view</div><div className="v" style={{ fontSize: 17 }}>{d.sv}</div></div>
                <div className="kpi"><div className="lbl">Usado em</div><div className="v" style={{ fontSize: 17 }}>{2 + (d.label.length % 5)} ecrãs</div></div>
              </div>
            </Card>
            <Card style={{ marginTop: 16 }} title="Linhagem" sub="Da origem ao cartão do portal, com as transformações pelo caminho">
              <div className="flow-row">
                {[['Origem', d.sources[0], '#f5a800'], ['Ingestão', 'Openflow · Snowpipe Streaming', '#2a9fd6'], ['Tabela', d.sources[1], '#007c8c'], ['Modelo de dados', 'Dynamic Table · dbt', '#6b5bd2'], ['Semantic view', d.sv, '#00acc1'], ['Consumo', 'Portal · Luz IA · alertas', '#1f9d6b']].map(([k, t, c]) => (
                  <div key={k} className="node done" style={{ '--c': c }}><span className="n-ic">●</span><small>{k}</small><b>{t}</b></div>
                ))}
              </div>
              <p className="sub" style={{ marginTop: 8, marginBottom: 0 }}>Testes de qualidade em cada passo: unicidade, nulos, valores fora do intervalo e frescura.</p>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

// ---------- Observabilidade ----------
const PIPES = [
  ['Processo clínico · ADT', 'HL7 em streaming', '< 1 min', '12:41', '4 s', 'p-ok', 'OK', '1,2 M'],
  ['Urgência · episódios e triagem', 'Snowpipe Streaming', '< 1 min', '12:41', '3 s', 'p-ok', 'OK', '84 mil'],
  ['Faturação e convenções', 'CDC · Openflow', '15 min', '12:14', '2 min 10 s', 'p-warn', 'Atraso de 38 min às 05:12', '3,4 M'],
  ['ERP · compras, stocks, RH', 'CDC · Openflow', '15 min', '12:30', '1 min 42 s', 'p-ok', 'OK', '960 mil'],
  ['App MY LUZ · eventos', 'Kafka · Snowpipe Streaming', '< 1 min', '12:41', '2 s', 'p-ok', 'OK', '6,8 M'],
  ['Imagiologia · RIS e PACS (metadados)', 'Ficheiros · Snowpipe', '30 min', '12:30', '48 s', 'p-ok', 'OK', '210 mil'],
  ['Clean Room · Fidelidade', 'Partilha segura', 'Diária', '06:00', '6 min', 'p-ok', 'OK', 'agregados'],
  ['Sinais externos (IPMA, INSA, QualAr)', 'Marketplace', 'Diária', '06:30', '—', 'p-ok', 'OK', '13 fontes'],
];
const DQ = [['Operações', 99.6], ['Clínico', 98.9], ['Faturação', 99.3], ['Pessoas', 99.1], ['Qualidade', 97.4], ['Experiência', 99.5], ['Logística', 98.6]];

export function Platform() {
  const lat = (() => { const r = seeded('lat'); return { p50: range(14, () => +(0.38 + r() * .12).toFixed(2)), p95: range(14, (i) => +(1.05 + r() * .35 + (i === 9 ? .6 : 0)).toFixed(2)) }; })();
  const prod = MODELS.filter((m) => m.status[1] !== 'Piloto');
  return (
    <>
      <div className="safe-harbor" role="note">
        <b>Declaração de safe harbor</b>
        <p>Esta página serve apenas para demonstrar capacidades de <b>observabilidade</b> da plataforma de dados e IA. Os valores, indicadores de desempenho e níveis de serviço apresentados são <b>fictícios e ilustrativos</b>. Não constituem compromisso de desempenho, disponibilidade, preço ou funcionalidade, nem devem ser usados para decisões de compra. Funcionalidades em pré-visualização podem ser alteradas ou não ficar disponíveis. Os custos de uma implementação real dependem do âmbito, da utilização e das condições contratuais e não são apresentados aqui.</p>
      </div>
      <div className="grid g6" style={{ marginTop: 16 }}>
        <Kpi label="Disponibilidade (30 dias)" value="99,97%" delta="13 min de indisponibilidade" tone="up" />
        <Kpi label="Pipelines com sucesso" value="99,3%" delta="1 atraso hoje (faturação)" tone="up" />
        <Kpi label="Frescura média dos dados" value="6 min" delta="fontes críticas < 1 min" tone="up" />
        <Kpi label="Testes de qualidade aprovados" value="98,7%" delta="4 812 testes hoje" tone="up" />
        <Kpi label="Latência p95 do portal" value="1,2 s" delta="consultas à semantic view" />
        <Kpi label="Utilizadores ativos (30 dias)" value="1 840" delta="▲ 22% em 3 meses" tone="up" />
      </div>
      <PageTabs label="Secções" tabs={[
        ['Dados e pipelines', () => (
          <>
          <Card style={{ marginTop: 16 }} title="Pipelines de dados" sub="Estado de cada fonte, frescura e volume do último ciclo">
            <table className="tabular">
              <thead><tr><th>Fonte</th><th>Ingestão</th><th>Frescura alvo</th><th>Última execução</th><th>Duração</th><th>Registos</th><th>Estado</th></tr></thead>
              <tbody>{PIPES.map(([n, how, sla, last, dur, c, st, rows]) => <tr key={n}><td><b>{n}</b></td><td>{how}</td><td>{sla}</td><td>{last}</td><td>{dur}</td><td>{rows}</td><td><span className={`pill ${c}`}>{st}</span></td></tr>)}</tbody>
            </table>
          </Card>
          <div className="grid g3" style={{ marginTop: 16 }}>
            <Card className="s2" title="Latência das consultas" sub="Segundos · portal e Luz IA · últimos 14 dias">
              <Chart type="line" ai={{ action: 'Ativar materialização na semantic view de Operações para as consultas mais frequentes do portal.', impact: 'O pico de p95 no dia 10 (consultas de fecho de mês) desce para menos de 1,2 s.' }}
                opts={{ labels: range(14, (i) => `${i + 29 > 31 ? i - 2 : i + 29}/${i + 29 > 31 ? 11 : 10}`), unit: ' s', min: 0, max: 2.5, series: [
                  { name: 'p50', color: C.teal, data: lat.p50 }, { name: 'p95', color: C.violet, data: lat.p95 }, { name: 'Objetivo p95 (1,5 s)', color: C.coral, width: 1, data: Array(14).fill(1.5) },
                ] }} />
            </Card>
            <Card title="Qualidade dos dados por domínio" sub="% de testes aprovados hoje">
              <Chart type="bars" ai={{ action: 'Corrigir os testes falhados no domínio Qualidade: registos de IACS com data de deteção em falta.', impact: 'Leva o domínio acima de 98,5% e liberta a certificação do indicador de complicações cirúrgicas.' }}
                opts={{ unit: '%', max: 100, items: DQ.map(([l, v]) => ({ label: l, value: v, target: 98.5, color: v < 98.5 ? C.sun : C.ok })) }} />
            </Card>
          </div>
          </>
        )],
        ['IA e utilização', () => (
          <>
          <div className="grid g3" style={{ marginTop: 16 }}>
            <Card title="Monitorização de modelos" sub="Modelos em produção · drift e volume">
              {prod.slice(0, 7).map((m) => <div key={m.name} className="metric"><span>{m.name}</span><span className={`pill ${m.perf[1] > 0 ? 'p-warn' : 'p-ok'}`}>{m.perf[1] > 0 ? 'Drift' : 'Estável'} · {m.vol}/dia</span></div>)}
            </Card>
            <Card title="Agentes · rastreabilidade" sub="AI Observability · últimos 30 dias">
              {[['Execuções', '196 366'], ['Concluídas sem erro', '99,1%'], ['Chamadas a ferramentas', '1,24 M'], ['Latência média por passo', '1,7 s'], ['Bloqueadas por regras', '38'], ['Avaliação humana positiva', '91%']].map(([k, v]) => <div key={k} className="metric"><span>{k}</span><b>{v}</b></div>)}
            </Card>
            <Card title="Utilização do portal" sub="Últimos 30 dias">
              <Chart type="bars" ai={{ action: 'Promover o resumo matinal aos diretores de serviço, o perfil com menor utilização.', impact: 'Os perfis que recebem o resumo abrem o portal 3× mais e criam mais ações.' }}
                opts={{ items: [['Direção Clínica', 412], ['Direção Financeira', 268], ['Direções hospitalares', 344], ['Enfermagem', 396], ['Recursos Humanos', 118], ['Diretores de serviço', 302]].map(([l, v]) => ({ label: l, value: v, color: C.teal })) }} />
              <div className="metric"><span>Análises de IA geradas</span><b>18 420</b></div>
              <div className="metric"><span>Insights que viraram ação</span><b>23%</b></div>
              <div className="metric"><span>Avaliações 👍 nas análises</span><b>87%</b></div>
            </Card>
          </div>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <Card title="Consultas por canal" sub="Milhares de consultas às semantic views por dia · últimos 14 dias">
              <Chart ai={{ action: 'Ligar os relatórios Power BI restantes às semantic views, em vez de extrações.', impact: 'Uma só definição por indicador em todos os canais e menos 6 extrações noturnas.' }} type="columns" opts={{ labels: range(14, (i) => `${i + 29 > 31 ? i - 2 : i + 29}/${i + 29 > 31 ? 11 : 10}`), stacked: true, series: [
                { name: 'Portal', color: C.teal, data: [38, 41, 40, 22, 20, 44, 42, 43, 41, 40, 23, 21, 46, 44] },
                { name: 'Luz IA', color: C.violet, data: [11, 12, 12, 6, 5, 14, 13, 14, 13, 13, 7, 6, 15, 15] },
                { name: 'Power BI', color: C.sun, data: [9, 9, 10, 3, 3, 10, 9, 10, 10, 9, 3, 3, 10, 10] },
                { name: 'Alertas e APIs', color: C.sky, data: [6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6] },
              ] }} />
            </Card>
            <Card title="Perguntas à Luz IA por tema" sub="Últimos 30 dias">
              <Chart ai={{ action: 'Criar verified queries para as perguntas de Operações mais repetidas.', impact: 'As respostas mais frequentes passam a ser instantâneas e sempre iguais.' }} type="donut" opts={{ center: '18 420', centerLabel: 'perguntas', items: [{ label: 'Operações', value: 34, color: C.teal }, { label: 'Receita e faturação', value: 22, color: C.sun }, { label: 'Pessoas', value: 16, color: C.violet }, { label: 'Qualidade clínica', value: 15, color: C.sky }, { label: 'Outros', value: 13, color: C.grey }] }} />
            </Card>
          </div>
          </>
        )],
      ]} />
    </>
  );
}
