import { LinkButton } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/primitives";

export default function DietSettingsPage() {
  return (
    <>
      <PageHeader title="Diet settings" />
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
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
