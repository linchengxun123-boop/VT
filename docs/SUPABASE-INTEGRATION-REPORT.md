# VT-dev 真实 Supabase 联调进度

日期：2026-09-18。当前执行至第 4 步，等待 migration 确认。本文是阶段报告，不是最终验收通过证明。

## 已通过

1. `npm run build` 成功，读取 .env.local；已重启本地 3000 端口服务。此前运行的是 next start，本轮保留该启动方式并加载新构建。
2. 实际浏览器访问 Dashboard 跳转到登录页，显示邮箱及密码输入框；未登录训练接口返回 HTTP 401，浏览器运行错误为 0，确认应用已启用云端模式。
3. 本地配置与控制台 **VT-dev** 项目匹配；控制台显示 Healthy；远端 Auth 服务对配置检查请求返回 HTTP 200。数据库 API 可连接，并能返回结构化的表不存在错误。
4. 完成远端 migration 状态检查：控制台无 migration 记录，public schema 没有表，五张业务表的 SDK GET 查询均为 HTTP 404 / PGRST205。

## 未通过

- **远端数据库就绪检查未通过**：training_plans、training_tasks、profiles、daily_progress、checkins 尚未创建，当前不能执行真实训练数据流程。

## 未验证

- migration 执行及执行后的结构、权限与种子数据核验。
- Email + Password 实际注册、登录、会话恢复和退出；显示登录表单与 Auth 服务可连接不等于认证全流程已验证。
- 测试用户 A/B 创建。
- Assessment 云端写入、Dashboard 读取本人数据。
- daily_progress 保存与刷新恢复。
- checkin 创建、同用户同日去重、History 读取。
- 真实云端数据下的连续 / 断签 streak。
- 真实测试用户 A/B 的 RLS 读取和修改隔离。

尚未创建测试用户，尚未写入远端业务数据，也未执行 migration。配置与凭据未写入本文。

下一步仅在用户确认后执行 [migration 变更清单](SUPABASE-MIGRATION-REVIEW.md)，然后按原定步骤继续验证。之前的本地测试结果不计入上述真实云端项目的通过项。
