-- ============================================================
-- MathMaster baseline migration — reference copy of what is
-- applied to Supabase project oipxdcgsmwzaljlezxhj
-- (recorded migration: baseline_schema_gamification_seed,
--  plus enable_realtime_on_user_streaks)
--
-- 11 tables, RLS policies, auth trigger, gamification trigger,
-- seed data (4 topics, 31 subtopics).
-- ============================================================

-- ============ TABLES ============

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  color text not null,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.subtopics (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  name text not null,
  slug text not null,
  "order" integer not null default 0,
  depth text not null check (depth in ('core', 'intermediate', 'advanced')),
  created_at timestamptz not null default now(),
  unique (topic_id, slug)
);

create table public.study_guides (
  id uuid primary key default gen_random_uuid(),
  subtopic_id uuid not null unique references public.subtopics(id) on delete cascade,
  content text not null,
  generated_at timestamptz not null default now(),
  model text
);

create table public.video_links (
  id uuid primary key default gen_random_uuid(),
  subtopic_id uuid not null references public.subtopics(id) on delete cascade,
  video_id text not null,
  title text not null,
  channel_title text,
  thumbnail_url text,
  "order" integer not null default 0,
  generated_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subtopic_id uuid not null references public.subtopics(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'mastered')),
  pass_percentage integer,
  best_score numeric,
  total_attempts integer not null default 0,
  mastered_depths text[] not null default '{}',
  first_mastered_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, subtopic_id)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subtopic_id uuid not null references public.subtopics(id) on delete cascade,
  score numeric not null,
  total numeric not null,
  question_count integer not null,
  pass_percentage_chosen integer,
  passed boolean not null default false,
  answers jsonb,
  duration_seconds integer,
  created_at timestamptz not null default now()
);

create table public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subtopic_id uuid references public.subtopics(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.user_streaks (
  user_id uuid primary key references public.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  xp_total integer not null default 0,
  level integer not null default 0
);

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  badge_slug text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_slug)
);

create table public.leaderboard_opt_in (
  user_id uuid primary key references public.users(id) on delete cascade,
  display_name text,
  opted_in boolean not null default false
);

-- ============ INDEXES ============

create index idx_subtopics_topic_id on public.subtopics(topic_id);
create index idx_video_links_subtopic_id on public.video_links(subtopic_id);
create index idx_user_progress_user_id on public.user_progress(user_id);
create index idx_user_progress_subtopic_id on public.user_progress(subtopic_id);
create index idx_user_progress_user_status on public.user_progress(user_id, status);
create index idx_quiz_attempts_user_id on public.quiz_attempts(user_id);
create index idx_quiz_attempts_subtopic_id on public.quiz_attempts(subtopic_id);
create index idx_quiz_attempts_created_at on public.quiz_attempts(created_at);
create index idx_ai_chat_messages_user_id on public.ai_chat_messages(user_id);
create index idx_ai_chat_messages_subtopic_id on public.ai_chat_messages(subtopic_id);
create index idx_user_badges_user_id on public.user_badges(user_id);
create index idx_study_guides_subtopic_id on public.study_guides(subtopic_id);
create index idx_leaderboard_opt_in_opted_in on public.leaderboard_opt_in(opted_in);

-- ============ RLS ============

alter table public.topics enable row level security;
alter table public.subtopics enable row level security;
alter table public.study_guides enable row level security;
alter table public.video_links enable row level security;
alter table public.users enable row level security;
alter table public.user_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.ai_chat_messages enable row level security;
alter table public.user_streaks enable row level security;
alter table public.user_badges enable row level security;
alter table public.leaderboard_opt_in enable row level security;

create policy "topics_select_auth" on public.topics
  for select to authenticated using (true);
create policy "subtopics_select_auth" on public.subtopics
  for select to authenticated using (true);
create policy "study_guides_select_auth" on public.study_guides
  for select to authenticated using (true);
create policy "video_links_select_auth" on public.video_links
  for select to authenticated using (true);

create policy "users_select_own" on public.users
  for select to authenticated using (auth.uid() = id);
