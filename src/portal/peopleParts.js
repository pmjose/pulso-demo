// Building blocks for generated patient and employee profiles. Fictitious.
import { C } from './data.js';

export const FIRST_F = ['Maria', 'Ana', 'Joana', 'Inês', 'Sofia', 'Beatriz', 'Mariana', 'Catarina', 'Rita', 'Teresa', 'Helena', 'Isabel', 'Paula', 'Cristina', 'Margarida', 'Filipa', 'Raquel', 'Patrícia', 'Sandra', 'Luísa', 'Graça', 'Fernanda', 'Rosa', 'Lúcia', 'Marta', 'Carla', 'Susana', 'Vera', 'Diana', 'Cláudia'];
export const FIRST_M = ['João', 'José', 'António', 'Manuel', 'Francisco', 'Pedro', 'Rui', 'Paulo', 'Luís', 'Miguel', 'Carlos', 'Jorge', 'Nuno', 'Tiago', 'André', 'Ricardo', 'Fernando', 'Joaquim', 'Vítor', 'Hugo', 'Bruno', 'Diogo', 'Duarte', 'Gonçalo', 'Afonso', 'Mário', 'Sérgio', 'Alberto', 'Armando', 'Henrique'];
export const LAST = ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Jesus', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Soares', 'Vieira', 'Monteiro', 'Cardoso', 'Rocha', 'Neves', 'Coelho', 'Cruz', 'Cunha', 'Pires', 'Ramos', 'Reis', 'Simões', 'Antunes', 'Matos'];
export const PLACES = { 'HL Lisboa': ['Benfica', 'Lumiar', 'Telheiras', 'Carnide', 'Alvalade', 'Odivelas'], 'HL Torres de Lisboa': ['Campo de Ourique', 'Estrela', 'Amadora'], 'HL Oeiras': ['Oeiras', 'Carcavelos', 'Paço de Arcos'], 'HL Setúbal': ['Setúbal', 'Palmela', 'Montijo'], 'HL Arrábida': ['Vila Nova de Gaia', 'Porto', 'Espinho'], 'HL Coimbra': ['Coimbra', 'Condeixa-a-Nova', 'Cantanhede'], 'HL Aveiro': ['Aveiro', 'Ílhavo', 'Águeda'], 'HL Leiria': ['Leiria', 'Marinha Grande', 'Pombal'], 'HL Santarém': ['Santarém', 'Almeirim', 'Cartaxo'], 'HL Figueira da Foz': ['Figueira da Foz', 'Montemor-o-Velho'], 'HL Funchal': ['Funchal', 'Câmara de Lobos', 'Santa Cruz'] };
export const PAYER_MIX = [['Multicare', 31], ['Médis', 14], ['AdvanceCare', 9], ['ADSE', 15], ['SNS', 7], ['Particular', 18], ['Outras seguradoras', 6]];

const M = (labels) => labels;
const MONTHS9 = M(['nov 24', 'fev 25', 'mai 25', 'ago 25', 'nov 25', 'fev 26', 'mai 26', 'ago 26', 'nov 26']);

