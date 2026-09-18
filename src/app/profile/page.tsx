"use client";
import Link from "next/link";
import { ArrowUpRight, UserRound, LogOut } from "lucide-react";
import { Shell, Gate } from "@/components/shell";
import { useTraining } from "@/components/training-provider";
import { PLANS } from "@/lib/plans";
import { supabaseBrowser } from "@/lib/supabase-browser";
export default function ProfilePage() {
  return (
    <Shell>
      <Gate>
        <Profile />
      </Gate>
    </Shell>
  );
}
function Profile() {
  const { state } = useTraining();
  if (!state?.profile) return null;
  const p = state.profile;
  return (
    <div className="profile-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLAYER PROFILE</span>
          <h1>你的训练档案。</h1>
          <p>从现在的水平，练到更好的自己。</p>
        </div>
        <UserRound size={32} />
      </div>
      <section className="panel profile-card">
        <div className="profile-rank">
          <span className="rank-symbol">◇</span>
          <div>
            <h2>{p.rank}</h2>
            <span>{p.role}</span>
          </div>
          <span className="tag">{state.mode === "local" ? "访客玩家" : "已登录"}</span>
        </div>
        <dl>
          <div>
            <dt>每日训练</dt>
            <dd>{p.daily_training_minutes} 分钟</dd>
          </div>
          <div>
            <dt>当前计划</dt>
            <dd>{PLANS[p.selected_plan].name}</dd>
          </div>
          <div>
            <dt>训练重点</dt>
            <dd>{p.weaknesses.length ? p.weaknesses.join("、") : "基础枪法与稳定性"}</dd>
          </div>
        </dl>
        <Link href="/assessment" className="button secondary">
          重新测评 <ArrowUpRight size={17} />
        </Link>
        <p className="caption">当天开始训练后，次日才能调整计划。历史记录会保留。</p>
      </section>
      <section className="panel profile-storage">
        <h2>{state.mode === "local" ? "关于你的训练记录" : "跨设备保存训练记录"}</h2>
        <p>
          {state.mode === "local"
            ? "记录已保存在此服务的本地数据库中，刷新或重启服务不会丢失。此浏览器的 Cookie 用于识别你的访客身份；清除 Cookie 或更换浏览器会进入新档案。"
            : "训练记录保存在你的账号下，登录同一账号即可继续训练。"}
        </p>
        {state.mode === "supabase" && (
          <button
            className="button secondary"
            onClick={async () => {
              await supabaseBrowser().auth.signOut();
              // Clear the in-memory player snapshot when ending this session.
              // eslint-disable-next-line @next/next/no-location-assign-relative-destination
              window.location.assign("/login");
            }}
          >
            <LogOut size={16} />
            退出登录
          </button>
        )}
      </section>
    </div>
  );
}
