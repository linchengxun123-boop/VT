# VT v0.1 migration 最终安全复核

> 本文保留修复前的审查记录。客户端可控时区已在本地代码与 001 中修复；当前结论以 [时区修复与复核报告](TIMEZONE-FIX-VERIFICATION.md) 为准。远端 migration 仍未执行。

日期：2026-09-18。范围：001_initial.sql、002_training_copy.sql 及与日期有关的应用调用链。

**总体结论：需要修改后再执行。** 发现一个已本地复现的阻塞问题：日期归属接受调用者指定的时区，允许同一用户在同一绝对时刻生成两个不同日期的 checkin。未发现本次复核范围内的跨用户数据访问或普通客户端直接写表通道。

本轮未访问或修改远端数据库，未执行远端 migration，未修改两份 SQL 或应用实现。验证仅使用隔离的内存 PostgreSQL（PGlite）、模拟 Auth 身份和合成数据；没有读取环境文件或使用真实凭据。

## 逐项结果

| 项目                     | 结论                           | 依据及边界                                                                                                                                                                                                                                         |
| ------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. 所有业务表启用 RLS    | 通过                           | 001 第 66–70 行对五张表全部 ENABLE ROW LEVEL SECURITY；本地查询 pg_class 核实五个标记均为 true。                                                                                                                                                   |
| 2. 本人数据隔离          | 通过                           | profiles 使用 auth.uid() = id，因为该表没有 user_id 列；daily_progress/checkins 使用 auth.uid() = user_id。A 查询 B 的三类数据全部返回空；伪造 payload 中的 id/user_id 不会改变实际写入身份。                                                      |
| 3. 计划与任务客户端只读  | 通过                           | authenticated 只有 SELECT 权限与 read plans/read tasks 策略；普通用户不能修改种子数据，anon 无表访问权。                                                                                                                                           |
| 4. 不允许直接写表        | 通过（本地权限模型）           | 撤销 anon/authenticated 的表权限后仅向 authenticated 授予 SELECT。两种角色、五张表、三种写操作，共 30 次 INSERT/UPDATE/DELETE 均被权限层拒绝；另核实无 TRUNCATE/REFERENCES/TRIGGER 权限。                                                          |
| 5. SECURITY DEFINER 边界 | 通过                           | auth.uid() 为空立即拒绝；search_path 固定为空；关系与 Auth 函数使用明确 schema；身份来自 v_user，不读取 payload.user_id；无动态 SQL；只允许 authenticated 执行，PUBLIC/anon 无函数执行权。不需要客户端持有高权限凭据。                             |
| 6. 全部任务完成才能打卡  | 通过                           | 函数按当前计划重新统计任务总数，再统计本人、当天、当前计划的已完成任务；总数为零或数量不等即拒绝。伪造完成数、计划与日期均不能跳过检查。                                                                                                           |
| 7. checkin 日期唯一      | 约束通过，日期来源需修正       | UNIQUE(user_id,date) 存在；即便表所有者直接插入重复记录也报 23505；重复 RPC 幂等。但该约束无法阻止调用者用不同时区取得不同 date。                                                                                                                  |
| 8. daily_progress 唯一   | 通过                           | UNIQUE(user_id,date,task_id) 存在；直接重复插入报 23505，正常 RPC 使用 ON CONFLICT 更新状态。                                                                                                                                                      |
| 9. 日期与 streak 时区    | 需要修改，阻塞执行             | 默认值虽为 Asia/Shanghai，但浏览器传递自身时区，API 信任 x-timezone，再传给 p_timezone。函数直接接受客户端时区，未固定中国自然日。详见下文。                                                                                                       |
| 10. 事务及回滚           | 通过，有执行边界               | 两份脚本各有 BEGIN/COMMIT。在提交前人为注入错误，001 的表、种子、函数全部回滚；002 的更新全部回滚。失败后执行 ROLLBACK 清理失败事务。两份文件不是一个共同事务：001 已提交后，002 失败不会撤销 001。                                                |
| 11. 删除或覆盖操作       | 无破坏性清表，有明确的覆盖行为 | 无 DROP TABLE、TRUNCATE、DELETE 语句。002 按固定 ID 覆盖一条计划名称、四条任务名称及其中一条描述；不改用户数据、时长或 ID。001 的 CREATE OR REPLACE FUNCTION 会替换同签名函数；函数内 UPSERT 是日后 RPC 调用的预期行为，不是在迁移时修改用户数据。 |
| 12. 重复 seed            | 不会重复，但 001 非幂等        | 首次为三套计划、十个任务，ID 有主键保护。完整重跑 001 在第一张已存在的表处报 42P07，回滚后原数据不变；不能把这个失败称为可安全重复执行。002 可重复执行，第二次结果不变。                                                                           |
| 13. 凭据保护             | 通过                           | 本轮审查和本地验证没有加载 .env.local，也未输出 Secret、Service Role、密码或任何真实配置值。                                                                                                                                                       |

### 权限结论的适用范围

