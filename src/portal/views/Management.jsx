import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionButton, Card, Chart, Html, Insight, Kpi, ScopeNote, useScope, useUnit } from '../ui.jsx';
import { C, CLINICS, GROUP, HOSPITALS, MONTHS, PAYERS, STATS, days, groupStats, nf, range, rnd, seeded } from '../data.js';

const REGIONS = ['Lisboa', 'Norte', 'Centro', 'Sul', 'Madeira'];

// ---------- Visão geral ----------
export function Overview() {
  const navigate = useNavigate();
  const { setUnit } = useUnit();
  const { list, g, isAll, label } = useScope();
  const d = useMemo(() => {
    const r = seeded('ov' + label);
    const real = range(30, (i) => g.occ - 4 + 4 * Math.sin(i / 3.2) + r() * 2.4 + i * .1);
    const fc = range(14, (i) => g.occ + 1.5 * Math.sin((i + 30) / 3.2) + i * .22);
    const sp = (end, drift, noise) => range(14, (i) => end - drift * (13 - i) + (r() - .5) * noise);
    return {
      real, fc,
      sp: { a: sp(g.erVisits * 4.9, 10, g.erVisits * .4), b: sp(g.occ, .2, 2), c: sp(g.erWait, -.3, 9), d: sp(GROUP.ytdRevenue, 7, 4), e: sp(g.noShow, -.1, .5), f: sp(g.nps, .2, 2) },
    };
  }, [label]);
  const patients = Math.round(g.erVisits * 4.9 + g.consults / 22);
  const shown = isAll ? HOSPITALS : list;

  return (
    <>
      <ScopeNote />
      <div className="grid g6">
        <Kpi label="Doentes atendidos hoje" value={nf(patients)} delta="urgência, consulta e internamento" tone="up" spark={d.sp.a} color={C.teal} />
        <Kpi label="Ocupação de internamento" value={`${nf(g.occ, 1)}%`} delta={`${nf(g.beds)} camas`} tone={g.occ > 90 ? 'down' : 'up'} spark={d.sp.b} color={C.coral} />
        <Kpi label="Espera média na urgência" value={`${nf(g.erWait)} min`} delta="▼ 6 min vs. ontem" tone="up" spark={d.sp.c} color={C.sky} />
        <Kpi label={isAll ? 'Receita acumulada 2026' : 'Receita anual estimada'} value={isAll ? `${nf(GROUP.ytdRevenue, 1)} M€` : `${nf(g.revenue, 1)} M€`} delta={isAll ? `▲ ${nf(GROUP.ytdGrowth, 1)}% homólogo` : `margem ${nf(g.margin, 1)}%`} tone="up" spark={d.sp.d} color={C.teal} />
        <Kpi label="Taxa de faltas" value={`${nf(g.noShow, 1)}%`} delta="▼ 1,4 p.p. desde lembretes IA" tone="up" spark={d.sp.e} color={C.violet} />
        <Kpi label="NPS" value={nf(g.nps)} delta="▲ 3 pontos no trimestre" tone="up" spark={d.sp.f} color={C.sun} />
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Ocupação de internamento" pill="ML · previsão 14 dias" sub={`${label} · real vs. previsto, com intervalo de confiança de 90%`}>
          <Chart type="line" opts={{
            labels: days(44, -30), unit: '%', min: 65, max: 100, forecastFrom: 29,
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
            <ActionButton label="Abrir operações" onClick={() => navigate('/portal/operacoes')} />
          </>}><Html html="A ocupação no <b>Hospital da Luz Lisboa</b> deverá ultrapassar 92% na <b>quinta e sexta-feira</b> (probabilidade 78%), impulsionada pelo aumento de casos respiratórios." /></Insight>
          <Insight icon="€" actions={<ActionButton primary label="Rever episódios" onClick={() => navigate('/portal/receita')} />}>
            <Html html="<b>312 episódios</b> (1,9 M€) têm risco elevado de rejeição. 64% por falta de autorização prévia da <b>Multicare</b> e da <b>Médis</b>." /></Insight>
          <Insight icon="♡" actions={<ActionButton primary label="Criar campanha" done="Campanha criada como rascunho" toast="Campanha criada como rascunho" />}>
            <Html html="<b>4 120 doentes diabéticos</b> estão sem consulta de seguimento há mais de 6 meses. Campanha sugerida via MY LUZ." /></Insight>
        </Card>
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title="Receita por área de negócio" sub="Acumulado de 2026">
          <Chart type="donut" opts={{ center: `${nf(GROUP.ytdRevenue, 0)} M€`, centerLabel: 'acumulado 2026', items: [{ label: 'Hospitais e clínicas', value: 688, color: C.teal }, { label: 'Cuidados continuados', value: 38, color: C.sky }, { label: 'Residências Casas da Cidade', value: 18, color: C.sun }, { label: 'Learning Health e outros', value: 12, color: C.violet }] }} />
        </Card>
        <Card className="s2" title="Desempenho por hospital" pill="Hoje" pillClass="p-teal" sub="Ocupação, espera na urgência e satisfação · clique para filtrar o portal">
          <table className="tabular">
            <thead><tr><th>Hospital</th><th>Ocupação</th><th>Espera urgência</th><th>NPS</th><th>Estado</th></tr></thead>
            <tbody>{shown.map((h) => {
              const s = STATS[h.name];
              const alert = s.occ > 90 ? ['p-bad', 'Ocupação crítica'] : s.erWait > 45 ? ['p-warn', 'Espera elevada'] : h.isNew ? ['p-ml', 'Em ramp-up'] : ['p-ok', 'Normal'];
              return (
                <tr key={h.name} style={{ cursor: 'pointer' }} onClick={() => setUnit(h.name)}>
                  <td><b>{h.short}</b>{h.isNew && <span className="new-tag">NOVA</span>}</td>
                  <td><span className="bar-mini" style={{ width: s.occ * .6, background: s.occ > 90 ? C.coral : C.teal }} />{nf(s.occ, 1)}%</td>
                  <td>{nf(s.erWait)} min</td><td>{nf(s.nps)}</td>
                  <td><span className={`pill ${alert[0]}`}>{alert[1]}</span></td>
                </tr>
              );
            })}</tbody>
          </table>
        </Card>
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title="Rede Luz Saúde" sub={`${GROUP.hospitals} hospitais · ${GROUP.clinics} clínicas · residências Casas da Cidade`}>
          {REGIONS.map((reg) => {
            const hs = HOSPITALS.filter((h) => h.region === reg);
            const cs = CLINICS.filter((c) => c.region === reg).length;
            return <div key={reg} className="metric"><span>{reg}</span><b>{hs.length} {hs.length === 1 ? 'hospital' : 'hospitais'} · {cs} clínicas · {nf(hs.reduce((a, h) => a + h.beds, 0))} camas</b></div>;
          })}
          <div className="metric"><span>Colaboradores</span><b>{nf(GROUP.employees)} · {nf(GROUP.doctors)} médicos · {nf(GROUP.nurses)} enfermeiros</b></div>
          <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>Novas unidades: Aveiro, Leiria, Santarém e Figueira da Foz.</p>
        </Card>
        <Card title="Resultados para acionistas" pill="Fidelidade 60% · Macquarie 40%" pillClass="p-teal" sub="Receita 2025 e plano 2026">
          <div className="metric"><span>Receita 2025</span><b>{GROUP.revenue2025} M€ (▲ {GROUP.revenueGrowth}%)</b></div>
          <div className="metric"><span>Resultado líquido 2025</span><b>{nf(GROUP.netProfit2025, 1)} M€</b></div>
          <div className="metric"><span>Margem EBITDA 2026 (acumulado)</span><b>17,7% · plano 18,2%</b></div>
          <div className="metric"><span>Prazo médio de recebimento</span><b>47 dias · plano 45</b></div>
          <div className="act" style={{ marginTop: 12 }}><ActionButton primary label="Abrir finanças" onClick={() => navigate('/portal/financas')} /></div>
        </Card>
        <Card title="Custo da plataforma de dados" pill="FinOps" pillClass="p-ml" sub="Snowflake · novembro, até hoje">
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-.02em' }}>1 240 <span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>créditos · ≈ 3 720 €</span></div>
          <div className="progress" style={{ margin: '12px 0 6px' }}><i style={{ width: '34%', background: C.teal }} /></div>
          <p className="sub" style={{ margin: '0 0 8px' }}>34% do orçamento mensal · previsão 94% a 30/11</p>
          <div className="metric"><span>Custo por utilizador ativo</span><b>2,02 €</b></div>
          <div className="act" style={{ marginTop: 12 }}><ActionButton primary label="Ver custos" onClick={() => navigate('/portal/plataforma')} /></div>
        </Card>
      </div>
    </>
  );
}

// ---------- Fluxo de doentes ----------
const erBase = (i) => { const h = i % 24; return 14 + 30 * Math.exp(-((h - 11) ** 2) / 18) + 26 * Math.exp(-((h - 20) ** 2) / 10) + (i > 48 ? 8 : 0); };
const STAFF = [
  ['Sex. 18h-24h', 'Reforçar com <b>2 médicos</b> e <b>3 enfermeiros</b> na urgência geral', 'Espera prevista: 74 → 41 min'],
  ['Qui. 10h-14h', 'Abrir <b>sala de observação 2</b> e adiantar 18 altas de Medicina Interna', 'Ocupação: 94% → 89%'],
  ['Qua. 20h-23h', 'Ativar <b>triagem digital</b> MY LUZ para casos não urgentes', '−14% episódios presenciais'],
];

const LISBOA_ER = STATS['Hospital da Luz Lisboa'].erVisits;

export function Flow() {
  const { g, label, list, isAll } = useScope();
  const k = g.erVisits / LISBOA_ER; // erBase is calibrated on HL Lisboa
  const d = useMemo(() => {
    const r = seeded('flow' + label);
    const fc = range(72, (i) => erBase(i) * k), hist = range(18, (i) => (erBase(i) + (r() - .5) * 8) * k);
    const rows = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'], cols = range(24, (h) => `${h}h`);
    const matrix = rows.map((_, dd) => cols.map((_, h) => Math.round((erBase(h) * (dd === 0 ? 1.25 : dd > 4 ? .85 : 1) + r() * 4) * k)));
    const dis = (isAll ? HOSPITALS.filter((h) => !h.name.includes('Mar')).slice(0, 8) : list).map((h) => ({ label: h.short, value: STATS[h.name].discharges, color: C.sun }));
    return { fc, hist, rows, cols, matrix, dis };
  }, [label]);
  const total72 = Math.round(d.fc.reduce((a, v) => a + v, 0));
  const peak = d.fc.reduce((b, v, i) => (v > d.fc[b] ? i : b), 0);
  const labels = range(72, (i) => `${['qua', 'qui', 'sex'][Math.floor(i / 24)]} ${i % 24}h`);
  const navigate = useNavigate();

  return (
    <>
      <ScopeNote />
      <div className="grid g4">
        <Kpi label="Episódios de urgência previstos (72 h)" value={nf(total72)} delta="▲ 11% vs. semana passada" tone="down" />
        <Kpi label="Pico previsto" value={labels[peak].replace('qua', 'Qua.').replace('qui', 'Qui.').replace('sex', 'Sex.')} delta={`${nf(d.fc[peak])} episódios/hora`} />
        <Kpi label="Altas previstas hoje" value={nf(g.discharges)} delta={`${nf(g.discharges * .21)} antes das 12h`} tone="up" />
        <Kpi label="Temperatura mínima prevista" value="6 °C" delta="sexta-feira · IPMA" tone="down" />
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Afluência à urgência · próximas 72 horas" pill="ML · Snowflake Forecast" sub={`Episódios por hora, ${label}. Inclui feriado, meteorologia e epidemiologia gripal.`}>
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
        <Card title="Altas previstas hoje por hospital" pill="ML · previsão de altas" sub="Libertar camas cedo reduz a espera da urgência por internamento">
          <Chart type="bars" opts={{ items: d.dis }} />
          <Insight icon="✦" actions={<ActionButton primary label="Explorar sinais externos" onClick={() => navigate('/portal/sinais')} />}>
            <Html html="Uma descida de <b>5 °C</b> na mínima antecipa <b>+14% de episódios respiratórios</b> dois dias depois. Sexta-feira cumpre o padrão." />
          </Insight>
        </Card>
      </div>
    </>
  );
}

// ---------- Receita e seguradoras ----------
const MOTIVES = ['Falta de autorização prévia', 'Código de ato incompatível', 'Fora da cobertura da apólice', 'Diagnóstico não justifica exame', 'Duplicação de ato'];

const GROUP_REVENUE = groupStats().revenue;

export function Revenue() {
  const { g, label } = useScope();
  const k = g.revenue / GROUP_REVENUE; // share of group revenue in the current filter
  const d = useMemo(() => ({
    sp: [range(12, (i) => 55 + i + rnd() * 4), range(12, (i) => 56 - i * .7 + rnd() * 2), range(12, (i) => 4.6 - i * .1 + rnd() * .3), range(12, () => 1.5 + rnd())],
    payer: PAYERS.map((p) => MONTHS.map((_, i) => +((66 + i * .55) * k * p.share / 100 * (.94 + rnd() * .12)).toFixed(2))),
    claims: PAYERS.filter((p) => p.short !== 'Particulares').map((p) => ({ ...p, pending: Math.round(p.share * 96 * k * (.8 + rnd() * .4)), value: p.share * .21 * k * (.8 + rnd() * .4), denied: (p.dso / 18) * (.7 + rnd() * .5) })),
    denial: range(7, (i) => ({
      ep: `25-${nf(118000 + Math.floor(rnd() * 900))}`, spec: ['Ortopedia', 'Cardiologia', 'Imagiologia', 'Cirurgia Geral', 'Gastro', 'Urologia', 'Oftalmologia'][i],
      payer: ['Multicare', 'ADSE', 'Médis', 'Multicare', 'AdvanceCare', 'ADSE', 'Médis'][i],
      value: 800 + rnd() * 9000, risk: 93 - i * 6 - rnd() * 3, why: MOTIVES[i % 5],
    })),
  }), [label]);

  return (
    <>
      <ScopeNote />
      <div className="grid g4">
        <Kpi label="Faturação de outubro" value={`${nf(72.6 * k, 1)} M€`} delta="▲ 8,1% homólogo" tone="up" spark={d.sp[0]} color={C.teal} />
        <Kpi label="Prazo médio de recebimento" value="47 dias" delta="▼ 5 dias no trimestre" tone="up" spark={d.sp[1]} color={C.sky} />
        <Kpi label="Taxa de rejeição" value="3,4%" delta="▼ 0,9 p.p. com IA" tone="up" spark={d.sp[2]} color={C.violet} />
        <Kpi label="Receita em risco (por faturar)" value={`${nf(1.9 * k, k < .3 ? 2 : 1)} M€`} delta={`${nf(312 * k)} episódios sinalizados`} tone="down" spark={d.sp[3]} color={C.coral} />
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Receita mensal por pagador" sub="Milhões de euros, últimos 12 meses">
          <Chart type="columns" opts={{ labels: MONTHS, stacked: true, title: label, series: PAYERS.map((p, i) => ({ name: p.name, color: p.color, data: d.payer[i] })) }} />
        </Card>
        <Card title="Prazo médio de recebimento" sub="Dias, por entidade financiadora">
          <Chart type="bars" opts={{ unit: ' d', items: PAYERS.map((p) => ({ label: p.short, value: p.dso, color: p.dso > 60 ? C.coral : C.teal })) }} />
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
      <Card style={{ marginTop: 16 }} title="Processos pendentes e rejeitados por entidade" sub="Faturas enviadas e ainda não pagas · últimos 90 dias">
        <table className="tabular">
          <thead><tr><th>Entidade</th><th>Peso na receita</th><th>Processos pendentes</th><th>Valor pendente</th><th>Taxa de rejeição</th><th>Prazo médio de recebimento</th></tr></thead>
          <tbody>{d.claims.map((c) => (
            <tr key={c.name}><td><span className="triage" style={{ background: c.color }} /><b>{c.name}</b></td><td>{c.share}%</td><td>{nf(c.pending)}</td><td>{nf(c.value, 1)} M€</td>
              <td><span className={`pill ${c.denied < 2.5 ? 'p-ok' : c.denied < 4 ? 'p-warn' : 'p-bad'}`}>{nf(c.denied, 1)}%</span></td>
              <td><span className="bar-mini" style={{ width: c.dso * .8, background: c.dso > 60 ? C.coral : C.teal }} />{c.dso} dias</td></tr>))}</tbody>
        </table>
      </Card>
      <Card style={{ marginTop: 16 }} title="Partilha segura com a Fidelidade" pill="Snowflake Clean Room" pillClass="p-teal" sub="Indicadores conjuntos calculados sem que nenhuma das partes veja os dados individuais da outra">
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
  const { label, isAll, list } = useScope();
  const consumption = useMemo(() => range(28, (i) => 320 + 60 * Math.sin(i / 2) + rnd() * 30), []);
  const stock = isAll ? STOCK : STOCK.map(([a, , dd, r], i) => [a, label, dd + i, Math.max(18, r - 14 - i * 3)]);
  const units = isAll ? HOSPITALS.slice(0, 10) : list;
  return (
    <>
      <ScopeNote />
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
            <tbody>{stock.map(([a, u, dd, r]) => (
              <tr key={a}><td><b>{a}</b></td><td>{u}</td><td>{dd}</td><td><span className={`pill ${r > 80 ? 'p-bad' : 'p-warn'}`}>{r}%</span></td>
                <td><ActionButton label="Encomendar" done="Pedido criado" toast="Pedido de compra criado no ERP" /></td></tr>))}</tbody>
          </table>
        </Card>
        <Card title="Consumo previsto vs. stock · Contraste iodado" sub={`Unidades, ${isAll ? 'HL Lisboa' : label}`}>
          <Chart type="line" opts={{ labels: days(28, -14), forecastFrom: 13, series: [
            { name: 'Stock projetado', color: C.teal, data: range(28, (i) => Math.max(0, 900 - i * 38)), area: true },
            { name: 'Consumo diário previsto ×10', color: C.violet, dash: true, data: consumption },
            { name: 'Stock de segurança', color: C.coral, width: 1.2, data: Array(28).fill(250) },
          ] }} />
        </Card>
      </div>
      <Card style={{ marginTop: 16 }} title="Consumo por hospital" sub="Milhares de euros este mês · fármacos e material clínico">
        <Chart type="columns" opts={{ labels: units.map((h) => h.short.replace('HL ', '').replace('Hospital do ', '')), series: [
          { name: 'Fármacos', color: C.violet, data: units.map((h) => Math.round(h.beds * 3.1 * (STATS[h.name].occ / 85))) },
          { name: 'Material clínico', color: C.teal, data: units.map((h) => Math.round(h.beds * 2.4 * (STATS[h.name].orUtil / 85))) },
        ] }} />
      </Card>
      <Card style={{ marginTop: 16 }} title="Validades a expirar" sub="Valor em risco nos próximos 60 dias, por unidade">
        <Chart type="columns" opts={{ labels: ['Lisboa', 'Torres', 'Arrábida', 'Coimbra', 'Aveiro', 'Setúbal', 'Oeiras', 'Guimarães', 'Funchal'], series: [
          { name: 'Valor em risco (mil €)', color: C.sun, data: [92, 41, 68, 37, 29, 44, 18, 31, 26] },
          { name: 'Recuperável por transferência', color: C.teal, data: [70, 30, 51, 22, 20, 33, 12, 19, 14] },
        ] }} />
      </Card>
    </>
  );
}
