import { useMemo } from 'react';
import { ActionButton, Card, Chart, Kpi, ScopeNote, useScope, useUnit, PageTabs } from '../ui.jsx';
import { C, CLINICS, GROUP, HOSPITALS, SPECIALTIES, STATS, days, nf, range, seeded } from '../data.js';

// Manchester triage levels with target times (minutes).
const TRIAGE = [
  { level: 'Vermelho', label: 'Emergente', color: '#d64545', target: 0, share: .6 },
  { level: 'Laranja', label: 'Muito urgente', color: '#ef7d22', target: 10, share: 7.4 },
  { level: 'Amarelo', label: 'Urgente', color: '#f5c400', target: 60, share: 31.8 },
  { level: 'Verde', label: 'Pouco urgente', color: '#1f9d6b', target: 120, share: 52.1 },
  { level: 'Azul', label: 'Não urgente', color: '#2a9fd6', target: 240, share: 8.1 },
];

// ---------- Operações hospitalares ----------
export function Operations() {
  const { list, g, isAll, label } = useScope();
  const { setUnit } = useUnit();
  const r = useMemo(() => seeded('ops' + label), [label]);
  const d = useMemo(() => {
    const triage = TRIAGE.map((t) => {
      const wait = t.target === 0 ? 0 : t.target * (.45 + r() * .55) * (g.erWait / 38);
      return { ...t, visits: Math.round(g.erVisits * t.share / 100), wait, within: Math.min(99, 100 - Math.max(0, (wait - t.target * .7) / Math.max(1, t.target)) * 60 - r() * 6) };
    });
    const adm = range(14, (i) => Math.round(g.admissions * (.88 + .2 * Math.sin(i / 2) + r() * .08) * (i % 7 > 4 ? .72 : 1)));
    const dis = adm.map((v) => Math.round(v * (.94 + r() * .1)));
    const alosSpec = SPECIALTIES.slice(0, 7).map((s) => ({ label: s, value: +(g.alos * (.6 + r() * .9)).toFixed(1) }));
    const cancel = [['Doente não apto (pré-operatório)', 31], ['Falta de cama de internamento', 22], ['Atraso da cirurgia anterior', 18], ['Doente faltou', 14], ['Material/equipamento', 9], ['Outros', 6]];
    return { triage, adm, dis, alosSpec, cancel };
  }, [label]);

  return (
    <>
      <ScopeNote />
      <div className="grid g6">
        <Kpi label="Ocupação de camas" value={`${nf(g.occ, 1)}%`} delta={`${nf(g.beds)} camas · alvo 88%`} tone={g.occ > 90 ? 'down' : 'up'} />
        <Kpi label="Demora média" value={`${nf(g.alos, 1)} dias`} delta="▼ 0,2 dias vs. 2025" tone="up" />
        <Kpi label="Admissões hoje" value={nf(g.admissions)} delta={`${nf(g.discharges)} altas`} />
        <Kpi label="Episódios de urgência hoje" value={nf(g.erVisits)} delta={`Espera média ${nf(g.erWait)} min`} tone={g.erWait > 45 ? 'down' : 'up'} />
        <Kpi label="Utilização do bloco" value={`${nf(g.orUtil, 1)}%`} delta="Objetivo 85%" tone={g.orUtil >= 85 ? 'up' : 'down'} />
        <Kpi label="Cirurgias canceladas" value={`${nf(g.orCancel, 1)}%`} delta="no próprio dia · alvo < 4%" tone={g.orCancel < 4 ? 'up' : 'down'} />
      </div>
      <PageTabs label="Secções" tabs={[
        ['Urgência', () => (
          <>
          <div className="grid g3" style={{ marginTop: 16 }}>
            <Card className="s2" title="Urgência por nível de triagem de Manchester" pill="Hoje" pillClass="p-teal" sub={`${label} · volume, tempo até primeira observação médica e cumprimento do tempo-alvo`}>
              <table className="tabular">
                <thead><tr><th>Prioridade</th><th>Episódios</th><th>% do total</th><th>Espera média</th><th>Tempo-alvo</th><th>Dentro do alvo</th></tr></thead>
                <tbody>{d.triage.map((t) => (
                  <tr key={t.level}>
                    <td><span className="triage" style={{ background: t.color }} /><b>{t.level}</b> <span style={{ color: 'var(--muted)' }}>· {t.label}</span></td>
                    <td>{nf(t.visits)}</td><td>{nf(t.share, 1)}%</td>
                    <td>{t.target === 0 ? 'Imediato' : `${nf(t.wait)} min`}</td>
                    <td>{t.target === 0 ? 'Imediato' : `${t.target} min`}</td>
                    <td><span className={`pill ${t.within >= 90 ? 'p-ok' : t.within >= 75 ? 'p-warn' : 'p-bad'}`}>{nf(t.target === 0 ? 100 : t.within)}%</span></td>
                  </tr>))}</tbody>
              </table>
            </Card>
            <Card title="Distribuição por prioridade" sub="Episódios de urgência hoje">
              <Chart ai={{ action: 'Encaminhar verdes e azuis para a via rápida e para a teleconsulta LUZ 24.', impact: 'Cerca de 60% dos episódios são pouco ou não urgentes: −25 min de espera para os amarelos.' }} type="donut" opts={{ center: nf(g.erVisits), centerLabel: 'episódios', items: d.triage.map((t) => ({ label: t.level, value: t.visits, color: t.color })) }} />
            </Card>
          </div>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <Card title="Tempo por etapa do episódio" sub={`${label} · mediana em minutos, hoje`}>
              <Chart ai={{ action: 'Atacar o tempo entre a decisão de internamento e a saída da urgência: é a etapa mais longa e depende de camas.', impact: 'Antecipar 18 altas antes das 12h reduz esta etapa em ≈ 35 min nos doentes internados.' }} type="bars" opts={{ unit: ' min', items: [['Admissão → triagem', 7], ['Triagem → 1.ª observação', Math.round(g.erWait * .62)], ['Observação → exames', 34], ['Exames → decisão', 41], ['Decisão → saída (internados)', 96], ['Decisão → saída (altas)', 18]].map(([l, v]) => ({ label: l, value: v, color: v > 60 ? C.coral : C.teal })) }} />
            </Card>
            <Card title="Episódios por hora · hoje" sub={`${label} · real até às 12h e previsão para o resto do dia`}>
              <Chart ai={{ action: 'Abrir a segunda sala de observação às 18h, antes do pico da noite.', impact: 'O pico das 20h fica dentro da capacidade sem esperas acima de 60 min para os amarelos.' }} type="line" opts={{ labels: range(24, (h) => `${h}h`), forecastFrom: 12, series: [
                { name: 'Real', color: C.teal, area: true, data: range(24, (h) => (h <= 12 ? Math.round(g.erVisits / 24 * (0.45 + 1.1 * Math.exp(-((h - 11) ** 2) / 18) + 0.9 * Math.exp(-((h - 20) ** 2) / 10))) : null)) },
                { name: 'Previsto', color: C.violet, dash: true, data: range(24, (h) => (h >= 12 ? Math.round(g.erVisits / 24 * (0.45 + 1.1 * Math.exp(-((h - 11) ** 2) / 18) + 0.9 * Math.exp(-((h - 20) ** 2) / 10))) : null)) },
              ] }} />
            </Card>
          </div>
          </>
        )],
        ['Internamento e bloco', () => (
          <>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <Card title="Admissões e altas" sub={`${label} · últimos 14 dias`}>
              <Chart ai={{ action: 'Planear altas ao fim de semana: as altas descem mais do que as admissões ao sábado e ao domingo.', impact: 'Equilibrar o fim de semana evita a acumulação de ≈ 30 doentes à segunda-feira.' }} type="columns" opts={{ labels: days(14, -13), series: [{ name: 'Admissões', color: C.teal, data: d.adm }, { name: 'Altas', color: C.sun, data: d.dis }] }} />
            </Card>
            <Card title="Demora média por especialidade" sub="Dias de internamento, últimos 30 dias">
              <Chart ai={{ action: 'Abrir gestão de casos nas especialidades acima de 1,2× a demora média, começando pela mais longa.', impact: '−0,5 dias de demora libertam ≈ 8% das camas dessas especialidades.' }} type="bars" opts={{ unit: ' d', items: d.alosSpec.map((x) => ({ ...x, color: x.value > g.alos * 1.2 ? C.coral : C.teal })) }} />
            </Card>
          </div>
          <div className="grid g3" style={{ marginTop: 16 }}>
            <Card className="s2" title="Ocupação por hospital" sub="Clique numa linha para filtrar o portal por esse hospital">
              <table className="tabular">
                <thead><tr><th>Hospital</th><th>Região</th><th>Camas</th><th>Ocupação</th><th>Demora média</th><th>Bloco</th><th>Cancelamentos</th></tr></thead>
                <tbody>{(isAll ? HOSPITALS : list).map((h) => {
                  const s = STATS[h.name];
                  return (
                    <tr key={h.name} style={{ cursor: 'pointer' }} onClick={() => setUnit(h.name)}>
                      <td><b>{h.short}</b>{h.isNew && <span className="new-tag">NOVA</span>}</td><td>{h.region}</td><td>{h.beds}</td>
                      <td><span className="bar-mini" style={{ width: s.occ * .5, background: s.occ > 90 ? C.coral : C.teal }} />{nf(s.occ, 1)}%</td>
                      <td>{nf(s.alos, 1)} d</td><td>{nf(s.orUtil)}%</td>
                      <td><span className={`pill ${s.orCancel < 4 ? 'p-ok' : 'p-warn'}`}>{nf(s.orCancel, 1)}%</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </Card>
            <Card title="Motivos de cancelamento cirúrgico" sub="Últimos 90 dias · % dos cancelamentos">
              <Chart ai={{ action: 'Reservar camas 48 h antes das cirurgias programadas, com base na previsão de altas.', impact: 'Elimina ≈ metade dos cancelamentos por falta de cama: ≈ 40 cirurgias por mês recuperadas.' }} type="bars" opts={{ unit: '%', items: d.cancel.map(([l, v], i) => ({ label: l, value: v, color: i < 2 ? C.coral : C.sun })) }} />
              <div className="insight" style={{ marginTop: 14 }}><div className="ic">✦</div><div><p>22% dos cancelamentos devem-se a <b>falta de cama</b>. O modelo de previsão de altas permite reservar camas 48 h antes.</p></div></div>
            </Card>
          </div>
          </>
        )],
      ]} />
    </>
  );
}

// ---------- Ambulatório e acesso ----------
const CHANNELS = [['App MY LUZ', 41, C.teal], ['Telefone (Linha Luz)', 27, C.sky], ['Website', 14, C.violet], ['Balcão', 11, C.sun], ['LUZ 24 · Digital', 7, C.coral]];
const NOSHOW = [
  ['Rui Fernandes', 'Cardiologia', '08:00', '2 faltas nos últimos 6 meses', 82], ['Catarina Lopes', 'Dermatologia', '09:30', 'Marcação feita há 94 dias', 74],
  ['João Pereira', 'Ortopedia', '10:15', 'Distância > 40 km e previsão de chuva', 69], ['Inês Martins', 'Psiquiatria', '11:00', 'Sem confirmação na app', 61],
  ['Tiago Sousa', 'Gastroenterologia', '14:30', 'Primeira consulta, sem seguro', 55], ['Beatriz Gomes', 'Pediatria', '15:00', 'Historial de atrasos às 15h', 48],
];

export function Outpatient() {
  const { g, label } = useScope();
  const d = useMemo(() => {
    const r = seeded('amb' + label);
    const spec = SPECIALTIES.map((s) => ({ s, n: Math.round(g.consults * (.04 + r() * .12)), wait: g.daysToFirst * (.5 + r() * 1.1), ns: g.noShow * (.7 + r() * .6), tele: g.tele * (.3 + r() * 2) }));
    const months = ['jun', 'jul', 'ago', 'set', 'out', 'nov'];
    const pres = months.map((_, i) => Math.round(g.consults * (1 - g.tele / 100) * (.93 + i * .015 + r() * .03)));
    const tele = months.map((_, i) => Math.round(g.consults * g.tele / 100 * (.85 + i * .05 + r() * .04)));
    return { spec, months, pres, tele };
  }, [label]);

  return (
    <>
      <ScopeNote />
      <div className="grid g6">
        <Kpi label="Consultas este mês" value={nf(g.consults)} delta="▲ 6,9% homólogo" tone="up" />
        <Kpi label="Tempo até 1.ª consulta" value={`${nf(g.daysToFirst, 1)} dias`} delta="média · alvo 14 dias" tone={g.daysToFirst <= 14 ? 'up' : 'down'} />
        <Kpi label="Taxa de faltas" value={`${nf(g.noShow, 1)}%`} delta="▼ 1,4 p.p. com lembretes IA" tone="up" />
        <Kpi label="Teleconsultas" value={`${nf(g.tele, 1)}%`} delta={`≈ ${nf(g.consults * g.tele / 100)} este mês`} />
        <Kpi label="Marcações via MY LUZ" value="41%" delta="▲ 5 p.p. homólogo" tone="up" />
        <Kpi label="Utilizadores MY LUZ" value={`${nf(GROUP.myLuzUsers, 1)} M`} delta="411 mil LUZ ON PRIME" tone="up" />
      </div>
      <PageTabs label="Secções" tabs={[
        ['Consultas', () => (
          <>
          <div className="grid g3" style={{ marginTop: 16 }}>
            <Card className="s2" title="Consultas por especialidade" sub={`${label} · este mês`}>
              <table className="tabular">
                <thead><tr><th>Especialidade</th><th>Consultas</th><th>Tempo até 1.ª consulta</th><th>Faltas</th><th>Teleconsulta</th></tr></thead>
                <tbody>{d.spec.map((x) => (
                  <tr key={x.s}><td><b>{x.s}</b></td><td>{nf(x.n)}</td>
                    <td><span className="bar-mini" style={{ width: x.wait * 3, background: x.wait > 21 ? C.coral : x.wait > 14 ? C.sun : C.teal }} />{nf(x.wait)} dias</td>
                    <td>{nf(x.ns, 1)}%</td><td>{nf(x.tele, 1)}%</td></tr>))}</tbody>
              </table>
            </Card>
            <Card title="Canal de marcação" sub="Últimos 30 dias">
              <Chart ai={{ action: 'Migrar marcações telefónicas recorrentes para a app MY LUZ, com lembrete ativo.', impact: '+10 p.p. de marcações na app poupam ≈ 9 000 chamadas por mês e reduzem as faltas em 0,6 p.p.' }} type="donut" opts={{ center: '41%', centerLabel: 'via app MY LUZ', items: CHANNELS.map(([l, v, c]) => ({ label: l, value: v, color: c })) }} />
            </Card>
          </div>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <Card title="Presencial vs. teleconsulta" sub="Hospital da Luz Digital e LUZ 24 · últimos 6 meses">
              <Chart ai={{ action: 'Converter consultas de seguimento estáveis (Endocrinologia, Psiquiatria) em teleconsulta.', impact: 'Cada ponto percentual de teleconsulta liberta ≈ 2 100 vagas presenciais por mês para primeiras consultas.' }} type="columns" opts={{ labels: d.months, stacked: true, series: [{ name: 'Presencial', color: C.teal, data: d.pres }, { name: 'Teleconsulta', color: C.violet, data: d.tele }] }} />
            </Card>
            <Card title="Ocupação das agendas" sub="% das vagas de consulta marcadas · próximas 4 semanas">
              <Chart ai={{ action: 'Abrir vagas extra em Ortopedia e Dermatologia e reduzir em Pediatria, onde as agendas têm folga.', impact: 'Mesmo número de médicos com ≈ 1 400 primeiras consultas a mais por mês nas especialidades com espera.' }} type="bars" opts={{ unit: '%', max: 100, items: d.spec.slice(0, 8).map((x, i) => ({ label: x.s, value: Math.min(99, Math.round(70 + x.wait * 1.1 + (i % 3) * 2)), target: 90, color: 70 + x.wait * 1.1 > 92 ? C.coral : C.teal })) }} />
            </Card>
          </div>
          </>
        )],
        ['Rede de clínicas', () => (
          <>
          <Card style={{ marginTop: 16 }} title="Rede de clínicas" pill={`${CLINICS.length} clínicas`} pillClass="p-teal" sub="Consultas, imagiologia e pequena cirurgia em ambulatório · este mês">
            <table className="tabular">
              <thead><tr><th>Clínica</th><th>Região</th><th>Consultas</th><th>Tempo até 1.ª consulta</th><th>Faltas</th><th>Teleconsulta</th><th>Imagiologia</th></tr></thead>
              <tbody>{[...CLINICS].sort((a, b) => b.consults - a.consults).slice(0, 12).map((c) => (
                <tr key={c.name}><td><b>{c.short}</b></td><td>{c.region}</td><td>{nf(c.consults)}</td>
                  <td><span className="bar-mini" style={{ width: c.daysToFirst * 4, background: c.daysToFirst > 12 ? C.sun : C.teal }} />{nf(c.daysToFirst)} dias</td>
                  <td>{nf(c.noShow, 1)}%</td><td>{nf(c.tele, 1)}%</td><td>{c.imaging ? <span className="pill p-ok">Sim</span> : <span className="pill p-ml">Não</span>}</td></tr>))}</tbody>
            </table>
            <p className="sub" style={{ marginTop: 10, marginBottom: 0 }}>12 clínicas com mais atividade de {CLINICS.length}. As clínicas encaminham {nf(18.4, 1)}% dos doentes para internamento ou cirurgia nos hospitais do grupo.</p>
          </Card>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <Card title="Consultas por região" sub={`${CLINICS.length} clínicas · este mês`}>
              <Chart ai={{ action: 'Abrir imagiologia na clínica do Norte com mais consultas e sem equipamento próprio.', impact: 'Evita ≈ 1 100 deslocações por mês ao hospital e encurta o diagnóstico em 2 dias.' }} type="donut" opts={{ center: nf(CLINICS.reduce((a, c) => a + c.consults, 0)), centerLabel: 'consultas', items: ['Lisboa', 'Norte', 'Centro', 'Sul', 'Madeira'].map((reg, i) => ({ label: reg, value: CLINICS.filter((c) => c.region === reg).reduce((a, c) => a + c.consults, 0), color: [C.teal, C.sky, C.violet, C.sun, C.ok][i] })).filter((x) => x.value > 0) }} />
            </Card>
            <Card title="Tempo até 1.ª consulta por região" sub="Média das clínicas, em dias · alvo 14 dias">
              <Chart ai={{ action: 'Redirecionar marcações na app MY LUZ para clínicas próximas com vagas mais cedo.', impact: 'Na região com mais espera, ≈ 30% dos doentes aceitam outra clínica a menos de 15 km: −4 dias de espera.' }} type="bars" opts={{ unit: ' d', items: ['Lisboa', 'Norte', 'Centro', 'Sul', 'Madeira'].map((reg) => { const cs = CLINICS.filter((c) => c.region === reg); return cs.length ? { label: reg, value: +(cs.reduce((a, c) => a + c.daysToFirst, 0) / cs.length).toFixed(1), target: 14, color: C.teal } : null; }).filter(Boolean) }} />
            </Card>
          </div>
          </>
        )],
        ['Faltas', () => (
          <>
          <Card style={{ marginTop: 16 }} title="Consultas com risco de falta · amanhã" pill="ML · no-show AUC 0,87" sub="Ordenado por probabilidade. Lembretes automáticos via app MY LUZ e SMS.">
            <table className="tabular">
              <thead><tr><th>Doente</th><th>Especialidade</th><th>Hora</th><th>Probabilidade de falta</th><th>Principal motivo</th><th /></tr></thead>
              <tbody>{NOSHOW.map(([n, s, h, why, p]) => (
                <tr key={n}><td><b>{n}</b></td><td>{s}</td><td>{h}</td>
                  <td><span className="bar-mini" style={{ width: p, background: p > 60 ? C.coral : C.sun }} />{p}%</td>
                  <td style={{ color: 'var(--muted)' }}>{why}</td>
                  <td><ActionButton label="Enviar lembrete" done="Enviado" toast="Lembrete enviado pela app MY LUZ" /></td></tr>))}</tbody>
            </table>
          </Card>
          <div className="grid g2" style={{ marginTop: 16 }}>
            <Card title="Taxa de faltas · últimos 12 meses" sub="% de consultas sem comparência · lembretes IA desde maio">
              <Chart ai={{ action: 'Juntar à mensagem de lembrete a opção de remarcar com um toque, além de confirmar.', impact: 'Nos pilotos, a remarcação direta converte 38% das faltas previstas em vagas reaproveitadas.' }} type="line" opts={{ labels: ['dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov'], unit: '%', min: 4, max: 12, series: [{ name: 'Taxa de faltas', color: C.violet, area: true, data: [9.9, 10.1, 9.8, 9.9, 9.8, 9.6, 9.3, 9.1, 8.9, 8.7, 8.6, +g.noShow.toFixed(1)] }] }} />
            </Card>
            <Card title="O que explica as faltas" pill="ML · importância das variáveis" pillClass="p-ml" sub="Contribuição de cada fator para o modelo de faltas">
              <Chart ai={{ action: 'Marcar as primeiras consultas com mais de 60 dias de antecedência com confirmação obrigatória 7 dias antes.', impact: 'A antecedência da marcação é o fator com mais peso: atuar nele reduz ≈ 0,8 p.p. de faltas.' }} type="bars" opts={{ unit: '%', items: [['Antecedência da marcação', 27], ['Faltas anteriores', 22], ['Distância e meteorologia', 16], ['Sem confirmação na app', 14], ['Hora da consulta', 11], ['Tipo de seguro', 10]].map(([l, v]) => ({ label: l, value: v, color: C.violet })) }} />
            </Card>
          </div>
          </>
        )],
      ]} />
    </>
  );
}
