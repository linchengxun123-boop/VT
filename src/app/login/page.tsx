"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/shell";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { dataMode } from "@/lib/config";
import { authErrorMessage, normalizeAuthEmail, SIGNUP_CONFIRMATION_MESSAGE } from "@/lib/auth";
export default function LoginPage() {
  const [signup, setSignup] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [checkingSession, setCheckingSession] = useState(dataMode === "supabase");
  useEffect(() => {
    if (dataMode !== "supabase") return;
    let active = true;
    void supabaseBrowser()
      .auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (data.session) {
          window.location.replace("/");
          return;
        }
        if (sessionError) setError(authErrorMessage(sessionError, "login"));
        setCheckingSession(false);
      })
      .catch((sessionError: unknown) => {
        if (!active) return;
        setError(authErrorMessage(sessionError, "login"));
        setCheckingSession(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const client = supabaseBrowser();
      const normalizedEmail = normalizeAuthEmail(email);
      const result = signup
        ? await client.auth.signUp({
            email: normalizedEmail,
            password,
            options: { emailRedirectTo: window.location.origin + "/login" },
          })
        : await client.auth.signInWithPassword({ email: normalizedEmail, password });
      if (result.error) throw result.error;
      // A full document navigation discards the previous identity's provider state.
      if (result.data.session) window.location.replace("/");
      else setMessage(SIGNUP_CONFIRMATION_MESSAGE);
    } catch (e) {
      setError(authErrorMessage(e, signup ? "signup" : "login"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="assessment-page">
      <Brand />
      <div className="panel login-card">
        <span className="eyebrow accent">欢迎来到 VT</span>
        <h1>{signup ? "开始记录你的进步。" : "欢迎回到训练场。"}</h1>
        {dataMode === "local" ? (
          <>
            <p>当前使用访客模式，无需登录即可开始训练。</p>
            <Link className="button primary" href="/">
              继续训练
            </Link>
          </>
        ) : (
          <>
            <p>用邮箱保存训练记录，在不同设备继续练习。</p>
            <form onSubmit={submit}>
              <label>
                邮箱
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onInvalid={(e) =>
                    e.currentTarget.setCustomValidity(
                      e.currentTarget.validity.valueMissing
                        ? "请输入邮箱。"
                        : "请输入有效的邮箱地址。",
                    )
                  }
                  onChange={(e) => {
                    e.target.setCustomValidity("");
                    setEmail(e.target.value);
                  }}
                />
              </label>
              <label>
                密码
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete={signup ? "new-password" : "current-password"}
                  value={password}
                  onInvalid={(e) =>
                    e.currentTarget.setCustomValidity(
                      e.currentTarget.validity.valueMissing
                        ? "请输入密码。"
                        : "密码至少需要 8 个字符。",
                    )
                  }
                  onChange={(e) => {
                    e.target.setCustomValidity("");
                    setPassword(e.target.value);
                  }}
                />
              </label>
              <span className="caption">至少 8 个字符</span>
              {error && (
                <div className="error" role="alert">
                  {error}
                </div>
              )}
              {message && (
                <p className="success-message" role="status">
                  {message}
                </p>
              )}
              <button disabled={busy || checkingSession} className="button primary full">
                {checkingSession
                  ? "正在检查登录状态…"
                  : busy
                    ? "请稍候…"
                    : signup
                      ? "注册账号"
                      : "登录"}
              </button>
            </form>
            <button
              className="text-link auth-toggle"
              onClick={() => {
                setSignup(!signup);
                setError("");
                setMessage("");
              }}
            >
              {signup ? "已有账号？登录" : "没有账号？注册"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
