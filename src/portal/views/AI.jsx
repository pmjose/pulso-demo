import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Chart, Html, useToast } from '../ui.jsx';
import { C, EXTRACT, MODELS, NOTE, QA, range } from '../data.js';

// ---------- Assistente Luz IA ----------
const words = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\W+/).filter((w) => w.length > 3);

// Pick the scripted answer sharing the most meaningful words with the question.
function match(q) {
  if (QA[q]) return q;
  const qw = new Set(words(q));
  let best = null, score = 0;
  for (const k of Object.keys(QA)) {
    const s = words(k).filter((w) => qw.has(w)).length;
    if (s > score) { score = s; best = k; }
  }
  return score >= 2 ? best : null;
}

const GREETING = { who: 'a', html: 'Olá, Dra. Marta. Sou a <b>Luz IA</b>. Respondo com base nos dados do grupo, sempre dentro das suas permissões de acesso. Em que posso ajudar?' };

export function Assistant() {
  const [msgs, setMsgs] = useState([GREETING]);
  const [draft, setDraft] = useState('');
  const box = useRef(null);
  const location = useLocation();
  const handled = useRef(null);

  const ask = (q) => {
    const id = Date.now() + Math.random();
    setMsgs((m) => [...m, { who: 'u', text: q }, { who: 'a', id, pending: true }]);
    setTimeout(() => {
      const k = match(q);
      setMsgs((m) => m.map((x) => (x.id === id ? { who: 'a', id, answer: k ? QA[k] : null } : x)));
    }, 1300);
  };

  // Questions typed in the header search arrive via router state.
  useEffect(() => {
    const q = location.state?.ask;
    if (q && handled.current !== location.key) { handled.current = location.key; ask(q); }
  }, [location]);

  useEffect(() => { box.current.scrollTop = box.current.scrollHeight; }, [msgs]);

  const submit = (e) => { e.preventDefault(); const v = draft.trim(); if (v) { setDraft(''); ask(v); } };

  return (
    <div className="chat">
      <div className="conv">
        <div className="msgs" ref={box} aria-live="polite">
          {msgs.map((m, i) => m.who === 'u'
            ? <div key={i} className="m u">{m.text}</div>
            : <AnswerBubble key={m.id || i} m={m} />)}
        </div>
        <form className="composer" onSubmit={submit}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Pergunte em português, por exemplo: qual a ocupação prevista para sexta-feira?" aria-label="Pergunta" />
          <button className="btn pri" type="submit">Perguntar</button>
        </form>
      </div>
      <div>
        <Card title="Sugestões" sub="Perguntas frequentes da direção">
          <div className="sugs">{Object.keys(QA).map((q) => <button key={q} className="sug" onClick={() => ask(q)}>{q}</button>)}</div>
        </Card>
        <Card style={{ marginTop: 16 }} title="Como funciona" sub="Snowflake Intelligence com Cortex Agents">
          {[['Semantic views', '6'], ['Documentos indexados', '48 210'], ['Respeita permissões do utilizador', 'Sim'], ['Dados saem do Snowflake', 'Nunca']].map(([k, v]) => (
            <div key={k} className="metric"><span>{k}</span><b>{v}</b></div>))}
        </Card>
      </div>
    </div>
  );
}

function AnswerBubble({ m }) {
  if (m.html) return <div className="m a"><div className="who">✦ Luz IA</div><span dangerouslySetInnerHTML={{ __html: m.html }} /></div>;
  if (m.pending) {
    return (
      <div className="m a"><div className="who">✦ Luz IA</div>
        <span className="typing"><span /><span /><span /></span> <small style={{ color: 'var(--muted)' }}>A consultar semantic views e documentos…</small>
      </div>
    );
  }
  if (!m.answer) {
    return (
      <div className="m a"><div className="who">✦ Luz IA</div>
        Não encontrei dados suficientes para responder com confiança a essa pergunta nas fontes a que tem acesso. Experimente reformular com uma unidade, período ou indicador, por exemplo: "ocupação prevista para sexta-feira no HL Lisboa".
      </div>
    );
  }
  const a = m.answer;
  return (
    <div className="m a">
      <div className="who">✦ Luz IA <span className="pill p-ai">Snowflake Intelligence</span></div>
      <span dangerouslySetInnerHTML={{ __html: a.text }} />
      {a.chart && <Chart type="columns" style={{ marginTop: 12, background: '#fff', borderRadius: 10, padding: 10 }}
        opts={{ labels: a.chart.labels, height: 170, series: [{ name: '', color: C.teal, data: a.chart.data }] }} />}
      <details><summary>Ver SQL gerado</summary><pre>{a.sql}</pre></details>
      <div className="src">Fonte: {a.src}</div>
    </div>
  );
}

// ---------- Notas clínicas IA ----------
const EXTRACT_SQL = `SELECT
  AI_EXTRACT(texto, {
    'diagnostico_principal': 'Diagnóstico principal com código CID-10',
    'diagnosticos_secundarios': 'Lista de comorbilidades com CID-10',
    'medicacao_alta': 'Medicação prescrita à data de alta',
    'seguimento': 'Consultas e exames de seguimento'
  }) AS dados,
  AI_CLASSIFY(texto, ['GDH 139','GDH 140','GDH 141']) AS gdh,
  AI_SENTIMENT(texto) AS sentimento
FROM LUZ_ANALYTICS.CLINICO.NOTAS_ALTA
WHERE episodio_id = '25-118402';`;

