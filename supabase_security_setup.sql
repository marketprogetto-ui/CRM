-- 1. Tabela de Perfis (Profiles)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  two_factor_enabled boolean default false,
  two_factor_verified boolean default false,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar RLS em Perfis
alter table public.profiles enable row level security;

-- Políticas de RLS para Perfis
create policy "Usuários podem ver seu próprio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Trigger para criar perfil automaticamente no SignUp
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

-- 2. Habilitar RLS nas tabelas existentes e adicionar políticas básicas
-- Pipelines
alter table public.pipelines enable row level security;
create policy "Qualquer usuário autenticado pode ver pipelines" on public.pipelines
  for select using (auth.role() = 'authenticated');

-- Etapas
alter table public.stages enable row level security;
create policy "Qualquer usuário autenticado pode ver etapas" on public.stages
  for select using (auth.role() = 'authenticated');

-- Oportunidades
alter table public.opportunities enable row level security;
create policy "Usuários podem ver oportunidades" on public.opportunities
  for select using (auth.role() = 'authenticated');

create policy "Usuários podem inserir oportunidades" on public.opportunities
  for insert with check (auth.role() = 'authenticated');

create policy "Usuários podem atualizar oportunidades" on public.opportunities
  for update using (auth.role() = 'authenticated');

-- Atividades
alter table public.activities enable row level security;
create policy "Usuários podem ver atividades" on public.activities
  for select using (auth.role() = 'authenticated');

create policy "Usuários podem inserir atividades" on public.activities
  for insert with check (auth.role() = 'authenticated');
