// Operating theatre data for HL Lisboa. Fictitious, but aligned with the rest of the portal:
// utilisation 78,2%, same-day cancellations 3,6%, room 4 turnover 34 min (Dr. Ricardo Alves),
// cancellation reasons from Operações, surgical models from Modelos preditivos.

export const NOW = 280; // minutes after 08:00 → 12:40
export const DAY = 720; // 08:00 → 20:00
export const hhmm = (m) => { const t = 480 + Math.round(m); return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; };

// Each room is planned back-to-back from 08:00 with a 20-min planned turnover; actual times then
// cascade with real turnover, first-case delay and duration overruns.
// room: [name, specialty, real turnover min, first-case delay min, cases]
// case: [planned min, actual/planned factor, procedure, surgeon, ASA, cancelled reason?]
const PLANNED_TURNOVER = 20;
const ROOMS_RAW = [
  ['Sala 1', 'Cirurgia Geral', 22, 0, [[95, 1.07, 'Colecistectomia laparoscópica', 'Dr. Henrique Sá', 2], [150, 1.28, 'Hemicolectomia direita laparoscópica', 'Dr. Henrique Sá', 3], [70, 1, 'Hernioplastia inguinal', 'Dra. Inês Cardoso', 1], [80, 1, 'Tiroidectomia total', 'Dra. Inês Cardoso', 2], [95, 1, 'Colecistectomia laparoscópica', 'Dra. Inês Cardoso', 2], [70, 1, 'Hernioplastia umbilical', 'Dra. Inês Cardoso', 1]]],
  ['Sala 2', 'Ortopedia', 22, 12, [[60, 1.1, 'Artroscopia do ombro', 'Dr. Rui Pinto', 1], [75, 1, 'Osteossíntese do punho', 'Dr. Rui Pinto', 2], [180, 1.05, 'Artrodese lombar', 'Dr. Tomás Vieira', 3], [90, 1, 'Reparação da coifa dos rotadores', 'Dr. Rui Pinto', 2], [75, 1, 'Ligamentoplastia do LCA', 'Dr. Rui Pinto', 1], [60, 1, 'Artroscopia do joelho', 'Dr. Rui Pinto', 1]]],
  ['Sala 3', 'Urologia', 22, 0, [[60, 1, 'Resseção transuretral da bexiga', 'Dr. Miguel Antunes', 2], [60, 1.15, 'Ureteroscopia com laser', 'Dr. Miguel Antunes', 2], [45, 1, 'Circuncisão', 'Dr. Miguel Antunes', 1], [180, 1, 'Prostatectomia radical laparoscópica', 'Dr. Miguel Antunes', 2], [90, 1, 'Nefrectomia parcial laparoscópica', 'Dr. Miguel Antunes', 3], [60, 1, 'Resseção transuretral da próstata', 'Dr. Miguel Antunes', 2]]],
  ['Sala 4', 'Ortopedia · robô', 34, 22, [[110, 0.95, 'Artroplastia total do joelho (robótica)', 'Dr. Ricardo Alves', 2], [110, 1.04, 'Artroplastia total do joelho (robótica)', 'Dr. Ricardo Alves', 3], [105, 1, 'Artroplastia total da anca', 'Dr. Ricardo Alves', 2], [110, 1, 'Artroplastia total do joelho (robótica)', 'Dr. Ricardo Alves', 2], [60, 1, 'Artroscopia do joelho', 'Dr. Ricardo Alves', 1], [60, 1, 'Artroscopia do joelho', 'Dr. Ricardo Alves', 1]]],
  ['Sala 5', 'Oftalmologia', 10, 0, [[25, 1, 'Facoemulsificação', 'Dra. Clara Neves', 1], [25, 0.9, 'Facoemulsificação', 'Dra. Clara Neves', 1], [25, 1.1, 'Facoemulsificação', 'Dra. Clara Neves', 2], [25, 1, 'Facoemulsificação', 'Dra. Clara Neves', 1], [40, 1, 'Vitrectomia', 'Dra. Clara Neves', 2], [25, 1, 'Facoemulsificação', 'Dra. Clara Neves', 1], [25, 1, 'Facoemulsificação', 'Dra. Clara Neves', 1], [40, 1, 'Trabeculectomia', 'Dra. Clara Neves', 2], [25, 1, 'Facoemulsificação', 'Dra. Clara Neves', 1], [25, 1, 'Facoemulsificação', 'Dra. Clara Neves', 1], [40, 1, 'Vitrectomia', 'Dra. Clara Neves', 2], [25, 1, 'Facoemulsificação', 'Dra. Clara Neves', 1], [25, 1, 'Facoemulsificação', 'Dra. Clara Neves', 1], [25, 1, 'Facoemulsificação', 'Dra. Clara Neves', 1]]],
  ['Sala 6', 'Cirurgia Cardiotorácica', 30, 5, [[240, 1.06, 'Bypass coronário triplo', 'Dra. Sofia Brandão', 3], [220, 1, 'Substituição valvular aórtica', 'Dra. Sofia Brandão', 3], [160, 1, 'Reparação da válvula mitral', 'Dra. Sofia Brandão', 3]]],
  ['Sala 7', 'Ginecologia', 22, 0, [[90, 1, 'Histerectomia laparoscópica', 'Dra. Paula Reis', 2], [45, 1, 'Histeroscopia cirúrgica', 'Dra. Paula Reis', 1], [90, 1, 'Miomectomia laparoscópica', 'Dra. Paula Reis', 2, 'Doente não apto: análises pré-operatórias em falta'], [60, 1, 'Laqueação tubária', 'Dra. Paula Reis', 1], [90, 1, 'Quistectomia do ovário', 'Dra. Paula Reis', 2], [45, 1, 'Histeroscopia cirúrgica', 'Dra. Paula Reis', 1]]],
  ['Sala 8', 'Otorrinolaringologia', 22, 0, [[60, 1, 'Amigdalectomia', 'Dr. Luís Faria', 1], [90, 1.22, 'Septoplastia e turbinoplastia', 'Dr. Luís Faria', 1], [120, 1, 'Cirurgia endoscópica dos seios perinasais', 'Dr. Luís Faria', 2], [60, 1, 'Timpanoplastia', 'Dr. Luís Faria', 1], [90, 1, 'Septoplastia', 'Dr. Luís Faria', 1], [60, 1, 'Amigdalectomia', 'Dr. Luís Faria', 1]]],
  ['Sala 9', 'Cirurgia Plástica', 22, 18, [[150, 1, 'Reconstrução mamária com retalho', 'Dra. Ana Lemos', 2], [90, 1, 'Abdominoplastia', 'Dra. Ana Lemos', 2], [90, 1, 'Mamoplastia de redução', 'Dra. Ana Lemos', 2], [120, 1, 'Reconstrução de cicatriz extensa', 'Dra. Ana Lemos', 2], [60, 1, 'Excisão de lesão cutânea com retalho', 'Dra. Ana Lemos', 1]]],
  ['Sala 10', 'Urgência (reservada)', 22, 70, [[75, 1, 'Apendicectomia laparoscópica', 'Equipa de urgência', 2], [95, 1, 'Laparotomia exploradora', 'Equipa de urgência', 3], [60, 1, 'Drenagem de abcesso', 'Equipa de urgência', 2]]],
];

