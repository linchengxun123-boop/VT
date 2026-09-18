import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty">
      <span className="eyebrow">404 / OFF TARGET</span>
      <h1>这里没有训练任务。</h1>
      <Link className="button primary" href="/">
        回到首页
      </Link>
    </main>
  );
}
