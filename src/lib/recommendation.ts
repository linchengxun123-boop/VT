import type { Assessment, PlanId } from "./domain";
export function recommendPlan(assessment: Assessment): PlanId {
  if (assessment.weaknesses.some((w) => ["拉枪容易拉过", "远距离对枪差"].includes(w))) return "C";
  if (
    assessment.weaknesses.some((w) =>
      ["Crosshair Placement 差", "爆头率低", "第一枪不准"].includes(w),
    )
  )
    return "B";
  return "A";
}
export function recommendationReason(assessment: Assessment): string {
  const plan = recommendPlan(assessment);
  if (plan === "C") return "你选择了拉枪或远距离对枪问题。先练习小幅修正，让准星更稳地停在目标上。";
  if (plan === "B") return "针对你的头线或第一枪问题，从预瞄、单点和爆头开始建立稳定习惯。";
  return "先从预瞄、移动和第一枪开始，建立每天都能坚持的基础训练节奏。";
}
