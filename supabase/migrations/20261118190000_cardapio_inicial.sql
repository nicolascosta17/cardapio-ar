-- Já aplicada no projeto Supabase "cardapio-ar" (lqychiytrudrqroeljan).
-- Guardada aqui como registro/backup do esquema.

create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
create policy "admin ve o proprio registro" on public.admins
  for select to authenticated using ((select auth.uid()) = user_id);
grant select on public.admins to authenticated;

create table public.pratos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  preco numeric(10,2) not null default 0 check (preco >= 0),
  categoria text not null default 'Pratos',
  imagem_url text,
  modelo_glb_url text,
  modelo_usdz_url text,
  ativo boolean not null default true,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pratos_ativo_ordem_idx on public.pratos (ativo, categoria, ordem);
alter table public.pratos enable row level security;

create policy "todos veem pratos ativos" on public.pratos
  for select to anon, authenticated
  using (ativo or exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy "admins inserem pratos" on public.pratos
  for insert to authenticated
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy "admins editam pratos" on public.pratos
  for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy "admins apagam pratos" on public.pratos
  for delete to authenticated
  using (exists (select 1 from public.admins a where a.user_id = (select auth.uid())));

grant select on public.pratos to anon, authenticated;
grant insert, update, delete on public.pratos to authenticated;

create or replace function public.set_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger pratos_updated_at before update on public.pratos
  for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit)
values ('cardapio', 'cardapio', true, 52428800)
on conflict (id) do nothing;

create policy "admins enviam arquivos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'cardapio' and exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy "admins leem arquivos" on storage.objects
  for select to authenticated
  using (bucket_id = 'cardapio' and exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy "admins atualizam arquivos" on storage.objects
  for update to authenticated
  using (bucket_id = 'cardapio' and exists (select 1 from public.admins a where a.user_id = (select auth.uid())))
  with check (bucket_id = 'cardapio' and exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
create policy "admins apagam arquivos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'cardapio' and exists (select 1 from public.admins a where a.user_id = (select auth.uid())));
