// Only known application messages may pass through to the interface.
const messages = [
  "今天已开始训练，请明天再调整测评。",
  "请先完成测评。",
  "今天已打卡，训练记录已锁定。",
  "该任务不属于当前计划。",
  "完成所有训练任务后才能打卡。",
  "请先登录。",
  "登录已过期，请重新登录。",
  "无效的弱项选项。",
  "无效的任务状态。",
  "不支持的操作。",
  "请求来源不匹配。",
  "请检查测评选项是否填写完整。",
  "请求内容无法识别，请刷新页面后重试。",
  "账号服务尚未配置，请联系管理员。",
];
export function trainingErrorMessage(error: unknown, status?: number): string {
  const detail =
    error && typeof error === "object" ? (error as { message?: unknown; code?: unknown }) : {};
  const message = typeof detail.message === "string" ? detail.message : "";
  const code = typeof detail.code === "string" ? detail.code : "";
  if (
    messages.includes(message) ||
    [
      "网络连接失败，请检查网络后重试。",
      "请求超时，请稍后重试。",
      "没有操作权限，请重新登录或联系管理员。",
      "请求过于频繁，请稍后再试。",
      "提交的数据不符合要求，请检查测评选项或刷新训练计划。",
      "记录已存在或状态已更新，请刷新后查看。",
      "训练数据服务尚未就绪，请联系管理员。",
      "训练记录正在更新，请稍后重试。",
      "训练记录暂时无法写入，请联系管理员检查存储空间和权限。",
      "服务返回的数据无法识别，请刷新页面后重试。",
      "请求内容不符合要求，请刷新页面后重新操作。",
      "训练服务暂时不可用，请稍后重试。",
      "训练服务发生异常，暂时无法完成操作，请稍后重试。",
    ].includes(message)
  )
    return message;
  if (/fetch|network|ECONN|ENOTFOUND|网络连接失败/i.test(message))
    return "网络连接失败，请检查网络后重试。";
  if (/timeout|timed out|超时/i.test(message) || code === "57014" || status === 504)
    return "请求超时，请稍后重试。";
  if (status === 401 || code === "PGRST301") return "登录已过期，请重新登录。";
  if (status === 403 || code === "42501") return "没有操作权限，请重新登录或联系管理员。";
  if (status === 429) return "请求过于频繁，请稍后再试。";
  if (["23502", "23503", "23514", "22P02"].includes(code))
    return "提交的数据不符合要求，请检查测评选项或刷新训练计划。";
  if (code === "23505" || status === 409) return "记录已存在或状态已更新，请刷新后查看。";
  if (["42P01", "42883", "PGRST202", "PGRST205"].includes(code))
    return "训练数据服务尚未就绪，请联系管理员。";
  if (/SQLITE_BUSY|SQLITE_LOCKED/.test(code) || /database is locked/i.test(message))
    return "训练记录正在更新，请稍后重试。";
  if (/SQLITE_FULL|ENOSPC|SQLITE_READONLY|EACCES/.test(code))
    return "训练记录暂时无法写入，请联系管理员检查存储空间和权限。";
  if (error instanceof SyntaxError) return "服务返回的数据无法识别，请刷新页面后重试。";
  if (status === 400 || status === 422) return "请求内容不符合要求，请刷新页面后重新操作。";
  if (status === 502 || status === 503) return "训练服务暂时不可用，请稍后重试。";
  return "训练服务发生异常，暂时无法完成操作，请稍后重试。";
}
