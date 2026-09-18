# VT v0.1 Product Requirements Document

**项目名称：** VT  
**版本：** v0.1  
**产品类型：** VALORANT 玩家训练与成长工具  
**当前阶段：** MVP  
**核心目标：** 验证玩家是否愿意持续使用 VT 进行训练，并为未来“比赛数据 + AI 分析 + 动态训练”建立基础。

---

# 1. 产品定义

## 1.1 VT 是什么

VT 是一个面向 VALORANT 玩家的个人训练教练。

它希望解决的不是“玩家找不到练枪教程”，而是：

- 不知道自己具体该练什么
- 不知道应该怎样系统训练
- 不知道训练是否真的带来了进步
- 看到了比赛数据，但不知道这些数据说明什么
- 不知道下一阶段应该调整什么

VT 最终希望建立一个持续循环：

**训练 → 比赛 → 数据 → 分析 → 调整训练 → 再次训练**

---

# 2. 产品长期方向

VT 长期不是一个简单的练枪打卡软件。

长期产品结构：

## Training

告诉用户今天应该练什么。

## Tracking

记录用户进行了哪些训练。

## Performance

记录玩家比赛中的实际表现。

## Analysis

分析用户近期表现发生了什么变化。

## Coaching

根据表现调整下一阶段训练计划。

最终形成：

```text
训练计划
↓
用户训练
↓
真实比赛
↓
获取对局数据
↓
分析表现变化
↓
发现短板
↓
调整训练计划
↓
继续训练
```

这是 VT 最核心的产品闭环。

---

# 3. VT 不是什么

VT 不是：

- 单纯的练枪教程网站
- 单纯的每日打卡 App
- VALORANT 战绩查询网站
- 掌上无畏契约的替代品
- Aimlabs 的替代品
- 社区论坛
- 游戏资讯网站
- 排行榜工具

掌瓦负责告诉玩家：

**“发生了什么。”**

例如：

- 当前段位
- 最近比赛
- 战绩
- KD
- 爆头表现

VT 希望进一步解决：

**“为什么会这样，以及接下来应该怎么练。”**

---

# 4. 目标用户

第一阶段目标用户：

有主动提升意愿的 VALORANT 玩家。

典型特征：

- Iron ～ Diamond 为主要目标段位
- 有提升段位的需求
- 平时会看教学视频
- 可能使用 Aimlabs / 靶场 / 乱斗进行训练
- 会查看掌瓦战绩
- 但没有稳定、系统的训练方法

暂时不重点服务：

- 完全休闲玩家
- Radiant / 职业级玩家
- 纯赛事观众
- 不愿意主动训练的玩家

---

# 5. 用户核心问题

## 问题 1：不知道练什么

玩家看到大量：

- B站教程
- 主播训练法
- Aimlabs Playlist
- 靶场训练
- 乱斗 方法

但不知道：

**“哪一种适合我？”**

---

## 问题 2：训练没有体系

典型情况：

今天练 30 分钟。

明天不练。

后天看主播视频又换一种训练方法。

没有持续性。

---

## 问题 3：不知道自己有没有变强

玩家完成大量训练之后，只能依靠：

- 感觉
- 段位
- 单场 KD

判断有没有进步。

缺乏长期趋势。

---

## 问题 4：不会分析比赛数据

例如：

用户看到：

```text
HS% 24%
KD 0.96
ADR 141
```

但不知道：

- 哪里有问题
- 应该练什么
- 哪个指标最重要
- 最近到底有没有改善

这是未来 VT AI Coach 的主要价值。

---

# 6. 产品核心价值

VT 必须持续回答用户三个问题：

## 今天我该练什么？

由训练计划解决。

## 最近我有没有进步？

未来由比赛数据 + 趋势分析解决。

## 接下来我应该怎么练？

未来由 AI Coach 和动态训练计划解决。

如果一个功能不能强化这三个问题之一，应谨慎加入产品。

---

# 7. v0.1 的目标

v0.1 不验证完整 AI Coach。

v0.1 首先验证：

> 玩家是否愿意按照 VT 提供的训练计划持续训练并打卡。

因此 v0.1 核心闭环：

```text
第一次进入
↓
玩家测评
↓
识别训练方向
↓
推荐训练计划
↓
每日训练任务
↓
完成任务
↓
完成当天训练
↓
生成打卡记录
↓
查看连续训练与历史
↓
第二天回来继续
```

