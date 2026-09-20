"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Crosshair, Timer } from "lucide-react";
import { Brand, Gate, ErrorNotice } from "@/components/shell";
import { useTraining } from "@/components/training-provider";
import { RANKS, ROLES, MINUTES, WEAKNESSES, type Assessment } from "@/lib/domain";
import { recommendPlan, recommendationReason } from "@/lib/recommendation";
import { RANK_LABELS, ROLE_LABELS, weaknessLabel, planLabel } from "@/lib/display";
import { PLANS, scheduleTasks } from "@/lib/plans";
export default function AssessmentPage() {
  return (
    <Gate profile={false}>
      <AssessmentForm />
    </Gate>
  );
}
function AssessmentForm() {
  const { state, busy, mutate } = useTraining();
  const [rank, setRank] = useState<Assessment["rank"] | null>(state?.profile?.rank ?? null),
    [role, setRole] = useState<Assessment["role"] | null>(state?.profile?.role ?? null),
    [minutes, setMinutes] = useState<Assessment["daily_training_minutes"]>(
      state?.profile?.daily_training_minutes ?? 20,
    ),
    [weaknesses, setWeaknesses] = useState<Assessment["weaknesses"]>(
      state?.profile?.weaknesses ?? [],
    ),
    [result, setResult] = useState<Assessment | null>(null);
  const locked = Boolean(
    state?.completed.length || state?.checkins.some((c) => c.date === state.today),
  );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rank || !role) return;
    const input = { rank, role, daily_training_minutes: minutes, weaknesses };
    if (await mutate({ action: "profile", input })) setResult(input);
  };
  if (result) {
    const plan = PLANS[recommendPlan(result)];
    return (
      <div className="assessment-page">
        <Brand />
        <div className="recommendation panel">
          <div className="success-icon">
            <Check size={28} />
          </div>
          <span className="eyebrow accent">你的训练，从这里开始</span>
          <h1>找到你的训练方向。</h1>
          <p>{recommendationReason(result)}</p>
          <div className="recommended-plan">
            <span className="tag">计划{planLabel(plan.id)} · 为你推荐</span>
            <h2>{plan.name}</h2>
            {plan.title !== plan.name && <p>{plan.title}</p>}
            <div className="inline-meta">
              <Timer size={16} />
              每天 {minutes} 分钟 <span>·</span>
              {plan.tasks.length} 项训练
            </div>
          </div>
          <ol className="preview-tasks">
            {scheduleTasks(plan.id, minutes).map((t) => (
              <li key={t.id}>
                <span>{t.name}</span>
                <span>{t.duration_minutes} 分钟</span>
              </li>
            ))}
          </ol>
          <Link href="/dashboard" className="button primary full">
            进入今日训练 <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="assessment-page">
      <div className="assessment-top">
        <Brand />
        <Link href={state?.profile ? "/profile" : "/"} className="text-link">
          <ArrowLeft size={16} />
          返回
        </Link>
      </div>
      <div className="assessment-heading">
        <span className="eyebrow accent">玩家测评 / 01</span>
        <h1>
          先了解你，
          <br className="mobile-only" />
          再开始训练。
        </h1>
        <p>没有标准答案。选出你现在的状态，就从这里开始。</p>
      </div>
      {locked ? (
        <div className="panel empty">
          <Crosshair />
          <h2>今天的训练计划已锁定</h2>
          <p>你已经开始今天的训练。明天可以重新测评，历史记录会保留。</p>
          <Link className="button primary" href="/dashboard">
            回到今日训练
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="assessment-form">
          <fieldset>
            <legend>
              <span>01</span> 当前段位
            </legend>
            <div className="option-grid ranks">
              {RANKS.map((v) => (
                <button
                  type="button"
                  key={v}
                  aria-pressed={rank === v}
                  className={`option ${rank === v ? "selected" : ""}`}
                  onClick={() => setRank(v)}
                >
                  <span className="rank-diamond">◇</span>
                  {RANK_LABELS[v]}
                  {rank === v && <Check size={14} />}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              <span>02</span> 主玩角色定位
            </legend>
            <div className="option-grid roles">
              {ROLES.map((v) => (
                <button
                  type="button"
                  key={v}
                  aria-pressed={role === v}
                  className={`option ${role === v ? "selected" : ""}`}
                  onClick={() => setRole(v)}
                >
                  {ROLE_LABELS[v]}
                  {role === v && <Check size={14} />}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              <span>03</span> 每天留多少时间给训练？
            </legend>
            <div className="option-grid times">
              {MINUTES.map((v) => (
                <button
                  type="button"
                  key={v}
                  aria-pressed={minutes === v}
                  className={`option ${minutes === v ? "selected" : ""}`}
                  onClick={() => setMinutes(v)}
                >
                  <b>{v}</b> 分钟
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              <span>04</span> 最想改善什么？ <small>可多选，也可暂不选择</small>
            </legend>
            <div className="option-grid weaknesses">
              {WEAKNESSES.map((v) => (
                <button
                  type="button"
                  key={v}
                  aria-pressed={weaknesses.includes(v)}
                  className={`option ${weaknesses.includes(v) ? "selected" : ""}`}
                  onClick={() =>
                    setWeaknesses((prev) =>
                      prev.includes(v) ? prev.filter((w) => w !== v) : [...prev, v],
                    )
                  }
                >
                  <span className="checkbox">{weaknesses.includes(v) && <Check size={13} />}</span>
                  {weaknessLabel(v)}
                </button>
              ))}
            </div>
          </fieldset>
          <ErrorNotice />
          <button className="button primary full" disabled={!rank || !role || busy}>
            {busy ? "正在生成计划…" : "生成我的训练计划"}
            <ArrowRight size={18} />
          </button>
          {(!rank || !role) && <p className="caption center">请选择当前段位和主玩角色定位</p>}
        </form>
      )}
    </div>
  );
}