create policy "users_insert_own" on public.users
  for insert to authenticated with check (auth.uid() = id);

create policy "user_progress_all_own" on public.user_progress
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quiz_attempts_all_own" on public.quiz_attempts
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ai_chat_messages_select_own" on public.ai_chat_messages
  for select to authenticated using (auth.uid() = user_id);
create policy "ai_chat_messages_insert_own" on public.ai_chat_messages
  for insert to authenticated with check (auth.uid() = user_id);

create policy "user_streaks_select" on public.user_streaks
  for select to authenticated using (auth.uid() = user_id);
create policy "user_streaks_update_own" on public.user_streaks
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_badges_select_own" on public.user_badges
  for select to authenticated using (auth.uid() = user_id);

create policy "leaderboard_opt_in_select" on public.leaderboard_opt_in
  for select to authenticated using (auth.uid() = user_id);
create policy "leaderboard_opt_in_insert_own" on public.leaderboard_opt_in
  for insert to authenticated with check (auth.uid() = user_id);
create policy "leaderboard_opt_in_update_own" on public.leaderboard_opt_in
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ AUTH TRIGGER ============

create or replace function public.on_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  insert into public.user_streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.on_auth_user_created();

-- ============ GAMIFICATION TRIGGER ============

create or replace function public.handle_quiz_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_progress public.user_progress%rowtype;
  v_streak public.user_streaks%rowtype;
  v_xp_gain integer;
  v_depth text;
  v_topic_id uuid;
  v_topic_slug text;
  v_mastered_count integer;
  v_total_count integer;
  v_prior_fail boolean;
