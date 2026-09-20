"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Crosshair, CalendarDays, UserRound, ArrowUpRight, LoaderCircle } from "lucide-react";
import { useTraining } from "./training-provider";

const nav = [
  { href: "/dashboard", label: "训练", icon: Crosshair },
  { href: "/history", label: "记录", icon: CalendarDays },
  { href: "/profile", label: "我的", icon: UserRound },
];
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="VT 首页">
      VT<span className="brand-dot">.</span>
    </Link>
  );
}
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="brand-group">
            <Brand />
            <span className="brand-caption">每天练习，每天进步</span>
          </div>
          <nav className="desktop-nav" aria-label="主导航">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className={pathname === item.href ? "active" : ""}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </nav>
          <span className="version">
            每日训练 <span>01</span>
          </span>
        </div>
      </header>
      <main className="app-main">{children}</main>
      <footer className="footer">
        <span>VT / 每一天，更进一步。</span>
        <span>
          独立训练工具 · 与 拳头游戏 无关联 <ArrowUpRight size={13} />
        </span>
      </footer>
      <nav className="mobile-nav" aria-label="底部导航">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className={pathname === item.href ? "active" : ""}
          >
            <item.icon size={21} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
export function Gate({ children, profile = true }: { children: ReactNode; profile?: boolean }) {
  const { state, loading, error, needsLogin, reload } = useTraining();
  const router = useRouter();
  useEffect(() => {
    if (!loading && needsLogin) router.replace("/login");
    else if (!loading && state && profile && !state.profile) router.replace("/assessment");
  }, [loading, needsLogin, state, profile, router]);
  if (loading || needsLogin || (profile && !state?.profile && !error))
    return (
      <div className="loading">
        <LoaderCircle className="spinner" />
        正在准备你的训练…
      </div>
    );
  if (!state)
    return (
      <div className="empty panel">
        <h1>暂时无法加载</h1>
        <p role="alert">{error}</p>
        <button className="button primary" onClick={() => void reload()}>
          重新加载
        </button>
      </div>
    );
  return <>{children}</>;
}
export function ErrorNotice() {
  const { error } = useTraining();
  return error ? (
    <div className="error" role="alert">
      {error}
    </div>
  ) : null;
}
