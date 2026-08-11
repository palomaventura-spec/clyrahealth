export type ProtocolTemplateShape = {
  id: string;
  name: string;
  specialty: string | null;
  description: string | null;
  complaint: string | null;
  anamnesis: string | null;
  examination: string | null;
  assessment: string | null;
  evolution: string | null;
  conduct: string | null;
  returnNotes: string | null;
};

export const builtinProtocols: ProtocolTemplateShape[] = [
  {
    id: "puericultura",
    name: "Puericultura",
    specialty: "Pediatria",
    description: "Acompanhamento periódico do crescimento e desenvolvimento infantil.",
    complaint: null,
    anamnesis:
      "Alimentação:\nSono:\nEliminações:\nVacinação:\nDesenvolvimento neuropsicomotor:\nIntercorrências desde a última consulta:",
    examination:
      "Peso:\nAltura:\nPerímetro cefálico:\nSinais vitais:\nExame físico geral:",
    assessment:
      "Crescimento e desenvolvimento:\nEstado vacinal:\nAvaliação nutricional:",
    evolution: null,
    conduct:
      "Orientações preventivas:\nAlimentação:\nSono:\nVacinação:\nSinais de alerta:",
    returnNotes: "Retorno de puericultura conforme faixa etária."
  },
  {
    id: "introducao-alimentar",
    name: "Introdução alimentar",
    specialty: "Pediatria",
    description: "Modelo para orientação e acompanhamento da introdução alimentar.",
    complaint: null,
    anamnesis:
      "Aleitamento atual:\nAlimentos já introduzidos:\nAceitação alimentar:\nAlergias/reações:\nEngasgos:\nEliminações:",
    examination:
      "Peso:\nAltura:\nAvaliação do crescimento:\nExame físico:",
    assessment:
      "Estado nutricional:\nProntidão alimentar:\nRiscos/alergias:",
    evolution: null,
    conduct:
      "Orientações sobre consistência e progressão:\nGrupos alimentares:\nÁgua:\nAlimentos a evitar:\nPrevenção de engasgos:",
    returnNotes: "Reavaliar evolução da introdução alimentar."
  },
  {
    id: "pre-natal",
    name: "Consulta pré-natal",
    specialty: "Ginecologia / Obstetrícia",
    description: "Estrutura de acompanhamento pré-natal.",
    complaint: null,
    anamnesis:
      "Idade gestacional:\nDUM/DPP:\nGestações anteriores:\nSintomas atuais:\nMedicações/suplementos:\nExames realizados:\nIntercorrências:",
    examination:
      "Peso:\nPA:\nAltura uterina:\nBCF:\nEdema:\nExame físico direcionado:",
    assessment:
      "Evolução gestacional:\nFatores de risco:\nExames pendentes:",
    evolution: null,
    conduct:
      "Orientações:\nExames solicitados:\nSuplementação/medicações:\nSinais de alerta:",
    returnNotes: "Programar próxima consulta de pré-natal."
  },
  {
    id: "cardiologia-acompanhamento",
    name: "Acompanhamento cardiológico",
    specialty: "Cardiologia",
    description: "Estrutura para seguimento cardiovascular e revisão de fatores de risco.",
    complaint: null,
    anamnesis:
      "Sintomas cardiovasculares atuais:\nDor torácica:\nDispneia:\nPalpitações:\nSíncope/tontura:\nMedicações em uso:\nAdesão ao tratamento:\nHábitos e fatores de risco:",
    examination:
      "PA:\nFC:\nPeso/IMC:\nAusculta cardíaca:\nAusculta pulmonar:\nEdema:\nExame cardiovascular direcionado:",
    assessment:
      "Controle pressórico:\nRisco cardiovascular:\nEvolução clínica:\nExames complementares:",
    evolution: null,
    conduct:
      "Ajustes/orientações:\nExames solicitados:\nMetas terapêuticas:\nSinais de alerta:",
    returnNotes: "Definir intervalo de seguimento conforme quadro clínico."
  },
  {
    id: "fisioterapia-avaliacao",
    name: "Avaliação fisioterapêutica",
    specialty: "Fisioterapia",
    description: "Modelo de avaliação funcional e planejamento fisioterapêutico.",
    complaint: null,
    anamnesis:
      "Queixa funcional:\nInício e evolução:\nDor (local/intensidade):\nLimitações nas atividades:\nHistórico de lesões/cirurgias:\nTratamentos prévios:",
    examination:
      "Inspeção:\nAmplitude de movimento:\nForça muscular:\nTestes funcionais:\nMarcha/equilíbrio:\nEscala de dor:",
    assessment:
      "Diagnóstico cinético-funcional:\nPrincipais limitações:\nObjetivos terapêuticos:",
    evolution: null,
    conduct:
      "Plano terapêutico:\nExercícios/orientações:\nFrequência sugerida:\nMetas de evolução:",
    returnNotes: "Reavaliar parâmetros funcionais conforme plano terapêutico."
  },
  {
    id: "odontologia-avaliacao",
    name: "Avaliação odontológica",
    specialty: "Odontologia",
    description: "Estrutura geral para avaliação odontológica inicial ou de acompanhamento.",
    complaint: null,
    anamnesis:
      "Queixa odontológica:\nHistórico médico relevante:\nAlergias:\nMedicações:\nHábitos de higiene:\nTratamentos odontológicos prévios:",
    examination:
      "Exame extraoral:\nExame intraoral:\nPeriodonto:\nDentes/restaurações:\nOclusão:\nAchados relevantes:",
    assessment:
      "Hipóteses/diagnósticos odontológicos:\nRiscos e prioridades:",
    evolution: null,
    conduct:
      "Plano de tratamento:\nOrientações:\nExames complementares:\nProcedimentos propostos:",
    returnNotes: "Definir retorno conforme plano odontológico."
  },
  {
    id: "retorno",
    name: "Consulta de retorno",
    specialty: null,
    description: "Modelo geral para retorno clínico.",
    complaint: null,
    anamnesis:
      "Evolução desde a última consulta:\nAdesão à conduta:\nNovos sintomas:\nResultados de exames:",
    examination: "Exame/avaliação direcionada:",
    assessment:
      "Resposta ao tratamento/conduta:\nReavaliação:",
    evolution: null,
    conduct:
      "Manter/ajustar conduta:\nNovas orientações:",
    returnNotes: "Definir necessidade e prazo de novo retorno."
  },
  {
    id: "cronico",
    name: "Acompanhamento de condição crônica",
    specialty: null,
    description: "Modelo geral de acompanhamento longitudinal.",
    complaint: null,
    anamnesis:
      "Sintomas atuais:\nAdesão ao tratamento:\nEfeitos adversos:\nHábitos e rotina:\nIntercorrências:",
    examination:
      "Sinais vitais:\nExame direcionado:\nParâmetros de acompanhamento:",
    assessment:
      "Controle da condição:\nFatores de risco:\nMetas:",
    evolution: null,
    conduct:
      "Ajustes terapêuticos:\nOrientações:\nExames/monitorização:",
    returnNotes: "Programar seguimento conforme controle clínico."
  }
];


