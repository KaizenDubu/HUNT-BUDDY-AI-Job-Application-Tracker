import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from '../dashboard-client';
import type { ApplicationRecord } from '../application-types';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: applications } = await supabase
    .from('applications')
    .select('id,user_id,company_name,job_title,location,employment_type,salary_range,key_skills,summary,status,applied_at,updated_at')
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false });

  return (
    <DashboardClient
      initialApplications={(applications ?? []) as ApplicationRecord[]}
      userEmail={user.email ?? 'Job seeker'}
      userId={user.id}
    />
  );
}
