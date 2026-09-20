export const SIGNUP_CONFIRMATION_MESSAGE =
  "如果该邮箱可以注册，我们已发送确认邮件。若你已经注册，请直接登录，注册不会修改原密码。";

export function normalizeAuthEmail(email: string) {
  return email.trim().toLowerCase();
}

export function authErrorMessage(error: unknown, action: "login" | "signup" | "signout") {
  const detail =
    typeof error === "object" && error !== null
      ? (error as { code?: unknown; message?: unknown })
      : undefined;
  const code = typeof detail?.code === "string" ? detail.code : "";
  const message = typeof detail?.message === "string" ? detail.message : "";

  if (code === "invalid_credentials" || /invalid login credentials/i.test(message))
    return "邮箱或密码不正确。请使用该账号原有密码重新登录。";
  if (code === "email_not_confirmed" || /email not confirmed/i.test(message))
    return "邮箱尚未确认，请先打开确认邮件完成验证。";
  if (code === "over_request_rate_limit" || /rate limit/i.test(message))
    return "尝试次数过多，请稍后再试。";
  if (
    ["weak_password", "same_password"].includes(code) ||
    /weak password|password.*at least/i.test(message)
  )
    return "密码不符合安全要求，请使用至少 8 个字符，并按要求增加字母、数字或符号。";
  if (code === "email_address_invalid" || /invalid.*email/i.test(message))
    return "邮箱格式不正确，请检查后重新输入。";
  if (code === "validation_failed") return "提交的账号信息不符合要求，请检查邮箱和密码。";
  if (code === "email_address_not_authorized")
    return "该邮箱暂不支持注册，请使用其他邮箱或联系管理员。";
  if (["signup_disabled", "email_provider_disabled"].includes(code))
    return "邮箱注册或登录暂未开放，请联系管理员。";
  if (["user_already_exists", "email_exists"].includes(code)) return "该邮箱已注册，请直接登录。";
  if (code === "user_banned") return "该账号已被停用，请联系管理员。";
  if (
    [
      "session_expired",
      "session_not_found",
      "refresh_token_not_found",
      "refresh_token_already_used",
    ].includes(code)
  )
    return "登录已过期，请重新登录。";
  if (["over_email_send_rate_limit", "over_sms_send_rate_limit"].includes(code))
    return "验证消息发送过于频繁，请稍后再试。";
  if (code === "request_timeout" || /timeout|timed out/i.test(message))
    return "账号服务响应超时，请稍后重试。";
  if (code === "unexpected_failure") return "账号服务暂时异常，请稍后重试。";
  if (message === "账号服务尚未配置，请联系管理员。") return message;
  if (/fetch|network|网络/i.test(message))
    return action === "signout"
      ? "退出未完成，请检查网络后重试。"
      : "网络连接失败，请检查网络后重试。";
  if (action === "signout") return "退出未完成，登录状态仍可能有效，请重试。";
  if (action === "signup") return "注册暂时失败，请稍后重试。";
  return "登录服务暂时异常，请稍后重试。";
}
