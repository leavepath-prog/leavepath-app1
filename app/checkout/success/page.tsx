import { redirect } from "next/navigation";
import { FREE_BETA } from "@/lib/config";
import { stripe } from "@/lib/stripe";
import { ResendLink } from "./ResendLink";

export const metadata = { title: "Payment received · LeavePath" };
export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  if (FREE_BETA) redirect("/dashboard");
  const { session_id } = await searchParams;
  let email: string | null = null;
  if (session_id && /^cs_[A-Za-z0-9_]+$/.test(session_id)) {
    try {
      const session = await stripe().checkout.sessions.retrieve(session_id);
      if (session.payment_status === "paid") email = session.customer_details?.email ?? session.customer_email;
    } catch {
      // Unknown session: show the generic message.
    }
  }
  return (
    <main className="wizard" style={{ paddingTop: 48 }}>
      <span className="brand">LeavePath</span>
      <div className="card stack" style={{ marginTop: 24 }}>
        <span className="eyebrow">Payment received</span>
        <h1 className="display" style={{ fontSize: 30, margin: 0 }}>
          Check your inbox
        </h1>
        <p style={{ margin: 0 }}>
          We've emailed a sign-in link{email ? <> to <strong>{email}</strong></> : null}. Tap it to open your LeavePath Plan
          dashboard. It works on any device, and you can request a new one whenever you want to log back in.
        </p>
        <ResendLink email={email} />
      </div>
    </main>
  );
}
