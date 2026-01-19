-- ====================================================================
-- SCRIPT DE CORREÇÃO E LIMPEZA (RODE ESTE PRIMEIRO)
-- ====================================================================

-- 1. Remover triggers antigos para evitar conflitos
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- 2. Garantir que a tabela profiles existe e tem as colunas certas
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text default 'user',
  two_factor_enabled boolean default false,
  updated_at timestamp with time zone default now()
);

-- 3. Adicionar coluna role caso ela não exista (Correção do erro 42703)
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name='profiles' and column_name='role') then
        alter table public.profiles add column role text default 'user';
    end if;
end $$;

-- 4. Recriar a função de gatilho com a estrutura estável
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', ''), 
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 5. Recriar o gatilho
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Habilitar RLS e criar políticas de acesso
alter table public.profiles enable row level security;

drop policy if exists "Profiles: leitura própria" on public.profiles;
create policy "Profiles: leitura própria" on public.profiles 
for select using (auth.uid() = id);

drop policy if exists "Profiles: update próprio" on public.profiles;
create policy "Profiles: update próprio" on public.profiles 
for update using (auth.uid() = id);

-- ====================================================================
-- AGORA CONTINUE COM AS OUTRAS TABELAS (Caso ainda não existam)
-- ====================================================================

create table if not exists public.pipelines (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  created_at timestamp with time zone default now()
);

create table if not exists public.stages (
  id uuid default gen_random_uuid() primary key,
  pipeline_id uuid references public.pipelines(id) on delete cascade,
  name text not null,
  slug text not null,
  position integer not null,
  probability integer default 0,
  created_at timestamp with time zone default now()
);

create table if not exists public.opportunities (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  pipeline_id uuid references public.pipelines(id),
  stage_id uuid references public.stages(id),
  owner_id uuid references public.profiles(id),
  amount_estimated decimal(12,2) default 0,
  priority text default 'medium',
  briefing jsonb default '{}',
  measurement_data jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Adicionar dados iniciais
insert into public.pipelines (name, slug) values ('Comercial', 'commercial'), ('Entrega', 'delivery') on conflict (slug) do nothing;
