import { NextResponse } from "next/server";
import { sanitizeScenario } from "@/lib/sanitizeIntake";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH { planId, scenario?, taskChecks? }
 * Saves slider states and timeline checkboxes. Runs as the signed-in user,
 * so Row Level Security only lets them touch their own plan.
 */
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { planId?: unknown; scenario?: unknown; taskChecks?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof body.planId !== "string") {
    return NextResponse.json({ error: "Missing planId" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (body.scenario !== undefined) patch.scenario = sanitizeScenario(body.scenario);
  if (body.taskChecks !== undefined && body.taskChecks && typeof body.taskChecks === "object") {
    const checks: Record<string, true> = {};
    for (const [k, v] of Object.entries(body.taskChecks as Record<string, unknown>).slice(0, 100)) {
      if (v === true && /^[a-z0-9-]{1,60}$/.test(k)) checks[k] = true;
    }
    patch.task_checks = checks;
  }
  if (Object.keys(patch).length === 0) return NextResponse.json({ ok: true });

  const { error } = await supabase
    .from("plans")
    .update(patch)
    .eq("id", body.planId)
    .eq("user_id", user.id);
  if (error) {
    console.error("Plan save failed", error);
    return NextResponse.json({ error: "Could not save" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
