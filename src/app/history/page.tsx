"use client";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Flame, Trophy, Timer, Minus } from "lucide-react";
import { Shell, Gate } from "@/components/shell";
import { useTraining } from "@/components/training-provider";
import { trainingStats, shiftDate } from "@/lib/streak";
import { PLANS } from "@/lib/plans";
import { useState } from "react";
export default function HistoryPage() {
  return (
    <Shell>
      <Gate>
        <History />
      </Gate>
    </Shell>
  );
}
function History() {
  const { state } = useTraining();
  const [limit, setLimit] = useState(14);
  if (!state) return null;
  const { checkins, today } = state,
    stats = trainingStats(
      checkins.map((c) => c.date),
      today,
    ),
    minutes = checkins.reduce((sum, c) => sum + c.total_minutes, 0);
  const oldest = checkins.at(-1)?.date || today;
  const available = Math.max(
    14,
    Math.round((Date.parse(today) - Date.parse(oldest)) / 86400000) + 1,
  );
  const days = Array.from({ length: Math.min(limit, available) }, (_, i) => shiftDate(today, -i));
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">记录每一份努力</span>
          <h1>每一天，都算数。</h1>
          <p>进步不总是立刻看见，但每一次训练都会留下记录。</p>
        </div>
        <CalendarDays size={32} className="muted" />
      </div>
      <div className="stats-grid">
        {[
          { icon: CalendarDays, value: stats.total, label: "累计训练天数", unit: "天" },
          { icon: Timer, value: minutes, label: "累计计划时长", unit: "分钟" },
          { icon: Flame, value: stats.current, label: "当前连续训练", unit: "天" },
          { icon: Trophy, value: stats.longest, label: "最长连续训练", unit: "天" },
        ].map((item) => (
          <div className="panel stat-card" key={item.label}>
            <div>
              <span>{item.label}</span>
              <item.icon size={19} />
            </div>
            <strong>
              {item.value}
              <small>{item.unit}</small>
            </strong>
          </div>
        ))}
      </div>
      <div className="section-heading history-title">
        <h2>训练日志</h2>
        <span className="caption">最近 {days.length} 天</span>
      </div>
      {checkins.length === 0 && (
        <div className="empty-history panel">
          <CrosshairMessage />
          <div>
            <h3>你的第一条记录，从今天开始。</h3>
            <p>完成今日全部任务并打卡，就会出现在这里。</p>
          </div>
          <Link className="button primary" href="/dashboard">
            开始训练 <ArrowRight size={17} />
          </Link>
        </div>
      )}
      <div className="history-list">
        {days.map((date) => {
          const record = checkins.find((c) => c.date === date);
          const weekday = new Intl.DateTimeFormat("zh-CN", {
            weekday: "long",
            timeZone: "UTC",
          }).format(new Date(`${date}T12:00:00Z`));
          return (
            <article key={date} className={`history-row ${record ? "recorded" : ""}`}>
              <span className="history-status">
                {record ? <Check size={20} /> : <Minus size={18} />}
              </span>
              <div className="history-date">
                <h3>{date === today ? "今天" : weekday}</h3>
                <span>{date.replaceAll("-", ".")}</span>
              </div>
              <div className="history-plan">
                {record ? (
                  <>
                    <strong>{PLANS[record.plan_id].name}</strong>
                    <span>
                      {record.completed_tasks} / {record.total_tasks} 项训练完成
                    </span>
                  </>
                ) : (
                  <span>{date === today ? "今日尚未打卡" : "未打卡"}</span>
                )}
              </div>
              <span className="history-duration">
                {record ? `${record.total_minutes} 分钟` : "—"}
              </span>
            </article>
          );
        })}
      </div>
      {limit < available && (
        <button className="button secondary load-more" onClick={() => setLimit((v) => v + 30)}>
          加载更早的记录
        </button>
      )}
    </>
  );
}
function CrosshairMessage() {
  return <CalendarDays size={28} className="accent" />;
}
