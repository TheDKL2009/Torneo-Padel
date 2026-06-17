-- =========================================================
-- CLASIFICACIONES POR DEPORTE
-- =========================================================
-- Fase 4 multideporte: añade estadisticas de futbol sala.
-- Mantiene estadisticas de sets/juegos para padel.

alter table public.clasificaciones_grupo
    add column if not exists partidos_empatados integer not null default 0,
    add column if not exists goles_favor integer not null default 0,
    add column if not exists goles_contra integer not null default 0,
    add column if not exists diferencia_goles integer not null default 0;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'clasificaciones_futbol_no_negativos_check'
          and conrelid = 'public.clasificaciones_grupo'::regclass
    ) then
        alter table public.clasificaciones_grupo
            add constraint clasificaciones_futbol_no_negativos_check
            check (
                partidos_empatados >= 0 and
                goles_favor >= 0 and
                goles_contra >= 0
            );
    end if;
end $$;