function normalizeSpecialty(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const specialtyAliases: Record<string, string[]> = {
  pediatria: ["pediatria", "pediatra"],
  "ginecologia / obstetrícia": ["ginecologia", "obstetricia", "ginecologia obstetricia", "ginecologista", "obstetra"],
  cardiologia: ["cardiologia", "cardiologista"],
  fisioterapia: ["fisioterapia", "fisioterapeuta"],
  odontologia: ["odontologia", "dentista", "odontopediatria", "ortodontia"],
};

export function protocolMatchesSpecialties(
  protocol: ProtocolTemplateShape,
  specialties: Array<string | null | undefined>
) {
  if (!protocol.specialty) return true;

  const protocolKey = normalizeSpecialty(protocol.specialty);
  const accepted = specialtyAliases[protocol.specialty.toLowerCase()] ?? [protocolKey];

  return specialties.some((specialty) => {
    const normalized = normalizeSpecialty(specialty);
    return accepted.some((alias) => {
      const normalizedAlias = normalizeSpecialty(alias);
      return normalized === normalizedAlias ||
        normalized.includes(normalizedAlias) ||
        normalizedAlias.includes(normalized);
    });
  });
}

export function getBuiltinProtocol(
  id?: string
): ProtocolTemplateShape | undefined {
  return builtinProtocols.find(protocol => protocol.id === id);
}
