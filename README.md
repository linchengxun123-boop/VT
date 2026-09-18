# VT v0.1

面向 VALORANT 玩家的每日练枪打卡 Web MVP。核心流程：**测评 → 推荐计划 → 完成任务 → 打卡 → 查看连续天数与历史**。

## 本地启动

需要 **Node.js 24 或更新版本**（本地数据库使用 Node 内置 SQLite）。本目录已安装依赖。

```powershell
cd E:\UserData\linky\VT
npm install
npm run dev
```

打开 http://127.0.0.1:3000 。默认无需配置环境变量、无需注册。

生产构建与启动：

```powershell
npm run build
npm run start
```

开发与生产服务使用同一默认端口，请先停止原来的服务，或通过 `-- --port 3001` 指定另一个端口。

## 已实现

- `/`：首次进入首页；已完成测评的玩家自动进入 Dashboard。
- `/assessment`：9 个段位、4 个位置、4 档每日时间、8 个可多选弱项；提交后展示推荐理由和计划预览。
- `/dashboard`：当前段位、训练计划、每日任务、训练说明、完成/撤销、打卡、连续天数和本周完成情况。
- `/history`：默认过去 14 天的逐日记录；支持加载更早的历史；累计天数、累计计划时长、当前/最长连续训练。
- `/profile`：档案、训练偏好、重新测评、存储方式说明；云端模式支持退出登录。
- `/login`：Supabase Email + Password 注册、邮箱确认和登录。
- `/api/training`：有校验的读取、测评保存、任务状态与打卡接口。
- 原创 VT 字标、抽象瞄准图形、深色界面、手机底部导航；未使用 Riot / VALORANT 官方素材。

## 技术与目录

Next.js 16 App Router、React 19、TypeScript、Tailwind CSS 4、语义 CSS 变量、Lucide 图标、Zod、Supabase JS。未引入复杂状态库、Docker 或微服务；基础控件使用原生 HTML，无需 shadcn/ui。

```text
VT/
├─ src/
│  ├─ app/                    # 首页、测评、训练、历史、档案、登录和 API
│  ├─ components/             # 页面外壳、导航、训练状态、周记录
│  └─ lib/
│     ├─ domain.ts            # 数据类型与输入校验
│     ├─ plans.ts             # 三套固定计划与时间分配
│     ├─ recommendation.ts    # 独立推荐规则
│     ├─ streak.ts            # 独立日期、连续天数和本周统计
│     ├─ supabase-browser.ts  # 邮箱认证客户端
│     └─ server/
│        ├─ repository.ts     # 统一访问接口与身份验证
│        └─ local-store.ts    # 真实 SQLite 存储
├─ supabase/migrations/      # 001 建表；002 仅更新训练文案
├─ tests/                    # 业务规则、两天数据库流程、SQL 权限、浏览器验收
├─ artifacts/qa/             # 浏览器验收截图（不提交版本库）
├─ data/                     # 本地数据库，首次运行自动建立（不提交版本库）
├─ .env.example
└─ playwright.config.ts
```

## 两种数据模式

### 默认本地模式

没有提供 Supabase 项目凭据时，先把完整产品流程跑通。数据写入 **`data/vt.sqlite`**，并非页面假数据，也不依赖 localStorage 保存训练记录。

每个浏览器使用独立的随机访客身份，通过 HttpOnly、SameSite Cookie 识别。刷新页面和重启服务不会丢失记录；清除 Cookie 或更换浏览器会进入新档案。SQLite 文件需要持久保存，不适合无持久磁盘的 Serverless 部署。线上多用户版本请切换 Supabase。

可用 `VT_DB_PATH` 覆盖 SQLite 路径。不要把数据库文件、Cookie 或 `.env.local` 提交到公开仓库。

### Supabase 模式

1. 新建 Supabase 项目，在 **SQL Editor** 中完整执行一次 [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql)。脚本适用于新数据库，不要重复执行。随后执行 [`002_training_copy.sql`](supabase/migrations/002_training_copy.sql)。已有数据库仅执行 002；该迁移可重复执行，只改名称和描述，不改任务 ID、时长或用户记录。
2. 在 Authentication 配置中启用 **Email + Password**。建议保留邮箱确认。
3. 设置 **Site URL** 为 `http://127.0.0.1:3000`，允许重定向到 `http://127.0.0.1:3000/login`。若使用 localhost、其他端口或生产域名，同时配置对应地址。
4. 将 `.env.example` 复制为 `.env.local` 并填写：

```dotenv
NEXT_PUBLIC_DATA_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的公开anon或publishable密钥
```

5. 重启开发服务。生产模式修改 `NEXT_PUBLIC_*` 变量后，需要重新 `npm run build`。
6. 打开首页，跳转登录页后注册，确认邮箱并登录，再进行测评。

**不需要也不要填写 service_role / secret key。** 服务端验证用户 access token，数据库使用 RLS 按用户隔离。浏览器和服务端使用的均为公开项目密钥，数据库权限才是数据隔离边界。

