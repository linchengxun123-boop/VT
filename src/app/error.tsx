"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty">
      <h1>页面暂时出错了。</h1>
      <p>已保存的训练记录不会因此被清除。</p>
      <button className="button primary" onClick={reset}>
        重试
      </button>
    </main>
  );
}
