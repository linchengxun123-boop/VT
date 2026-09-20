"use client";
import Link from "next/link";
import { ArrowUpRight, Check, Crosshair, Flame, ShieldCheck, Target, Timer } from "lucide-react";
import { Shell, Gate, ErrorNotice } from "@/components/shell";
import { useTraining } from "@/components/training-provider";
import { RANK_LABELS, ROLE_LABELS, planLabel } from "@/lib/display";
import { PLANS, scheduleTasks } from "@/lib/plans";
import { trainingStats } from "@/lib/streak";
import { TaskCard } from "@/components/task-card";
import { WeekStrip } from "@/components/week-strip";
export default function DashboardPage() {
  return (
    <Shell>
      <Gate>
        <Dashboard />
      </Gate>
    </Shell>
  );
}
function Dashboard() {
  const { state, busy, mutate } = useTraining();
  if (!state?.profile) return null;
  const { profile, today, checkins, completed } = state,
    plan = PLANS[profile.selected_plan],
    tasks = scheduleTasks(plan.id, profile.daily_training_minutes),
    stats = trainingStats(
      checkins.map((c) => c.date),
      today,
    );
  const checked = checkins.some((c) => c.date === today),
    count = tasks.filter((t) => completed.includes(t.id)).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            每日进步 <span className="slash">/</span> {today.replaceAll("-", ".")}
          </div>
          <h1>{checked ? "今日已练，明天继续。" : "今天，也更进一步。"}</h1>
          <p>
            {checked
              ? "每一次认真练习，都在为下一次对枪做准备。"
              : "专注每一枪。把进步交给每天的坚持。"}
          </p>
        </div>
        <Link href="/profile" className="player-badge">
          <span className="rank-symbol">◇</span>
          <div>
            <strong>{RANK_LABELS[profile.rank]}</strong>
            <span>{ROLE_LABELS[profile.role]}</span>
          </div>
          <ArrowUpRight size={16} />
        </Link>
      </div>
      <div className="dashboard-layout">
        <div className="training-column">
          <section className="plan-banner">
            <div className="plan-banner-copy">
              <span className="tag">
                你的专属计划 <span>/ 计划{planLabel(plan.id)}</span>
              </span>
              <h2>{plan.name}</h2>
              {plan.title !== plan.name && <p>{plan.title}</p>}
              <div className="inline-meta">
                <Timer size={16} />
                {profile.daily_training_minutes} 分钟<span>·</span>
                <Crosshair size={16} />
                {tasks.length} 项训练
              </div>
            </div>
            <div className="plan-emblem" aria-hidden="true">
              <Crosshair strokeWidth={0.8} />
              <span>{planLabel(plan.id)}</span>
            </div>
            <div className="plan-banner-bottom">
              <span>{plan.target}</span>
              <span>
                每日练习 <ArrowUpRight size={13} />
              </span>
            </div>
          </section>
          <section id="training" className="training-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">专注当下，开始训练</span>
                <h2>
                  今日训练
                  <span className="count-label">{String(tasks.length).padStart(2, "0")}</span>
                </h2>
              </div>
              <span className="progress-label">
                {count} / {tasks.length} 已完成
              </span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-label="今日任务完成进度"
              aria-valuemin={0}
              aria-valuemax={tasks.length}
              aria-valuenow={count}
            >
              <span style={{ width: `${(count / tasks.length) * 100}%` }} />
            </div>
            <div className="task-list">
              {tasks.map((task, i) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={i}
                  done={completed.includes(task.id)}
                  locked={checked}
                />
              ))}
            </div>
            <ErrorNotice />
            <div className={`checkin-card ${checked ? "checked" : ""}`} aria-live="polite">
              {checked ? (
                <>
                  <ShieldCheck size={29} />
                  <div>
                    <h3>今日打卡已保存</h3>
                    <p>连续训练 {stats.current} 天。明天，继续积累。</p>
                  </div>
                  <Link href="/history" aria-label="查看训练记录">
                    <ArrowUpRight size={22} />
                  </Link>
                </>
              ) : (
                <>
                  <div>
                    <h3>
                      {count === tasks.length
                        ? "训练完成，记下今天的坚持。"
                        : "完成每一项，再为今天打卡。"}
                    </h3>
                    <p>
                      已完成 {count} / {tasks.length} 项 · 计划 {profile.daily_training_minutes}{" "}
                      分钟
                    </p>
                  </div>
                  <button
                    className="button primary"
                    disabled={busy || count !== tasks.length}
                    onClick={() => void mutate({ action: "checkin" })}
                  >
                    {busy ? "保存中…" : "完成今日训练"}
                    <Check size={17} />
                  </button>
                </>
              )}
            </div>
            <p className="training-note">
              在 VALORANT 中完成练习后，回到这里标记。时长为计划时长。
            </p>
          </section>
        </div>
        <aside className="dashboard-aside">
          <section
            className={`streak-card panel ${stats.current > 0 ? "streak-active" : "streak-zero"}`}
          >
            <div className="aside-label">
              <span>保持你的节奏</span>
              <Flame size={20} />
            </div>
            <div className="streak-number">
              <span>{stats.current}</span>
              <strong>天</strong>
            </div>
            <p>连续训练</p>
            <div className="streak-message">
              {stats.current === 0 ? "今天，就是一个好的开始。" : "枪法需要练习，坚持也一样。"}
            </div>
          </section>
          <section className="panel week-panel">
            <div className="aside-label">
              <h2>本周训练</h2>
              <span>
                <b>{stats.week}</b> / 7 天
              </span>
            </div>
            <WeekStrip dates={checkins.map((c) => c.date)} today={today} />
            <Link href="/history" className="aside-link">
              查看训练记录 <ArrowUpRight size={16} />
            </Link>
          </section>
          <section className="focus-note">
            <Target size={19} />
            <span className="eyebrow">今日重点</span>
            <h3>
              {plan.id === "C"
                ? "准星到位，再开枪。"
                : plan.id === "B"
                  ? "先找到头线，再找到节奏。"
                  : "每一次停稳，都是进步。"}
            </h3>
            <p>{plan.description}</p>
            <div className="note-rule" />
            <span className="caption">坚持比强度更重要。</span>
          </section>
        </aside>
      </div>
    </>
  );
}
