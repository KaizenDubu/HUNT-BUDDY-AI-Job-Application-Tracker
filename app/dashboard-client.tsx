'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
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
type ModalMode = 'add' | 'edit';
type StatusFilter = JobStatus | 'ALL';
type DashboardSection = 'applications' | 'calendar';
type CalendarEventType = 'APPLIED' | 'INTERVIEW' | 'FOLLOW_UP' | 'REMINDER';
type CalendarReminderType = Exclude<CalendarEventType, 'APPLIED'>;
type CalendarReminder = {
  id: string;
  applicationId: string;
  title: string;
  date: string;
  type: CalendarReminderType;
  note: string;
  createdAt: string;
};
type CalendarReminderForm = Omit<CalendarReminder, 'id' | 'createdAt'>;
type CalendarEvent = {
  id: string;
  applicationId: string;
  companyName: string;
  jobTitle: string;
  title: string;
  date: string;
  type: CalendarEventType;
  note: string;
  reminderId?: string;
};
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
const statusTabs: StatusFilter[] = ['ALL', ...statuses];
const reminderTypes: CalendarReminderType[] = ['FOLLOW_UP', 'INTERVIEW', 'REMINDER'];

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

const calendarTypeStyles: Record<CalendarEventType, string> = {
  APPLIED: 'bg-blue-100 text-blue-700',
  INTERVIEW: 'bg-amber-100 text-amber-800',
  FOLLOW_UP: 'bg-violet-100 text-violet-700',
  REMINDER: 'bg-slate-100 text-slate-700',
};

