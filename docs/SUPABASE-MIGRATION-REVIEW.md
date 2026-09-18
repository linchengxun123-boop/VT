# VT-dev migration 执行前确认清单

检查日期：2026-09-18。目标：已在控制台核对名称的 **VT-dev**，且本地配置指向该项目。本文不包含项目连接值或凭据。

## 当前远端状态

- 控制台显示项目 Healthy，public schema 显示 No tables or views。
- 控制台显示 No migrations。
- 使用应用采用的 Supabase SDK，对下列五张表执行不返回数据的 GET 查询，均收到 HTTP 404 / PGRST205。HEAD 请求结果未用于判断表是否存在。
- 本轮尚未执行任何远端 migration，也未创建测试用户或训练记录。

## 待批准执行范围

按顺序执行仓库中的 `supabase/migrations/001_initial.sql` 和 `supabase/migrations/002_training_copy.sql`。001 适用于空业务库，不能重复执行；002 为可重复执行的文案更新。每个脚本有独立事务。

### 新建五张 public 表

| 表             | 字段                                                                                | 主键 / 关联 / 业务约束                                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| training_plans | id、name、description、target、created_at                                           | 文本主键 id，只允许 A/B/C                                                                                                                                    |
| training_tasks | id、plan_id、name、description、duration_minutes、sort_order                        | 文本主键 id；plan_id → training_plans；duration_minutes > 0；同一计划内 sort_order 唯一                                                                      |
| profiles       | id、rank、role、daily_training_minutes、weaknesses、selected_plan、created_at       | UUID 主键 id → auth.users，删除认证用户时级联删除；selected_plan → training_plans；rank/role 限定选项；分钟预算仅 10/20/30/45；weaknesses 仅允许八个既有弱项 |
| daily_progress | id、user_id、date、task_id、completed、completed_at                                 | UUID 主键；user_id → profiles，级联删除；task_id → training_tasks；(user_id,date,task_id) 唯一                                                               |
| checkins       | id、user_id、date、plan_id、completed_tasks、total_tasks、total_minutes、created_at | UUID 主键；user_id → profiles，级联删除；plan_id → training_plans；(user_id,date) 唯一；任务总数、总分钟数 > 0；完成数必须等于任务总数                       |

所有字段均为 NOT NULL，只有 daily_progress.completed_at 允许空值。created_at 默认服务器时间；daily_progress/checkins.id 默认随机 UUID；completed 默认 false；weaknesses 默认空数组。不会修改 Supabase 内置 auth.users 表结构，只建立外键引用。

### 索引

- 五个主键索引：training_plans_pkey、training_tasks_pkey、profiles_pkey、daily_progress_pkey、checkins_pkey。
- 三个唯一索引：training_tasks(plan_id,sort_order)、daily_progress(user_id,date,task_id)、checkins(user_id,date)。
- 一个显式历史查询索引：checkins_user_date，列为 (user_id,date DESC)。

共九个索引；其中八个随主键 / 唯一约束自动建立。外键共七个，另有上述 CHECK 与 NOT NULL 约束。

### RLS policy

五张表全部启用 RLS。以下 policy 均仅针对 authenticated 角色的 SELECT：

| 表             | Policy 名称  | 可读取范围           |
| -------------- | ------------ | -------------------- |
| training_plans | read plans   | 所有训练计划         |
| training_tasks | read tasks   | 所有训练任务         |
| profiles       | own profile  | auth.uid() = id      |
| daily_progress | own progress | auth.uid() = user_id |
| checkins       | own checkins | auth.uid() = user_id |

### 写入函数与权限

- 建立 `public.vt_action(text,jsonb)`，SECURITY DEFINER，固定空 search_path，仅 authenticated 可执行；撤销 PUBLIC 与 anon 的函数执行权限。已移除时区参数，不保留三参数重载。
- 撤销 anon/authenticated 对五张表的现有权限，再仅授予 authenticated SELECT；不提供普通客户端直接 INSERT/UPDATE/DELETE 权限或相关 RLS policy。
- 写入必须经过 vt_action。函数从 auth.uid() 获取用户身份，使用服务器时间固定按 Asia/Shanghai 自然日确定日期，为同一用户串行处理写入；校验测评、当前计划、任务完成条件；重复打卡幂等；打卡后锁定当日任务。payload 中的日期或时区不参与业务日期计算。
- 不更改项目认证提供方、密钥、邮箱确认开关或项目访问成员。

### 种子数据与 002 文案更新

- 001 插入三套固定计划及十个任务。
- 002 更新 Plan C 名称，以及 a-dm、c-dm、b-guardian、c-micro 的显示名称；同时更新 b-guardian 描述。
- 002 不变更 ID、时长、任务顺序、表结构或用户记录。

## 执行后检查

首先检查表、列、约束、索引、RLS policy、权限和种子数据，再依用户要求继续 Email + Password Auth、测试用户 A/B、测评、任务进度、打卡、历史、连续天数及用户隔离验证。

**当前状态：等待用户批准以上 migration 范围，尚未执行。** 这是用户第 4 步明确要求的确认节点。
