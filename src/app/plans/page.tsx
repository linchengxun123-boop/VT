import Link from "next/link";
import { ArrowUpRight, UserRound } from "lucide-react";
import { Gate, Shell, TrainingNav } from "@/components/shell";
import {
  environmentLabels,
  filterTrainingLibrary,
  isTrainingEnvironment,
  type TrainingEnvironment,
} from "@/lib/training-library";

type LibraryFilter = "all" | TrainingEnvironment;

const filters: { value: LibraryFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "game", label: "游戏内" },
  { value: "aimlabs", label: "Aimlabs" },
];

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ environment?: string | string[] }>;
}) {
  const requested = (await searchParams).environment;
  const environmentValue = Array.isArray(requested) ? requested[0] : requested;
  const selected: LibraryFilter = isTrainingEnvironment(environmentValue)
    ? environmentValue
    : "all";
  const entries = filterTrainingLibrary(selected === "all" ? undefined : selected);

  return (
    <Shell>
      <Gate>
        <TrainingNav />
        <section className="library-page" aria-labelledby="library-title">
          <div className="library-toolbar">
            <h1 id="library-title">职业选手方案</h1>
            <nav className="library-filters" aria-label="训练环境筛选">
              {filters.map((filter) => (
                <Link
                  key={filter.value}
                  href={`/plans?environment=${filter.value}`}
                  aria-current={selected === filter.value ? "page" : undefined}
                  className={selected === filter.value ? "active" : ""}
                  scroll={false}
                >
                  {filter.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="library-grid" data-filter={selected}>
            {entries.map((entry) => (
              <article className="library-card" id={entry.id} key={entry.id}>
                <div className="library-avatar" aria-label={`${entry.displayName} 头像占位图`}>
                  <UserRound aria-hidden="true" />
                </div>
                <div className="library-card-copy">
                  <span className="library-person-type">{entry.personType}</span>
                  <h2>{entry.displayName}</h2>
                  <p>{entry.theme}</p>
                </div>
                <div className="library-environments" aria-label="训练环境">
                  {entry.environments.map((environment) => (
                    <span key={environment}>{environmentLabels[environment]}</span>
                  ))}
                </div>
                <Link
                  className="library-card-link"
                  href={`/plans/${entry.id}?environment=${selected}`}
                  aria-label={`查看 ${entry.displayName} 方案`}
                >
                  查看方案 <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </Gate>
    </Shell>
  );
}
