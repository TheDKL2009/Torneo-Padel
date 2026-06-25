-- Añade la columna "orden" a la tabla partidos para ordenar el bracket
ALTER TABLE partidos ADD COLUMN orden integer;

-- Índice para acelerar las consultas del bracket por categoría + ronda + posición
CREATE INDEX IF NOT EXISTS idx_partidos_bracket
  ON partidos (categoria_id, ronda, orden NULLS LAST);
