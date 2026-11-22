import Link from "next/link";

export default function HomePage() {
  return (
    <div className="lp-root">
      <style>{`
        .lp-root {
          min-height: 100vh;
          background-color: #FAF9F6;
          color: #1C1917;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          margin: 0;
        }
        .lp-root * {
          box-sizing: border-box;
        }
        .lp-container {
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 24px;
        }
        /* Header */
        .lp-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(250, 249, 246, 0.92);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #E7E5E4;
        }
        .lp-header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 70px;
        }
        .lp-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #1C1917;
          font-weight: 700;
          font-size: 18px;
          letter-spacing: -0.02em;
        }
        .lp-logo-badge {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: #065F46;
          color: #FFFFFF;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
        }
        .lp-nav {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .lp-nav a {
          text-decoration: none;
          color: #57534E;
          font-size: 14px;
          font-weight: 500;
        }
        .lp-nav a:hover {
          color: #1C1917;
        }
        .lp-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .lp-btn-ghost {
          text-decoration: none;
          color: #44403C;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 14px;
          border-radius: 8px;
        }
        .lp-btn-ghost:hover {
          background: #EFECE6;
        }
        .lp-btn-primary {
          text-decoration: none;
          background: #065F46;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 18px;
          border-radius: 9px;
          display: inline-block;
        }
        .lp-btn-primary:hover {
          background: #064E3B;
        }
        .lp-btn-secondary {
          text-decoration: none;
          background: #FFFFFF;
          color: #1C1917;
          border: 1px solid #D6D3D1;
          font-size: 15px;
          font-weight: 600;
          padding: 13px 22px;
          border-radius: 11px;
          display: inline-block;
        }
        .lp-btn-large {
          font-size: 15px;
          padding: 14px 24px;
          border-radius: 11px;
        }
        /* Hero */
        .lp-hero {
          padding: 72px 0 64px;
          text-align: center;
        }
        .lp-hero-inner {
          max-width: 740px;
          margin: 0 auto;
        }
        .lp-pill {
          display: inline-block;
          background: #ECFDF5;
          border: 1px solid #A7F3D0;
          color: #065F46;
          font-size: 12px;
          font-weight: 600;
          padding: 6px 14px;
          border-radius: 999px;
          margin-bottom: 20px;
        }
        .lp-h1 {
          font-size: clamp(34px, 5vw, 50px);
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1.12;
          margin: 0 0 20px;
          color: #1C1917;
        }
        .lp-subtitle {
          font-size: 18px;
          color: #57534E;
          line-height: 1.6;
          margin: 0 0 32px;
        }
        .lp-hero-cta {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
        }
        .lp-trust {
          margin-top: 16px;
          font-size: 13px;
          color: #78716C;
        }
        /* Sections */
        .lp-section-white {
          background: #FFFFFF;
          border-top: 1px solid #E7E5E4;
          border-bottom: 1px solid #E7E5E4;
          padding: 72px 0;
        }
        .lp-section-cream {
          padding: 72px 0;
        }
        .lp-eyebrow {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #065F46;
          margin: 0 0 8px;
        }
        .lp-h2 {
          font-size: 30px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 12px;
          color: #1C1917;
        }
        .lp-section-desc {
          font-size: 16px;
          color: #57534E;
          max-width: 620px;
          margin: 0 0 40px;
        }
        /* Grids & Cards */
        .lp-grid-3 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 22px;
        }
        .lp-grid-2 {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 26px;
        }
        .lp-card-cream {
          background: #FAF9F6;
          border: 1px solid #E7E5E4;
          border-radius: 16px;
          padding: 24px;
        }
        .lp-card-white {
          background: #FFFFFF;
          border: 1px solid #E7E5E4;
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .lp-accent-bar {
          width: 32px;
          height: 6px;
          border-radius: 999px;
          background: #065F46;
          margin-bottom: 14px;
        }
        .lp-card-title {
          font-size: 17px;
          font-weight: 600;
          margin: 0 0 8px;
          color: #1C1917;
        }
        .lp-card-text {
          font-size: 14px;
          color: #57534E;
          line-height: 1.6;
          margin: 0;
        }
        /* Worked Examples */
        .lp-tag-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .lp-tag-green {
          background: #ECFDF5;
          color: #065F46;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .lp-tag-amber {
          background: #FFFBEB;
          color: #92400E;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .lp-meta {
          font-size: 12px;
          color: #78716C;
        }
        .lp-stats-box {
          margin-top: 20px;
          background: #F5F5F4;
          border-radius: 12px;
          padding: 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          text-align: center;
        }
        .lp-stat-label {
          font-size: 11px;
          color: #78716C;
          margin: 0 0 4px;
        }
        .lp-stat-val {
          font-size: 16px;
          font-weight: 700;
          color: #1C1917;
          margin: 0;
        }
        .lp-stat-val-green {
          font-size: 16px;
          font-weight: 700;
          color: #065F46;
          margin: 0;
        }
        /* Testimonials */
        .lp-quote-card {
          background: #FAF9F6;
          border: 1px solid #E7E5E4;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .lp-quote-text {
          font-size: 14px;
          color: #44403C;
          line-height: 1.65;
          margin: 0 0 20px;
        }
        .lp-quote-footer {
          border-top: 1px solid #E7E5E4;
          padding-top: 14px;
        }
        .lp-quote-author {
          font-size: 14px;
          font-weight: 600;
          color: #1C1917;
          margin: 0;
        }
        .lp-quote-detail {
          font-size: 12px;
          color: #78716C;
          margin: 2px 0 0;
        }
        /* Bottom Banner */
        .lp-cta-banner {
          background: #064E3B;
          color: #FFFFFF;
          border-radius: 24px;
          padding: 52px 28px;
          text-align: center;
        }
        .lp-cta-banner h2 {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: -0.02em;
          margin: 0 0 14px;
        }
        .lp-cta-banner p {
          color: #D1FAE5;
          max-width: 580px;
          margin: 0 auto 28px;
          font-size: 16px;
        }
        .lp-btn-white {
          background: #FFFFFF;
          color: #064E3B;
          text-decoration: none;
          font-weight: 700;
          font-size: 15px;
          padding: 14px 26px;
          border-radius: 11px;
          display: inline-block;
        }
        /* Footer */
        .lp-footer {
          border-top: 1px solid #E7E5E4;
          padding: 36px 0;
          font-size: 12px;
          color: #78716C;
        }
        .lp-footer-inner {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 12px;
        }
        @media (max-width: 768px) {
          .lp-nav { display: none; }
          .lp-stats-box { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Top Navigation */}
      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <Link href="/" className="lp-brand">
            <span className="lp-logo-badge">LP</span>
            <span>LeavePath</span>
          </Link>

          <nav className="lp-nav">
            <a href="#benefits">What it covers</a>
            <a href="#examples">Worked examples</a>
            <a href="#testimonials">Parent stories</a>
            <a href="#how-it-works">How it works</a>
          </nav>

          <div className="lp-actions">
            <Link href="/login" className="lp-btn-ghost">
              Sign in
            </Link>
            <Link href="/plan" className="lp-btn-primary">
              Build my plan
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-container lp-hero-inner">
            <span className="lp-pill">
              Updated for 2026/27 &amp; 2027/28 UK statutory rates
            </span>
            <h1 className="lp-h1">
              Know exactly how parental leave affects your money.
            </h1>
            <p className="lp-subtitle">
              Model your month-by-month take-home pay across enhanced company
              leave, SMP (£194.32/wk rising to £201.11/wk in April 2027), Shared
              Parental Leave, and your return-to-work pattern—in five minutes.
            </p>
            <div className="lp-hero-cta">
              <Link href="/plan" className="lp-btn-primary lp-btn-large">
                Build my plan (5 minutes)
              </Link>
              <a href="#examples" className="lp-btn-secondary">
                See worked examples
              </a>
            </div>
            <p className="lp-trust">
              Free to model • No spreadsheets required • Built for UK parents
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section id="benefits" className="lp-section-white">
          <div className="lp-container">
            <p className="lp-eyebrow">Why parents use LeavePath</p>
            <h2 className="lp-h2">
              Every pay cliff, tax quirk, and childcare rule in one place
            </h2>
            <p className="lp-section-desc">
              HR policy PDFs only tell you gross percentages. LeavePath models
              what actually lands in your joint account every month.
            </p>

            <div className="lp-grid-3">
              {[
                {
                  title: "Month-by-month household cashflow",
                  desc: "See exact net pay across enhanced company weeks, statutory weeks, KIT days, and unpaid months—for both partners side by side.",
                },
                {
                  title: "The £100k Adjusted Net Income check",
                  desc: "Check whether bonuses, BIK, or return-to-work salary push either partner over £100,000—protecting Tax-Free Childcare and 30 funded hours.",
                },
                {
                  title: "4-day vs 5-day return comparison",
                  desc: "Compare 80% salary plus 1 fewer nursery day against full-time pay after tax, student loan, and marginal childcare costs.",
                },
                {
                  title: "Shared Parental Leave (SPL) splitter",
                  desc: "Test block-leave and curtailing scenarios to see if swapping weeks between partners increases total household income.",
                },
                {
                  title: "Accrued annual leave calculator",
                  desc: "Factor in bank holidays and accrued holiday pay so you can extend paid leave or ease back into work on phased hours.",
                },
                {
                  title: "Flexible working request builder",
                  desc: "Turn your chosen return pattern into a structured, statutory-compliant UK flexible working proposal ready to send to HR.",
                },
              ].map((item) => (
                <div key={item.title} className="lp-card-cream">
                  <div className="lp-accent-bar" />
                  <h3 className="lp-card-title">{item.title}</h3>
                  <p className="lp-card-text">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Worked Examples */}
        <section id="examples" className="lp-section-cream">
          <div className="lp-container">
            <p className="lp-eyebrow">Worked Examples</p>
            <h2 className="lp-h2">
              Real scenarios UK families model before locking in dates
            </h2>
            <p className="lp-section-desc">
              See how enhanced leave, KIT days, accrued holiday, and part-time
              return patterns play out in net pounds.
            </p>

            <div className="lp-grid-2">
              <div className="lp-card-white">
                <div className="lp-tag-row">
                  <span className="lp-tag-green">
                    Scenario A • 12 Months Leave + KIT Days
                  </span>
                  <span className="lp-meta">£68k + £52k household</span>
                </div>
                <h3 className="lp-card-title" style={{ fontSize: "20px" }}>
                  Smoothing the Months 7–12 statutory &amp; unpaid dip
                </h3>
                <p className="lp-card-text">
                  16 weeks full pay, 10 weeks 50% pay, 13 weeks SMP (£194.32/wk),
                  then 13 weeks unpaid—using 10 KIT days and 22 accrued holiday
                  days at month 12.
                </p>
                <div className="lp-stats-box">
                  <div>
                    <p className="lp-stat-label">Savings buffer needed</p>
                    <p className="lp-stat-val">£6,450</p>
                  </div>
                  <div>
                    <p className="lp-stat-label">KIT + leave boost</p>
                    <p className="lp-stat-val-green">+£4,120 net</p>
                  </div>
                  <div>
                    <p className="lp-stat-label">Tax refund due</p>
                    <p className="lp-stat-val">£1,180</p>
                  </div>
                </div>
              </div>

              <div className="lp-card-white">
                <div className="lp-tag-row">
                  <span className="lp-tag-amber">
                    Scenario B • Return to Work Pattern
                  </span>
                  <span className="lp-meta">£95k salary + nursery</span>
                </div>
                <h3 className="lp-card-title" style={{ fontSize: "20px" }}>
                  4 days/week vs 5 days/week with 1 child in nursery
                </h3>
                <p className="lp-card-text">
                  Comparing 80% hours (£76k) and 3 nursery days against 100%
                  hours (£95k) and 4 nursery days—including pension sacrifice
                  impact.
                </p>
                <div className="lp-stats-box">
                  <div>
                    <p className="lp-stat-label">Gross pay diff</p>
                    <p className="lp-stat-val">-£1,583/mo</p>
                  </div>
                  <div>
                    <p className="lp-stat-label">Net diff after nursery</p>
                    <p className="lp-stat-val-green">Only -£490/mo</p>
                  </div>
                  <div>
                    <p className="lp-stat-label">Extra day at home</p>
                    <p className="lp-stat-val">52 days/yr</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="lp-section-white">
          <div className="lp-container">
            <p className="lp-eyebrow">What Parents Say</p>
            <h2 className="lp-h2">
              Built to replace messy weekend spreadsheets
            </h2>
            <p className="lp-section-desc">
              How couples use LeavePath to plan leave length and return hours
              with confidence.
            </p>

            <div className="lp-grid-3">
              {[
                {
                  quote:
                    "Seeing the exact month our household income dipped—and how much we needed to set aside each month beforehand—took all the guesswork out of taking the full 12 months.",
                  author: "Hannah & Tom",
                  detail: "Manchester • First baby, 12-month leave",
                },
                {
                  quote:
                    "I assumed going back 4 days a week would cost us £1,200 a month. Once LeavePath factored in 42% marginal tax and one less day of nursery, the real difference was under £400.",
                  author: "Priya S.",
                  detail: "London • Returned on 0.8 FTE pattern",
                },
                {
                  quote:
                    "We used the Shared Parental Leave comparison to split months 8 to 11 so my partner took enhanced SPL while I went back—it saved us over £3,000 as a household.",
                  author: "Claire & Sam",
                  detail: "Bristol • Shared Parental Leave",
                },
              ].map((t) => (
                <div key={t.author} className="lp-quote-card">
                  <p className="lp-quote-text">“{t.quote}”</p>
                  <div className="lp-quote-footer">
                    <p className="lp-quote-author">{t.author}</p>
                    <p className="lp-quote-detail">{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section id="how-it-works" className="lp-section-cream">
          <div className="lp-container">
            <div className="lp-cta-banner">
              <h2>Build your personalised parental leave plan in 5 minutes</h2>
              <p>
                Enter your due date, salaries, and employer policy to get a
                clear month-by-month pay timeline and return-to-work comparison.
              </p>
              <Link href="/plan" className="lp-btn-white">
                Start my free plan →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <span>© 2026 LeavePath. Built for UK families.</span>
          <span>
            Guidance &amp; financial modelling tool only—not regulated financial
            or legal advice.
          </span>
        </div>
      </footer>
    </div>
  );
}
