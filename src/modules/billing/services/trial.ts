import { SubscriptionStatus } from "@prisma/client";

export function getTrialDays() {
  const n = Number(process.env.TRIAL_DAYS ?? 7);
  return Number.isFinite(n) && n > 0 ? n : 7;
}

export function createTrialWindow(now = new Date()) {
  return {
    trialStartedAt: now,
    trialEnds: new Date(now.getTime() + getTrialDays() * 86400000)
  };
}

export function trialDaysRemaining(trialEnds?: Date | null) {
  if (!trialEnds) return 0;
  return Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86400000));
}

export function subscriptionHasAccess(status: SubscriptionStatus, trialEnds?: Date | null) {
  if (status === "ACTIVE") return true;
  if (status === "TRIAL") return !!trialEnds && trialEnds >= new Date();
  return false;
}
