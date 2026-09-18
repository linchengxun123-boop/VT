-- VT v0.1 — execute once in the Supabase SQL editor of a new project.
begin;

create table public.training_plans (
  id text primary key check (id in ('A','B','C')),
  name text not null, description text not null, target text not null,
  created_at timestamptz not null default now()
);
create table public.training_tasks (
  id text primary key,
  plan_id text not null references public.training_plans(id),
  name text not null, description text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  sort_order integer not null,
  unique(plan_id,sort_order)
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  rank text not null check (rank in ('Iron','Bronze','Silver','Gold','Platinum','Diamond','Ascendant','Immortal','Radiant')),
  role text not null check (role in ('Duelist','Controller','Initiator','Sentinel')),
  daily_training_minutes integer not null check (daily_training_minutes in (10,20,30,45)),
  weaknesses text[] not null default '{}',
  selected_plan text not null references public.training_plans(id),
  created_at timestamptz not null default now(),
  check (weaknesses <@ array['Crosshair Placement 差','第一枪不准','拉枪容易拉过','急停不好','爆头率低','近距离对枪差','远距离对枪差','容易紧张乱扫']::text[])
);
create table public.daily_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  task_id text not null references public.training_tasks(id),
  completed boolean not null default false,
  completed_at timestamptz,
  unique(user_id,date,task_id)
);
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  plan_id text not null references public.training_plans(id),
  completed_tasks integer not null,
  total_tasks integer not null check (total_tasks > 0),
  total_minutes integer not null check (total_minutes > 0),
  created_at timestamptz not null default now(),
  unique(user_id,date),
  check (completed_tasks = total_tasks)
);
create index checkins_user_date on public.checkins(user_id,date desc);

insert into public.training_plans(id,name,description,target) values
('A','Fundamentals Plan','先把基础练稳，让每一次开枪都有准备。','预瞄 · 移动 · 第一枪'),
('B','Headshot & Crosshair Plan','少一点乱扫，多一点有把握的第一枪。','头线 · 首发 · 单点'),
('C','微调与精准控枪训练','不急着开枪，先把最后一点距离修准。','微调 · 控制 · 远距离');
insert into public.training_tasks(id,plan_id,name,description,duration_minutes,sort_order) values
('a-range','A','Range Warmup','靶场完成 100 Bots，准确优先，时间到即可结束。',5,0),
('a-crosshair','A','Crosshair Placement Practice','沿常用路线移动，预瞄常见头线位置。',5,1),
('a-dm','A','乱斗','只关注头线、停稳和第一枪，按分配时间结束。',10,2),
('b-static','B','Static Headshot Warmup','对静止 Bot 匀速单点头部。',5,0),
('b-crosshair','B','Crosshair Placement Drill','贴合掩体逐个清点，保持头线。',5,1),
('b-guardian','B','戍卫乱斗','使用戍卫，避免乱扫，优先单点和爆头。',10,2),
('c-small','C','Small Target Warmup','拉开距离，缓慢将准星移动到头部再开枪。',5,0),
('c-micro','C','微调训练','从头部旁做小幅修正后单点，减少拉过。',7,1),
('c-vandal','C','Vandal One Tap Practice','Vandal 逐个单点，停稳后射击。',5,2),
('c-dm','C','乱斗','优先中远距离，先修准再单点，按分配时间结束。',10,3);

alter table public.training_plans enable row level security;
alter table public.training_tasks enable row level security;
alter table public.profiles enable row level security;
alter table public.daily_progress enable row level security;
alter table public.checkins enable row level security;
create policy "read plans" on public.training_plans for select to authenticated using(true);
create policy "read tasks" on public.training_tasks for select to authenticated using(true);
create policy "own profile" on public.profiles for select to authenticated using((select auth.uid())=id);
create policy "own progress" on public.daily_progress for select to authenticated using((select auth.uid())=user_id);
create policy "own checkins" on public.checkins for select to authenticated using((select auth.uid())=user_id);

