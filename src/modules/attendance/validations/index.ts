import { z } from "zod";

export const attendanceSchema = z.object({
  complaint: z.string().max(5000).optional(),
  anamnesis: z.string().max(10000).optional(),
  examination: z.string().max(10000).optional(),
  assessment: z.string().max(10000).optional(),
  evolution: z.string().max(10000).optional(),
  conduct: z.string().max(5000).optional(),
  returnNotes: z.string().max(3000).optional(),
  returnDate: z.string().optional()
});
