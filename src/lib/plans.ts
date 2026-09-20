import type { Plan, PlanId, Task } from "./domain";

export const PLANS: Record<PlanId, Plan> = {
  A: {
    id: "A",
    name: "基础枪法训练",
    title: "基础枪法训练",
    description: "先把基础练稳，让每一次开枪都有准备。",
    target: "预瞄 · 移动 · 第一枪",
    tasks: [
      {
        id: "a-range",
        name: "靶场热身",
        description:
          "进入靶场，完成 100 个训练机器人。先站稳再开枪，以准确度为先；时间到即可结束。",
        purpose: "找回手感，建立稳定的开枪节奏。",
        duration_minutes: 5,
      },
      {
        id: "a-crosshair",
        name: "预瞄练习",
        description: "进入自定义地图，沿常用路线移动，把准星保持在头线，逐个预瞄常见架枪位。",
        purpose: "让准星提前出现在对手头部的位置。",
        duration_minutes: 5,
      },
      {
        id: "a-dm",
        name: "乱斗",
        description: "进行乱斗，只关注头线、停稳和第一枪。不追求排名，按分配时间结束训练。",
        purpose: "把正确的预瞄习惯带进真实对枪。",
        duration_minutes: 10,
      },
    ],
  },
  B: {
    id: "B",
    name: "爆头与预瞄训练",
    title: "爆头与预瞄训练",
    description: "少一点乱扫，多一点有把握的第一枪。",
    target: "头线 · 首发 · 单点",
    tasks: [
      {
        id: "b-static",
        name: "静止目标爆头热身",
        description: "在靶场对静止 训练机器人 单点头部，每次命中后再切换目标，保持匀速。",
        purpose: "建立清晰的头部瞄准与首发节奏。",
        duration_minutes: 5,
      },
      {
        id: "b-crosshair",
        name: "预瞄训练",
        description: "选择熟悉的地图，贴合掩体逐个清点，准星始终保持在预计头部高度。",
        purpose: "减少看到对手之后才移动准星的距离。",
        duration_minutes: 5,
      },
      {
        id: "b-guardian",
        name: "戍卫乱斗",
        description: "使用戍卫进行乱斗。避免乱扫，优先单点和爆头；按分配时间结束。",
        purpose: "用单发武器巩固瞄准优先的习惯。",
        duration_minutes: 10,
      },
    ],
  },
  C: {
    id: "C",
    name: "微调与精准控枪训练",
    title: "微调与精准控枪训练",
    description: "不急着开枪，先把最后一点距离修准。",
    target: "微调 · 控制 · 远距离",
    tasks: [
      {
        id: "c-small",
        name: "小目标热身",
        description: "在靶场拉开与 训练机器人 的距离，缓慢将准星移动到头部，再开枪。",
        purpose: "唤醒小目标的视觉判断和手部控制。",
        duration_minutes: 5,
      },
      {
        id: "c-micro",
        name: "微调训练",
        description:
          "将准星放在 训练机器人 头部旁，做小幅度修正后单点。拉过时先停下，修正后再开枪。",
        purpose: "练习小幅修枪，减少过度拉枪。",
        duration_minutes: 7,
      },
      {
        id: "c-vandal",
        name: "狂徒单点练习",
        description: "使用 狂徒 逐个单点头部。每枪之间恢复准星，停稳后再射击。",
        purpose: "把精准微调连接到稳定的第一枪。",
        duration_minutes: 5,
      },
      {
        id: "c-dm",
        name: "乱斗",
        description: "进入乱斗，优先中远距离对枪。先修准再单点，不追求击杀数；时间到即可结束。",
        purpose: "在实战节奏中保持微调的耐心。",
        duration_minutes: 10,
      },
    ],
  },
};

// Largest-remainder allocation preserves exactly the chosen daily time budget.
export function scheduleTasks(planId: PlanId, minutes: number): Task[] {
  const tasks = PLANS[planId].tasks;
  const total = tasks.reduce((sum, t) => sum + t.duration_minutes, 0);
  const shares = tasks.map((t) => (minutes * t.duration_minutes) / total);
  const durations = shares.map(Math.floor);
  const order = shares
    .map((v, i) => ({ i, remainder: v - durations[i] }))
    .sort((a, b) => b.remainder - a.remainder || a.i - b.i);
  const remaining = minutes - durations.reduce((a, b) => a + b, 0);
  for (let n = 0; n < remaining; n++) durations[order[n].i]++;
  return tasks.map((t, i) => ({ ...t, duration_minutes: durations[i] }));
}
