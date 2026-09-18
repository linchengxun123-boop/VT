"use client";
import { useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/shell";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { dataMode } from "@/lib/config";
export default function LoginPage() {
  const [signup, setSignup] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const client = supabaseBrowser();
      const result = signup
        ? await client.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: window.location.origin + "/login" },
          })
        : await client.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      // A full document navigation discards the previous identity's provider state.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      if (result.data.session) window.location.assign("/");
      else setMessage("确认邮件已发送，请点击邮件中的链接，再回来登录。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "登录失败，请重试。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="assessment-page">
      <Brand />
      <div className="panel login-card">
        <span className="eyebrow accent">WELCOME TO VT</span>
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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
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
              <button disabled={busy} className="button primary full">
                {busy ? "请稍候…" : signup ? "注册账号" : "登录"}
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
