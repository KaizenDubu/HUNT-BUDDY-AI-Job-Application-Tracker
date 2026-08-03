export type ApplicationRecord = {
  id: string;
  user_id: string | null;
  company_name: string;
  job_title: string;
  location: string | null;
  employment_type: string | null;
  salary_range: string | null;
  key_skills: string[] | null;
  summary: string | null;
  status: string | null;
  applied_at: string | null;
  updated_at: string | null;
};
