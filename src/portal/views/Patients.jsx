import { ActionButton, Card, Chart, Html, Insight, Kpi } from '../ui.jsx';
import { C, range } from '../data.js';

// ---------- Doente 360° ----------
const TIMELINE = [
  ['03/11/2026', 'Análises clínicas · HL Lisboa', 'HbA1c 7,9% · Creatinina normal'],
  ['22/09/2026', 'Videoconsulta · Medicina Geral', 'Ajuste de terapêutica anti-hipertensora'],
  ['14/07/2026', 'Check-up LUZ ON PRIME', 'Avaliador de Saúde preenchido na app'],
  ['08/04/2026', 'Consulta · Endocrinologia', 'Última consulta da especialidade'],
  ['17/01/2026', 'Urgência · HL Torres de Lisboa', 'Hipoglicemia ligeira, alta no próprio dia'],
  ['02/10/2025', 'Consulta · Nutrição', 'Plano alimentar suspenso pela doente'],
];
const NBA = [
  ['1', 'Marcar consulta de <b>Endocrinologia</b>. Seguimento em atraso há 4 meses.', 'Marcar via MY LUZ'],
  ['2', 'Agendar <b>rastreio de retinopatia</b>. Elegível e coberto pelo seguro.', 'Propor data'],
  ['3', 'Reativar plano de <b>Nutrição</b>. A HbA1c subiu após a interrupção.', 'Enviar convite'],
];
const LAB = ['nov 24', 'fev 25', 'mai 25', 'ago 25', 'nov 25', 'fev 26', 'mai 26', 'ago 26', 'nov 26'];

export function Patient() {
  return (
    <>
      <div className="grid g3">
        <div className="card s2">
          <div className="pt-head">
            <div className="pt-av">AS</div>
            <div>
              <h3 style={{ fontSize: 20 }}>Ana Sofia Ribeiro</h3>
              <div className="sub" style={{ margin: '2px 0 0' }}>58 anos · Processo n.º 2 004 581 · Cliente desde 2016 · Lisboa</div>
              <div className="tags">
                <span className="pill p-teal">LUZ ON PRIME</span><span className="pill p-ok">Seguro: Multicare</span>
                <span className="pill p-warn">Diabetes tipo 2</span><span className="pill p-warn">Hipertensão</span>
                <span className="pill p-ai">Utilizadora ativa MY LUZ</span>
              </div>
            </div>
          </div>
          <div className="grid g3" style={{ marginTop: 18 }}>
            <Chart type="gauge" opts={{ value: .64, color: C.coral, label: 'Risco de descompensação' }} />
            <Chart type="gauge" opts={{ value: .18, color: C.ok, label: 'Probabilidade de falta' }} />
            <Chart type="gauge" opts={{ value: .31, color: C.sun, label: 'Risco de abandono' }} />
          </div>
        </div>
        <Card title="Próxima melhor ação" pill="Luz IA" pillClass="p-ai" sub="Recomendações priorizadas para esta doente">
          {NBA.map(([n, t, a]) => (
            <Insight key={n} icon={n} actions={<ActionButton primary label={a} done="Notificação enviada" toast="Notificação enviada para a app MY LUZ" />}>
              <Html html={t} />
            </Insight>
          ))}
        </Card>
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title="Percurso de cuidados" sub="Todos os pontos de contacto, num só sítio">
          <div className="tl">{TIMELINE.map(([d, t, s]) => <div key={d} className="tl-i"><b>{t}</b><small>{d} · {s}</small></div>)}</div>
        </Card>
        <Card title="HbA1c e pressão arterial" sub="Análises e medições dos últimos 24 meses">
          <Chart type="line" opts={{ labels: LAB, unit: '%', min: 6, max: 8.5, height: 150, series: [{ name: 'HbA1c', color: C.coral, data: [7.4, 7.2, 7.0, 6.9, 7.1, 7.3, 7.5, 7.7, 7.9] }, { name: 'Objetivo 7%', color: C.grey, width: 1, data: Array(9).fill(7) }] }} />
          <Chart style={{ marginTop: 6 }} type="line" opts={{ labels: LAB, min: 60, max: 160, height: 150, series: [{ name: 'Sistólica', color: C.teal, data: [148, 142, 138, 135, 132, 134, 130, 131, 129] }, { name: 'Diastólica', color: C.sky, data: [92, 90, 86, 84, 82, 84, 80, 81, 80] }] }} />
        </Card>
        <Card title="Resumo clínico" pill="Cortex AI" pillClass="p-ai" sub="Gerado a partir de 37 documentos clínicos">
          <p style={{ lineHeight: 1.65, fontSize: 13 }}>Doente de 58 anos com diabetes tipo 2 desde 2019 e hipertensão arterial controlada. HbA1c com tendência de subida nos últimos 6 meses (7,1% → 7,9%), coincidente com a suspensão de consultas de Nutrição. Última consulta de Endocrinologia há 7 meses; seguimento recomendado a cada 3-4 meses. Rastreio de retinopatia em atraso. Sem internamentos nos últimos 2 anos. Adere bem à app MY LUZ (check-in digital em 92% das visitas).</p>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10 }}>Fontes: 14 consultas, 18 análises, 3 relatórios de imagem, 2 cartas de alta. Revisto por médico: não.</div>
        </Card>
      </div>
    </>
  );
}

