import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitizeIntake, sanitizeScenario } from "@/lib/sanitizeIntake";
import { DashboardClient } from "./DashboardClient";

export const metadata = { title: "Your LeavePath Plan" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const { data: plan } = await supabase
    .from("plans")
    .select("id, intake, scenario, task_checks, paid")
    .eq("user_id", user.id)
    .eq("paid", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!plan) {
    return (
      <main className="wizard" style={{ paddingTop: 48 }}>
        <span className="brand">LeavePath</span>
        <div className="card stack" style={{ marginTop: 24 }}>
          <h1 className="display" style={{ fontSize: 28, margin: 0 }}>
            We can't find a plan yet
          </h1>
          <p style={{ margin: 0 }}>
            If you've just paid, Stripe can take a few seconds to confirm. Refresh this page in a moment.
          </p>
          <a className="btn block" href="/dashboard">
            Refresh
          </a>
          <a className="btn ghost block" href="/start">
            Build a new plan
          </a>
        </div>
      </main>
    );
  }

  return (
    <DashboardClient
      planId={plan.id as string}
      intake={sanitizeIntake(plan.intake)}
      scenario={sanitizeScenario(plan.scenario)}
      checks={(plan.task_checks ?? {}) as Record<string, boolean>}
    />
  );
}
