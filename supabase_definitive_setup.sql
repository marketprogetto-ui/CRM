-- ==========================================
-- 1. ESTRUTURA BASE (Tabelas de Negócio)
-- ==========================================

-- Pipelines
create table if not exists public.pipelines (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  created_at timestamp with time zone default now()
);

-- Etapas (Stages)
create table if not exists public.stages (
  id uuid default gen_random_uuid() primary key,
  pipeline_id uuid references public.pipelines(id) on delete cascade,
  name text not null,
  slug text not null,
  position integer not null,
  probability integer default 0,
  created_at timestamp with time zone default now()
);

-- Perfis de Usuário (Profiles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text default 'user',
  two_factor_enabled boolean default false,
  updated_at timestamp with time zone default now()
);

-- Oportunidades
create table if not exists public.opportunities (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  pipeline_id uuid references public.pipelines(id),
  stage_id uuid references public.stages(id),
  owner_id uuid references public.profiles(id),
  amount_estimated decimal(12,2) default 0,
  amount_offered decimal(12,2) default 0,
  amount_final decimal(12,2) default 0,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  briefing jsonb default '{}',
  measurement_data jsonb default '{}',
  origin_opportunity_id uuid references public.opportunities(id),
  created_at timestamp with time zone default now()
);

-- Atividades
create table if not exists public.activities (
  id uuid default gen_random_uuid() primary key,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  title text not null,
  type text check (type in ('call', 'meeting', 'email', 'site_visit', 'other')),
  due_at timestamp with time zone not null,
  done_at timestamp with time zone,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- Propostas
create table if not exists public.proposals (
  id uuid default gen_random_uuid() primary key,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  version integer not null,
  status text default 'draft',
  total_amount decimal(12,2) default 0,
  valid_until timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- ==========================================
-- 2. SEGURANÇA (RLS e Políticas)
-- ==========================================

-- Habilitar RLS em tudo
alter table public.pipelines enable row level security;
alter table public.stages enable row level security;
alter table public.profiles enable row level security;
alter table public.opportunities enable row level security;
alter table public.activities enable row level security;
alter table public.proposals enable row level security;

-- Políticas de Select (Leitura)
create policy "Pipelines: leitura autenticada" on public.pipelines for select using (auth.role() = 'authenticated');
create policy "Stages: leitura autenticada" on public.stages for select using (auth.role() = 'authenticated');
create policy "Profiles: leitura própria ou admin" on public.profiles for select using (auth.uid() = id or (select role from public.profiles where id = auth.uid()) = 'admin');
create policy "Opportunities: leitura autenticada" on public.opportunities for select using (auth.role() = 'authenticated');
create policy "Activities: leitura autenticada" on public.activities for select using (auth.role() = 'authenticated');
create policy "Proposals: leitura autenticada" on public.proposals for select using (auth.role() = 'authenticated');

-- Políticas de Insert/Update/Delete (Escrita)
create policy "Profiles: update próprio" on public.profiles for update using (auth.uid() = id);
create policy "Opportunities: full access" on public.opportunities for all using (auth.role() = 'authenticated');
create policy "Activities: full access" on public.activities for all using (auth.role() = 'authenticated');
create policy "Proposals: full access" on public.proposals for all using (auth.role() = 'authenticated');

-- ==========================================
-- 3. AUTOMAÇÃO (Triggers)
-- ==========================================

-- Criar perfil automaticamente no cadastro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==========================================
-- 4. DADOS INICIAIS (Semente)
-- ==========================================

insert into public.pipelines (name, slug) values 
('Comercial', 'commercial'),
('Entrega', 'delivery')
on conflict (slug) do nothing;

with comm as (select id from public.pipelines where slug = 'commercial' limit 1)
insert into public.stages (pipeline_id, name, slug, position, probability) values
((select id from comm), 'Prospecção', 'prospecting', 1, 10),
((select id from comm), 'Qualificação', 'qualification', 2, 20),
((select id from comm), 'Visita/Medição', 'visit', 3, 40),
((select id from comm), 'Proposta Sent', 'proposal', 4, 60),
((select id from comm), 'Negociação', 'negotiation', 5, 80),
((select id from comm), 'Fechado (Ganho)', 'closed-won', 6, 100)
on conflict do nothing;

with deliv as (select id from public.pipelines where slug = 'delivery' limit 1)
insert into public.stages (pipeline_id, name, slug, position, probability) values
((select id from deliv), 'Aguardando Medição', 'waiting-measurement', 1, 0),
((select id from deliv), 'Em Produção', 'production', 2, 0),
((select id from deliv), 'Em Trânsito', 'transit', 3, 0),
((select id from deliv), 'Instalação', 'installation', 4, 0),
((select id from deliv), 'Finalizado', 'completed', 5, 100)
on conflict do nothing;