// ---------- Cuidados sénior ----------
const FALLS = [
  ['Maria do Céu Antunes', 'Nova benzodiazepina + 2 levantes noturnos'], ['António Rodrigues', 'Queda há 12 dias, marcha instável'],
  ['Fernanda Vieira', 'Hipotensão ortostática registada'], ['Manuel Carvalho', 'Sono fragmentado (sensor), ITU recente'],
  ['Graça Teixeira', 'Diurético reforçado, visão reduzida'], ['José Henriques', 'Mobilidade em declínio na escala de Tinetti'],
];

export function Senior() {
  return (
    <>
      <div className="grid g4">
        <Kpi label="Residentes e utentes" value="1 284" delta="Residências e cuidados continuados" />
        <Kpi label="Quedas com lesão (mês)" value="9" delta="▼ 22% desde alertas IA" tone="up" />
        <Kpi label="Readmissões a 30 dias" value="6,1%" delta="▼ 1,7 p.p. homólogo" tone="up" />
        <Kpi label="Ocupação média" value="94,6%" delta="Casas da Cidade: lista de espera 212" />
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Residentes com maior risco de queda · próximos 7 dias" pill="ML · risco de queda" sub="Combina mobilidade, medicação, sono, quedas anteriores e sensores de quarto">
          <table>
            <thead><tr><th>Residente</th><th>Unidade</th><th>Risco</th><th>Fatores principais</th><th /></tr></thead>
            <tbody>{FALLS.map(([n, f], i) => {
              const r = 88 - i * 9;
              return (
                <tr key={n}><td><b>{n}</b><br /><small style={{ color: 'var(--muted)' }}>{82 + (i * 3) % 11} anos</small></td>
                  <td>{i % 2 ? 'Residência Lisboa' : 'Hospital do Mar'}</td>
                  <td><span className={`pill ${r > 70 ? 'p-bad' : 'p-warn'}`}>{r}%</span></td>
                  <td style={{ color: 'var(--muted)' }}>{f}</td>
                  <td><ActionButton label="Criar plano" done="Plano criado" toast="Plano preventivo atribuído à equipa de enfermagem" /></td></tr>
              );
            })}</tbody>
          </table>
        </Card>
        <Card title="O que explica o risco" sub="Importância média das variáveis (SHAP)">
          <Chart ai={{ action: 'Rever psicofármacos e instalar sensor de levante nos residentes com quedas anteriores.', impact: 'Os dois fatores principais explicam 55% do risco: ≈ −30% de quedas com lesão.' }} type="bars" opts={{ items: [['Quedas anteriores', .31], ['Psicofármacos', .24], ['Levantes noturnos', .17], ['Escala de Tinetti', .13], ['Idade', .08], ['Infeção recente', .07]].map(([l, v]) => ({ label: l, value: v, color: C.violet })) }} />
        </Card>
      </div>
      <Card style={{ marginTop: 16 }} title="Casas da Cidade · residências sénior" pill="Negócio residencial" pillClass="p-teal" sub="Residências para maiores de 65 anos · Lisboa">
        <div className="grid g4">
          {[['Ocupação', '95,8%', '186 de 194 apartamentos'], ['Lista de espera', '212', 'pessoas · mediana de 7 meses'], ['Permanência média', '3,4 anos', 'por residente'], ['Receita por residente', '3 180 €', 'por mês · inclui cuidados'],
            ['Residentes com seguimento no grupo', '91%', 'consultas no HL Lisboa'], ['Quedas com lesão (mês)', '3', 'das 9 do negócio sénior'], ['Satisfação das famílias', '4,6 / 5', 'inquérito trimestral'], ['Transferências para hospital', '14', 'último mês']].map(([l, v, d]) => (
            <div key={l} className="kpi"><div className="lbl">{l}</div><div className="v" style={{ fontSize: 22 }}>{v}</div><div className="d neu">{d}</div></div>
          ))}
        </div>
      </Card>
      <Card style={{ marginTop: 16 }} title="Ocupação prevista · residências e cuidados continuados" sub="Próximas 12 semanas">
        <Chart ai={{ action: 'Abrir 12 camas de cuidados continuados no Hospital do Mar antes de janeiro.', impact: 'Absorve a subida prevista e reduz em ≈ 25% a lista de espera de 212 utentes.' }} type="line" opts={{ labels: range(12, (i) => `S${i + 46 > 52 ? i - 6 : i + 46}`), unit: '%', min: 80, max: 100, series: [
          { name: 'Residências sénior', color: C.sun, data: range(12, (i) => 95 + Math.sin(i / 2) * 1.5) },
          { name: 'Cuidados continuados', color: C.teal, data: range(12, (i) => 91 + i * .5 + (i % 3) * .4) },
        ] }} />
      </Card>
    </>
  );
}
