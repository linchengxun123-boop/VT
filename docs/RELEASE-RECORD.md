# VT v0.1 远端联调版本记录

归档标识：`vt-v0.1-vt-dev-verified-2026-09-18`。本文件记录联调证据对应的代码与数据库脚本，不表示已经部署到外部测试网址。

## 代码版本

- 远端联调所用应用代码基线：`ea5f874438e5c7b101da3793a8ecdecbcb9a7bf7`。
- 应用源码 `src` 的 Git tree：`ba42bfcaf9ca893b3333fa636d8c54644f1ca3aa`。
- `package-lock.json` 的 Git blob：`57921d83eab0a95c8cf0da5a2a0d80f284a53f50`。
- 本次归档不改应用代码、UI 或依赖，保留最终 production build 自动生成的 `next-env.d.ts` 路由类型引用；该文件的变化是 `.next/dev/types` 到 `.next/types`。
- 本次归档提交同时保存最终联调报告、脱敏证据、部署 Plan 和本版本记录。归档提交的实际 SHA 可用 `git log -1 --format=%H -- docs/RELEASE-RECORD.md` 定位；实际部署时锁定该提交，并另记平台 Deployment ID。

## 已应用的迁移版本

目标仅为 VT-dev，应用顺序为 001 → 002。本轮部署准备不再次执行 SQL，也不在构建脚本中加入数据库迁移。

| 文件                                        | 状态             | SHA-256（UTF-8，CRLF 统一为 LF 后计算）                            |
| ------------------------------------------- | ---------------- | ------------------------------------------------------------------ |
| `supabase/migrations/001_initial.sql`       | 已在 VT-dev 应用 | `b306d53bca3e904b30def8f0d4d1773eff1ab909dc9577266e1cdc3d32174fd1` |
| `supabase/migrations/002_training_copy.sql` | 已在 VT-dev 应用 | `93f455460a1b9ce2587ecbb127ec157d876a77c66833975c4142e0171c008c08` |

两份文件均与代码基线一致。001 不可重复执行。远端函数正文去除 CR 后的 MD5 为 `486d34dead3e389bfba0865f60765102`，与此版 001 中的函数正文一致。迁移通过 Supabase SQL Editor 执行；不以 CLI migration history 是否登记替代实际结构和函数核验。

## 验证证据版本

| 文件                                | 结果                                  | SHA-256（原始字节）                                                |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------------------------ |
| `docs/qa/vt-dev-before-resume.json` | 91 项通过、0 项失败；B 今日恢复打卡前 | `f633d6c8d234c23386d2522406d60facf94c8e7ceae6093c81c5b3fda64f872b` |
| `docs/qa/vt-dev-final.json`         | 99 项通过、0 项失败；B 今日恢复打卡后 | `6194cb5365191fbf2a5d6d7bdab631bd75353d031673389e8e6efab315cf2105` |

两份 JSON 从被忽略的 `artifacts/qa/remote-probe-before-resume.json` 和 `artifacts/qa/remote-probe-after-resume.json` 逐字节复制，经脱敏审查后随本提交保存。最终联调报告内的临时证据路径按此表映射到长期归档文件；临时验证服务代码不提交。

完整解释见 `docs/SUPABASE-INTEGRATION-REPORT.md`。以上是实际远端验证结果；上一轮最终本地检查另为 TypeScript、lint、15 项测试、10 项 E2E 和 production build 全部通过。本轮仅归档与制定 Plan，没有以文档整理冒充重新运行测试。

自然午夜跨日、自然连续多日观察仍为**未验证**。部署后的真实网址验收和封闭试用安排见 `docs/DEPLOYMENT-PLAN.md`，目前尚未执行。

## 脱敏与范围

`.env.local` 及其他真实环境文件保持忽略；不提交本地数据库、浏览器会话、临时验证程序、原始网络记录或凭据。归档证据只保留匿名 A/B 代号、日期、计数和断言，没有真实邮箱、测试账号 UUID 或用户个人信息。测试源码中的固定合成 UUID 不是远端账号标识。

真实环境变量值、项目连接地址、密码和访问令牌不记录在本文件或归档报告。代码中仅保留配置名称、合法模式常量和合成测试数据。当前 Git 提交只保存在本地；远端代码上传、部署、付费、Auth 配置变更和数据库操作都须等待用户确认。