// Cascade actual times: a case starts at its planned time, or when the previous case and cleaning finish.
export const ROOMS = ROOMS_RAW.map(([name, spec, turnover, firstDelay, raw]) => {
  let free = firstDelay, plan = 0;
  const cases = raw.map(([pd, f, proc, surgeon, asa, cancelled], i) => {
    const ps = plan; plan += pd + PLANNED_TURNOVER;
    if (cancelled) return { ps, pd, proc, surgeon, asa, cancelled, status: 'cancelled' };
    const as = Math.max(ps + (i === 0 ? firstDelay : 0), free);
    const ad = Math.round(pd * f), ae = as + ad;
    free = ae + turnover;
    const status = ae <= NOW ? 'done' : as <= NOW ? 'running' : 'next';
    return { ps, pd, as, ad, ae, proc, surgeon, asa, delay: as - ps, status };
  });
  const live = cases.filter((c) => !c.cancelled);
  const used = live.reduce((a, c) => a + Math.max(0, Math.min(c.ae, DAY) - c.as), 0);
  const end = live.length ? live[live.length - 1].ae : 0;
  return { name, spec, turnover, firstDelay, cases, util: used / DAY * 100, end, overtime: Math.max(0, end - DAY) };
});

// Tomorrow (Thursday) plan: surgeon estimate vs ML prediction (P50 / P90), minutes.
export const TOMORROW = [
  ['Sala 4', 'Artroplastia total do joelho (robótica)', 'Dr. Ricardo Alves', 100, 108, 131, 2, 0.06],
  ['Sala 4', 'Artroplastia total do joelho (robótica)', 'Dr. Ricardo Alves', 100, 112, 138, 3, 0.11],
  ['Sala 4', 'Revisão de prótese da anca', 'Dr. Ricardo Alves', 150, 196, 248, 3, 0.18],
  ['Sala 1', 'Gastrectomia parcial', 'Dr. Henrique Sá', 180, 214, 262, 3, 0.09],
  ['Sala 1', 'Colecistectomia laparoscópica', 'Dra. Inês Cardoso', 75, 82, 104, 2, 0.21],
  ['Sala 3', 'Prostatectomia radical (robótica)', 'Dr. Miguel Antunes', 180, 171, 205, 2, 0.04],
  ['Sala 7', 'Histerectomia laparoscópica', 'Dra. Paula Reis', 90, 96, 121, 2, 0.32],
  ['Sala 8', 'Cirurgia endoscópica dos seios perinasais', 'Dr. Luís Faria', 120, 118, 141, 2, 0.05],
].map(([room, proc, surgeon, est, p50, p90, asa, cancelRisk]) => ({ room, proc, surgeon, est, p50, p90, asa, cancelRisk }));