---

# 8. v0.1 成功标准

第一阶段暂时不以注册用户数量作为主要成功指标。

重点观察：

## 激活

用户是否完成：

**测评 → 获得训练计划 → 开始训练**

---

## 第一次完成

用户是否完成第一次完整训练并成功打卡。

---

## 留存

重点观察：

- Day 1
- Day 3
- Day 7

目标验证：

**用户是否愿意连续使用 VT。**

---

# 9. v0.1 功能范围

v0.1 必须包含：

1. 玩家测评
2. 训练计划推荐
3. 今日训练
4. 训练任务完成
5. 每日打卡
6. Streak 连续训练
7. History 训练历史
8. 玩家基础资料

---

# 10. v0.1 明确不做

以下功能禁止在 v0.1 主动加入：

- Riot API
- 掌瓦接口抓取
- 掌瓦截图 AI 分析
- 自动战绩同步
- AI Coach
- LLM 动态训练推荐
- 主播训练专区
- 好友系统
- 排行榜
- 社区
- 评论
- 私信
- 付费
- 会员
- 广告
- 游戏资讯
- 战绩查询
- Aimlabs API
- 复杂动画
- 原生 App
- PWA

这些功能必须进入 Roadmap，而不是直接进入开发。

---

# 11. 玩家测评

路径：

`/assessment`

目标：

用最少的问题判断用户当前需要什么训练。

---

## 11.1 当前段位

选项：

- Iron
- Bronze
- Silver
- Gold
- Platinum
- Diamond
- Ascendant
- Immortal
- Radiant

---

## 11.2 主玩位置

- Duelist
- Controller
- Initiator
- Sentinel

第一版该字段主要用于建立玩家档案。

暂时不针对不同位置生成完全不同的训练体系。

---

## 11.3 每日可训练时间

选项：

- 10 分钟
- 20 分钟
- 30 分钟
- 45 分钟

---

## 11.4 玩家主要问题

允许多选：

- Crosshair Placement 差
- 第一枪不准
- 拉枪容易拉过
- 急停不好
- 爆头率低
- 近距离对枪差
- 远距离对枪差
- 容易紧张乱扫

---

# 12. v0.1 训练推荐系统

第一版不使用 AI。

使用可预测、可测试的规则系统。

---

## Plan A

### 基础枪法训练

主要适合：

- Iron
- Bronze
- Silver
- 没有明显专项问题的玩家

主要方向：

- Crosshair Placement
- 基础移动
- 第一枪准确度

---

## Plan B

### Headshot & Crosshair Training

主要适合：

- Crosshair Placement 差
- 爆头率低
- 第一枪不准

---

## Plan C

### 微调与精准控枪训练

主要适合：

- 拉枪容易拉过
- 远距离微调差
- 小范围修枪困难

---

# 13. 推荐优先级

如果用户选择：

**拉枪容易拉过**

优先：

Plan C

如果用户选择：

- Crosshair Placement 差
- 爆头率低
- 第一枪不准

优先：

Plan B

如果没有明显专项问题：

Iron / Bronze / Silver：

Plan A

多个条件冲突时：

```text
Plan C
>
Plan B
>
Plan A
```

推荐规则必须作为独立业务逻辑存在。

禁止直接散落在页面组件中。

---

# 14. Dashboard

路径：

`/dashboard`

Dashboard 是 v0.1 最重要页面。

用户打开 VT 后应该在数秒内知道：

1. 今天练什么
2. 要练多久
3. 已经完成多少
4. 连续训练几天

---

## 页面主要内容

### 用户状态

例如：

```text
Gold 2

微调与精准控枪训练
```

---

### Streak

例如：

```text
🔥 6 Days
```

---

### Weekly Training

例如：

```text
4 / 7 Days
```

---

### Today's Training

显示：

```text
TODAY'S TRAINING

18 / 27 分钟
```

下面展示训练任务。

---

# 15. 训练任务卡

每个训练任务必须包含：

- 名称
- 训练目的
- 预计时间
- 简短说明
- 完成状态
- 完成按钮

例如：

```text
微调训练

Improve small corrective mouse movements.

7 分钟

[Complete]
```

点击 Complete：

- 当前任务标记完成
- 更新今日训练进度
- 数据必须持久化

