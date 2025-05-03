-- Migration: 20250503152643_initial_schema.sql
-- Purpose: Create initial database schema for Yoga CoPilot MVP
-- Tables: asanas, generated_sequences, sequence_asanas, feedback
-- Types: goal_enum, level_enum, feedback_status_enum, generation_status_enum
-- Author: Database Migration System
-- Date: 2025-05-03

-- ===============================
-- custom enum types
-- ===============================

-- yoga practice goals
create type goal_enum as enum (
  'balance',          -- balance
  'strength',         -- strength
  'flexibility',      -- flexibility
  'relaxation',       -- relaxation
  'energy',           -- energy
  'mindfulness'       -- mindfulness
);

-- practice difficulty levels
create type level_enum as enum (
  'beginner',         -- beginner
  'intermediate',     -- intermediate
  'advanced'          -- advanced
);

-- feedback status for generated sequences
create type feedback_status_enum as enum (
  'accepted',         -- accepted sequence
  'rejected'          -- rejected sequence
);

-- sequence generation status
create type generation_status_enum as enum (
  'success',          -- successful generation
  'failure'           -- failed generation
);

-- ===============================
-- tables
-- ===============================

-- table for storing yoga poses (asanas)
create table asanas (
    id               uuid primary key     default gen_random_uuid(),
    sanskrit_name    text        not null,
    polish_name      text        not null,
    illustration_url text        not null,
    is_archived      boolean     not null default false,
    created_at       timestamptz not null default now()
);

-- table for storing generated yoga sequences
create table generated_sequences (
    id                uuid primary key                default gen_random_uuid(),
    user_id           uuid                   not null references auth.users (id) on delete restrict,
    duration_minutes  integer                not null check (duration_minutes > 0 and duration_minutes <= 30),
    goal              goal_enum              not null,
    level             level_enum             not null,
    generation_status generation_status_enum not null default 'failure',
    raw_llm_response  jsonb,
    created_at        timestamptz            not null default now()
);

-- table for storing individual steps in a yoga sequence
create table sequence_asanas (
    id                    uuid primary key     default gen_random_uuid(),
    generated_sequence_id uuid        not null references generated_sequences (id) on delete restrict,
    asana_id              uuid        not null references asanas (id) on delete restrict,
    step_number           integer     not null check (step_number > 0),
    created_at            timestamptz not null default now(),
    unique (generated_sequence_id, step_number)
);

-- table for storing user feedback on generated sequences
create table feedback (
    id                    uuid primary key              default gen_random_uuid(),
    generated_sequence_id uuid                 not null unique references generated_sequences (id) on delete restrict,
    feedback_status       feedback_status_enum not null,
    user_comment          text,
    created_at            timestamptz          not null default now()
);

-- ===============================
-- indexes
-- ===============================

-- index for quick lookup of sequence steps
create index idx_sequence_asanas_sequence_step on sequence_asanas (generated_sequence_id, step_number);

-- index for filtering active asanas
create index idx_asanas_is_archived on asanas (is_archived);

-- index for finding sequences by user
create index idx_generated_sequences_user_id on generated_sequences (user_id);

-- index for reporting and analysis by generation status
create index idx_generated_sequences_status on generated_sequences (generation_status);

-- ===============================
-- row level security policies
-- ===============================

-- enable row level security on all tables
alter table asanas enable row level security;
alter table generated_sequences enable row level security;
alter table sequence_asanas enable row level security;
alter table feedback enable row level security;

-- asanas table policies
-- allow all authenticated users to view asanas
create policy asanas_select_policy_authenticated on asanas
  for select
  to authenticated
  using (true);

-- allow all anonymous users to view asanas
create policy asanas_select_policy_anon on asanas
  for select
  to anon
  using (true);

-- generated_sequences table policies
-- allow users to view only their own sequences
create policy generated_sequences_select_policy_authenticated on generated_sequences
  for select
  to authenticated
  using (auth.uid() = user_id);

-- allow users to create sequences linked to their user_id
create policy generated_sequences_insert_policy_authenticated on generated_sequences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- sequence_asanas table policies
-- allow users to view steps of sequences they own
create policy sequence_asanas_select_policy_authenticated on sequence_asanas
  for select
  to authenticated
  using (
    exists (
      select 1 from generated_sequences
      where id = generated_sequence_id
      and user_id = auth.uid()
    )
  );

-- allow users to add steps to sequences they own
create policy sequence_asanas_insert_policy_authenticated on sequence_asanas
  for insert
  to authenticated
  with check (
    exists (
      select 1 from generated_sequences
      where id = generated_sequence_id
      and user_id = auth.uid()
    )
  );

-- feedback table policies
-- allow users to view feedback for sequences they own
create policy feedback_select_policy_authenticated on feedback
  for select
  to authenticated
  using (
    exists (
      select 1 from generated_sequences
      where id = generated_sequence_id
      and user_id = auth.uid()
    )
  );

-- allow users to add feedback to sequences they own
create policy feedback_insert_policy_authenticated on feedback
  for insert
  to authenticated
  with check (
    exists (
      select 1 from generated_sequences
      where id = generated_sequence_id
      and user_id = auth.uid()
    )
  );

-- allow users to update feedback for sequences they own
create policy feedback_update_policy_authenticated on feedback
  for update
  to authenticated
  using (
    exists (
      select 1 from generated_sequences
      where id = generated_sequence_id
      and user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from generated_sequences
      where id = generated_sequence_id
      and user_id = auth.uid()
    )
  );
