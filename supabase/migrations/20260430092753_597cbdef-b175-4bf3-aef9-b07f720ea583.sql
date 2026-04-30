-- WhatsApp send logs
create table if not exists public.wa_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null check (kind in ('quote','order','payment')),
  ref_id uuid,
  customer_id uuid,
  phone text,
  message text not null,
  link text,
  status text not null default 'sent' check (status in ('sent','failed','retry')),
  error text,
  created_at timestamptz not null default now()
);
alter table public.wa_messages enable row level security;
create policy "own wa messages" on public.wa_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists wa_messages_user_created_idx on public.wa_messages(user_id, created_at desc);

-- Sync conflict audit log
create table if not exists public.sync_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  table_name text not null,
  record_id uuid not null,
  strategy text not null default 'lww',
  resolution text not null check (resolution in ('local_won','remote_won','no_conflict','error')),
  local_updated_at timestamptz,
  remote_updated_at timestamptz,
  local_payload jsonb,
  remote_payload jsonb,
  applied_payload jsonb,
  note text,
  created_at timestamptz not null default now()
);
alter table public.sync_audit enable row level security;
create policy "own sync audit" on public.sync_audit for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists sync_audit_user_created_idx on public.sync_audit(user_id, created_at desc);

-- updated_at columns to enable LWW conflict resolution on main entities
alter table public.customers add column if not exists updated_at timestamptz not null default now();
alter table public.products  add column if not exists updated_at timestamptz not null default now();
alter table public.quotes    add column if not exists updated_at timestamptz not null default now();
alter table public.orders    add column if not exists updated_at timestamptz not null default now();
alter table public.payments  add column if not exists updated_at timestamptz not null default now();

-- generic touch trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array['customers','products','quotes','orders','payments'] loop
    execute format('drop trigger if exists trg_touch_%I on public.%I', t, t);
    execute format('create trigger trg_touch_%I before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;