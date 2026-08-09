import { PlanFeatureKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
export async function companyHasFeature(companyId:string, feature:PlanFeatureKey){
 const explicit=await prisma.planFeature.findUnique({where:{companyId_feature:{companyId,feature}}});
 if(explicit) return explicit.enabled;
 const sub=await prisma.subscription.findUnique({where:{companyId}});
 return !!sub && ["PRO_AI","PREMIUM","ENTERPRISE"].includes(sub.plan);
}
