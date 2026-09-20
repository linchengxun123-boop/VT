"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Crosshair, Flame, Timer, TrendingUp, MoveUpRight } from "lucide-react";
import { Brand, Gate } from "@/components/shell";
import { useTraining } from "@/components/training-provider";
export default function HomePage() {
  const { state } = useTraining();
  const router = useRouter();
  useEffect(() => {
    if (state?.profile) router.replace("/dashboard");
  }, [state, router]);
  return (
    <Gate profile={false}>
      <div className="landing">
        <header className="landing-header">
          <Brand />
          <span className="eyebrow">为下一局做好准备</span>
          <Link href="/assessment" className="text-link">
            开始训练 <MoveUpRight size={16} />
          </Link>
        </header>
        <main className="landing-main">
          <div className="landing-copy">
            <div className="eyebrow accent">
              <span className="tiny-line" /> VALORANT 每日训练
            </div>
            <h1>
              每一天，
              <br />
              更准<span className="accent">一点。</span>
            </h1>
            <p className="landing-description">
              把「再来一把」的时间，留一点给认真练习。
              <br />
              从你的弱项出发，用一份计划，养成更稳的枪法。
            </p>
            <Link className="button primary big-button" href="/assessment">
              开始测评 <ArrowRight size={20} />
            </Link>
            <span className="caption">约 1 分钟测评 · 每天 10–45 分钟 · 从今天开始</span>
          </div>
          <div className="target-panel" aria-hidden="true">
            <span className="target-label">专注 / 控制 / 坚持</span>
            <div className="target-grid">
              <div className="target-ring ring-outer" />
              <div className="target-ring ring-mid" />
              <div className="target-ring ring-inner" />
              <div className="target-line horizontal" />
              <div className="target-line vertical" />
              <Crosshair className="target-center" strokeWidth={1} />
              <span className="target-coordinate">
                横向 00.00
                <br />
                纵向 00.00
              </span>
              <span className="target-tick">01 — 专注当下</span>
            </div>
            <div className="target-bottom">
              <span>
                每一次微调，
                <br />
                <b>让对枪更稳。</b>
              </span>
              <span className="target-number">
                +1<span>%</span>
              </span>
            </div>
          </div>
        </main>
        <section className="landing-features" aria-label="产品功能">
          {[
            { icon: Timer, title: "每日训练计划", text: "把练习变成一个可完成的小目标。" },
            { icon: Crosshair, title: "针对弱项训练", text: "从基础、爆头或微调开始。" },
            { icon: Flame, title: "连续打卡", text: "记录每一次坚持，保持你的节奏。" },
            { icon: TrendingUp, title: "查看成长记录", text: "让付出的时间，留下清晰的轨迹。" },
          ].map((item, i) => (
            <div key={item.title}>
              <span className="feature-index">0{i + 1}</span>
              <item.icon size={22} />
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </div>
          ))}
        </section>
        <footer className="landing-footer">
          <span>VT — 每一次练习，都有方向。</span>
          <span>独立训练工具，与 拳头游戏 无关联。</span>
        </footer>
      </div>
    </Gate>
  );
}
