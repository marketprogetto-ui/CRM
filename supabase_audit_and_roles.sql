-- ==========================================
-- SCRIPT DE ADMINISTRAÇÃO E AUDITORIA (LOGS)
-- ==========================================

-- 1. Tabela de Logs de Auditoria
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  table_name text not null,
  record_id uuid not null,
  action text not null, -- 'INSERT', 'UPDATE', 'DELETE'
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

-- 2. Habilitar RLS nos Logs (Apenas Admin vê)
alter table public.audit_logs enable row level security;
create policy "Apenas administradores podem ver logs" on public.audit_logs
  for select using (
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- 3. Função Genérica de Auditoria
create or replace function public.process_audit_log()
returns trigger as $$
begin
  if (TG_OP = 'DELETE') then
    insert into public.audit_logs (table_name, record_id, action, old_data, changed_by)
    values (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid());
    return OLD;
  elsif (TG_OP = 'UPDATE') then
    insert into public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    values (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    return NEW;
  elsif (TG_OP = 'INSERT') then
    insert into public.audit_logs (table_name, record_id, action, new_data, changed_by)
    values (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), auth.uid());
    return NEW;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- 4. Aplicar Auditoria nas tabelas principais
drop trigger if exists audit_opportunities on public.opportunities;
create trigger audit_opportunities after insert or update or delete on public.opportunities
for each row execute procedure public.process_audit_log();

drop trigger if exists audit_activities on public.activities;
create trigger audit_activities after insert or update or delete on public.activities
for each row execute procedure public.process_audit_log();

-- 5. REFINAMENTO DE RLS (Restrição de Exclusão)
-- Agora, usuários 'user' não podem deletar nada.

-- Oportunidades
drop policy if exists "Opportunities: full access" on public.opportunities;
create policy "Oportunidades: usuários podem ver" on public.opportunities for select using (auth.role() = 'authenticated');
create policy "Oportunidades: usuários podem inserir" on public.opportunities for insert with check (auth.role() = 'authenticated');
create policy "Oportunidades: usuários podem editar" on public.opportunities for update using (auth.role() = 'authenticated');
create policy "Oportunidades: APENAS ADMIN pode deletar" on public.opportunities 
  for delete using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Atividades
drop policy if exists "Activities: full access" on public.activities;
create policy "Atividades: usuários podem ver" on public.activities for select using (auth.role() = 'authenticated');
create policy "Atividades: usuários podem inserir" on public.activities for insert with check (auth.role() = 'authenticated');
create policy "Atividades: usuários podem editar" on public.activities for update using (auth.role() = 'authenticated');
create policy "Atividades: APENAS ADMIN pode deletar" on public.activities 
  for delete using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- 6. PRESERVAÇÃO DE DADOS (Foreign Keys)
-- Alterar as chaves estrangeiras para não deletar os dados quando o perfil for removido
alter table public.opportunities drop constraint if exists opportunities_owner_id_fkey;
alter table public.opportunities add constraint opportunities_owner_id_fkey 
  foreign key (owner_id) references public.profiles(id) on delete set null;

alter table public.activities drop constraint if exists activities_created_by_fkey;
alter table public.activities add constraint activities_created_by_fkey 
  foreign key (created_by) references public.profiles(id) on delete set null;

-- 7. Torne seu usuário atual um ADMIN (Execute isso manualmente se souber seu UUID)
-- update public.profiles set role = 'admin' where id = 'seu-uuid-aqui';
