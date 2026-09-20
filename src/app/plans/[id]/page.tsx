import Link from "next/link";
import { ArrowLeft, ArrowUpRight, FileText, UserRound } from "lucide-react";
import { notFound } from "next/navigation";
import { Gate, Shell, TrainingNav } from "@/components/shell";
import {
  environmentLabels,
  getTrainingLibraryEntry,
  isTrainingEnvironment,
  trainingLibrary,
  verificationLabels,
} from "@/lib/training-library";

export function generateStaticParams() {
  return trainingLibrary.map((entry) => ({ id: entry.id }));
}

export default async function PlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ environment?: string | string[] }>;
}) {
  const { id } = await params;
  const entry = getTrainingLibraryEntry(id);
  if (!entry) notFound();

  const requested = (await searchParams).environment;
  const environmentValue = Array.isArray(requested) ? requested[0] : requested;
  const selected = isTrainingEnvironment(environmentValue) ? environmentValue : "all";
  const returnHref = `/plans?environment=${selected}#${entry.id}`;

  return (
    <Shell>
      <Gate>
        <TrainingNav />
        <article className="library-detail">
          <Link href={returnHref} className="library-back-link">
            <ArrowLeft size={16} aria-hidden="true" />
            返回计划库
          </Link>

          <header className="library-detail-header panel">
            <div className="library-detail-avatar" aria-label={`${entry.displayName} 头像占位图`}>
              <UserRound aria-hidden="true" />
            </div>
            <div className="library-detail-heading">
              <div className="library-detail-kicker">
                <span>{entry.personType}</span>
                <span>{entry.contentType}</span>
              </div>
              <h1>{entry.displayName}</h1>
              <p>{entry.theme}</p>
              <div className="library-environments" aria-label="训练环境">
                {entry.environments.map((environment) => (
                  <span key={environment}>{environmentLabels[environment]}</span>
                ))}
              </div>
            </div>
            <span className={`verification-badge ${entry.verificationStatus}`}>
              {verificationLabels[entry.verificationStatus]}
            </span>
          </header>

          <section className="library-detail-section panel" aria-labelledby="verified-content">
            <div className="library-detail-section-heading">
              <FileText size={18} aria-hidden="true" />
              <h2 id="verified-content">已核实内容</h2>
            </div>
            {entry.verifiedContent.length > 0 ? (
              <ul>
                {entry.verifiedContent.map((content) => (
                  <li key={content}>{content}</li>
                ))}
              </ul>
            ) : (
              <div className="content-pending">
                <strong>内容整理中</strong>
                <span>完整训练内容尚未核实，暂不作为可执行方案。</span>
              </div>
            )}
            <p className="verification-note">{entry.verificationNote}</p>
          </section>

          <details className="library-sources panel">
            <summary>
              参考来源
              <span>{entry.sources.length}</span>
            </summary>
            <div className="library-source-list">
              {entry.sources.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                  <span>{source.title}</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              ))}
            </div>
          </details>

          <p className="library-disclaimer">
            本页资料为候选参考内容，不代表已验证训练效果，也不代表人物当前的完整训练安排。
          </p>
        </article>
      </Gate>
    </Shell>
  );
}
