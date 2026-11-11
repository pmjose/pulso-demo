import { useNavigate } from 'react-router-dom';
import { ActionButton, Card, Chart, Insight, Kpi } from '../ui.jsx';
import { C, nf } from '../data.js';

const TRIALS = [
  ['LH-ONC-031', 'Oncologia', 'Fase III', 'Imunoterapia adjuvante, cancro do pulmão', 38, 60, 112, '03/2027'],
  ['LH-CAR-014', 'Cardiologia', 'Fase III', 'Anticoagulação após TAVI', 142, 180, 64, '12/2026'],
  ['LH-END-022', 'Endocrinologia', 'Fase IV', 'GLP-1 e remissão da diabetes tipo 2', 214, 240, 391, '09/2026'],
  ['LH-NEU-007', 'Neurologia', 'Fase II', 'Deteção precoce de Parkinson por voz', 61, 120, 37, '06/2027'],
  ['LH-ORT-024', 'Ortopedia', 'Estudo observacional', 'Prótese de joelho robótica vs. convencional', 168, 200, 81, '02/2027'],
  ['LH-INF-011', 'Infeciologia', 'Fase III', 'Vacina VSR em maiores de 65 anos', 402, 450, 1240, '01/2027'],
];
const ACCESS = [
  ['Católica Medical School', 'Coorte de diabetes · fatores de progressão', '48 210 doentes', 'k-anonimato (k = 10)', 'p-ok', 'Aprovado'],
  ['NOVA Medical School', 'Readmissões em insuficiência cardíaca', '12 880 episódios', 'Clean Room', 'p-ok', 'Aprovado'],
  ['Fidelidade', 'Custo de doença crónica por percurso', '1,24 M clientes comuns', 'Clean Room · só agregados', 'p-ok', 'Em curso'],
  ['Startup de imagiologia (piloto 37)', 'IA para triagem de RX de tórax', '96 000 imagens', 'Dados sintéticos + anonimização', 'p-warn', 'Comissão de ética'],
  ['Promotor farmacêutico', 'Viabilidade de ensaio em oncologia', 'Contagens por critério', 'Privacidade diferencial', 'p-ml', 'Em análise'],
];
const PIPE = [['Candidaturas de startups e PME', 312], ['Avaliadas pela Learning Health', 118], ['Selecionadas para piloto', 50], ['Pilotos concluídos', 31], ['Em produção', 9]];