begin
  v_depth := coalesce(NEW.answers->>'depth', 'core');

  -- 1. Upsert user_progress
  select * into v_progress
  from public.user_progress
  where user_id = NEW.user_id and subtopic_id = NEW.subtopic_id;

  if not found then
    insert into public.user_progress
      (user_id, subtopic_id, status, pass_percentage, best_score, total_attempts, mastered_depths, first_mastered_at, updated_at)
    values
      (NEW.user_id, NEW.subtopic_id,
       case when NEW.passed then 'mastered' else 'in_progress' end,
       NEW.pass_percentage_chosen,
       NEW.score,
       1,
       case when NEW.passed then array[v_depth] else '{}'::text[] end,
       case when NEW.passed then now() else null end,
       now());
  else
    update public.user_progress
    set status = case when NEW.passed then 'mastered' else 'in_progress' end,
        pass_percentage = NEW.pass_percentage_chosen,
        best_score = greatest(coalesce(best_score, 0), NEW.score),
        total_attempts = total_attempts + 1,
        mastered_depths = case
          when NEW.passed and not (v_depth = any(coalesce(mastered_depths, '{}'::text[])))
            then array_append(coalesce(mastered_depths, '{}'::text[]), v_depth)
          else mastered_depths end,
        first_mastered_at = case when NEW.passed then coalesce(first_mastered_at, now()) else first_mastered_at end,
        updated_at = now()
    where user_id = NEW.user_id and subtopic_id = NEW.subtopic_id;
  end if;

  -- 2. Upsert user_streaks (XP, level, streak)
  v_xp_gain := round(10 * NEW.question_count * (NEW.score / nullif(NEW.total, 0)))::int;

  select * into v_streak from public.user_streaks where user_id = NEW.user_id;

  if not found then
    insert into public.user_streaks
      (user_id, current_streak, longest_streak, last_active_date, xp_total, level)
    values
      (NEW.user_id, 1, 1, current_date, v_xp_gain, floor(sqrt(v_xp_gain / 50.0))::int);
  else
    if v_streak.last_active_date = (current_date - 1) then
      v_streak.current_streak := v_streak.current_streak + 1;
    elsif v_streak.last_active_date is null or v_streak.last_active_date < (current_date - 1) then
      v_streak.current_streak := 1;
    end if;

    v_streak.longest_streak := greatest(v_streak.longest_streak, v_streak.current_streak);
    v_streak.xp_total := v_streak.xp_total + v_xp_gain;
    v_streak.level := floor(sqrt(v_streak.xp_total / 50.0))::int;
    v_streak.last_active_date := current_date;

    update public.user_streaks
    set current_streak = v_streak.current_streak,
        longest_streak = v_streak.longest_streak,
        last_active_date = v_streak.last_active_date,
        xp_total = v_streak.xp_total,
        level = v_streak.level
    where user_id = NEW.user_id;
  end if;

  -- 3. Award badges (skip if already earned)

  -- first_mastery: first mastered subtopic ever
  if NEW.passed and not exists (
      select 1 from public.user_badges where user_id = NEW.user_id and badge_slug = 'first_mastery')
     and not exists (
      select 1 from public.user_progress
      where user_id = NEW.user_id and status = 'mastered' and subtopic_id <> NEW.subtopic_id)
  then
    insert into public.user_badges (user_id, badge_slug) values (NEW.user_id, 'first_mastery');
  end if;

  -- perfect_score
  if NEW.score >= NEW.total and not exists (
      select 1 from public.user_badges where user_id = NEW.user_id and badge_slug = 'perfect_score')
  then
    insert into public.user_badges (user_id, badge_slug) values (NEW.user_id, 'perfect_score');
  end if;

  -- 7_day_streak
  if (select current_streak from public.user_streaks where user_id = NEW.user_id) >= 7
     and not exists (select 1 from public.user_badges where user_id = NEW.user_id and badge_slug = '7_day_streak')
  then
    insert into public.user_badges (user_id, badge_slug) values (NEW.user_id, '7_day_streak');
  end if;

  -- conqueror_{topic_slug}: all core+intermediate subtopics of a topic mastered
  select s.topic_id, t.slug into v_topic_id, v_topic_slug
  from public.subtopics s
  join public.topics t on t.id = s.topic_id
  where s.id = NEW.subtopic_id;

  if v_topic_slug is not null then
    select count(*) into v_total_count
    from public.subtopics
    where topic_id = v_topic_id and depth in ('core', 'intermediate');

    select count(*) into v_mastered_count
    from public.subtopics s
    join public.user_progress p
      on p.subtopic_id = s.id and p.user_id = NEW.user_id and p.status = 'mastered'
    where s.topic_id = v_topic_id and s.depth in ('core', 'intermediate');

    if v_total_count > 0 and v_mastered_count >= v_total_count
       and not exists (select 1 from public.user_badges where user_id = NEW.user_id and badge_slug = 'conqueror_' || v_topic_slug)
    then
      insert into public.user_badges (user_id, badge_slug) values (NEW.user_id, 'conqueror_' || v_topic_slug);
    end if;
  end if;

  -- speed_demon: finished within 120s per question
  if NEW.duration_seconds is not null
     and NEW.duration_seconds <= 120 * coalesce(NEW.question_count, 1)
     and not exists (select 1 from public.user_badges where user_id = NEW.user_id and badge_slug = 'speed_demon')
  then
    insert into public.user_badges (user_id, badge_slug) values (NEW.user_id, 'speed_demon');
  end if;

  -- comeback_kid: passed after a prior failed attempt on the same subtopic
  select exists (
    select 1 from public.quiz_attempts
    where user_id = NEW.user_id and subtopic_id = NEW.subtopic_id
      and passed = false and id <> NEW.id
  ) into v_prior_fail;

  if NEW.passed and v_prior_fail
     and not exists (select 1 from public.user_badges where user_id = NEW.user_id and badge_slug = 'comeback_kid')
  then
    insert into public.user_badges (user_id, badge_slug) values (NEW.user_id, 'comeback_kid');
  end if;

  return NEW;
end;
$$;

create trigger handle_quiz_attempt
  after insert on public.quiz_attempts
  for each row execute function public.handle_quiz_attempt();

-- ============ REALTIME ============
alter publication supabase_realtime add table public.user_streaks;

-- ============ SEED DATA ============

insert into public.topics (name, slug, color, "order") values
  ('Algebra 1', 'algebra-1', '#4A7CF7', 1),
  ('Geometry', 'geometry', '#22C55E', 2),
  ('Algebra 2', 'algebra-2', '#A855F7', 3),
  ('Calculus', 'calculus', '#F59E0B', 4);