// Weekly blocks per specialty: allocated vs needed by the waiting list (consistent with Percurso do doente).
export const BLOCKS = [['Ortopedia', 18, 22, 6], ['Oftalmologia', 10, 10, 2], ['Cirurgia Geral', 16, 15, 9], ['Urologia', 8, 9, 4], ['Otorrinolaringologia', 6, 6, 3], ['Ginecologia', 8, 7, 12], ['Cirurgia Plástica', 4, 5, 0], ['Cirurgia Cardiotorácica', 5, 5, 1]];

// People needed vs available today (afternoon peak 14:00-20:00).
export const TEAM = [
  ['Cirurgiões', 18, 18, ''], ['Anestesiologistas', 11, 10, 'Falta 1 a partir das 14:00 (baixa médica)'], ['Enfermeiros instrumentistas', 20, 20, ''],
  ['Enfermeiros circulantes', 20, 19, 'Sala 9 partilha circulante com a Sala 8 à tarde'], ['Enfermeiros de anestesia', 10, 10, ''], ['Assistentes operacionais', 12, 12, ''],
];
const S3 = ROOMS[2].cases, S4 = ROOMS[3].cases, S8 = ROOMS[7].cases;
export const EQUIPMENT = [
  ['Robô cirúrgico', 1, 1, `Sala 4 até ≈ ${hhmm(S4[3].ae)} · amanhã pedido pela Sala 3 às 08:00`, 'p-bad', 'Conflito amanhã'],
  ['Arco em C (fluoroscopia)', 4, 3, 'Salas 2, 4 e 10', 'p-ok', 'Disponível'],
  ['Torre de laparoscopia', 6, 4, 'Salas 1, 3, 7 e 10', 'p-ok', 'Disponível'],
  ['Microscópio cirúrgico', 2, 1, 'Sala 5', 'p-ok', 'Disponível'],
  ['Sistema de navegação', 1, 1, 'Sala 2 (artrodese lombar)', 'p-warn', 'Em uso'],
  ['Máquina de circulação extracorporal', 2, 1, 'Sala 6', 'p-ok', 'Disponível'],
];
// Sterile kits: needed time comes from the live schedule.
export const KITS = [
  ['Caixa de joelho robótico n.º 2', 'Sala 4 · 4.ª cirurgia', hhmm(S4[3].as), hhmm(S4[3].as + 30), 'p-bad', 'Atraso de 30 min na esterilização'],
  ['Prótese total da anca cimentada (tamanho 4)', 'Sala 4 · 3.ª cirurgia', hhmm(S4[2].as), 'em stock', 'p-ok', 'Pronta'],
  ['Caixa de artrodese lombar', 'Sala 2 · 3.ª cirurgia', hhmm(ROOMS[1].cases[2].as), 'em uso', 'p-ok', 'Em uso'],
  ['Kit de nefrectomia laparoscópica', 'Sala 3 · 5.ª cirurgia', hhmm(S3[4].as), hhmm(S3[4].as - 50), 'p-ok', 'Pronta'],
  ['Caixa de timpanoplastia', 'Sala 8 · 4.ª cirurgia', hhmm(S8[3].as), hhmm(S8[3].as - 95), 'p-ok', 'Pronta'],
];
// Post-op capacity today.
export const RECOVERY = { labels: ['08h', '10h', '12h', '14h', '16h', '18h', '20h'], pacu: [2, 9, 12, 13, 14, 12, 6], pacuBeds: 14, icuFree: 2, icuNeed: 3, wardNeed: 41, wardFree: 37 };

