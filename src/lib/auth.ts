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
  if (action === "signout") return "退出未完成，请检查网络后重试。";
  if (action === "signup") return "注册暂时失败，请稍后重试。";
  return "登录暂时失败，请检查网络后重试。";
}
