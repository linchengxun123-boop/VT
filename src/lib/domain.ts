import { z } from "zod";

export const RANKS = [
  "Iron",
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Ascendant",
  "Immortal",
  "Radiant",
] as const;
export const ROLES = ["Duelist", "Controller", "Initiator", "Sentinel"] as const;
export const MINUTES = [10, 20, 30, 45] as const;
export const WEAKNESSES = [
  "Crosshair Placement 差",
  "第一枪不准",
  "拉枪容易拉过",
  "急停不好",
  "爆头率低",
  "近距离对枪差",
  "远距离对枪差",
  "容易紧张乱扫",
] as const;
export const assessmentSchema = z.object({
  rank: z.enum(RANKS),
  role: z.enum(ROLES),
  daily_training_minutes: z.union([z.literal(10), z.literal(20), z.literal(30), z.literal(45)]),
  weaknesses: z
    .array(z.enum(WEAKNESSES))
    .max(8)
    .transform((v) => [...new Set(v)]),
});
export type Assessment = z.infer<typeof assessmentSchema>;
export type PlanId = "A" | "B" | "C";
export type Profile = Assessment & { id: string; selected_plan: PlanId; created_at: string };
export type Task = {
  id: string;
  name: string;
  description: string;
  purpose: string;
  duration_minutes: number;
};
export type Plan = {
  id: PlanId;
  name: string;
  title: string;
  description: string;
  target: string;
  tasks: Task[];
};
export type Checkin = {
  id: string;
  user_id: string;
  date: string;
  plan_id: PlanId;
  completed_tasks: number;
  total_tasks: number;
  total_minutes: number;
  created_at: string;
};
export type Snapshot = {
  profile: Profile | null;
  completed: string[];
  checkins: Checkin[];
  today: string;
  mode: "local" | "supabase";
};
