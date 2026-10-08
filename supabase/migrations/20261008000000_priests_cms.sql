create table if not exists public.priests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  years_experience integer not null check (years_experience between 0 and 80),
  description text not null check (char_length(btrim(description)) between 10 and 1000),
  photo_url text not null check (photo_url ~ '^https://res\.cloudinary\.com/[^/]+/image/upload/'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.priests enable row level security;
-- Public reads and admin writes go through authenticated server endpoints.
