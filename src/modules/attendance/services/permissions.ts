import { UserRole } from "@prisma/client";
export const canViewClinicalContent = (role: UserRole) => role === "PROFESSIONAL";
