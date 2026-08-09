'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { ApplicationRecord } from './application-types';
import HuntBuddyLogo from './hunt-buddy-logo';

type JobStatus = 'SAVED' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';

type JobApplication = {
  id: string;
  companyName: string;
  jobTitle: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  status: JobStatus;
  appliedAt: string;
  keySkills: string[];
  summary: string;
};

type EditableJobField = Exclude<keyof JobApplication, 'id'>;
type ManualTextField = Exclude<EditableJobField, 'status' | 'keySkills'>;
type ApplicationInsert = {
  user_id: string;
  company_name: string;
  job_title: string;
  location: string;
  employment_type: string;
  salary_range: string;
  key_skills: string[];
  summary: string;
  status: JobStatus;
  applied_at?: string;
};
type ApplicationUpdate = Partial<Omit<ApplicationInsert, 'user_id'>>;
type ApplicationFieldUpdate = Omit<ApplicationUpdate, 'applied_at'> & {
  applied_at?: string | null;
};

type ParsedJob = {
  company_name?: string;
  job_title?: string;
  location?: string;
  employment_type?: string;
  salary_range?: string;
  key_skills?: string[];
  summary?: string;
};

const emptyJob = (): Omit<JobApplication, 'id'> => ({
  companyName: '',
  jobTitle: '',
  location: '',
  employmentType: '',
  salaryRange: '',
  status: 'APPLIED',
  appliedAt: '',
  keySkills: [],
  summary: '',
});

