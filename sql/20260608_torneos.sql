-- =========================================================
-- SOPORTE MULTI-TORNEO - SUPABASE
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists public.torneos (
    id uuid primary key default gen_random_uuid(),
    nombre text not null,
    temporada text,
    descripcion text,
    sede text,
    fecha_inicio date,
    fecha_fin date,
    estado text not null default 'borrador',
    activo boolean not null default true,
    destacado boolean not null default false,
    created_at timestamptz not null default now(),

    constraint torneos_nombre_check check (length(trim(nombre)) > 0),
    constraint torneos_estado_check check (
        estado in ('borrador', 'inscripciones', 'en_curso', 'finalizado', 'cancelado')
    )
);

insert into public.torneos (nombre, descripcion, estado, activo, destacado)
select 'Torneo principal', 'Torneo creado automaticamente para migrar los datos existentes.', 'en_curso', true, true
where not exists (select 1 from public.torneos);

alter table public.categorias
    add column if not exists torneo_id uuid;

update public.categorias
set torneo_id = (select id from public.torneos order by destacado desc, created_at asc limit 1)
where torneo_id is null;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'categorias_torneo_fk'
          and conrelid = 'public.categorias'::regclass
    ) then
        alter table public.categorias
            add constraint categorias_torneo_fk
            foreign key (torneo_id)
            references public.torneos(id)
            on update cascade
            on delete cascade;
    end if;
end $$;

alter table public.categorias
    alter column torneo_id set not null;

alter table public.patrocinadores
    add column if not exists torneo_id uuid;

update public.patrocinadores
set torneo_id = (select id from public.torneos order by destacado desc, created_at asc limit 1)
where torneo_id is null;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'patrocinadores_torneo_fk'
          and conrelid = 'public.patrocinadores'::regclass
    ) then
        alter table public.patrocinadores
            add constraint patrocinadores_torneo_fk
            foreign key (torneo_id)
            references public.torneos(id)
            on update cascade
            on delete cascade;
    end if;
end $$;

create unique index if not exists idx_torneos_destacado_unico
    on public.torneos(destacado)
    where destacado = true;

create index if not exists idx_torneos_estado on public.torneos(estado);
create index if not exists idx_torneos_activo on public.torneos(activo);
create index if not exists idx_torneos_destacado on public.torneos(destacado);
create index if not exists idx_categorias_torneo_id on public.categorias(torneo_id);
create index if not exists idx_patrocinadores_torneo_id on public.patrocinadores(torneo_id);

alter table public.torneos enable row level security;

drop policy if exists "Lectura publica torneos activos" on public.torneos;
create policy "Lectura publica torneos activos"
on public.torneos
for select
to anon, authenticated
using (activo = true);

drop policy if exists "Gestion torneos autenticados" on public.torneos;
create policy "Gestion torneos autenticados"
on public.torneos
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Lectura publica categorias activas" on public.categorias;
create policy "Lectura publica categorias activas"
on public.categorias
for select
to anon, authenticated
using (
    activo = true
    and exists (
        select 1
        from public.torneos t
        where t.id = categorias.torneo_id
          and t.activo = true
    )
);

drop policy if exists "Lectura publica parejas activas" on public.parejas;
create policy "Lectura publica parejas activas"
on public.parejas
for select
to anon, authenticated
using (
    activo = true
    and exists (
        select 1
        from public.categorias c
        join public.torneos t on t.id = c.torneo_id
        where c.id = parejas.categoria_id
          and c.activo = true
          and t.activo = true
    )
);

drop policy if exists "Lectura publica partidos categorias activas" on public.partidos;
create policy "Lectura publica partidos categorias activas"
on public.partidos
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.categorias c
        join public.torneos t on t.id = c.torneo_id
        where c.id = partidos.categoria_id
          and c.activo = true
          and t.activo = true
    )
);

drop policy if exists "Lectura publica patrocinadores activos" on public.patrocinadores;
create policy "Lectura publica patrocinadores activos"
on public.patrocinadores
for select
to anon, authenticated
using (
    activo = true
    and exists (
        select 1
        from public.torneos t
        where t.id = patrocinadores.torneo_id
          and t.activo = true
    )
);

drop policy if exists "Lectura publica grupos categorias activas" on public.grupos;
create policy "Lectura publica grupos categorias activas"
on public.grupos
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.categorias c
        join public.torneos t on t.id = c.torneo_id
        where c.id = grupos.categoria_id
          and c.activo = true
          and t.activo = true
    )
);

drop policy if exists "Lectura publica grupo parejas categorias activas" on public.grupo_parejas;
create policy "Lectura publica grupo parejas categorias activas"
on public.grupo_parejas
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.grupos g
        join public.categorias c on c.id = g.categoria_id
        join public.torneos t on t.id = c.torneo_id
        where g.id = grupo_parejas.grupo_id
          and c.activo = true
          and t.activo = true
    )
);

drop policy if exists "Lectura publica clasificaciones categorias activas" on public.clasificaciones_grupo;
create policy "Lectura publica clasificaciones categorias activas"
on public.clasificaciones_grupo
for select
to anon, authenticated
using (
    exists (
        select 1
        from public.grupos g
        join public.categorias c on c.id = g.categoria_id
        join public.torneos t on t.id = c.torneo_id
        where g.id = clasificaciones_grupo.grupo_id
          and c.activo = true
          and t.activo = true
    )
);
