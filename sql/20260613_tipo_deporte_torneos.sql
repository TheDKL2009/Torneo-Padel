-- =========================================================
-- TIPO DE DEPORTE POR TORNEO
-- =========================================================
-- Fase 1 multideporte: solo etiqueta el deporte del torneo.
-- No toca participantes, partidos, grupos, cuadros, clasificaciones ni auth.

alter table public.torneos
    add column if not exists tipo_deporte text not null default 'padel';

update public.torneos
set tipo_deporte = 'padel'
where tipo_deporte is null
   or tipo_deporte = '';

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'torneos_tipo_deporte_check'
          and conrelid = 'public.torneos'::regclass
    ) then
        alter table public.torneos
            add constraint torneos_tipo_deporte_check
            check (tipo_deporte in ('padel', 'futbol_sala'));
    end if;
end $$;

create index if not exists idx_torneos_tipo_deporte
    on public.torneos(tipo_deporte);