认证实现参考 [Supabase 密码登录文档](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)，用户数据隔离参考 [官方 RLS 文档](https://supabase.com/docs/guides/database/postgres/row-level-security)。

本地访客记录目前不自动迁移到新注册的 Supabase 账号。切换模式不会删除 SQLite 文件。

## 数据结构与安全约束

保留需求中的五张表：`profiles`、`training_plans`、`training_tasks`、`daily_progress`、`checkins`。SQL 同时包含三套计划和全部任务的种子数据。

- `profiles.id` 关联 Supabase Auth 用户。
- `daily_progress` 对 `(user_id, date, task_id)` 唯一，`checkins` 对 `(user_id, date)` 唯一。
- 打卡保存用户、日期、计划、完成数、总任务数、总计划分钟数和创建时间。
- SQL 函数 `vt_action` 重新计算推荐结果、核验当前计划和所有任务是否完成；客户端不能伪造打卡统计。
- 数据表启用 RLS，普通用户只能读取自己的档案和记录。所有写入都经受控事务函数完成，客户端无法直接改表绕过约束。
- 同一用户的云端写入使用事务锁；本地使用 SQLite 写事务。重复打卡保持幂等。
- 完成任意任务后，当天不允许换计划；撤销全部任务且未打卡时可以重新测评。打卡后当天任务被锁定，次日可调整，历史记录保留原计划与时长。
- 当前界面从本地 `plans.ts` 读取固定训练内容，数据库任务种子用于核验。修改任务 ID 或计划时需同步更新两处；这是固定三套计划 MVP 的明确约定。

## 推荐、时长和日期规则

推荐函数独立于 UI：

1. 拉枪容易拉过或远距离对枪差 → **Plan C / 微调与精准控枪训练**。
2. 预瞄差、爆头率低或第一枪不准 → **Plan B**。
3. 其余情况 → **Plan A**，包括没有专项问题的 Iron / Bronze / Silver。高段位无匹配问题时同样以基础计划兜底。

优先级为 **C > B > A**。段位和位置保存到档案；这一版不额外按位置添加训练分支。

原始训练配比：A 与 B 为 5/5/10，C 为 5/7/5/10 分钟。按用户的 10/20/30/45 分钟预算等比分配并按最大余数法取整，保证总和严格一致。例如 **C + 20 分钟 = 4 + 5 + 4 + 7 分钟**。任务说明中的乱斗与 100 Bots 都可以在分配时间到时结束。

记录的分钟数是**计划时长**，不是实际计时；完成状态由玩家手动确认，不验证游戏内行为。

日期由服务器当前时间结合浏览器 IANA 时区计算，不接受客户端任意日期。本周从周一开始。今天未打卡但昨天已打卡时，保留当前连续天数；昨天和今天均未打卡则归零。跨年、闰日、重复记录都被覆盖。页面聚焦或每分钟刷新数据，跨日后展示新任务；已开页面跨午夜点击时，服务器仍以新日期校验。

## 验证

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

业务测试包含推荐优先级、全部时间预算、断签/跨年/闰日/时区、非法输入，以及真实 SQLite 文件的重开读取和连续两天打卡。

Supabase SQL 在本地 PGlite PostgreSQL 引擎中实际执行，模拟 Auth 身份检查 RPC、幂等、RLS 用户隔离及直接写入拒绝。它不能替代真实 Supabase 项目的邮件投递与认证联调。

Playwright 在 Windows 默认使用已安装的 Microsoft Edge；其他平台默认 Chromium（需要 `npx playwright install chromium`）。也可设置 `PLAYWRIGHT_CHANNEL=chrome` 使用 Chrome。测试自动启动独立的 3100 端口服务，使用 `data/vt-e2e.sqlite`，不修改正常体验的数据库。

本轮完整结果、截图和未验证事项见 [`docs/V0.1-ACCEPTANCE.md`](docs/V0.1-ACCEPTANCE.md)。

`tsc` 使用 TypeScript 7；ESLint 通过官方 TypeScript 6 兼容包读取编译器 API，兼容配置参考 [TypeScript 官方说明](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0)。

浏览器验收覆盖：

- Gold / Duelist / 20 分钟 / 拉枪容易拉过 → Plan C。
- 逐个完成任务，刷新后保留状态，打卡后出现历史和连续训练 1 天。
- 重复打卡仅保留一条记录、新浏览器隔离、拒绝非法输入和跨来源请求。
- 首页、测评、Dashboard、历史与档案在 375 / 390 / 430 像素和桌面下无横向溢出；无浏览器运行错误。

## 已知限制

- 尚未提供实际 Supabase 凭据，因此真实云端注册、邮件投递、登录与远端持久化尚未实测。默认本地完整流程可用，建表 SQL 已由本地 PostgreSQL 引擎验证。
- 访客身份依赖 Cookie，没有账号恢复、跨浏览器同步或访客数据迁移。Supabase 模式暂未提供找回密码界面。
- 训练依赖手动确认，计划分钟数不代表游戏内真实训练时长。没有 Riot、Aimlabs 或 AI API。
- 时区随当前浏览器，跨时区旅行可能改变日期归属；无反作弊或防时区切换策略。
- 云端历史当前单次读取，受 Supabase 默认返回条数限制（一般为 1000）；长期使用时应增加服务端分页。
- 尚未上线公开域名，也未接入通知、付费、社区或复杂统计。

## 下一版最值得增加的三个功能

1. **任务计时与实际时长记录**：帮助玩家按时练完，也能区分计划与实际投入。
2. **训练后 10 秒反馈**：记录手感、难度、主要问题，判断训练计划是否合适。
3. **留存与中断统计**：统计测评→首练→次日/7日回访，定位玩家在哪一步退出，直接验证“是否愿意持续训练”。
