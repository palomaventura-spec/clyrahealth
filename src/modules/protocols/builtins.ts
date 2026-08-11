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

export function getBuiltinProtocol(
  id?: string
): ProtocolTemplateShape | undefined {
  return builtinProtocols.find(protocol => protocol.id === id);
}
