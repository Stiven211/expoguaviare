-- Ejecutar en SQL Editor de un proyecto Supabase NUEVO.
-- No borra datos. Las restricciones vuelven a verificar la información en PostgreSQL.
create table public.solicitudes (
  id uuid primary key,
  creado_en timestamptz not null default now(),
  nombre text not null check (char_length(trim(nombre)) between 2 and 80),
  negocio text not null check (char_length(trim(negocio)) between 2 and 80),
  telefono text not null check (telefono ~ '^[0-9]{7,15}$'),
  sector text not null check (sector in ('turismo','comida','productos','servicios')),
  servicio text not null check (servicio in ('presentacion','catalogo','administrable','orientacion')),
  mensaje text not null default '' check (char_length(mensaje) <= 600),
  consentimiento boolean not null check (consentimiento = true),
  aviso_version text not null check (aviso_version = 'expoguaviare-v1')
);

-- RLS: activada y SIN políticas para visitantes. El navegador no puede leer ni escribir.
alter table public.solicitudes enable row level security;
revoke all on table public.solicitudes from anon, authenticated;
-- El backend usa una clave secreta asociada al rol service_role (omite RLS).
grant insert, select on table public.solicitudes to service_role;

comment on table public.solicitudes is 'Interesados del stand SENA Articulación con la media, Expoguaviare';
-- Administrar datos desde Supabase Table Editor con una cuenta autorizada.
-- No crear una política SELECT pública: expondría los teléfonos de los visitantes.