export function Notes() {
  const [step, setStep] = useState(-1); // -1 idle, 0..n revealing, n done
  const toast = useToast();
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = () => {
    setStep(0);
    EXTRACT.forEach((_, i) => timers.current.push(setTimeout(() => setStep(i + 1), 350 + i * 320)));
    timers.current.push(setTimeout(() => toast('Codificação sugerida enviada para validação'), 350 + EXTRACT.length * 320));
  };
  const done = step >= EXTRACT.length;

  return (
    <>
      <div className="grid g2">
        <div className="card">
          <div className="row"><h3>Nota de alta · Episódio 25-118 402</h3>
            <button className="btn pri sp" onClick={run} disabled={step >= 0}>{done ? '✓ Extraído em 1,8 s' : step >= 0 ? 'A processar…' : 'Extrair com Cortex AI'}</button></div>
          <p className="sub">Medicina Interna · Hospital da Luz Lisboa · texto livre</p>
          <Html as="div" className="note" html={NOTE} />
        </div>
        <Card title="Dados estruturados" pill="AI_EXTRACT · AI_CLASSIFY" pillClass="p-ai" sub="Prontos para codificação, faturação e investigação">
          <div className="ex">{EXTRACT.map(([k, v], i) => <div key={k} className={`f${step > i ? ' on' : ''}`}><small>{k}</small><div>{v}</div></div>)}</div>
          <div className="code">{step >= 0 ? EXTRACT_SQL : '-- clique em "Extrair com Cortex AI"'}</div>
        </Card>
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title="Codificação assistida" sub="Últimos 30 dias">
          <Chart type="columns" opts={{ labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], series: [{ name: 'Sugestões aceites', color: C.teal, data: [1840, 2010, 2230, 2390] }, { name: 'Corrigidas pelo codificador', color: C.sun, data: [310, 270, 240, 205] }] }} />
        </Card>
        <Card title="Sentimento nos comentários de doentes" sub="AI_SENTIMENT sobre 12 480 comentários">
          <Chart type="donut" opts={{ center: '+0,42', centerLabel: 'sentimento médio', items: [{ label: 'Positivo', value: 68, color: C.ok }, { label: 'Neutro', value: 19, color: C.grey }, { label: 'Negativo', value: 13, color: C.coral }] }} />
        </Card>
        <Card title="Temas mais referidos" sub="AI_CLASSIFY sobre comentários negativos">
          <Chart type="bars" opts={{ unit: '%', items: [['Tempo de espera', 38], ['Estacionamento', 17], ['Faturação pouco clara', 15], ['Marcações por telefone', 14], ['Comunicação clínica', 9], ['Alimentação', 7]].map(([l, v]) => ({ label: l, value: v, color: C.coral })) }} />
        </Card>
      </div>
    </>
  );
}

// ---------- Modelos preditivos ----------
const LINEAGE_PILLS = ['p-teal', 'p-teal', 'p-ml', 'p-ai', 'p-ok'];

export function Models() {
  const [sel, setSel] = useState(0);
  const m = MODELS[sel];
  return (
    <>
      <div className="grid g4">
        {MODELS.map((x, i) => (
          <div key={x.name} className={`card model${i === sel ? ' sel' : ''}`} tabIndex={0} role="button" aria-pressed={i === sel}
            onClick={() => setSel(i)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSel(i); } }}>
            <div className="row"><span className={`pill ${x.status[0]}`}>{x.status[1]}</span><span className="sp" style={{ fontSize: 11, color: 'var(--muted)' }}>{x.algo}</span></div>
            <h3 style={{ marginTop: 10 }}>{x.name}</h3>
            <p className="sub" style={{ margin: '4px 0 8px' }}>{x.use}</p>
            <div className="metric"><span>{x.metricName}</span><b>{x.metric}</b></div>
            <div className="metric"><span>Previsões/dia</span><b>{x.vol}</b></div>
          </div>
        ))}
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title={m.name} sub={m.desc}>
          {m.details.map(([k, v]) => <div key={k} className="metric"><span>{k}</span><b>{v}</b></div>)}
        </Card>
        <Card title="Variáveis mais importantes" sub="Contribuição para a previsão">
          <Chart type="bars" opts={{ items: m.feat.map(([l, v]) => ({ label: l, value: v, color: C.violet })) }} />
        </Card>
        <Card title="Desempenho ao longo do tempo" sub="Métrica principal em produção, últimas 12 semanas">
          <Chart type="line" opts={{
            labels: range(12, (k) => `S${k + 35}`), min: m.perf[0] - .08, max: Math.min(1, m.perf[0] + .06), height: 180,
            series: [
              { name: m.metricName, color: C.teal, data: range(12, (k) => +(m.perf[0] + Math.sin(k) * .01 - (k > 9 ? m.perf[1] : 0)).toFixed(3)) },
              { name: 'Limiar de alerta', color: C.coral, width: 1, data: Array(12).fill(m.perf[0] - .04) },
            ],
          }} />
        </Card>
      </div>
      <Card style={{ marginTop: 16 }} title="Linhagem do modelo" sub="Das fontes à decisão, tudo no Snowflake">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 12.5 }}>
          {m.lineage.map((s, k) => (
            <span key={s} style={{ display: 'contents' }}>
              {k > 0 && <span style={{ color: 'var(--sky)', fontSize: 20 }}>›</span>}
              <span className={`pill ${LINEAGE_PILLS[Math.min(k, 4)]}`} style={{ padding: '8px 12px', fontSize: 12 }}>{s}</span>
            </span>
          ))}
        </div>
      </Card>
    </>
  );
}