-- Subtopic slugs below MUST exactly match quiz generator keys in the frontend (Task 6).
insert into public.subtopics (topic_id, name, slug, "order", depth) values
  ((select id from public.topics where slug = 'algebra-1'), 'Linear Equations', 'linear-equations', 1, 'core'),
  ((select id from public.topics where slug = 'algebra-1'), 'Slope-Intercept Form', 'slope-intercept', 2, 'core'),
  ((select id from public.topics where slug = 'algebra-1'), 'Inequalities', 'inequalities', 3, 'core'),
  ((select id from public.topics where slug = 'algebra-1'), 'Systems of Equations', 'systems-of-equations', 4, 'intermediate'),
  ((select id from public.topics where slug = 'algebra-1'), 'Exponents', 'exponents', 5, 'intermediate'),
  ((select id from public.topics where slug = 'algebra-1'), 'Polynomials', 'polynomials', 6, 'advanced'),
  ((select id from public.topics where slug = 'algebra-1'), 'Factoring', 'factoring', 7, 'advanced'),
  ((select id from public.topics where slug = 'algebra-1'), 'Quadratic Equations', 'quadratic-equations', 8, 'advanced'),

  ((select id from public.topics where slug = 'geometry'), 'Points, Lines & Planes', 'points-lines-planes', 1, 'core'),
  ((select id from public.topics where slug = 'geometry'), 'Angles', 'angles', 2, 'core'),
  ((select id from public.topics where slug = 'geometry'), 'Triangles', 'triangles', 3, 'core'),
  ((select id from public.topics where slug = 'geometry'), 'Circles', 'circles', 4, 'intermediate'),
  ((select id from public.topics where slug = 'geometry'), 'Polygons', 'polygons', 5, 'intermediate'),
  ((select id from public.topics where slug = 'geometry'), 'Transformations', 'transformations', 6, 'advanced'),
  ((select id from public.topics where slug = 'geometry'), 'Coordinate Geometry', 'coordinate-geometry', 7, 'advanced'),
  ((select id from public.topics where slug = 'geometry'), 'Trigonometry Basics', 'trigonometry-basics', 8, 'advanced'),

  ((select id from public.topics where slug = 'algebra-2'), 'Functions', 'functions', 1, 'core'),
  ((select id from public.topics where slug = 'algebra-2'), 'Domain & Range', 'domain-range', 2, 'core'),
  ((select id from public.topics where slug = 'algebra-2'), 'Matrices', 'matrices', 3, 'intermediate'),
  ((select id from public.topics where slug = 'algebra-2'), 'Rational Expressions', 'rational-expressions', 4, 'intermediate'),
  ((select id from public.topics where slug = 'algebra-2'), 'Exponential Functions', 'exponential-functions', 5, 'intermediate'),
  ((select id from public.topics where slug = 'algebra-2'), 'Logarithms', 'logarithms', 6, 'advanced'),
  ((select id from public.topics where slug = 'algebra-2'), 'Sequences', 'sequences', 7, 'advanced'),
  ((select id from public.topics where slug = 'algebra-2'), 'Conic Sections', 'conic-sections', 8, 'advanced'),

  ((select id from public.topics where slug = 'calculus'), 'Limits', 'limits', 1, 'core'),
  ((select id from public.topics where slug = 'calculus'), 'Derivatives', 'derivatives', 2, 'core'),
  ((select id from public.topics where slug = 'calculus'), 'Derivative Rules', 'derivative-rules', 3, 'core'),
  ((select id from public.topics where slug = 'calculus'), 'Applications of Derivatives', 'applications-of-derivatives', 4, 'intermediate'),
  ((select id from public.topics where slug = 'calculus'), 'Integrals', 'integrals', 5, 'intermediate'),
  ((select id from public.topics where slug = 'calculus'), 'Fundamental Theorem', 'fundamental-theorem', 6, 'advanced'),
  ((select id from public.topics where slug = 'calculus'), 'U-Substitution', 'u-substitution', 7, 'advanced');