刷新网页后不得恢复为未完成。

---

# 16. 每日训练完成

所有任务完成后出现：

**Complete Today's Training**

点击后：

创建当天 Check-in。

必须防止：

同一个用户同一天重复创建多个 Check-in。

---

# 17. Streak

Streak 必须根据真实 Check-in 数据计算。

例如：

```text
Sep 15 ✅
Sep 16 ✅
Sep 17 ✅
Sep 18 ✅
```

显示：

```text
🔥 4 Days
```

如果 Sep 17 没完成：

Sep 18 完成后：

```text
🔥 1 Day
```

不能使用静态数字。

---

# 18. History

路径：

`/history`

需要显示：

- 最近训练记录
- 当前 streak
- 最长 streak
- 累计训练天数
- 累计训练分钟

例如：

```text
Monday     ✅
Tuesday    ✅
Wednesday  ❌
Thursday   ✅
Friday     ✅
```

第一版不需要复杂图表。

---

# 19. Profile

保存：

- Rank
- Role
- Daily training time
- Weaknesses
- Current training plan

允许用户后续重新测评。

---

# 20. 页面结构

v0.1：

```text
/
│
├── /assessment
│
├── /dashboard
│
├── /history
│
└── /profile
```

手机端建议底部导航：

```text
Home
Train
History
Profile
```

如果 Dashboard 与 Train 暂时没有必要拆分，可在 v0.1 合并。

优先保持简单。

---

# 21. UI 设计原则

整体：

- Dark Mode
- FPS / 电竞感
- 简洁
- 手机优先
- 信息层级明显
- 不像企业后台
- 不像任务管理工具

避免：

- 大量渐变
- 过度霓虹
- 复杂动画
- 过多卡片
- 巨量数据
- UI 视觉噪音

---

# 22. 品牌与版权原则

VT 是独立玩家工具。

不得直接复制：

- Riot Logo
- VALORANT Logo
- 官方角色插画
- 官方 UI
- 官方受版权保护视觉资产

未来公开发布时，应明确：

VT 为独立第三方玩家工具，与 Riot Games 无官方关联。

---

# 23. 技术架构

当前技术方案：

## Frontend

Next.js  
TypeScript  
App Router  
Tailwind CSS

可使用：

shadcn/ui

---

## Backend

Supabase

负责：

- Auth
- Database
- 用户数据
- Training data
- Check-ins

---

# 24. 数据库初步结构

## profiles

```text
id
rank
role
daily_training_minutes
weaknesses
selected_plan
created_at
updated_at
```

---

## training_plans

```text
id
name
description
target
created_at
```

---

## training_tasks

```text
id
plan_id
name
description
duration_minutes
sort_order
```

---

## daily_progress

```text
id
user_id
date
task_id
completed
completed_at
```

---

## checkins

```text
id
user_id
date
plan_id
completed_tasks
total_tasks
total_minutes
created_at
```

---

# 25. Auth

优先：

Supabase Auth。

MVP 支持：

- Email + Password

或者：

- Magic Link

暂时不做：

- Riot Login
- Discord Login
- Google Login
- 微信登录

---

# 26. 安全要求

Supabase 必须检查：

- RLS
- 用户只能查看自己的数据
- 用户不能修改其他人的记录
- Service Role Key 不得出现在前端
- 敏感环境变量不得提交 Git
- 用户输入必须进行基本验证

代码 Review 时必须重点检查这一部分。

---

# 27. v0.1 验收流程

标准测试用户：

```text
Rank:
Gold

Role:
Duelist

Training time:
20 分钟

Weakness:
拉枪容易拉过
```

系统必须推荐：

**微调与精准控枪训练**

然后：

```text
Assessment
↓
Dashboard
↓
显示今日训练
↓
完成所有任务
↓
完成今日训练
↓
创建 Check-in
↓
History 出现记录
↓
Dashboard 显示 🔥 1 Day
```

刷新网页：

数据不能丢失。

第二天再次打卡：

```text
🔥 2 Days
```

只有整个流程完整跑通，v0.1 才算完成。

---

# 28. v0.2：比赛数据

v0.1 完成之后开始研究。

核心目标：

让 VT 获得用户真实比赛表现。

优先研究路线：

### Route A

掌瓦截图上传

### Route B

用户手动输入

### Route C

