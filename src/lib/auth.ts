import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";

const COOKIE_NAME = "clyra_session";
const SESSION_DAYS = 7;

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { token, expiresAt, userId }
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          company: { include: { subscription: true } },
          professional: true
        }
      }
    }
  });

  if (!session || session.expiresAt < new Date() || !session.user.active) return null;
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireCompany() {
  const user = await requireUser();
  if (!user.companyId) redirect("/saas-admin");
  return { user, companyId: user.companyId };
}

export function canManage(role: string) {
  return ["OWNER", "ADMIN"].includes(role);
}


export async function requireActiveCompany() {
  const { user, companyId } = await requireCompany();
  const subscription = user.company?.subscription;

  if (user.role === "OWNER") {
    if (subscription?.status === "TRIAL" && subscription.trialEnds && subscription.trialEnds < new Date()) {
      redirect("/assinatura?trial=expirado");
    }
    if (["PAST_DUE", "CANCELLED"].includes(subscription?.status ?? "")) {
      redirect("/assinatura?bloqueado=1");
    }
  } else {
    if (
      (subscription?.status === "TRIAL" && subscription.trialEnds && subscription.trialEnds < new Date()) ||
      ["PAST_DUE", "CANCELLED"].includes(subscription?.status ?? "")
    ) {
      redirect(`/acesso/${user.company?.slug}?erro=assinatura`);
    }
  }

  return { user, companyId };
}
