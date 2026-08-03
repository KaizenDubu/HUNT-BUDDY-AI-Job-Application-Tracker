# Hunt Buddy

Hunt Buddy is an AI-powered job application tracker built with Next.js, Supabase, and Groq AI. It helps users organize job applications by pasting full job listings, extracting structured details with AI, and saving each application to a personal dashboard.

## Features

- Supabase authentication with email/password and Google OAuth sign-in.
- AI job listing parser that extracts company name, job title, location, employment type, salary range, key skills, and summary.
- Database-backed application tracker with create, edit, and delete functionality.
- Editable dashboard table with manual job entry, status tracking, calendar navigation, and persistent light/dark mode.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase Auth and Database
- Groq AI

## Getting Started

Install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Supabase Table

The dashboard expects an `applications` table:

```sql
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  location TEXT,
  employment_type TEXT,
  salary_range TEXT,
  key_skills TEXT[],
  summary TEXT,
  status TEXT DEFAULT 'APPLIED',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

If Row Level Security is enabled, add policies that allow users to select, insert, update, and delete only rows where `user_id = auth.uid()`.

## AI Parsing

Job descriptions are sent to the `/api/parse-job` route, where Groq AI converts unstructured job listing text into structured JSON fields. The parsed result is then saved to Supabase as a new application record.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
