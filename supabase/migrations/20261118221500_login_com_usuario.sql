-- Permite login com nome de usuário além de e-mail.
create table if not exists public.perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now(),
  constraint perfis_username_formato check (username ~ '^[a-z0-9_]{3,20}$')
);

alter table public.perfis enable row level security;

drop policy if exists "usuario_ve_proprio_perfil" on public.perfis;
create policy "usuario_ve_proprio_perfil"
on public.perfis for select
to authenticated
using ( (select auth.uid()) = user_id );

drop policy if exists "usuario_cria_proprio_perfil" on public.perfis;
create policy "usuario_cria_proprio_perfil"
on public.perfis for insert
to authenticated
with check ( (select auth.uid()) = user_id );

drop policy if exists "usuario_atualiza_proprio_perfil" on public.perfis;
create policy "usuario_atualiza_proprio_perfil"
on public.perfis for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );

-- Esquema privado (não exposto pela API) com controle de tentativas
-- de consulta de usuário, para a função resolver-login não virar uma
-- forma de "adivinhar" nomes de usuário cadastrados.
create schema if not exists privado;

create table if not exists privado.tentativas_consulta_usuario (
  chave text primary key,
  tentativas int not null default 1,
  janela_inicio timestamptz not null default now()
);
