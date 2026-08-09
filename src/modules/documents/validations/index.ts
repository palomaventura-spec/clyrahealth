import { z } from "zod";

export const clinicalDocumentSchema = z.object({
  type: z.enum(["PRESCRIPTION","EXAM_REQUEST","MEDICAL_CERTIFICATE","ATTENDANCE_DECLARATION"]),
  title: z.string().min(2).max(150),
  body: z.string().min(2).max(12000),
  instructions: z.string().max(6000).optional(),
  notes: z.string().max(4000).optional()
});
