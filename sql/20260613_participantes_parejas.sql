-- =========================================================
-- PARTICIPANTES SOBRE TABLA PAREJAS
-- =========================================================
-- Fase 2 multideporte: mantiene public.parejas por compatibilidad.
-- No toca partidos, grupos, cuadros, clasificaciones ni auth.

alter table public.parejas
    add column if not exists tipo_participante text not null default 'pareja',
    add column if not exists nombre text,
    add column if not exists nombre_equipo text,
    add column if not exists contacto text;

update public.parejas
set
    tipo_participante = coalesce(nullif(tipo_participante, ''), 'pareja'),
    nombre = coalesce(nullif(nombre, ''), trim(jugador_1 || ' / ' || jugador_2))
where tipo_participante is null
   or tipo_participante = ''
   or nombre is null
   or nombre = '';

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'parejas_tipo_participante_check'
          and conrelid = 'public.parejas'::regclass
    ) then
        alter table public.parejas
            add constraint parejas_tipo_participante_check
            check (tipo_participante in ('pareja', 'equipo'));
    end if;
end $$;

create index if not exists idx_parejas_tipo_participante
    on public.parejas(tipo_participante);
