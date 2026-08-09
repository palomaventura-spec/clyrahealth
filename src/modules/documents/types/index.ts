export const documentLabels = {
  PRESCRIPTION: "Receita simples",
  EXAM_REQUEST: "Pedido de exame",
  MEDICAL_CERTIFICATE: "Atestado",
  ATTENDANCE_DECLARATION: "Declaração de comparecimento"
} as const;

export type ClinicalDocumentTypeValue = keyof typeof documentLabels;
