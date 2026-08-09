import { UserRole } from "@prisma/client";

export function isClinicManager(role: UserRole | string) { return role === "OWNER" || role === "ADMIN"; }
export function canOperateAgenda(role: UserRole | string) { return ["OWNER","ADMIN","RECEPTIONIST","PROFESSIONAL"].includes(role); }
export function canViewAllClinical(role: UserRole | string) { return role === "OWNER"; }
export function canViewOwnClinical(role: UserRole | string) { return role === "PROFESSIONAL"; }
export function canViewClinical(role: UserRole | string, userProfessionalId: string | null | undefined, responsibleProfessionalId: string) {
  if (role === "OWNER") return true;
  return role === "PROFESSIONAL" && Boolean(userProfessionalId) && userProfessionalId === responsibleProfessionalId;
}
export function canManageUsers(role: UserRole | string) { return role === "OWNER" || role === "ADMIN"; }