export function Research() {
  const navigate = useNavigate();
  return (
    <>
      <div className="grid g6">
        <Kpi label="Ensaios clínicos ativos" value="64" delta="22 de promotor, 42 académicos" tone="up" />
        <Kpi label="Doentes em ensaio" value="1 284" delta="▲ 19% homólogo" tone="up" />
        <Kpi label="Elegíveis identificados por IA" value="1 925" delta="últimos 30 dias" tone="up" />
        <Kpi label="Publicações em 2026" value="312" delta="Fator de impacto médio 6,1" />
        <Kpi label="Sessões de simulação" value="1 940" delta="Centro de Simulação · ano" />
        <Kpi label="Pilotos de inovação" value="50" delta="9 já em produção" tone="up" />
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Recrutamento para ensaios clínicos" pill="ML · correspondência de elegibilidade" sub="Doentes elegíveis identificados automaticamente a partir do processo clínico, com consentimento para investigação">
          <table className="tabular">
            <thead><tr><th>Ensaio</th><th>Área</th><th>Fase</th><th>Recrutamento</th><th>Elegíveis (IA)</th><th>Fim previsto</th></tr></thead>
            <tbody>{TRIALS.map(([code, area, phase, title, n, target, elig, end]) => (
              <tr key={code}>
                <td><b>{code}</b><br /><small style={{ color: 'var(--muted)' }}>{title}</small></td><td>{area}</td><td>{phase}</td>
                <td style={{ minWidth: 150 }}><div className="metric" style={{ border: 0, padding: 0 }}><span>{n} / {target}</span><b>{Math.round(n / target * 100)}%</b></div>
                  <div className="progress" style={{ marginTop: 4 }}><i style={{ width: `${n / target * 100}%`, background: n / target < .5 ? C.coral : C.teal }} /></div></td>
                <td><span className="pill p-ai">{nf(elig)}</span></td><td>{end}</td>
              </tr>))}</tbody>
          </table>
        </Card>
        <Card title="Ensaios por área terapêutica" sub="Ativos, por fase">
          <Chart type="columns" opts={{ labels: ['Onco', 'Cardio', 'Endo', 'Neuro', 'Infec', 'Outras'], stacked: true, height: 220, series: [
            { name: 'Fase I-II', color: C.violet, data: [7, 2, 1, 4, 2, 3] }, { name: 'Fase III', color: C.teal, data: [11, 6, 3, 2, 5, 4] }, { name: 'Fase IV e observacionais', color: C.sun, data: [4, 3, 3, 1, 1, 2] },
          ] }} />
          <Insight icon="✦" actions={<ActionButton primary label="Abrir agente de recrutamento" onClick={() => navigate('/portal/agentes', { state: { pick: 'trials' } })} />}>
            <p>O ensaio <b>LH-ONC-031</b> está a 63% do objetivo. O agente encontrou <b>112 doentes elegíveis</b> ainda não contactados.</p>
          </Insight>
        </Card>
      </div>

      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Pedidos de acesso a dados para investigação" pill="Snowflake Horizon · Clean Rooms" pillClass="p-teal" sub="Os dados nunca saem da Luz Saúde: cada pedido recebe a técnica de proteção adequada">
          <table className="tabular">
            <thead><tr><th>Requerente</th><th>Objetivo</th><th>Volume</th><th>Proteção</th><th>Estado</th></tr></thead>
            <tbody>{ACCESS.map(([who, goal, vol, tech, cls, st]) => (
              <tr key={who}><td><b>{who}</b></td><td>{goal}</td><td>{vol}</td><td>{tech}</td><td><span className={`pill ${cls}`}>{st}</span></td></tr>))}</tbody>
          </table>
        </Card>
        <Card title="Risco de reidentificação" sub="Coorte de diabetes partilhada com a Católica">
          <Chart type="gauge" opts={{ value: .03, color: C.ok, label: 'Probabilidade máxima de reidentificação' }} />
          <div className="metric"><span>Quasi-identificadores generalizados</span><b>idade, código postal, datas</b></div>
          <div className="metric"><span>Registos suprimidos</span><b>0,8%</b></div>
          <div className="metric"><span>Consentimento para investigação</span><b>71% dos doentes</b></div>
        </Card>
      </div>

      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Programa de inovação · 50 pilotos" sub="Startups e PME a testar produtos de saúde na rede Luz">
          <Chart type="bars" opts={{ items: PIPE.map(([l, v], i) => ({ label: l, value: v, color: [C.grey, C.sky, C.teal, C.violet, C.ok][i] })) }} />
          <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>Em produção: triagem de RX de tórax, transcrição de consultas, previsão de no-show, monitorização remota pós-cirurgia, entre outros.</p>
        </Card>
        <Card title="Centro de Simulação" sub="Sessões por tipo de formação · 2026">
          <Chart type="columns" opts={{ labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], stacked: true, height: 220, series: [
            { name: 'Emergência e trauma', color: C.coral, data: [62, 48, 31, 74, 81, 34] }, { name: 'Obstetrícia', color: C.sun, data: [28, 22, 14, 31, 35, 15] },
            { name: 'Internos (Católica)', color: C.teal, data: [71, 40, 12, 88, 96, 41] }, { name: 'Comunicação com o doente', color: C.violet, data: [24, 18, 9, 27, 30, 13] },
          ] }} />
        </Card>
      </div>
    </>
  );
}
