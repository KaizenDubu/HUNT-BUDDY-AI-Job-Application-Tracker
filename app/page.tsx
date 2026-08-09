import Link from 'next/link';
import HuntBuddyLogo from './hunt-buddy-logo';

const demoRows = [
  { company: 'Northstar Labs', title: 'Frontend Engineer', status: 'Applied', color: 'text-blue-700', bg: 'bg-blue-50' },
  { company: 'Metro Systems', title: 'Product Designer', status: 'Interview', color: 'text-amber-800', bg: 'bg-amber-50' },
  { company: 'OrbitWorks', title: 'Data Analyst', status: 'Saved', color: 'text-slate-700', bg: 'bg-slate-100' },
  { company: 'Wavefront AI', title: 'ML Engineer', status: 'Offer', color: 'text-emerald-700', bg: 'bg-emerald-50' },
];

const features = [
  {
    title: 'AI job parsing',
    description: 'Paste a full job listing and extract company, role, location, salary, skills, and summary into your tracker instantly.',
    icon: <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />,
  },
  {
    title: 'Application control',
    description: 'Track statuses, edit details inline, remove old listings, and keep rejected roles sorted below active opportunities.',
    icon: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
  },
  {
    title: 'Private workspace',
    description: 'Keep every application tied to your account with Supabase authentication and user-owned records.',
    icon: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  },
];

const steps = [
  { number: '01', title: 'Copy any job listing', description: 'Find a role on LinkedIn, Indeed, or a company site, then copy the full listing text.' },
  { number: '02', title: 'Paste and parse', description: 'Drop it into Hunt Buddy and AI extracts title, company, salary, skills, and summary.' },
  { number: '03', title: 'Track your pipeline', description: 'Update statuses, edit details, and keep your applications organized in one workspace.' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950" style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }}>
      <header className="sticky top-0 z-50 border-b border-blue-50 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <HuntBuddyLogo size={32} />
            <span className="text-[17px] font-bold tracking-tight">Hunt Buddy</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/demo" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100">
              Demo
            </Link>
            <Link href="/login" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800">
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      <section className="overflow-hidden bg-[linear-gradient(170deg,#f0f5ff_0%,#ffffff_58%)] px-5 pb-0 pt-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
              AI-powered job tracker
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl text-center text-4xl font-extrabold leading-[1.05] tracking-[-1.5px] text-slate-950 sm:text-6xl lg:text-7xl">
            Stop losing jobs
            <span className="block bg-[linear-gradient(135deg,#2563eb_0%,#6366f1_100%)] bg-clip-text text-transparent">
              you wanted to apply to.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-center text-base leading-8 text-slate-500 sm:text-lg">
            Paste any job listing and Hunt Buddy&apos;s AI extracts every detail into your personal tracker, organized by company, role, status, and skills.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-[linear-gradient(135deg,#2563eb,#4f46e5)] px-6 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition-shadow hover:shadow-[0_12px_32px_rgba(37,99,235,0.45)]">
              Start actual mode
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/demo" className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-500 hover:text-blue-700">
              Try demo mode
            </Link>
          </div>

          <div className="mx-auto mt-16 max-w-4xl origin-top overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-[0_32px_80px_rgba(37,99,235,0.18),0_8px_24px_rgba(0,0,0,0.08)] lg:[transform:perspective(1200px)_rotateX(4deg)]">
            <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="mx-3 h-5 flex-1 rounded-md bg-slate-200" />
            </div>

            <div className="grid min-h-72 lg:grid-cols-[220px_1fr]">
              <aside className="border-b border-slate-200 bg-slate-50 p-4 lg:border-b-0 lg:border-r">
                <p className="mb-2 text-xs font-semibold text-slate-500">Paste job listing</p>
                <div className="h-28 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">
                  Senior Frontend Engineer. Remote. Full-time. Experience with React, TypeScript...
                </div>
                <div className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white">
                  Add with AI
                </div>
                <div className="mt-3 flex flex-wrap gap-1 border-t border-slate-200 pt-3">
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700">Applied 8</span>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800">Interview 3</span>
                  <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-700">Rejected 2</span>
                </div>
              </aside>

              <div className="overflow-x-auto">
                <table className="min-w-[620px] w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      {['Company', 'Job Title', 'Status'].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-slate-400">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {demoRows.map((row) => (
                      <tr key={row.company} className="border-t border-slate-50 transition-colors hover:bg-blue-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">{row.company}</td>
                        <td className="px-4 py-3 text-blue-600">{row.title}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${row.bg} ${row.color}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">What you get</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Everything your job hunt needs</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-blue-50 bg-[#f8faff] p-7 transition-colors hover:border-blue-200 hover:bg-[#f0f5ff]">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-950">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(135deg,#0f172a_0%,#1e3a8a_100%)] px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Up and running in 60 seconds</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <article key={step.number} className="rounded-2xl border border-white/10 bg-white/[0.05] p-7">
                <span className="block text-5xl font-black leading-none tracking-[-2px] text-white/10">{step.number}</span>
                <h3 className="mt-5 text-base font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-28 text-center sm:px-8">
        <div className="mx-auto max-w-xl">
          <div className="flex justify-center">
            <HuntBuddyLogo size={48} />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            Ready to take control of your job search?
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-500">
            No spreadsheets. No lost tabs. Just your jobs, organized.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login" className="w-full rounded-xl bg-[linear-gradient(135deg,#2563eb,#4f46e5)] px-8 py-3.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(37,99,235,0.3)] transition-shadow hover:shadow-[0_12px_32px_rgba(37,99,235,0.45)] sm:w-auto">
              Get started free
            </Link>
            <Link href="/demo" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-8 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-500 sm:w-auto">
              Try demo first
            </Link>
          </div>
        </div>
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t border-slate-100 px-5 py-8 sm:flex-row sm:px-8">
        <div className="flex items-center gap-2">
          <HuntBuddyLogo size={22} />
          <span className="text-sm font-semibold text-slate-500">Hunt Buddy</span>
        </div>
        <p className="text-xs text-slate-400">© 2026 Hunt Buddy. All rights reserved.</p>
      </footer>
    </main>
  );
}
