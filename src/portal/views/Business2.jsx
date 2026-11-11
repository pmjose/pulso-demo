import { Card, Chart, Kpi } from '../ui.jsx';
import { C, STATS, nf, range } from '../data.js';
import { ASSETS, ESG, NEW_UNITS, PRICE_GAPS, SPEND, rampPlan } from '../analytics.js';

// ---------- Ativos e compras ----------
export function Assets() {
  const idle = ASSETS.filter((a) => a.util < 70);
  const saving = PRICE_GAPS.reduce((a, g) => a + g.saving, 0);
  return (
    <>
      <div className="grid g6">
        <Kpi label="Equipamentos monitorizados" value="214" delta="RM, TC, PET, salas, robôs" />
        <Kpi label="Utilização média de RM" value="86%" delta="alvo 85%" tone="up" />
        <Kpi label="Equipamentos abaixo de 70%" value={idle.length} delta="dos 8 de maior valor" tone="down" />
        <Kpi label="Paragens não planeadas (mês)" value="21 h" delta="manutenção preditiva em 6 equipamentos" />
        <Kpi label="Fornecedores ativos" value="1 420" delta="62% da despesa em 40 fornecedores" />
        <Kpi label="Poupança por harmonização de preços" value={`${nf(saving / 1e6, 2)} M€`} delta="mesmos artigos, preços diferentes" tone="up" />
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Utilização dos equipamentos de maior valor" pill="IoT · registos de exame" pillClass="p-teal" sub="Horas usadas sobre horas disponíveis por semana">
          <table className="tabular">
            <thead><tr><th>Equipamento</th><th>Hospital</th><th>Horas usadas / disponíveis</th><th>Utilização</th><th>Exames por dia</th><th>Paragens (h/mês)</th></tr></thead>
            <tbody>{ASSETS.map((a) => (
              <tr key={a.eq + a.h}><td><b>{a.eq}</b></td><td>{a.h}</td><td>{a.used} / {a.avail} h</td>
                <td><span className="bar-mini" style={{ width: a.util * .7, background: a.util < 70 ? C.coral : a.util > 95 ? C.sun : C.teal }} />{nf(a.util, 0)}%</td>
                <td>{a.perDay}</td><td>{a.down}</td></tr>))}</tbody>
          </table>
        </Card>
        <Card title="Utilização por equipamento" sub="% das horas disponíveis">
          <Chart type="bars" ai={{ action: 'Abrir a TC 64 cortes do HL Leiria a doentes do HL Coimbra e de Santarém com marcação centralizada.', impact: 'Passar a TC de Leiria de 54% para 75% acrescenta ≈ 13 exames por dia sem novo equipamento.' }}
            opts={{ unit: '%', max: 100, items: ASSETS.map((a) => ({ label: `${a.eq} · ${a.h.replace('HL ', '')}`, value: Math.round(a.util), target: 70, color: a.util < 70 ? C.coral : C.teal })) }} />
        </Card>
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title="Despesa por categoria" sub="% das compras em 2026">
          <Chart type="donut" ai={{ action: 'Negociar acordos-quadro de grupo nos dispositivos e implantes, a segunda maior categoria.', impact: 'Uma redução de 3% nesta categoria vale ≈ 2,4 M€ por ano.' }}
            opts={{ center: '100%', centerLabel: 'despesa 2026', items: SPEND.map(([l, v, c]) => ({ label: l, value: v, color: c })) }} />
        </Card>
        <Card className="s2" title="Mesmo artigo, preços diferentes" pill="Cortex · harmonização de catálogo" pillClass="p-ai" sub="Artigos equivalentes identificados por IA nos catálogos dos hospitais">
          <table className="tabular">
            <thead><tr><th>Artigo</th><th>Preço mínimo</th><th>Preço máximo</th><th>Melhor compra</th><th>Pior compra</th><th>Poupança potencial</th></tr></thead>
            <tbody>{PRICE_GAPS.map((g) => (
              <tr key={g.item}><td><b>{g.item}</b></td><td>{nf(g.min, g.min < 100 ? 2 : 0)} €</td><td>{nf(g.max, g.max < 100 ? 2 : 0)} €</td><td>{g.best}</td><td>{g.worst}</td><td><b>{nf(g.saving / 1000, 0)} mil €</b></td></tr>))}</tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

// ---------- ESG ----------
export function Esg() {
  const e = ESG.emissions;
  return (
    <>
      <div className="grid g6">
        <Kpi label="Emissões (âmbitos 1 e 2)" value="38,6 kt CO₂e" delta="previsão 2026 · ▼ 6,3%" tone="up" />
        <Kpi label="Intensidade energética" value="118 kWh" delta="por dia de internamento" tone="up" />
        <Kpi label="Eletricidade renovável" value="64%" delta="▲ 11 p.p. · meta 2030: 100%" tone="up" />
        <Kpi label="Resíduos hospitalares (grupos III e IV)" value="2,1 kg" delta="por dia de internamento" />
        <Kpi label="Consumo de água" value="0,61 m³" delta="por dia de internamento" />
        <Kpi label="Gases anestésicos" value="−38%" delta="desflurano retirado em 2025" tone="up" />
      </div>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Emissões de âmbito 1 e 2" pill="ESRS E1" pillClass="p-teal" sub="Milhares de toneladas de CO₂e · trajetória para a meta de 2030">
          <Chart type="line" ai={{ action: 'Antecipar para 2027 a instalação solar nos 4 hospitais com maior consumo e eletrificar a frota de transporte de doentes.', impact: 'Coloca a trajetória na meta de 2030 (28,4 kt), dois anos mais cedo.' }}
            opts={{ labels: e.labels.concat(['2027', '2028', '2029', '2030']), min: 20, max: 52, series: [
              { name: 'Emissões (kt CO₂e)', color: C.petrol, data: e.data.concat([null, null, null, null]), area: true },
              { name: 'Trajetória para a meta', color: C.ok, dash: true, data: [null, null, null, null, 38.6, 36.0, 33.4, 30.9, 28.4] },
              { name: 'Meta 2030 (28,4)', color: C.grey, width: 1, data: Array(9).fill(e.target2030) },
            ] }} />
        </Card>
        <Card title="Intensidade energética por hospital" sub="kWh por dia de internamento · média do grupo 118">
          <Chart type="bars" ai={{ action: 'Auditar a climatização dos 2 hospitais com maior intensidade energética, a principal causa de consumo.', impact: 'Levar estes hospitais à média do grupo reduz ≈ 1,9 kt CO₂e por ano.' }}
            opts={{ unit: ' kWh', items: [...ESG.intensity].sort((a, b) => b[1] - a[1]).map(([l, v]) => ({ label: l, value: v, target: 118, color: v > 118 ? C.coral : C.teal })) }} />
        </Card>
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card title="Consumo de energia por fonte" sub="GWh · 2026 (previsão)">
          <Chart type="donut" ai={{ action: 'Assinar um contrato de compra de energia renovável (PPA) para os hospitais de Lisboa.', impact: 'Sobe a eletricidade renovável de 64% para ≈ 85% em 2027.' }}
            opts={{ center: '142 GWh', centerLabel: 'consumo', items: [{ label: 'Eletricidade renovável', value: 64, color: C.ok }, { label: 'Eletricidade da rede', value: 36 * .62, color: C.sky }, { label: 'Gás natural', value: 36 * .31, color: C.sun }, { label: 'Gasóleo (geradores e frota)', value: 36 * .07, color: C.grey }].map((x) => ({ ...x, value: +x.value.toFixed(1) })) }} />
        </Card>
        <Card title="Resíduos hospitalares" sub="kg por dia de internamento · grupos III e IV">
          <Chart type="line" ai={{ action: 'Rever a triagem de resíduos no bloco operatório, onde estão 41% dos resíduos do grupo III.', impact: 'Separar corretamente o material não contaminado baixa ≈ 0,2 kg por dia de internamento.' }}
            opts={{ labels: ['2021', '2022', '2023', '2024', '2025', '2026'], min: 1.5, max: 3, series: [{ name: 'Resíduos (kg)', color: C.petrol, area: true, data: [2.6, 2.5, 2.4, 2.3, 2.2, 2.1] }] }} />
        </Card>
        <Card title="Iniciativas em curso" sub="Contributo esperado para a meta de 2030 (kt CO₂e por ano)">
          {[['Painéis solares em 4 hospitais', '−3,1'], ['Eletrificação da frota de transporte', '−1,4'], ['Climatização inteligente', '−1,9'], ['Fim do desflurano', '−2,2 (concluído)'], ['Compras com critérios ambientais', '−0,8']].map(([k, v]) => <div key={k} className="metric"><span>{k}</span><b>{v}</b></div>)}
        </Card>
      </div>
      <p className="sub" style={{ marginTop: 14 }}>Indicadores alinhados com o relatório de sustentabilidade (ESRS E1) partilhado com a Fidelidade. Valores fictícios.</p>
    </>
  );
}

// ---------- Novas unidades ----------
export function NewUnits() {
  const rows = NEW_UNITS.map((u) => {
    const s = STATS[u.name];
    const plan = rampPlan(u.months);
    // Each unit's occupancy curve rises to today's actual occupancy.
    const curve = range(u.months + 1, (m) => +(30 + (s.occ - 30) * (1 - Math.exp(-m / 6)) / (1 - Math.exp(-u.months / 6))).toFixed(1));
    return { ...u, s, plan, curve, consults: Math.round(u.consultPlan * (s.occ / plan) * .97) };
  });
  const L = rows.find((r) => r.short === 'HL Leiria');
  return (
    <>
      <div className="grid g4">
        {rows.map((r) => (
          <div key={r.short} className="card kpi">
            <div className="lbl">{r.short} · aberto em {r.opened}</div>
            <div className="v">{nf(r.s.occ, 1)}%</div>
            <div className={`d ${r.s.occ >= r.plan ? 'up' : 'down'}`}>ocupação · plano {nf(r.plan, 0)}% no mês {r.months}</div>
          </div>
        ))}
      </div>
      <div className="grid g3" style={{ marginTop: 16 }}>
        <Card className="s2" title="Ocupação real vs. plano de abertura · HL Leiria" sub="Meses desde a abertura (03/2026)">
          <Chart type="line" ai={{ action: 'Abrir a Ortopedia programada no HL Leiria com os cirurgiões do HL Coimbra, usando a lista de espera da região Centro.', impact: 'Fecha a diferença para o plano de abertura em ≈ 2 meses e antecipa o break-even de 11/2027.' }}
            opts={{ labels: range(L.months + 1, (m) => `M${m}`), unit: '%', min: 20, max: 90, series: [
              { name: 'Ocupação real', color: C.teal, data: L.curve, area: true },
              { name: 'Plano de abertura', color: C.violet, dash: true, data: range(L.months + 1, (m) => +rampPlan(m).toFixed(1)) },
            ] }} />
        </Card>
        <Card title="Consultas por mês vs. plano" sub="Mês atual">
          <Chart type="bars" ai={{ action: 'Centralizar as marcações da região Centro na app MY LUZ com sugestão automática da unidade mais próxima com vaga.', impact: 'Dirige ≈ 600 consultas por mês para as unidades novas com capacidade livre.' }}
            opts={{ items: rows.map((r) => ({ label: r.short, value: r.consults, target: r.consultPlan, color: r.consults >= r.consultPlan ? C.teal : C.sun })) }} />
        </Card>
      </div>
      <Card style={{ marginTop: 16 }} title="Acompanhamento das novas unidades" sub="Ramp-up face ao plano de abertura aprovado">
        <table className="tabular">
          <thead><tr><th>Unidade</th><th>Abertura</th><th>Meses</th><th>Ocupação vs. plano</th><th>Consultas vs. plano</th><th>Equipa contratada</th><th>Margem atual</th><th>Break-even previsto</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.short}><td><b>{r.short}</b></td><td>{r.opened}</td><td>{r.months}</td>
              <td><span className={`pill ${r.s.occ >= r.plan ? 'p-ok' : 'p-warn'}`}>{nf(r.s.occ, 1)}% / {nf(r.plan, 0)}%</span></td>
              <td>{nf(r.consults)} / {nf(r.consultPlan)}</td><td>{r.staff} / {r.staffPlan}</td>
              <td style={{ color: r.s.margin < 0 ? C.coral : 'inherit' }}>{nf(r.s.margin, 1)}%</td><td>{r.breakEven}</td></tr>))}</tbody>
        </table>
      </Card>
      <div className="grid g2" style={{ marginTop: 16 }}>
        <Card title="Equipa contratada vs. plano" sub="Pessoas por unidade">
          <Chart type="columns" ai={{ action: 'Antecipar o recrutamento de enfermagem na Figueira da Foz, a unidade mais longe do plano de equipa.', impact: 'Com 19 pessoas em falta (sobretudo enfermagem), a unidade não consegue abrir o segundo piso de internamento previsto para janeiro.' }}
            opts={{ labels: rows.map((r) => r.short.replace('HL ', '')), series: [{ name: 'Plano', color: C.grey, data: rows.map((r) => r.staffPlan) }, { name: 'Contratados', color: C.teal, data: rows.map((r) => r.staff) }] }} />
        </Card>
        <Card title="De onde vêm os doentes das novas unidades" sub="% das primeiras consultas · últimos 90 dias">
          <Chart type="donut" ai={{ action: 'Fazer campanhas MY LUZ dirigidas a clientes do grupo que vivem perto das novas unidades e ainda se deslocam a Lisboa ou Coimbra.', impact: 'Há ≈ 41 mil clientes nessa situação; trazer 10% liberta capacidade nos hospitais centrais.' }}
            opts={{ center: '4', centerLabel: 'unidades', items: [{ label: 'Clientes novos da região', value: 46, color: C.teal }, { label: 'Clientes do grupo que mudaram de hospital', value: 31, color: C.sky }, { label: 'Encaminhados pelas clínicas', value: 15, color: C.violet }, { label: 'Referência de médicos externos', value: 8, color: C.sun }] }} />
        </Card>
      </div>
    </>
  );
}
