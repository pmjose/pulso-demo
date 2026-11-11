import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionButton, Card, Chart, Html, Insight, Kpi } from '../ui.jsx';
import { C, MONTHS, UNITS, days, nf, range, rnd } from '../data.js';

// ---------- Visão geral ----------
export function Overview() {
  const navigate = useNavigate();
  const d = useMemo(() => {
    const real = range(30, (i) => 80 + 5 * Math.sin(i / 3.2) + rnd() * 3 + i * .12);
    const fc = range(14, (i) => 84.5 + 4 * Math.sin((i + 30) / 3.2) + i * .25);
    const units = UNITS.slice(0, 8).map((u) => {
      const occ = 72 + rnd() * 24, wait = 18 + rnd() * 50, nps = 60 + rnd() * 20;
      return { u, occ, wait, nps, alert: occ > 90 ? ['p-bad', 'Ocupação crítica'] : wait > 55 ? ['p-warn', 'Espera elevada'] : ['p-ok', 'Normal'] };
    });
    const sp = {
      a: range(14, (i) => 8600 + rnd() * 900 + i * 30), b: range(14, (i) => 80 + rnd() * 6 + i * .3), c: range(14, () => 35 + rnd() * 18),
      d: range(14, (i) => 600 + i * 8 + rnd() * 10), e: range(14, (i) => 9.8 - i * .14 + rnd() * .5), f: range(14, (i) => 64 + i * .4 + rnd() * 2),
    };
    return { real, fc, units, sp };
  }, []);

  return (
    <>
      <div className="grid g6">
        <Kpi label="Doentes atendidos hoje" value="9 482" delta="▲ 4,1% vs. média" tone="up" spark={d.sp.a} color={C.teal} />
        <Kpi label="Ocupação de internamento" value="87,4%" delta="▲ 2,3 p.p. vs. semana" tone="down" spark={d.sp.b} color={C.coral} />
        <Kpi label="Espera média na urgência" value="38 min" delta="▼ 6 min vs. ontem" tone="up" spark={d.sp.c} color={C.sky} />
        <Kpi label="Receita acumulada" value="712,4 M€" delta="▲ 8,6% homólogo" tone="up" spark={d.sp.d} color={C.teal} />
        <Kpi label="Taxa de faltas" value="7,8%" delta="▼ 1,4 p.p. desde lembretes IA" tone="up" spark={d.sp.e} color={C.violet} />
        <Kpi label="NPS" value="71" delta="▲ 3 pontos no trimestre" tone="up" spark={d.sp.f} color={C.sun} />
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Ocupação de internamento" pill="ML · previsão 14 dias" sub="Real vs. previsto, com intervalo de confiança de 90%">
          <Chart type="line" opts={{
            labels: days(44, -30), unit: '%', min: 70, max: 100, forecastFrom: 29,
            series: [
              { name: 'Ocupação real', color: C.teal, data: d.real.concat(Array(14).fill(null)), area: true },
              { name: 'Previsão', color: C.violet, dash: true, data: Array(29).fill(null).concat([d.real[29]], d.fc), lo: Array(30).fill(null).concat(d.fc.map((v, i) => v - 1.2 - i * .18)), hi: Array(30).fill(null).concat(d.fc.map((v, i) => v + 1.2 + i * .18)) },
              { name: 'Limite operacional (92%)', color: C.coral, width: 1.2, data: Array(44).fill(92) },
            ],
          }} />
        </Card>
        <Card title="Insights da Luz IA" sub="Gerados automaticamente hoje às 07:00">
          <Insight icon="!" actions={<>
            <ActionButton primary label="Ver plano de altas" done="Plano enviado à gestão de camas" toast="Plano enviado à gestão de camas" />
            <ActionButton label="Abrir fluxo de doentes" onClick={() => navigate('/portal/fluxo')} />
          </>}><Html html="A ocupação no <b>Hospital da Luz Lisboa</b> deverá ultrapassar 92% na <b>quinta e sexta-feira</b> (probabilidade 78%), impulsionada pelo aumento de casos respiratórios." /></Insight>
          <Insight icon="€" actions={<ActionButton primary label="Rever episódios" onClick={() => navigate('/portal/receita')} />}>
            <Html html="<b>312 episódios</b> (1,9 M€) têm risco elevado de rejeição pela seguradora. 64% por falta de autorização prévia anexada." /></Insight>
          <Insight icon="♡" actions={<ActionButton primary label="Criar campanha" done="Campanha criada como rascunho" toast="Campanha criada como rascunho" />}>
            <Html html="<b>4 120 doentes diabéticos</b> estão sem consulta de seguimento há mais de 6 meses. Campanha sugerida via MY LUZ." /></Insight>
        </Card>
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title="Receita por área de negócio" sub="Acumulado do ano">
          <Chart type="donut" opts={{ center: '712 M€', centerLabel: 'acumulado 2026', items: [{ label: 'Hospitais e clínicas', value: 598, color: C.teal }, { label: 'Cuidados continuados', value: 41, color: C.sky }, { label: 'Residências sénior', value: 19, color: C.sun }, { label: 'Parcerias público-privadas', value: 54, color: C.violet }] }} />
        </Card>
        <Card className="s2" title="Desempenho por unidade" pill="Hoje" pillClass="p-teal" sub="Ocupação, espera na urgência e satisfação">
          <table>
            <thead><tr><th>Unidade</th><th>Ocupação</th><th>Espera urgência</th><th>NPS</th><th>Estado</th></tr></thead>
            <tbody>{d.units.map((r) => (
              <tr key={r.u}>
                <td><b>{r.u.replace('Hospital da Luz ', 'HL ')}</b></td>
                <td><span className="bar-mini" style={{ width: r.occ * .6, background: r.occ > 90 ? C.coral : C.teal }} />{nf(r.occ, 1)}%</td>
                <td>{nf(r.wait)} min</td><td>{nf(r.nps)}</td>
                <td><span className={`pill ${r.alert[0]}`}>{r.alert[1]}</span></td>
              </tr>))}</tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

// ---------- Fluxo de doentes ----------
const erBase = (i) => { const h = i % 24; return 14 + 30 * Math.exp(-((h - 11) ** 2) / 18) + 26 * Math.exp(-((h - 20) ** 2) / 10) + (i > 48 ? 8 : 0); };
const NOSHOW = [
  ['Rui Fernandes', 'Cardiologia', '08:00', '2 faltas nos últimos 6 meses'], ['Catarina Lopes', 'Dermatologia', '09:30', 'Marcação feita há 94 dias'],
  ['João Pereira', 'Ortopedia', '10:15', 'Distância > 40 km e previsão de chuva'], ['Inês Martins', 'Psiquiatria', '11:00', 'Sem confirmação na app'],
  ['Tiago Sousa', 'Gastroenterologia', '14:30', 'Primeira consulta, sem seguro'], ['Beatriz Gomes', 'Pediatria', '15:00', 'Horário 8h00, historial de atrasos'],
  ['Pedro Almeida', 'Oftalmologia', '16:45', 'Consulta de seguimento adiada 2×'], ['Mariana Costa', 'Endocrinologia', '17:30', 'Não abriu o lembrete SMS'],
];
const STAFF = [
  ['Sex. 18h-24h', 'Reforçar com <b>2 médicos</b> e <b>3 enfermeiros</b> na urgência geral', 'Espera prevista: 74 → 41 min'],
  ['Qui. 10h-14h', 'Abrir <b>sala de observação 2</b> e adiantar 18 altas de Medicina Interna', 'Ocupação: 94% → 89%'],
  ['Qua. 20h-23h', 'Ativar <b>triagem digital</b> MY LUZ para casos não urgentes', '−14% episódios presenciais'],
];

export function Flow() {
  const d = useMemo(() => {
    const fc = range(72, erBase), hist = range(18, (i) => erBase(i) + (rnd() - .5) * 8);
    const rows = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'], cols = range(24, (h) => `${h}h`);
    const matrix = rows.map((_, dd) => cols.map((_, h) => Math.round(erBase(h) * (dd === 0 ? 1.25 : dd > 4 ? .85 : 1) + rnd() * 4)));
    const noshow = NOSHOW.map((n, i) => [...n, 82 - i * 7 - rnd() * 4]);
    return { fc, hist, rows, cols, matrix, noshow };
  }, []);
  const labels = range(72, (i) => `${['qua', 'qui', 'sex'][Math.floor(i / 24)]} ${i % 24}h`);
  const or = ['Ortopedia', 'Cirurgia Geral', 'Urologia', 'Oftalmologia', 'Cardiologia de intervenção', 'Ginecologia', 'Otorrino'];
  const orv = [91, 86, 79, 94, 72, 68, 83];

  return (
    <>
      <div className="grid g4">
        <Kpi label="Episódios de urgência previstos (72 h)" value="3 846" delta="▲ 11% vs. semana passada" tone="down" />
        <Kpi label="Pico previsto" value="Sex. 20h" delta="68 episódios/hora" />
        <Kpi label="Altas previstas hoje" value="412" delta="86 antes das 12h" tone="up" />
        <Kpi label="Utilização do bloco" value="81,2%" delta="Objetivo 85%" tone="down" />
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Afluência à urgência · próximas 72 horas" pill="ML · Snowflake Forecast" sub="Episódios por hora, Hospital da Luz Lisboa. Inclui feriado, meteorologia e epidemiologia gripal.">
          <Chart type="line" opts={{ labels, forecastFrom: 17, series: [
            { name: 'Real', color: C.teal, data: d.hist.concat(Array(54).fill(null)), area: true },
            { name: 'Previsto', color: C.violet, dash: true, data: d.fc, lo: d.fc.map((v) => v * .86), hi: d.fc.map((v) => v * 1.14) },
          ] }} />
        </Card>
        <Card title="Recomendação de escalas" sub="Otimização prescritiva para as próximas 72 h">
          {STAFF.map(([w, t, k]) => (
            <Insight key={w} icon="◷" actions={<>
              <ActionButton primary label="Aprovar" done="Aprovado" toast="Recomendação aprovada e enviada à escala" />
              <ActionButton label="Ajustar" done="Em ajuste" toast="Recomendação aberta para ajuste" />
            </>}>
              <p><b>{w}</b><br /><span dangerouslySetInnerHTML={{ __html: t }} /></p>
              <p style={{ fontSize: 12, color: 'var(--petrol)', fontWeight: 700, marginTop: 4 }}>{k}</p>
            </Insight>
          ))}
        </Card>
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Padrão de afluência" sub="Média de episódios por dia da semana e hora (últimas 12 semanas)">
          <Chart type="heat" opts={{ rows: d.rows, cols: d.cols, unit: 'episódios', matrix: d.matrix }} />
        </Card>
        <Card title="Bloco operatório" pill="ML · duração cirúrgica" sub="Utilização de salas esta semana vs. objetivo de 85%">
          <Chart type="bars" opts={{ unit: '%', max: 100, items: or.map((l, i) => ({ label: l, value: orv[i], target: 85, color: orv[i] >= 85 ? C.teal : C.sun })) }} />
        </Card>
      </div>
      <Card style={{ marginTop: 16 }} title="Consultas com risco de falta · amanhã" pill="ML · no-show AUC 0,87" sub="Ordenado por probabilidade. Lembretes automáticos via app MY LUZ e SMS.">
        <table>
          <thead><tr><th>Doente</th><th>Especialidade</th><th>Hora</th><th>Probabilidade de falta</th><th>Principal motivo</th><th /></tr></thead>
          <tbody>{d.noshow.map(([n, s, h, why, p]) => (
            <tr key={n}><td><b>{n}</b></td><td>{s}</td><td>{h}</td>
              <td><span className="bar-mini" style={{ width: p, background: p > 60 ? C.coral : C.sun }} />{nf(p)}%</td>
              <td style={{ color: 'var(--muted)' }}>{why}</td>
              <td><ActionButton label="Enviar lembrete" done="Enviado" toast="Lembrete enviado pela app MY LUZ" /></td></tr>))}</tbody>
        </table>
      </Card>
    </>
  );
}

// ---------- Receita e seguradoras ----------
const MOTIVES = ['Falta de autorização prévia', 'Código de ato incompatível', 'Fora da cobertura da apólice', 'Diagnóstico não justifica exame', 'Duplicação de ato'];

export function Revenue() {
  const d = useMemo(() => ({
    sp: [range(12, (i) => 55 + i + rnd() * 4), range(12, (i) => 56 - i * .7 + rnd() * 2), range(12, (i) => 4.6 - i * .1 + rnd() * .3), range(12, () => 1.5 + rnd())],
    payer: [MONTHS.map((_, i) => 28 + i * .5 + rnd() * 3), MONTHS.map(() => 14 + rnd() * 2), MONTHS.map(() => 9 + rnd() * 2), MONTHS.map(() => 7 + rnd())],
    denial: range(7, (i) => ({
      ep: `25-${nf(118000 + Math.floor(rnd() * 900))}`, spec: ['Ortopedia', 'Cardiologia', 'Imagiologia', 'Cirurgia Geral', 'Gastro', 'Urologia', 'Oftalmologia'][i],
      payer: ['Seguradora A', 'ADSE', 'Seguradora B', 'Seguradora A', 'Seguradora C', 'ADSE', 'Seguradora B'][i],
      value: 800 + rnd() * 9000, risk: 93 - i * 6 - rnd() * 3, why: MOTIVES[i % 5],
    })),
  }), []);

  return (
    <>
      <div className="grid g4">
        <Kpi label="Faturação do mês" value="68,9 M€" delta="▲ 6,2% homólogo" tone="up" spark={d.sp[0]} color={C.teal} />
        <Kpi label="Prazo médio de recebimento" value="47 dias" delta="▼ 5 dias no trimestre" tone="up" spark={d.sp[1]} color={C.sky} />
        <Kpi label="Taxa de rejeição" value="3,4%" delta="▼ 0,9 p.p. com IA" tone="up" spark={d.sp[2]} color={C.violet} />
        <Kpi label="Receita em risco (por faturar)" value="1,9 M€" delta="312 episódios sinalizados" tone="down" spark={d.sp[3]} color={C.coral} />
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Receita mensal por pagador" sub="Milhões de euros, últimos 12 meses">
          <Chart type="columns" opts={{ labels: MONTHS, stacked: true, series: [
            { name: 'Seguradoras privadas', color: C.teal, data: d.payer[0] }, { name: 'Subsistemas (ADSE e outros)', color: C.sky, data: d.payer[1] },
            { name: 'Particulares', color: C.sun, data: d.payer[2] }, { name: 'SNS e PPP', color: C.violet, data: d.payer[3] },
          ] }} />
        </Card>
        <Card title="Prazo médio de recebimento" sub="Dias, por entidade financiadora">
          <Chart type="bars" opts={{ unit: ' d', items: [['Seguradora A', 32], ['Seguradora B', 41], ['ADSE', 58], ['Seguradora C', 44], ['SNS', 96], ['Particulares', 6]].map(([l, v]) => ({ label: l, value: v, color: v > 60 ? C.coral : C.teal })) }} />
        </Card>
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Episódios com risco de rejeição" pill="ML · risco de glosa" sub="Antes do envio à entidade. Corrigir agora evita devoluções e atrasos.">
          <table>
            <thead><tr><th>Episódio</th><th>Entidade</th><th>Valor</th><th>Risco</th><th>Motivo provável</th><th /></tr></thead>
            <tbody>{d.denial.map((r) => (
              <tr key={r.ep}><td><b>{r.ep}</b><br /><small style={{ color: 'var(--muted)' }}>{r.spec}</small></td><td>{r.payer}</td><td>{nf(r.value)} €</td>
                <td><span className={`pill ${r.risk > 80 ? 'p-bad' : 'p-warn'}`}>{nf(r.risk)}%</span></td><td>{r.why}</td>
                <td><ActionButton label="Corrigir" done="Em revisão" toast="Episódio enviado para revisão de faturação" /></td></tr>))}</tbody>
          </table>
        </Card>
        <Card title="Principais motivos de rejeição" sub="Classificados com Cortex AI a partir das respostas das seguradoras">
          <Chart type="bars" opts={{ unit: '%', items: MOTIVES.map((l, i) => ({ label: l, value: [34, 22, 18, 15, 11][i], color: [C.coral, C.sun, C.violet, C.sky, C.grey][i] })) }} />
        </Card>
      </div>
      <Card style={{ marginTop: 16 }} title="Partilha segura com a seguradora" pill="Snowflake Clean Room" pillClass="p-teal" sub="Indicadores conjuntos calculados sem que nenhuma das partes veja os dados individuais da outra">
        <div className="grid g4">
          {[['Clientes em comum', '1,24 M', 'Sobreposição calculada com hashing'], ['Custo médio por sinistro', '−7,8%', 'Em doentes com seguimento programado'],
            ['Tempo de autorização', '4 min', 'vs. 2,3 dias por email'], ['Fraude potencial detetada', '0,6 M€', 'Padrões anómalos partilhados']].map(([l, v, s]) => (
            <div key={l} className="kpi" style={{ padding: '6px 0' }}><div className="lbl">{l}</div><div className="v">{v}</div><div className="d neu">{s}</div></div>))}
        </div>
      </Card>
    </>
  );
}

// ---------- Farmácia e stocks ----------
const STOCK = [['Contraste iodado 350', 'HL Lisboa', 4, 96], ['Enoxaparina 40 mg', 'HL Arrábida', 6, 88], ['Stent farmacológico 3.0', 'HL Lisboa', 7, 81], ['Propofol 1%', 'HL Coimbra', 9, 72], ['Amoxicilina + ác. clavulânico IV', 'HL Aveiro', 11, 64], ['Prótese anca cimentada', 'HL Setúbal', 13, 52]];

export function Supply() {
  const consumption = useMemo(() => range(28, (i) => 320 + 60 * Math.sin(i / 2) + rnd() * 30), []);
  return (
    <>
      <div className="grid g4">
        <Kpi label="Ruturas evitadas (30 dias)" value="27" delta="▲ vs. 9 no mês anterior" tone="up" />
        <Kpi label="Stock imobilizado" value="14,2 M€" delta="▼ 1,8 M€ no trimestre" tone="up" />
        <Kpi label="Validades em risco (60 dias)" value="386 mil €" delta="Transferências sugeridas" tone="down" />
        <Kpi label="Precisão da previsão" value="93,1%" delta="MAPE 6,9%" tone="up" />
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Risco de rutura · próximos 14 dias" pill="ML · procura" sub="Medicamentos e dispositivos críticos">
          <table>
            <thead><tr><th>Artigo</th><th>Unidade</th><th>Dias de cobertura</th><th>Risco</th><th /></tr></thead>
            <tbody>{STOCK.map(([a, u, dd, r]) => (
              <tr key={a}><td><b>{a}</b></td><td>{u}</td><td>{dd}</td><td><span className={`pill ${r > 80 ? 'p-bad' : 'p-warn'}`}>{r}%</span></td>
                <td><ActionButton label="Encomendar" done="Pedido criado" toast="Pedido de compra criado no ERP" /></td></tr>))}</tbody>
          </table>
        </Card>
        <Card title="Consumo previsto vs. stock · Contraste iodado" sub="Unidades, Hospital da Luz Lisboa">
          <Chart type="line" opts={{ labels: days(28, -14), forecastFrom: 13, series: [
            { name: 'Stock projetado', color: C.teal, data: range(28, (i) => Math.max(0, 900 - i * 38)), area: true },
            { name: 'Consumo diário previsto ×10', color: C.violet, dash: true, data: consumption },
            { name: 'Stock de segurança', color: C.coral, width: 1.2, data: Array(28).fill(250) },
          ] }} />
        </Card>
      </div>
      <Card style={{ marginTop: 16 }} title="Validades a expirar" sub="Valor em risco nos próximos 60 dias, por unidade">
        <Chart type="columns" opts={{ labels: ['Lisboa', 'Torres', 'Arrábida', 'Coimbra', 'Aveiro', 'Setúbal', 'Oeiras', 'Guimarães', 'Funchal'], series: [
          { name: 'Valor em risco (mil €)', color: C.sun, data: [92, 41, 68, 37, 29, 44, 18, 31, 26] },
          { name: 'Recuperável por transferência', color: C.teal, data: [70, 30, 51, 22, 20, 33, 12, 19, 14] },
        ] }} />
      </Card>
    </>
  );
}