const calendarDotStyles: Record<CalendarEventType, string> = {
  APPLIED: 'bg-blue-500',
  INTERVIEW: 'bg-amber-500',
  FOLLOW_UP: 'bg-violet-500',
  REMINDER: 'bg-slate-500',
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
  const reminderStorageKey = `hunt-buddy-calendar-reminders-${demoMode ? 'demo' : userId}`;
  const [jobs, setJobs] = useState<JobApplication[]>(() => initialApplications.map(applicationToJob));
  const [rawText, setRawText] = useState('');
  const [activeSection, setActiveSection] = useState<DashboardSection>('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [jobModal, setJobModal] = useState<{
    isOpen: boolean;
    mode: ModalMode;
    jobId: string | null;
    values: Omit<JobApplication, 'id'>;
  }>(() => ({
    isOpen: false,
    mode: 'add',
    jobId: null,
    values: emptyJob(),
  }));
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const [calendarReminders, setCalendarReminders] = useState<CalendarReminder[]>(() =>
    readCalendarReminders(reminderStorageKey)
  );
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState<CalendarReminderForm>(() => ({
    applicationId: '',
    title: '',
    date: toDateInputValue(new Date()),
    type: 'FOLLOW_UP',
    note: '',
  }));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => toDateInputValue(new Date()));
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
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

  useEffect(() => {
    try {
      localStorage.setItem(reminderStorageKey, JSON.stringify(calendarReminders));
    } catch {
      return;
    }
  }, [calendarReminders, reminderStorageKey]);

  const toggleTheme = () => {
    setIsDarkMode((currentMode) => {
      const nextMode = !currentMode;
      localStorage.setItem('hunt-buddy-theme', nextMode ? 'dark' : 'light');
      return nextMode;
    });
  };

  const currentDate = useMemo(() => new Date(), []);
  const todayDate = toDateInputValue(currentDate);
  const monthLabel = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return [
      ...Array.from({ length: firstDay }, () => null),
      ...Array.from({ length: totalDays }, (_, index) => index + 1),
    ];
  }, [calendarMonth]);
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
  const filteredJobs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return displayedJobs.filter((job) => {
      const matchesSearch =
        !normalizedQuery ||
        [job.companyName, job.jobTitle, job.location]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [displayedJobs, searchQuery, statusFilter]);
  const detailJob = useMemo(
    () => jobs.find((job) => job.id === detailJobId) ?? null,
    [jobs, detailJobId]
  );
  const calendarEvents = useMemo(() => buildCalendarEvents(jobs, calendarReminders), [jobs, calendarReminders]);
  const calendarEventsByDate = useMemo(() => {
    return calendarEvents.reduce<Record<string, CalendarEvent[]>>((eventsByDate, event) => {
      eventsByDate[event.date] = [...(eventsByDate[event.date] ?? []), event];
      return eventsByDate;
    }, {});
  }, [calendarEvents]);
  const selectedDayEvents = calendarEventsByDate[selectedCalendarDate] ?? [];
  const upcomingEvents = useMemo(
    () => calendarEvents.filter((event) => event.date >= todayDate).slice(0, 5),
    [calendarEvents, todayDate]
  );

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

  const openAddJobModal = () => {
    setJobModal({
      isOpen: true,
      mode: 'add',
      jobId: null,
      values: emptyJob(),
    });
  };

  const openEditJobModal = (job: JobApplication) => {
    setJobModal({
      isOpen: true,
      mode: 'edit',
      jobId: job.id,
      values: jobToFormValues(job),
    });
  };

  const closeJobModal = () => {
    setJobModal((currentModal) => ({
      ...currentModal,
      isOpen: false,
      jobId: null,
      values: emptyJob(),
    }));
  };

  const updateJobRecord = async (id: string, job: Omit<JobApplication, 'id'>) => {
    if (demoMode) {
      setJobs((currentJobs) =>
        currentJobs.map((currentJob) => (currentJob.id === id ? { id, ...job } : currentJob))
      );
      return;
    }

    const { error } = await supabase
      .from('applications')
      .update({ ...jobToUpdate(job), updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    setJobs((currentJobs) =>
      currentJobs.map((currentJob) => (currentJob.id === id ? { id, ...job } : currentJob))
    );
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

  const moveCalendarMonth = (direction: -1 | 1) => {
    setCalendarMonth((currentMonth) =>
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1)
    );
  };

  const openReminderModal = (date = selectedCalendarDate, applicationId = '') => {
    setReminderForm({
      applicationId,
      title: '',
      date,
      type: 'FOLLOW_UP',
      note: '',
    });
    setReminderModalOpen(true);
  };

  const handleReminderSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reminderForm.date) {
      setMessage('Choose a date for this calendar item.');
      return;
    }

    const selectedJob = jobs.find((job) => job.id === reminderForm.applicationId);
    const fallbackTitle = selectedJob
      ? `${calendarTypeLabel(reminderForm.type)}: ${selectedJob.companyName || selectedJob.jobTitle}`
      : calendarTypeLabel(reminderForm.type);

    setCalendarReminders((currentReminders) => [
      {
        id: `calendar-${Date.now()}`,
        applicationId: reminderForm.applicationId,
        title: reminderForm.title.trim() || fallbackTitle,
        date: reminderForm.date,
        type: reminderForm.type,
        note: reminderForm.note.trim(),
        createdAt: new Date().toISOString(),
      },
      ...currentReminders,
    ]);
    setSelectedCalendarDate(reminderForm.date);
    setCalendarMonth(startOfMonth(new Date(`${reminderForm.date}T00:00:00`)));
    setReminderModalOpen(false);
    setMessage('Calendar item added.');
  };

  const removeCalendarReminder = (id: string) => {
    setCalendarReminders((currentReminders) =>
      currentReminders.filter((reminder) => reminder.id !== id)
    );
    setMessage('Calendar item removed.');
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

  const handleJobModalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const saveAction = jobModal.mode === 'edit' && jobModal.jobId
      ? updateJobRecord(jobModal.jobId, jobModal.values)
      : insertJob(jobModal.values);

    saveAction
      .then(() => {
        closeJobModal();
        setMessage(jobModal.mode === 'edit' ? 'Job updated.' : 'Manual job added.');
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : 'Could not save this job.');
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
            <button
              onClick={() => setActiveSection('applications')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeSection === 'applications' ? 'bg-blue-50 text-blue-700' : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Icon name="briefcase" />
              Applications
            </button>
            <button
              onClick={() => setActiveSection('calendar')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeSection === 'calendar' ? 'bg-blue-50 text-blue-700' : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <Icon name="calendar" />
              Calendar
            </button>
          </nav>

          <section className={`mt-8 rounded-lg border p-4 transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-950/40' : 'border-stone-200 bg-[#fffdf8]'}`}>
            <div className="mb-3 flex items-center justify-between">
              <button
                aria-label="Previous month"
                onClick={() => moveCalendarMonth(-1)}
                className={`rounded-md px-2 py-1 text-sm font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-[#f7f3ea]'}`}
              >
                ‹
              </button>
              <p className="text-sm font-semibold">{monthLabel}</p>
              <button
                aria-label="Next month"
                onClick={() => moveCalendarMonth(1)}
                className={`rounded-md px-2 py-1 text-sm font-bold transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-[#f7f3ea]'}`}
              >
                ›
              </button>
            </div>
            <div className={`grid grid-cols-7 gap-1 text-center text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
              {days.map((day, index) => {
                const dateValue = day ? toCalendarDate(calendarMonth.getFullYear(), calendarMonth.getMonth(), day) : '';
                const dayEvents = dateValue ? calendarEventsByDate[dateValue] ?? [] : [];
                const isToday = dateValue === todayDate;
                const isSelected = dateValue === selectedCalendarDate;

                return (
                  <button
                    key={`${day ?? 'blank'}-${index}`}
                    disabled={!day}
                    onClick={() => dateValue && setSelectedCalendarDate(dateValue)}
                    className={`relative aspect-square rounded-md text-xs transition-colors disabled:hover:bg-transparent ${isSelected ? 'bg-slate-900 text-white ring-2 ring-blue-300' : isToday ? 'bg-blue-600 text-white' : isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                  >
                    {day}
                    {dayEvents.length > 0 && (
                      <span className="absolute inset-x-0 bottom-1 flex justify-center gap-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <span key={event.id} className={`h-1 w-1 rounded-full ${calendarDotStyles[event.type]}`} />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className={`mt-4 rounded-lg border p-3 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-[#f7f3ea]'}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-bold">{formatFriendlyDate(selectedCalendarDate)}</p>
                <button
                  onClick={() => openReminderModal(selectedCalendarDate)}
                  className="rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.slice(0, 3).map((event) => (
                    <CalendarEventItem
                      key={event.id}
                      event={event}
                      isDarkMode={isDarkMode}
                      onDelete={event.reminderId ? () => removeCalendarReminder(event.reminderId as string) : undefined}
                    />
                  ))
                ) : (
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No calendar items for this day.</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <p className={`mb-2 text-xs font-bold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Next actions
              </p>
              <div className="space-y-2">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.slice(0, 3).map((event) => (
                    <CalendarEventItem
                      key={event.id}
                      event={event}
                      isDarkMode={isDarkMode}
                      onDelete={event.reminderId ? () => removeCalendarReminder(event.reminderId as string) : undefined}
                    />
                  ))
                ) : (
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No upcoming actions yet.</p>
                )}
              </div>
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
              <h1 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
                {activeSection === 'calendar' ? 'Calendar' : demoMode ? 'Demo workspace' : 'Applications'}
              </h1>
            </div>
            <div className="flex gap-2">
              {activeSection === 'applications' ? (
                <button
                  onClick={openAddJobModal}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-100 hover:border-blue-500' : 'border-stone-300 bg-[#fffdf8] text-slate-700 hover:border-blue-300'}`}
                >
                  <Icon name="plus" />
                  Add manually
                </button>
              ) : (
                <button
                  onClick={() => openReminderModal()}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${isDarkMode ? 'border-slate-700 bg-slate-900 text-slate-100 hover:border-blue-500' : 'border-stone-300 bg-[#fffdf8] text-slate-700 hover:border-blue-300'}`}
                >
                  <Icon name="plus" />
                  Add reminder
                </button>
              )}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                <Icon name="logout" />
                {demoMode ? 'Exit demo' : 'Sign out'}
              </button>
            </div>
          </header>

          <div className={`mb-5 grid grid-cols-2 rounded-xl border p-1 lg:hidden ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-[#fffdf8]'}`}>
            {[
              ['applications', 'Applications'],
              ['calendar', 'Calendar'],
            ].map(([section, label]) => (
              <button
                key={section}
                onClick={() => setActiveSection(section as DashboardSection)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${activeSection === section ? 'bg-blue-600 text-white shadow-sm' : isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-[#f7f3ea]'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {message && (
            <p className={`mb-4 rounded-lg border px-4 py-3 text-sm ${isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-stone-200 bg-[#fffdf8] text-slate-600'}`}>
              {savingId ? 'Saving changes...' : message}
            </p>
          )}

          {activeSection === 'applications' && (
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
          </section>
          )}

          {activeSection === 'calendar' && (
          <section className="mb-5 grid gap-4 xl:grid-cols-[1fr_380px]">
            <div className={`rounded-lg border p-4 shadow-sm transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-[#fffdf8]'}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold">{monthLabel}</h2>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Select a day to review applications and reminders.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Previous month"
                    onClick={() => moveCalendarMonth(-1)}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-stone-300 text-slate-700 hover:bg-[#f7f3ea]'}`}
                  >
                    ‹
                  </button>
                  <button
                    aria-label="Next month"
                    onClick={() => moveCalendarMonth(1)}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-stone-300 text-slate-700 hover:bg-[#f7f3ea]'}`}
                  >
                    ›
                  </button>
                </div>
              </div>
              <div className={`grid grid-cols-7 gap-2 text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="py-2 font-semibold">{day}</span>)}
                {days.map((day, index) => {
                  const dateValue = day ? toCalendarDate(calendarMonth.getFullYear(), calendarMonth.getMonth(), day) : '';
                  const dayEvents = dateValue ? calendarEventsByDate[dateValue] ?? [] : [];
                  const isToday = dateValue === todayDate;
                  const isSelected = dateValue === selectedCalendarDate;

                  return (
                    <button
                      key={`${day ?? 'blank'}-${index}`}
                      disabled={!day}
                      onClick={() => dateValue && setSelectedCalendarDate(dateValue)}
                      className={`min-h-24 rounded-xl border p-2 text-left transition-colors disabled:border-transparent disabled:bg-transparent ${isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : isDarkMode ? 'border-slate-800 bg-slate-950/50 hover:bg-slate-800' : 'border-stone-200 bg-[#f7f3ea] hover:bg-[#fffdf8]'} ${isToday && !isSelected ? 'border-blue-400' : ''}`}
                    >
                      <span className={`text-sm font-bold ${isSelected ? 'text-blue-700' : isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                        {day}
                      </span>
                      <div className="mt-2 space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <span
                            key={event.id}
                            className={`block truncate rounded-full px-2 py-0.5 text-[10px] font-semibold ${calendarTypeStyles[event.type]}`}
                          >
                            {event.title}
                          </span>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className={`block text-[10px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            +{dayEvents.length - 2} more
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className={`rounded-lg border p-4 shadow-sm transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-[#fffdf8]'}`}>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between xl:flex-col xl:items-stretch">
                  <div>
                    <h2 className="text-base font-bold">Upcoming actions</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Interviews, follow-ups, reminders, and application dates.
                    </p>
                  </div>
                  <button
                    onClick={() => openReminderModal()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    <Icon name="plus" />
                    Add reminder
                  </button>
                </div>
                <div className="space-y-3">
                  {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                      <CalendarEventItem
                        key={event.id}
                        event={event}
                        isDarkMode={isDarkMode}
                        onDelete={event.reminderId ? () => removeCalendarReminder(event.reminderId as string) : undefined}
                      />
                    ))
                  ) : (
                    <div className={`rounded-lg border p-4 text-sm ${isDarkMode ? 'border-slate-800 bg-slate-950/50 text-slate-400' : 'border-stone-200 bg-[#f7f3ea] text-slate-500'}`}>
                      Add a reminder or set applied dates to build your job search schedule.
                    </div>
                  )}
                </div>
              </div>

              <div className={`rounded-lg border p-4 shadow-sm transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-stone-200 bg-[#fffdf8]'}`}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold">{formatFriendlyDate(selectedCalendarDate)}</h2>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Selected day
                    </p>
                  </div>
                  <button
                    onClick={() => openReminderModal(selectedCalendarDate)}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-stone-300 text-slate-700 hover:bg-[#f7f3ea]'}`}
                  >
                    Add item
                  </button>
                </div>
                <input
                  type="date"
                  value={selectedCalendarDate}
                  onChange={(event) => {
                    const nextDate = event.target.value;
                    setSelectedCalendarDate(nextDate);
                    if (nextDate) {
                      setCalendarMonth(startOfMonth(new Date(`${nextDate}T00:00:00`)));
                    }
                  }}
                  className={`mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-900'}`}
                />
                <div className="space-y-3">
                  {selectedDayEvents.length > 0 ? (
                    selectedDayEvents.map((event) => (
                      <CalendarEventItem
                        key={event.id}
                        event={event}
                        isDarkMode={isDarkMode}
                        onDelete={event.reminderId ? () => removeCalendarReminder(event.reminderId as string) : undefined}
                      />
                    ))
                  ) : (
                    <p className={`rounded-lg border p-4 text-sm ${isDarkMode ? 'border-slate-800 bg-slate-950/50 text-slate-400' : 'border-stone-200 bg-[#f7f3ea] text-slate-500'}`}>
                      Nothing scheduled for this day.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
          )}

          {activeSection === 'applications' && (
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
            <div className={`border-b px-4 py-4 ${isDarkMode ? 'border-slate-800' : 'border-stone-200'}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="w-full lg:max-w-lg">
                  <span className={`mb-1 block text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Search applications
                  </span>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search company, job title, or location..."
                    className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500' : 'border-stone-200 bg-[#f7f3ea] text-slate-900 placeholder:text-slate-400 focus:bg-[#fffdf8]'}`}
                  />
                </label>
                <div className={`rounded-lg border px-3 py-2 text-sm font-semibold ${isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-300' : 'border-stone-200 bg-[#f7f3ea] text-slate-600'}`}>
                  {filteredJobs.length} of {jobs.length} shown
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {statusTabs.map((status) => {
                  const isActive = statusFilter === status;
                  const count = status === 'ALL' ? jobs.length : trackerStats.statusCounts[status];

                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${isActive ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-stone-300 text-slate-600 hover:bg-[#f7f3ea]'}`}
                    >
                      {status === 'ALL' ? 'All' : statusLabel(status)} · {count}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full border-collapse text-center text-sm">
                <thead className={`text-xs uppercase ${isDarkMode ? 'bg-slate-950 text-slate-400' : 'bg-[#f2ecdf] text-slate-500'}`}>
                  <tr>
                    {deleteMode && <th className="w-12 px-3 py-3 text-center font-semibold">Pick</th>}
                    {['Company', 'Job Title', 'Location', 'Type', 'Salary', 'Status', 'Applied', 'Skills', 'Summary', 'Actions'].map((heading) => (
                      <th key={heading} className="px-3 py-3 text-center font-semibold">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-stone-100'}`}>
                  {filteredJobs.map((job) => (
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
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setDetailJobId(job.id)}
                          className={`mx-auto block max-w-40 truncate rounded-md px-2 py-1 text-sm transition-colors ${isDarkMode ? 'text-slate-200 hover:bg-slate-950' : 'text-slate-700 hover:bg-[#fffdf8]'}`}
                          title={job.keySkills.join(', ') || 'No skills listed'}
                        >
                          {job.keySkills.length > 0 ? job.keySkills.slice(0, 2).join(', ') : 'View skills'}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setDetailJobId(job.id)}
                          className={`mx-auto block max-w-56 truncate rounded-md px-2 py-1 text-sm transition-colors ${isDarkMode ? 'text-slate-200 hover:bg-slate-950' : 'text-slate-700 hover:bg-[#fffdf8]'}`}
                          title={job.summary || 'No summary listed'}
                        >
                          {job.summary || 'View details'}
                        </button>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => setDetailJobId(job.id)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-stone-300 text-slate-700 hover:bg-[#f7f3ea]'}`}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditJobModal(job)}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan={deleteMode ? 11 : 10} className={`px-4 py-10 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        No job listings match the current search and status filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          )}
        </section>
      </div>
      {detailJob && (
        <div
          className="fixed inset-0 z-30 flex justify-end bg-slate-950/50 backdrop-blur-sm"
          onClick={() => setDetailJobId(null)}
        >
          <aside
            className={`h-full w-full max-w-xl overflow-y-auto border-l p-6 shadow-2xl transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-950'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statStyles[detailJob.status]}`}>
                  {statusLabel(detailJob.status)}
                </span>
                <h2 className="text-2xl font-bold">{detailJob.jobTitle || 'Untitled role'}</h2>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {detailJob.companyName || 'Unknown company'}
                </p>
              </div>
              <button
                onClick={() => setDetailJobId(null)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-stone-300 text-slate-700 hover:bg-[#f7f3ea]'}`}
              >
                Close
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Location', detailJob.location],
                ['Employment type', detailJob.employmentType],
                ['Salary range', detailJob.salaryRange],
                ['Applied date', detailJob.appliedAt],
              ].map(([label, value]) => (
                <div key={label} className={`rounded-lg border p-4 ${isDarkMode ? 'border-slate-800 bg-slate-950/50' : 'border-stone-200 bg-[#f7f3ea]'}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                  <p className="mt-1 text-sm font-semibold">{value || 'Not listed'}</p>
                </div>
              ))}
            </div>

            <section className={`mt-5 rounded-lg border p-4 ${isDarkMode ? 'border-slate-800 bg-slate-950/50' : 'border-stone-200 bg-[#f7f3ea]'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Key skills
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {detailJob.keySkills.length > 0 ? (
                  detailJob.keySkills.map((skill) => (
                    <span key={skill} className={`rounded-full px-3 py-1 text-xs font-semibold ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700'}`}>
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No skills listed.</p>
                )}
              </div>
            </section>

            <section className={`mt-5 rounded-lg border p-4 ${isDarkMode ? 'border-slate-800 bg-slate-950/50' : 'border-stone-200 bg-[#f7f3ea]'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Summary
              </p>
              <p className={`mt-3 whitespace-pre-wrap text-sm leading-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {detailJob.summary || 'No summary listed.'}
              </p>
            </section>

            <button
              onClick={() => openEditJobModal(detailJob)}
              className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Edit job details
            </button>
          </aside>
        </div>
      )}
      {reminderModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setReminderModalOpen(false)}
        >
          <form
            onSubmit={handleReminderSubmit}
            className={`w-full max-w-2xl rounded-2xl border p-5 shadow-2xl transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-950'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`mb-5 flex items-start justify-between gap-4 border-b pb-4 ${isDarkMode ? 'border-slate-800' : 'border-stone-200'}`}>
              <div>
                <h2 className="text-xl font-bold">Add Calendar Item</h2>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Schedule interviews, follow-ups, or personal reminders.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReminderModalOpen(false)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-stone-300 text-slate-700 hover:bg-[#f7f3ea]'}`}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Type
                <select
                  value={reminderForm.type}
                  onChange={(event) =>
                    setReminderForm((currentForm) => ({
                      ...currentForm,
                      type: event.target.value as CalendarReminderType,
                    }))
                  }
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-900'}`}
                >
                  {reminderTypes.map((type) => (
                    <option key={type} value={type}>{calendarTypeLabel(type)}</option>
                  ))}
                </select>
              </label>

              <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Date
                <input
                  required
                  type="date"
                  value={reminderForm.date}
                  onChange={(event) =>
                    setReminderForm((currentForm) => ({
                      ...currentForm,
                      date: event.target.value,
                    }))
                  }
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-900'}`}
                />
              </label>

              <label className={`text-sm font-medium sm:col-span-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Related application
                <select
                  value={reminderForm.applicationId}
                  onChange={(event) =>
                    setReminderForm((currentForm) => ({
                      ...currentForm,
                      applicationId: event.target.value,
                    }))
                  }
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-900'}`}
                >
                  <option value="">General reminder</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.companyName || 'Unknown company'} — {job.jobTitle || 'Untitled role'}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`text-sm font-medium sm:col-span-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Title
                <input
                  value={reminderForm.title}
                  onChange={(event) =>
                    setReminderForm((currentForm) => ({
                      ...currentForm,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Leave blank to generate a useful title"
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500' : 'border-stone-200 bg-[#fffdf8] text-slate-900 placeholder:text-slate-400'}`}
                />
              </label>

              <label className={`text-sm font-medium sm:col-span-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Notes
                <textarea
                  value={reminderForm.note}
                  onChange={(event) =>
                    setReminderForm((currentForm) => ({
                      ...currentForm,
                      note: event.target.value,
                    }))
                  }
                  placeholder="Meeting link, recruiter name, preparation notes..."
                  className={`mt-1 min-h-24 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500' : 'border-stone-200 bg-[#fffdf8] text-slate-900 placeholder:text-slate-400'}`}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setReminderModalOpen(false)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-stone-300 text-slate-700 hover:bg-[#f7f3ea]'}`}
              >
                Cancel
              </button>
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Save calendar item
              </button>
            </div>
          </form>
        </div>
      )}
      {jobModal.isOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={closeJobModal}
        >
          <form
            onSubmit={handleJobModalSubmit}
            className={`max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border p-5 shadow-2xl transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-950'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`mb-5 flex items-start justify-between gap-4 border-b pb-4 ${isDarkMode ? 'border-slate-800' : 'border-stone-200'}`}>
              <div>
                <h2 className="text-xl font-bold">{jobModal.mode === 'edit' ? 'Edit Job' : 'Add Job'}</h2>
                <p className={`mt-1 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {jobModal.mode === 'edit' ? 'Update the saved job listing details.' : 'Add a job manually when AI import is not needed.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeJobModal}
                className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-stone-300 text-slate-700 hover:bg-[#f7f3ea]'}`}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {manualTextFields.map(([field, label]) => (
                <label
                  key={field}
                  className={`text-sm font-medium ${field === 'summary' ? 'md:col-span-2' : ''} ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}
                >
                  {label}
                  {field === 'summary' ? (
                    <textarea
                      value={jobModal.values[field]}
                      onChange={(event) =>
                        setJobModal((currentModal) => ({
                          ...currentModal,
                          values: { ...currentModal.values, [field]: event.target.value },
                        }))
                      }
                      className={`mt-1 min-h-28 w-full resize-y rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-900'}`}
                    />
                  ) : (
                    <input
                      required={field === 'companyName' || field === 'jobTitle'}
                      type={field === 'appliedAt' ? 'date' : 'text'}
                      value={jobModal.values[field]}
                      onChange={(event) =>
                        setJobModal((currentModal) => ({
                          ...currentModal,
                          values: { ...currentModal.values, [field]: event.target.value },
                        }))
                      }
                      className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-900'}`}
                    />
                  )}
                </label>
              ))}
              <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Status
                <select
                  value={jobModal.values.status}
                  onChange={(event) =>
                    setJobModal((currentModal) => ({
                      ...currentModal,
                      values: { ...currentModal.values, status: event.target.value as JobStatus },
                    }))
                  }
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100' : 'border-stone-200 bg-[#fffdf8] text-slate-900'}`}
                >
                  {statuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                </select>
              </label>
              <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                Key skills
                <input
                  value={jobModal.values.keySkills.join(', ')}
                  onChange={(event) =>
                    setJobModal((currentModal) => ({
                      ...currentModal,
                      values: { ...currentModal.values, keySkills: splitSkills(event.target.value) },
                    }))
                  }
                  placeholder="React, Supabase, TypeScript"
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors focus:border-blue-400 focus:ring-4 focus:ring-blue-100 ${isDarkMode ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500' : 'border-stone-200 bg-[#fffdf8] text-slate-900 placeholder:text-slate-400'}`}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeJobModal}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${isDarkMode ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-stone-300 text-slate-700 hover:bg-[#f7f3ea]'}`}
              >
                Cancel
              </button>
              <button
                disabled={loading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? 'Saving...' : jobModal.mode === 'edit' ? 'Save changes' : 'Save job'}
              </button>
            </div>
          </form>
        </div>
      )}
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

function CalendarEventItem({
  event,
  isDarkMode,
  onDelete,
}: {
  event: CalendarEvent;
  isDarkMode: boolean;
  onDelete?: () => void;
}) {
  return (
    <div className={`rounded-lg border p-3 ${isDarkMode ? 'border-slate-800 bg-slate-950/50' : 'border-stone-200 bg-[#fffdf8]'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${calendarTypeStyles[event.type]}`}>
              {calendarTypeLabel(event.type)}
            </span>
            <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {formatFriendlyDate(event.date)}
            </span>
          </div>
          <p className="truncate text-sm font-bold">{event.title}</p>
          <p className={`truncate text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {event.companyName}{event.jobTitle ? ` · ${event.jobTitle}` : ''}
          </p>
          {event.note && (
            <p className={`mt-2 line-clamp-2 text-xs leading-5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              {event.note}
            </p>
          )}
        </div>
        {onDelete && (
          <button
            aria-label={`Remove ${event.title}`}
            onClick={onDelete}
            className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${isDarkMode ? 'text-rose-300 hover:bg-rose-950/40' : 'text-rose-600 hover:bg-rose-50'}`}
          >
            Remove
          </button>
        )}
      </div>
    </div>
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

function buildCalendarEvents(jobs: JobApplication[], reminders: CalendarReminder[]): CalendarEvent[] {
  const generatedEvents = jobs.flatMap((job): CalendarEvent[] => {
    if (!job.appliedAt) return [];

    const events: CalendarEvent[] = [
      {
        id: `applied-${job.id}`,
        applicationId: job.id,
        companyName: job.companyName || 'Unknown company',
        jobTitle: job.jobTitle,
        title: 'Application submitted',
        date: job.appliedAt,
        type: 'APPLIED',
        note: 'Captured from the application date in your tracker.',
      },
    ];

    if (job.status !== 'OFFER' && job.status !== 'REJECTED') {
      events.push({
        id: `follow-up-${job.id}`,
        applicationId: job.id,
        companyName: job.companyName || 'Unknown company',
        jobTitle: job.jobTitle,
        title: 'Suggested follow-up',
        date: addDaysToDateInput(job.appliedAt, 7),
        type: 'FOLLOW_UP',
        note: 'Suggested 7 days after applying. Add a manual reminder if you want a custom note.',
      });
    }

    return events;
  });

  const reminderEvents = reminders.map((reminder): CalendarEvent => {
    const relatedJob = jobs.find((job) => job.id === reminder.applicationId);

    return {
      id: `manual-${reminder.id}`,
      reminderId: reminder.id,
      applicationId: reminder.applicationId,
      companyName: relatedJob?.companyName || 'General',
      jobTitle: relatedJob?.jobTitle || '',
      title: reminder.title,
      date: reminder.date,
      type: reminder.type,
      note: reminder.note,
    };
  });

  return [...generatedEvents, ...reminderEvents].sort((first, second) => {
    if (first.date === second.date) {
      return first.title.localeCompare(second.title);
    }

    return first.date.localeCompare(second.date);
  });
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

function jobToFormValues(job: JobApplication): Omit<JobApplication, 'id'> {
  return {
    companyName: job.companyName,
    jobTitle: job.jobTitle,
    location: job.location,
    employmentType: job.employmentType,
    salaryRange: job.salaryRange,
    status: job.status,
    appliedAt: job.appliedAt,
    keySkills: job.keySkills,
    summary: job.summary,
  };
}

function jobToUpdate(job: Omit<JobApplication, 'id'>): ApplicationFieldUpdate {
  return {
    company_name: job.companyName,
    job_title: job.jobTitle,
    location: job.location,
    employment_type: job.employmentType,
    salary_range: job.salaryRange,
    key_skills: job.keySkills,
    summary: job.summary,
    status: job.status,
    applied_at: job.appliedAt ? new Date(`${job.appliedAt}T00:00:00`).toISOString() : null,
  };
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

function readCalendarReminders(storageKey: string): CalendarReminder[] {
  if (typeof window === 'undefined') return [];

  try {
    const storedValue = localStorage.getItem(storageKey);
    if (!storedValue) return [];

    const reminders = JSON.parse(storedValue) as CalendarReminder[];
    if (!Array.isArray(reminders)) return [];

    return reminders.filter((reminder) =>
      typeof reminder.id === 'string' &&
      typeof reminder.applicationId === 'string' &&
      typeof reminder.title === 'string' &&
      typeof reminder.date === 'string' &&
      typeof reminder.note === 'string' &&
      (reminder.type === 'FOLLOW_UP' || reminder.type === 'INTERVIEW' || reminder.type === 'REMINDER')
    );
  } catch {
    return [];
  }
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function toDateInputValue(date: Date) {
  return toCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());
}

function toCalendarDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDaysToDateInput(dateValue: string, daysToAdd: number) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setDate(date.getDate() + daysToAdd);
  return toDateInputValue(date);
}

function formatFriendlyDate(dateValue: string) {
  if (!dateValue) return 'No date';

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calendarTypeLabel(type: CalendarEventType) {
  if (type === 'FOLLOW_UP') return 'Follow-up';
  return type.charAt(0) + type.slice(1).toLowerCase();
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
