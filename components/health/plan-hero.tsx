"use client";

import { Skeleton } from "@/components/ui/primitives";
import { formatDay, number, today } from "@/lib/format";
import { planProgress, planTag, useCheckpoints, useWeights, type HealthPlan } from "./plan-data";

const MUTED = "text-[#e6d3b8]";

// The whole plan at a glance: where you are, where it ends, and how far through the weeks you are.
export function PlanHero({ plan }: { plan: HealthPlan }) {
  const { data: weights, isLoading } = useWeights();
  const { data: checkpoints = [] } = useCheckpoints();
  if (isLoading) return <Skeleton className="h-72 rounded-3xl" />;

  const now = today();
  const progress = planProgress(plan);
  const start = plan.start_weight_kg === null ? null : Number(plan.start_weight_kg);
  const target = plan.target_weight_kg === null ? null : Number(plan.target_weight_kg);
  const latest = weights?.at(-1) ? Number(weights.at(-1)!.weight_kg) : start;
  const change = start !== null && latest !== null ? latest - start : null;
  const toGo = target !== null && latest !== null ? Math.abs(latest - target) : null;
  const next = checkpoints.find((point) => point.weight_kg !== null && point.due_on >= now);
  const elapsed = progress.started ? Math.min(progress.dayNumber, progress.total) : 0;

  return (
    <section data-theme="dark" className="fade-in rounded-3xl p-6 text-ink sm:p-8" style={{ background: "#3a2410" }}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 className={`text-[15px] ${MUTED}`}>{plan.title}</h2>
        <span className="tabular rounded-full bg-white/12 px-3 py-1 text-[13px]">{planTag(plan)}</span>
      </div>

      {latest !== null && target !== null ? (
        <p className="figure mt-3 flex flex-wrap items-baseline gap-x-3 leading-none">
          <span className="text-[clamp(3.25rem,8vw,4.75rem)]">{number(latest, 1)}</span>
          <span className={`text-lg ${MUTED}`}>kg</span>
          <span className="text-[clamp(2rem,5vw,3rem)] text-[#fbbf24]">→ {number(target, 1)}</span>
          <span className={`text-lg ${MUTED}`}>kg</span>
        </p>
      ) : (
        <p className="display mt-3 text-[36px] leading-tight">{plan.title}</p>
      )}
      {plan.goal && <p className={`mt-3 max-w-xl leading-relaxed ${MUTED}`}>{plan.goal}</p>}

      <div className="mt-7">
        <div className={`mb-2 flex justify-between text-[13px] ${MUTED}`}>
          <span>{progress.started ? `Week ${progress.week} of ${progress.weeks}` : `${progress.weeks} weeks`}</span>
          <span className="tabular">Ends {formatDay(plan.ends_on, { weekday: "short", day: "numeric", month: "short" })}</span>
        </div>
        <div
          role="progressbar"
          aria-label="Days through the plan"
          aria-valuemin={0}
          aria-valuemax={progress.total}
          aria-valuenow={elapsed}
          className="flex gap-[3px]"
        >
          {Array.from({ length: progress.weeks }, (_, index) => {
            const fill = Math.max(0, Math.min(1, (elapsed - index * 7) / 7));
            return (
              <span key={index} className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                <span className="block h-full rounded-full bg-[#fbbf24]" style={{ width: `${fill * 100}%` }} />
              </span>
            );
          })}
        </div>
      </div>

      {(change !== null || next) && (
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-[13px]">
          {change !== null && (
            <div>
              <dt className={MUTED}>Since the start</dt>
              <dd className="tabular mt-0.5 text-[17px]">
                {change > 0 ? "+" : ""}
                {number(change, 1)} kg
              </dd>
            </div>
          )}
          {toGo !== null && (
            <div>
              <dt className={MUTED}>To go</dt>
              <dd className="tabular mt-0.5 text-[17px]">{number(toGo, 1)} kg</dd>
            </div>
          )}
          {next && (
            <div>
              <dt className={MUTED}>Next checkpoint</dt>
              <dd className="tabular mt-0.5 text-[17px]">
                {number(next.weight_kg, 1)} kg by {formatDay(next.due_on)}
              </dd>
            </div>
          )}
        </dl>
      )}
    </section>
  );
}
