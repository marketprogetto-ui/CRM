-- ==========================================
-- SCRIPT DE POPULAÇÃO COMPLETA (SEED)
-- ==========================================

-- 1. Limpeza para evitar duplicidade (Opcional, mas recomendado para resetar ordem)
delete from public.stages;
delete from public.pipelines;

-- 2. Inserir Pipelines
insert into public.pipelines (name, slug) values 
('Comercial', 'commercial'),
('Entrega', 'delivery');

-- 3. Inserir Etapas para o Pipeline Comercial
with comm as (select id from public.pipelines where slug = 'commercial' limit 1)
insert into public.stages (pipeline_id, name, slug, position, probability) values
((select id from comm), 'Prospecção', 'prospecting', 1, 10),
((select id from comm), 'Qualificação', 'qualification', 2, 20),
((select id from comm), 'Visita/Medição', 'visit', 3, 40),
((select id from comm), 'Proposta Enviada', 'proposal', 4, 60),
((select id from comm), 'Negociação', 'negotiation', 5, 80),
((select id from comm), 'Fechado (Ganho)', 'closed-won', 6, 100);

-- 4. Inserir Etapas para o Pipeline de Entrega
with deliv as (select id from public.pipelines where slug = 'delivery' limit 1)
insert into public.stages (pipeline_id, name, slug, position, probability) values
((select id from deliv), 'Aguardando Medição', 'waiting-measurement', 1, 0),
((select id from deliv), 'Agendamento', 'scheduling', 2, 0),
((select id from deliv), 'Em Produção', 'production', 3, 0),
((select id from deliv), 'Em Trânsito', 'transit', 4, 0),
((select id from deliv), 'Instalação', 'installation', 5, 0),
((select id from deliv), 'Finalizado', 'completed', 6, 100);

-- 5. Garantir que as políticas de segurança permitam a leitura
-- Pipelines
alter table public.pipelines enable row level security;
drop policy if exists "Pipelines: leitura autenticada" on public.pipelines;
create policy "Pipelines: leitura autenticada" on public.pipelines 
for select using (auth.role() = 'authenticated');

-- Etapas
alter table public.stages enable row level security;
drop policy if exists "Stages: leitura autenticada" on public.stages;
create policy "Stages: leitura autenticada" on public.stages 
for select using (auth.role() = 'authenticated');

-- Oportunidades
alter table public.opportunities enable row level security;
drop policy if exists "Opportunities: leitura autenticada" on public.opportunities;
create policy "Opportunities: leitura autenticada" on public.opportunities 
for select using (auth.role() = 'authenticated');
