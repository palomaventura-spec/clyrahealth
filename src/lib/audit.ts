import { AuditAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function audit(input: {
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  companyId?: string | null;
  userId?: string | null;
  description?: string | null;
  metadata?: unknown;
}) {
  try {
    await prisma.auditLog.create({ data: {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      companyId: input.companyId ?? null,
      userId: input.userId ?? null,
      description: input.description ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null
    }});
  } catch (error) { console.error("[AUDIT]", error); }
}
