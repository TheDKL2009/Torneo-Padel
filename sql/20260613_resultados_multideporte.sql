-- =========================================================
-- RESULTADOS POR DEPORTE EN PARTIDOS
-- =========================================================
-- Fase 3 multideporte: añade goles/penaltis para futbol sala.
-- Mantiene los campos de sets para padel.

alter table public.partidos
    add column if not exists goles_a integer,
    add column if not exists goles_b integer,
    add column if not exists penaltis_a integer,
    add column if not exists penaltis_b integer,
    add column if not exists ganador_manual_id uuid;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'partidos_ganador_manual_fk'
          and conrelid = 'public.partidos'::regclass
    ) then
        alter table public.partidos
            add constraint partidos_ganador_manual_fk
            foreign key (ganador_manual_id)
            references public.parejas(id)
            on update cascade
            on delete set null;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'partidos_resultados_futbol_check'
          and conrelid = 'public.partidos'::regclass
    ) then
        alter table public.partidos
            add constraint partidos_resultados_futbol_check
            check (
                (goles_a is null or goles_a >= 0) and
                (goles_b is null or goles_b >= 0) and
                (penaltis_a is null or penaltis_a >= 0) and
                (penaltis_b is null or penaltis_b >= 0)
            );
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'partidos_ganador_manual_valido_check'
          and conrelid = 'public.partidos'::regclass
    ) then
        alter table public.partidos
            add constraint partidos_ganador_manual_valido_check
            check (
                ganador_manual_id is null
                or ganador_manual_id = pareja_a_id
                or ganador_manual_id = pareja_b_id
            );
    end if;
end $$;

create index if not exists idx_partidos_ganador_manual_id
    on public.partidos(ganador_manual_id);
