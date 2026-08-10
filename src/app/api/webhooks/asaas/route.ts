import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  const received = req.headers.get("asaas-access-token") ?? req.headers.get("x-webhook-token");
  if (expected && received !== expected) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const payload = await req.json().catch(() => null);
  if (!payload?.event) return NextResponse.json({ ok: true });

  const eventId = String(payload.id ?? payload.payment?.id ?? `${payload.event}-${Date.now()}`);
  const exists = await prisma.billingWebhookEvent.findUnique({ where: { eventId } });
  if (exists) return NextResponse.json({ ok: true, duplicate: true });

  await prisma.billingWebhookEvent.create({
    data: { provider: "ASAAS", eventId, eventType: String(payload.event), payloadJson: JSON.stringify(payload) }
  });

  return NextResponse.json({ ok: true });
}