const statuses: JobStatus[] = ['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];

const manualTextFields: Array<[ManualTextField, string]> = [
  ['companyName', 'Company name'],
  ['jobTitle', 'Job title'],
  ['location', 'Location'],
  ['employmentType', 'Employment type'],
  ['salaryRange', 'Salary range'],
  ['appliedAt', 'Applied date'],
  ['summary', 'Summary'],
];

const statStyles: Record<JobStatus, string> = {
  SAVED: 'bg-slate-100 text-slate-700',
  APPLIED: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-amber-100 text-amber-800',
  OFFER: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
};

function Icon({ name }: { name: 'briefcase' | 'calendar' | 'plus' | 'spark' | 'logout' | 'sun' | 'moon' | 'trash' }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (name === 'calendar') {
    return <svg {...common}><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /></svg>;
  }

  if (name === 'plus') {
    return <svg {...common}><path d="M12 5v14" /><path d="M5 12h14" /></svg>;
  }

  if (name === 'spark') {
    return <svg {...common}><path d="M12 3l1.9 5.4L19 10l-5.1 1.6L12 17l-1.9-5.4L5 10l5.1-1.6L12 3z" /><path d="M19 16l.7 2 .3 1 .3-1 .7-2 .7 2 .3 1 .3-1 .7-2" /></svg>;
  }

  if (name === 'logout') {
    return <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>;
  }

  if (name === 'sun') {
    return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M4.93 4.93l1.41 1.41" /><path d="M17.66 17.66l1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="M6.34 17.66l-1.41 1.41" /><path d="M19.07 4.93l-1.41 1.41" /></svg>;
  }

  if (name === 'moon') {
    return <svg {...common}><path d="M20.99 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.78 9.79z" /></svg>;
  }

  if (name === 'trash') {
    return <svg {...common}><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /></svg>;
  }

  return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></svg>;
}

export default function DashboardClient({
  demoMode = false,
  initialApplications,
  userEmail,
  userId,
}: {
  demoMode?: boolean;
  initialApplications: ApplicationRecord[];
  userEmail: string;
  userId: string;
}) {
  const [jobs, setJobs] = useState<JobApplication[]>(() => initialApplications.map(applicationToJob));
  const [rawText, setRawText] = useState('');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualJob, setManualJob] = useState(emptyJob());
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => (
    typeof window !== 'undefined' && localStorage.getItem('hunt-buddy-theme') === 'dark'
  ));
  const router = useRouter();
  const supabase = createClient();

  const toggleTheme = () => {
    setIsDarkMode((currentMode) => {
      const nextMode = !currentMode;
      localStorage.setItem('hunt-buddy-theme', nextMode ? 'dark' : 'light');
      return nextMode;
    });
  };

  const currentDate = useMemo(() => new Date(), []);
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: totalDays }, (_, index) => index + 1),
    ];
  }, [currentDate]);
  const trackerStats = useMemo(() => {
    const uniqueCompanies = new Set(
      jobs
        .map((job) => job.companyName.trim().toLowerCase())
        .filter(Boolean)
    );
    const statusCounts = statuses.reduce<Record<JobStatus, number>>((counts, status) => {
      counts[status] = jobs.filter((job) => job.status === status).length;
      return counts;
    }, {
      SAVED: 0,
      APPLIED: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
    });

    return {
      totalApplications: jobs.length,
      totalCompanies: uniqueCompanies.size,
      statusCounts,
    };
  }, [jobs]);
  const displayedJobs = useMemo(() => rejectedLast(jobs), [jobs]);

  const insertJob = async (job: Omit<JobApplication, 'id'>) => {
    if (demoMode) {
      setJobs((currentJobs) => [{ id: `demo-${Date.now()}`, ...job }, ...currentJobs]);
      return;
    }

    const payload = jobToInsert(job, userId);
    const { data, error } = await supabase
      .from('applications')
      .insert(payload)
      .select('id,user_id,company_name,job_title,location,employment_type,salary_range,key_skills,summary,status,applied_at,updated_at')
      .single();

    if (error) {
      throw error;
    }

    setJobs((currentJobs) => [applicationToJob(data as ApplicationRecord), ...currentJobs]);
  };

  const updateJobLocal = <Field extends EditableJobField>(
    id: string,
    field: Field,
    value: JobApplication[Field]
  ) => {
    setJobs((currentJobs) =>
      currentJobs.map((job): JobApplication => (job.id === id ? { ...job, [field]: value } : job))
    );
  };

  const persistJobField = async <Field extends EditableJobField>(
    id: string,
    field: Field,
    value: JobApplication[Field]
  ) => {
    const payload = fieldToUpdate(field, value);
    if (!payload) return;

    if (demoMode) {
      setMessage('Demo changes saved locally.');
      return;
    }

    setSavingId(id);
    const { error } = await supabase
      .from('applications')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    setSavingId(null);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Changes saved.');
  };

  const toggleSelectedJob = (id: string) => {
    setSelectedJobIds((currentIds) =>
      currentIds.includes(id) ? currentIds.filter((currentId) => currentId !== id) : [...currentIds, id]
    );
  };

  const deleteSelectedJobs = async () => {
    if (!deleteMode) {
      setDeleteMode(true);
      setSelectedJobIds([]);
      return;
    }

    if (selectedJobIds.length === 0) {
      setMessage('Select a job listing to delete.');
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedJobIds.length} selected job listing${selectedJobIds.length === 1 ? '' : 's'}?`);
    if (!confirmed) return;

    setDeletingId('selected');
    setMessage('');

    if (demoMode) {
      setJobs((currentJobs) => currentJobs.filter((job) => !selectedJobIds.includes(job.id)));
      setSelectedJobIds([]);
      setDeleteMode(false);
      setDeletingId(null);
      setMessage('Selected demo listings deleted.');
      return;
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .in('id', selectedJobIds)
      .eq('user_id', userId);

    setDeletingId(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setJobs((currentJobs) => currentJobs.filter((job) => !selectedJobIds.includes(job.id)));
    setSelectedJobIds([]);
    setDeleteMode(false);
    setMessage('Selected job listings deleted.');
  };

  const handleParseJob = async () => {
    if (!rawText.trim()) {
      setMessage('Paste a job listing before using AI import.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      if (demoMode) {
        const lines = rawText.split('\n').map((line) => line.trim()).filter(Boolean);
        await insertJob({
          companyName: lines[0] ?? 'Demo company',
          jobTitle: lines[1] ?? 'Imported role',
          location: 'Demo location',
          employmentType: 'Full-time',
          salaryRange: 'Not listed',
          status: 'APPLIED',
          appliedAt: '',
          keySkills: ['AI import', 'Job tracking'],
          summary: rawText.slice(0, 180),
        });
        setRawText('');
        setMessage('Demo job added locally.');
        return;
      }

      const response = await fetch('/api/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });

      if (!response.ok) {
        throw new Error('Could not parse this listing.');
      }

      const parsedJob = (await response.json()) as ParsedJob;
      await insertJob({
        companyName: parsedJob.company_name ?? 'Unknown company',
        jobTitle: parsedJob.job_title ?? 'Untitled role',
        location: parsedJob.location ?? 'Not listed',
        employmentType: parsedJob.employment_type ?? 'Not listed',
        salaryRange: parsedJob.salary_range ?? 'Not listed',
        status: 'APPLIED',
        appliedAt: '',
        keySkills: parsedJob.key_skills ?? [],
        summary: parsedJob.summary ?? '',
      });
      setRawText('');
      setMessage('Job added from pasted listing.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    insertJob(manualJob)
      .then(() => {
        setManualJob(emptyJob());
        setManualOpen(false);
        setMessage('Manual job added.');
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : 'Could not add this job.');
      })
      .finally(() => setLoading(false));
  };

  const handleSignOut = async () => {
    if (demoMode) {
      router.push('/');
      return;
    }

    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <main
      className={`min-h-screen transition-colors ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f7f3ea] text-slate-950'}`}
      style={{ fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }}
    >
      <div className="flex min-h-screen">
        <aside className={`hidden w-64 shrink-0 border-r px-5 py-6 transition-colors lg:block ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-[#fbf8f1]'}`}>
          <div className="mb-8 flex items-center gap-3">
            <HuntBuddyLogo size={40} />
            <div>
              <p className="text-sm font-bold">Hunt Buddy</p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Job Tracker</p>
            </div>
          </div>

          <nav className="space-y-1">
            <button className="flex w-full items-center gap-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
              <Icon name="briefcase" />
              Applications
            </button>
            <button className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>
              <Icon name="calendar" />
              Calendar (soon)
            </button>
          </nav>

          <section className={`mt-8 rounded-lg border p-4 transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-stone-200 bg-[#fffdf8]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">{monthLabel}</p>
              <Icon name="calendar" />
            </div>
            <div className={`grid grid-cols-7 gap-1 text-center text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
              {days.map((day, index) => (
                <button
                  key={`${day ?? 'blank'}-${index}`}
                  disabled={!day}
                  className={`aspect-square rounded-md text-xs transition-colors ${day === currentDate.getDate() ? 'bg-blue-600 text-white' : isDarkMode ? 'hover:bg-slate-800 disabled:hover:bg-transparent' : 'hover:bg-slate-100 disabled:hover:bg-transparent'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </section>

          <section className={`mt-4 rounded-lg border p-4 transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-stone-200 bg-[#fffdf8]'}`}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Tracker stats</p>
              <Icon name="briefcase" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className={`rounded-lg border p-3 text-center ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-[#f7f3ea]'}`}>
                <p className="text-xl font-bold">{trackerStats.totalApplications}</p>
                <p className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Applications</p>
              </div>
              <div className={`rounded-lg border p-3 text-center ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-[#f7f3ea]'}`}>
                <p className="text-xl font-bold">{trackerStats.totalCompanies}</p>
                <p className={`text-[11px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Companies</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {statuses.map((status) => (
                <div key={status} className="flex items-center justify-between gap-3 text-sm">
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statStyles[status]}`}>
                    {statusLabel(status)}
                  </span>
                  <span className="font-semibold">{trackerStats.statusCounts[status]}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <header className={`mb-6 flex flex-col gap-4 border-b pb-5 transition-colors sm:flex-row sm:items-center sm:justify-between ${isDarkMode ? 'border-slate-800' : 'border-stone-200'}`}>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{userEmail}</p>
              <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>{demoMode ? 'Demo workspace' : 'Welcome Back!'}</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setManualOpen((open) => !open)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-100 hover:border-blue-500' : 'border-stone-300 bg-[#fffdf8] text-slate-700 hover:border-blue-300'}`}
              >
                <Icon name="plus" />
                Add manually
              </button>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                <Icon name="logout" />
                {demoMode ? 'Exit demo' : 'Sign out'}
              </button>
            </div>
          </header>

          <section className={`mb-5 rounded-lg border p-4 shadow-sm transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-[#fffdf8]'}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold">AI job import</h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Paste the full listing and let AI fill the tracker.</p>
              </div>
              <button
                onClick={handleParseJob}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                <Icon name="spark" />
                {loading ? 'Reading...' : 'Add with AI'}
              </button>
            </div>
            <textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Paste a job description here..."
              className={`min-h-32 w-full resize-y rounded-lg border px-3 py-3 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:bg-slate-950' : 'border-stone-200 bg-[#f7f3ea] text-slate-900 focus:bg-[#fffdf8]'}`}
            />
            {message && <p className={`mt-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{savingId ? 'Saving changes...' : message}</p>}
          </section>

          {manualOpen && (
            <form onSubmit={handleManualSubmit} className={`mb-5 grid gap-3 rounded-lg border p-4 shadow-sm transition-colors md:grid-cols-3 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-[#fffdf8]'}`}>
              {manualTextFields.map(([field, label]) => (
                <label key={field} className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {label}
                  <input
                    required={field === 'companyName' || field === 'jobTitle'}
                    type={field === 'appliedAt' ? 'date' : 'text'}
                    value={manualJob[field]}
                    onChange={(event) => setManualJob({ ...manualJob, [field]: event.target.value })}
                    className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-900'}`}
                  />
                </label>
              ))}
              <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Status
                <select
                  value={manualJob.status}
                  onChange={(event) => setManualJob({ ...manualJob, status: event.target.value as JobStatus })}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-900'}`}
                >
                  {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                </select>
              </label>
              <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Key skills
                <input
                  value={manualJob.keySkills.join(', ')}
                  onChange={(event) => setManualJob({ ...manualJob, keySkills: splitSkills(event.target.value) })}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-900'}`}
                />
              </label>
              <div className="flex items-end">
                <button disabled={loading} className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
                  {loading ? 'Saving...' : 'Save job'}
                </button>
              </div>
            </form>
          )}

          <section className={`overflow-hidden rounded-lg border shadow-sm transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-[#fffdf8]'}`}>
            <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${isDarkMode ? 'border-slate-800' : 'border-stone-200'}`}>
              <h2 className="text-base font-bold">Job tracker</h2>
              <div className="flex items-center gap-2">
                {deleteMode && (
                  <button
                    onClick={() => {
                      setDeleteMode(false);
                      setSelectedJobIds([]);
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-stone-300 text-slate-700 hover:bg-[#f7f3ea]'}`}
                  >
                    Cancel
                  </button>
                )}
                <button
                  aria-label={deleteMode ? 'Delete selected listings' : 'Choose listings to delete'}
                  onClick={deleteSelectedJobs}
                  disabled={deletingId === 'selected'}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${deleteMode ? isDarkMode ? 'border-rose-900/70 bg-rose-950/40 text-rose-200 hover:bg-rose-950' : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-stone-300 text-slate-700 hover:bg-[#f7f3ea]'}`}
                >
                  <Icon name="trash" />
                  {deleteMode ? selectedJobIds.length > 0 ? `Delete ${selectedJobIds.length}` : 'Select rows' : 'Delete'}
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full border-collapse text-center text-sm">
                <thead className={`text-xs uppercase ${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-[#f2ecdf] text-slate-500'}`}>
                  <tr>
                    {deleteMode && <th className="w-12 px-3 py-3 text-center font-semibold">Pick</th>}
                    {['Company', 'Job Title', 'Location', 'Type', 'Salary', 'Status', 'Applied', 'Skills', 'Summary'].map((heading) => (
                      <th key={heading} className="px-3 py-3 text-center font-semibold">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-stone-100'}`}>
                  {displayedJobs.map((job) => (
                    <tr key={job.id} className={`align-top transition-colors ${isDarkMode ? 'hover:bg-slate-800/70' : 'hover:bg-[#f7f3ea]'}`}>
                      {deleteMode && (
                        <td className="px-3 py-3">
                          <input
                            aria-label={`Select ${job.companyName || job.jobTitle}`}
                            checked={selectedJobIds.includes(job.id)}
                            onChange={() => toggleSelectedJob(job.id)}
                            type="checkbox"
                            className="h-4 w-4 rounded border-stone-300 text-blue-600"
                          />
                        </td>
                      )}
                      <td className="px-3 py-3"><Editable isDarkMode={isDarkMode} value={job.companyName} onChange={(value) => updateJobLocal(job.id, 'companyName', value)} onCommit={(value) => persistJobField(job.id, 'companyName', value)} /></td>
                      <td className="px-3 py-3"><Editable isDarkMode={isDarkMode} value={job.jobTitle} onChange={(value) => updateJobLocal(job.id, 'jobTitle', value)} onCommit={(value) => persistJobField(job.id, 'jobTitle', value)} /></td>
                      <td className="px-3 py-3"><Editable isDarkMode={isDarkMode} value={job.location} onChange={(value) => updateJobLocal(job.id, 'location', value)} onCommit={(value) => persistJobField(job.id, 'location', value)} /></td>
                      <td className="px-3 py-3"><Editable isDarkMode={isDarkMode} value={job.employmentType} onChange={(value) => updateJobLocal(job.id, 'employmentType', value)} onCommit={(value) => persistJobField(job.id, 'employmentType', value)} /></td>
                      <td className="px-3 py-3"><Editable isDarkMode={isDarkMode} value={job.salaryRange} onChange={(value) => updateJobLocal(job.id, 'salaryRange', value)} onCommit={(value) => persistJobField(job.id, 'salaryRange', value)} /></td>
                      <td className="px-3 py-3">
                        <select
                          value={job.status}
                          onChange={(event) => {
                            const status = event.target.value as JobStatus;
                            updateJobLocal(job.id, 'status', status);
                            persistJobField(job.id, 'status', status);
                          }}
                          className={`rounded-full border-0 px-2 py-1 text-center text-xs font-semibold outline-none ${statStyles[job.status]}`}
                        >
                          {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-3"><Editable isDarkMode={isDarkMode} type="date" value={job.appliedAt} onChange={(value) => updateJobLocal(job.id, 'appliedAt', value)} onCommit={(value) => persistJobField(job.id, 'appliedAt', value)} /></td>
                      <td className="px-3 py-3"><Editable isDarkMode={isDarkMode} value={job.keySkills.join(', ')} onChange={(value) => updateJobLocal(job.id, 'keySkills', splitSkills(value))} onCommit={(value) => persistJobField(job.id, 'keySkills', splitSkills(value))} /></td>
                      <td className="px-3 py-3"><Editable isDarkMode={isDarkMode} value={job.summary} onChange={(value) => updateJobLocal(job.id, 'summary', value)} onCommit={(value) => persistJobField(job.id, 'summary', value)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
      <button
        aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        onClick={toggleTheme}
        className={`fixed bottom-5 left-5 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-lg transition-colors ${isDarkMode ? 'border-slate-700 bg-slate-900 text-amber-300 hover:bg-slate-800' : 'border-stone-200 bg-[#fffdf8] text-slate-700 hover:border-blue-300'}`}
      >
        <Icon name={isDarkMode ? 'sun' : 'moon'} />
      </button>
    </main>
  );
}

function Editable({
  value,
  onChange,
  onCommit,
  isDarkMode,
  type = 'text',
}: {
  value: string;
  onChange: (value: string) => void;
  onCommit: (value: string) => void;
  isDarkMode: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={(event) => onCommit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur();
        }
      }}
      className={`w-full min-w-28 rounded-md border border-transparent bg-transparent px-2 py-1 text-center text-sm outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${isDarkMode ? 'text-slate-100 hover:border-slate-700 hover:bg-slate-950 focus:bg-slate-950' : 'text-slate-800 hover:border-stone-200 hover:bg-[#fffdf8] focus:bg-[#fffdf8]'}`}
    />
  );
}

function applicationToJob(application: ApplicationRecord): JobApplication {
  return {
    id: application.id,
    companyName: application.company_name,
    jobTitle: application.job_title,
    location: application.location ?? '',
    employmentType: application.employment_type ?? '',
    salaryRange: application.salary_range ?? '',
    status: normalizeStatus(application.status),
    appliedAt: application.applied_at ? application.applied_at.slice(0, 10) : '',
    keySkills: application.key_skills ?? [],
    summary: application.summary ?? '',
  };
}

function jobToInsert(job: Omit<JobApplication, 'id'>, userId: string): ApplicationInsert {
  const payload: ApplicationInsert = {
    user_id: userId,
    company_name: job.companyName,
    job_title: job.jobTitle,
    location: job.location,
    employment_type: job.employmentType,
    salary_range: job.salaryRange,
    key_skills: job.keySkills,
    summary: job.summary,
    status: job.status,
  };

  if (job.appliedAt) {
    payload.applied_at = new Date(`${job.appliedAt}T00:00:00`).toISOString();
  }

  return payload;
}

function fieldToUpdate<Field extends EditableJobField>(
  field: Field,
  value: JobApplication[Field]
): ApplicationFieldUpdate | null {
  if (field === 'companyName') return { company_name: value as string };
  if (field === 'jobTitle') return { job_title: value as string };
  if (field === 'location') return { location: value as string };
  if (field === 'employmentType') return { employment_type: value as string };
  if (field === 'salaryRange') return { salary_range: value as string };
  if (field === 'status') return { status: value as JobStatus };
  if (field === 'keySkills') return { key_skills: value as string[] };
  if (field === 'summary') return { summary: value as string };
  if (field === 'appliedAt') {
    return { applied_at: value ? new Date(`${value}T00:00:00`).toISOString() : null };
  }
  return null;
}

function splitSkills(value: string) {
  return value
    .split(',')
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function normalizeStatus(status: string | null): JobStatus {
  if (status === 'SAVED' || status === 'APPLIED' || status === 'INTERVIEW' || status === 'OFFER' || status === 'REJECTED') {
    return status;
  }

  return 'APPLIED';
}

function statusLabel(status: JobStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function rejectedLast(jobs: JobApplication[]) {
  return jobs
    .map((job, index) => ({ job, index }))
    .sort((first, second) => {
      if (first.job.status === second.job.status) {
        return first.index - second.index;
      }

      if (first.job.status === 'REJECTED') {
        return 1;
      }

      if (second.job.status === 'REJECTED') {
        return -1;
      }

      return first.index - second.index;
    })
    .map(({ job }) => job);
}
