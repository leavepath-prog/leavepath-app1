import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 selection:bg-emerald-100">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#FAF9F6]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-800 text-sm font-semibold text-white">
              LP
            </span>
            <span className="text-lg font-semibold tracking-tight text-stone-900">
              LeavePath
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-stone-600 md:flex">
            <a href="#benefits" className="transition hover:text-stone-900">
              What it covers
            </a>
            <a href="#examples" className="transition hover:text-stone-900">
              Worked examples
            </a>
            <a href="#testimonials" className="transition hover:text-stone-900">
              Parent stories
            </a>
            <a href="#how-it-works" className="transition hover:text-stone-900">
              How it works
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-200/60"
            >
              Sign in
            </Link>
            <Link
              href="/plan"
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-900"
            >
              Build my plan
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-medium text-emerald-900">
              Updated for 2026/27 & 2027/28 UK statutory rates
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl sm:leading-[1.12]">
              Know exactly how parental leave affects your money.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-stone-600">
              Model your month-by-month take-home pay across enhanced company
              leave, SMP (£194.32/wk rising to £201.11/wk in April 2027), Shared
              Parental Leave, and your return-to-work pattern—in five minutes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/plan"
                className="w-full rounded-xl bg-emerald-800 px-6 py-3.5 text-base font-medium text-white shadow-sm transition hover:bg-emerald-900 sm:w-auto"
              >
                Build my plan (5 minutes)
              </Link>
              <a
                href="#examples"
                className="w-full rounded-xl border border-stone-300 bg-white px-6 py-3.5 text-base font-medium text-stone-800 transition hover:bg-stone-50 sm:w-auto"
              >
                See worked examples
              </a>
            </div>
            <p className="mt-4 text-xs text-stone-500">
              Free to model • No spreadsheets required • Built for UK parents
            </p>
          </div>
        </section>

        {/* Benefits Section */}
        <section
          id="benefits"
          className="border-y border-stone-200/80 bg-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                Why parents use LeavePath
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
                Every pay cliff, tax quirk, and childcare rule in one place
              </h2>
              <p className="mt-3 text-base text-stone-600">
                HR policy PDFs only tell you gross percentages. LeavePath models
                what actually lands in your joint account every month.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                <div
                  key={item.title}
                  className="rounded-2xl border border-stone-200/90 bg-[#FAF9F6] p-6"
                >
                  <div className="mb-3 h-2 w-8 rounded-full bg-emerald-800" />
                  <h3 className="text-base font-semibold text-stone-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Worked Examples Section */}
        <section id="examples" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
              Worked Examples
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
              Real scenarios UK families model before locking in dates
            </h2>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {/* Example 1 */}
            <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                  Scenario A • 12 Months Leave + KIT Days
                </span>
                <span className="text-xs text-stone-500">£68k + £52k household</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-stone-900">
                Smoothing the Months 7–12 statutory & unpaid dip
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                16 weeks full pay, 10 weeks 50% pay, 13 weeks SMP (£194.32/wk),
                then 13 weeks unpaid—using 10 KIT days and 22 accrued holiday
                days at month 12.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-stone-50 p-4 text-center">
                <div>
                  <p className="text-xs text-stone-500">Savings buffer needed</p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    £6,450
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">KIT + leave boost</p>
                  <p className="mt-1 text-base font-semibold text-emerald-800">
                    +£4,120 net
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Tax refund due</p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    £1,180
                  </p>
                </div>
              </div>
            </div>

            {/* Example 2 */}
            <div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                  Scenario B • Return to Work Pattern
                </span>
                <span className="text-xs text-stone-500">£95k salary + nursery</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-stone-900">
                4 days/week vs 5 days/week with 1 child in nursery
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Comparing 80% hours (£76k) and 3 nursery days against 100% hours
                (£95k) and 4 nursery days—including pension sacrifice impact.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl bg-stone-50 p-4 text-center">
                <div>
                  <p className="text-xs text-stone-500">Gross pay diff</p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    -£1,583/mo
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Net diff after nursery</p>
                  <p className="mt-1 text-base font-semibold text-emerald-800">
                    Only -£490/mo
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-500">Extra day at home</p>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    52 days/yr
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section
          id="testimonials"
          className="border-y border-stone-200/80 bg-white py-16 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                What Parents Say
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">
                Built to replace messy weekend spreadsheets
              </h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
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
                <figure
                  key={t.author}
                  className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-[#FAF9F6] p-6"
                >
                  <blockquote className="text-sm leading-relaxed text-stone-700">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-5 border-t border-stone-200/80 pt-4">
                    <p className="text-sm font-semibold text-stone-900">
                      {t.author}
                    </p>
                    <p className="text-xs text-stone-500">{t.detail}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works + Bottom CTA */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="rounded-3xl bg-emerald-900 px-6 py-12 text-center text-white sm:px-12">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Build your personalised parental leave plan in 5 minutes
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-emerald-100">
              Enter your due date, salaries, and employer policy to get a clear
              month-by-month pay timeline and return-to-work comparison.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/plan"
                className="rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-50"
              >
                Start my free plan →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-[#FAF9F6] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-xs text-stone-500 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} LeavePath. Built for UK families.</p>
          <p>
            Guidance & financial modelling tool only—not regulated financial or
            legal advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
