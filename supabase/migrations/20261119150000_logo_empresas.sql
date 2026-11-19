-- Coluna opcional da logo, aplicada ao banco cardapio-ar.
alter table public.lojas add column if not exists logo_url text;
comment on column public.lojas.logo_url is 'URL pública da logomarca exibida ao lado do nome da empresa no cardápio';
