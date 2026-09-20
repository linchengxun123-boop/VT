export const trainingEnvironments = ["game", "aimlabs"] as const;

export type TrainingEnvironment = (typeof trainingEnvironments)[number];
export type PersonType = "选手" | "主播";
export type TrainingContentType = "完整计划" | "单项练习" | "教学参考";
export type VerificationStatus = "partial" | "pending";

export type TrainingSource = {
  title: string;
  url: string;
};

export type TrainingLibraryEntry = {
  id: string;
  displayName: string;
  personType: PersonType;
  avatar: string | null;
  theme: string;
  environments: TrainingEnvironment[];
  contentType: TrainingContentType;
  sources: TrainingSource[];
  verificationStatus: VerificationStatus;
  verifiedContent: string[];
  verificationNote: string;
  sort: number;
};

export const environmentLabels: Record<TrainingEnvironment, string> = {
  game: "游戏内",
  aimlabs: "Aimlabs",
};

export const verificationLabels: Record<VerificationStatus, string> = {
  partial: "部分核实",
  pending: "待核实",
};

export const trainingLibrary: TrainingLibraryEntry[] = [
  {
    id: "zmjjkk-range-and-deathmatch-reference",
    displayName: "zmjjkk",
    personType: "选手",
    avatar: null,
    theme: "靶场热身、瞄准定位、预瞄与乱斗",
    environments: ["game"],
    contentType: "教学参考",
    sources: [
      { title: "训练参考视频（一）", url: "https://www.bilibili.com/video/BV1CT421179h/" },
      { title: "训练参考视频（二）", url: "https://www.bilibili.com/video/BV1yCs5eTEJC/" },
    ],
    verificationStatus: "pending",
    verifiedContent: [],
    verificationNote: "当前仅记录候选主题与来源，具体步骤、时长和完整语境仍在整理。",
    sort: 10,
  },
  {
    id: "yay-aimlabs-micro-adjustment-partnership",
    displayName: "yay",
    personType: "选手",
    avatar: null,
    theme: "微调合作项目",
    environments: ["aimlabs"],
    contentType: "单项练习",
    sources: [{ title: "Aimlabs VALORANT 合作项目", url: "https://partners.aimlab.gg/valorant" }],
    verificationStatus: "partial",
    verifiedContent: ["该条目是 Aimlabs 合作项目中的单项练习参考，不是 yay 的完整日常训练计划。"],
    verificationNote: "项目的具体训练方式仍在整理，暂不作为完整方案使用。",
    sort: 20,
  },
  {
    id: "tenz-aimlabs-training-list-reference",
    displayName: "TenZ",
    personType: "选手",
    avatar: null,
    theme: "瞄准训练列表",
    environments: ["aimlabs"],
    contentType: "教学参考",
    sources: [
      {
        title: "Aimlabs 训练文章",
        url: "https://www.aimlabs.com/articles/valorant/how-to-start-valorant-aim-training-like-the-pros/",
      },
    ],
    verificationStatus: "pending",
    verifiedContent: [],
    verificationNote: "当前仅记录候选训练列表，具体项目和执行方式仍在整理。",
    sort: 30,
  },
  {
    id: "nats-warmup-and-deathmatch-reference",
    displayName: "nAts",
    personType: "选手",
    avatar: null,
    theme: "热身与乱斗方法",
    environments: ["game"],
    contentType: "教学参考",
    sources: [{ title: "热身与乱斗参考视频", url: "https://www.youtube.com/watch?v=CvMNanutBus" }],
    verificationStatus: "pending",
    verifiedContent: [],
    verificationNote: "训练步骤、时长和上下文仍在整理。",
    sort: 40,
  },
  {
    id: "demon1-aimlabs-routine-reference",
    displayName: "Demon1",
    personType: "选手",
    avatar: null,
    theme: "练枪流程参考",
    environments: ["aimlabs"],
    contentType: "教学参考",
    sources: [{ title: "练枪流程参考视频", url: "https://www.youtube.com/watch?v=3HQwi8ImsBk" }],
    verificationStatus: "pending",
    verifiedContent: [],
    verificationNote: "Aimlabs 具体训练内容待核实。",
    sort: 50,
  },
  {
    id: "chichoo-range-micro-adjustment-reference",
    displayName: "CHICHOO",
    personType: "选手",
    avatar: null,
    theme: "靶场微调参考",
    environments: ["game"],
    contentType: "教学参考",
    sources: [{ title: "第三方直播切片", url: "https://www.bilibili.com/video/BV1fjdZYkE1w/" }],
    verificationStatus: "partial",
    verifiedContent: ["当前来源为第三方直播切片，不能视作完整训练安排。"],
    verificationNote: "切片的完整语境和具体执行方式仍待核实。",
    sort: 60,
  },
];

export function isTrainingEnvironment(value: string | undefined): value is TrainingEnvironment {
  return trainingEnvironments.includes(value as TrainingEnvironment);
}

export function filterTrainingLibrary(environment?: TrainingEnvironment) {
  if (!environment) return trainingLibrary;
  return trainingLibrary.filter((entry) => entry.environments.includes(environment));
}

export function getTrainingLibraryEntry(id: string) {
  return trainingLibrary.find((entry) => entry.id === id);
}