这里的“本人可访问”针对经 Supabase 验证 JWT 后映射到 anon/authenticated 的普通客户端，不包括数据库所有者、超级用户或 BYPASSRLS 角色。SECURITY DEFINER 按函数所有者权限运行，因此必须单独审计函数体，不能仅凭 RLS 标记判断写入安全。参见 [PostgreSQL 行安全说明](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) 和 [安全的 SECURITY DEFINER 函数](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)。

本地权限验证基于新建普通角色，不代替目标项目的实际角色继承、默认权限和其他既有 RPC 检查。当前脚本撤销的是 anon/authenticated 的直接表权限，没有显式撤销可能由自定义默认权限授予 PUBLIC 的表权限；标准新库下本地有效权限检查通过。执行前后仍应核实目标库的有效 ACL，没有依据把未实测的远端权限记为通过。

另有 ON DELETE CASCADE：未来若管理员删除认证用户，会级联删除其档案、任务进度与打卡。这不是迁移期间的删除操作，也不能由当前普通用户权限触发。

## 为什么五条 RLS policy 足够，又不能代表全部安全

本项目采用“客户端只读表，写入统一走 RPC”的权限设计：

1. 两条 SELECT policy 允许已登录用户读取公共训练内容。
2. 三条 SELECT policy 限制档案、任务进度和打卡只能读取本人记录。
3. 普通客户端没有表级 INSERT/UPDATE/DELETE 权限，也没有相应的写入 policy；直接写表在权限层被拒绝。
4. vt_action 提供有限的受控写入能力，实际用户身份固定来自 auth.uid()，不把一般数据库所有者权限授予调用者。

因此，**五条 SELECT policy 对当前直接访问模型是足够的**；无需为了凑齐 CRUD 再增加写 policy。RLS 启用后，没有匹配策略的普通行操作默认拒绝；表所有者与 BYPASSRLS 角色是例外。[PostgreSQL 官方文档](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

但 **五条 policy 不足以独自保证整个业务安全**：函数拥有独立的高权限执行路径，身份过滤、任务完成校验、日期计算、唯一约束和函数执行权限仍必须正确。本次时区问题就发生在函数内部，增加更多 RLS policy 无法修复它。

## 阻塞问题：日期可由调用者切换

位置：001 第 79、91 行；src/lib/server/repository.ts 第 18、73 行；src/components/training-provider.tsx 第 50 行。

### 当前行为

- 浏览器把系统 IANA 时区发到 x-timezone；API 在未收到该值时才使用 Asia/Shanghai。
- 数据库使用 `(now() at time zone p_timezone)::date`。即使数据库基础时区为 UTC，传入 Asia/Shanghai 时也会得到正确的中国日期。
- 但已登录用户可直接调用 RPC 传其他有效时区，或更改请求头。默认参数不是强制限制。
- streak 根据保存的 date 和服务端计算的 today 统计，今天未打卡但昨天已打卡时保留连续天数，今天和昨天均未打卡才归零。shiftDate 使用 UTC 中午做纯日期加减，并不是按 UTC 自然日打卡；问题在 date/today 的业务时区可变。

### 本地复现

在同一个数据库事务中，now() 保持同一时刻。测试用户先后按 UTC−12 与 UTC+14 的日期完成所有任务并打卡，结果为：

| checkin 数量 | 不同 date 数量 | 不同 created_at 时刻数量 |
| ------------ | -------------- | ------------------------ |
| 2            | 2              | 1                        |

这不是跨用户越权，也没有突破复合唯一约束；它证明调用者可以改变“一天”的归属。同一个中国自然日内可以写入多个日期的记录，继而影响 streak，也可能绕过按日期判断的当日锁定。

### 执行前建议修改

针对当前面向国内用户的 v0.1：数据库固定以 Asia/Shanghai 计算业务日期；删除 p_timezone 参数，或对任何不同于 Asia/Shanghai（包括空值）的参数明确拒绝。API 读取 today 与写入使用相同固定时区，不再信任客户端 x-timezone 来决定业务日期。

只修改前端请求头或 API 不够，因为 authenticated 本就有权直接调用 vt_action。数据库边界必须同时修正。补充中国午夜前后，以及跨时区参数不能制造额外日期的回归测试后再申请执行 migration。

## 最终分类

- **可以安全执行：** 002 的定向文案更新本身通过审查，但必须在所需表已创建、并获得执行批准之后运行；当前空库不能单独执行 002。
- **需要修改后再执行：** 001 及应用日期调用链，先统一中国自然日，避免调用者切换日期。
- **阻塞问题：** 已复现的客户端可控时区。远端 migration 继续保持未执行；此前的确认清单不应被视为当前版本已获安全放行。

## 验证证据

- [本轮可重复运行的本地审计脚本](../artifacts/qa/migration-safety-audit.mjs)
- [本地审计结果](../artifacts/qa/migration-safety-audit.json)：九组检查通过，一项时区问题复现。
- 另运行 `npx tsx --test tests/domain.test.ts tests/supabase.test.ts`，六项现有测试全部通过；这些现有测试通过不能抵消本轮发现的时区问题。

未做真实 Supabase Auth、远端 RLS 或远端并发验证，不将这些项目列为通过。
