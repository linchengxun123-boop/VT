import type { Assessment, PlanId } from "./domain";

// Display labels only: persisted values and recommendation inputs remain unchanged.
export const RANK_LABELS: Record<Assessment["rank"], string> = {
  Iron: "黑铁",
  Bronze: "青铜",
  Silver: "白银",
  Gold: "黄金",
  Platinum: "铂金",
  Diamond: "钻石",
  Ascendant: "超凡",
  Immortal: "神话",
  Radiant: "无畏战魂",
};
export const ROLE_LABELS: Record<Assessment["role"], string> = {
  Duelist: "决斗",
  Controller: "控场",
  Initiator: "先锋",
  Sentinel: "哨卫",
};
export function weaknessLabel(value: Assessment["weaknesses"][number]) {
  return value === "Crosshair Placement 差" ? "预瞄不稳" : value;
}
export function planLabel(id: PlanId) {
  return { A: "一", B: "二", C: "三" }[id];
}
