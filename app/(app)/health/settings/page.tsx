import { LinkButton } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/primitives";

export default function HealthSettingsPage() {
  return (
    <>
      <PageHeader title="Health settings" />
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <Card title="Your plan">
          <p className="mb-4 text-sm text-ink-2">Dates, target weight, routines and notes.</p>
          <LinkButton href="/health/plan" variant="soft" size="sm">
            Open plan
          </LinkButton>
        </Card>
        <Card title="Your week">
          <p className="mb-4 text-sm text-ink-2">Each day&apos;s session and its exercises.</p>
          <LinkButton href="/health/workouts" variant="soft" size="sm">
            Open workouts
          </LinkButton>
        </Card>
        <Card title="Daily targets">
          <p className="mb-4 text-sm text-ink-2">Calories, macros and your water goal.</p>
          <LinkButton href="/health/targets" variant="soft" size="sm">
            Edit targets
          </LinkButton>
        </Card>
        <Card title="Saved foods">
          <p className="mb-4 text-sm text-ink-2">The list behind one-tap logging.</p>
          <LinkButton href="/health/foods" variant="soft" size="sm">
            Manage foods
          </LinkButton>
        </Card>
      </div>
    </>
  );
}