// Condition templates. `ages` = [min, max], `sex` = 'F' | 'M' | 'any'.
// risk: main risk; s(v) builds a measurement series ending near the patient's state.
export const CONDITIONS = {
  dm2: {
    label: 'Diabetes tipo 2', ages: [45, 84], sex: 'any', spec: 'Endocrinologia', code: ['E11.9', 'Diabetes mellitus tipo 2'],
    meds: [['Metformina 1000 mg', '2×/dia'], ['Dapagliflozina 10 mg', '1×/dia'], ['Atorvastatina 20 mg', '1×/dia']],
    risk: ['Descompensação diabética', ['HbA1c a subir', 'Adesão à medicação', 'Seguimento em atraso', 'Atividade física', 'IMC']],
    gaps: [['HbA1c (a cada 3-6 meses)'], ['Rastreio de retinopatia (anual)'], ['Exame do pé diabético (anual)'], ['Microalbuminúria (anual)']],
    series: (bad) => ({ name: 'HbA1c (%)', min: 5.5, max: 9.5, target: 7, data: MONTHS9.map((_, i) => +(6.8 + (bad ? i * .12 : -i * .03) + Math.sin(i) * .1).toFixed(1)) }),
    nba: ['Marcar consulta de <b>Endocrinologia</b>.', 'Agendar <b>rastreio de retinopatia</b>.'],
    proj: (bad) => ({ title: 'HbA1c projetada a 12 meses', unit: '%', min: 6, max: 9.5, base: bad ? [7.9, 8.1, 8.3, 8.5, 8.6] : [7.0, 7.1, 7.2, 7.2, 7.3], action: bad ? [7.9, 7.6, 7.3, 7.2, 7.1] : [7.0, 6.9, 6.9, 6.8, 6.8], actionName: 'Com seguimento e ajuste terapêutico', target: 7 }),
  },
  hta: {
    label: 'Hipertensão', ages: [40, 90], sex: 'any', spec: 'Medicina Interna', code: ['I10', 'Hipertensão essencial'],
    meds: [['Perindopril 5 mg', '1×/dia'], ['Amlodipina 5 mg', '1×/dia']],
    risk: ['Evento cardiovascular a 10 anos', ['Tensão arterial sistólica', 'Idade', 'Colesterol LDL', 'Tabagismo', 'Adesão à medicação']],
    gaps: [['Tensão arterial < 140/90'], ['Perfil lipídico (anual)'], ['Eletrocardiograma (anual)']],
    series: (bad) => ({ name: 'Tensão sistólica (mmHg)', min: 110, max: 170, target: 140, data: MONTHS9.map((_, i) => Math.round(138 + (bad ? i * 2.2 : -i) + Math.cos(i) * 3)) }),
    nba: ['Rever <b>terapêutica anti-hipertensora</b> em teleconsulta.', 'Ativar <b>medição em casa</b> com tensiómetro ligado.'],
    proj: (bad) => ({ title: 'Tensão sistólica projetada', unit: ' mmHg', min: 115, max: 165, base: bad ? [152, 154, 156, 157, 158] : [136, 137, 137, 138, 138], action: bad ? [152, 145, 139, 136, 134] : [136, 133, 131, 130, 130], actionName: 'Com ajuste terapêutico e medição em casa', target: 140 }),
  },
  dpoc: {
    label: 'DPOC', ages: [55, 88], sex: 'any', spec: 'Pneumologia', code: ['J44.9', 'Doença pulmonar obstrutiva crónica'],
    meds: [['Tiotrópio inalado', '1×/dia'], ['Salbutamol inalado', 'em SOS']],
    risk: ['Exacerbação no inverno', ['Exacerbações anteriores', 'Temperatura mínima prevista', 'PM2,5 na zona de residência', 'Vacina da gripe', 'Técnica inalatória']],
    gaps: [['Vacina da gripe 2026/27'], ['Vacina antipneumocócica'], ['Espirometria (anual)']],
    series: (bad) => ({ name: 'Saturação de O₂ (%)', min: 85, max: 100, target: 92, data: MONTHS9.map((_, i) => Math.round(95 - (bad ? i * .4 : 0) + Math.sin(i) * .8)) }),
    nba: ['Vacinar contra a <b>gripe</b> antes da frente fria.', 'Rever <b>técnica inalatória</b> com a enfermagem.'],
    proj: (bad) => ({ title: 'Risco acumulado de exacerbação · inverno', unit: '%', min: 0, max: 70, base: bad ? [0, 18, 34, 47, 58] : [0, 8, 15, 21, 26], action: bad ? [0, 9, 16, 22, 27] : [0, 5, 9, 12, 15], actionName: 'Com vacina, inalador revisto e alerta de frio', target: null }),
  },
  ic: {
    label: 'Insuficiência cardíaca', ages: [62, 92], sex: 'any', spec: 'Cardiologia', code: ['I50.9', 'Insuficiência cardíaca'],
    meds: [['Sacubitril/valsartan 49/51 mg', '2×/dia'], ['Bisoprolol 5 mg', '1×/dia'], ['Furosemida 40 mg', '1×/dia']],
    risk: ['Readmissão a 30 dias', ['Aumento de peso recente', 'Internamento anterior', 'Função renal', 'Adesão ao diurético', 'Vive sozinho']],
    gaps: [['Cardiologia 2-4 semanas após alta'], ['Ecocardiograma (anual)'], ['Telemonitorização de peso']],
    series: (bad) => ({ name: 'Peso (kg, balança ligada)', min: 60, max: 95, target: null, data: MONTHS9.map((_, i) => +(78 + (bad && i > 6 ? (i - 6) * 1.1 : 0) + Math.sin(i) * .4).toFixed(1)) }),
    nba: ['Teleconsulta de <b>enfermagem</b> para rever peso e diurético.', 'Ativar <b>telemonitorização</b> diária.'],
    proj: (bad) => ({ title: 'Risco acumulado de readmissão · 30 dias', unit: '%', min: 0, max: 70, base: bad ? [0, 21, 36, 47, 55] : [0, 7, 12, 16, 19], action: bad ? [0, 8, 14, 18, 22] : [0, 4, 7, 9, 11], actionName: 'Com telemonitorização e ajuste do diurético', target: null }),
  },
  oa: {
    label: 'Gonartrose', ages: [55, 85], sex: 'any', spec: 'Ortopedia', code: ['M17.1', 'Gonartrose primária'],
    meds: [['Paracetamol 1 g', 'em SOS'], ['Etoricoxib 60 mg', '1×/dia']],
    risk: ['Agravamento funcional', ['Dor (escala 0-10)', 'Passos diários', 'IMC', 'Fisioterapia interrompida', 'Idade']],
    gaps: [['Consulta de Ortopedia (anual)'], ['Plano de fisioterapia ativo'], ['Avaliação para cirurgia']],
    series: (bad) => ({ name: 'Passos/dia (mil, app)', min: 0, max: 10, target: null, data: MONTHS9.map((_, i) => +(7.6 - (bad ? i * .4 : i * .08)).toFixed(1)) }),
    nba: ['Avaliar <b>artroplastia do joelho</b> na Unidade de Joelho.', 'Retomar <b>fisioterapia</b> com sessões em casa.'],
    proj: (bad) => ({ title: 'Passos diários projetados', unit: ' mil', min: 0, max: 10, base: bad ? [4.4, 4.0, 3.7, 3.4, 3.2] : [6.9, 6.8, 6.6, 6.5, 6.4], action: bad ? [4.4, 5.0, 6.1, 7.0, 7.4] : [6.9, 7.2, 7.4, 7.5, 7.6], actionName: 'Com cirurgia ou fisioterapia', target: null }),
  },
  asma: {
    label: 'Asma', ages: [8, 55], sex: 'any', spec: 'Imunoalergologia', code: ['J45.9', 'Asma'],
    meds: [['Budesonida/formoterol inalado', '2×/dia']],
    risk: ['Crise de asma na primavera', ['Índice de pólen previsto', 'Crises anteriores', 'Adesão ao inalador', 'PM2,5', 'Infeção respiratória recente']],
    gaps: [['Plano de ação escrito'], ['Espirometria (anual)'], ['Revisão da técnica inalatória']],
    series: (bad) => ({ name: 'Pico de fluxo (L/min)', min: 250, max: 520, target: 380, data: MONTHS9.map((_, i) => Math.round(430 - (bad ? i * 9 : 0) + Math.sin(i) * 12)) }),
    nba: ['Ativar <b>alerta de pólen</b> na app.', 'Rever <b>plano de ação</b> em teleconsulta.'],
    proj: (bad) => ({ title: 'Risco de crise · próximos 6 meses', unit: '%', min: 0, max: 60, base: bad ? [0, 12, 24, 38, 44] : [0, 5, 9, 15, 18], action: bad ? [0, 6, 11, 17, 20] : [0, 3, 5, 8, 10], actionName: 'Com alerta de pólen e plano de ação', target: null }),
  },
  onco: {
    label: 'Cancro da mama (em vigilância)', ages: [38, 80], sex: 'F', spec: 'Oncologia', code: ['Z85.3', 'História pessoal de cancro da mama'],
    meds: [['Letrozol 2,5 mg', '1×/dia']],
    risk: ['Abandono da hormonoterapia', ['Efeitos secundários reportados', 'Levantamentos na farmácia', 'Faltas a consultas', 'Apoio psicológico', 'Idade']],
    gaps: [['Mamografia (anual)'], ['Densitometria óssea'], ['Consulta de Oncologia (semestral)']],
    series: (bad) => ({ name: 'Adesão à hormonoterapia (%)', min: 40, max: 100, target: 80, data: MONTHS9.map((_, i) => Math.round(96 - (bad ? i * 3.5 : i * .5))) }),
    nba: ['Consulta de <b>enfermagem oncológica</b> sobre efeitos secundários.', 'Agendar <b>mamografia</b> anual.'],
    proj: (bad) => ({ title: 'Adesão projetada à hormonoterapia', unit: '%', min: 40, max: 100, base: bad ? [68, 63, 58, 54, 50] : [92, 91, 90, 90, 89], action: bad ? [68, 76, 82, 85, 86] : [92, 92, 93, 93, 93], actionName: 'Com acompanhamento de enfermagem', target: 80 }),
  },
  drc: {
    label: 'Doença renal crónica', ages: [55, 90], sex: 'any', spec: 'Nefrologia', code: ['N18.3', 'Doença renal crónica, estádio 3'],
    meds: [['Dapagliflozina 10 mg', '1×/dia']],
    risk: ['Progressão da doença renal', ['TFG a descer', 'Proteinúria', 'Tensão arterial', 'Diabetes', 'Anti-inflamatórios']],
    gaps: [['Função renal (a cada 6 meses)'], ['Consulta de Nefrologia (anual)'], ['Revisão de fármacos nefrotóxicos']],
    series: (bad) => ({ name: 'TFG (mL/min)', min: 20, max: 80, target: 45, data: MONTHS9.map((_, i) => Math.round(58 - (bad ? i * 1.6 : i * .4))) }),
    nba: ['Rever <b>fármacos nefrotóxicos</b>.', 'Marcar <b>Nefrologia</b>.'],
    proj: (bad) => ({ title: 'TFG projetada a 12 meses', unit: ' mL/min', min: 20, max: 70, base: bad ? [45, 42, 40, 37, 35] : [55, 54, 54, 53, 53], action: bad ? [45, 44, 43, 43, 42] : [55, 55, 55, 55, 54], actionName: 'Com controlo tensional e revisão de fármacos', target: null }),
  },
};
export const COND_KEYS = Object.keys(CONDITIONS);
export const COND_COLORS = { dm2: C.coral, hta: C.sky, dpoc: C.violet, ic: C.coral, oa: C.sun, asma: C.teal, onco: C.violet, drc: C.sky };
