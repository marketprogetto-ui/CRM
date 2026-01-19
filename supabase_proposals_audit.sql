-- Refino de RLS para Propostas
drop policy if exists "Proposals: leitura autenticada" on public.proposals;
drop policy if exists "Proposals: full access" on public.proposals;

create policy "Propostas: ler" on public.proposals for select using (auth.role() = 'authenticated');
create policy "Propostas: criar" on public.proposals for insert with check (auth.role() = 'authenticated');
create policy "Propostas: editar" on public.proposals for update using (auth.role() = 'authenticated');
create policy "Propostas: APENAS ADMIN deleta" on public.proposals 
  for delete using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- Auditoria para Propostas
drop trigger if exists audit_proposals on public.proposals;
create trigger audit_proposals after insert or update or delete on public.proposals
for each row execute procedure public.process_audit_log();