// Last 30 days performance.
export const TURNOVER = [['Sala 1', 23], ['Sala 2', 22], ['Sala 3', 21], ['Sala 4', 34], ['Sala 5', 11], ['Sala 6', 31], ['Sala 7', 24], ['Sala 8', 22], ['Sala 9', 25]];
export const UTIL_SPEC = [['Oftalmologia', 91], ['Ortopedia', 83], ['Cirurgia Cardiotorácica', 80], ['Urologia', 77], ['Cirurgia Geral', 76], ['Otorrinolaringologia', 74], ['Cirurgia Plástica', 72], ['Ginecologia', 63]];
export const TREND = { labels: ['S35', 'S36', 'S37', 'S38', 'S39', 'S40', 'S41', 'S42', 'S43', 'S44', 'S45', 'S46'], util: [75.1, 76.4, 77.0, 76.2, 77.8, 78.6, 77.4, 78.9, 79.3, 78.0, 78.4, 78.2], cancel: [4.6, 4.4, 4.1, 4.5, 4.0, 3.8, 4.2, 3.7, 3.5, 3.9, 3.7, 3.6] };
export const FIRST_CASE = { labels: ['A horas', '1-15 min', '16-30 min', '31-60 min', '> 60 min'], data: [71, 14, 9, 4, 2] };
export const SURGEONS = [
  ['Dr. Ricardo Alves', 'Ortopedia', 38, 7, 81, 1.4], ['Dr. Rui Pinto', 'Ortopedia', 31, 4, 88, 1.9], ['Dr. Tomás Vieira', 'Ortopedia', 22, 18, 64, 3.1],
  ['Dr. Henrique Sá', 'Cirurgia Geral', 34, 14, 79, 2.3], ['Dra. Inês Cardoso', 'Cirurgia Geral', 29, 6, 90, 1.7], ['Dr. Miguel Antunes', 'Urologia', 41, 5, 86, 1.2],
  ['Dra. Paula Reis', 'Ginecologia', 27, 3, 92, 0.9], ['Dra. Clara Neves', 'Oftalmologia', 96, 1, 95, 0.4],
];
// Tomorrow's patients with ML risks and pre-op checklist (consent, labs, anaesthesia, insurer, instructions, kit).
export const PREOP = [
  ['Joaquim Ferreira', 71, 'Artroplastia total do joelho (robótica)', 'Sala 4 · 08:00', 'Multicare', [1, 1, 1, 1, 1, 1], 0.06, 0.04, 0.08, 2.9],
  ['Rosa Marques', 78, 'Artroplastia total do joelho (robótica)', 'Sala 4 · 10:10', 'ADSE', [1, 1, 0, 1, 1, 1], 0.11, 0.12, 0.14, 3.6],
  ['Fernando Lopes', 69, 'Revisão de prótese da anca', 'Sala 4 · 12:20', 'Médis', [1, 0, 1, 0, 1, 1], 0.18, 0.21, 0.19, 5.4],
  ['Helena Duarte Silva', 62, 'Gastrectomia parcial', 'Sala 1 · 08:00', 'Multicare', [1, 1, 1, 1, 1, 1], 0.09, 0.34, 0.22, 6.8],
  ['Carla Monteiro', 44, 'Colecistectomia laparoscópica', 'Sala 1 · 11:45', 'Particular', [1, 1, 1, 1, 0, 1], 0.21, 0.02, 0.04, 1.1],
  ['António Gaspar', 66, 'Prostatectomia radical (robótica)', 'Sala 3 · 08:00', 'AdvanceCare', [1, 1, 1, 1, 1, 1], 0.04, 0.06, 0.09, 2.4],
  ['Marta Coelho', 47, 'Histerectomia laparoscópica', 'Sala 7 · 08:00', 'Médis', [0, 1, 1, 1, 0, 1], 0.32, 0.03, 0.06, 1.9],
].map(([name, age, proc, when, payer, check, cancel, icu, compl, los]) => ({ name, age, proc, when, payer, check, cancel, icu, compl, los }));
export const CHECK = ['Consentimento', 'Análises', 'Avaliação anestésica', 'Autorização do seguro', 'Instruções de jejum (app)', 'Kit de material'];
