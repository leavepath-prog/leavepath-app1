import Link from "next/link";

export default function Home() {
  return (
    <main className="wizard" style={{ paddingTop: 40 }}>
      <div className="row between">
        <span className="brand">LeavePath</span>
        <Link className="small" href="/login">
          Sign in
        </Link>
      </div>
      <h1 className="display" style={{ fontSize: 40, lineHeight: 1.08, margin: "40px 0 12px" }}>
        Know exactly how parental leave affects your money.
      </h1>
      <p className="muted" style={{ fontSize: 17 }}>
        A personal, interactive plan for your maternity, shared parental or adoption leave: month-by-month cashflow, your
        £100k childcare check, every return-to-work pattern compared, and your flexible working letter written for you.
      </p>
      <div className="stack" style={{ marginTop: 24 }}>
        <Link className="btn block" href="/start">
          Build my plan (5 minutes)
        </Link>
        <p className="help" style={{ textAlign: "center" }}>
          See your verdict free. Unlock the full dashboard with one payment.
        </p>
      </div>
      <p className="help" style={{ marginTop: 40 }}>
        Educational modelling for England, Wales and Northern Ireland using 2026/27 HMRC and statutory rates. Not regulated
        financial advice.
      </p>
    </main>
  );
}
