# Entities

## Overview
Entities is a Next.js application for managing content and generating AI-assisted blog posts. It combines authenticated access, Supabase data storage, and Gemini-powered content generation to support an admin workflow for creating and publishing content.

## Tech Stack
- Next.js App Router + React
- TypeScript
- Tailwind CSS
- Clerk for authentication
- Supabase for database storage and queries
- Google Gemini via Vercel AI SDK for AI content generation

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file in the project root with the environment variables listed below.
3. (Optional) Apply the database schema in `schema.sql` to your Supabase project.
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Visit `http://localhost:3000`.

## Environment Variables
Set the following variables in `.env.local`:

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_KEY=

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=
```

## Deployment
- Build the app with:
  ```bash
  npm run build
  ```
- Ensure all environment variables are configured in your hosting provider (for example, Vercel).
- For Supabase, make sure the database schema from `schema.sql` is applied and Row Level Security policies match your Clerk auth integration.
