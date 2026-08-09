import DashboardClient from '../dashboard-client';
import type { ApplicationRecord } from '../application-types';

const demoApplications: ApplicationRecord[] = [
  {
    id: 'demo-1',
    user_id: 'demo-user',
    company_name: 'Northstar Labs',
    job_title: 'Frontend Engineer',
    location: 'Remote',
    employment_type: 'Full-time',
    salary_range: '$90k - $120k',
    key_skills: ['React', 'TypeScript', 'Next.js'],
    summary: 'Build dashboard workflows and reusable UI components.',
    status: 'APPLIED',
    applied_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    user_id: 'demo-user',
    company_name: 'Metro Systems',
    job_title: 'Product Designer',
    location: 'Singapore',
    employment_type: 'Contract',
    salary_range: 'Not listed',
    key_skills: ['Figma', 'UX research', 'Prototyping'],
    summary: 'Design product flows for internal operations tools.',
    status: 'INTERVIEW',
    applied_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function DemoPage() {
  return (
    <DashboardClient
      demoMode
      initialApplications={demoApplications}
      userEmail="Demo workspace"
      userId="demo-user"
    />
  );
}
