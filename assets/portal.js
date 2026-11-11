(function () {
  const $ = (s) => document.querySelector(s);
  const C = { teal: '#00acc1', petrol: '#007c8c', sun: '#f5a800', coral: '#e4572e', violet: '#6b5bd2', sky: '#2a9fd6', ok: '#1f9d6b', grey: '#9fb0b6' };
  let seed = 42;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const range = (n, f) => Array.from({ length: n }, (_, i) => f(i));
  const nf = (v, d = 0) => v.toLocaleString('pt-PT', { minimumFractionDigits: d, maximumFractionDigits: d });
  const toast = (t) => { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2600); };

  const UNITS = ['Hospital da Luz Lisboa', 'Hospital da Luz Torres de Lisboa', 'Hospital da Luz Arrábida', 'Hospital da Luz Coimbra', 'Hospital da Luz Aveiro', 'Hospital da Luz Setúbal', 'Hospital da Luz Oeiras', 'Hospital da Luz Guimarães', 'Hospital da Luz Funchal', 'Hospital do Mar Cuidados Especializados'];
  UNITS.forEach((u) => $('#unit').insertAdjacentHTML('beforeend', `<option>${u}</option>`));
  $('#unit').addEventListener('change', (e) => toast(`Filtro aplicado: ${e.target.value}`));

  // ---------- navigation ----------
  const TITLES = { overview: ['Gestão', 'Visão geral'], flow: ['Gestão', 'Fluxo de doentes'], revenue: ['Gestão', 'Receita e seguradoras'], supply: ['Gestão', 'Farmácia e stocks'], patient: ['Doentes', 'Doente 360°'], senior: ['Doentes', 'Cuidados sénior'], assistant: ['Inteligência artificial', 'Assistente Luz IA'], notes: ['Inteligência artificial', 'Notas clínicas IA'], models: ['Inteligência artificial', 'Modelos preditivos'] };
  const rendered = {};
  function go(v) {
    document.querySelectorAll('.nav button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
    document.querySelectorAll('.view').forEach((s) => s.classList.toggle('on', s.id === 'v-' + v));
    $('#crumb').textContent = TITLES[v][0]; $('#title').textContent = TITLES[v][1];
    if (!rendered[v]) { RENDER[v](); rendered[v] = true; }
    history.replaceState(null, '', '#' + v);
    scrollTo(0, 0);
  }
  document.querySelectorAll('.nav button').forEach((b) => b.addEventListener('click', () => go(b.dataset.v)));
  $('#q').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.value.trim()) { const q = e.target.value; e.target.value = ''; go('assistant'); ask(q); } });

  const kpi = (lbl, v, d, cls, sparkData, color) => `<div class="card kpi"><div class="lbl">${lbl}</div><div class="v">${v}</div><div class="d ${cls}">${d}</div>${sparkData ? `<div class="sp-k" data-s="${sparkData.join(',')}" data-c="${color || C.teal}"></div>` : ''}</div>`;
  const sparks = (root) => root.querySelectorAll('.sp-k').forEach((el) => Ch.spark(el, el.dataset.s.split(',').map(Number), el.dataset.c));
  const days = (n, from) => range(n, (i) => { const d = new Date(2026, 10, 11 + from + i); return `${d.getDate()}/${d.getMonth() + 1}`; });
  const MONTHS = ['dez', 'jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov'];

  const RENDER = {
    overview() {
      $('#kpis').innerHTML =
        kpi('Doentes atendidos hoje', '9 482', '▲ 4,1% vs. média', 'up', range(14, (i) => 8600 + rnd() * 900 + i * 30)) +
        kpi('Ocupação de internamento', '87,4%', '▲ 2,3 p.p. vs. semana', 'down', range(14, (i) => 80 + rnd() * 6 + i * .3), C.coral) +
        kpi('Espera média na urgência', '38 min', '▼ 6 min vs. ontem', 'up', range(14, () => 35 + rnd() * 18), C.sky) +
        kpi('Receita acumulada', '712,4 M€', '▲ 8,6% homólogo', 'up', range(14, (i) => 600 + i * 8 + rnd() * 10)) +
        kpi('Taxa de faltas', '7,8%', '▼ 1,4 p.p. desde lembretes IA', 'up', range(14, (i) => 9.8 - i * .14 + rnd() * .5), C.violet) +
        kpi('NPS', '71', '▲ 3 pontos no trimestre', 'up', range(14, (i) => 64 + i * .4 + rnd() * 2), C.sun);
      sparks($('#kpis'));

      const real = range(30, (i) => 80 + 5 * Math.sin(i / 3.2) + rnd() * 3 + i * .12);
      const fc = range(14, (i) => 84.5 + 4 * Math.sin((i + 30) / 3.2) + i * .25);
      const labels = days(44, -30);
      Ch.line($('#c-occ'), {
        id: 'occ', labels, unit: '%', min: 70, max: 100, forecastFrom: 29,
        series: [
          { name: 'Ocupação real', color: C.teal, data: real.concat(Array(14).fill(null)), area: true },
          { name: 'Previsão', color: C.violet, dash: true, data: Array(29).fill(null).concat([real[29]], fc), lo: Array(30).fill(null).concat(fc.map((v, i) => v - 1.2 - i * .18)), hi: Array(30).fill(null).concat(fc.map((v, i) => v + 1.2 + i * .18)) },
          { name: 'Limite operacional (92%)', color: C.coral, width: 1.2, data: Array(44).fill(92) }
        ]
      });

      const ins = [
        ['!', 'A ocupação no <b>Hospital da Luz Lisboa</b> deverá ultrapassar 92% na <b>quinta e sexta-feira</b> (probabilidade 78%), impulsionada pelo aumento de casos respiratórios.', ['Ver plano de altas', 'Abrir fluxo de doentes']],
        ['€', '<b>312 episódios</b> (1,9 M€) têm risco elevado de rejeição pela seguradora. 64% por falta de autorização prévia anexada.', ['Rever episódios']],
        ['♡', '<b>4 120 doentes diabéticos</b> estão sem consulta de seguimento há mais de 6 meses. Campanha sugerida via MY LUZ.', ['Criar campanha']]
      ];
      $('#insights').innerHTML = ins.map(([ic, t, a]) => `<div class="insight"><div class="ic">${ic}</div><div><p>${t}</p><div class="act">${a.map((x, i) => `<button class="btn ${i ? '' : 'pri'}" data-a="${x}">${x}</button>`).join('')}</div></div></div>`).join('');
      $('#insights').addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.a === 'Abrir fluxo de doentes') return go('flow');
        if (b.dataset.a === 'Rever episódios') return go('revenue');
        b.classList.add('done'); b.textContent = '✓ ' + (b.dataset.a === 'Criar campanha' ? 'Campanha criada como rascunho' : 'Plano enviado à gestão de camas');
        toast(b.textContent.slice(2));
      });

      Ch.donut($('#c-mix'), {
        center: '712 M€', centerLabel: 'acumulado 2026',
        items: [{ label: 'Hospitais e clínicas', value: 598, color: C.teal }, { label: 'Cuidados continuados', value: 41, color: C.sky }, { label: 'Residências sénior', value: 19, color: C.sun }, { label: 'Parcerias público-privadas', value: 54, color: C.violet }]
      });

      const rows = UNITS.slice(0, 8).map((u) => {
        const occ = 72 + rnd() * 24, wait = 18 + rnd() * 50, nps = 60 + rnd() * 20;
        return { u, occ, wait, nps, alert: occ > 90 ? ['p-bad', 'Ocupação crítica'] : wait > 55 ? ['p-warn', 'Espera elevada'] : ['p-ok', 'Normal'] };
      });
      $('#t-units').innerHTML = `<table><thead><tr><th>Unidade</th><th>Ocupação</th><th>Espera urgência</th><th>NPS</th><th>Estado</th></tr></thead><tbody>${rows.map((r) =>
        `<tr><td><b>${r.u.replace('Hospital da Luz ', 'HL ')}</b></td><td><span class="bar-mini" style="width:${r.occ * .6}px;background:${r.occ > 90 ? C.coral : C.teal}"></span>${nf(r.occ, 1)}%</td><td>${nf(r.wait)} min</td><td>${nf(r.nps)}</td><td><span class="pill ${r.alert[0]}">${r.alert[1]}</span></td></tr>`).join('')}</tbody></table>`;
    },

    flow() {
      $('#kpis-flow').innerHTML =
        kpi('Episódios de urgência previstos (72 h)', '3 846', '▲ 11% vs. semana passada', 'down', null) +
        kpi('Pico previsto', 'Sex. 20h', '68 episódios/hora', 'neu', null) +
        kpi('Altas previstas hoje', '412', '86 antes das 12h', 'up', null) +
        kpi('Utilização do bloco', '81,2%', 'Objetivo 85%', 'down', null);
      const H = 72, labels = range(H, (i) => { const d = ['qua', 'qui', 'sex'][Math.floor(i / 24)]; return `${d} ${i % 24}h`; });
      const base = (i) => { const h = i % 24; return 14 + 30 * Math.exp(-((h - 11) ** 2) / 18) + 26 * Math.exp(-((h - 20) ** 2) / 10) + (i > 48 ? 8 : 0); };
      const fc = range(H, base), hist = range(18, (i) => base(i) + (rnd() - .5) * 8);
      Ch.line($('#c-er'), {
        labels, forecastFrom: 17, series: [
          { name: 'Real', color: C.teal, data: hist.concat(Array(H - 18).fill(null)), area: true },
          { name: 'Previsto', color: C.violet, dash: true, data: fc, lo: fc.map((v) => v * .86), hi: fc.map((v) => v * 1.14) }
        ]
      });
      $('#staff').innerHTML = [
        ['Sex. 18h-24h', 'Reforçar com <b>2 médicos</b> e <b>3 enfermeiros</b> na urgência geral', 'Espera prevista: 74 → 41 min'],
        ['Qui. 10h-14h', 'Abrir <b>sala de observação 2</b> e adiantar 18 altas de Medicina Interna', 'Ocupação: 94% → 89%'],
        ['Qua. 20h-23h', 'Ativar <b>triagem digital</b> MY LUZ para casos não urgentes', '−14% episódios presenciais']
      ].map(([w, t, k]) => `<div class="insight"><div class="ic">◷</div><div><p><b>${w}</b><br>${t}</p><p style="font-size:12px;color:var(--teal);font-weight:700;margin-top:4px">${k}</p><div class="act"><button class="btn pri">Aprovar</button><button class="btn">Ajustar</button></div></div></div>`).join('');
      $('#staff').addEventListener('click', (e) => { const b = e.target.closest('.btn.pri'); if (b) { b.classList.add('done'); b.textContent = '✓ Aprovado'; toast('Recomendação aprovada e enviada à escala'); } });

      const rowsD = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'], cols = range(24, (h) => `${h}h`);
      Ch.heat($('#c-heat'), { rows: rowsD, cols, unit: 'episódios', matrix: rowsD.map((_, d) => cols.map((_, h) => Math.round((base(h) * (d === 0 ? 1.25 : d > 4 ? .85 : 1)) + rnd() * 4))) });
      Ch.bars($('#c-or'), { unit: '%', max: 100, items: ['Ortopedia', 'Cirurgia Geral', 'Urologia', 'Oftalmologia', 'Cardiologia de intervenção', 'Ginecologia', 'Otorrino'].map((l, i) => { const v = [91, 86, 79, 94, 72, 68, 83][i]; return { label: l, value: v, target: 85, color: v >= 85 ? C.teal : C.sun }; }) });

      const names = ['Rui Fernandes', 'Catarina Lopes', 'João Pereira', 'Inês Martins', 'Tiago Sousa', 'Beatriz Gomes', 'Pedro Almeida', 'Mariana Costa'];
      const specs = ['Cardiologia', 'Dermatologia', 'Ortopedia', 'Psiquiatria', 'Gastroenterologia', 'Pediatria', 'Oftalmologia', 'Endocrinologia'];
      const why = ['2 faltas nos últimos 6 meses', 'Marcação feita há 94 dias', 'Distância > 40 km e previsão de chuva', 'Sem confirmação na app', 'Primeira consulta, sem seguro', 'Horário 8h00, historial de atrasos', 'Consulta de seguimento adiada 2×', 'Não abriu o lembrete SMS'];
      $('#t-noshow').innerHTML = `<table><thead><tr><th>Doente</th><th>Especialidade</th><th>Hora</th><th>Probabilidade de falta</th><th>Principal motivo</th><th></th></tr></thead><tbody>${names.map((n, i) => {
        const p = 82 - i * 7 - rnd() * 4;
        return `<tr><td><b>${n}</b></td><td>${specs[i]}</td><td>${['08:00', '09:30', '10:15', '11:00', '14:30', '15:00', '16:45', '17:30'][i]}</td><td><span class="bar-mini" style="width:${p}px;background:${p > 60 ? C.coral : C.sun}"></span>${nf(p)}%</td><td style="color:var(--muted)">${why[i]}</td><td><button class="btn">Enviar lembrete</button></td></tr>`;
      }).join('')}</tbody></table>`;
      $('#t-noshow').addEventListener('click', (e) => { const b = e.target.closest('.btn'); if (b) { b.classList.add('done'); b.textContent = '✓ Enviado'; toast('Lembrete enviado pela app MY LUZ'); } });
    },

    revenue() {
      $('#kpis-rev').innerHTML =
        kpi('Faturação do mês', '68,9 M€', '▲ 6,2% homólogo', 'up', range(12, (i) => 55 + i + rnd() * 4)) +
        kpi('Prazo médio de recebimento', '47 dias', '▼ 5 dias no trimestre', 'up', range(12, (i) => 56 - i * .7 + rnd() * 2), C.sky) +
        kpi('Taxa de rejeição', '3,4%', '▼ 0,9 p.p. com IA', 'up', range(12, (i) => 4.6 - i * .1 + rnd() * .3), C.violet) +
        kpi('Receita em risco (por faturar)', '1,9 M€', '312 episódios sinalizados', 'down', range(12, () => 1.5 + rnd()), C.coral);
      sparks($('#kpis-rev'));
      const m = MONTHS;
      Ch.columns($('#c-payer'), {
        labels: m, stacked: true, series: [
          { name: 'Seguradoras privadas', color: C.teal, data: m.map((_, i) => 28 + i * .5 + rnd() * 3) },
          { name: 'Subsistemas (ADSE e outros)', color: C.sky, data: m.map(() => 14 + rnd() * 2) },
          { name: 'Particulares', color: C.sun, data: m.map(() => 9 + rnd() * 2) },
          { name: 'SNS e PPP', color: C.violet, data: m.map(() => 7 + rnd()) }
        ]
      });
      Ch.bars($('#c-dso'), { unit: ' d', items: [['Seguradora A', 32], ['Seguradora B', 41], ['ADSE', 58], ['Seguradora C', 44], ['SNS', 96], ['Particulares', 6]].map(([l, v]) => ({ label: l, value: v, color: v > 60 ? C.coral : C.teal })) });
      const motives = ['Falta de autorização prévia', 'Código de ato incompatível', 'Fora da cobertura da apólice', 'Diagnóstico não justifica exame', 'Duplicação de ato'];
      $('#t-denial').innerHTML = `<table><thead><tr><th>Episódio</th><th>Entidade</th><th>Valor</th><th>Risco</th><th>Motivo provável</th><th></th></tr></thead><tbody>${range(7, (i) => {
        const r = 93 - i * 6 - rnd() * 3;
        return `<tr><td><b>25-${nf(118000 + Math.floor(rnd() * 900))}</b><br><small style="color:var(--muted)">${['Ortopedia', 'Cardiologia', 'Imagiologia', 'Cirurgia Geral', 'Gastro', 'Urologia', 'Oftalmologia'][i]}</small></td><td>${['Seguradora A', 'ADSE', 'Seguradora B', 'Seguradora A', 'Seguradora C', 'ADSE', 'Seguradora B'][i]}</td><td>${nf(800 + rnd() * 9000)} €</td><td><span class="pill ${r > 80 ? 'p-bad' : 'p-warn'}">${nf(r)}%</span></td><td>${motives[i % 5]}</td><td><button class="btn">Corrigir</button></td></tr>`;
      }).join('')}</tbody></table>`;
      $('#t-denial').addEventListener('click', (e) => { const b = e.target.closest('.btn'); if (b) { b.classList.add('done'); b.textContent = '✓ Em revisão'; toast('Episódio enviado para revisão de faturação'); } });
      Ch.bars($('#c-reasons'), { unit: '%', items: motives.map((l, i) => ({ label: l, value: [34, 22, 18, 15, 11][i], color: [C.coral, C.sun, C.violet, C.sky, C.grey][i] })) });
      $('#cleanroom').innerHTML = [
        ['Clientes em comum', '1,24 M', 'Sobreposição calculada com hashing'],
        ['Custo médio por sinistro', '−7,8%', 'Em doentes com seguimento programado'],
        ['Tempo de autorização', '4 min', 'vs. 2,3 dias por email'],
        ['Fraude potencial detetada', '0,6 M€', 'Padrões anómalos partilhados']
      ].map(([l, v, d]) => `<div class="kpi" style="padding:6px 0"><div class="lbl">${l}</div><div class="v">${v}</div><div class="d neu">${d}</div></div>`).join('');
    },

    supply() {
      $('#kpis-sup').innerHTML =
        kpi('Ruturas evitadas (30 dias)', '27', '▲ vs. 9 no mês anterior', 'up', null) +
        kpi('Stock imobilizado', '14,2 M€', '▼ 1,8 M€ no trimestre', 'up', null) +
        kpi('Validades em risco (60 dias)', '386 mil €', 'Transferências sugeridas', 'down', null) +
        kpi('Precisão da previsão', '93,1%', 'MAPE 6,9%', 'up', null);
      const items = [['Contraste iodado 350', 'HL Lisboa', 4, 96], ['Enoxaparina 40 mg', 'HL Arrábida', 6, 88], ['Stent farmacológico 3.0', 'HL Lisboa', 7, 81], ['Propofol 1%', 'HL Coimbra', 9, 72], ['Amoxicilina + ác. clavulânico IV', 'HL Aveiro', 11, 64], ['Prótese anca cimentada', 'HL Setúbal', 13, 52]];
      $('#t-stock').innerHTML = `<table><thead><tr><th>Artigo</th><th>Unidade</th><th>Dias de cobertura</th><th>Risco</th><th></th></tr></thead><tbody>${items.map(([a, u, d, r]) => `<tr><td><b>${a}</b></td><td>${u}</td><td>${d}</td><td><span class="pill ${r > 80 ? 'p-bad' : 'p-warn'}">${r}%</span></td><td><button class="btn">Encomendar</button></td></tr>`).join('')}</tbody></table>`;
      $('#t-stock').addEventListener('click', (e) => { const b = e.target.closest('.btn'); if (b) { b.classList.add('done'); b.textContent = '✓ Pedido criado'; toast('Pedido de compra criado no ERP'); } });
      const lab = days(28, -14); const stock = range(28, (i) => Math.max(0, 900 - i * 38 + (i === 20 ? 0 : 0)));
      Ch.line($('#c-stock'), {
        labels: lab, forecastFrom: 13, series: [
          { name: 'Stock projetado', color: C.teal, data: stock, area: true },
          { name: 'Consumo diário previsto ×10', color: C.violet, dash: true, data: range(28, (i) => 320 + 60 * Math.sin(i / 2) + rnd() * 30) },
          { name: 'Stock de segurança', color: C.coral, width: 1.2, data: Array(28).fill(250) }
        ]
      });
      Ch.columns($('#c-exp'), { labels: ['Lisboa', 'Torres', 'Arrábida', 'Coimbra', 'Aveiro', 'Setúbal', 'Oeiras', 'Guimarães', 'Funchal'], series: [{ name: 'Valor em risco (mil €)', color: C.sun, data: [92, 41, 68, 37, 29, 44, 18, 31, 26] }, { name: 'Recuperável por transferência', color: C.teal, data: [70, 30, 51, 22, 20, 33, 12, 19, 14] }] });
    },

    patient() {
      [['Risco de descompensação', .64, C.coral], ['Probabilidade de falta', .18, C.ok], ['Risco de abandono', .31, C.sun]].forEach(([l, v, c]) => {
        const d = document.createElement('div'); $('#pt-gauges').appendChild(d); Ch.gauge(d, v, c, l);
      });
      $('#nba').innerHTML = [
        ['1', 'Marcar consulta de <b>Endocrinologia</b>. Seguimento em atraso há 4 meses.', 'Marcar via MY LUZ'],
        ['2', 'Agendar <b>rastreio de retinopatia</b>. Elegível e coberto pelo seguro.', 'Propor data'],
        ['3', 'Reativar plano de <b>Nutrição</b>. A HbA1c subiu após a interrupção.', 'Enviar convite']
      ].map(([n, t, a]) => `<div class="insight"><div class="ic">${n}</div><div><p>${t}</p><div class="act"><button class="btn pri">${a}</button></div></div></div>`).join('');
      $('#nba').addEventListener('click', (e) => { const b = e.target.closest('.btn'); if (b) { b.classList.add('done'); b.textContent = '✓ Notificação enviada'; toast('Notificação enviada para a app MY LUZ'); } });
      $('#timeline').innerHTML = [
        ['03/11/2026', 'Análises clínicas · HL Lisboa', 'HbA1c 7,9% · Creatinina normal'],
        ['22/09/2026', 'Videoconsulta · Medicina Geral', 'Ajuste de terapêutica anti-hipertensora'],
        ['14/07/2026', 'Check-up LUZ ON PRIME', 'Avaliador de Saúde preenchido na app'],
        ['08/04/2026', 'Consulta · Endocrinologia', 'Última consulta da especialidade'],
        ['17/01/2026', 'Urgência · HL Torres de Lisboa', 'Hipoglicemia ligeira, alta no próprio dia'],
        ['02/10/2025', 'Consulta · Nutrição', 'Plano alimentar suspenso pela doente']
      ].map(([d, t, s]) => `<div class="tl-i"><b>${t}</b><small>${d} · ${s}</small></div>`).join('');
      const lab = ['nov 24', 'fev 25', 'mai 25', 'ago 25', 'nov 25', 'fev 26', 'mai 26', 'ago 26', 'nov 26'];
      Ch.line($('#c-hba1c'), { id: 'h', labels: lab, unit: '%', min: 6, max: 8.5, height: 150, series: [{ name: 'HbA1c', color: C.coral, data: [7.4, 7.2, 7.0, 6.9, 7.1, 7.3, 7.5, 7.7, 7.9] }, { name: 'Objetivo 7%', color: C.grey, width: 1, data: Array(9).fill(7) }] });
      Ch.line($('#c-bp'), { id: 'b', labels: lab, min: 60, max: 160, height: 150, series: [{ name: 'Sistólica', color: C.teal, data: [148, 142, 138, 135, 132, 134, 130, 131, 129] }, { name: 'Diastólica', color: C.sky, data: [92, 90, 86, 84, 82, 84, 80, 81, 80] }] });
    },

    senior() {
      $('#kpis-sen').innerHTML =
        kpi('Residentes e utentes', '1 284', 'Residências e cuidados continuados', 'neu', null) +
        kpi('Quedas com lesão (mês)', '9', '▼ 22% desde alertas IA', 'up', null) +
        kpi('Readmissões a 30 dias', '6,1%', '▼ 1,7 p.p. homólogo', 'up', null) +
        kpi('Ocupação média', '94,6%', 'Lista de espera: 212', 'neu', null);
      const names = ['Maria do Céu Antunes', 'António Rodrigues', 'Fernanda Vieira', 'Manuel Carvalho', 'Graça Teixeira', 'José Henriques'];
      const factors = ['Nova benzodiazepina + 2 levantes noturnos', 'Queda há 12 dias, marcha instável', 'Hipotensão ortostática registada', 'Sono fragmentado (sensor), ITU recente', 'Diurético reforçado, visão reduzida', 'Mobilidade em declínio na escala de Tinetti'];
      $('#t-falls').innerHTML = `<table><thead><tr><th>Residente</th><th>Unidade</th><th>Risco</th><th>Fatores principais</th><th></th></tr></thead><tbody>${names.map((n, i) => {
        const r = 88 - i * 9;
        return `<tr><td><b>${n}</b><br><small style="color:var(--muted)">${82 + (i * 3) % 11} anos</small></td><td>${i % 2 ? 'Residência Lisboa' : 'Hospital do Mar'}</td><td><span class="pill ${r > 70 ? 'p-bad' : 'p-warn'}">${r}%</span></td><td style="color:var(--muted)">${factors[i]}</td><td><button class="btn">Criar plano</button></td></tr>`;
      }).join('')}</tbody></table>`;
      $('#t-falls').addEventListener('click', (e) => { const b = e.target.closest('.btn'); if (b) { b.classList.add('done'); b.textContent = '✓ Plano criado'; toast('Plano preventivo atribuído à equipa de enfermagem'); } });
      Ch.bars($('#c-shap'), { items: [['Quedas anteriores', .31], ['Psicofármacos', .24], ['Levantes noturnos', .17], ['Escala de Tinetti', .13], ['Idade', .08], ['Infeção recente', .07]].map(([l, v]) => ({ label: l, value: v, color: C.violet })) });
      Ch.line($('#c-senocc'), { labels: range(12, (i) => `S${i + 46 > 52 ? i - 6 : i + 46}`), unit: '%', min: 80, max: 100, series: [{ name: 'Residências sénior', color: C.sun, data: range(12, (i) => 95 + Math.sin(i / 2) * 1.5) }, { name: 'Cuidados continuados', color: C.teal, data: range(12, (i) => 91 + i * .5 + rnd()) }] });
    },

    assistant() {
      Object.keys(QA).forEach((q) => $('#sugs').insertAdjacentHTML('beforeend', `<button class="sug">${q}</button>`));
      $('#sugs').addEventListener('click', (e) => { const b = e.target.closest('.sug'); if (b) ask(b.textContent); });
      $('#composer').addEventListener('submit', (e) => { e.preventDefault(); const v = $('#ask').value.trim(); if (v) { $('#ask').value = ''; ask(v); } });
      addMsg('a', `Olá, Dra. Marta. Sou a <b>Luz IA</b>. Respondo com base nos dados do grupo, sempre dentro das suas permissões de acesso. Em que posso ajudar?`);
    },

    notes() {
      $('#note').innerHTML = NOTE;
      $('#ex').innerHTML = EXTRACT.map(([k, v]) => `<div class="f"><small>${k}</small><div>${v}</div></div>`).join('');
      $('#sql').textContent = '-- clique em "Extrair com Cortex AI"';
      $('#extract').addEventListener('click', runExtract);
      Ch.columns($('#c-coding'), { labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], series: [{ name: 'Sugestões aceites', color: C.teal, data: [1840, 2010, 2230, 2390] }, { name: 'Corrigidas pelo codificador', color: C.sun, data: [310, 270, 240, 205] }] });
      Ch.donut($('#c-sent'), { center: '+0,42', centerLabel: 'sentimento médio', items: [{ label: 'Positivo', value: 68, color: C.ok }, { label: 'Neutro', value: 19, color: C.grey }, { label: 'Negativo', value: 13, color: C.coral }] });
      Ch.bars($('#c-themes'), { unit: '%', items: [['Tempo de espera', 38], ['Estacionamento', 17], ['Faturação pouco clara', 15], ['Marcações por telefone', 14], ['Comunicação clínica', 9], ['Alimentação', 7]].map(([l, v]) => ({ label: l, value: v, color: C.coral })) });
    },

    models() {
      $('#model-list').innerHTML = MODELS.map((m, i) => `<div class="card model ${i ? '' : 'sel'}" data-i="${i}" tabindex="0" role="button"><div class="row"><span class="pill ${m.status[0]}">${m.status[1]}</span><span class="sp" style="font-size:11px;color:var(--muted)">${m.algo}</span></div><h3 style="margin-top:10px">${m.name}</h3><p class="sub" style="margin:4px 0 8px">${m.use}</p><div class="metric"><span>${m.metricName}</span><b>${m.metric}</b></div><div class="metric"><span>Previsões/dia</span><b>${m.vol}</b></div></div>`).join('');
      const pick = (i) => {
        document.querySelectorAll('.model').forEach((c) => c.classList.toggle('sel', +c.dataset.i === i));
        const m = MODELS[i];
        $('#md-name').textContent = m.name; $('#md-desc').textContent = m.desc;
        $('#md-metrics').innerHTML = m.details.map(([k, v]) => `<div class="metric"><span>${k}</span><b>${v}</b></div>`).join('');
        Ch.bars($('#md-feat'), { items: m.feat.map(([l, v]) => ({ label: l, value: v, color: C.violet })) });
        Ch.line($('#md-perf'), { id: 'p' + i, labels: range(12, (k) => `S${k + 35}`), min: m.perf[0] - .08, max: Math.min(1, m.perf[0] + .06), height: 180, series: [{ name: m.metricName, color: C.teal, data: range(12, (k) => +(m.perf[0] + Math.sin(k) * .01 - (k > 9 ? m.perf[1] : 0)).toFixed(3)) }, { name: 'Limiar de alerta', color: C.coral, width: 1, data: Array(12).fill(m.perf[0] - .04) }] });
        $('#md-lineage').innerHTML = `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;font-size:12.5px">${m.lineage.map((s, k) => `${k ? '<span style="color:var(--sky);font-size:20px">›</span>' : ''}<span class="pill ${['p-teal', 'p-teal', 'p-ml', 'p-ai', 'p-ok'][Math.min(k, 4)]}" style="padding:8px 12px;font-size:12px">${s}</span>`).join('')}</div>`;
      };
      $('#model-list').addEventListener('click', (e) => { const c = e.target.closest('.model'); if (c) pick(+c.dataset.i); });
      $('#model-list').addEventListener('keydown', (e) => { const c = e.target.closest('.model'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(+c.dataset.i); } });
      pick(0);
    }
  };

  // ---------- models ----------
  const MODELS = [
    { name: 'Afluência à urgência', use: 'Episódios por hora, a 72 h', algo: 'Snowflake Forecast', status: ['p-ok', 'Em produção'], metricName: 'Precisão (1 − MAPE)', metric: '91,8%', vol: '2 160', perf: [.918, 0],
      desc: 'Prevê episódios de urgência por hora e unidade, para planear escalas e abrir áreas de observação.', details: [['Treino', 'Semanal · domingo 02:00'], ['Histórico', '5 anos · 9,2 M episódios'], ['Variáveis externas', 'IPMA, feriados, gripe (DGS)'], ['Decisão servida', 'Escalas de urgência'], ['Controlo humano', 'Aprovação do chefe de equipa']],
      feat: [['Hora do dia', .29], ['Dia da semana', .21], ['Incidência gripal', .16], ['Temperatura', .12], ['Feriado/véspera', .11], ['Eventos locais', .06]], lineage: ['Processo clínico · episódios', 'Dados meteorológicos', 'Feature Store', 'Modelo de previsão', 'Escalas aprovadas'] },
    { name: 'Faltas a consultas', use: 'Probabilidade de no-show', algo: 'XGBoost · Snowpark ML', status: ['p-ok', 'Em produção'], metricName: 'AUC', metric: '0,87', vol: '31 400', perf: [.87, 0],
      desc: 'Identifica consultas com maior risco de falta para lembretes direcionados e overbooking controlado.', details: [['Treino', 'Diário · 03:00'], ['Histórico', '3 anos · 21 M marcações'], ['Ação automática', 'Lembrete MY LUZ / SMS'], ['Impacto medido', '−1,4 p.p. na taxa de faltas'], ['Controlo humano', 'Overbooking requer validação']],
      feat: [['Faltas anteriores', .33], ['Antecedência da marcação', .19], ['Distância ao hospital', .14], ['Confirmação na app', .13], ['Hora da consulta', .11], ['Tipo de financiador', .1]], lineage: ['Agenda de marcações', 'Eventos app MY LUZ', 'Feature Store', 'Modelo no-show', 'Lembretes enviados'] },
    { name: 'Risco de rejeição', use: 'Glosa antes do envio', algo: 'LightGBM · Snowpark ML', status: ['p-ok', 'Em produção'], metricName: 'AUC', metric: '0,91', vol: '18 900', perf: [.91, 0],
      desc: 'Antecipa episódios que a entidade financiadora irá rejeitar e indica o motivo provável.', details: [['Treino', 'Semanal'], ['Histórico', '4 anos · 14 M faturas'], ['Receita recuperada', '4,2 M€/ano (estimativa)'], ['Decisão servida', 'Revisão pré-faturação'], ['Controlo humano', 'Correção por faturação']],
      feat: [['Autorização prévia', .36], ['Combinação ato/diagnóstico', .22], ['Entidade e plano', .17], ['Médico requisitante', .1], ['Valor do episódio', .09], ['Urgência vs. programado', .06]], lineage: ['Faturação e convenções', 'Respostas das seguradoras', 'Cortex AI · classificação', 'Modelo de glosa', 'Fila de revisão'] },
    { name: 'Readmissão a 30 dias', use: 'Risco após alta', algo: 'Regressão logística', status: ['p-warn', 'Drift detetado'], metricName: 'AUC', metric: '0,79', vol: '1 250', perf: [.81, .035],
      desc: 'Classifica doentes com alta pelo risco de readmissão. Drift detetado após mudança de protocolo em Cardiologia; retreino agendado.', details: [['Treino', 'Mensal'], ['Último retreino', 'há 41 dias'], ['Drift (PSI)', '0,23 · acima do limiar'], ['Decisão servida', 'Chamada de follow-up'], ['Controlo humano', 'Validação clínica obrigatória']],
      feat: [['N.º internamentos 12 m', .27], ['Índice de Charlson', .23], ['Demora média', .15], ['Polimedicação', .14], ['Idade', .11], ['Apoio social', .1]], lineage: ['Processo clínico', 'Notas de alta · Cortex AI', 'Feature Store', 'Modelo de readmissão', 'Equipa de follow-up'] },
    { name: 'Duração cirúrgica', use: 'Minutos por cirurgia', algo: 'Random Forest', status: ['p-ok', 'Em produção'], metricName: 'Erro médio', metric: '11 min', vol: '640', perf: [.88, 0],
      desc: 'Estima a duração de cada cirurgia para construir planos operatórios mais realistas.', details: [['Treino', 'Semanal'], ['Histórico', '420 mil cirurgias'], ['Impacto', '+9% utilização de salas'], ['Decisão servida', 'Plano operatório'], ['Controlo humano', 'Validação do cirurgião']],
      feat: [['Procedimento', .41], ['Cirurgião', .2], ['ASA', .13], ['IMC', .1], ['Hora de início', .09], ['Anestesia', .07]], lineage: ['Registo de bloco', 'Processo clínico', 'Feature Store', 'Modelo de duração', 'Plano operatório'] },
    { name: 'Risco de queda', use: 'Residentes, a 7 dias', algo: 'Gradient Boosting', status: ['p-ok', 'Em produção'], metricName: 'AUC', metric: '0,84', vol: '1 284', perf: [.84, 0],
      desc: 'Identifica residentes e utentes com risco aumentado de queda para planos preventivos.', details: [['Treino', 'Quinzenal'], ['Dados de sensores', 'Sim · quartos equipados'], ['Impacto', '−22% quedas com lesão'], ['Decisão servida', 'Plano preventivo'], ['Controlo humano', 'Enfermeiro responsável']],
      feat: [['Quedas anteriores', .31], ['Psicofármacos', .24], ['Levantes noturnos', .17], ['Tinetti', .13], ['Idade', .08], ['Infeção recente', .07]], lineage: ['Registos de enfermagem', 'Sensores IoT', 'Feature Store', 'Modelo de queda', 'Planos preventivos'] },
    { name: 'Procura de medicamentos', use: 'Consumo a 14 dias', algo: 'Snowflake Forecast', status: ['p-ok', 'Em produção'], metricName: 'Precisão', metric: '93,1%', vol: '48 000', perf: [.931, 0],
      desc: 'Prevê consumo por artigo e unidade para evitar ruturas e reduzir stock imobilizado.', details: [['Treino', 'Diário'], ['Artigos', '12 400'], ['Ruturas evitadas', '27 nos últimos 30 dias'], ['Decisão servida', 'Encomendas no ERP'], ['Controlo humano', 'Aprovação de compras']],
      feat: [['Histórico de consumo', .38], ['Plano operatório', .22], ['Sazonalidade', .17], ['Ocupação prevista', .13], ['Prazo do fornecedor', .1]], lineage: ['ERP · stocks e compras', 'Plano operatório', 'Feature Store', 'Previsão de procura', 'Pedidos de compra'] },
    { name: 'Próxima melhor ação', use: 'Recomendação por doente', algo: 'Cortex AI + regras clínicas', status: ['p-ml', 'Piloto'], metricName: 'Aceitação', metric: '34%', vol: '22 000', perf: [.34, 0],
      desc: 'Combina guidelines clínicas, histórico e preferências para sugerir o próximo passo de cuidados na app MY LUZ.', details: [['Fase', 'Piloto · 3 unidades'], ['Conversão em marcação', '12%'], ['Canais', 'App MY LUZ, email'], ['Decisão servida', 'Campanhas de seguimento'], ['Controlo humano', 'Revisão clínica das regras']],
      feat: [['Seguimento em atraso', .34], ['Rastreios elegíveis', .25], ['Cobertura do seguro', .16], ['Engagement na app', .15], ['Preferência de canal', .1]], lineage: ['Doente 360°', 'Guidelines clínicas · Cortex Search', 'Cortex AI', 'Recomendação', 'Notificação MY LUZ'] }
  ];

  // ---------- assistant ----------
  const QA = {
    'Qual a ocupação prevista para sexta-feira no HL Lisboa?': {
      text: 'Para <b>sexta-feira, 13 de novembro</b>, a ocupação prevista no Hospital da Luz Lisboa é de <b>93,1%</b> (intervalo 90,4%-95,6%), acima do limite operacional de 92%. Os principais fatores são o aumento de casos respiratórios (+18% na semana) e 41 cirurgias programadas com internamento.<br><br><b>Sugestão:</b> antecipar 22 altas previstas de Medicina Interna para quinta-feira e transferir 6 doentes elegíveis para o Hospital do Mar.',
      chart: { labels: ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'], data: [86.2, 87.9, 88.4, 91.2, 93.1, 90.3, 87.5] },
      sql: "SELECT data, ocupacao_prevista, limite_inferior, limite_superior\nFROM LUZ_ANALYTICS.FORECAST.OCUPACAO_INTERNAMENTO\nWHERE unidade = 'HL Lisboa'\n  AND data BETWEEN '2026-11-09' AND '2026-11-15'\nORDER BY data;", src: 'Semantic view: Ocupação e camas · Modelo: Forecast de ocupação v12'
    },
    'Porque subiu a demora média em Ortopedia este mês?': {
      text: 'A demora média em Ortopedia passou de <b>3,4 para 4,1 dias</b> (+21%). A análise identifica três causas:<br>1. <b>Mais doentes com mais de 80 anos</b> em fraturas do colo do fémur (+34%), com demora média de 7,2 dias.<br>2. <b>Atraso nas altas sociais</b>: 19 doentes aguardaram vaga em cuidados continuados, em média 2,6 dias.<br>3. <b>Fisioterapia ao fim de semana</b> com menos 40% de sessões, o que adia a alta de próteses.<br><br>Os outros fatores explicam menos de 10% da variação.',
      chart: { labels: ['jun', 'jul', 'ago', 'set', 'out', 'nov'], data: [3.3, 3.5, 3.4, 3.4, 3.6, 4.1] },
      sql: "SELECT mes, AVG(demora_dias) AS demora_media,\n       COUNT_IF(idade >= 80) / COUNT(*) AS pct_80_mais\nFROM LUZ_ANALYTICS.CLINICO.EPISODIOS_INTERNAMENTO\nWHERE especialidade = 'Ortopedia'\nGROUP BY mes ORDER BY mes;", src: 'Semantic view: Internamentos · Análise de contribuição (Top Insights)'
    },
    'Quanto faturámos à Seguradora A no último trimestre e qual o risco de rejeição?': {
      text: 'No 3.º trimestre de 2026 faturaram-se <b>58,3 M€</b> à Seguradora A (+7,4% homólogo), em 212 480 atos. A taxa de rejeição foi de <b>2,9%</b> (1,69 M€).<br><br>Neste momento há <b>148 episódios por faturar com risco elevado</b> (0,84 M€). O motivo mais comum é a <b>falta de autorização prévia</b> em exames de imagiologia (61%).',
      chart: { labels: ['jul', 'ago', 'set'], data: [19.1, 18.6, 20.6] },
      sql: "SELECT DATE_TRUNC('month', data_fatura) AS mes,\n       SUM(valor) / 1e6 AS faturado_meur,\n       SUM(IFF(rejeitado, valor, 0)) / SUM(valor) AS taxa_rejeicao\nFROM LUZ_ANALYTICS.RECEITA.FATURAS\nWHERE entidade = 'Seguradora A' AND trimestre = '2026-Q3'\nGROUP BY 1 ORDER BY 1;", src: 'Semantic view: Receita e faturação · Modelo: Risco de glosa v7'
    },
    'Que doentes diabéticos estão sem seguimento há mais de 6 meses?': {
      text: 'Há <b>4 120 doentes</b> com diabetes tipo 2 sem consulta de Endocrinologia ou Medicina Geral há mais de 6 meses. Destes, <b>1 380 têm HbA1c acima de 8%</b> na última análise e 2 960 são utilizadores ativos da app MY LUZ.<br><br>Posso preparar uma <b>campanha de seguimento</b> na app, priorizada por risco clínico. Os dados identificativos só são visíveis a quem tem perfil clínico.',
      chart: { labels: ['6-9 m', '9-12 m', '12-18 m', '> 18 m'], data: [1840, 1120, 760, 400] },
      sql: "SELECT faixa_sem_seguimento, COUNT(*) AS doentes\nFROM LUZ_ANALYTICS.DOENTE.DOENTE_360\nWHERE ARRAY_CONTAINS('E11'::VARIANT, diagnosticos_cid10)\n  AND meses_desde_ultima_consulta > 6\nGROUP BY 1;", src: 'Semantic view: Doente 360° · Política de mascaramento: PII_CLINICO'
    },
    'Resume as reclamações da última semana no HL Arrábida': {
      text: 'Na última semana houve <b>63 reclamações e comentários negativos</b> no Hospital da Luz Arrábida (−12% vs. semana anterior). Resumo gerado com Cortex AI:<br>• <b>Tempo de espera na urgência</b> ao fim da tarde (24 menções), sobretudo na quinta-feira.<br>• <b>Estacionamento</b> esgotado de manhã (11 menções).<br>• <b>Faturação</b>: dúvidas sobre o copagamento em exames (9 menções).<br>• Elogios recorrentes à equipa de Pediatria e à rapidez do check-in na app.',
      chart: { labels: ['Espera', 'Estacionamento', 'Faturação', 'Marcações', 'Outros'], data: [24, 11, 9, 8, 11] },
      sql: "SELECT AI_CLASSIFY(texto, ['Espera','Estacionamento','Faturação','Marcações','Outros']):labels[0] AS tema,\n       COUNT(*) AS n\nFROM LUZ_ANALYTICS.EXPERIENCIA.COMENTARIOS\nWHERE unidade = 'HL Arrábida' AND data >= DATEADD(day, -7, CURRENT_DATE())\n  AND AI_SENTIMENT(texto):categories[0]:sentiment = 'negative'\nGROUP BY 1 ORDER BY n DESC;", src: 'Cortex AI SQL: AI_CLASSIFY, AI_SENTIMENT, AI_AGG'
    },
    'Qual o protocolo interno para sépsis na urgência?': {
      text: 'Segundo o <b>Protocolo Clínico PC-URG-014 (rev. 2025)</b>, perante suspeita de sépsis:<br>1. Triagem prioritária (laranja ou superior) e avaliação médica em ≤ 10 min.<br>2. Lactato, hemoculturas (2 pares) antes do antibiótico.<br>3. <b>Antibioterapia empírica na 1.ª hora</b>.<br>4. Fluidoterapia 30 ml/kg se hipotensão ou lactato ≥ 4 mmol/L.<br>5. Reavaliação às 3 h e contacto com a UCI se não houver resposta.<br><br>Cumprimento da "1.ª hora" no último mês: <b>84%</b> (objetivo 90%).',
      sql: "SELECT * FROM TABLE(\n  CORTEX_SEARCH('LUZ_DOCS.PROTOCOLOS.PESQUISA',\n                'protocolo sépsis urgência antibioterapia'));", src: 'Cortex Search: 2 340 protocolos clínicos · Documento PC-URG-014, pág. 3-5'
    }
  };
  function addMsg(who, html) { const d = document.createElement('div'); d.className = 'm ' + who; d.innerHTML = html; $('#msgs').appendChild(d); $('#msgs').scrollTop = 1e6; return d; }
  function match(q) {
    const n = q.toLowerCase();
    const keys = Object.keys(QA);
    const words = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\W+/).filter((w) => w.length > 3);
    const qw = new Set(words(n));
    let best = null, score = 0;
    keys.forEach((k) => { const s = words(k).filter((w) => qw.has(w)).length; if (s > score) { score = s; best = k; } });
    return score >= 2 ? best : null;
  }
  function ask(q) {
    if (!rendered.assistant) { RENDER.assistant(); rendered.assistant = true; }
    addMsg('u', q.replace(/</g, '&lt;'));
    const t = addMsg('a', '<div class="who">✦ Luz IA</div><span class="typing"><span></span><span></span><span></span></span> <small style="color:var(--muted)">A consultar semantic views e documentos…</small>');
    setTimeout(() => {
      const k = QA[q] ? q : match(q);
      if (!k) {
        t.innerHTML = '<div class="who">✦ Luz IA</div>Não encontrei dados suficientes para responder com confiança a essa pergunta nas fontes a que tem acesso. Experimente reformular com uma unidade, período ou indicador, por exemplo: "ocupação prevista para sexta-feira no HL Lisboa".';
        return;
      }
      const a = QA[k], id = 'qa' + Math.floor(Math.random() * 1e6);
      t.innerHTML = `<div class="who">✦ Luz IA <span class="pill p-ai">Snowflake Intelligence</span></div>${a.text}${a.chart ? `<div id="${id}" style="margin-top:12px;background:#fff;border-radius:10px;padding:10px"></div>` : ''}<details><summary>Ver SQL gerado</summary><pre>${a.sql.replace(/</g, '&lt;')}</pre></details><div class="src">Fonte: ${a.src}</div>`;
      if (a.chart) Ch.columns(document.getElementById(id), { labels: a.chart.labels, height: 170, series: [{ name: '', color: C.teal, data: a.chart.data }] });
      $('#msgs').scrollTop = 1e6;
    }, 1300);
  }

  // ---------- clinical notes ----------
  const NOTE = `NOTA DE ALTA

Doente do sexo masculino, 71 anos, internado de 02/11 a 07/11/2026 por <mark class="dx">pneumonia adquirida na comunidade</mark> do lobo inferior direito, com <mark class="dx">insuficiência respiratória parcial</mark>. Antecedentes de <mark class="dx">DPOC GOLD 2</mark>, <mark class="dx">fibrilhação auricular</mark> hipocoagulado e diabetes tipo 2 não insulinotratada.

Iniciou <mark class="rx">amoxicilina/ácido clavulânico 1,2 g EV 8/8h</mark> e <mark class="rx">azitromicina 500 mg/dia</mark>, com boa evolução clínica e analítica (PCR 18,4 → 2,1 mg/dL). Oxigenoterapia suspensa ao 4.º dia.

Medicação à data de alta: <mark class="rx">amoxicilina/ác. clavulânico 875/125 mg oral 12/12h durante 3 dias</mark>, apixabano 5 mg 12/12h, metformina 1000 mg 12/12h, tiotrópio inalado.

Doente e família satisfeitos com os cuidados, embora refiram demora na transferência da urgência para o internamento.

<mark class="fu">Reavaliação em consulta de Pneumologia dentro de 4 semanas</mark>, com radiografia de tórax de controlo. Recomendada vacinação antipneumocócica.`;
  const EXTRACT = [
    ['Diagnóstico principal · CID-10', 'J18.1 · Pneumonia lobar, não especificada'],
    ['Diagnósticos secundários', 'J96.0 Insuf. respiratória aguda · J44.9 DPOC · I48.91 Fibrilhação auricular · E11.9 Diabetes tipo 2'],
    ['Medicação de alta', '4 fármacos · 1 antibiótico com fim previsto a 10/11'],
    ['Seguimento', 'Pneumologia em 4 semanas + RX tórax · Vacina antipneumocócica'],
    ['GDH sugerido', '139 · Outras pneumonias, nível de severidade 3'],
    ['Sentimento do doente', 'Positivo, com uma reclamação: tempo de transferência da urgência']
  ];
  function runExtract() {
    const b = $('#extract'); b.disabled = true; b.textContent = 'A processar…';
    $('#sql').textContent = `SELECT
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
    const fs = document.querySelectorAll('#ex .f');
    fs.forEach((f, i) => setTimeout(() => f.classList.add('on'), 350 + i * 320));
    setTimeout(() => { b.textContent = '✓ Extraído em 1,8 s'; toast('Codificação sugerida enviada para validação'); }, 350 + fs.length * 320);
  }

  const start = (location.hash || '').slice(1);
  go(TITLES[start] ? start : 'overview');
})();