第三方 API

### Route D

官方 API

正式产品不能默认依赖未经授权的掌瓦接口抓取。

---

# 29. 未来比赛数据结构

未来可能记录：

```text
rank
rr
wins
losses
kills
deaths
assists
kd
adr
hs_percentage
agent
map
match_date
```

实际字段以后根据可靠数据源调整。

不要为了数据多而收集数据。

原则：

**只有能支持分析的数据才值得保存。**

---

# 30. v0.3：AI Performance Review

未来 AI 不负责简单聊天。

主要任务：

分析：

- 最近表现趋势
- 哪些指标改善
- 哪些指标下降
- 哪些问题长期存在
- 训练行为与比赛表现是否存在趋势关联

例如：

```text
过去两周：

HS%
19% → 24%

ADR
132 → 147

KD
0.91 → 1.03
```

同时：

```text
微调训练
完成 9 次
```

AI 可以表达：

微调训练期间，爆头表现和 ADR 同时出现上升趋势。

禁止直接表达：

“因为练了 微调训练，所以 HS% 上升。”

除非有足够证据证明因果。

AI 应区分：

**相关性 ≠ 因果关系。**

---

# 31. v0.4：Adaptive Training

最终 AI Coach 根据：

```text
训练记录
+
比赛数据
+
时间趋势
```

调整下一阶段训练。

例如：

```text
上周期：

微调训练 40%
Movement 20%
Crosshair Placement 20%
乱斗 20%
```

分析发现：

Aim 明显改善。

Movement 仍然较弱。

新计划：

```text
微调训练 20%
Movement 40%
Crosshair Placement 20%
乱斗 20%
```

此时 VT 才真正接近：

**Personal Training Coach**

---

# 32. Roadmap

## v0.1

Training Foundation

- Assessment
- Plan Recommendation
- Daily Training
- Check-in
- Streak
- History
- Profile

---

## v0.2

Performance Data

- 数据输入
- 掌瓦截图方案验证
- 历史表现数据
- 基础趋势

---

## v0.3

AI Review

- Weekly Review
- Performance Analysis
- Weakness Detection
- Training Suggestions

---

## v0.4

Adaptive Coaching

- 自动调整训练计划
- 阶段训练目标
- 个性化训练周期

---

# 33. 产品决策原则

以后提出任何新功能，必须回答：

### 1.

这个功能解决哪个用户问题？

### 2.

它加强了以下哪一项？

- 今天练什么
- 有没有进步
- 下一步练什么

### 3.

用户现有工具是不是已经解决得很好？

例如：

掌瓦已经擅长战绩查询。

VT 没必要重新开发低价值替代品。

### 4.

它是不是当前版本必须完成？

如果不是：

进入 ROADMAP。

### 5.

会不会影响核心闭环开发？

如果会：

优先延期。

---

# 34. 当前 North Star

VT 当前最重要的一句话：

> 帮助 VALORANT 玩家知道自己该练什么、有没有进步，以及下一步应该怎么练。

当前 v0.1：

> 先验证玩家愿不愿意持续按照 VT 的训练计划进行训练。

未来：

> 用真实比赛数据证明训练是否产生了有效变化，并通过 AI 持续调整训练计划。

---

# 35. Codex 开发原则

Codex 在修改 VT 项目前必须遵守：

1. 阅读本 PRD
2. 不自行增加产品功能
3. 新功能如果不属于当前版本，先提出而不是直接实现
4. 涉及架构变化时先输出 Plan
5. 涉及数据库变化时说明 Migration
6. 每次修改完成后运行 lint
7. 运行 TypeScript 检查
8. 运行 build
9. 报告修改文件
10. 报告已知问题
11. 不为了展示技术复杂度而过度设计
12. v0.1 优先保证核心流程稳定

如果实现与 PRD 冲突：

**PRD 优先。**

---

# 36. 当前最高优先级

当前项目已有初版。

下一阶段不是增加新功能。

顺序：

```text
已有初版
↓
按照 PRD 审查当前页面
↓
找出与 PRD 不一致部分
↓
确定 UI 原型
↓
修正现有 v0.1
↓
跑通 Supabase 数据
↓
完整测试核心流程
↓
Code Review
↓
部署测试版
↓
找真实玩家使用
```

在 v0.1 核心闭环跑通之前，不进入 v0.2。