-- All writes pass through this transaction: callers cannot forge a date, plan,
-- task count or duration, bypass completion, or overwrite a finished check-in.
create or replace function public.vt_action(p_action text, p_payload jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_today date;
  v_profile public.profiles%rowtype;
  v_weaknesses text[];
  v_plan text;
  v_count integer;
  v_completed integer;
begin
  if v_user is null then raise exception '请先登录。'; end if;
  -- Business dates always follow mainland China's natural day, never caller input.
  v_today := (now() at time zone 'Asia/Shanghai')::date;
  -- Serialize mutations for a single player, including simultaneous tabs.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text,0));
  select * into v_profile from public.profiles where id=v_user;
  if p_action='profile' then
    if exists(select 1 from public.daily_progress where user_id=v_user and date=v_today and completed)
       or exists(select 1 from public.checkins where user_id=v_user and date=v_today) then
      raise exception '今天已开始训练，请明天再调整测评。';
    end if;
    if jsonb_typeof(p_payload->'weaknesses') is distinct from 'array' then raise exception '无效的弱项选项。'; end if;
    select coalesce(array_agg(distinct value),'{}'::text[]) into v_weaknesses from jsonb_array_elements_text(p_payload->'weaknesses');
    if v_weaknesses && array['拉枪容易拉过','远距离对枪差'] then v_plan:='C';
    elsif v_weaknesses && array['Crosshair Placement 差','爆头率低','第一枪不准'] then v_plan:='B';
    else v_plan:='A'; end if;
    insert into public.profiles(id,rank,role,daily_training_minutes,weaknesses,selected_plan)
    values(v_user,p_payload->>'rank',p_payload->>'role',(p_payload->>'daily_training_minutes')::integer,v_weaknesses,v_plan)
    on conflict(id) do update set rank=excluded.rank,role=excluded.role,daily_training_minutes=excluded.daily_training_minutes,weaknesses=excluded.weaknesses,selected_plan=excluded.selected_plan;
  elsif p_action='task' then
    if v_profile.id is null then raise exception '请先完成测评。'; end if;
    if exists(select 1 from public.checkins where user_id=v_user and date=v_today) then raise exception '今天已打卡，训练记录已锁定。'; end if;
    if not exists(select 1 from public.training_tasks where id=p_payload->>'task_id' and plan_id=v_profile.selected_plan) then raise exception '该任务不属于当前计划。'; end if;
    if jsonb_typeof(p_payload->'completed') is distinct from 'boolean' then raise exception '无效的任务状态。'; end if;
    insert into public.daily_progress(user_id,date,task_id,completed,completed_at)
    values(v_user,v_today,p_payload->>'task_id',(p_payload->>'completed')::boolean,case when (p_payload->>'completed')::boolean then now() else null end)
    on conflict(user_id,date,task_id) do update set completed=excluded.completed,completed_at=excluded.completed_at;
  elsif p_action='checkin' then
    if exists(select 1 from public.checkins where user_id=v_user and date=v_today) then return; end if;
    if v_profile.id is null then raise exception '请先完成测评。'; end if;
    select count(*) into v_count from public.training_tasks where plan_id=v_profile.selected_plan;
    select count(*) into v_completed from public.daily_progress p join public.training_tasks t on t.id=p.task_id
      where p.user_id=v_user and p.date=v_today and p.completed and t.plan_id=v_profile.selected_plan;
    if v_count=0 or v_completed<>v_count then raise exception '完成所有训练任务后才能打卡。'; end if;
    insert into public.checkins(user_id,date,plan_id,completed_tasks,total_tasks,total_minutes)
    values(v_user,v_today,v_profile.selected_plan,v_completed,v_count,v_profile.daily_training_minutes);
  else raise exception '不支持的操作。'; end if;
end;
$$;

revoke all on public.profiles,public.daily_progress,public.checkins,public.training_plans,public.training_tasks from anon,authenticated;
grant select on public.profiles,public.daily_progress,public.checkins,public.training_plans,public.training_tasks to authenticated;
revoke all on function public.vt_action(text,jsonb) from public,anon;
grant execute on function public.vt_action(text,jsonb) to authenticated;
commit;
